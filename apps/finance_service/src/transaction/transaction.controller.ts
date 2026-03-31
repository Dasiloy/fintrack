import { Observable } from 'rxjs';

import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';

import {
  CreateTransactionReq,
  GetTransactionsReq,
  GetTransactionReq,
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
 * Controller responsible for handling all transaction related operations
 * Handles GRPC requests for creating, getting, updating and deleting transactions
 *
 * @class TransactionController
 */
@Controller()
@UseGuards(RpcAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /**
   * @description Create a new transaction for the authenticated user.
   *
   *
   * @public
   * @param {CreateTransactionReq} request The request body
   * @param {User} user The user who is creating the transaction
   * @returns {Promise<Transaction> | Observable<Transaction> | Transaction} The created transaction
   * @throws {RpcException} UNAUTHENTICATED if the user is not authenticated
   * @throws {RpcException} INVALID_ARGUMENT if the request is invalid
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
   * @description Get all transactions for the authenticated user.
   *
   *
   * @public
   * @param {GetTransactionsReq} request The request body
   * @param {User} user The user who is getting the transactions
   * @returns {Promise<GetTransactionsRes> | Observable<GetTransactionsRes> | GetTransactionsRes} The transactions
   * @throws {RpcException} UNAUTHENTICATED if the user is not authenticated
   * @throws {RpcException} INVALID_ARGUMENT if the request is invalid
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
   * @description Get a transaction by id for the authenticated user.
   *
   *
   * @public
   * @param {GetTransactionReq} request The request body
   * @param {User} user The user who is getting the transaction
   * @returns {Promise<Transaction> | Observable<Transaction> | Transaction} The transaction
   * @throws {RpcException} UNAUTHENTICATED if the user is not authenticated
   * @throws {RpcException} INVALID_ARGUMENT if the request is invalid
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
   * @description Update a transaction by id for the authenticated user.
   *
   *
   * @public
   * @param {UpdateTransactionReq} request The request body
   * @param {User} user The user who is updating the transaction
   * @returns {Promise<Transaction> | Observable<Transaction> | Transaction} The updated transaction
   * @throws {RpcException} UNAUTHENTICATED if the user is not authenticated
   * @throws {RpcException} INVALID_ARGUMENT if the request is invalid
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
   * @description Delete a transaction by id for the authenticated user.
   *
   *
   * @public
   * @param {DeleteTransactionReq} request The request body
   * @param {User} user The user who is deleting the transaction
   * @returns {Promise<Empty> | Observable<Empty> | Empty} The deleted transaction
   * @throws {RpcException} UNAUTHENTICATED if the user is not authenticated
   * @throws {RpcException} INVALID_ARGUMENT if the request is invalid
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'DeleteTransaction')
  deleteTransaction(
    @Payload() request: DeleteTransactionReq,
    @RpcUser() user: User,
  ): Promise<Empty> | Observable<Empty> | Empty {
    return this.transactionService.deleteTransaction(user.id, request);
  }
}
