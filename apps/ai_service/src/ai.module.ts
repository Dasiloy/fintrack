import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { LoggerModule } from '@fintrack/common/logger/logger.module';
import { DatabaseModule } from '@fintrack/database/nest';
import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import { GrpcLoggingInterceptor } from '@fintrack/common/logger/grpc-logging.interceptor';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';

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
        OPENAI_API_KEY: Joi.string().required(),
        OPENAI_API_BASE: Joi.string().required(),
        OPENAI_API_MODEL: Joi.string().required(),
        OPENAI_API_VERSION: Joi.string().required(),
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
  ],
  controllers: [AiController],
  providers: [
    AiService,
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
