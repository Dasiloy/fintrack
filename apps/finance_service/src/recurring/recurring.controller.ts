import { Controller } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';

import { FINANCE_SERVICE_NAME } from '@fintrack/types/protos/finance/finance';
import {
  Recurinrg as ProtoRecurring,
  CreateRecurringReq,
  UpdateRecurringReq,
  GetRecurringsReq,
  GetRecurringsRes,
  RecurringAggregateRes,
  RecurringReq,
} from '@fintrack/types/protos/finance/recurring';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import { RpcUser } from '@fintrack/common/decorators/rpc_user.decorator';
import { User } from '@fintrack/database/types';

import { RecurringService } from './recurring.service';

/**
 * gRPC controller for all recurring-item operations exposed on `FinanceService`.
 *
 * ## Auth
 * Protected by `RpcAuthGuard` applied at the module level. The guard validates
 * the JWT from gRPC metadata and exposes the decoded user via `@RpcUser()`.
 *
 * ## gRPC surface
 * | Method                  | Request               | Response               |
 * |-------------------------|-----------------------|------------------------|
 * | createRecurring         | CreateRecurringReq    | Recurinrg              |
 * | getRecurrings           | GetRecurringsReq      | GetRecurringsRes       |
 * | getRecurring            | RecurringReq          | Recurinrg              |
 * | updateRecurring         | UpdateRecurringReq    | Recurinrg              |
 * | toggleRecurring         | RecurringReq          | Recurinrg              |
 * | deleteRecurring         | RecurringReq          | Empty                  |
 * | getRecurringsAggregate  | Empty                 | RecurringAggregateRes  |
 *
 * Proto definitions: `packages/types/proto/finance/recurring.proto`
 *
 * @class RecurringController
 */
@Controller()
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  /**
   * @description Create a new recurring income or expense item for the authenticated user.
   * `nextRunAt` is computed by the service based on `startDate` vs. today.
   *
   * @async
   * @public
   * @param {CreateRecurringReq} request Recurring item creation payload
   * @param {User} user Authenticated user injected by RpcAuthGuard
   * @returns {Promise<ProtoRecurring>} The newly created recurring item
   * @throws {RpcException} NOT_FOUND if the category slug does not exist
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'createRecurring')
  createRecurring(
    @Payload() request: CreateRecurringReq,
    @RpcUser() user: User,
  ): Promise<ProtoRecurring> {
    return this.recurringService.createRecurring(user.id, request);
  }

  /**
   * @description Return all recurring items for the authenticated user.
   * Supports server-side filtering by `isActive`, `type`, and `frequency`,
   * and sorting via `sortBy`. Active items always precede paused items.
   *
   * @async
   * @public
   * @param {GetRecurringsReq} request Filter and sort parameters
   * @param {User} user Authenticated user injected by RpcAuthGuard
   * @returns {Promise<GetRecurringsRes>} Filtered and sorted list of recurring items
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'getRecurrings')
  getRecurrings(
    @Payload() request: GetRecurringsReq,
    @RpcUser() user: User,
  ): Promise<GetRecurringsRes> {
    return this.recurringService.getRecurrings(user.id, request);
  }

  /**
   * @description Return a single recurring item by ID, including its full
   * transaction history (transactions ordered newest-first).
   *
   * @async
   * @public
   * @param {RecurringReq} request Contains the recurring item ID
   * @param {User} user Authenticated user injected by RpcAuthGuard
   * @returns {Promise<ProtoRecurring>} The recurring item with `transactions[]` populated
   * @throws {RpcException} NOT_FOUND if the item does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'getRecurring')
  getRecurring(
    @Payload() request: RecurringReq,
    @RpcUser() user: User,
  ): Promise<ProtoRecurring> {
    return this.recurringService.getRecurring(user.id, request);
  }

  /**
   * @description Update an existing recurring item. All fields except `id` are
   * optional; only provided fields are patched. If `frequency` changes,
   * `nextRunAt` is recomputed from today by the service.
   *
   * @async
   * @public
   * @param {UpdateRecurringReq} request Partial update payload (id required)
   * @param {User} user Authenticated user injected by RpcAuthGuard
   * @returns {Promise<ProtoRecurring>} The updated recurring item
   * @throws {RpcException} NOT_FOUND if the item does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'updateRecurring')
  updateRecurring(
    @Payload() request: UpdateRecurringReq,
    @RpcUser() user: User,
  ): Promise<ProtoRecurring> {
    return this.recurringService.updateRecurring(user.id, request);
  }

  /**
   * @description Toggle the `isActive` flag on a recurring item.
   * Deactivating pauses the scheduler; reactivating recomputes `nextRunAt`
   * from today so the schedule resumes without gaps.
   *
   * @async
   * @public
   * @param {RecurringReq} request Contains the recurring item ID
   * @param {User} user Authenticated user injected by RpcAuthGuard
   * @returns {Promise<ProtoRecurring>} The item with updated `isActive` (and `nextRunAt` if reactivated)
   * @throws {RpcException} NOT_FOUND if the item does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'toggleRecurring')
  toggleRecurring(
    @Payload() request: RecurringReq,
    @RpcUser() user: User,
  ): Promise<ProtoRecurring> {
    return this.recurringService.toggleRecurring(user.id, request);
  }

  /**
   * @description Toggle the `reminderEnabled` flag on a recurring item — a
   * quick opt-in/out for advance billing reminders without editing the item.
   *
   * @async
   * @public
   * @param {RecurringReq} request Contains the recurring item ID
   * @param {User} user Authenticated user injected by RpcAuthGuard
   * @returns {Promise<ProtoRecurring>} The item with updated `reminderEnabled`
   * @throws {RpcException} NOT_FOUND if the item does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'toggleRecurringReminder')
  toggleRecurringReminder(
    @Payload() request: RecurringReq,
    @RpcUser() user: User,
  ): Promise<ProtoRecurring> {
    return this.recurringService.toggleReminder(user.id, request);
  }

  /**
   * @description Permanently delete a recurring item.
   * Transactions already created by the scheduler are NOT deleted.
   *
   * @async
   * @public
   * @param {RecurringReq} request Contains the recurring item ID
   * @param {User} user Authenticated user injected by RpcAuthGuard
   * @returns {Promise<Empty>} Empty response on success
   * @throws {RpcException} NOT_FOUND if the item does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'deleteRecurring')
  deleteRecurring(
    @Payload() request: RecurringReq,
    @RpcUser() user: User,
  ): Promise<Empty> {
    return this.recurringService.deleteRecurring(user.id, request);
  }

  /**
   * @description Return pre-computed aggregate stats for the bills page widgets.
   * Backed by a single Prisma `groupBy` query (≤ 24 rows). Monthly totals are
   * normalised via a per-frequency multiplier. This endpoint is called by the
   * API Gateway which Redis-caches the result for `USER_CACHE_TTL` seconds.
   *
   * @async
   * @public
   * @param {Empty} _request Unused — no input required
   * @param {User} user Authenticated user injected by RpcAuthGuard
   * @returns {Promise<RecurringAggregateRes>} activeCount, pausedCount, monthlyExpense, monthlyIncome
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'getRecurringsAggregate')
  getRecurringsAggregate(
    @Payload() _request: Empty,
    @RpcUser() user: User,
  ): Promise<RecurringAggregateRes> {
    return this.recurringService.getRecurringsAggregate(user.id);
  }
}
