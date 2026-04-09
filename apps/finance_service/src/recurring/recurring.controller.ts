import { Controller } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';

import { FINANCE_SERVICE_NAME } from '@fintrack/types/protos/finance/finance';
import {
  Recurinrg as ProtoRecurring,
  CreateRecurringReq,
  UpdateRecurringReq,
  GetRecurringsReq,
  GetRecurringsRes,
  RecurringReq,
} from '@fintrack/types/protos/finance/recurring';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import { RpcUser } from '@fintrack/common/decorators/rpc_user.decorator';
import { User } from '@fintrack/database/types';

import { RecurringService } from './recurring.service';

/**
 * gRPC controller for all recurring-item operations.
 * Auth is enforced at the module level via RpcAuthGuard.
 *
 * @class RecurringController
 */
@Controller()
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @GrpcMethod(FINANCE_SERVICE_NAME, 'createRecurring')
  createRecurring(
    @Payload() request: CreateRecurringReq,
    @RpcUser() user: User,
  ): Promise<ProtoRecurring> {
    return this.recurringService.createRecurring(user.id, request);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'getRecurrings')
  getRecurrings(
    @Payload() request: GetRecurringsReq,
    @RpcUser() user: User,
  ): Promise<GetRecurringsRes> {
    return this.recurringService.getRecurrings(user.id, request);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'getRecurring')
  getRecurring(
    @Payload() request: RecurringReq,
    @RpcUser() user: User,
  ): Promise<ProtoRecurring> {
    return this.recurringService.getRecurring(user.id, request);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'updateRecurring')
  updateRecurring(
    @Payload() request: UpdateRecurringReq,
    @RpcUser() user: User,
  ): Promise<ProtoRecurring> {
    return this.recurringService.updateRecurring(user.id, request);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'toggleRecurring')
  toggleRecurring(
    @Payload() request: RecurringReq,
    @RpcUser() user: User,
  ): Promise<ProtoRecurring> {
    return this.recurringService.toggleRecurring(user.id, request);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'deleteRecurring')
  deleteRecurring(
    @Payload() request: RecurringReq,
    @RpcUser() user: User,
  ): Promise<Empty> {
    return this.recurringService.deleteRecurring(user.id, request);
  }
}
