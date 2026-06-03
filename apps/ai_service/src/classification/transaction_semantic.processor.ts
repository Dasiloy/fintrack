import { Job } from 'bullmq';

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { PrismaService } from '@fintrack/database/service';
import {
  TRANSACTION_SEMANTIC_JOB,
  TRANSACTION_SEMANTIC_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { format } from '@fintrack/utils/date';
import { TransactionSematicJob } from '@fintrack/types/interfaces/finance';

import { ModelRessolver } from '../registory/repositories';

/**
 * BullMQ processor that consumes `TRANSACTION_SEMANTIC_QUEUE` jobs and writes
 * dense vector embeddings back onto each `Transaction` row.
 *
 * ## Job handled
 * | Job name                    | Payload                   | Handler                       |
 * |-----------------------------|---------------------------|-------------------------------|
 * | `TRANSACTION_SEMANTIC_JOB`  | `TransactionSematicJob`   | `handleTransactionSemantic()` |
 *
 * ## `handleTransactionSemantic` logic
 * 1. **Builds a semantic string per transaction** via `buildSemanticString`.
 *    Each string concatenates the narration/description, category name, transaction
 *    direction, formatted amount, and human-readable date into a single sentence
 *    that carries enough financial context for meaningful similarity search.
 *
 * 2. **Batch-embeds** all strings in a single `embed()` call to
 *    `gemini-embedding-2` (1536 dimensions, `SEMANTIC_SIMILARITY` task type).
 *    One API call per job keeps latency and quota usage predictable regardless
 *    of batch size.
 *
 * 3. **Updates each `Transaction` row** with the resulting vector via a raw
 *    `UPDATE "Transaction" SET "embedding" = $vector::vector WHERE "id" = $id`.
 *    Prisma serialises `number[]` as a `{…}` array literal which pgvector rejects;
 *    the explicit `[f1,f2,…]` string format and `::vector` cast are mandatory.
 *    Updates are dispatched concurrently via `Promise.allSettled` so a single
 *    failed write does not block the rest of the batch.
 *
 * 4. **Logs a summary** of passed vs. failed updates. Individual failures are
 *    logged per-row; the overall job succeeds as long as at least one update lands.
 *
 * ## Error handling
 * Unhandled job names are warned and dropped. Embedding API errors are logged
 * and re-thrown so BullMQ retries the whole job via the queue's back-off policy.
 * Per-row update failures are isolated by `Promise.allSettled` and logged without
 * failing the job.
 */
@Processor(TRANSACTION_SEMANTIC_QUEUE)
export class TransactionSemanticProcessor extends WorkerHost {
  private readonly logger = new Logger(TransactionSemanticProcessor.name);

  constructor(
    private readonly modelRessolver: ModelRessolver,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  // ── BullMQ lifecycle events ───────────────────────────────────────────────

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.log(`${TRANSACTION_SEMANTIC_QUEUE} worker is ready`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(
      `[${job.id}] ${job.name} started — ${(job.data as TransactionSematicJob).transactions?.length ?? 0} transaction(s)`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`[${job.id}] ${job.name} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `[${job.id}] ${job.name} failed: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(
      `${TRANSACTION_SEMANTIC_QUEUE} worker error: ${error.message}`,
      error.stack,
    );
  }

  // ── Job router ────────────────────────────────────────────────────────────

  /** Routes incoming BullMQ jobs to the appropriate handler by job name. */
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case TRANSACTION_SEMANTIC_JOB:
        await this.handleTransactionSemantic(job.data);
        break;
      default:
        this.logger.warn(`Unhandled job: ${job.name}`);
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  /**
   * Embeds all transactions in the payload and persists each vector directly
   * onto the `Transaction.embedding` column.
   *
   * Uses `Promise.allSettled` for the DB update phase so a single failing write
   * does not abort the rest of the batch. Embedding API errors bubble up and
   * allow BullMQ to retry the whole job.
   *
   * @param payload - Job payload containing the userId and transaction batch.
   */
  private async handleTransactionSemantic(
    payload: TransactionSematicJob,
  ): Promise<void> {
    const semantics = this.buildSemanticString(payload);

    if (semantics.size === 0) {
      this.logger.warn(
        `[handleTransactionSemantic] Empty semantic map for userId=${payload.userId} — skipping`,
      );
      return;
    }

    const semanticEntries = [...semantics.entries()];

    const embeddings = await this.modelRessolver
      .getEmbeddingRepo('google:gemini-embedding-2')
      .embed(
        semanticEntries.map(([, text]) => text),
        { model: 'gemini-embedding-2', dimensions: 1536 },
      );

    const updates = semanticEntries.map(([transactionId], i) => {
      // pgvector requires the [f1,f2,…] string literal with an explicit ::vector
      // cast. Prisma's default number[] serialisation ({f1,f2,…}) is rejected.
      const vectorStr = `[${embeddings[i].join(',')}]`;

      return this.prisma.$executeRaw`
        UPDATE "Transaction"
        SET    "embedding" = ${vectorStr}::vector
        WHERE  "id"        = ${transactionId}
      `;
    });

    const settled = await Promise.allSettled(updates);

    const failed = settled.filter((s) => s.status === 'rejected');
    const passed = settled.length - failed.length;

    failed.forEach((result, idx) => {
      if (result.status === 'rejected') {
        const [id] = semanticEntries[idx];
        this.logger.error(
          `Failed to update embedding for transactionId=${id}: ${result.reason}`,
        );
      }
    });

    this.logger.log(
      `[handleTransactionSemantic] userId=${payload.userId} — ${passed} updated, ${failed.length} failed`,
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Builds a human-readable semantic string for each transaction in the
   * payload, keyed by transaction ID.
   *
   * The string joins narration/description, category name, direction label,
   * formatted amount, and date into a single sentence optimised for
   * `SEMANTIC_SIMILARITY` embedding. This gives the vector enough financial
   * context to surface relevant matches for natural-language advisor queries
   * such as "last time I spent on utilities" or "large food expenses in March".
   *
   * Transactions with neither a narration nor a description are silently
   * skipped — an empty string produces a meaningless embedding.
   *
   * @param data - Raw job payload from `TRANSACTION_SEMANTIC_QUEUE`.
   * @returns A Map of `transactionId → semanticString` for all embeddable rows.
   */
  private buildSemanticString(
    data: TransactionSematicJob,
  ): Map<string, string> {
    const semanticMap = new Map<string, string>();

    for (const tx of data.transactions) {
      const text = tx.narration ?? tx.description;
      if (!text?.trim()) continue;

      semanticMap.set(
        tx.id,
        [
          text,
          tx.categoryName,
          tx.type === 'INCOME' ? 'income received' : 'expense paid',
          `amount ${tx.amount}`,
          format(tx.date, 'DD MMMM YYYY'),
        ].join(' '),
      );
    }

    return semanticMap;
  }
}
