import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import {
  FINANCE_SERVICE_NAME,
  FinanceBoard,
  FinanceBoardHistory,
} from '@fintrack/types/protos/finance/finance';
import { RpcUser } from '@fintrack/common/decorators/rpc_user.decorator';
import { User } from '@fintrack/database/types';

import { FinnaceService } from './finnace.service';

/**
 * gRPC controller for the Financial Health Score board, exposed on
 * `FinanceService`.
 *
 * ## Auth
 * Protected by `RpcAuthGuard` (applied at the module level). The authenticated
 * user is injected via `@RpcUser()`.
 *
 * ## gRPC surface
 * | Method                  | Request | Response             |
 * |-------------------------|---------|----------------------|
 * | getFinanceBoard         | Empty   | FinanceBoard         |
 * | getFinanceBoardHistory  | Empty   | FinanceBoardHistory  |
 *
 * Proto: `packages/types/proto/finance/finance.proto`
 *
 * @class FinanceController
 */
@Controller()
export class FinanceController {
  constructor(private readonly finnaceService: FinnaceService) {}

  /**
   * @description Returns the live current-week Financial Health board for the
   * authenticated user.
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'getFinanceBoard')
  getFinanceBoard(@RpcUser() user: User): Promise<FinanceBoard> {
    return this.finnaceService.getFinanceBoard(user.id);
  }

  /**
   * @description Returns the authenticated user's persisted weekly score history
   * (most recent 12 weeks, oldest-first).
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'getFinanceBoardHistory')
  getFinanceBoardHistory(@RpcUser() user: User): Promise<FinanceBoardHistory> {
    return this.finnaceService.getFinanceBoardHistory(user.id);
  }
}
