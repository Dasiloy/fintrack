import Redis from 'ioredis';

import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PrismaService } from '@fintrack/database/nest';
import {
  REDIS_CLIENT,
  MERCHANT_CACHE_KEY,
  MERCHANT_CACHE_TTL,
} from '@fintrack/types/constants/redis.costants';

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
}
