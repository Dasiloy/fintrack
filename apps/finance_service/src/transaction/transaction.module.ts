import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { PaginateService } from '@fintrack/common/services/paginate.service';
import {
  ACTIVITY_NOTIFICATION_QUEUE,
  FCM_NOTIFICATION_QUEUE,
  ANALYTICS_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { UtilsService } from '../utils.service';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: ACTIVITY_NOTIFICATION_QUEUE,
      },
      {
        name: FCM_NOTIFICATION_QUEUE,
      },
      {
        name: ANALYTICS_NOTIFICATION_QUEUE,
      },
    ),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, PaginateService, UtilsService],
  exports: [TransactionService],
})
export class TransactionModule {}
