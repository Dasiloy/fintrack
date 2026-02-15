import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClientsModule, Transport } from '@nestjs/microservices';

import {
  getServiceUrl,
  getServiceConfig,
} from '@fintrack/common/config/services';
import { LoggerModule } from '@fintrack/common/logger/logger.module';
import { DatabaseModule } from '@fintrack/database/index';

import { AppExceptionFilter } from './filters/rpc-exception.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/// MODULES
import { AuthModule } from './auth/auth.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: `.env`,
      expandVariables: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
      }),
    }),
    ClientsModule.registerAsync({
      isGlobal: true,
      clients: [
        {
          name: getServiceConfig()['AUTH_SERVICE'].PACKAGE_NAME,
          useFactory: async () => {
            const config = getServiceConfig()['AUTH_SERVICE'];
            return {
              transport: Transport.GRPC,
              options: {
                package: config.NAME,
                url: getServiceUrl('AUTH_SERVICE'),
                protoPath: require.resolve(config.PROTO_PATH),
              },
            };
          },
        },
        {
          name: getServiceConfig()['PAYMENT_SERVICE'].PACKAGE_NAME,
          useFactory: async () => {
            const config = getServiceConfig()['PAYMENT_SERVICE'];
            return {
              transport: Transport.GRPC,
              options: {
                package: config.NAME,
                url: getServiceUrl('PAYMENT_SERVICE'),
                protoPath: require.resolve(config.PROTO_PATH),
              },
            };
          },
        },
      ],
    }),
    DatabaseModule,
    LoggerModule,

    /// APP MODULES
    AuthModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
