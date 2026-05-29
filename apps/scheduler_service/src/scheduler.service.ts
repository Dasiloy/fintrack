import { Queue } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import {
  ACCOUNT_CLEANUP_QUEUE,
  ANALYTICS_AGGREGATION_JOB,
  ANALYTICS_AGGREGATION_QUEUE,
  BALANCE_ROLLOVER_JOB,
  BALANCE_ROLLOVER_QUEUE,
  CREATE_RECURRING_TRANSACTION,
  INSIGHTS_QUEUE,
  PURGE_SCHEDULED_DELETIONS_JOB,
  PURGE_USAGE_TRACKING_JOB,
  RECURRING_QUEUE,
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
    @InjectQueue(RECURRING_QUEUE) private readonly reccuringQueue: Queue,
    @InjectQueue(BALANCE_ROLLOVER_QUEUE)
    private readonly balanceRolloverQueue: Queue,
    @InjectQueue(ANALYTICS_AGGREGATION_QUEUE)
    private readonly analyticsAggregationQueue: Queue,
    @InjectQueue(INSIGHTS_QUEUE)
    private readonly insightsQueue: Queue,
  ) {}

  @Cron('0 3 * * *') // 3:am everyday
  purgeScheduledAccountDeletion() {
    void this.cleanupQueue.add(
      PURGE_SCHEDULED_DELETIONS_JOB,
      { removeOnComplete: true, removeOnFail: false },
      { jobId: PURGE_SCHEDULED_DELETIONS_JOB },
    );
  }

  @Cron('0 * * * *') // Runs every hour
  createRecurringTransactions() {
    void this.reccuringQueue.add(
      CREATE_RECURRING_TRANSACTION,
      {},
      {
        jobId: CREATE_RECURRING_TRANSACTION,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  @Cron('0 1 1 * *') // 1:00am on the first day of the month
  cleanupUsageTrackers() {
    void this.usageTrackingQueue.add(
      PURGE_USAGE_TRACKING_JOB,
      {},
      {
        jobId: PURGE_USAGE_TRACKING_JOB,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  @Cron('1 0 1 * *') // 12:01am on the first day of the month
  rolloverBalances() {
    void this.balanceRolloverQueue.add(
      BALANCE_ROLLOVER_JOB,
      {},
      {
        jobId: BALANCE_ROLLOVER_JOB,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  @Cron('0 2 * * *') // 2:00am every day — after balance rollover (12:01am on 1st)
  aggregateAnalytics() {
    void this.analyticsAggregationQueue.add(
      ANALYTICS_AGGREGATION_JOB,
      {},
      {
        jobId: ANALYTICS_AGGREGATION_JOB,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  // @Cron('0 4 * * *') // 4:00am every day — after aggregate analytics
  // generateUsersInsights() {
  //   void this.analyticsAggregationQueue.add(
  //     ANALYTICS_AGGREGATION_JOB,
  //     {},
  //     {
  //       jobId: ANALYTICS_AGGREGATION_JOB,
  //       removeOnComplete: true,
  //       removeOnFail: false,
  //     },
  //   );
  // }
}
