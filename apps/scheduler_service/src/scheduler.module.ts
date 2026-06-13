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
  ANALYTICS_AGGREGATION_QUEUE,
  BALANCE_ROLLOVER_QUEUE,
  BUDGET_CHECK_QUEUE,
  FCM_NOTIFICATION_QUEUE,
  INSIGHTS_QUEUE,
  PAYMENT_QUEUE,
  RECURRING_QUEUE,
  TOKEN_NOTIFICATION_QUEUE,
  TRANSACTION_SEMANTIC_QUEUE,
  USAGE_TRACKING_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { SchedulerService } from './scheduler.service';
import { BalanceService } from '@fintrack/common/services/balance.service';

// PROCESORS
import { CleanupProcessor } from './processors/cleanup.processor';
import { UsageProcessor } from './processors/usage_tracker.processor';
import { RecurringProcessor } from './processors/recurring.processor';
import { BalanceRolloverProcessor } from './processors/balance_rollover.processor';
import { AnalyticsAggregationProcessor } from './processors/analytics_aggregation.processor';
import { InsightsDailyProcessor } from './processors/insights_daily.processor';

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
        MICROSERVICE_NAME: Joi.string().required(),
        SCHEDULER_SERVICE_HOST: Joi.string().required(),
        SCHEDULER_SERVICE_PORT: Joi.string().required(),
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
      { name: BALANCE_ROLLOVER_QUEUE },
      { name: ANALYTICS_AGGREGATION_QUEUE },
      { name: INSIGHTS_QUEUE },
      { name: BUDGET_CHECK_QUEUE },
      { name: TRANSACTION_SEMANTIC_QUEUE },
      { name: FCM_NOTIFICATION_QUEUE },
    ),
  ],
  providers: [
    BalanceService,
    SchedulerService,
    CleanupProcessor,
    UsageProcessor,
    RecurringProcessor,
    BalanceRolloverProcessor,
    AnalyticsAggregationProcessor,
    InsightsDailyProcessor,
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
