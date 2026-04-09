import { Controller, UseGuards } from '@nestjs/common';

import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { FINANCE_SERVICE_NAME } from '@fintrack/types/protos/finance/finance';
import {
  CreateBudgetReq,
  DeleteBudgetReq,
  Budget as ProtoBudget,
  UpdateBudgetReq,
} from '@fintrack/types/protos/finance/budget';
import { Observable } from 'rxjs';
import { RpcUser } from '@fintrack/common/decorators/rpc_user.decorator';
import { User } from '@fintrack/database/types';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import { BudgetService } from './budget.service';

/**
 * Controller responsible for handling all budget related operations
 * Handles GRPC requests for creating, updating and deleting budgets
 *
 * @class BudgetController
 */
@Controller()
@UseGuards(RpcAuthGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

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
}
