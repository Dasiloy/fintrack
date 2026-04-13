import { Module } from '@nestjs/common';

import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { UsageModule } from '../usage/usage.module';

/**
 * Module responsible for managing user budgets
 * Handles HTTP requests for CRUD operations on budgets
 * Forwards requests to the Budget microservice
 *
 * @class BudgetModule
 */
@Module({
  imports: [UsageModule],
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}
