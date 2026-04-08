import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { LoggerModule } from '@fintrack/common/logger/logger.module';
import { DatabaseModule } from '@fintrack/database/nest';
import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import { GrpcLoggingInterceptor } from '@fintrack/common/logger/grpc-logging.interceptor';
import {
  ACCOUNT_CLEANUP_QUEUE,
  PAYMENT_QUEUE,
  RECURRING_QUEUE,
  TOKEN_NOTIFICATION_QUEUE,
  USAGE_TRACKING_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';

// PROCESORS
import { CleanupProcessor } from './processors/cleanup.processor';
import { UsageProcessor } from './processors/usage_tracker.processor';
import { RecurringProcessor } from './processors/recurring.processor';

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
    ScheduleModule.forRoot({}),
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
    BullModule.registerQueue(
      { name: ACCOUNT_CLEANUP_QUEUE },
      { name: USAGE_TRACKING_QUEUE },
      { name: PAYMENT_QUEUE },
      { name: RECURRING_QUEUE },
      { name: TOKEN_NOTIFICATION_QUEUE },
    ),
  ],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    CleanupProcessor,
    UsageProcessor,
    RecurringProcessor,
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
export class SchedulerModule {}
