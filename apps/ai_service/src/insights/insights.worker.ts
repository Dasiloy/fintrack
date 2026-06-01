import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';

import {
  DAILY_INSIGHTS_JOB,
  INSIGHTS_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { InsightService } from './insights.service';
import { BudgetBreachService } from './budget_breach.service';
import { InsightsJobPayload } from './insights.types';

/**
 * InsightsWorker — BullMQ consumer for the `INSIGHTS_QUEUE`.
 *
 * Routes by trigger:
 *   manual        → InsightService.runGraph()   → CREATE row → FCM + email
 *   daily         → InsightService.runGraph()   → CREATE row → FCM only (loops per userId)
 *   budget_breach → BudgetBreachService.run()   → UPDATE row → FCM only
 *
 * DAILY_INSIGHTS_JOB (setup job) is skipped here — it is consumed by
 * InsightsDailyProcessor in scheduler_service which fans out per-user chunks.
 */
@Processor(INSIGHTS_QUEUE)
export class InsightsWorker extends WorkerHost {
  private readonly logger = new Logger(InsightsWorker.name);

  constructor(
    private readonly insightsService: InsightService,
    private readonly budgetBreachService: BudgetBreachService,
  ) {
    super();
  }

  async process(job: Job<InsightsJobPayload>): Promise<void> {
    // DAILY_INSIGHTS_JOB is the setup job handled by InsightsDailyProcessor (scheduler_service)
    if (job.name === DAILY_INSIGHTS_JOB) return;

    this.logger.log(
      `[${job.id}] Processing insights job — trigger=${job.data.trigger} userId=${job.data.userId ?? 'batch'}`,
    );

    switch (job.data.trigger) {
      case 'manual':
        await this.insightsService.runGraph(job.data);
        break;

      case 'daily':
        for (const userId of job.data.userIds ?? []) {
          await this.insightsService.runGraph({ trigger: 'daily', userId });
        }
        break;

      case 'budget_breach':
        await this.budgetBreachService.run(job.data);
        break;

      default:
        this.logger.warn(
          `[${job.id}] Unknown trigger: ${(job.data as any).trigger}`,
        );
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`[${job.id}] Insights job completed — name=${job.name}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `[${job.id}] Insights job failed — name=${job.name}`,
      error.stack,
    );
  }
}
