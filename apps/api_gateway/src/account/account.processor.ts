import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import {
  MONO_QUEUE,
  SYNC_ACCOUNT_JOB,
} from '@fintrack/types/constants/queus.constants';

import { TransactionService } from '../transaction/transaction.service';
import { MonoAccountSybJobPayload } from '@fintrack/types/interfaces/mono';

@Processor(MONO_QUEUE)
export class MonoAccountSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(MonoAccountSyncProcessor.name);

  constructor(private readonly transactionService: TransactionService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case SYNC_ACCOUNT_JOB:
        await this.handleSyncAccount(job.data);
        break;

      default:
        this.logger.error(`Job of ${job.id} ${job.name} not handled`);
    }
  }

  async handleSyncAccount(data: MonoAccountSybJobPayload): Promise<void> {
    console.log(data);
  }
}
