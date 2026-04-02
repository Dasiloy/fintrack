import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import {
  FCM_NOTIFICATION_JOB,
  FCM_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { FcmService } from './fcm.service';

/**
 * FcmProcessor.
 */
@Processor(FCM_NOTIFICATION_QUEUE)
export class FcmProcessor extends WorkerHost {
  private readonly logger = new Logger(FcmProcessor.name);

  constructor(private readonly fcmService: FcmService) {
    super();
  }

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.log(`${FCM_NOTIFICATION_QUEUE} queue is ready`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`${FCM_NOTIFICATION_QUEUE} queue: ${job.name} is active`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `${FCM_NOTIFICATION_QUEUE} queue: ${job.name} is completed`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.log(`${FCM_NOTIFICATION_QUEUE} queue: ${job.name} is failed`);
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.log(`${FCM_NOTIFICATION_QUEUE} queue is drained`);
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`${FCM_NOTIFICATION_QUEUE} queue: ${error.message}`);
  }

  @OnWorkerEvent('closed')
  onClosed() {
    this.logger.log(`${FCM_NOTIFICATION_QUEUE} queue is closed`);
  }

  async process(job: Job): Promise<any> {
    this.logger.log(
      `${FCM_NOTIFICATION_QUEUE} queue: ${job.name} is processing`,
    );
    switch (job.name) {
      case FCM_NOTIFICATION_JOB:
        return this.fcmService.sendToUser(job.data);
      default:
        return;
    }
  }
}
