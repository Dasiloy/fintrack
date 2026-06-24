import { createHash } from 'crypto';

import {
  BaseStore,
  END,
  REMOVE_ALL_MESSAGES,
  Runtime,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import {
  AIMessage,
  HumanMessage,
  RemoveMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

import { PrismaService } from '@fintrack/database/service';
import { AdvisorChunkRes } from '@fintrack/types/protos/ai/ai';
import { REDIS_CLIENT } from '@fintrack/types/constants/redis.costants';

import { LangchainService } from '../registory/langchain.service';
import { LangraphService } from '../registory/langraph.service';
import { GraphPersistenceService } from '../registory/graph_persistence.service';
import { ModelRessolver } from '../registory/repositories';
import { extractText } from '../registory/llm.utils';
import { GraphStreamEvent } from '../registory/lang.types';
import { createAdvisorTools } from './advisor.tools';
import { createOracleTools } from './advisor.oracle.tools';

import { AdvisorState, AdvisorStateType } from './advisor.graph';
import { GuardianSchema, MemoryExtractionSchema } from './advisor.schemas';
import type { MemoryExtraction } from './advisor.schemas';
import {
  GUARDIAN_SYSTEM,
  COMPACTION_SYSTEM,
  MEMORY_EXTRACTION_SYSTEM,
  buildAdvisorSystemPrompt,
} from './advisor.prompts';
import { TOOL_SCOPES } from './advisor.scopes';
import { ADVISOR_NODE_RETRY, isRetryableError } from './advisor.retry';
import {
  ADVISOR_END_MESSAGES,
  ADVISOR_NODES,
  AdvisorContext,
  COMPACTION_MODEL,
  COMPACTION_THRESHOLD,
  GUARDIAN_MODEL,
  MEMORY_EXTRACTION_EVERY,
  MEMORY_MODEL,
  MEMORY_NAMESPACE,
  MEMORY_PREFERENCES_KEY,
  MEMORY_READ_LIMIT,
  MEMORY_SOURCE_MESSAGES,
  MEMORY_WRITE_MAX,
  MESSAGES_TO_KEEP,
  RESPOND_MODEL,
} from './advisor.constants';
import { AdvisorScope } from '@fintrack/database/types';
import dayjs from '@fintrack/utils/date';

/**
 * AdvisorService — orchestrates the AI financial advisor LangGraph.
 *
 * ## Graph topology (current — grows in later phases)
 *
 *   START
 *     └─ guardian ──[relevant?]──┬─ no  → reject → END
 *                                └─ yes → compact → respond ──[tool calls?]──┬─ yes → tools → compact → (loop)
 *                                                                            └─ no  → memory → END
 *
 * The graph is compiled once at module init with the Postgres-backed
 * checkpointer + store from {@link GraphPersistenceService}, so every
 * conversation is durably persisted per `thread_id` and ready for the
 * human-in-the-loop interrupts added in later phases.
 *
 * ## Guardian gate
 * The first node classifies each incoming message as finance-related or not
 * using the cheapest model. Messages that are off-topic, empty, or whose
 * classification errors short-circuit to a tailored canned reply, so they never
 * cost a full advisor round-trip. The one exception is a truncated/null
 * classifier output, which is treated as relevant so a genuine finance question
 * is never wrongly dropped.
 *
 * ## Compact → respond → tools
 * Relevant turns pass through `compact` (summarises the oldest messages once the
 * history grows past {@link COMPACTION_THRESHOLD}) and then `respond`, the main
 * advisor. The respond node builds a persona-rich, scope-aware system prompt and
 * answers with the deep-reasoning model, bound **per request to only the tools
 * the user has granted** ({@link toolsForScopes}) so it can never call a revoked
 * capability. It never reads the database itself: user data comes through
 * scope-gated Postgres tools (with an in-tool `withScope` backstop), and public
 * macro data through the unscoped oracle tools (cache reads). Tool calls loop
 * back through `compact` to keep history bounded; a completed turn passes through
 * `memory` to distil durable, cross-conversation facts into the long-term store.
 *
 * Models are chosen by reasoning depth to control cost: guardian and compaction
 * run on cheaper tiers; only `respond` uses the deep model.
 */
@Injectable()
export class AdvisorService implements OnModuleInit {
  private readonly logger = new Logger(AdvisorService.name);

  /** Compiled, persistence-backed graph. Built once in {@link onModuleInit}. */
  private graph!: ReturnType<AdvisorService['buildGraph']>;

  /** Deep-reasoning model for the main advisor response. */
  private respondModel!: BaseChatModel;
  /** Moderate model for cheap conversation compaction. */
  private compactionModel!: BaseChatModel;
  /**
   * The advisor's full toolset: scope-gated Postgres tools (user data) plus
   * unscoped oracle tools (public market data). Bound to the model and wrapped
   * by the ToolNode.
   */
  private tools!: Array<
    | ReturnType<typeof createAdvisorTools>[number]
    | ReturnType<typeof createOracleTools>[number]
  >;
  /** Executes tool calls emitted by the respond node. */
  private toolNode!: ToolNode;

  constructor(
    private readonly langChain: LangchainService,
    private readonly langGraph: LangraphService,
    private readonly modelRessolver: ModelRessolver,
    private readonly persistence: GraphPersistenceService,
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  onModuleInit() {
    this.compactionModel = this.modelRessolver.getRunnable(COMPACTION_MODEL);
    this.respondModel = this.modelRessolver.getRunnable(RESPOND_MODEL);
    this.tools = [
      ...createAdvisorTools(this.prisma),
      ...createOracleTools(this.redis),
    ];
    this.toolNode = new ToolNode(this.tools);
    this.graph = this.buildGraph();
  }

  /**
   * Streams the advisor's response for one user message as graph stream events
   * (tokens plus human-in-the-loop events). The gRPC controller maps each event
   * to a wire chunk via {@link toChunk}. The conversation is restored and
   * persisted via the checkpointer keyed by `conversationId`.
   */
  async *streamResponse(input: {
    userId: string;
    conversationId: string;
    message: string;
    grantedScopes: AdvisorScope[];
  }): AsyncGenerator<GraphStreamEvent<AdvisorStateType>> {
    this.logger.debug(
      `[ADV-AI] streamResponse START convo=${input.conversationId}`,
    );
    let eventCount = 0;
    try {
      const events = this.langGraph.streamEvents<
        AdvisorStateType,
        { thread_id: string },
        AdvisorContext
      >(
        this.graph,
        { messages: [new HumanMessage(input.message)] },
        {
          context: {
            userId: input.userId,
            grantedScopes: input.grantedScopes,
          },
          configurable: {
            thread_id: input.conversationId,
          },
        },
      );

      for await (const event of events) {
        eventCount += 1;
        // Log non-token events in full; sample token events to avoid noise.
        if (event.type !== 'token') {
          this.logger.debug(
            `[ADV-AI] event #${eventCount} type=${event.type} node=${(event as { node?: string }).node ?? '-'}`,
          );
        }
        yield event;
      }
      this.logger.debug(
        `[ADV-AI] streamResponse END convo=${input.conversationId} events=${eventCount}`,
      );
    } catch (err) {
      this.logger.error(
        `[ADV-AI] streamResponse THREW convo=${input.conversationId} after ${eventCount} events: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }
  }

  // ── Graph assembly ──────────────────────────────────────────────────────────

  private buildGraph() {
    const builder = new StateGraph(AdvisorState)
      // External-call nodes carry a retry policy so a transient model/DB blip is
      // re-attempted with backoff instead of failing the turn. Non-critical nodes
      // (compact, memory) degrade gracefully in their own catch and are NOT
      // retried, so a failure there can never fail a turn. reject is pure (no IO).
      .addNode(ADVISOR_NODES.GUARDIAN, this.buildGuardianNode(), {
        retryPolicy: ADVISOR_NODE_RETRY,
      })
      .addNode(ADVISOR_NODES.REJECT, this.buildRejectNode())
      .addNode(ADVISOR_NODES.COMPACT, this.buildCompactNode())
      .addNode(ADVISOR_NODES.RESPOND, this.buildRespondNode(), {
        retryPolicy: ADVISOR_NODE_RETRY,
      })
      .addNode(ADVISOR_NODES.TOOLS, this.toolNode, {
        retryPolicy: ADVISOR_NODE_RETRY,
      })
      .addNode(ADVISOR_NODES.MEMORY, this.buildMemoryNode())
      .addEdge(START, ADVISOR_NODES.GUARDIAN)
      .addConditionalEdges(ADVISOR_NODES.GUARDIAN, this.routeAfterGuardian, [
        ADVISOR_NODES.REJECT,
        ADVISOR_NODES.COMPACT,
      ])
      .addEdge(ADVISOR_NODES.REJECT, END)
      .addEdge(ADVISOR_NODES.COMPACT, ADVISOR_NODES.RESPOND)
      // respond either calls tools or finishes the turn (→ memory → END).
      .addConditionalEdges(ADVISOR_NODES.RESPOND, this.routeAfterRespond, [
        ADVISOR_NODES.TOOLS,
        ADVISOR_NODES.MEMORY,
      ])
      // After tools run, compact (keeps the loop's history bounded) then respond.
      .addEdge(ADVISOR_NODES.TOOLS, ADVISOR_NODES.COMPACT)
      // On turn completion, distil long-term memory, then end.
      .addEdge(ADVISOR_NODES.MEMORY, END);

    return this.langGraph.compile(builder, {
      checkpointer: this.persistence.checkpointer,
      store: this.persistence.store,
    });
  }

  // ── Nodes ─────────────────────────────────────────────────────────────────

  /**
   * Guardian node — classifies the latest user message with the cheap
   * {@link GUARDIAN_MODEL} and writes a {@link GuardianVerdict} for routing.
   *
   * Outcomes:
   * - empty input        → `{ relevant: false, reason: 'empty' }` (ends, no model call)
   * - off-topic          → `{ relevant: false, reason: 'off_topic' }`
   * - finance-related    → `{ relevant: true }`
   * - classifier error   → `{ relevant: false, reason: 'error' }` (ends rather than
   *   spend an advisor round-trip on an unclassified message)
   *
   * The reject node turns each `reason` into a tailored reply.
   */
  private buildGuardianNode() {
    return async (
      state: AdvisorStateType,
    ): Promise<Partial<AdvisorStateType>> => {
      const lastMessage = extractText(state.messages.at(-1)?.content);

      // Nothing to classify — end with the empty-input reply, no model call.
      if (!lastMessage.trim()) {
        return { guardianResult: { relevant: false, reason: 'empty' } };
      }

      const chain = this.langChain.buildStructuredChain({
        modelId: GUARDIAN_MODEL,
        schema: GuardianSchema,
        structuredOutputOptions: { strict: true },
      });

      try {
        const { parsed } = await chain.invoke([
          new SystemMessage(GUARDIAN_SYSTEM),
          new HumanMessage(lastMessage),
        ]);

        // `parsed` can be null if the model truncates structured output. Fail
        // open so a real finance question is never silently rejected.
        const relevant = parsed?.relevant ?? true;

        return relevant
          ? { guardianResult: { relevant: true } }
          : { guardianResult: { relevant: false, reason: 'off_topic' } };
      } catch (err) {
        // Transient failure → rethrow so the node's retryPolicy re-attempts the
        // classification with backoff (a rate-limit blip shouldn't reject a real
        // finance question). Permanent failure → fail closed and end the turn.
        if (isRetryableError(err)) throw err;
        this.logger.warn('Guardian classification failed; ending turn', err);
        return { guardianResult: { relevant: false, reason: 'error' } };
      }
    };
  }

  /**
   * Reject/terminal node — emits the reply matching the guardian's end reason
   * (off-topic, empty, or error). No model call. Defaults to the off-topic reply
   * if a reason is somehow absent.
   */
  private buildRejectNode() {
    return (state: AdvisorStateType): Partial<AdvisorStateType> => {
      const reason = state.guardianResult?.reason ?? 'off_topic';
      return { messages: [new AIMessage(ADVISOR_END_MESSAGES[reason])] };
    };
  }

  /**
   * Compact node — keeps the persisted message history bounded.
   *
   * No-op until the history exceeds {@link COMPACTION_THRESHOLD}. Past that, the
   * oldest messages are summarised by the cheap {@link COMPACTION_MODEL} and the
   * channel is rewritten to `[summary, ...last MESSAGES_TO_KEEP]` — clearing the
   * old messages via `REMOVE_ALL_MESSAGES` first so the summary replaces them
   * rather than stacking on top. On a summariser failure it leaves history as-is.
   */
  private buildCompactNode() {
    return async (
      state: AdvisorStateType,
    ): Promise<Partial<AdvisorStateType>> => {
      const { messages, summary } = state;
      if (messages.length <= COMPACTION_THRESHOLD) return {};

      const toSummarize = messages.slice(0, messages.length - MESSAGES_TO_KEEP);
      const toKeep = messages.slice(-MESSAGES_TO_KEEP);

      const transcript = toSummarize
        .map((m) => `${this.roleLabel(m)}: ${extractText(m.content)}`)
        .join('\n');

      try {
        const prompt = [
          new SystemMessage(COMPACTION_SYSTEM),
          new HumanMessage(
            summary
              ? `Existing summary:\n${summary}\n\nNew transcript to merge:\n${transcript}`
              : transcript,
          ),
        ];

        const newSummary = await this.compactionModel.invoke(prompt);

        return {
          summary: extractText(newSummary.content),
          messages: [new RemoveMessage({ id: REMOVE_ALL_MESSAGES }), ...toKeep],
        };
      } catch (err) {
        this.logger.warn('Compaction failed; keeping full history', err);
        return {};
      }
    };
  }

  /**
   * Respond node — the main advisor. Builds a persona-rich, scope-aware system
   * prompt from the user's granted scopes (read from `runtime.context`) and
   * answers with the deep-reasoning {@link RESPOND_MODEL}, bound to the scope-
   * gated tools so it can fetch the user's real data on demand.
   *
   * The node itself never reads the database — the bound tools do, each gated by
   * {@link withScope}. The reply may carry tool calls, which routing sends to the
   * tools node before looping back here.
   */
  private buildRespondNode() {
    return async (
      state: AdvisorStateType,
      runtime: Runtime,
    ): Promise<Partial<AdvisorStateType>> => {
      // The graph carries no context schema, so `runtime.context` is loosely
      // typed; we pass `AdvisorContext` at invoke time (see `chat`).
      const context = runtime.context as AdvisorContext | undefined;
      const grantedScopes = context?.grantedScopes ?? [];
      const basePrompt = buildAdvisorSystemPrompt(grantedScopes);
      const summaryBlock = state.summary?.trim()
        ? `\n\nConversation summary so far:\n${state.summary.trim()}`
        : '';

      // Long-term memory recall (cross-conversation). Cheap store reads, ranked
      // semantically by the latest user message.
      const latestUserText = extractText(
        [...state.messages].reverse().find((m) => m instanceof HumanMessage)
          ?.content,
      );
      const memoryBlock = context
        ? await this.readUserMemory(
            runtime.store,
            context.userId,
            latestUserText,
          )
        : '';

      const systemPrompt = new SystemMessage(
        `${extractText(basePrompt.content)}${summaryBlock}${memoryBlock}`,
      );

      // Bind ONLY the tools this user has granted, per request. The model can't
      // call a tool it isn't given, so a revoked scope is enforced authoritatively
      // here — not just by the in-tool `withScope` backstop. Binding is per
      // invocation, so each user's scopes are independent (no shared global bind).
      const model = this.respondModel.bindTools!(
        this.toolsForScopes(grantedScopes),
      );

      const reply = await model.invoke([systemPrompt, ...state.messages]);

      return { messages: [reply] };
    };
  }

  /**
   * The tools available for a given run: every public tool plus the user-data
   * tools whose gating scope the user has granted. A tool with no entry in
   * {@link TOOL_SCOPES} (oracle/public data) is always included.
   */
  private toolsForScopes(grantedScopes: AdvisorScope[]) {
    return this.tools.filter((t) => {
      const required = TOOL_SCOPES[t.name];
      return !required || grantedScopes.includes(required);
    });
  }

  /**
   * Memory node — runs once per completed turn (after respond, no tool calls).
   * On a cadence ({@link MEMORY_EXTRACTION_EVERY}) it distils durable facts from
   * the recent transcript with the cheap {@link MEMORY_MODEL} and writes them to
   * the cross-thread store, so later conversations recall them. Always advances
   * `turnCount`. Best-effort: extraction/write failures never break the turn.
   */
  private buildMemoryNode() {
    return async (
      state: AdvisorStateType,
      runtime: Runtime,
    ): Promise<Partial<AdvisorStateType>> => {
      const turnCount = (state.turnCount ?? 0) + 1;
      const store = runtime.store;
      const context = runtime.context as AdvisorContext | undefined;

      // Cadence gate — only extract every Nth turn to amortise the extra call.
      if (!store || !context || turnCount % MEMORY_EXTRACTION_EVERY !== 0) {
        return { turnCount };
      }

      try {
        const transcript = state.messages
          .slice(-MEMORY_SOURCE_MESSAGES)
          .map((m) => `${this.roleLabel(m)}: ${extractText(m.content)}`)
          .join('\n')
          .trim();
        if (!transcript) return { turnCount };

        const chain = this.langChain.buildStructuredChain({
          modelId: MEMORY_MODEL,
          schema: MemoryExtractionSchema,
          structuredOutputOptions: { strict: true },
        });
        const { parsed } = await chain.invoke([
          new SystemMessage(MEMORY_EXTRACTION_SYSTEM),
          new HumanMessage(transcript),
        ]);

        if (parsed) await this.writeUserMemory(store, context.userId, parsed);
      } catch (err) {
        this.logger.warn('Memory extraction failed; skipping', err);
      }

      return { turnCount };
    };
  }

  // ── Long-term memory (store) ────────────────────────────────────────────────

  /** Stable, deduping key for a free-text memory fact. */
  private memoryKey(text: string): string {
    return createHash('sha1')
      .update(text.trim().toLowerCase())
      .digest('hex')
      .slice(0, 16);
  }

  /**
   * Persists extracted durable facts to the cross-thread store. Preferences are a
   * single merged `profile` item (not embedded); context/patterns are written as
   * individual, content-keyed (deduped) items so they can be semantically
   * recalled. Capped per namespace to bound growth.
   */
  private async writeUserMemory(
    store: BaseStore,
    userId: string,
    memory: MemoryExtraction,
  ): Promise<void> {
    const now = dayjs().toISOString();
    const ops: Promise<void>[] = [];

    if (memory.currency || memory.tone) {
      const prefNs = ['user', userId, MEMORY_NAMESPACE.PREFERENCES];
      const existing = await store.get(prefNs, MEMORY_PREFERENCES_KEY);
      ops.push(
        store.put(
          prefNs,
          MEMORY_PREFERENCES_KEY,
          {
            ...(existing?.value ?? {}),
            ...(memory.currency ? { currency: memory.currency } : {}),
            ...(memory.tone ? { tone: memory.tone } : {}),
            updatedAt: now,
          },
          false, // preferences are fetched by key, never embedded
        ),
      );
    }

    for (const fact of memory.context.slice(0, MEMORY_WRITE_MAX)) {
      ops.push(
        store.put(
          ['user', userId, MEMORY_NAMESPACE.CONTEXT],
          this.memoryKey(fact),
          {
            text: fact,
            updatedAt: now,
          },
        ),
      );
    }

    for (const fact of memory.patterns.slice(0, MEMORY_WRITE_MAX)) {
      ops.push(
        store.put(
          ['user', userId, MEMORY_NAMESPACE.PATTERNS],
          this.memoryKey(fact),
          { text: fact, updatedAt: now },
        ),
      );
    }

    await Promise.all(ops);
  }

  /**
   * Recalls long-term memory for the prompt: preferences (by key) plus the most
   * relevant context and pattern facts (semantic search, ranked by the latest
   * user message). Returns a formatted block to append to the system prompt, or
   * an empty string when there is nothing to recall.
   */
  private async readUserMemory(
    store: BaseStore | undefined,
    userId: string,
    query: string,
  ): Promise<string> {
    if (!store) return '';

    try {
      const search = { query: query || undefined, limit: MEMORY_READ_LIMIT };
      const [prefItem, contextItems, patternItems] = await Promise.all([
        store.get(
          ['user', userId, MEMORY_NAMESPACE.PREFERENCES],
          MEMORY_PREFERENCES_KEY,
        ),
        store.search(['user', userId, MEMORY_NAMESPACE.CONTEXT], search),
        store.search(['user', userId, MEMORY_NAMESPACE.PATTERNS], search),
      ]);

      const prefs = prefItem?.value as
        | { currency?: string; tone?: string }
        | undefined;
      const context = contextItems
        .map((i) => extractText((i.value as { text?: string })?.text))
        .filter(Boolean);
      const patterns = patternItems
        .map((i) => extractText((i.value as { text?: string })?.text))
        .filter(Boolean);

      const lines: string[] = [];
      if (prefs?.currency)
        lines.push(`- Preferred currency: ${prefs.currency}`);
      if (prefs?.tone) lines.push(`- Communication preference: ${prefs.tone}`);
      if (context.length) lines.push(`- About them: ${context.join('; ')}`);
      if (patterns.length)
        lines.push(`- Known patterns: ${patterns.join('; ')}`);

      if (!lines.length) return '';

      return (
        '\n\nWhat you already know about this user from past conversations ' +
        '(use naturally only when relevant — do not recite it back):\n' +
        lines.join('\n')
      );
    } catch (err) {
      this.logger.warn('Memory read failed; continuing without it', err);
      return '';
    }
  }

  /** Short role label for a message, used when building a compaction transcript. */
  private roleLabel(message: AdvisorStateType['messages'][number]): string {
    if (message instanceof HumanMessage) return 'User';
    if (message instanceof AIMessage) return 'Advisor';
    if (message instanceof SystemMessage) return 'Context';
    return 'Message';
  }

  // ── Routing ─────────────────────────────────────────────────────────────────

  /**
   * Routes out of the guardian: relevant messages proceed into the advisor body
   * (compact → respond); off-topic, empty, and errored messages go to reject.
   */
  private routeAfterGuardian = (state: AdvisorStateType): string =>
    state.guardianResult?.relevant
      ? ADVISOR_NODES.COMPACT
      : ADVISOR_NODES.REJECT;

  /**
   * Routes out of respond: if the model requested tool calls, run them; otherwise
   * the turn is complete — fall through to the memory node before ending.
   */
  private routeAfterRespond = (state: AdvisorStateType): string => {
    const last = state.messages.at(-1);
    const toolCalls = (last as AIMessage | undefined)?.tool_calls;
    return toolCalls && toolCalls.length > 0
      ? ADVISOR_NODES.TOOLS
      : ADVISOR_NODES.MEMORY;
  };

  /**
   * Maps a graph stream event to a wire chunk, or null to drop it.
   *
   * Only the `respond` node's tokens are streamed to the user — guardian and
   * compaction model output is internal and filtered out. The `reject` node
   * emits a canned reply without an LLM call, so it produces no tokens; we
   * forward its message text from the node's state update instead (it never
   * streams tokens, so there is no risk of double-emitting). All other `state`
   * events are server-only progress and dropped.
   */
  public toChunk(
    event: GraphStreamEvent<AdvisorStateType>,
  ): AdvisorChunkRes | null {
    switch (event.type) {
      case 'token':
        if (event.node && event.node !== ADVISOR_NODES.RESPOND) return null;
        return { type: 'token', content: event.content, data: '' };
      case 'state': {
        if (event.node !== ADVISOR_NODES.REJECT) return null;
        const text = extractText(event.state.messages?.at(-1)?.content);
        return text ? { type: 'token', content: text, data: '' } : null;
      }
      case 'approval_required':
        return {
          type: 'approval_required',
          content: '',
          data: JSON.stringify(event.action),
        };
      case 'permission_required':
        return {
          type: 'permission_required',
          content: '',
          data: JSON.stringify({ scope: event.scope, reason: event.reason }),
        };
      default:
        return null;
    }
  }
}
