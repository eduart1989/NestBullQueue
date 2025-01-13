import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
import {
  GENERATE_PDF,
  DEFAULT_QUEUE_OPTIONS,
  BULL_CONFIG_SETTINGS,
} from 'src/constants';
import { QueueConsumerModule } from 'src/consumers/queueConsumer.module';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
      ) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    // Register specific pdf queue
    BullModule.registerQueue({
      name: GENERATE_PDF,
      defaultJobOptions: DEFAULT_QUEUE_OPTIONS,
      settings: BULL_CONFIG_SETTINGS,
    }),
    QueueConsumerModule,
  ],
  exports: [BullModule],
})
export class QueueModule {}
