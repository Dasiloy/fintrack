import { Queue } from 'bullmq';
import { status } from '@grpc/grpc-js';

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { RpcException } from '@nestjs/microservices';

import { PaginateService } from '@fintrack/common/services/paginate.service';
import { PrismaService } from '@fintrack/database/service';
import {
  ACTIVITY_NOTIFICATION_JOB,
  ACTIVITY_NOTIFICATION_QUEUE,
  ANALYTICS_NOTIFICATION_JOB,
  ANALYTICS_NOTIFICATION_QUEUE,
  FCM_NOTIFICATION_JOB,
  FCM_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import {
  AnalyticsNotificationPayload,
  FcmNotificationPayload,
} from '@fintrack/types/interfaces/finance';
import {
  CreateTransactionReq,
  DeleteTransactionReq,
  Empty,
  GetTransactionReq,
  GetTransactionsReq,
  GetTransactionsRes,
  Transaction as ProtoTransaction,
  UpdateTransactionReq,
  TransactionType as ProtoTransactionType,
  TransactionSource as ProtoTransactionSource,
} from '@fintrack/types/protos/finance/transaction';
import {
  ActivityLogs,
  Category,
  GoalContribution,
  MonoBankAccount,
  Prisma,
  Split,
  Transaction,
  TransactionSource,
  TransactionType,
} from '@fintrack/database/types';

import { UtilsService } from '../utils.service';

export type TransactionWithOptionalJoins = Transaction & {
  category?: Category | null;
  split?: Split | null;
  goalContribution?: GoalContribution | null;
  monoBankAccount?: MonoBankAccount | null;
};

/**
 * Service responsible for handling all transaction related operations
 * Interacts with Prisma.
 * Manages Transaction.
 * Queue bull events for transaction related operations
 *
 * @class TransactionService
 */
@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paginateService: PaginateService,
    @InjectQueue(ACTIVITY_NOTIFICATION_QUEUE)
    private readonly activityNotificationQueue: Queue,
    @InjectQueue(FCM_NOTIFICATION_QUEUE)
    private readonly fcmNotificationQueue: Queue,
    @InjectQueue(ANALYTICS_NOTIFICATION_QUEUE)
    private readonly analyticsNotificationQueue: Queue,
    private readonly utils: UtilsService,
  ) {}

  /**
   * @description Create a new transaction
   *
   * @param userId - The user id
   * @param transaction - The transaction to create
   * @returns The created transaction
   */
  async createTransaction(
    userId: string,
    request: CreateTransactionReq,
  ): Promise<ProtoTransaction> {
    try {
      const category = await this.utils.getCategory(
        userId,
        request.categorySlug,
      );
      const payload = {
        userId: userId,
        categoryId: category.id!,
        date: new Date(request.date),
        amount: Number(request.amount),
        type: this.ressolveType(request.type),
        source: this.ressolveSource(request.source),
        sourceId: request.sourceId,
        description: request.description,
        merchant: request.merchant,
      };
      const createdTransaction = await this.prismaService.transaction.create({
        data: payload,
        include: {
          category: true,
        },
      });

      // call side effects events
      this.callevents(userId, createdTransaction, 'Transaction Created');
      return this.formatTransaction(createdTransaction);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Transaction already exists',
        });
      }
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred while creating the transaction',
        details: error.message,
      });
    }
  }

  /**
   * @description Get all transactions for a user
   * @param userId - The user id
   * @returns The transactions
   */
  async getTransactions(
    userId: string,
    query: GetTransactionsReq,
  ): Promise<GetTransactionsRes> {
    try {
      const transactionTypes = query.type?.length
        ? query.type.map((type) => this.ressolveType(type))
        : undefined;
      const transactionSources = query.source?.length
        ? query.source.map((source) => this.ressolveSource(source))
        : undefined;

      const options: Prisma.TransactionWhereInput = {
        userId,
        ...(query.startDate && { date: { gte: new Date(query.startDate) } }),
        ...(query.endDate && { date: { lte: new Date(query.endDate) } }),
        ...(query.sourceId && { sourceId: query.sourceId }),
        ...(query.bankAccountId && {
          monoBankAccount: { is: { accountNumber: query.bankAccountId } },
        }),
        ...(query.bankTransactionId && {
          bankTransactionId: { contains: query.bankTransactionId },
        }),
        ...(transactionTypes && { type: { in: transactionTypes } }),
        ...(transactionSources && { source: { in: transactionSources } }),
        ...(query.categorySlug?.length && {
          category: { slug: { in: query.categorySlug } },
        }),
      };

      const [transactions, total] = await Promise.all([
        this.prismaService.transaction.findMany({
          where: options,
          orderBy: { date: 'desc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          include: { category: true },
        }),
        this.prismaService.transaction.count({
          where: options,
        }),
      ]);

      this.logger.log(
        `Found ${total} transactions for user ${userId}`,
        transactions,
      );

      return {
        transactions: transactions.map((transaction) =>
          this.formatTransaction(transaction),
        ),
        meta: this.paginateService.paginate({
          page: query.page,
          limit: query.limit,
          total,
          pageSize: transactions.length,
        }),
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred while getting the transactions',
        details: error.message,
      });
    }
  }

  /**
   * @description Get a transaction by id
   * @param userId - The user id
   * @param transactionId - The transaction id
   * @returns The transaction
   */
  async getTransaction(
    userId: string,
    request: GetTransactionReq,
  ): Promise<ProtoTransaction> {
    try {
      const transaction = await this.prismaService.transaction.findUnique({
        where: { id: request.id, userId },
        include: {
          category: true,
          monoBankAccount: true,
          split: true,
          goalContribution: true,
        },
      });
      if (!transaction) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Transaction not found',
        });
      }
      return this.formatTransaction(transaction);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred while getting the transaction',
        details: error.message,
      });
    }
  }

  /**
   * @description Update a transaction by id
   * @param userId - The user id
   * @param transactionId - The transaction id
   * @param transaction - The transaction to update
   * @returns The updated transaction
   */
  async updateTransaction(
    userId: string,
    request: UpdateTransactionReq,
  ): Promise<ProtoTransaction> {
    try {
      const transaction = await this.prismaService.transaction.findFirst({
        where: { id: request.id, userId },
        select: {
          id: true,
        },
      });
      if (!transaction) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Transaction not found',
        });
      }
      const category = request.categorySlug
        ? await this.utils.getCategory(userId, request.categorySlug)
        : undefined;
      const payload: Prisma.TransactionUpdateInput = {
        ...(request.amount !== undefined && { amount: Number(request.amount) }),
        ...(request.date !== undefined && { date: new Date(request.date) }),
        ...(request.type !== undefined && {
          type: this.ressolveType(request.type),
        }),
        ...(request.description !== undefined && {
          description: request.description,
        }),
        ...(request.merchant !== undefined && { merchant: request.merchant }),
        ...(request.notes !== undefined && { notes: request.notes }),
        ...(category?.id && { category: { connect: { id: category.id } } }),
      };
      const updatedTransaction = await this.prismaService.transaction.update({
        where: { id: transaction.id },
        data: payload,
        include: {
          category: true,
        },
      });
      // dispatch side effects events
      this.callevents(userId, updatedTransaction, 'Transaction Updated');
      return this.formatTransaction(updatedTransaction);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred while getting the transaction',
        details: error.message,
      });
    }
  }

  /**
   * @description Delete a transaction by id
   * @param userId - The user id
   * @param transactionId - The transaction id
   * @returns The deleted transaction
   */
  async deleteTransaction(
    userId: string,
    request: DeleteTransactionReq,
  ): Promise<Empty> {
    try {
      const transaction = await this.prismaService.transaction.findFirst({
        where: { id: request.id, userId },
        select: {
          id: true,
        },
      });
      if (!transaction) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Transaction not found',
        });
      }

      const deletedTransaction = await this.prismaService.transaction.delete({
        where: { id: transaction.id },
        include: {
          category: true,
          monoBankAccount: true,
          split: true,
          goalContribution: true,
        },
      });

      // dispatch side effects events
      this.callevents(userId, deletedTransaction, 'Transaction Deleted');
      return {};
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred while deleting the transaction',
        details: error.message,
      });
    }
  }

  /**
   * @description Resolve a transaction type from a proto transaction type
   *
   * @private
   * @param type - The proto transaction type
   * @returns The transaction type
   */
  private ressolveType(type: ProtoTransactionType): TransactionType {
    switch (type) {
      case ProtoTransactionType.INCOME:
        return TransactionType.INCOME;
      case ProtoTransactionType.EXPENSE:
        return TransactionType.EXPENSE;
      default:
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Invalid transaction type',
        });
    }
  }

  /**
   * @description Resolve a transaction source from a proto transaction source
   *
   * @private
   * @param source - The proto transaction source
   * @returns The transaction source
   */
  private ressolveSource(source: ProtoTransactionSource): TransactionSource {
    switch (source) {
      case ProtoTransactionSource.BANK:
        return TransactionSource.BANK;
      case ProtoTransactionSource.RECURRING:
        return TransactionSource.RECURRING;
      case ProtoTransactionSource.OCR:
        return TransactionSource.OCR;
      case ProtoTransactionSource.SPLIT:
        return TransactionSource.SPLIT;
      case ProtoTransactionSource.MANUAL:
        return TransactionSource.MANUAL;
      default:
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Invalid transaction source',
        });
    }
  }

  /**
   * @description Call side effects events
   *
   * @private
   * @param userId - The user id
   * @param transaction - The transaction
   * @returns void
   */
  private callevents(
    userId: string,
    transaction: TransactionWithOptionalJoins,
    event: string,
  ) {
    const data = {
      type: 'transaction',
      transactionId: transaction.id,
      transactionAmount: transaction.amount.toString(),
      transactionDate: transaction.date.toISOString(),
      transactionType: transaction.type,
      transactionSource: transaction.source,
    };

    // activity logs
    const activityData: ActivityLogs = {
      userId,
      id: transaction.id,
      createdAt: transaction.createdAt,
      event: event.split(' ').join('_').toLowerCase(),
      entityId: transaction.id,
      entityType: 'transaction',
      data,
    };
    this.activityNotificationQueue.add(ACTIVITY_NOTIFICATION_JOB, activityData);

    // fcm notification
    const fcmData: FcmNotificationPayload = {
      userId,
      title: event,
      body: 'Your transaction has been created',
      data,
    };
    this.fcmNotificationQueue.add(FCM_NOTIFICATION_JOB, fcmData);

    // analytics notification
    const analyticsData: AnalyticsNotificationPayload = {
      userId,
      event: event.split(' ').join('_').toLowerCase(),
      entityId: transaction.id,
      data,
    };
    this.analyticsNotificationQueue.add(
      ANALYTICS_NOTIFICATION_JOB,
      analyticsData,
    );
  }

  /**
   * @description Format a transaction for the proto
   *
   * @public
   * @param transaction - The transaction to format
   * @returns The formatted transaction
   */
  formatTransaction(
    transaction: TransactionWithOptionalJoins,
  ): ProtoTransaction {
    return {
      id: transaction.id,
      amount: transaction.amount.toString(),
      date: transaction.date.toISOString(),
      type: transaction.type,
      source: transaction.source,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      merchant: transaction.merchant!,
      sourceId: transaction.sourceId!,
      notes: transaction.notes!,
      description: transaction.description!,
      bankTransactionId: transaction.bankTransactionId!,
      bankTransactionStatus: transaction.bankTransactionStatus,
      sourceData: transaction.sourceData
        ? JSON.stringify(transaction.sourceData)
        : undefined,
      category: this.utils.formatCategory(transaction.category),
      bank: transaction.monoBankAccount
        ? {
            bankId: transaction.monoBankAccount.bankId,
            bankName: transaction.monoBankAccount.bankName,
            accountNumber: transaction.monoBankAccount.accountNumber,
            accountName: transaction.monoBankAccount.accountName,
          }
        : undefined,
      split: transaction.split
        ? {
            id: transaction.split.id,
            name: transaction.split.name,
            amount: transaction.split.amount.toString(),
            status: transaction.split.status,
          }
        : undefined,
      goalContribution: transaction.goalContribution
        ? {
            id: transaction.goalContribution.id,
            amount: transaction.goalContribution.amount.toString(),
            date: transaction.goalContribution.date.toISOString(),
            description: transaction.goalContribution.description ?? '',
            notes: transaction.goalContribution.notes ?? '',
          }
        : undefined,
    };
  }
}
