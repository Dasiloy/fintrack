import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BaseCheckpointSaver, BaseStore } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { PostgresStore } from '@langchain/langgraph-checkpoint-postgres/store';

import { ModelRessolver } from './repositories';

/**
 * Embedding model + vector size for the long-term store's semantic index. Kept
 * consistent with the rest of the codebase (`gemini-embedding-2` truncated to
 * 1536 dims, `SEMANTIC_SIMILARITY` task) so memory vectors are comparable with
 * the transaction vectors elsewhere.
 */

/**
 * GraphPersistenceService — durable LangGraph persistence backed by Postgres.
 *
 * Supplies the two persistence primitives every stateful graph needs, both
 * connected to the application database via `DATABASE_URL`:
 *
 * - **Checkpointer** (`PostgresSaver`) — *short-term*, thread-scoped memory.
 *   LangGraph snapshots the full graph state after each super-step, keyed by
 *   `thread_id`. This is what lets a conversation resume across turns and across
 *   process restarts, and what makes human-in-the-loop `interrupt()` /
 *   `Command({ resume })` durable. Backing tables: `checkpoints`,
 *   `checkpoint_writes`, `checkpoint_blobs`, `checkpoint_migrations`.
 *
 * - **Store** (`PostgresStore`) — *long-term*, cross-thread memory. A namespaced
 *   key-value store nodes read/write through the runtime `store` handle (e.g.
 *   user preferences, detected patterns, rejected action proposals) that must
 *   outlive any single thread. A pgvector semantic index is enabled (the `text`
 *   field of each item is embedded with `gemini-embedding-2` @ 1536 dims), so
 *   memory can be retrieved by similarity as well as by namespace scan.
 *
 * ## Lifecycle
 * - `onModuleInit`    → creates the backing tables if absent. Both `setup()`
 *   (saver) and `start()` (store) are idempotent, so this is safe on every boot.
 * - `onModuleDestroy` → closes both connection pools on graceful shutdown.
 *
 * ## Usage
 * Inject the service and hand the instances to `LangraphService.compile`:
 *
 * ```ts
 * const graph = this.langGraph.compile(builder, {
 *   checkpointer: this.persistence.checkpointer,
 *   store: this.persistence.store,
 * });
 * // ...then invoke with a thread id to persist the conversation:
 * await graph.invoke(input, { configurable: { thread_id: conversationId } });
 * ```
 *
 * The Postgres clients manage their own connection pools, independent of
 * Prisma's — they share only the database, not the pool.
 */
@Injectable()
export class GraphPersistenceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GraphPersistenceService.name);

  // Single source of truth: the concrete Postgres clients. We own their
  // connection pools and lifecycle (setup/start/end/stop), so we hold them
  // under their concrete type. Consumers read them through the base-typed
  // getters below — same instances, narrower contract.
  private readonly pgSaver: PostgresSaver;
  private readonly pgStore: PostgresStore;

  constructor(
    private readonly config: ConfigService,
    private readonly modelRessolver: ModelRessolver,
  ) {
    // const connectionString =
    //   'postgresql://postgres:hFCTgHAeRWzwYxcYFkIDnGCjeAxLajEn@acela.proxy.rlwy.net:22275/railway';

    const connectionString = this.config.get('DATABASE_URL');

    this.pgSaver = PostgresSaver.fromConnString(connectionString, {});

    // Configure the store with a pgvector semantic index so long-term memory can
    // be retrieved by similarity (not just namespace scans). Only the `text`
    // field of each item is embedded; items written with `index: false` (e.g.
    // preferences) are stored without a vector.
    this.pgStore = PostgresStore.fromConnString(connectionString, {
      index: {
        dims: 1536,
        fields: ['text'],
        embed: (texts: string[]) =>
          this.modelRessolver
            .getEmbeddingRepo('google:gemini-embedding-2')
            .embed(texts, {
              model: 'gemini-embedding-2',
              dimensions: 1536,
            }),
      },
    });
  }

  /** Thread-scoped checkpointer — short-term conversation memory. */
  get checkpointer(): BaseCheckpointSaver {
    return this.pgSaver;
  }

  /** Cross-thread store — long-term memory. */
  get store(): BaseStore {
    return this.pgStore;
  }

  /**
   * Provisions the checkpointer and store tables. `PostgresSaver.setup()` runs
   * the checkpoint migrations; `PostgresStore.start()` runs the store migrations
   * (it calls `setup()` internally when `ensureTables` is enabled, the default)
   * and starts the store. Both are idempotent and safe to run on every boot.
   */
  async onModuleInit(): Promise<void> {
    await this.pgSaver.setup();
    await this.pgStore.start();
    this.logger.log('Postgres checkpointer and store ready');
  }

  /**
   * Closes both Postgres connection pools on graceful shutdown. Failures are
   * swallowed (best-effort) so one failing close cannot block the other.
   */
  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.pgSaver.end(), this.pgStore.stop()]);
    this.logger.log('Postgres checkpointer and store connections closed');
  }
}
