import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import {
  ADVISOR_ATTACHMENT_CLEANUP_JOB,
  ADVISOR_ATTACHMENT_CLEANUP_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import type {
  AdvisorAttachmentCleanupItem,
  AdvisorAttachmentCleanupJob,
} from '@fintrack/types/interfaces/ai';

import { UploadService } from '../upload/upload.service';

/**
 * Removes Cloudinary files that belonged to deleted advisor conversations.
 *
 * Conversation deletion is user-facing, while attachment deletion is storage
 * hygiene. Running this as a queue worker keeps deletion fast and lets BullMQ
 * retry transient Cloudinary or Redis issues independently.
 */
@Processor(ADVISOR_ATTACHMENT_CLEANUP_QUEUE)
export class AdvisorAttachmentCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(AdvisorAttachmentCleanupProcessor.name);

  constructor(private readonly uploadService: UploadService) {
    super();
  }

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.log(`${ADVISOR_ATTACHMENT_CLEANUP_QUEUE} queue is ready`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    this.logger.warn(
      `${ADVISOR_ATTACHMENT_CLEANUP_QUEUE} queue: ${job?.name ?? 'unknown'} failed: ${error.message}`,
    );
  }

  /**
   * Dispatches supported advisor attachment cleanup jobs.
   *
   * @param job BullMQ cleanup job.
   * @returns Number of Cloudinary assets successfully deleted.
   */
  async process(job: Job<AdvisorAttachmentCleanupJob>): Promise<number | void> {
    if (job.name !== ADVISOR_ATTACHMENT_CLEANUP_JOB) return;
    return this.cleanupConversationAttachments(job.data);
  }

  /**
   * Deletes each unique attachment public id for the conversation owner.
   *
   * @param data Cleanup payload captured before the conversation row was deleted.
   * @returns Number of Cloudinary assets successfully deleted.
   */
  private async cleanupConversationAttachments(
    data: AdvisorAttachmentCleanupJob,
  ): Promise<number> {
    const attachments = this.uniqueAttachments(data.attachments);
    let deleted = 0;
    let skipped = 0;

    for (const attachment of attachments) {
      const wasDeleted = await this.uploadService.deleteAdvisorFileForUser(
        data.userId,
        attachment.publicId,
      );

      if (wasDeleted) {
        deleted += 1;
      } else {
        skipped += 1;
      }
    }

    this.logger.log(
      `[ADV-GW] advisor attachment cleanup convo=${data.conversationId} deleted=${deleted} skipped=${skipped}`,
    );
    return deleted;
  }

  /**
   * Deduplicates attachments by public id so repeated message metadata does not
   * trigger repeated Cloudinary destroy calls.
   *
   * @param attachments Attachment cleanup candidates from persisted metadata.
   * @returns Unique cleanup candidates.
   */
  private uniqueAttachments(
    attachments: AdvisorAttachmentCleanupItem[],
  ): AdvisorAttachmentCleanupItem[] {
    return Array.from(
      new Map(
        attachments
          .filter((attachment) => attachment.publicId && attachment.kind)
          .map((attachment) => [attachment.publicId, attachment]),
      ).values(),
    );
  }
}
