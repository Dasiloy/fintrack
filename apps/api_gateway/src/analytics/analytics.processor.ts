import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import {
  ANALYTICS_NOTIFICATION_JOB,
  ANALYTICS_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { AnalyticsService } from './analytics.service';

/**
 * AnalyticsProcessor.
 */
@Processor(ANALYTICS_NOTIFICATION_QUEUE)
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private readonly analyticsService: AnalyticsService) {
    super();
  }

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.log(`${ANALYTICS_NOTIFICATION_QUEUE} queue is ready`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(
      `${ANALYTICS_NOTIFICATION_QUEUE} queue: ${job.name} is active`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `${ANALYTICS_NOTIFICATION_QUEUE} queue: ${job.name} is completed`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.log(
      `${ANALYTICS_NOTIFICATION_QUEUE} queue: ${job.name} is failed`,
    );
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.log(`${ANALYTICS_NOTIFICATION_QUEUE} queue is drained`);
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(
      `${ANALYTICS_NOTIFICATION_QUEUE} queue: ${error.message}`,
    );
  }

  @OnWorkerEvent('closed')
  onClosed() {
    this.logger.log(`${ANALYTICS_NOTIFICATION_QUEUE} queue is closed`);
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case ANALYTICS_NOTIFICATION_JOB:
        return this.analyticsService.notifyAnalytics(job.data);
      default:
        return;
    }
  }
}
