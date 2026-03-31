import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/service';
import {
  PURGE_USAGE_TRACKING_JOB,
  USAGE_TRACKING_QUEUE,
  NEW_USAGE_TRACKERS_CREATED_JOB,
  PAYMENT_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import dayjs, { getPeriodRange } from '@fintrack/utils/date';

/**
 * UsageProcessor.
 */
@Processor(USAGE_TRACKING_QUEUE)
export class UsageProcessor extends WorkerHost {
  private readonly logger = new Logger(UsageProcessor.name);
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(PAYMENT_QUEUE)
    private readonly paymentQueue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === PURGE_USAGE_TRACKING_JOB) {
      await this.purgeUsageTracking();
      return;
    }
  }

  /**
   *  Hard delete all usage trackers whose period end is less than the current date
   * N:B This only applies to the usage trackers that are not associated with a subscription, free account only
   *
   * Automatically create the three new usage trackers for each user => i month gap as always
   */
  async purgeUsageTracking(): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: {
        subscription: {
          plan: 'FREE',
        },
      },
      select: {
        id: true,
        firstName: true,
        email: true,
      },
    });

    const [periodStart, periodEnd] = getPeriodRange();
    for (const user of users) {
      await this.prisma.$transaction([
        this.prisma.usageTracker.deleteMany({
          where: {
            userId: user.id,
          },
        }),
        this.prisma.usageTracker.createMany({
          data: [
            {
              userId: user.id,
              feature: 'AI_INSIGHTS_QUERIES',
              count: 0,
              periodStart,
              periodEnd,
            },
            {
              userId: user.id,
              feature: 'AI_CHAT_MESSAGES',
              count: 0,
              periodStart,
              periodEnd,
            },
            {
              userId: user.id,
              feature: 'RECEIPT_UPLOADS',
              count: 0,
              periodStart,
              periodEnd,
            },
          ],
          skipDuplicates: true,
        }),
      ]);
      this.logger.log(`Created new usage trackers for user ${user.id}`);
      this.paymentQueue.add(NEW_USAGE_TRACKERS_CREATED_JOB, {
        firstName: user.firstName,
        email: user.email,
        periodStart: dayjs(periodStart).format('YYYY-MM-DD'),
        periodEnd: dayjs(periodEnd).format('YYYY-MM-DD'),
      });
    }
  }
}
