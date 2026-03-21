import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { LoggerModule } from '@fintrack/common/logger/logger.module';
import { DatabaseModule } from '@fintrack/database/nest';
import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
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
        DATABASE_CA_CERTIFICATE: Joi.string().required(),
        MICROSERVICE_NAME: Joi.string().required(),
        STRIPE_WEBHOOK_SECRET: Joi.string().required(),
        STRIPE_SECRET_KEY: Joi.string().required(),
        STRIPE_PRO_MONTHLY_PRICE_ID: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    LoggerModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
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
