import { Queue } from 'bullmq';
import { status } from '@grpc/grpc-js';

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { RpcException } from '@nestjs/microservices';

import dayjs from '@fintrack/utils/date';
import { PaginateService } from '@fintrack/common/services/paginate.service';
import { PrismaService } from '@fintrack/database/service';
import {
  ACTIVITY_NOTIFICATION_JOB,
  ACTIVITY_NOTIFICATION_QUEUE,
  BUDGET_CHECK_JOB,
  BUDGET_CHECK_QUEUE,
  FCM_NOTIFICATION_JOB,
  FCM_NOTIFICATION_QUEUE,
  CLASSIFICATION_CORRECTION_JOB,
  CLASSIFICATION_CORRECTION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import {
  BudgetCheckJobPayload,
  ClassificationCorrectionJobPayload,
  FcmNotificationPayload,
} from '@fintrack/types/interfaces/finance';
import {
  BatchCreateTransactionsReq,
  BatchCreateTransactionsRes,
  CreateTransactionReq,
  DailySpending,
  DeleteTransactionReq,
  Empty,
  GetTransactionReq,
  GetTransactionsReq,
  GetTransactionsRes,
  GetTransactionSummaryRes,
  SearchTransactionsReq,
  SearchTransactionsRes,
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
import { BalanceService } from '@fintrack/common/services/balance.service';

export type TransactionWithOptionalJoins = Transaction & {
  category?: Category | null;
  split?: Split | null;
  goalContribution?: GoalContribution | null;
  monoBankAccount?: MonoBankAccount | null;
};

/**
 * Service responsible for all transaction CRUD operations in the Finance microservice.
 * Processes gRPC requests, persists records via Prisma, and dispatches side-effect jobs
 * (activity logs, FCM push, analytics, classification corrections, budget alerts).
 *
 * ## Responsibilities
 * - Single and batch transaction creation with duplicate-skipping for bank imports
 * - Paginated, filtered transaction listing
 * - Transaction updates with AI-classification correction feedback
 * - Budget alert dispatch after any EXPENSE write
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
    @InjectQueue(CLASSIFICATION_CORRECTION_QUEUE)
    private readonly classificationCorrectionQueue: Queue,
    @InjectQueue(BUDGET_CHECK_QUEUE)
    private readonly budgetCheckQueue: Queue,
    private readonly utils: UtilsService,
    private readonly balanceService: BalanceService,
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

      const txDate = new Date(request.date);
      const txAmount = Number(request.amount);
      const txType = this.ressolveType(request.type);

      const payload = {
        userId,
        categoryId: category.id!,
        date: txDate,
        amount: txAmount,
        type: txType,
        source: this.ressolveSource(request.source),
        sourceId: request.sourceId,
        description: request.description,
        merchant: request.merchant,
        ...(request.sourceData && {
          sourceData: JSON.parse(request.sourceData),
        }),
      };

      const createdTransaction = await this.prismaService.$transaction(
        async (tx) => {
          await this.balanceService.ensureCurrentMonth(tx, userId);
          const created = await tx.transaction.create({
            data: payload,
            include: { category: true },
          });
          await this.balanceService.applyBalanceDelta(
            tx,
            userId,
            txType,
            txAmount,
            'ADD',
            txDate,
          );
          return created;
        },
        {
          maxWait: 10_000,
          timeout: 30_000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      this.callevents(userId, createdTransaction, 'Transaction Created');
      if (createdTransaction.type === TransactionType.EXPENSE) {
        void this.budgetCheckQueue.add(
          BUDGET_CHECK_JOB,
          {
            userId,
            transactions: [
              {
                categoryId: createdTransaction.categoryId,
                referenceDate: createdTransaction.date.toISOString(),
              },
            ],
          } satisfies BudgetCheckJobPayload,
          {
            removeOnComplete: true,
            removeOnFail: true, // its inconsiquential, at most insights run daily so users will still get insight updated at end of day
          },
        );
      }
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
   * @description Batch-create bank transactions imported from Mono.
   *
   * Resolves all category slugs to IDs in a single DB query, then runs
   * a single createMany with skipDuplicates — idempotent on re-runs.
   * No per-transaction side-effects are fired; the caller (sync processor)
   * sends a single FCM notification after the batch completes.
   *
   * @param userId - The user id
   * @param request - Batch request with transactions array and optional monoBankAccountId
   */
  async batchCreateTransactions(
    userId: string,
    request: BatchCreateTransactionsReq,
  ): Promise<BatchCreateTransactionsRes> {
    try {
      const { transactions } = request;
      if (!transactions.length) return { created: 0, skipped: 0 };

      // createMany with skipDuplicates only returns a count, not which records
      // were actually inserted. We need the exact set of new records for balance
      // tracking, so we pre-query existing bankTransactionIds and compute the diff.
      const inputBankIds = transactions
        .map((t) => t.bankTransactionId)
        .filter((id): id is string => !!id);

      const existingBankIds = inputBankIds.length
        ? (
            await this.prismaService.transaction.findMany({
              where: { userId, bankTransactionId: { in: inputBankIds } },
              select: { bankTransactionId: true },
            })
          ).map((r) => r.bankTransactionId!)
        : [];

      const existingSet = new Set(existingBankIds);

      // The truly new records whose balance contributions we must apply.
      const newItems = transactions.filter(
        (t) => !t.bankTransactionId || !existingSet.has(t.bankTransactionId),
      );

      const data = transactions.map((t) => ({
        userId,
        categoryId: t.categoryId,
        date: new Date(t.date),
        amount: Number(t.amount),
        type: this.ressolveType(t.type),
        source: this.ressolveSource(t.source),
        sourceId: t.sourceId,
        description: t.description,
        narration: t.narration,
        merchant: t.merchant,
        monoBankAccountId: t.monoBankAccountId,
        bankTransactionId: t.bankTransactionId,
        aiClassified: t.aiClassified ?? false,
        ...(t.sourceData && { sourceData: JSON.parse(t.sourceData) }),
      }));

      const result = await this.prismaService.$transaction(async (ptx) => {
        if (newItems.length > 0) {
          await this.balanceService.ensureCurrentMonth(ptx, userId);
        }

        const createResult = await ptx.transaction.createMany({
          data,
          skipDuplicates: true,
        });

        if (newItems.length > 0) {
          await this.balanceService.applyBatchBalanceDelta(
            ptx,
            userId,
            newItems.map((t) => ({
              type: this.ressolveType(t.type),
              amount: Number(t.amount),
              date: new Date(t.date),
            })),
            'ADD',
          );
        }

        return createResult;
      });

      // Fire budget check only for categories belonging to newly inserted records.
      const expenseCategoryIds = [
        ...new Set(
          newItems
            .filter((t) => t.type === ProtoTransactionType.EXPENSE)
            .map((t) => t.categoryId),
        ),
      ];
      if (result.count > 0 && expenseCategoryIds.length > 0) {
        // fetch tranwaction
        void this.budgetCheckQueue.add(BUDGET_CHECK_JOB, {
          userId,
          transactions: expenseCategoryIds.map((catId) => ({
            categoryId: catId,
            referenceDate: new Date().toISOString(),
          })),
        } satisfies BudgetCheckJobPayload);
      }

      return {
        created: result.count,
        skipped: transactions.length - result.count,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred while batch creating transactions',
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
   * @description Full-text search across description, merchant, notes, narration with optional type filter.
   * Uses ILIKE (case-insensitive substring) — no schema migration required.
   */
  async searchTransactions(
    userId: string,
    query: SearchTransactionsReq,
  ): Promise<SearchTransactionsRes> {
    try {
      const limit = Math.min(query.limit || 20, 50);
      const transactions = await this.prismaService.transaction.findMany({
        where: {
          userId,
          ...(query.type && { type: query.type as TransactionType }),
          OR: [
            { description: { contains: query.q, mode: 'insensitive' } },
            { merchant: { contains: query.q, mode: 'insensitive' } },
            { notes: { contains: query.q, mode: 'insensitive' } },
            { narration: { contains: query.q, mode: 'insensitive' } },
            { sourceId: { contains: query.q, mode: 'default' } },
          ],
        },
        orderBy: { date: 'desc' },
        take: limit,
        include: { category: true },
      });

      return {
        transactions: transactions.map((t) => this.formatTransaction(t)),
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred while searching transactions',
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
      const existing = await this.prismaService.transaction.findFirst({
        where: { id: request.id, userId },
        select: {
          id: true,
          type: true,
          amount: true,
          date: true,
          source: true,
          categoryId: true,
          narration: true,
          aiClassified: true,
        },
      });

      if (!existing) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Transaction not found',
        });
      }

      const category = request.categorySlug
        ? await this.utils.getCategory(userId, request.categorySlug)
        : undefined;

      // Determine the effective post-update financial values for balance deltas.
      const financiallyChanged =
        request.amount !== undefined ||
        request.date !== undefined ||
        request.type !== undefined;

      const newType =
        request.type !== undefined
          ? this.ressolveType(request.type)
          : existing.type;
      const newAmount =
        request.amount !== undefined ? Number(request.amount) : existing.amount;
      const newDate =
        request.date !== undefined ? new Date(request.date) : existing.date;

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

      const updatedTransaction = await this.prismaService.$transaction(
        async (tx) => {
          if (financiallyChanged) {
            await this.balanceService.ensureCurrentMonth(tx, userId);
          }
          const updated = await tx.transaction.update({
            where: { id: existing.id },
            data: payload,
            include: { category: true },
          });
          if (financiallyChanged) {
            // Reverse the old contribution then apply the new one atomically.
            await this.balanceService.applyBalanceDelta(
              tx,
              userId,
              existing.type,
              existing.amount,
              'REMOVE',
              existing.date,
            );
            await this.balanceService.applyBalanceDelta(
              tx,
              userId,
              newType,
              newAmount,
              'ADD',
              newDate,
            );
          }
          return updated;
        },
        {
          maxWait: 10_000,
          timeout: 30_000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      const categoryChanged = category && category.id !== existing.categoryId;
      if (
        existing.source === TransactionSource.BANK &&
        existing.aiClassified &&
        categoryChanged &&
        existing.narration
      ) {
        await this.classificationCorrectionQueue.add(
          CLASSIFICATION_CORRECTION_JOB,
          {
            userId,
            narration: existing.narration,
            correctedSlug: request.categorySlug!,
          } satisfies ClassificationCorrectionJobPayload,
        );
      }

      this.callevents(userId, updatedTransaction, 'Transaction Updated');
      if (updatedTransaction.type === TransactionType.EXPENSE) {
        void this.budgetCheckQueue.add(BUDGET_CHECK_JOB, {
          userId,
          transactions: [
            {
              categoryId: updatedTransaction.categoryId,
              referenceDate: updatedTransaction.date.toISOString(),
            },
          ],
        } satisfies BudgetCheckJobPayload);
      }
      return this.formatTransaction(updatedTransaction);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred while updating the transaction',
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
      const existing = await this.prismaService.transaction.findFirst({
        where: { id: request.id, userId },
        select: {
          id: true,
          type: true,
          amount: true,
          date: true,
        },
      });
      if (!existing) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Transaction not found',
        });
      }

      const deletedTransaction = await this.prismaService.$transaction(
        async (tx) => {
          await this.balanceService.ensureCurrentMonth(tx, userId);
          const deleted = await tx.transaction.delete({
            where: { id: existing.id },
            include: {
              category: true,
              monoBankAccount: true,
              split: true,
              goalContribution: true,
            },
          });
          await this.balanceService.applyBalanceDelta(
            tx,
            userId,
            existing.type,
            existing.amount,
            'REMOVE',
            existing.date,
          );
          return deleted;
        },
        {
          maxWait: 10_000,
          timeout: 30_000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

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
  }

  /**
   * @description Builds the dashboard transaction summary for a user in one round trip.
   * Loads `UserBalance` (rolling net and current-month income/expense), up to 12
   * `MonthlyBalanceSnapshot` rows (newest first), and a raw aggregate of daily EXPENSE
   * totals for the heatmap window. Weekly spending and the 84-day heatmap are derived from
   * that aggregate (missing days are zero-filled). `monthlySeries` is snapshots oldest→newest
   * with the live current month appended last. `balanceChangePct` compares this month’s net
   * to the most recent snapshot month’s stored net; it is `0` when there is no prior month
   * or the prior net is zero.
   *
   * @public
   * @param userId - Owner of the summary data
   * @returns {@link GetTransactionSummaryRes} — net and monthly figures from balance,
   *   `balanceChangePct` vs last completed snapshot month, Mon–Sun `weeklySpending` (ISO week),
   *   84-day `spendingHeatmap` (EXPENSE only, decimal strings per day), and `monthlySeries` for charts
   */
  async getTransactionSummary(
    userId: string,
    months = 12,
  ): Promise<GetTransactionSummaryRes> {
    const now = dayjs();
    const start84 = now.subtract(83, 'day').startOf('day').toDate();
    const startOfWeek = now.startOf('isoWeek').toDate();

    const [balance, snapshots, heatmapRaw] = await Promise.all([
      this.prismaService.userBalance.findUnique({ where: { userId } }),

      this.prismaService.monthlyBalanceSnapshot.findMany({
        where: { userId },
        orderBy: { monthYear: 'desc' },
        take: months,
      }),

      this.prismaService.$queryRaw<Array<{ day: Date; total: unknown }>>`
        SELECT DATE(date) AS day, SUM(amount) AS total
        FROM "Transaction"
        WHERE "userId" = ${userId}
          AND type = 'EXPENSE'
          AND date >= ${start84}
        GROUP BY DATE(date)
        ORDER BY day ASC
      `,
    ]);

    // Build a date→amount lookup from the single raw query
    const heatmapMap = new Map<string, string>();
    for (const row of heatmapRaw) {
      heatmapMap.set(
        dayjs(row.day).format('YYYY-MM-DD'),
        String(row.total ?? '0'),
      );
    }

    // Heatmap: 84 days oldest→newest, zero-fill missing days
    const spendingHeatmap: DailySpending[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = now.subtract(i, 'day').format('YYYY-MM-DD');
      spendingHeatmap.push({ date: d, amount: heatmapMap.get(d) ?? '0' });
    }

    // Weekly spending: derive from heatmap map (Mon–Sun ISO week, always 7 items)
    const weeklySpending: DailySpending[] = [];
    for (let i = 0; i < 7; i++) {
      const d = dayjs(startOfWeek).add(i, 'day').format('YYYY-MM-DD');
      weeklySpending.push({ date: d, amount: heatmapMap.get(d) ?? '0' });
    }

    const currentMonthYear = now.format('YYYY-MM');

    // Only trust monthly counters if the balance row is tagged to the current month.
    // If the rollover processor missed a cycle (inactive user or job failure), the
    // counters belong to a stale month — the current month genuinely has 0 activity.
    const balanceIsCurrentMonth = balance?.monthYear === currentMonthYear;
    const ZERO = new Prisma.Decimal(0);
    const monthlyIncome = balanceIsCurrentMonth
      ? (balance?.monthlyIncome ?? ZERO)
      : ZERO;
    const monthlyExpense = balanceIsCurrentMonth
      ? (balance?.monthlyExpense ?? ZERO)
      : ZERO;
    const thisMonthNet = monthlyIncome.sub(monthlyExpense);

    // balance_change_pct: compare this month's net against the most recent archived month.
    // If the balance is stale and was never archived (rollover failed), use the stale
    // month's counters as the reference rather than silently returning 0.
    let lastMonthNet: Prisma.Decimal | null = snapshots[0]?.net ?? null;
    if (!lastMonthNet && !balanceIsCurrentMonth && balance) {
      lastMonthNet = balance.monthlyIncome.sub(balance.monthlyExpense);
    }
    let balanceChangePct = 0;
    if (lastMonthNet && !lastMonthNet.isZero()) {
      balanceChangePct = thisMonthNet
        .sub(lastMonthNet)
        .div(lastMonthNet.abs())
        .mul(100)
        .toNumber();
    }

    // monthly_series: oldest→newest, append live current month at the end.
    // Current month always uses the guarded counters above (0 if balance is stale).
    const monthlySeries = [...snapshots].reverse().map((s) => ({
      month: s.monthYear,
      income: s.income.toString(),
      expense: s.expense.toString(),
    }));
    monthlySeries.push({
      month: currentMonthYear,
      income: monthlyIncome.toString(),
      expense: monthlyExpense.toString(),
    });

    return {
      netBalance: (balance?.netBalance ?? new Prisma.Decimal(0)).toString(),
      monthlyIncome: monthlyIncome.toString(),
      monthlyExpense: monthlyExpense.toString(),
      monthlyNet: thisMonthNet.toString(),
      balanceChangePct,
      weeklySpending,
      spendingHeatmap,
      monthlySeries,
    };
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
