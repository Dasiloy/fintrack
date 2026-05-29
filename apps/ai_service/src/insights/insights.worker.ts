import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';

import {
  INSIGHTS_JOB,
  INSIGHTS_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { InsightService } from './insights.service';
import { InsightsJobPayload } from './insights.types';

/**
 * InsightsWorker — BullMQ consumer for the `INSIGHTS_QUEUE`.
 *
 * Every trigger path (scheduler daily cron, post-sync hook, budget breach)
 * enqueues an `INSIGHTS_JOB` with an `InsightsJobPayload`. This worker
 * consumes it and delegates to `InsightService.runGraph()` which runs the
 * full LangGraph insights pipeline and persists the result.
 */
@Processor(INSIGHTS_QUEUE)
export class InsightsWorker extends WorkerHost {
  private readonly logger = new Logger(InsightsWorker.name);

  constructor(private readonly insightsService: InsightService) {
    super();
  }

  async process(
    job: Job<InsightsJobPayload, void, typeof INSIGHTS_JOB>,
  ): Promise<void> {
    this.logger.log(
      `[${job.id}] Processing insights job — userId=${job.data.userId} trigger=${job.data.trigger}`,
    );
    await this.insightsService.runGraph(job.data);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`[${job.id}] Insights job completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`[${job.id}] Insights job failed`, error.stack);
  }
}
