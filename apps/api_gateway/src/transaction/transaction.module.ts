import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { OCR_QUEUE } from '@fintrack/types/constants/queus.constants';

import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { BudgetModule } from '../budget/budget.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: OCR_QUEUE,
    }),
    forwardRef(() => BudgetModule),
    UsageModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
