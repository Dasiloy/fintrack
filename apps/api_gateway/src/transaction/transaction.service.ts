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
  TransactionSource,
  TransactionType,
} from '@fintrack/types/protos/finance/transaction';

import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import { TransactionQueryDto } from './dto/transaction_query.dto';

/**
 * TransactionService.
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

  async getTransactionById(id: string, user: User) {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeServiceClient.getTransaction({ id }, metadata),
    );
  }

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

  async deleteTransactionById(id: string, user: User) {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeServiceClient.deleteTransaction({ id }, metadata),
    );
  }
}
