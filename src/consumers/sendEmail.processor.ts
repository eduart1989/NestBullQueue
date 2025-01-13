import {
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import {
  PROCESS_CONCURRENCY,
  SEND_EMAIL,
} from 'src/constants';
import { ActivityLogService } from './services/ActivityLog.service';
import {
  ActivityStage,
  ActivityStatus,
  OrderStatus,
} from '@prisma/client';
import { CustomerService } from 'src/customer/customer.service';
import { PrismaService } from 'src/prisma/prisma.service';

export interface EmailJobData {
  invoicePath: string;

  customerData: {
    id: number;
    email: string;
    name: string;
  };
  orderData: any;
  activityLogId: number;
}

@Processor(SEND_EMAIL)
export class SendEmailProcessor {
  constructor(
    private readonly logger: Logger,
    private readonly activityLogService: ActivityLogService, // Inject email service
    private readonly prisma: PrismaService,
  ) {}

  @Process({
    concurrency: PROCESS_CONCURRENCY,
  })
  async sendEmail(job: Job<EmailJobData>) {
    try {
      this.logger.log(
        `Processing email job for ${job.data.customerData.email}`,
      );

      // Update activity log
      await this.activityLogService.updateActivityLogStage(
        job.data.activityLogId,
        ActivityStatus.IN_PROGRESS,
        ActivityStage.EMAIL_INITIATED,
        {
          attempts: job.attemptsMade,
          processorId: `job-id-${job.id}`,
        },
      );

      // Generate email template
      const emailTemplate =
        this.generateEmailTemplate(job.data);

      // Send email (you'll need to implement this)
      await this.sendEmailWithAttachment(
        job.data.customerData.email,
        emailTemplate,
        job.data.invoicePath,
      );
      console.log(
        job.data.activityLogId,
        ActivityStatus.COMPLETED,
        ActivityStage.EMAIL_SENT,
        {
          attempts: job.attemptsMade,
          processorId: `job-id-${job.id}`,
        },
      );
      await this.activityLogService.updateActivityLogStage(
        job.data.activityLogId,
        ActivityStatus.COMPLETED,
        ActivityStage.EMAIL_SENT,
        {
          attempts: job.attemptsMade,
          processorId: `job-id-${job.id}`,
        },
      );

      await this.prisma.order.update({
        where: { id: job.data.orderData.id },
        data: { status: OrderStatus.invoiced },
      });

      return {
        status: 'sent',
        email: job.data.customerData.email,
      };
    } catch (error) {
      this.logger.error(
        `Email sending failed: ${error.message}`,
      );
      await this.activityLogService.updateActivityLogStage(
        job.data.activityLogId,
        ActivityStatus.FAILED,
        ActivityStage.EMAIL_SENT,
        {
          errorMessage: error.message,
          attempts: job.attemptsMade,
          processorId: `job-id-${job.id}`,
        },
      );
      throw error;
    }
  }

  private generateEmailTemplate(
    data: EmailJobData,
  ): string {
    const { customerData, orderData } = data;

    return `
        <!DOCTYPE html>
        <html>
        <body>
          <h1>Invoice for Your Order</h1>
          <p>Dear ${customerData.name},</p>
          <p>Thank you for your order. Please find the invoice attached.</p>
          <h2>Order Details:</h2>
          <ul>
            <li>Order ID: ${orderData.id}</li>
            <li>Total Amount: $${
              orderData.totalAmount
            }</li>
            <li>Order Date: ${new Date(
              orderData.createdAt,
            ).toLocaleDateString()}</li>
          </ul>
          <p>Best regards,<br>Your Company Name</p>
        </body>
        </html>
      `;
  }

  private async sendEmailWithAttachment(
    email: string,
    htmlContent: string,
    attachmentPath: string,
  ) {
    // Implement email sending logic
    // You can use a service like Nodemailer, SendGrid, etc.
    // Example with Nodemailer:
    /*
      const transporter = nodemailer.createTransport({
        // Configure your email service
      });
  
      await transporter.sendMail({
        from: 'your-email@example.com',
        to: email,
        subject: 'Invoice for Your Order',
        html: htmlContent,
        attachments: [{
          filename: 'invoice.pdf',
          path: attachmentPath
        }]
      });
      */
    console.log(`Sending email to ${email}`);
  }

  @OnQueueCompleted()
  async onCompleted(job: Job) {
    this.logger.log(
      `Email job ${job.id} completed. Sent to: ${job.data.customerData.email}`,
    );
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    this.logger.error(
      `Email job ${job.id} failed: ${error.message}`,
    );
  }
}
