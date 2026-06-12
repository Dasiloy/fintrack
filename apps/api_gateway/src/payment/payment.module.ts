import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { PaystackService } from '@fintrack/common/services/paystack.service';
import {
  FCM_NOTIFICATION_QUEUE,
  PAYMENT_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { EncryptionService } from '@fintrack/common/services/encryption.service';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { UsageModule } from '../usage/usage.module';
import { FetcherService } from '@fintrack/common/services/fetcher.service';

@Module({
  controllers: [PaymentController],
  providers: [
    EncryptionService,
    FetcherService,
    PaystackService,
    PaymentService,
  ],
  imports: [
    BullModule.registerQueue(
      {
        name: PAYMENT_QUEUE,
      },
      {
        name: FCM_NOTIFICATION_QUEUE,
      },
    ),

    UsageModule,
  ],
})
export class PaymentModule {}
