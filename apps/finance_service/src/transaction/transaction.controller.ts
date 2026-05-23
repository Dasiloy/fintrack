import { Observable } from 'rxjs';

import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';

import {
  BatchCreateTransactionsReq,
  BatchCreateTransactionsRes,
  CreateTransactionReq,
  GetTransactionsReq,
  GetTransactionReq,
  GetTransactionSummaryReq,
  GetTransactionSummaryRes,
  SearchTransactionsReq,
  SearchTransactionsRes,
  UpdateTransactionReq,
  DeleteTransactionReq,
  Empty,
  GetTransactionsRes,
} from '@fintrack/types/protos/finance/transaction';
import { User } from '@fintrack/database/types';
import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import { RpcUser } from '@fintrack/common/decorators/rpc_user.decorator';
import { FINANCE_SERVICE_NAME } from '@fintrack/types/protos/finance/finance';
import { Transaction as ProtoTransaction } from '@fintrack/types/protos/finance/transaction';

import { TransactionService } from './transaction.service';

/**
 * gRPC controller for {@link FINANCE_SERVICE_NAME} transaction RPCs defined in
 * `packages/types/proto/finance/transaction.proto`.
 *
 * {@link RpcAuthGuard} validates JWT metadata on every call; {@link RpcUser} injects the
 * authenticated `User` row. Handlers delegate to {@link TransactionService}.
 *
 * @class TransactionController
 */
@Controller()
@UseGuards(RpcAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /**
   * @description gRPC `CreateTransaction`: persist one transaction, update rolling balance for the
   * current month, enqueue budget check when type is `EXPENSE`, and emit activity / FCM / analytics jobs.
   *
   * @public
   * @param {CreateTransactionReq} request Proto payload (`amount` as decimal string, enums as ints)
   * @param {User} user Authenticated user from `@RpcUser()`
   * @returns {Promise<ProtoTransaction> | Observable<ProtoTransaction> | ProtoTransaction} Created row as proto `Transaction`
   * @throws {RpcException} UNAUTHENTICATED — missing or invalid JWT metadata
   * @throws {RpcException} NOT_FOUND — `categorySlug` does not resolve for this user
   * @throws {RpcException} INVALID_ARGUMENT — unknown income/expense type or transaction source enum
   * @throws {RpcException} ALREADY_EXISTS — duplicate unique constraint (e.g. bank idempotency)
   * @throws {RpcException} INTERNAL — unexpected persistence or balance error
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'CreateTransaction')
  createTransaction(
    @Payload() request: CreateTransactionReq,
    @RpcUser() user: User,
  ):
    | Promise<ProtoTransaction>
    | Observable<ProtoTransaction>
    | ProtoTransaction {
    return this.transactionService.createTransaction(user.id, request);
  }

  /**
   * @description gRPC `BatchCreateTransactions`: bulk insert for bank sync / import pipelines.
   * Uses `createMany` with `skipDuplicates`, applies balance deltas only for rows that were not
   * already stored (matched by `bankTransactionId` when present), then may enqueue a single
   * budget check across affected expense categories. Does not fire per-row activity notifications.
   *
   * @public
   * @param {BatchCreateTransactionsReq} request Batch of items (each carries `categoryId` UUIDs, not slugs)
   * @param {User} user Authenticated user from `@RpcUser()`
   * @returns {Promise<BatchCreateTransactionsRes> | Observable<BatchCreateTransactionsRes> | BatchCreateTransactionsRes} Counts `created` / `skipped`
   * @throws {RpcException} UNAUTHENTICATED — missing or invalid JWT metadata
   * @throws {RpcException} INVALID_ARGUMENT — unknown type/source enum on any item
   * @throws {RpcException} INTERNAL — unexpected persistence or balance error
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'BatchCreateTransactions')
  batchCreateTransactions(
    @Payload() request: BatchCreateTransactionsReq,
    @RpcUser() user: User,
  ):
    | Promise<BatchCreateTransactionsRes>
    | Observable<BatchCreateTransactionsRes>
    | BatchCreateTransactionsRes {
    return this.transactionService.batchCreateTransactions(user.id, request);
  }

  /**
   * @description gRPC `GetTransactions`: paginated list with optional date range, category slugs,
   * type/source filters, bank account / `sourceId` / `bankTransactionId` filters.
   *
   * @public
   * @param {GetTransactionsReq} request Pagination (`page`, `limit`) and filters
   * @param {User} user Authenticated user from `@RpcUser()`
   * @returns {Promise<GetTransactionsRes> | Observable<GetTransactionsRes> | GetTransactionsRes} Items plus pagination `meta`
   * @throws {RpcException} UNAUTHENTICATED — missing or invalid JWT metadata
   * @throws {RpcException} INVALID_ARGUMENT — unknown type or source enum in repeated filter fields
   * @throws {RpcException} INTERNAL — unexpected query error
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'GetTransactions')
  getTransactions(
    @Payload() request: GetTransactionsReq,
    @RpcUser() user: User,
  ):
    | Promise<GetTransactionsRes>
    | Observable<GetTransactionsRes>
    | GetTransactionsRes {
    return this.transactionService.getTransactions(user.id, request);
  }

  /**
   * @description gRPC `GetTransaction`: fetch one transaction by `id` scoped to the caller.
   *
   * @public
   * @param {GetTransactionReq} request Must include `id`
   * @param {User} user Authenticated user from `@RpcUser()`
   * @returns {Promise<ProtoTransaction> | Observable<ProtoTransaction> | ProtoTransaction} Full proto `Transaction` with joins
   * @throws {RpcException} UNAUTHENTICATED — missing or invalid JWT metadata
   * @throws {RpcException} NOT_FOUND — no row for this `id` and `userId`
   * @throws {RpcException} INTERNAL — unexpected query error
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'GetTransaction')
  getTransaction(
    @Payload() request: GetTransactionReq,
    @RpcUser() user: User,
  ):
    | Promise<ProtoTransaction>
    | Observable<ProtoTransaction>
    | ProtoTransaction {
    return this.transactionService.getTransaction(user.id, request);
  }

  /**
   * @description gRPC `UpdateTransaction`: partial update; when amount, date, or type change,
   * balance deltas are reversed and reapplied. BANK + `aiClassified` category changes enqueue
   * AI classification-correction feedback.
   *
   * @public
   * @param {UpdateTransactionReq} request `id` plus optional fields (`categorySlug` resolves like create)
   * @param {User} user Authenticated user from `@RpcUser()`
   * @returns {Promise<ProtoTransaction> | Observable<ProtoTransaction> | ProtoTransaction} Updated proto `Transaction`
   * @throws {RpcException} UNAUTHENTICATED — missing or invalid JWT metadata
   * @throws {RpcException} NOT_FOUND — transaction or resolved category does not exist for this user
   * @throws {RpcException} INVALID_ARGUMENT — unknown type enum or invalid payload
   * @throws {RpcException} INTERNAL — unexpected persistence or balance error
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'UpdateTransaction')
  updateTransaction(
    @Payload() request: UpdateTransactionReq,
    @RpcUser() user: User,
  ):
    | Promise<ProtoTransaction>
    | Observable<ProtoTransaction>
    | ProtoTransaction {
    return this.transactionService.updateTransaction(user.id, request);
  }

  /**
   * @description gRPC `DeleteTransaction`: remove one transaction, reverse its balance contribution
   * for the transaction month, and emit activity / FCM / analytics for the deleted row.
   *
   * @public
   * @param {DeleteTransactionReq} request Must include `id`
   * @param {User} user Authenticated user from `@RpcUser()`
   * @returns {Promise<Empty> | Observable<Empty> | Empty} `google.protobuf.Empty` on success
   * @throws {RpcException} UNAUTHENTICATED — missing or invalid JWT metadata
   * @throws {RpcException} NOT_FOUND — no row for this `id` and `userId`
   * @throws {RpcException} INTERNAL — unexpected persistence or balance error
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'DeleteTransaction')
  deleteTransaction(
    @Payload() request: DeleteTransactionReq,
    @RpcUser() user: User,
  ): Promise<Empty> | Observable<Empty> | Empty {
    return this.transactionService.deleteTransaction(user.id, request);
  }

  /**
   * @description gRPC `GetTransactionSummary`: dashboard aggregates for the authenticated user
   * (net balance, current-month income/expense/net, `balanceChangePct`, Mon–Sun weekly expense,
   * 84-day expense heatmap, monthly income/expense series). Proto request is `Empty`; identity
   * comes from JWT metadata via `@RpcUser()`.
   *
   * @public
   * @param {User} user Authenticated user from `@RpcUser()`
   * @returns {Promise<GetTransactionSummaryRes>} See {@link TransactionService.getTransactionSummary} for field semantics
   * @throws {RpcException} UNAUTHENTICATED — missing or invalid JWT metadata
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'SearchTransactions')
  searchTransactions(
    @Payload() request: SearchTransactionsReq,
    @RpcUser() user: User,
  ):
    | Promise<SearchTransactionsRes>
    | Observable<SearchTransactionsRes>
    | SearchTransactionsRes {
    return this.transactionService.searchTransactions(user.id, request);
  }

  @GrpcMethod(FINANCE_SERVICE_NAME, 'GetTransactionSummary')
  getTransactionSummary(
    @Payload() request: GetTransactionSummaryReq,
    @RpcUser() user: User,
  ): Promise<GetTransactionSummaryRes> {
    return this.transactionService.getTransactionSummary(
      user.id,
      request.months,
    );
  }
}
