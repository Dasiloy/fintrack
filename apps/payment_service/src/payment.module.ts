import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { LoggerModule } from '@fintrack/common/logger/logger.module';
import { PrismaModule } from '@fintrack/database/nest';
import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import { PaystackService } from '@fintrack/common/services/paystack.service';
import { FetcherService } from '@fintrack/common/services/fetcher.service';
import { BULLMQ_DEFAULT_JOB_OPTIONS } from '@fintrack/types/constants/bullmq.constants';
import { PAYMENT_QUEUE } from '@fintrack/types/constants/queus.constants';
import { EncryptionService } from '@fintrack/common/services/encryption.service';
import { GrpcLoggingInterceptor } from '@fintrack/common/logger/grpc-logging.interceptor';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

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
        AES_KEY: Joi.string().required(),
        MICROSERVICE_NAME: Joi.string().required(),
        PAYSTACK_PRO_MONTHLY_PRICE_ID: Joi.string().required(),
        PAYSTACK_SECRET_KEY: Joi.string().required(),
        PAYMENT_SERVICE_HOST: Joi.string().required(),
        PAYMENT_SERVICE_PORT: Joi.string().required(),
        DB_POOL_MAX: Joi.string().optional(),
      }),
    }),
    PrismaModule,
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
    BullModule.registerQueue({ name: PAYMENT_QUEUE }),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    FetcherService,
    PaystackService,
    EncryptionService,
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
export class PaymentModule {}
