import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';

import {
  ORACLE_REFRESH_JOB,
  ORACLE_REFRESH_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { InsightsOracleService } from './insights.oracle.service';

/**
 * OracleRefreshProcessor — BullMQ consumer for the `ORACLE_REFRESH_QUEUE`.
 *
 * The scheduler enqueues `ORACLE_REFRESH_JOB` hourly. This worker performs the
 * single live macro-data fetch (NGN rate, CPI, CBN rate) and writes it to Redis,
 * so insight runs and advisor chats only ever read the cache — never call a
 * third-party API on the request path.
 */
@Processor(ORACLE_REFRESH_QUEUE)
export class OracleRefreshProcessor extends WorkerHost {
  private readonly logger = new Logger(OracleRefreshProcessor.name);

  constructor(private readonly oracle: InsightsOracleService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== ORACLE_REFRESH_JOB) return;

    const ctx = await this.oracle.refreshMacroContext();
    this.logger.log(
      `[${job.id}] Macro context refreshed — NGN/USD=${ctx.ngnUsdRate}, ` +
        `foodCpiYoY=${ctx.foodCpiYoY}%, cbnRate=${ctx.cbnPolicyRate}%`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `[${job.id}] Oracle refresh failed: ${err.message} — cache retains last good value`,
    );
  }
}
