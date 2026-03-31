import { Queue } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import {
  ACCOUNT_CLEANUP_QUEUE,
  PURGE_SCHEDULED_DELETIONS_JOB,
  PURGE_USAGE_TRACKING_JOB,
  USAGE_TRACKING_QUEUE,
} from '@fintrack/types/constants/queus.constants';

/**
 * SchedulerService.
 */
@Injectable()
export class SchedulerService {
  constructor(
    @InjectQueue(ACCOUNT_CLEANUP_QUEUE) private readonly cleanupQueue: Queue,
    @InjectQueue(USAGE_TRACKING_QUEUE)
    private readonly usageTrackingQueue: Queue,
  ) {}

  @Cron('0 3 * * *') // 3:am everyday
  purgeScheduledAccountDeletion() {
    this.cleanupQueue.add(
      PURGE_SCHEDULED_DELETIONS_JOB,
      {},
      {
        jobId: PURGE_SCHEDULED_DELETIONS_JOB,
      },
    );
  }

  @Cron('0 1 1 * *') // 1:00am on the first day of the month
  cleanupUsageTrackers() {
    this.usageTrackingQueue.add(
      PURGE_USAGE_TRACKING_JOB,
      {},
      {
        jobId: PURGE_USAGE_TRACKING_JOB,
      },
    );
  }
}
