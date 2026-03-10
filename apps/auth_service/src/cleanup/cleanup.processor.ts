import { Job } from 'bullmq';

import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/nest';
import {
  ACCOUNT_CLEANUP_QUEUE,
  PURGE_SCHEDULED_DELETIONS_JOB,
  CANCEL_STRIPE_SUBSCRIPTION_JOB,
} from '@fintrack/types/constants/queus.constants';

@Injectable()
@Processor(ACCOUNT_CLEANUP_QUEUE)
export class CleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === PURGE_SCHEDULED_DELETIONS_JOB) {
      await this.purgeScheduledDeletions();
      return;
    }

    if (job.name === CANCEL_STRIPE_SUBSCRIPTION_JOB) {
      // TODO: call Stripe subscriptions.cancel(job.data.stripeSubscriptionId)
      this.logger.log(
        `[stub] Would cancel Stripe subscription: ${job.data.stripeSubscriptionId}`,
      );
      return;
    }
  }

  /**
   * Hard-deletes all User rows whose `scheduledDeletionAt` has passed.
   * Prisma cascade handles all child rows automatically in a single statement.
   */
  private async purgeScheduledDeletions(): Promise<void> {
    const result = await this.prismaService.user.deleteMany({
      where: { scheduledDeletionAt: { lt: new Date() } },
    });
    this.logger.log(`Purged ${result.count} scheduled account deletion(s)`);
  }
}
