import * as Joi from 'joi';

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { DeviceMiddleware } from './middleware/device.middleware';

import {
  getServiceUrl,
  getServiceConfig,
} from '@fintrack/common/config/services';
import { LoggerModule } from '@fintrack/common/logger/logger.module';
import { DatabaseModule } from '@fintrack/database/nest';

import { AppExceptionFilter } from './filters/rpc-exception.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/// MODULES
import { AuthModule } from './auth/auth.module';
import { PaymentModule } from './payment/payment.module';
import { UploadModule } from './upload/upload.module';

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
        REDIS_URL: Joi.string().required(),
        AUTH_GOOGLE_ID: Joi.string().required(),
        AUTH_GOOGLE_SECRET: Joi.string().required(),
        API_GATEWAY_PORT: Joi.string().required(),
        API_GATEWAY_HOST: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        DATABASE_CA_CERTIFICATE: Joi.string().required(),
        NEXT_PUBLIC_APP_URL: Joi.string().required(),
        CLOUDINARY_URL: Joi.string().required(),
        CLOUDINARY_SIGNATURE_EXPIRATION: Joi.string().required(),
        SWAGGER_DOC_USER: Joi.string().required(),
        SWAGGER_DOC_PASS: Joi.string().required(),
        AUTH_SERVICE_HOST: Joi.string().required(),
        AUTH_SERVICE_PORT: Joi.string().required(),
        PAYMENT_SERVICE_HOST: Joi.string().required(),
        PAYMENT_SERVICE_PORT: Joi.string().required(),
        NOTIFICATION_SERVICE_HOST: Joi.string().required(),
        NOTIFICATION_SERVICE_PORT: Joi.string().required(),
        STRIPE_WEBHOOK_SECRET: Joi.string().required(),
      }),
    }),

    // Register Microservices
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
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: false,
      }),
    },
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DeviceMiddleware).forRoutes('*');
  }
}
