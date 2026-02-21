import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';

import { GrpcLoggingInterceptor } from '@fintrack/common/logger/grpc-logging.interceptor';
import { DatabaseModule } from '@fintrack/database/nest';
import { TOKEN_NOTIFICATION_QUEUE } from '@fintrack/types/constants/queus.constants';

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
        AUTH_SECRET: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_OTP_SECRET: Joi.string().required(),
        OTP_EXPIRY_MINUTES: Joi.number().required(),
        MAX_LOGIN_ATTEMPTS: Joi.number().required(),
        JWT_ACCESS_TOKEN_EXPIRATION: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRATION: Joi.string().required(),
        JWT_OTP_TOKEN_EXPIRATION: Joi.string().required(),
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          global: true,
          secret: configService.getOrThrow('AUTH_SECRET'),
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
    BullModule.registerQueue({
      name: TOKEN_NOTIFICATION_QUEUE,
    }),
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
