import { Redis } from 'ioredis';

import { ConfigService } from '@nestjs/config';

import { REDIS_CLIENT } from '@fintrack/types/constants/redis.costants';

export const redisProvider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Redis =>
    new Redis(config.getOrThrow('REDIS_URL'), {
      maxRetriesPerRequest: null,
    }),
};
