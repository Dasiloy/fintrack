import { Injectable } from '@nestjs/common';

/**
 * Root service for the Finance microservice.
 * Provides a basic health-check stub; domain logic is delegated to
 * TransactionService, BudgetService, GoalService, SplitService, and RecurringService.
 *
 * @class FinanceService
 */
@Injectable()
export class FinanceService {
  /**
   * @description Returns a simple greeting used as a health-check probe.
   *
   * @public
   * @returns {string} Greeting string
   */
  getHello(): string {
    return 'Hello World!';
  }
}
