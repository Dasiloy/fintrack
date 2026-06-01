import { Queue, Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/service';
import { InsightTrigger } from '@fintrack/database/types';
import {
  DAILY_INSIGHTS_JOB,
  INSIGHTS_JOB,
  INSIGHTS_QUEUE,
} from '@fintrack/types/constants/queus.constants';

@Processor(INSIGHTS_QUEUE)
export class InsightsDailyProcessor extends WorkerHost {
  private readonly logger = new Logger(InsightsDailyProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(INSIGHTS_QUEUE) private readonly insightsQueue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== DAILY_INSIGHTS_JOB) return;
    await this.processDailyInsights();
  }

  private async processDailyInsights(): Promise<void> {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Active users: had a transaction in the last 30 days and no DAILY insight today
    const usersWithActivity = await this.prisma.transaction.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      select: { userId: true },
      distinct: ['userId'],
    });

    const activeUserIds = usersWithActivity
      .map((r) => r.userId)
      .filter((id) => id !== null);

    if (activeUserIds.length === 0) {
      this.logger.log('No active users for daily insights');
      return;
    }

    // Exclude users who already have a DAILY insight generated today
    const alreadyNotified = await this.prisma.aiInsight.findMany({
      where: {
        userId: { in: activeUserIds },
        trigger: InsightTrigger.DAILY,
        generatedAt: { gte: todayStart },
      },
      select: { userId: true },
    });

    const notifiedSet = new Set(alreadyNotified.map((r) => r.userId));
    const eligible = activeUserIds.filter((id) => !notifiedSet.has(id));

    this.logger.log(
      `Daily insights: ${eligible.length} eligible users (${notifiedSet.size} already notified today)`,
    );

    if (eligible.length === 0) return;

    const CHUNK_SIZE = 20;
    let dispatched = 0;

    for (let i = 0; i < eligible.length; i += CHUNK_SIZE) {
      const chunk = eligible.slice(i, i + CHUNK_SIZE);
      await this.insightsQueue.add(
        INSIGHTS_JOB,
        { trigger: 'daily', userIds: chunk },
        { removeOnComplete: true, removeOnFail: { count: 3 } },
      );
      dispatched += chunk.length;
    }

    this.logger.log(
      `Daily insights: dispatched ${dispatched} user(s) across ${Math.ceil(eligible.length / CHUNK_SIZE)} chunk job(s)`,
    );
  }
}
