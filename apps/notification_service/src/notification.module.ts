import { join } from 'path';

import * as Joi from 'joi';

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
        MAIL_TRAP_HOST: Joi.string().required(),
        MAIL_TRAP_PORT: Joi.number().required(),
        MAIL_TRAP_USER: Joi.string().required(),
        MAIL_TRAP_PASS: Joi.string().required(),
        MAIL_FROM: Joi.string().required(),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.getOrThrow('MAIL_TRAP_HOST'),
          port: config.getOrThrow('MAIL_TRAP_PORT'),
          auth: {
            user: config.getOrThrow('MAIL_TRAP_USER'),
            pass: config.getOrThrow('MAIL_TRAP_PASS'),
          },
        },
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
