import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { LoggerModule } from '@fintrack/common/logger/logger.module';
import { DatabaseModule } from '@fintrack/database/nest';
import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import { BalanceService } from '@fintrack/common/services/balance.service';
import { GrpcLoggingInterceptor } from '@fintrack/common/logger/grpc-logging.interceptor';

import { TransactionModule } from './transaction/transaction.module';
import { BudgetModule } from './budget/budget.module';
import { RecurringModule } from './recurring/recurring.module';
import { GoalModule } from './goal/goal.module';
import { SplitModule } from './split/split.module';
import { FinnaceService } from './finnace.service';
import { FinanceController } from './finnace.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: `.env`,
      expandVariables: true,
      validationSchema: Joi.object({
        AES_KEY: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        MICROSERVICE_NAME: Joi.string().required(),
        FINANCE_SERVICE_HOST: Joi.string().required(),
        FINANCE_SERVICE_PORT: Joi.string().required(),
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

    TransactionModule,
    BudgetModule,
    RecurringModule,
    GoalModule,
    SplitModule,
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
    BalanceService,
    FinnaceService,
  ],
  controllers: [FinanceController],
})
export class FinanceModule {}
