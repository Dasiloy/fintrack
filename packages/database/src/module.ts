import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaService } from './service.js';
import { redisProvider, redisSubscriberProvider } from './redis.js';
import {
  REDIS_CLIENT,
  REDIS_SUBSCRIBER,
} from '@fintrack/types/constants/redis.costants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, redisProvider, redisSubscriberProvider],
  exports: [PrismaService, REDIS_CLIENT, REDIS_SUBSCRIBER],
})
export class DatabaseModule {}
