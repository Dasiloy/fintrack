import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import {
  OCR_QUEUE,
  OCR_QUEUE_JOB,
} from '@fintrack/types/constants/queus.constants';
import { OcrToTransactionJob } from '@fintrack/types/interfaces/finance';

import { OcrService } from './ocr.service';

/**
 * BullMQ processor that consumes `OCR_QUEUE` jobs enqueued by the API gateway
 * after a successful receipt upload.
 *
 * ## Job handled
 * | Job name      | Payload               | Handler          |
 * |---------------|-----------------------|------------------|
 * | `OCR_QUEUE_JOB` | `OcrToTransactionJob` | `handleExtract()` |
 *
 * ## `handleExtract` logic
 * Delegates to `OcrService.extract` which runs the full extraction pipeline:
 * 1. Updates `OCRDraft` → `PROCESSING` and publishes to `ocr:{draftId}`.
 * 2. Fetches the file from Cloudinary and calls `gemini-2.5-flash` with the
 *    user's category list for one-shot extraction + categorisation.
 * 3. On success: updates → `COMPLETED` and publishes the extracted fields.
 * 4. On failure: updates → `FAILED` and publishes the `failureReason`.
 *
 * Failures after the PROCESSING update are handled internally by `OcrService`;
 * only infrastructure errors before that point propagate here for BullMQ retry.
 */
@Processor(OCR_QUEUE)
export class OcrProcessor extends WorkerHost {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(private readonly ocrService: OcrService) {
    super();
  }

  async process(job: Job<OcrToTransactionJob>): Promise<void> {
    switch (job.name) {
      case OCR_QUEUE_JOB:
        await this.ocrService.extract(job.data);
        break;
      default:
        this.logger.warn(`Unhandled OCR job: ${job.name}`);
    }
  }
}
