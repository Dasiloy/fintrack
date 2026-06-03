import Redis from 'ioredis';
import { Queue } from 'bullmq';

import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/nest';
import {
  REDIS_CLIENT,
  MERCHANT_CACHE_KEY,
  MERCHANT_CACHE_TTL,
} from '@fintrack/types/constants/redis.costants';
import {
  TRANSACTION_SEMANTIC_JOB,
  TRANSACTION_SEMANTIC_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { TransactionSematicJob } from '@fintrack/types/interfaces/finance';
import {
  Category,
  Transaction,
  TransactionType,
  User,
} from '@fintrack/database/types';

/**
 * Service responsible for handling the health check of the API Gateway
 *
 * @class AppService
 */
@Injectable()
export class AppService {
  private logger = new Logger(AppService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue(TRANSACTION_SEMANTIC_QUEUE)
    private readonly semanticQueue: Queue,
  ) {}

  /**
   * @description Returns all merchants from cache or database, writing through to Redis on a cache miss.
   * Cache is fire-and-forget — a Redis failure does not block the response.
   *
   * @async
   * @public
   * @returns {Promise<{ id: string; name: string; aliases: string[] }[]>} Merchant list ordered by name
   */
  async getMerchants(): Promise<
    { id: string; name: string; aliases: string[] }[]
  > {
    try {
      const cached = await this.redis.get(MERCHANT_CACHE_KEY);
      if (cached) return JSON.parse(cached);

      const merchants = await this.prismaService.merchant.findMany({
        select: { id: true, name: true, aliases: true },
        orderBy: { name: 'asc' },
      });

      this.redis
        .setex(
          MERCHANT_CACHE_KEY,
          MERCHANT_CACHE_TTL,
          JSON.stringify(merchants),
        )
        .catch(() => {});
      return merchants;
    } catch (error) {
      this.logger.log(error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('An error occured');
    }
  }

  // ================================================================
  //. Health Check
  // ================================================================

  /**
   * @description Probes PostgreSQL and Redis connectivity concurrently and throws if either is unavailable.
   *
   * @async
   * @public
   * @returns {Promise<void>}
   * @throws {ServiceUnavailableException} If either the database or Redis ping fails
   */
  async getHealth() {
    try {
      const [pg, redis] = await Promise.allSettled([
        this.prismaService.$queryRaw`SELECT 1`,
        this.redis.ping(),
      ]);

      const isOk =
        pg.status === 'fulfilled' &&
        redis.status === 'fulfilled' &&
        redis.value === 'PONG';

      if (!isOk)
        throw new ServiceUnavailableException('Database connection failed');
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('Database connection failed');
    }
  }

  // ================================================================
  //. Transaction Semantic Queue
  // ================================================================

  async updateSemantics(): Promise<any> {
    try {
      const transactions = await this.prismaService.$queryRaw<
        (Transaction & { category: Category; user: User })[]
      >`
          SELECT t.*,
                 row_to_json(c) AS category,
                 row_to_json(u) AS user
          FROM "Transaction" AS t
          INNER JOIN "Category" AS c ON t."categoryId" = c."id"
          INNER JOIN "User" AS u ON t."userId" = u."id"
          WHERE t."embedding" IS NULL;
`;

      const userTransactionMap = new Map<
        string,
        (Transaction & { category: Category })[]
      >();

      for (const tx of transactions) {
        if (!tx.userId) {
          continue;
        }

        const userTxs = userTransactionMap.get(tx.userId) ?? [];

        userTransactionMap.set(tx.userId, [...userTxs, tx]);
      }

      // user loop
      for (const user of userTransactionMap.entries()) {
        const [userId, transactions] = user;

        await this.semanticQueue.add(TRANSACTION_SEMANTIC_JOB, {
          userId,
          transactions: transactions.map((tx) => ({
            id: tx.id,
            date: tx.date,
            type: tx.type,
            amount: tx.amount,
            description:
              tx.description! || tx.type === 'EXPENSE'
                ? 'Expense transaction'
                : 'Income from salalry',
            narration: tx.narration!,
            categoryName: tx.category.name,
          })),
        } satisfies TransactionSematicJob);
      }

      return transactions;
    } catch (error) {
      this.logger.error(`Semantic Transaction : ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('Could not begin semantic queu ');
    }
  }

  // ================================================================
  //. Resolve Balances
  // ================================================================

  async resolveBalances(): Promise<{ processed: number; failed: number }> {
    try {
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const userBalances = await this.prismaService.userBalance.findMany({
        select: { userId: true },
      });

      let processed = 0;
      let failed = 0;

      for (const { userId } of userBalances) {
        try {
          await this.prismaService.$transaction(async (tx) => {
            type MonthRow = {
              monthYear: string;
              type: string;
              total: string;
            };

            // One query: all-time totals + per-month breakdown (no future months)
            const [allTime, monthlyRows] = await Promise.all([
              tx.transaction.groupBy({
                by: ['type'],
                where: { userId },
                _sum: { amount: true },
              }),
              tx.$queryRaw<MonthRow[]>`
                SELECT
                  TO_CHAR(date, 'YYYY-MM') AS "monthYear",
                  type,
                  SUM(amount)::text         AS total
                FROM "Transaction"
                WHERE "userId" = ${userId}
                  AND TO_CHAR(date, 'YYYY-MM') <= ${thisMonth}
                GROUP BY TO_CHAR(date, 'YYYY-MM'), type
                ORDER BY "monthYear"
              `,
            ]);

            const pick = (rows: typeof allTime, type: string) =>
              rows.find((r) => r.type === type)?._sum?.amount ?? 0;

            const totalIncome = pick(allTime, TransactionType.INCOME);
            const totalExpense = pick(allTime, TransactionType.EXPENSE);
            const netBalance = Number(totalIncome) - Number(totalExpense);

            // Build per-month map from raw aggregates
            const monthMap = new Map<
              string,
              { income: number; expense: number }
            >();
            for (const row of monthlyRows) {
              const entry = monthMap.get(row.monthYear) ?? {
                income: 0,
                expense: 0,
              };
              if (row.type === TransactionType.INCOME)
                entry.income += Number(row.total);
              else entry.expense += Number(row.total);
              monthMap.set(row.monthYear, entry);
            }

            const curr = monthMap.get(thisMonth) ?? { income: 0, expense: 0 };

            await tx.userBalance.upsert({
              where: { userId },
              update: {
                totalIncome,
                totalExpense,
                netBalance,
                monthlyIncome: curr.income,
                monthlyExpense: curr.expense,
                monthYear: thisMonth,
              },
              create: {
                userId,
                totalIncome,
                totalExpense,
                netBalance,
                monthlyIncome: curr.income,
                monthlyExpense: curr.expense,
                monthYear: thisMonth,
              },
            });

            // Upsert a snapshot for every month from first tx to now
            for (const [monthYear, { income, expense }] of monthMap.entries()) {
              await tx.monthlyBalanceSnapshot.upsert({
                where: { userId_monthYear: { userId, monthYear } },
                update: { income, expense, net: income - expense },
                create: {
                  userId,
                  monthYear,
                  income,
                  expense,
                  net: income - expense,
                },
              });
            }
          });

          processed++;
        } catch (err) {
          this.logger.error(`resolveBalances userId=${userId}: ${err.message}`);
          failed++;
        }
      }

      return { processed, failed };
    } catch (error) {
      this.logger.error(`resolveBalances: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('Could not resolve balances');
    }
  }
}
