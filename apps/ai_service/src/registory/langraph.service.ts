import {
  StateGraph,
  CompiledStateGraph,
  MemorySaver,
  BaseCheckpointSaver,
  InMemoryStore,
  BaseStore,
} from '@langchain/langgraph';

import { Injectable, Logger } from '@nestjs/common';

import {
  CompileGraphOptions,
  InvokeGraphOptions,
  StreamGraphOptions,
  GraphStreamEvent,
} from './lang.types';

/**
 * Thin wrapper around LangGraph's `StateGraph` that standardises compile,
 * invoke, and stream operations across all graph-based feature modules.
 *
 * ## Compile (`compile`)
 * Accepts an uncompiled `StateGraph` and optional `CompileGraphOptions`:
 * - `checkpointer: 'memory'` → `MemorySaver` (in-process; dev/test only)
 * - `checkpointer: BaseCheckpointSaver` → passed through (e.g. Postgres-backed)
 * - `store: 'memory'` → `InMemoryStore` for long-term cross-thread memory
 *
 * ## Invoke (`invoke`)
 * Runs the graph to completion and returns the final state. Accepts an
 * optional `threadId` / `configurable` for persisted checkpointing.
 *
 * ## Streaming
 * Two streaming modes are provided:
 *
 * - **`streamCore`** — raw `graph.stream()` with a configurable `streamMode`
 *   (`'updates'` by default). Use when you need raw node deltas or a non-standard
 *   stream mode not covered by `streamEvents`.
 *
 * - **`streamEvents`** — combines `streamMode: ['messages', 'updates']` and
 *   normalises output into a `GraphStreamEvent<TState>` discriminated union:
 *   - `{ type: 'token', content: string }` — individual text tokens from message
 *     chunks, suitable for SSE forwarding.
 *   - `{ type: 'state', node: string, state: Partial<TState> }` — full state
 *     snapshot after each node completes, useful for progress tracking.
 */
@Injectable()
export class LangraphService {
  private readonly logger = new Logger(LangraphService.name);
  constructor() {}

  /**
   * Compiles a `StateGraph` into a runnable `CompiledStateGraph`.
   *
   * `opts.checkpointer`:
   * - `'memory'` → creates a `MemorySaver` (in-process, dev/test only — lost on restart)
   * - `BaseCheckpointSaver` → passed through (e.g. Postgres-backed for production)
   * - omitted / `false` → stateless (no cross-turn memory)
   *
   * `opts.store`:
   * - `'memory'` → creates an `InMemoryStore` for cross-thread long-term memory
   * - `BaseStore` → passed through for a persistent store implementation
   */
  compile<S = any, U = any, N extends string = string>(
    graph: StateGraph<any, S, U, N>,
    opts?: CompileGraphOptions,
  ) {
    // short term memeory
    let checkpointer: BaseCheckpointSaver | undefined;
    if (opts?.checkpointer === 'memory') checkpointer = new MemorySaver();
    else if (opts?.checkpointer) checkpointer = opts.checkpointer;

    // long term memory
    let store: BaseStore | undefined;
    if (opts?.store === 'memory') store = new InMemoryStore();
    else if (opts?.store) store = opts.store;

    return graph.compile({
      checkpointer,
      store,
    });
  }

  /**
   * Runs the graph to completion and returns the final state.
   * Pass `opts.threadId` to resume a persisted conversation thread when
   * the graph was compiled with a checkpointer.
   */
  async invoke<TState, TConfig, TContext>(
    graph: CompiledStateGraph<TState, any, any>,
    input: Partial<TState>,
    opts?: InvokeGraphOptions<TConfig, TContext>,
  ): Promise<TState> {
    return graph.invoke(
      input,
      this.buildConfig<TConfig, TContext>(opts),
    ) as Promise<TState>;
  }

  /**
   * Raw stream of graph output chunks.  Defaults to `streamMode: 'updates'`
   * (one entry per completed node).  Use this when you need a non-standard
   * `streamMode` (e.g. `'values'` for full-state snapshots after each step)
   * that `streamEvents` does not expose.
   */
  async *streamCore<TState, TConfig, TContext>(
    graph: CompiledStateGraph<TState, any, any>,
    input: Partial<TState>,
    opts?: StreamGraphOptions<TConfig, TContext>,
  ): AsyncGenerator<any> {
    const stream = await graph.stream(input, {
      ...this.buildConfig<TConfig, TContext>(opts),
      streamMode: opts?.streamMode ?? 'updates',
    });

    for await (const chunk of stream) {
      if (chunk) {
        this.logger.debug(chunk);
        yield chunk;
      }
    }
  }

  /**
   * Streams graph output as a typed discriminated union (`GraphStreamEvent<TState>`).
   *
   * Runs the graph with `streamMode: ['messages', 'updates']` simultaneously
   * and normalises both into:
   * - `{ type: 'token', content: string }` — individual text token from a model
   *   node, ready to forward over SSE.
   * - `{ type: 'state', node: string, state: Partial<TState> }` — full state
   *   delta after a node completes, useful for progress indicators.
   *
   * Empty tokens are suppressed; only non-empty text chunks are yielded.
   */
  async *streamEvents<TState, TConfig, TContext>(
    graph: CompiledStateGraph<TState, any, any>,
    input: Partial<TState>,
    opts?: InvokeGraphOptions<TConfig, TContext>,
  ): AsyncGenerator<GraphStreamEvent<TState>> {
    const stream = await graph.stream(input, {
      ...this.buildConfig<TConfig, TContext>(opts),
      streamMode: ['messages', 'updates'],
    });
    for await (const chunk of stream) {
      const [mode, payload] = chunk as [string, unknown];

      if (mode === 'messages') {
        const [msgChunk, meta] = payload as [
          { content: unknown },
          { langgraph_node?: string } | undefined,
        ];
        const text =
          typeof msgChunk?.content === 'string'
            ? msgChunk.content
            : ((msgChunk?.content as any)?.[0]?.text ?? '');
        if (text) {
          yield { type: 'token', content: text, node: meta?.langgraph_node };
        }
      } else if (mode === 'updates') {
        for (const [node, state] of Object.entries(
          payload as Record<string, Partial<TState>>,
        )) {
          yield { type: 'state', node, state };
        }
      }
    }
  }

  /**
   * Builds the LangGraph run config from invoke/stream options.
   *
   * - `configurable` → forwarded as-is (carries `thread_id`, which keys the
   *   checkpointer).
   * - `context` → forwarded as the top-level `context` field, which LangGraph
   *   exposes to nodes as `runtime.context` (static per-run data such as
   *   `userId`). This is deliberately separate from graph state — it is never
   *   persisted in checkpoints.
   *
   * Returns `undefined` when neither `configurable` nor `context` is set so
   * LangGraph uses its default stateless execution path.
   */
  private buildConfig<Tconfig, TContext>(
    opts?: InvokeGraphOptions<Tconfig, TContext>,
  ) {
    if (!opts?.configurable && !opts?.context && !opts?.signal)
      return undefined;
    return {
      ...(opts.context !== undefined && {
        context: opts.context as Record<string, unknown>,
      }),
      ...(opts.configurable && { configurable: { ...opts.configurable } }),
      // Forwarded to LangGraph as the run's AbortSignal — aborting it stops the
      // graph (no further nodes/model calls) and rejects the stream.
      ...(opts.signal && { signal: opts.signal }),
    };
  }
}
