import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { LoggerModule } from '@fintrack/common/logger/logger.module';
import { PrismaModule, RedisModule } from '@fintrack/database/nest';
import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import { GrpcLoggingInterceptor } from '@fintrack/common/logger/grpc-logging.interceptor';
import { BULLMQ_DEFAULT_JOB_OPTIONS } from '@fintrack/types/constants/bullmq.constants';

import { AdvisorModule } from './advisor/advisor.module';
import { InsightsModule } from './insights/insights.module';
import { ClassificationModule } from './classification/classification.module';
import { OcrModule } from './ocr/ocr.module';
import { RegistoryModule } from './registory/registory.module';

/**
 * Root module for the AI microservice.
 *
 * Bootstraps all infrastructure and feature modules needed to serve AI
 * capabilities over gRPC:
 *
 * ## Infrastructure
 * - **ConfigModule** — validates required env vars at startup (`REDIS_URL`,
 *   `DATABASE_URL`, provider API keys, service bind address, and Finance gRPC
 *   target). Fails fast if any are absent.
 * - **DatabaseModule** — Prisma client, used by classification and correction features.
 * - **BullModule** — Redis-backed job queue, shared with other services via the same
 *   `REDIS_URL`. Consumers registered in feature modules pick up cross-service jobs.
 * - **RpcAuthGuard** (APP_GUARD) — validates JWT on every incoming gRPC call using
 *   the `x-user-id` metadata header set by the API gateway.
 * - **GrpcLoggingInterceptor** (APP_INTERCEPTOR) — structured request/response logging.
 *
 * ## Feature modules
 * | Module              | Responsibility                                         |
 * |---------------------|--------------------------------------------------------|
 * | RegistoryModule     | Provider repos + ModelRessolver + LangChain/LangGraph  |
 * | ClassificationModule| `ClassifyTransactions` gRPC + correction feedback loop |
 * | AdvisorModule       | AI financial advisor (stub — not yet exposed via gRPC) |
 * | InsightsModule      | Spending insights (stub — not yet exposed via gRPC)    |
 */
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
        OPENAI_API_KEY: Joi.string().required(),
        ANTHROPIC_API_KEY: Joi.string().required(),
        GOOGLE_GEN_AI_API_KEY: Joi.string().required(),
        AI_SERVICE_HOST: Joi.string().required(),
        AI_SERVICE_PORT: Joi.string().required(),
        FINANCE_SERVICE_HOST: Joi.string().required(),
        FINANCE_SERVICE_PORT: Joi.string().required(),
        ALPHA_VANTAGE_API_KEY: Joi.string().required(),
        DB_POOL_MAX: Joi.string().optional(),
      }),
    }),
    PrismaModule,
    RedisModule,
    LoggerModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          connection: {
            url: configService.getOrThrow('REDIS_URL'),
          },
          defaultJobOptions: BULLMQ_DEFAULT_JOB_OPTIONS,
        };
      },
    }),

    // main modules
    RegistoryModule,
    AdvisorModule,
    InsightsModule,
    ClassificationModule,
    OcrModule,
  ],
  providers: [
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
export class AiModule {}
