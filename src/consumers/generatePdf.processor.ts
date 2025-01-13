import {
  InjectQueue,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import {
  GENERATE_PDF,
  PROCESS_CONCURRENCY,
  SEND_EMAIL,
} from '../../src/constants';
import {
  Order,
  Customer,
  ActivityStage,
  ActivityStatus,
} from '@prisma/client';
import { ActivityLogService } from '../../src/consumers/services/ActivityLog.service';
import { PdfGenerationService } from '../../src/consumers/services/PdfGeneration.service';
import { InvoiceTransformerService } from '../../src/consumers/services/InvoiceTransform.service';
import {
  FileManagementService,
  INVOICE_CONSTANTS,
} from '../../src/consumers/services/File.service';
import { DelayService } from '../../src/consumers/services/Delay.service';

export interface OrderData {
  order: Omit<Order, 'products'> & {
    products: Array<{
      name: string;
      price: number;
      barcode: string;
      description: string;
    }>;
  };
  customer: Customer;
}

export interface InvoiceResult {
  invoicePath: string;
  invoiceFileName: string;
}

@Processor(GENERATE_PDF)
export class GeneratePdfProcessor {
  constructor(
    private readonly logger: Logger,
    private readonly invoiceTransformer: InvoiceTransformerService,
    private readonly fileManagement: FileManagementService,
    private readonly pdfGenerator: PdfGenerationService,
    private readonly delayService: DelayService,
    private readonly activityLogService: ActivityLogService,
    @InjectQueue(SEND_EMAIL)
    private readonly sendEmailQueue: Queue,
  ) {
    this.fileManagement.ensureDirectoryExists(
      INVOICE_CONSTANTS.DIRECTORY,
    );
  }

  async sendEmail(
    customerData: Customer,
    orderData: Order,
    activityLogId: number,
    invoicePath: string,
  ) {
    return await this.sendEmailQueue.add({
      customerData,
      orderData,
      activityLogId,
      invoicePath,
    });
  }

  @Process({
    concurrency: PROCESS_CONCURRENCY,
  })
  async generatePdf(
    job: Job<OrderData>,
  ): Promise<InvoiceResult> {
    const { id: activityLogId } =
      await this.activityLogService.createInitialActivityLog(
        job.data,
      );
    try {
      // Log job start
      this.logJobStart(job);
      this.logger.debug(
        `job data: ${JSON.stringify(job)}`,
      );

      // Artificial delay for demonstration (remove in production)
      await this.delayService.delay();

      // Transform order data to invoice format
      const invoiceData =
        this.invoiceTransformer.transform(
          job.data,
        );

      // Generate invoice filename and path
      const invoiceFileName =
        this.fileManagement.generateInvoiceFileName(
          job.data.order.id,
        );
      const invoicePath =
        this.fileManagement.getInvoicePath(
          invoiceFileName,
        );
      await this.activityLogService.updateActivityLogStage(
        activityLogId,
        ActivityStatus.IN_PROGRESS,
        ActivityStage.PDF_GENERATION,
        {
          attempts: job.attemptsMade,
          processorId: `job-id-${job.id}`,
        },
      );
      // Generate PDF
      const generatedPdfPath =
        await this.createPdfInvoice(
          invoiceData,
          invoicePath,
        );

      await this.activityLogService.updateActivityLogStage(
        activityLogId,
        ActivityStatus.IN_PROGRESS,
        ActivityStage.FILE_STORING,
        {
          filePath: generatedPdfPath,
        },
      );

      const invoiceResult =
        await this.createInvoiceResult(
          generatedPdfPath,
          invoiceFileName,
        );

      await this.sendEmail(
        job.data.customer,
        job.data.order,
        activityLogId,
        generatedPdfPath,
      );

      return invoiceResult;
    } catch (error) {
      await this.activityLogService.updateActivityLogStage(
        activityLogId,
        ActivityStatus.FAILED,
        ActivityStage.PDF_GENERATION,
        {
          errorMessage: error.message,
          attempts: job.attemptsMade,
          processorId: `job-id-${job.id}`,
        },
      );
      return this.handleError(error);
    }
  }

  private async createPdfInvoice(
    invoiceData: Record<string, any>,
    invoicePath: string,
  ): Promise<string> {
    return this.pdfGenerator.generatePdf(
      invoiceData,
      invoicePath,
      INVOICE_CONSTANTS.PDF_OPTIONS,
    );
  }

  private createInvoiceResult(
    invoicePath: string,
    invoiceFileName: string,
  ): InvoiceResult {
    this.logger.log(
      `Invoice generated: ${invoiceFileName}`,
    );
    return { invoicePath, invoiceFileName };
  }

  private logJobStart(job: Job<OrderData>): void {
    this.logger.log(
      `Processing job ${job.id}...`,
    );
    this.logger.debug(
      `Job data: ${JSON.stringify(job.data)}`,
    );
  }

  private handleError(error: Error): never {
    this.logger.error(
      `PDF generation failed: ${error.message}`,
    );
    throw error;
  }

  @OnQueueCompleted()
  async onCompleted(
    job: Job,
    result: InvoiceResult,
  ) {
    this.logger.log(
      `Job ${job.id} completed. Invoice: ${result.invoiceFileName}`,
    );
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} failed: ${error.message}`,
    );
  }
}
