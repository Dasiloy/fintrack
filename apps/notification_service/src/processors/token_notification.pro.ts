import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';

import {
  EMAIL_VERIFICATION_JOB,
  FORGOT_PASSWORD_EMAIL_JOB,
  PASSWORD_CHANGE_JOB,
  EMAIL_CHANGE_JOB,
  EMAIL_CHANGED_JOB,
  TOKEN_NOTIFICATION_QUEUE,
  WELCOME_EMAIL_JOB,
  ACCOUNT_DELETION_EMAIL_JOB,
} from '@fintrack/types/constants/queus.constants';

import { NotificationService } from '../notification.service';

@Processor(TOKEN_NOTIFICATION_QUEUE)
export class TokenNotification extends WorkerHost {
  private readonly logger = new Logger(TokenNotification.name);

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.log(`${TOKEN_NOTIFICATION_QUEUE} queue is ready`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(
      `${TOKEN_NOTIFICATION_QUEUE} queue: Job ${job.id} [${job.name}] started. Data: ${JSON.stringify(job.data)}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `${TOKEN_NOTIFICATION_QUEUE} queue: ${job.name} is completed. Job ${job.id} completed. Result: ${JSON.stringify(result)}`,
    );
  }

  @OnWorkerEvent('failed')
  onFail(job: Job, err: Error) {
    this.logger.error(
      `${TOKEN_NOTIFICATION_QUEUE} queue: Job ${job.id} [${job.name}] failed: ${err.message}`,
      err.stack,
    );
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.log(
      `${TOKEN_NOTIFICATION_QUEUE} queue is drained. No more jobs to process.`,
    );
  }

  @OnWorkerEvent('error')
  onError(err: Error) {
    this.logger.error(
      `${TOKEN_NOTIFICATION_QUEUE} queue: Worker encountered an error: ${err.message}`,
      err.stack,
    );
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case EMAIL_VERIFICATION_JOB:
        return this.notificationService.sendVerificationEmail(job.data);
      case WELCOME_EMAIL_JOB:
        return this.notificationService.sendWelcomeEmail(job.data);
      case FORGOT_PASSWORD_EMAIL_JOB:
        return this.notificationService.sendForgotPasswordEmail(job.data);
      case PASSWORD_CHANGE_JOB:
        return this.notificationService.sendPasswordChangeEmail(job.data);
      case EMAIL_CHANGE_JOB:
        return this.notificationService.sendEmailChangeEmail(job.data);
      case EMAIL_CHANGED_JOB:
        return this.notificationService.sendEmailChangedEmail(job.data);
      case ACCOUNT_DELETION_EMAIL_JOB:
        return this.notificationService.sendAccountDeletionEmail(job.data);
      default:
        return;
    }
  }
}
