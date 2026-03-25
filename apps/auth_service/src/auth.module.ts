import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { GrpcLoggingInterceptor } from '@fintrack/common/logger/grpc-logging.interceptor';
import { DatabaseModule } from '@fintrack/database/nest';
import {
  getServiceConfig,
  getServiceUrl,
} from '@fintrack/common/config/services';
import {
  TOKEN_NOTIFICATION_QUEUE,
  ACCOUNT_CLEANUP_QUEUE,
  PAYMENT_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

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
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_OTP_SECRET: Joi.string().required(),
        OTP_EXPIRY_MINUTES: Joi.number().required(),
        MAX_LOGIN_ATTEMPTS: Joi.number().required(),
        JWT_ACCESS_TOKEN_EXPIRATION: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRATION: Joi.string().required(),
        JWT_OTP_TOKEN_EXPIRATION: Joi.string().required(),
        JWT_2FA_SECRET: Joi.string().required(),
        JWT_2FA_TOKEN_EXPIRATION: Joi.string().required(),
        AUTH_GOOGLE_ID: Joi.string().required(),
        AES_KEY: Joi.string().required(),
        MICROSERVICE_NAME: Joi.string().required(),
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          global: true,
          secret: configService.getOrThrow('JWT_SECRET'),
          verifyOptions: {
            complete: true,
            ignoreExpiration: false,
          },
          signOptions: {
            expiresIn: configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION'),
          },
        };
      },
    }),
    // Register Microservices
    ClientsModule.registerAsync({
      isGlobal: true,
      clients: [
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
    BullModule.registerQueue({ name: TOKEN_NOTIFICATION_QUEUE }),
    BullModule.registerQueue({ name: ACCOUNT_CLEANUP_QUEUE }),
    BullModule.registerQueue({ name: PAYMENT_QUEUE }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_INTERCEPTOR,
      useClass: GrpcLoggingInterceptor,
    },
  ],
})
export class AuthModule {}
