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
}
