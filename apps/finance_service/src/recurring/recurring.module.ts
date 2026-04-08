import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import {
  ACTIVITY_NOTIFICATION_QUEUE,
  ANALYTICS_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { RecurringService } from './recurring.service';
import { RecurringController } from './recurring.controller';
import { UtilsService } from '../utils.service';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: ACTIVITY_NOTIFICATION_QUEUE },
      { name: ANALYTICS_NOTIFICATION_QUEUE },
    ),
    TransactionModule,
  ],
  controllers: [RecurringController],
  providers: [RecurringService, UtilsService],
})
export class RecurringModule {}
