import Redis from 'ioredis';

import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PrismaService } from '@fintrack/database/nest';
import { REDIS_CLIENT } from '@fintrack/types/constants/redis.costants';

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
   * Check if the API Gateway and Database are running correctly
   * @returns {Promise<void>}
   * @throws {ServiceUnavailableException} If the database connection fails
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
