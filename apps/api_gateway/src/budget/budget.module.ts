import { forwardRef, Module } from '@nestjs/common';

import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { UsageModule } from '../usage/usage.module';
import { TransactionModule } from '../transaction/transaction.module';

/**
 * Module responsible for managing user budgets
 * Handles HTTP requests for CRUD operations on budgets
 * Forwards requests to the Budget microservice
 *
 * @class BudgetModule
 */
@Module({
  imports: [UsageModule, forwardRef(() => TransactionModule)],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}
