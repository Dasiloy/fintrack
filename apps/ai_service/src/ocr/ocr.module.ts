import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { OCR_QUEUE } from '@fintrack/types/constants/queus.constants';

import { OcrService } from './ocr.service';
import { OcrProcessor } from './ocr.processor';

/**
 * Feature module for OCR receipt extraction.
 *
 * Registers `OCR_QUEUE` as a BullMQ consumer queue, wired to the same Redis
 * connection as the API gateway which enqueues the jobs.
 *
 * ## Provided capabilities
 * - `OcrProcessor` — BullMQ `@Processor(OCR_QUEUE)` worker that handles
 *   `OCR_QUEUE_JOB` payloads enqueued after a successful receipt upload.
 * - `OcrService` — Orchestrates the extraction pipeline: PROCESSING update,
 *   Cloudinary file fetch, `gemini-2.5-flash` structured-output call, DB
 *   write, and Redis Pub/Sub publish for the gateway SSE stream.
 *
 * ## Dependencies
 * - **RegistoryModule** (global) — supplies `ModelRessolver` for Gemini access.
 * - **DatabaseModule** (global) — supplies `PrismaService` and `REDIS_CLIENT`.
 */
@Module({
  imports: [BullModule.registerQueue({ name: OCR_QUEUE })],
  providers: [OcrService, OcrProcessor],
})
export class OcrModule {}
