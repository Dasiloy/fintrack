import * as Joi from 'joi';
import { Queue } from 'bullmq';

import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { LoggerModule } from '@fintrack/common/logger/logger.module';
import { DatabaseModule } from '@fintrack/database/nest';
import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import {
  PAYMENT_QUEUE,
  PURGE_USAGE_TRACKING_JOB,
  USAGE_TRACKING_QUEUE,
} from '@fintrack/types/constants/queus.constants';
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
    BullModule.registerQueue({ name: USAGE_TRACKING_QUEUE }),
    BullModule.registerQueue({ name: PAYMENT_QUEUE }),
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
export class PaymentModule implements OnModuleInit {
  constructor(
    @InjectQueue(USAGE_TRACKING_QUEUE)
    private readonly usageTrackingQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.usageTrackingQueue.add(
      PURGE_USAGE_TRACKING_JOB,
      {},
      {
        repeat: {
          // runs on the fitrst day of the month at 1:00 AM UTC
          pattern: '0 1 1 * *',
        },
      },
    );
  }
}
