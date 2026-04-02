import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';

import {
  CREATE_CHECKOUT_SESSION_JOB,
  INVOICE_PAID_JOB,
  INVOICE_PAYMENT_FAILED_JOB,
  SUBSCRIPTION_ACTIVATED_JOB,
  SUBSCRIPTION_DEACTIVATED_JOB,
  SUBSCRIPTION_DELETED_JOB,
  PAYMENT_QUEUE,
  NEW_USAGE_TRACKERS_CREATED_JOB,
} from '@fintrack/types/constants/queus.constants';

import { NotificationService } from '../notification.service';

/**
 * PaymentNotification.
 */
@Processor(PAYMENT_QUEUE)
export class PaymentNotification extends WorkerHost {
  private readonly logger = new Logger(PaymentNotification.name);

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.log(`${PAYMENT_QUEUE} queue is ready`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(
      `${PAYMENT_QUEUE} queue: Job ${job.id} [${job.name}] started. Data: ${JSON.stringify(job.data)}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `${PAYMENT_QUEUE} queue: ${job.name} is completed. Job ${job.id} completed. Result: ${JSON.stringify(result)}`,
    );
  }

  @OnWorkerEvent('failed')
  onFail(job: Job, err: Error) {
    this.logger.error(
      `${PAYMENT_QUEUE} queue: Job ${job.id} [${job.name}] failed: ${err.message}`,
      err.stack,
    );
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.log(
      `${PAYMENT_QUEUE} queue is drained. No more jobs to process.`,
    );
  }

  @OnWorkerEvent('error')
  onError(err: Error) {
    this.logger.error(
      `${PAYMENT_QUEUE} queue: Worker encountered an error: ${err.message}`,
      err.stack,
    );
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case CREATE_CHECKOUT_SESSION_JOB:
        return this.notificationService.sendCheckoutSessionEmail(job.data);
      case INVOICE_PAID_JOB:
        return this.notificationService.sendInvoicePaidEmail(job.data);
      case INVOICE_PAYMENT_FAILED_JOB:
        return this.notificationService.sendPaymentFailedEmail(job.data);
      case SUBSCRIPTION_ACTIVATED_JOB:
        return this.notificationService.sendSubscriptionActivatedEmail(
          job.data,
        );
      case SUBSCRIPTION_DEACTIVATED_JOB:
        return this.notificationService.sendSubscriptionCancelledEmail(
          job.data,
        );
      case NEW_USAGE_TRACKERS_CREATED_JOB:
        return this.notificationService.sendAccountDeletionEmail(job.data);
      case SUBSCRIPTION_DELETED_JOB:
        return this.notificationService.sendSubscriptionEndedEmail(job.data);
      default:
        return;
    }
  }
}
