import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/service';
import {
  CLASSIFICATION_CORRECTION_JOB,
  CLASSIFICATION_CORRECTION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { ClassificationCorrectionJobPayload } from '@fintrack/types/interfaces/finance';

import { ModelRessolver } from '../registory/repositories';

/**
 * BullMQ processor that consumes `CLASSIFICATION_CORRECTION_QUEUE` jobs
 * enqueued by the finance service whenever a user manually edits the category
 * of an AI-classified BANK transaction.
 *
 * ## Job handled
 * | Job name                       | Payload                              | Handler              |
 * |--------------------------------|--------------------------------------|----------------------|
 * | `CLASSIFICATION_CORRECTION_JOB`| `ClassificationCorrectionJobPayload` | `handleCorrection()` |
 *
 * ## `handleCorrection` logic
 * 1. Embeds `narration` via `gemini-embedding-2` (1536 dims,
 *    `SEMANTIC_SIMILARITY` task type) using `ModelRessolver.getEmbeddingRepo`.
 * 2. Serialises the vector as the `[f1,f2,…]` string literal required by
 *    Postgres's `::vector` cast (Prisma serialises `number[]` as `{…}` which
 *    pgvector rejects).
 * 3. Executes a raw `INSERT … ON CONFLICT ("userId","narration") DO UPDATE`
 *    so that repeated corrections to the same narration update the stored slug
 *    and embedding rather than creating duplicate rows.
 *
 * Future `ClassificationService.fetchCorrections` calls pick up these records
 * via cosine-distance vector search, completing the feedback loop.
 *
 * ## Error handling
 * Errors are logged then re-thrown so BullMQ can retry the job according to
 * the queue's back-off configuration.
 */
@Processor(CLASSIFICATION_CORRECTION_QUEUE)
export class ClassificationCorrectionProcessor extends WorkerHost {
  private readonly logger = new Logger(ClassificationCorrectionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly modelRessolver: ModelRessolver,
  ) {
    super();
  }

  /** Routes incoming BullMQ jobs to the appropriate handler by job name. */
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case CLASSIFICATION_CORRECTION_JOB:
        await this.handleCorrection(job.data);
        break;
      default:
        this.logger.warn(`Unhandled job: ${job.name}`);
    }
  }

  /**
   * Embeds the corrected transaction narration and upserts the result into
   * `ClassificationCorrection` so future classification calls can use it as
   * a few-shot example via vector similarity search.
   *
   * The `ON CONFLICT ("userId","narration") DO UPDATE` clause ensures repeated
   * corrections to the same narration always store the latest slug and
   * re-embedded vector without creating duplicate rows.
   *
   * Errors are re-thrown so BullMQ can retry the job according to the queue's
   * back-off configuration.
   */
  private async handleCorrection(
    data: ClassificationCorrectionJobPayload,
  ): Promise<void> {
    try {
      const { userId, narration, correctedSlug } = data;

      const embedding = await this.modelRessolver
        .getEmbeddingRepo('google:gemini-embedding-2')
        .embedOne(narration, { model: 'gemini-embedding-2', dimensions: 1536 });

      const vectorStr = `[${embedding.join(',')}]`;

      await this.prisma.$executeRaw`
      INSERT INTO "ClassificationCorrection" ("id","narration","correctedSlug","userId","embedding","createdAt")
      VALUES (gen_random_uuid(), ${narration}, ${correctedSlug}, ${userId}, ${vectorStr}::vector, now())
      ON CONFLICT ("userId","narration")
      DO UPDATE SET "correctedSlug" = EXCLUDED."correctedSlug",
                    "embedding"     = EXCLUDED."embedding"
    `;

      this.logger.log(
        `Correction upserted for user ${userId}: "${narration}" → "${correctedSlug}"`,
      );
    } catch (error) {
      this.logger.error('handleCorrection error', JSON.stringify(error));
      throw error;
    }
  }
}
