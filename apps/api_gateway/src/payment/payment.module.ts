import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PAYMENT_QUEUE } from '@fintrack/types/constants/queus.constants';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
  imports: [
    BullModule.registerQueue({
      name: PAYMENT_QUEUE,
    }),
  ],
})
export class PaymentModule {}
