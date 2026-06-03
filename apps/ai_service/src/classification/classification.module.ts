import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import {
  CLASSIFICATION_CORRECTION_QUEUE,
  TRANSACTION_SEMANTIC_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { ClassificationService } from './classification.service';
import { ClassificationController } from './classification.controller';
import { ClassificationCorrectionProcessor } from './classification.processor';
import { TransactionSemanticProcessor } from './transaction_semantic.processor';

/**
 * Feature module for AI-powered transaction classification and the correction
 * feedback loop that improves it over time.
 *
 * ## Provided capabilities
 *
 * ### gRPC endpoint
 * `ClassificationController` exposes `AiService.ClassifyTransactions` — the
 * single entry point called by the API gateway's bank sync processor whenever
 * a batch of Mono transactions could not be resolved by token scoring alone.
 *
 * ### Correction feedback loop
 * When a user edits the category on an AI-classified BANK transaction, the
 * finance service enqueues a `CLASSIFICATION_CORRECTION_JOB`. The
 * `ClassificationCorrectionProcessor` registered here consumes that job,
 * embeds the transaction narration, and upserts the user's preference into
 * `ClassificationCorrection`. Future classification calls pick these up as
 * few-shot corrections via vector similarity search.
 *
 * ## Dependencies
 * - **RegistoryModule** (global) — supplies `ModelRessolver` and
 *   `LangchainService` needed by `ClassificationService`.
 * - **DatabaseModule** (global) — supplies `PrismaService` for raw SQL
 *   pgvector queries and correction upserts.
 * - **BullModule** — registers `CLASSIFICATION_CORRECTION_QUEUE` so the
 *   processor can consume jobs queued by the finance service.
 */
@Module({
  imports: [
    BullModule.registerQueue(
      { name: CLASSIFICATION_CORRECTION_QUEUE },
      { name: TRANSACTION_SEMANTIC_QUEUE },
    ),
  ],
  controllers: [ClassificationController],
  providers: [
    ClassificationService,
    ClassificationCorrectionProcessor,
    TransactionSemanticProcessor,
  ],
})
export class ClassificationModule {}
