import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { ClientGrpc } from '@nestjs/microservices';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { User } from '@fintrack/database/types';
import {
  FINANCE_PACKAGE_NAME,
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
} from '@fintrack/types/protos/finance/finance';
import {
  BatchCreateTransactionsReq,
  BatchCreateTransactionsRes,
  CreateTransactionReq,
  TransactionSource,
  TransactionType,
} from '@fintrack/types/protos/finance/transaction';

import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import { TransactionQueryDto } from './dto/transaction_query.dto';

/**
 * API Gateway service for transaction CRUD operations.
 * Proxies HTTP requests to the Finance microservice via gRPC.
 *
 * @class TransactionService
 */
@Injectable()
export class TransactionService implements OnModuleInit {
  private financeServiceClient: FinanceServiceClient;

  constructor(
    @Inject(FINANCE_PACKAGE_NAME) private readonly financeClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.financeServiceClient =
      this.financeClient.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  /**
   * Creates a new manual transaction for the authenticated user.
   * Amount is serialized to string for gRPC transport and enum values
   * are mapped from their DTO string form to the proto enum integer.
   *
   * @param user - Authenticated user
   * @param createTransactionDto - Transaction payload
   * @returns The created transaction
   */
  async createTransaction(
    user: User,
    createTransactionDto: CreateTransactionDto,
  ) {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);

    return lastValueFrom(
      this.financeServiceClient.createTransaction(
        {
          ...createTransactionDto,
          amount: String(createTransactionDto.amount),
          type: TransactionType[createTransactionDto.type],
          source: TransactionSource[createTransactionDto.source],
        },
        metadata,
      ),
    );
  }

  /**
   * Retrieves a paginated, filtered list of transactions for the authenticated user.
   * type and source arrays are mapped from DTO enum strings to proto enum integers.
   * categorySlug and date range filters are forwarded as-is.
   *
   * @param user - Authenticated user
   * @param query - Pagination and filter parameters
   * @returns Paginated transaction list with meta
   */
  async getAllTransactions(user: User, query: TransactionQueryDto) {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);

    return lastValueFrom(
      this.financeServiceClient.getTransactions(
        {
          page: query.page,
          limit: query.limit,
          categorySlug: query.categorySlug || [],
          type: query.type?.map((type) => TransactionType[type]) || [],
          source:
            query.source?.map((source) => TransactionSource[source]) || [],
          startDate: query.startDate,
          endDate: query.endDate,
        },
        metadata,
      ),
    );
  }

  /**
   * Retrieves a single transaction by ID scoped to the authenticated user.
   *
   * @param id - Transaction ID
   * @param user - Authenticated user
   * @returns The matching transaction
   */
  async getTransactionById(id: string, user: User) {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);

    return lastValueFrom(
      this.financeServiceClient.getTransaction({ id }, metadata),
    );
  }

  /**
   * Updates a transaction by ID.
   * Amount and type are optional — only provided fields are forwarded.
   * Amount is serialized to string for gRPC transport when present.
   *
   * @param id - Transaction ID to update
   * @param user - Authenticated user
   * @param updateTransactionDto - Fields to update
   * @returns The updated transaction
   */
  async updateTransactionById(
    id: string,
    user: User,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);

    return lastValueFrom(
      this.financeServiceClient.updateTransaction(
        {
          id,
          ...updateTransactionDto,
          amount: String(updateTransactionDto.amount),
          type: updateTransactionDto.type
            ? TransactionType[updateTransactionDto.type]
            : undefined,
        },
        metadata,
      ),
    );
  }

  /**
   * Deletes a transaction by ID scoped to the authenticated user.
   *
   * @param id - Transaction ID to delete
   * @param user - Authenticated user
   * @returns Empty response on success
   */
  async deleteTransactionById(id: string, user: User) {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);

    return lastValueFrom(
      this.financeServiceClient.deleteTransaction({ id }, metadata),
    );
  }

  /**
   * Batch-creates bank-sourced transactions from a background sync job.
   * Uses a single gRPC call with createMany + skipDuplicates on the finance
   * service side — much cheaper than N individual creates.
   *
   * @param userId - ID of the owning user
   * @param req - Batch request with transactions + optional monoBankAccountId
   */
  async batchCreateMonoTransactions(
    userId: string,
    req: BatchCreateTransactionsReq,
  ): Promise<BatchCreateTransactionsRes> {
    const metadata = new Metadata();
    metadata.add('x-user-id', userId);
    return lastValueFrom(
      this.financeServiceClient.batchCreateTransactions(req, metadata),
    );
  }
}
