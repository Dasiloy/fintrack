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
import { DatabaseModule } from '@fintrack/database/nest';
import { TOKEN_NOTIFICATION_QUEUE } from '@fintrack/types/constants/queus.constants';

import { AppController } from './notification.controller';
import { NotificationService } from './notification.service';
import { TokenNotification } from './processors/token_notification.pro';

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
        MAIL_TOKEN: Joi.string().required(),
        MAIL_FROM: Joi.string().required(),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: MailtrapTransport({
          token: config.getOrThrow('MAIL_TOKEN'),
        }),
        defaults: {
          from: `"Fintrack" <${config.get('MAIL_FROM')}>`,
        },
        template: {
          dir: join(__dirname, '..', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
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
  controllers: [AppController],
  providers: [
    TokenNotification,
    NotificationService,
    {
      provide: APP_INTERCEPTOR,
      useClass: GrpcLoggingInterceptor,
    },
  ],
})
export class NotificationModule {}
