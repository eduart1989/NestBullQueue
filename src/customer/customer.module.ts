import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { QueueModule } from '../../src/queue/queue.module';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService],
  imports: [QueueModule],
})
export class CustomerModule {}
