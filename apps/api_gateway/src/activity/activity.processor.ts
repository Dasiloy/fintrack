import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import {
  ACTIVITY_NOTIFICATION_JOB,
  ACTIVITY_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { ActivityService } from './activity.service';

/**
 * ActivityProcessor.
 */
@Processor(ACTIVITY_NOTIFICATION_QUEUE)
export class ActivityProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivityProcessor.name);

  constructor(private readonly activityService: ActivityService) {
    super();
  }

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.log(`${ACTIVITY_NOTIFICATION_QUEUE} queue is ready`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(
      `${ACTIVITY_NOTIFICATION_QUEUE} queue: ${job.name} is active`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `${ACTIVITY_NOTIFICATION_QUEUE} queue: ${job.name} is completed`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.log(
      `${ACTIVITY_NOTIFICATION_QUEUE} queue: ${job.name} is failed`,
    );
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.log(`${ACTIVITY_NOTIFICATION_QUEUE} queue is drained`);
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`${ACTIVITY_NOTIFICATION_QUEUE} queue: ${error.message}`);
  }

  @OnWorkerEvent('closed')
  onClosed() {
    this.logger.log(`${ACTIVITY_NOTIFICATION_QUEUE} queue is closed`);
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case ACTIVITY_NOTIFICATION_JOB:
        return this.activityService.notifyActivity(job.data);
      default:
        return;
    }
  }
}
