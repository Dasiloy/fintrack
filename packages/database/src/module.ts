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
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisProvider],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisSubscriberProvider],
  exports: [REDIS_SUBSCRIBER],
})
export class RedisSubscriberModule {}

@Global()
@Module({
  imports: [PrismaModule, RedisModule, RedisSubscriberModule],
  exports: [PrismaModule, RedisModule, RedisSubscriberModule],
})
export class DatabaseModule {}
