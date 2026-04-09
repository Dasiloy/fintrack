import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaService } from './service.js';
import { redisProvider } from './redis.js';
import { REDIS_CLIENT } from '@fintrack/types/constants/redis.costants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, redisProvider],
  exports: [PrismaService, REDIS_CLIENT],
})
export class DatabaseModule {}
