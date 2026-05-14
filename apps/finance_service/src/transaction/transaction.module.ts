import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { PaginateService } from '@fintrack/common/services/paginate.service';
import {
  ACTIVITY_NOTIFICATION_QUEUE,
  ANALYTICS_NOTIFICATION_QUEUE,
  BUDGET_CHECK_QUEUE,
  CLASSIFICATION_CORRECTION_QUEUE,
  FCM_NOTIFICATION_QUEUE,
  TOKEN_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { BudgetCheckProcessor } from './budget_check.processor';
import { UtilsService } from '../utils.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: ACTIVITY_NOTIFICATION_QUEUE },
      { name: FCM_NOTIFICATION_QUEUE },
      { name: ANALYTICS_NOTIFICATION_QUEUE },
      { name: CLASSIFICATION_CORRECTION_QUEUE },
      { name: TOKEN_NOTIFICATION_QUEUE },
      { name: BUDGET_CHECK_QUEUE },
    ),
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    BudgetCheckProcessor,
    PaginateService,
    UtilsService,
  ],
  exports: [TransactionService],
})
export class TransactionModule {}
