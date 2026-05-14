import { Controller, UseGuards } from '@nestjs/common';

import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { FINANCE_SERVICE_NAME } from '@fintrack/types/protos/finance/finance';
import {
  BudgetDetail,
  CreateBudgetReq,
  DeleteBudgetReq,
  GetArchivedBudgetsRes,
  GetBudgetReq,
  GetBudgetsReq,
  GetBudgetsRes,
  GetSpendingTrendReq,
  GetSpendingTrendRes,
  Budget as ProtoBudget,
  RestoreBudgetReq,
  UpdateBudgetReq,
} from '@fintrack/types/protos/finance/budget';
import { Observable } from 'rxjs';
import { RpcUser } from '@fintrack/common/decorators/rpc_user.decorator';
import { User } from '@fintrack/database/types';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import { BudgetService } from './budget.service';

/**
 * Controller responsible for handling all budget-related gRPC operations.
 * Delegates to BudgetService for business logic. Authenticated user is
 * injected via @RpcUser() on every method.
 *
 * Methods: getBudgets, getBudget, getSpendingTrend, createBudget,
 * updateBudget, deleteBudget, getArchivedBudgets, restoreBudget
 *
 * @class BudgetController
 */
@Controller()
@UseGuards(RpcAuthGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @GrpcMethod(FINANCE_SERVICE_NAME, 'getBudgets')
  getBudgets(
    @Payload() request: GetBudgetsReq,
    @RpcUser() user: User,
  ): Promise<GetBudgetsRes> {
    return this.budgetService.getBudgets(user.id, request);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'getBudget')
  getBudget(
    @Payload() request: GetBudgetReq,
    @RpcUser() user: User,
  ): Promise<BudgetDetail> {
    return this.budgetService.getBudget(user.id, request);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'getSpendingTrend')
  getSpendingTrend(
    @Payload() request: GetSpendingTrendReq,
    @RpcUser() user: User,
  ): Promise<GetSpendingTrendRes> {
    return this.budgetService.getSpendingTrend(user.id, request);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'createBudget')
  createBudget(
    @Payload() request: CreateBudgetReq,
    @RpcUser() user: User,
  ): Promise<ProtoBudget> | Observable<ProtoBudget> | ProtoBudget {
    return this.budgetService.createBudget(user.id, request);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'updateBudget')
  updateBudget(
    @Payload() request: UpdateBudgetReq,
    @RpcUser() user: User,
  ): Promise<ProtoBudget> | Observable<ProtoBudget> | ProtoBudget {
    return this.budgetService.updateBudget(user.id, request);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'deleteBudget')
  deleteBudget(
    @Payload() request: DeleteBudgetReq,
    @RpcUser() user: User,
  ): Promise<Empty> | Observable<Empty> | Empty {
    return this.budgetService.deleteBudget(user.id, request);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'getArchivedBudgets')
  getArchivedBudgets(
    @Payload() _request: Empty,
    @RpcUser() user: User,
  ): Promise<GetArchivedBudgetsRes> {
    return this.budgetService.getArchivedBudgets(user.id);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'restoreBudget')
  restoreBudget(
    @Payload() request: RestoreBudgetReq,
    @RpcUser() user: User,
  ): Promise<ProtoBudget> | Observable<ProtoBudget> | ProtoBudget {
    return this.budgetService.restoreBudget(user.id, request);
  }
}
