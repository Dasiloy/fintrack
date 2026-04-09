import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import {
  ACTIVITY_NOTIFICATION_QUEUE,
  ANALYTICS_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { UtilsService } from '../utils.service';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: ACTIVITY_NOTIFICATION_QUEUE,
      },
      {
        name: ANALYTICS_NOTIFICATION_QUEUE,
      },
    ),
  ],
  controllers: [BudgetController],
  providers: [BudgetService, UtilsService],
})
export class BudgetModule {}
