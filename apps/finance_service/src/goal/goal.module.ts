import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import {
  ACTIVITY_NOTIFICATION_QUEUE,
  ANALYTICS_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: ACTIVITY_NOTIFICATION_QUEUE },
      { name: ANALYTICS_NOTIFICATION_QUEUE },
    ),
    TransactionModule,
  ],
  controllers: [GoalController],
  providers: [GoalService],
})
export class GoalModule {}
