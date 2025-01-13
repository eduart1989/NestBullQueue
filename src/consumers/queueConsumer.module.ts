import { Module } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { GeneratePdfProcessor } from './generatePdf.processor';
import { PdfGenerationService } from './services/PdfGeneration.service';
import { InvoiceTransformerService } from './services/InvoiceTransform.service';
import { FileManagementService } from './services/File.service';
import { DelayService } from './services/Delay.service';
import { ActivityLogService } from './services/ActivityLog.service';
import { BullModule } from '@nestjs/bull';
import {
  BULL_CONFIG_SETTINGS,
  SEND_EMAIL,
  SEND_EMAIL_QUEUE_OPTIONS,
} from 'src/constants';
import { SendEmailProcessor } from './sendEmail.processor';

@Module({
  imports: [
    // Register the send email queue
    BullModule.registerQueue({
      name: SEND_EMAIL,
      defaultJobOptions: SEND_EMAIL_QUEUE_OPTIONS,
      settings: BULL_CONFIG_SETTINGS,
    }),
  ],
  providers: [
    ActivityLogService,
    PdfGenerationService,
    InvoiceTransformerService,
    FileManagementService,
    DelayService,
    {
      provide: Logger,
      useFactory: () =>
        new Logger(GeneratePdfProcessor.name),
    },
    GeneratePdfProcessor,
    SendEmailProcessor,
  ],
  exports: [
    PdfGenerationService,
    ActivityLogService,
    InvoiceTransformerService,
    FileManagementService,
    DelayService,
    GeneratePdfProcessor,
    SendEmailProcessor,
  ],
})
export class QueueConsumerModule {}
