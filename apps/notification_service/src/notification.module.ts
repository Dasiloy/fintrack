import { join } from 'path';

import * as Joi from 'joi';
import { MailtrapTransport } from 'mailtrap';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { GrpcLoggingInterceptor } from '@fintrack/common/logger/grpc-logging.interceptor';
import { BULLMQ_DEFAULT_JOB_OPTIONS } from '@fintrack/types/constants/bullmq.constants';
import {
  PAYMENT_QUEUE,
  TOKEN_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { AppController } from './notification.controller';
import { NotificationService } from './notification.service';
import { TokenNotification } from './processors/token_notification.pro';
import { PaymentNotification } from './processors/payment_notification.pro';

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
        MAIL_TOKEN: Joi.string().required(),
        MAIL_FROM: Joi.string().required(),
        MICROSERVICE_NAME: Joi.string().required(),
        NOTIFICATION_SERVICE_HOST: Joi.string().required(),
        NOTIFICATION_SERVICE_PORT: Joi.string().required(),
        MAIL_TRAP_SANDBOX_INBOX_ID: Joi.string().optional(),
        MAIL_TRAP_SANDBOX: Joi.bool().optional(),
        DB_POOL_MAX: Joi.string().optional(),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          transport: MailtrapTransport({
            token: config.getOrThrow('MAIL_TOKEN'),
            testInboxId: config.get('MAIL_TRAP_SANDBOX_INBOX_ID'),
            sandbox: config.get('MAIL_TRAP_SANDBOX'),
          }),
          defaults: {
            from: `"Fintrack" <${config.get('MAIL_FROM')}>`,
          },
          template: {
            dir: join(__dirname, '..', 'templates'),
            adapter: new HandlebarsAdapter({
              eq: (a: unknown, b: unknown) => a === b,
            }),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
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
    BullModule.registerQueue(
      { name: TOKEN_NOTIFICATION_QUEUE },
      { name: PAYMENT_QUEUE },
    ),
  ],
  controllers: [AppController],
  providers: [
    TokenNotification,
    NotificationService,
    PaymentNotification,
    {
      provide: APP_INTERCEPTOR,
      useClass: GrpcLoggingInterceptor,
    },
  ],
})
export class NotificationModule {}
