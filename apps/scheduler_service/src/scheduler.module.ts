import * as Joi from 'joi';
import { Queue } from 'bullmq';

import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { LoggerModule } from '@fintrack/common/logger/logger.module';
import { DatabaseModule } from '@fintrack/database/nest';
import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import { GrpcLoggingInterceptor } from '@fintrack/common/logger/grpc-logging.interceptor';
import {
  ACCOUNT_CLEANUP_QUEUE,
  PURGE_SCHEDULED_DELETIONS_JOB,
  PAYMENT_QUEUE,
  USAGE_TRACKING_QUEUE,
  PURGE_USAGE_TRACKING_JOB,
} from '@fintrack/types/constants/queus.constants';

import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';

// PROCESORS
import { CleanupProcessor } from './processors/cleanup.processor';
import { UsageProcessor } from './processors/usage_tracker.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: `.env`,
      expandVariables: true,
      validationSchema: Joi.object({
        REDIS_URL: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        DATABASE_CA_CERTIFICATE: Joi.string().required(),
        MICROSERVICE_NAME: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    LoggerModule,

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          connection: {
            url: configService.getOrThrow('REDIS_URL'),
          },
        };
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          connection: {
            url: configService.getOrThrow('REDIS_URL'),
          },
        };
      },
    }),
    BullModule.registerQueue({ name: ACCOUNT_CLEANUP_QUEUE }),
    BullModule.registerQueue({ name: USAGE_TRACKING_QUEUE }),
    BullModule.registerQueue({ name: PAYMENT_QUEUE }),
  ],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    CleanupProcessor,
    UsageProcessor,
    {
      provide: APP_GUARD,
      useClass: RpcAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GrpcLoggingInterceptor,
    },
  ],
})
export class SchedulerModule implements OnModuleInit {
  constructor(
    @InjectQueue(ACCOUNT_CLEANUP_QUEUE) private readonly cleanupQueue: Queue,
    @InjectQueue(USAGE_TRACKING_QUEUE)
    private readonly usageTrackingQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await Promise.all([
      this.cleanupQueue.add(
        PURGE_SCHEDULED_DELETIONS_JOB,
        {},
        { repeat: { pattern: '0 3 * * *' } }, // runs daily at 03:00 UTC
      ),
      this.usageTrackingQueue.add(
        PURGE_USAGE_TRACKING_JOB,
        {},
        {
          repeat: {
            // runs on the fitrst day of the month at 1:00 AM UTC
            pattern: '0 1 1 * *',
          },
        },
      ),
    ]);
  }
}
