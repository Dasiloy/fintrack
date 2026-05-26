# AI Service — Architecture & Implementation Guide

## Packages

LangChain and LangGraph both have official TypeScript SDKs:

```
openai                 — OpenAI native SDK
@anthropic-ai/sdk      — Anthropic Claude native SDK
@google/generative-ai  — Google Generative AI native SDK
langchain              — core chains, prompt templates, output parsers
@langchain/core        — base abstractions (runnable, messages)
@langchain/langgraph   — graph-based agent workflows
@langchain/openai      — OpenAI/Azure LangChain integration
@langchain/anthropic   — Anthropic (Claude) LangChain integration
@langchain/google-genai — Google Gemini LangChain integration
```

---

## Library Installation

### Required packages (already in `apps/ai_service/package.json`)

```bash
pnpm install \
  langchain \
  @langchain/core \
  @langchain/langgraph \
  @langchain/langgraph-checkpoint-postgres \
  @langchain/openai \
  @langchain/anthropic \
  @langchain/google-genai \
  openai \
  @anthropic-ai/sdk \
  @google/generative-ai \
  zod \
  pdf-parse \
  sharp
```

### Web app only (advisor UI streaming)

```bash
# Install in apps/web only
pnpm install ai
```

The Vercel AI SDK (`ai`) is only needed in `apps/web` for the `useChat` hook and `createDataStreamResponse`.

### Environment variables (`apps/ai_service/.env`)

```env
MICROSERVICE_NAME=AI_SERVICE

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GEN_AI_API_KEY=...

# Financial oracle (free tier)
ALPHA_VANTAGE_API_KEY=...   # free — 25 calls/day
```

### TypeScript config

LangGraph and LangChain require `"moduleResolution": "bundler"` or `"node16"` in your tsconfig. The default `"node"` resolution will miss ESM sub-path exports.

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "NodeNext"
  }
}
```

---

## What the AI Service Is Responsible For

Four distinct domains. Each is a separate NestJS module.

```
┌─────────────────────────────────────────────────────────────────┐
│                          ai_service                              │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │Classification│  │   Insights   │  │      Advisor         │   │
│  │   Module     │  │   Module     │  │      Module          │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
│         └─────────────────┴──────────────────────┘               │
│                           │                                      │
│              RegistoryModule  (@Global)                          │
│   LangChainService · LangGraphService · ModelRessolver           │
│         OpenAI     ·   Anthropic     ·    Google                 │
└───────────────────────────┬──────────────────────────────────────┘
                            │ gRPC
              ┌─────────────┴──────────────┐
              │       api_gateway          │
              └────────────────────────────┘
```

---

## Service Architecture — Two Layers

### Layer 1: `RegistoryModule` — `@Global`

The single global module. Provides everything a feature module needs — LLM provider repos, embedding repos, the model resolver, and the LangChain/LangGraph composition services. Feature modules inject these directly; nothing else needs to be imported.

```
ModelRessolver
  ├── OpenAiRepo         getRunnable() → ChatOpenAI (LangChain BaseChatModel)
  │                      stream()      → AsyncIterable<string> (native SDK)
  │                      transcribe()  → Whisper
  │                      synthesize()  → TTS-1
  ├── AnthropicRepo      getRunnable() → ChatAnthropic
  │                      stream()      → AsyncIterable<string>
  └── GoogleRepo         getRunnable() → ChatGoogleGenerativeAI
                         stream()      → AsyncIterable<string>

EmbeddingRepo
  ├── OpenAiEmbeddingRepo   getEmbeddings() / embed()
  └── GoogleEmbeddingRepo   getEmbeddings() / embed()

LangChainService    buildChain() / buildStructuredChain() / getModel()
LangGraphService    compile() / invoke() / stream() / streamEvents() / getModel()
```

**Directory structure:**

```
apps/ai_service/src/registory/
├── registory.module.ts
├── langchain.types.ts         ← shared types for LangChain/LangGraph options
├── repositories/
│   ├── model.ressolver.ts
│   ├── llm.repo.ts            ← abstract LlmRepo base
│   ├── embedding.repo.ts      ← abstract EmbeddingRepo base
│   ├── open_i.repo.ts         ← OpenAiRepo
│   ├── arthropic_repo.ts      ← AnthropicRepo
│   ├── google.repo.ts         ← GoogleRepo
│   ├── openai-embedding.repo.ts
│   ├── google-embedding.repo.ts
│   └── index.ts
├── services/
│   ├── langchain.service.ts
│   └── langgraph.service.ts
└── index.ts
```

#### `langchain.types.ts`

```typescript
import { Runnable } from '@langchain/core/runnables';
import { BaseMessage } from '@langchain/core/messages';
import { StructuredOutputMethodOptions } from '@langchain/core/language_models/base';
import { BaseCheckpointSaver, StreamMode } from '@langchain/langgraph';
import { InteropZodType } from '@langchain/core/utils/types/zod';
import { ChatModelId } from '@fintrack/types/interfaces/ai';

export interface BuildChainOptions<TInput = BaseMessage[], TOutput = string> {
  modelId: ChatModelId;
  prompt?: Runnable<TInput, BaseMessage[]> | null;
  parser?: Runnable<BaseMessage, TOutput> | null;
}

export interface BuildStructuredChainOptions<TOutput extends Record<string, unknown>> {
  modelId: ChatModelId;
  schema: InteropZodType<TOutput>;
  prompt?: Runnable<BaseMessage[], BaseMessage[]> | null;
  structuredOutputOptions?: Pick<
    StructuredOutputMethodOptions<false>,
    'name' | 'method' | 'strict'
  >;
}

export interface CompileGraphOptions {
  // 'memory' → new MemorySaver()  |  BaseCheckpointSaver → passed through  |  false → stateless
  checkpointer?: BaseCheckpointSaver | 'memory' | false;
  // 'memory' → new InMemoryStore()  |  BaseStore → passed through  |  false → none
  store?: BaseStore | 'memory' | false;
  interruptBefore?: string[];
  interruptAfter?: string[];
}

export interface InvokeGraphOptions {
  threadId?: string;
  configurable?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface StreamGraphOptions extends InvokeGraphOptions {
  streamMode?: StreamMode | StreamMode[];
}

// Discriminated union yielded by LangGraphService.streamEvents()
export type GraphStreamEvent<TState> =
  | { type: 'token'; content: string }
  | { type: 'state'; node: string; state: Partial<TState> }
  | { type: 'approval_required'; action: AdvisorAction }; // human-in-the-loop pause

// Advisor action types — proposals requiring explicit user approval before execution
export type AdvisorAction =
  | { kind: 'adjust_budget'; budgetId: string; categorySlug: string; currentLimit: number; proposedLimit: number; reason: string }
  | { kind: 'create_budget'; categorySlug: string; proposedLimit: number; reason: string }
  | { kind: 'adjust_goal_contribution'; goalId: string; currentAmount: number; proposedAmount: number; reason: string }
  | { kind: 'suggest_recurring'; name: string; amount: number; categorySlug: string; frequency: string; reason: string }
  | { kind: 'flag_subscription'; name: string; amount: number; categorySlug: string; reason: string };
```

#### `services/langchain.service.ts`

```typescript
import { RunnableSequence, Runnable } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseMessage } from '@langchain/core/messages';
import { Injectable } from '@nestjs/common';
import { ChatModelId } from '@fintrack/types/interfaces/ai';
import { ModelRessolver } from '../registory/repositories/model.ressolver';
import { BuildChainOptions, BuildStructuredChainOptions } from './langchain.types';

@Injectable()
export class LangChainService {
  constructor(private readonly resolver: ModelRessolver) {}

  // Layout: [prompt →] model [→ parser (defaults to StringOutputParser)]
  // Feature services call this once in onModuleInit() — stateless factory.
  buildChain<TInput = BaseMessage[], TOutput = string>(
    opts: BuildChainOptions<TInput, TOutput>,
  ): Runnable<TInput, TOutput> {
    const model = this.resolver.getRunnable(opts.modelId);
    const parser = (opts.parser ?? new StringOutputParser()) as Runnable<BaseMessage, TOutput>;
    if (opts.prompt) {
      return opts.prompt.pipe(model as Runnable).pipe(parser) as Runnable<TInput, TOutput>;
    }
    return RunnableSequence.from([model, parser]) as Runnable<TInput, TOutput>;
  }

  // Layout: [prompt →] model.withStructuredOutput(schema)
  buildStructuredChain<TOutput extends Record<string, unknown>>(
    opts: BuildStructuredChainOptions<TOutput>,
  ): Runnable<BaseMessage[], TOutput> {
    const model = this.resolver.getRunnable(opts.modelId);
    const structured = model.withStructuredOutput<TOutput>(opts.schema as any, {
      name: opts.structuredOutputOptions?.name,
      method: opts.structuredOutputOptions?.method,
      strict: opts.structuredOutputOptions?.strict,
    });
    if (opts.prompt) return opts.prompt.pipe(structured) as Runnable<BaseMessage[], TOutput>;
    return structured as Runnable<BaseMessage[], TOutput>;
  }

  getModel(modelId: ChatModelId): BaseChatModel {
    return this.resolver.getRunnable(modelId);
  }
}
```

#### `services/langgraph.service.ts`

```typescript
import {
  StateGraph,
  CompiledStateGraph,
  MemorySaver,
  BaseCheckpointSaver,
  InMemoryStore,
  BaseStore,
} from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Injectable } from '@nestjs/common';
import { ChatModelId } from '@fintrack/types/interfaces/ai';
import { ModelRessolver } from '../registory/repositories/model.ressolver';
import {
  CompileGraphOptions,
  InvokeGraphOptions,
  StreamGraphOptions,
  GraphStreamEvent,
  AdvisorAction,
} from './langchain.types';

@Injectable()
export class LangGraphService {
  constructor(private readonly resolver: ModelRessolver) {}

  compile<S = any, U = any, N extends string = string>(
    graph: StateGraph<any, S, U, N>,
    opts?: CompileGraphOptions,
  ): CompiledStateGraph<S, U, N> {
    let checkpointer: BaseCheckpointSaver | undefined;
    if (opts?.checkpointer === 'memory') checkpointer = new MemorySaver();
    else if (opts?.checkpointer && opts.checkpointer !== false) checkpointer = opts.checkpointer;

    let store: BaseStore | undefined;
    if (opts?.store === 'memory') store = new InMemoryStore();
    else if (opts?.store && opts.store !== false) store = opts.store;

    return graph.compile({
      checkpointer,
      store,
      interruptBefore: opts?.interruptBefore,
      interruptAfter: opts?.interruptAfter,
    });
  }

  async invoke<TState>(
    graph: CompiledStateGraph<TState, any, any>,
    input: Partial<TState>,
    opts?: InvokeGraphOptions,
  ): Promise<TState> {
    return graph.invoke(input, this.buildConfig(opts)) as Promise<TState>;
  }

  async stream<TState>(
    graph: CompiledStateGraph<TState, any, any>,
    input: Partial<TState>,
    opts?: StreamGraphOptions,
  ) {
    return graph.stream(input, {
      ...this.buildConfig(opts),
      streamMode: opts?.streamMode ?? 'updates',
    });
  }

  async *streamEvents<TState>(
    graph: CompiledStateGraph<TState, any, any>,
    input: Partial<TState>,
    opts?: InvokeGraphOptions,
  ): AsyncGenerator<GraphStreamEvent<TState>> {
    const stream = await graph.stream(input, {
      ...this.buildConfig(opts),
      streamMode: ['messages', 'updates'],
    });
    for await (const chunk of stream) {
      const [mode, payload] = chunk as [string, unknown];
      if (mode === 'messages') {
        const [msgChunk] = payload as [{ content: unknown }, unknown];
        const text =
          typeof msgChunk?.content === 'string'
            ? msgChunk.content
            : ((msgChunk?.content as any)?.[0]?.text ?? '');
        if (text) yield { type: 'token', content: text };
      } else if (mode === 'updates') {
        for (const [node, state] of Object.entries(payload as Record<string, Partial<TState>>)) {
          if (node === '__interrupt__') {
            const action = (state as any)?.pendingAction as AdvisorAction | undefined;
            if (action) yield { type: 'approval_required', action };
          } else {
            yield { type: 'state', node, state };
          }
        }
      }
    }
  }

  getModel(modelId: ChatModelId): BaseChatModel {
    return this.resolver.getRunnable(modelId);
  }

  private buildConfig(opts?: InvokeGraphOptions) {
    if (!opts?.threadId && !opts?.configurable) return undefined;
    return {
      configurable: {
        ...(opts.threadId && { thread_id: opts.threadId }),
        ...opts.configurable,
      },
    };
  }
}
```

#### `registory.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';
import {
  OpenAiRepo, AnthropicRepo, GoogleRepo,
  OpenAiEmbeddingRepo, GoogleEmbeddingRepo, ModelRessolver,
} from './repositories';
import { LangChainService } from './services/langchain.service';
import { LangGraphService } from './services/langgraph.service';

@Global()
@Module({
  providers: [
    OpenAiRepo, AnthropicRepo, GoogleRepo,
    OpenAiEmbeddingRepo, GoogleEmbeddingRepo,
    ModelRessolver,
    LangChainService,
    LangGraphService,
  ],
  exports: [ModelRessolver, LangChainService, LangGraphService],
})
export class RegistoryModule {}
```

### Layer 2: Feature Layer

Feature modules own their own state schema, node functions, and graph topology. Because `RegistoryModule` is `@Global`, they inject `LangChainService` and `LangGraphService` directly.

---

## LangChain & LangGraph — Types and API Reference

### LangChain

#### `Runnable<TInput, TOutput>`

The core interface in LangChain. Anything that has `invoke(input): Promise<TOutput>` is a `Runnable`. Chat models, prompt templates, output parsers, and entire chains are all `Runnable`. Makes LCEL pipe composition possible because everything shares the same interface.

#### LCEL — `pipe()` composition

```typescript
const chain = prompt.pipe(model).pipe(parser);
chain.invoke({ question: '...' }); // → parsed output
```

`RunnableSequence.from([a, b, c])` is equivalent to `a.pipe(b).pipe(c)`.

#### `BaseChatModel`

Abstract base class for all LangChain chat models. `ModelRessolver.getRunnable()` returns `BaseChatModel` — graph nodes call models without depending on a provider-specific class.

#### Message types

```typescript
new SystemMessage('You are a financial advisor.');
new HumanMessage('How much did I spend on food?');
new AIMessage('You spent ₦12,500 on food.');
```

#### `model.withStructuredOutput(schema, options?)`

Wraps the model with a structured extraction contract. Use Zod schemas with `strict: true` for maximum reliability:

```typescript
const structured = model.withStructuredOutput(
  z.object({ category: z.string(), confidence: z.number() }),
  { strict: true },
);
const result = await structured.invoke(messages); // typed as { category: string; confidence: number }
```

#### Output Parsers

- `StringOutputParser` — extracts `.content` as plain string. Default in `buildChain()`. Use for all prose outputs (summaries, advisor responses, narratives).
- `JsonOutputParser` — parses model output as JSON. Use when `withStructuredOutput` is unavailable.

**Critical rule:** Parsers belong to `buildChain()` only. Never attach a parser to `buildStructuredChain()` — `withStructuredOutput` already returns a typed object and there is no `AIMessage` to parse.

#### `ChatPromptTemplate.fromMessages()`

```typescript
const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a financial advisor. User context: {context}'],
  ['human', '{question}'],
]);
```

#### `tool(fn, { name, schema })`

```typescript
import { tool } from '@langchain/core/tools';

const getSpendingSummary = tool(
  async ({ userId, period }) => prisma.transaction.groupBy(...),
  {
    name: 'getSpendingSummary',
    description: 'Get total spending by category for a period.',
    schema: z.object({ userId: z.string(), period: z.string() }),
  }
);
```

---

### LangGraph

#### `StateGraph` and what state means

Nodes never mutate state directly. They return a partial update and LangGraph merges it:

```typescript
const node = async (state) => ({ summary: '...' }); // correct — return only what changed
```

#### Defining state — `Annotation.Root()` and reducers

```typescript
import { Annotation } from '@langchain/langgraph';

const MyState = Annotation.Root({
  summary: Annotation<string>({ default: () => '' }),
  anomalies: Annotation<string[]>({
    default: () => [],
    reducer: (current, update) => current.concat(update),
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: messagesReducer,
    default: () => [],
  }),
});
```

#### `START` and `END`

Sentinel constants for graph entry/exit. Every graph must have `addEdge(START, 'firstNode')` and at least one path reaching `END`.

#### `graph.addNode()`, `graph.addEdge()`, `graph.addConditionalEdges()`

```typescript
builder.addNode('guardian', guardianNode);
builder.addEdge(START, 'guardian');
builder.addConditionalEdges(
  'respond',
  (state) => state.messages.at(-1)?.tool_calls?.length ? 'tools' : END,
  ['tools', END],
);
```

#### `graph.compile({ checkpointer, store, interruptBefore })`

| Option            | Type                  | Effect                                            |
| ----------------- | --------------------- | ------------------------------------------------- |
| `checkpointer`    | `BaseCheckpointSaver` | Thread-scoped state persistence (conversation history) |
| `store`           | `BaseStore`           | Cross-thread key-value + semantic storage (long-term memory) |
| `interruptBefore` | `string[]`            | Pause before named nodes — enables human-in-the-loop |
| `interruptAfter`  | `string[]`            | Pause after named nodes                           |

#### `MemorySaver` and `PostgresSaver`

Short-term memory per thread. Dev: `MemorySaver()` (in-process, lost on restart). Prod: `PostgresSaver` from `@langchain/langgraph-checkpoint-postgres` (durable, creates `langgraph_checkpoints` table).

#### `InMemoryStore` and `PostgresStore`

Cross-thread long-term memory. Nodes access via the `runtime` second parameter. Supports semantic search with `{ query, limit }` when configured with an embeddings index.

```typescript
const respondNode = async (state, runtime) => {
  const userId = runtime.context?.userId as string;
  const prefs = await runtime.store?.search(['user', userId, 'preferences']); // plain scan
  const context = await runtime.store?.search(['user', userId, 'context'], { query: userMessage, limit: 5 }); // semantic
};
```

#### Human-in-the-loop — `interrupt_before`

The advisor pauses execution before taking an action that requires user approval. State is serialised to the checkpointer; the SSE stream emits `{ type: 'approval_required', action }`; the frontend shows an approval card; the user's response resumes the graph.

```
[advisor_node] → decides action needed
      ↓
[__interrupt__] ← graph pauses, state saved
      ↓ user approves / rejects via frontend
[action_node]   → executes if approved, skips if rejected
      ↓
[respond_node]  → confirms action to user
```

```typescript
// Compile with interrupt
this.graph = this.langGraph.compile(builder, {
  checkpointer: this.checkpointer,
  interruptBefore: ['action'],
});

// Resume after user decision
await this.graph.invoke(
  { approved: userDecision },
  { configurable: { thread_id: conversationId } },
);
```

#### `graph.invoke()` and `graph.stream()`

`invoke` returns the final state. `stream` yields incremental updates via `streamMode`:

| `streamMode`              | Each chunk                                      |
| ------------------------- | ----------------------------------------------- |
| `'values'`                | Full state after each node                      |
| `'updates'`               | Partial update each node returned               |
| `'messages'`              | Individual token chunks (for streaming to UI)   |
| `['messages', 'updates']` | Both — tokens for display, state for server     |

#### `thread_id` and `configurable`

```typescript
graph.invoke({ messages: [msg] }, { configurable: { thread_id: 'conv-abc' } });
// Next turn: LangGraph restores state for 'conv-abc' automatically
```

#### `GraphStreamEvent<TState>` — discriminated union

```typescript
for await (const event of langGraph.streamEvents(graph, input, opts)) {
  if (event.type === 'token') res.write(event.content);
  else if (event.type === 'approval_required') sendApprovalCard(event.action);
  else log(event.node, event.state);
}
```

---

## Domain 1 — Transaction Classification

### What it does

Receives transactions that scored 0 in token scoring (Mono said `unknown`, no merchant match, narration is opaque), classifies them against the user's actual category list, and returns a `{ transactionId → categorySlug }` map.

### Why LangChain (not LangGraph)

Single, stateless, structured extraction call — no agent loop, no tool use, no branching.

### Data shapes

```typescript
interface ClassifyTransactionsReq {
  transactions: Array<{ id: string; narration: string; bankCategory: string }>;
  categories: Array<{ name: string; slug: string }>;
}

interface ClassifyTransactionsRes {
  assignments: Record<string, string>; // { [transactionId]: categorySlug }
}
```

### Flow

```
ClassifyTransactionsReq
  │
  ChatPromptTemplate
    system: "You are a financial transaction classifier.
             User's categories: {categories_json}
             {few_shot_block?}
             Return JSON: { [id]: slug }"
    human:  "{transactions_json}"
  │
  ChatGoogleGenerativeAI (gemini-2.5-flash — withStructuredOutput, strict mode)
  │
  validate: every slug in response exists in user's category list
  │
  ClassifyTransactionsRes
```

### Retry on parse failure

If the model returns malformed JSON, retry once with the error appended to the prompt. If it fails again, assign the fallback category to all remaining transactions. Never throw — the batch create must always complete.

### gRPC method

```proto
rpc ClassifyTransactions(ClassifyTransactionsReq) returns (ClassifyTransactionsRes) {}
```

### Feedback Loop — Learning from User Corrections

When a user corrects a category, embed the narration and store it in `classification_corrections`. Before the next classification call, retrieve the top-5 most similar past corrections via cosine search and inject them as few-shot examples.

```
User changes category (UI)
  │
  finance_service: BullMQ → { event: 'CategoryCorrected', narration, correctedSlug }
  │
  ai_service EmbeddingWorker: embed narration → store in classification_corrections
  │
  ─────────────────────────────────────────────────────────
  Next classification call for same userId
  │
  embed incoming narrations → cosine search top-5 corrections
  │
  inject as few-shot examples in ChatPromptTemplate
```

---

## Domain 2 — AI Insights

### What it does

Proactively generates a rich set of observations about a user's financial patterns. Not charts — prose, ranked recommendations, and goal alerts derived from their real data. Runs on a schedule and on significant events.

### Insight types produced

| Insight | Trigger | Example |
|---------|---------|---------|
| **Spending anomaly** | Post-sync / daily | "Food spend up 3× vs weekly average — ₦47k this week" |
| **Monthly narrative** | Month-end | Full prose summary with comparisons and one recommendation |
| **Budget breach warning** | Real-time on tx create (≥60%) | "Food budget 68% used with 12 days left. On track to overspend ₦8,200." |
| **Goal pacing alert** | Weekly | "Emergency Fund 2 months behind target. ₦3,000/mo extra gets you back on track." |
| **Subscription detection** | Weekly | "3 streaming services totalling ₦12,400/mo detected." |
| **Cash flow forecast** | Weekly | "Based on recurring items, ₦28,500 available after the 15th." |
| **Split nudge** | Weekly | "Emeka owes ₦15,000 — open 47 days. Your other splits settled in < 2 weeks." |
| **Macro context** | On generation | "₦8,000 grocery increase partially explained by ~18% Nigerian food CPI." |

### Why LangGraph (not a plain chain)

Generating a meaningful insight set involves decision logic — which metrics are interesting, whether to fetch additional context, and how to rank observations. That loop is a graph.

### LangGraph workflow

```
[start]
  │
  ▼
[load_context_node]
  reads: last 3 InsightSets from Postgres ai_insights table (trend awareness)
  reads: current analytics snapshots from Postgres analytics_snapshots table
  reads: goals, budgets, recurring_items, splits from Postgres
  reads: macro context from financial oracle (CBN rate, CPI) via Redis-cached tools
  │
  ▼
[summarize_node]              ← google:gemini-2.5-pro
  builds concise financial summary from all context
  │
  ▼
[detect_anomalies_node]       ← anthropic:claude-sonnet-4.6
  identifies spending anomalies, budget breaches, subscription patterns
  │
  ▼
[goal_pacing_node]            ← google:gemini-2.5-flash
  evaluates goal progress against target dates, computes gap
  │
  ▼
[cash_flow_node]              ← google:gemini-2.5-flash
  models upcoming cash flow from recurring items + income patterns
  │
  ▼
[recommend_node]              ← anthropic:claude-sonnet-4.6
  generates ranked, concrete recommendations — not generic advice
  │
  ▼
[end] → upserts AiInsight row in Postgres → invalidates Redis cache
```

### State

```typescript
const InsightState = Annotation.Root({
  userId: Annotation<string>(),
  transactions: Annotation<any[]>({ default: () => [] }),
  historicalInsights: Annotation<any[]>({ default: () => [] }),
  analyticsSnapshot: Annotation<any>(),
  goals: Annotation<any[]>({ default: () => [] }),
  budgets: Annotation<any[]>({ default: () => [] }),
  recurringItems: Annotation<any[]>({ default: () => [] }),
  splits: Annotation<any[]>({ default: () => [] }),
  macroContext: Annotation<MacroContext>(),
  summary: Annotation<string>({ default: () => '' }),
  anomalies: Annotation<string[]>({
    default: () => [],
    reducer: (curr, upd) => curr.concat(upd),
  }),
  goalAlerts: Annotation<string[]>({
    default: () => [],
    reducer: (curr, upd) => curr.concat(upd),
  }),
  cashFlowForecast: Annotation<string>({ default: () => '' }),
  recommendations: Annotation<InsightRecommendation[]>({ default: () => [] }),
});

interface InsightRecommendation {
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: 'budget' | 'goal' | 'spending' | 'saving' | 'cashflow';
  actionable: boolean;
}

interface MacroContext {
  ngnUsdRate: number;
  foodCpiYoY: number;      // % change YoY
  cbnPolicyRate: number;
  fetchedAt: string;
}
```

### Data shapes

```typescript
interface InsightsJobPayload {
  userId: string;
  trigger: 'daily' | 'post_sync' | 'month_end' | 'budget_breach';
  metadata?: { categorySlug?: string; budgetId?: string };
}

interface GenerateInsightsRes {
  summary: string;
  anomalies: string[];
  goalAlerts: string[];
  cashFlowForecast: string;
  recommendations: InsightRecommendation[];
  macroContext: MacroContext;
  generatedAt: string;
}
```

### Real-time budget breach trigger

Budget breach warnings fire immediately when a transaction pushes a category past 60%, not on the next scheduled run.

```typescript
// finance_service — inside createTransaction handler
const budgetCheck = await checkBudgetUtilisation(userId, categorySlug, db);
if (budgetCheck.pct >= 0.6) {
  await insightsQueue.add('insights:budget_breach', {
    userId,
    trigger: 'budget_breach',
    metadata: { categorySlug, budgetId: budgetCheck.budgetId },
  });
}
```

### When insights are generated

```
scheduler_service (daily cron)
  → BullMQ: InsightsJobPayload { trigger: 'daily' }

scheduler_service (month-end cron)
  → BullMQ: InsightsJobPayload { trigger: 'month_end' }

finance_service (post bank sync, >10 new transactions)
  → BullMQ: InsightsJobPayload { trigger: 'post_sync' }

finance_service (budget utilisation ≥ 60%)
  → BullMQ: InsightsJobPayload { trigger: 'budget_breach', metadata: { categorySlug } }

frontend tRPC: advisor.getInsights()
  → Redis cache key "insights:{userId}" (TTL 1h)
  → miss: Postgres → populate Redis
```

### gRPC method

```proto
rpc GenerateInsights(GenerateInsightsReq) returns (GenerateInsightsRes) {}
```

### Implementation Phases — AI Insights

Build in this order. Each phase is independently testable before moving to the next.

#### Phase 1: Postgres migrations

Add `AnalyticsSnapshot` and `AiInsight` models to `schema.prisma` (models defined in the Analytics Architecture section below). Run:

```bash
pnpm --filter @fintrack/database prisma migrate dev --name add_analytics_insights
```

Verify the GIN index on the `data` JSONB column is present in the generated SQL. Both tables must appear in Neon's table explorer before proceeding.

#### Phase 2: Nightly aggregation job (scheduler_service)

Build an `AnalyticsAggregationJob` in `scheduler_service` that runs nightly. For each active user, compute:

- `totalIncome` / `totalExpense` / `netSavings` via Prisma aggregation on current month's transactions
- `topCategories` — group by `categoryId`, sum amounts, take top 10
- `budgetUtilisation` — for each active budget, compute current month spend vs limit
- `goalProgress` — for each goal, current `savedAmount` vs `targetAmount`

Upsert the result into `analytics_snapshots` using `@@unique([userId, period, type])` where `period = 'YYYY-MM'` and `type = 'monthly_summary'`. On month end (last day of month), also upsert `quarterly_summary` and `yearly_summary` rollups.

Test: run the job manually for a single `userId`. Verify an `analytics_snapshots` row is written with the correct JSON shape.

#### Phase 3: InsightsModule scaffold

Create in `apps/ai_service/src/insights/`:

```
insights.module.ts
insights.service.ts
insights.controller.ts   — gRPC GenerateInsights handler
insights.worker.ts       — BullMQ consumer for InsightsJobPayload
```

Wire `InsightsModule` into `AppModule`. The BullMQ worker registers on the `insights` queue and delegates to `InsightsService.runGraph(payload)`. The gRPC `GenerateInsights` handler calls `InsightsService.runGraph` directly (used by the scheduler when a synchronous response is needed). At this stage `runGraph` can return a hardcoded stub — unblock the queue → service → gRPC path end-to-end before adding graph nodes.

#### Phase 4: `load_context_node`

First real graph node. Queries all inputs the graph needs in parallel:

```typescript
const loadContextNode = async (state: typeof InsightState.State) => {
  const [historicalInsights, snapshot, goals, budgets, recurringItems, splits, macroContext] =
    await Promise.all([
      prisma.aiInsight.findMany({
        where: { userId: state.userId },
        orderBy: { generatedAt: 'desc' },
        take: 3,
      }),
      prisma.analyticsSnapshot.findFirst({
        where: { userId: state.userId, type: 'monthly_summary' },
        orderBy: { computedAt: 'desc' },
      }),
      financeClient.getGoals({ userId: state.userId }),
      financeClient.getBudgets({ userId: state.userId }),
      financeClient.getRecurringItems({ userId: state.userId }),
      financeClient.getSplits({ userId: state.userId, status: 'OPEN' }),
      oracleService.getMacroContext(),   // Redis-cached NGN rate + CPI
    ]);
  return { historicalInsights, analyticsSnapshot: snapshot?.data, goals, budgets, recurringItems, splits, macroContext };
};
```

Test: assert that after this node runs, `InsightState` is fully populated and `macroContext.ngnUsdRate` is a non-null float.

#### Phase 5: `summarize_node`

Uses `google:gemini-2.5-pro`. Input: all loaded context from Phase 4. Output: a concise 3–5 sentence prose summary of the user's current financial position. The prompt must instruct the model to reference concrete numbers from the `analyticsSnapshot` (income, spend, savings rate, largest category). The summary feeds into all subsequent nodes as grounding context.

Test: invoke with a real user's data. Verify the output references actual amounts from their snapshot, not placeholder figures.

#### Phase 6: `detect_anomalies_node`

Uses `anthropic:claude-sonnet-4.6`. Input: summary + transaction data (last 30 days, grouped by week and category). Detects:

- Category spend spikes (this week vs 4-week rolling average per category)
- Potential subscriptions (same merchant, similar amounts, weekly or monthly cadence)
- Unusual single transactions (>2σ from the user's typical spend in that category)

Output: `anomalies[]` — prose strings like `"Food spend ₦47k this week vs ₦15k weekly average."` Include macro context when a spend increase may be partially explained by CPI data.

Test: seed 4 weeks of normal food spend and one spike week. Verify the spike is detected. Verify inflation context is appended when the spike aligns with CPI data.

#### Phase 7: `goal_pacing_node`

Uses `google:gemini-2.5-flash`. Input: goals array from Phase 4. For each active goal compute:

- Days remaining = `targetDate − today`
- Monthly contribution needed = `(targetAmount − savedAmount) / monthsRemaining`
- Current monthly contribution = average of last 3 months' contributions to that goal
- Pacing status = ahead / on-track / behind

Output: `goalAlerts[]` — include only goals that are behind or at risk. Example: `"Emergency Fund is ₦45,000 short. ₦3,750/mo extra gets you back on track by your December deadline."`

Test: create a goal that is 2 months behind schedule. Verify the alert fires with the correct catch-up amount.

#### Phase 8: `cash_flow_node`

Uses `google:gemini-2.5-flash`. Input: recurring items + current month transactions. Computes:

- Recurring expenses already paid this month (matched against logged transactions)
- Recurring expenses still due this month (not yet logged)
- Expected income from recurring income items due this month
- Net available = current balance + expected income − remaining dues

Output: `cashFlowForecast` — single prose sentence: `"After recurring bills, ₦28,500 available after the 15th."`

Test: seed 3 recurring expenses (₦5k, ₦10k, ₦8k) and 1 recurring income (₦150k). Verify the forecast arithmetic is correct and the sentence reads naturally.

#### Phase 9: `recommend_node`

Uses `anthropic:claude-sonnet-4.6`. Input: the full `InsightState` (summary + anomalies + goal alerts + cash flow). Output: ranked concrete recommendations — `InsightRecommendation[]` with `text`, `priority`, `category`, and `actionable` fields.

Requirements:
- Must be actionable — not generic advice ("save more money" is rejected)
- Must reference specific amounts and categories from the user's data
- Ranked by priority: `'high' | 'medium' | 'low'`
- At most 5 recommendations per run

Test: run with a user who has one spending anomaly (food spike) and one behind-track goal. Verify both surface as separate recommendations with the correct priority and specific numbers.

#### Phase 10: Write result + cache invalidation

After `recommend_node` completes, upsert the result and clear the Redis cache:

```typescript
await prisma.aiInsight.create({
  data: {
    userId,
    trigger: payload.trigger,
    summary: state.summary,
    anomalies: state.anomalies,
    goalAlerts: state.goalAlerts,
    cashFlowForecast: state.cashFlowForecast ?? null,
    recommendations: state.recommendations,
    macroContext: state.macroContext,
  },
});
await redis.del(`insights:${userId}`);
```

The key is deleted (not set) — the tRPC endpoint re-populates it on the next read. Verify the `ai_insights` row appears in the database after the job completes.

#### Phase 11: Real-time budget breach trigger

Wire into `finance_service.createTransaction`. After the transaction is persisted and category spend is updated:

```typescript
const budgetCheck = await checkBudgetUtilisation(userId, categorySlug, db);
if (budgetCheck.pct >= 0.6) {
  await insightsQueue.add('insights:budget_breach', {
    userId,
    trigger: 'budget_breach',
    metadata: { categorySlug, budgetId: budgetCheck.budgetId },
  });
}
```

The job fires immediately — not on the next cron tick. The graph receives `trigger: 'budget_breach'` and the `detect_anomalies_node` receives the specific category slug in its payload, ensuring the output is focused on the breach rather than generating a full insights run.

Test: create a transaction that pushes Food to 65% of its budget. Verify a `budget_breach` insight is generated within seconds and mentions Food specifically.

#### Phase 12: tRPC endpoint + Redis cache

Add `advisor.getInsights` to the tRPC router in `api_gateway`:

```typescript
getInsights: protectedProcedure.query(async ({ ctx }) => {
  const cacheKey = `insights:${ctx.session.user.id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const insight = await prisma.aiInsight.findFirst({
    where: { userId: ctx.session.user.id },
    orderBy: { generatedAt: 'desc' },
  });
  if (!insight) return null;

  await redis.set(cacheKey, JSON.stringify(insight), 'EX', 3600);
  return insight;
}),
```

Test the three paths:
- Redis HIT → returns cached data, no Postgres query
- Redis MISS → hits Postgres, populates cache
- After a `budget_breach` job runs (which calls `redis.del`) → next `getInsights` re-fetches from Postgres

#### Phase 13: Insights UI

Build the combined Insights + Advisor page at `/dashboard/advisor` (design provided separately). The insights panel renders:

- **Summary card** — the `summary` prose text
- **Anomaly chips** — each `anomalies[]` item as a dismissible card with a warning icon
- **Goal alert cards** — each `goalAlerts[]` item with a "Fix it" CTA that deep-links to the goals page
- **Cash flow forecast** — single card with the `cashFlowForecast` string
- **Recommendation list** — sorted by priority, each with category icon and an `actionable` badge

All data fetched via `advisor.getInsights` tRPC call on page load. No polling — insights update in the background via cron and budget breach triggers and are fresh on the next load.

---

## Domain 3 — Financial Advisor

### What it does

A proactive financial advisor — not a chatbot. The advisor knows the user's actual financial position, acts on their behalf with approval, and communicates like a trusted advisor rather than a search engine. It responds only to finance-related questions, accepts images and PDFs, and can propose concrete actions the user approves in one tap.

Examples of advisor behaviour:

- "You've spent ₦47k on food this week — 3× your usual ₦15k. Want me to flag when any category hits 2× your weekly average?"
- "Looking at your bank statement PDF, I can see 3 direct debits you haven't categorised. Want me to add them as recurring items?"
- "Your rent clears on the 28th. Based on your current balance and upcoming bills, you'll need ₦85k available by then. You're on track."
- *[approval card]* "Raise Food budget ₦30k → ₦42k?" → one tap approve

### Finance Guardian — Token-efficient intent filter

The first node on every invocation. Uses the cheapest model to classify the message as finance-related or not, short-circuiting before any tool calls or expensive model runs.

```
[START]
  │
  ▼
[guardian_node]  ← google:gemini-2.5-flash (~200 tokens — cheap, fast)
  outputs: { relevant: boolean }
  │
  ├── relevant = false → [reject_node] → canned response → END
  │
  └── relevant = true → [compact_node] → [respond_node] → ...
```

**Cost:** ~200 tokens per rejected message vs ~2,000+ for a full advisor round-trip.

```typescript
const GuardianSchema = z.object({ relevant: z.boolean() });

const guardianNode = async (state: typeof AdvisorState.State) => {
  const lastMessage = state.messages.at(-1)?.content as string;
  const chain = langChain.buildStructuredChain({
    modelId: 'google:gemini-2.5-flash',
    schema: GuardianSchema,
    structuredOutputOptions: { strict: true },
  });
  const result = await chain.invoke([
    new SystemMessage(
      `Finance relevance classifier. Return relevant: true only if the user message is about
       personal finance — spending, budgets, goals, savings, transactions, income, bills,
       bank accounts, or financial planning. Be permissive in a financial app context.
       Off-topic messages (general knowledge, coding, recipes, etc.) return relevant: false.`,
    ),
    new HumanMessage(lastMessage),
  ]);
  return { guardianResult: result };
};
```

### Advisor Identity — System Prompt

Every request builds a rich system prompt from the user's current financial position. This grounds every response in real data without requiring tool calls for basic context.

```typescript
function buildAdvisorSystemPrompt(context: AdvisorContext): SystemMessage {
  return new SystemMessage(`You are Fintrack Advisor — a personal financial advisor for ${context.userName}.

## Your role
You are an advisor, not a chatbot. Give concrete, specific recommendations backed by the user's
actual numbers. Do not give generic financial advice. Every response should reference something
specific about this user's finances.

## User's current position (as of ${context.date})
- Monthly income: ${formatNGN(context.monthlyIncome)}
- Monthly spending (this month so far): ${formatNGN(context.monthlySpending)}
- Savings rate: ${context.savingsRate}%
- Active budgets: ${context.budgetSummary}
- Goals: ${context.goalsSummary}
- Net balance this month: ${formatNGN(context.netBalance)}

## Communication style
- Speak plainly. No jargon.
- Lead with the insight, follow with the number, end with a recommendation.
- When you need data, call a tool — do not guess.
- If the user is off-track financially, say so directly but constructively.
- Use ₦ for amounts. Format large numbers with commas (₦12,500).
- Keep responses focused: one insight, one number, one recommendation per message.

## Nigerian context
Be aware of Nigerian payment services (Kuda, OPay, GTBank, Access, UBA), seasonal spending
(school fees Jan/Sept, Christmas Dec), and NGN inflation effects on purchasing power.

## Boundaries
Finance questions only. You can read images and PDFs — analyse bank statements, receipts,
and financial documents the user shares.`);
}
```

### Multimodal Input — Images and PDFs

The advisor accepts image files and PDFs alongside text messages. Files are passed as multimodal message content — Gemini 1.5+ accepts PDFs natively, Claude 3+ accepts base64 images.

```typescript
interface FileAttachment {
  type: 'image' | 'pdf';
  base64: string;
  mimeType: string;
  filename?: string;
}

const buildMultimodalMessage = (text: string, attachments: FileAttachment[]): HumanMessage => {
  if (!attachments.length) return new HumanMessage(text);

  const content: any[] = [{ type: 'text', text }];
  for (const attachment of attachments) {
    if (attachment.type === 'image') {
      content.push({
        type: 'image_url',
        image_url: { url: `data:${attachment.mimeType};base64,${attachment.base64}` },
      });
    } else if (attachment.type === 'pdf') {
      content.push({ type: 'media', data: attachment.base64, mimeType: 'application/pdf' });
    }
  }
  return new HumanMessage({ content });
};
```

**Use cases:**
- Bank statement PDF → advisor extracts transactions, identifies patterns, suggests categories
- Receipt image → identifies merchant, amount, category, suggests transaction entry
- Screenshot of a bill → identifies recurring payment, offers to add as recurring item

### Financial Data Oracle Tools

The advisor can call external financial data feeds for macroeconomic context. All results are Redis-cached before being returned to the agent.

```typescript
// NGN/USD exchange rate — free tier
const getNgnExchangeRate = tool(
  async () => {
    const cached = await redis.get('oracle:ngn_rate');
    if (cached) return JSON.parse(cached);
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    const result = { usdToNgn: data.rates.NGN, fetchedAt: new Date().toISOString() };
    await redis.set('oracle:ngn_rate', JSON.stringify(result), 'EX', 3600); // 1h TTL
    return result;
  },
  {
    name: 'getNgnExchangeRate',
    description: 'Get current USD/NGN exchange rate. Use when user asks about forex or foreign currency amounts.',
    schema: z.object({}),
  },
);

// Nigerian inflation / CPI — World Bank (completely free, no key)
const getNigerianInflation = tool(
  async ({ year }: { year?: number }) => {
    const targetYear = year ?? new Date().getFullYear() - 1;
    const cacheKey = `oracle:ng_cpi:${targetYear}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    const res = await fetch(
      `https://api.worldbank.org/v2/country/NG/indicator/FP.CPI.TOTL.ZG?format=json&date=${targetYear}`,
    );
    const [, data] = await res.json();
    const result = { year: targetYear, inflationRate: data[0]?.value ?? null };
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400); // 24h TTL
    return result;
  },
  {
    name: 'getNigerianInflation',
    description: 'Get Nigerian annual CPI inflation rate. Use when contextualising year-over-year spending increases.',
    schema: z.object({ year: z.number().optional() }),
  },
);

// Alpha Vantage — forex, stocks, economic indicators (free tier: 25 calls/day)
const getMarketData = tool(
  async ({ symbol, type }: { symbol: string; type: 'forex' | 'stock' }) => {
    const cacheKey = `oracle:market:${type}:${symbol}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    const fn = type === 'forex' ? 'CURRENCY_EXCHANGE_RATE' : 'GLOBAL_QUOTE';
    const param = type === 'forex' ? `from_currency=${symbol}&to_currency=NGN` : `symbol=${symbol}`;
    const res = await fetch(`https://www.alphavantage.co/query?function=${fn}&${param}&apikey=${apiKey}`);
    const data = await res.json();
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 14400); // 4h TTL
    return data;
  },
  {
    name: 'getMarketData',
    description: 'Get forex rates or stock quotes via Alpha Vantage. Use for investment context or foreign currency exposure.',
    schema: z.object({
      symbol: z.string().describe('Currency code (e.g. USD, GBP) or stock ticker'),
      type: z.enum(['forex', 'stock']),
    }),
  },
);
```

**Oracle cache TTLs:**

| Oracle | Rate limit | Cache TTL |
|--------|-----------|-----------|
| exchangerate-api.com | 1,500 req/month free | 1h |
| World Bank | Unlimited (public) | 24h |
| Alpha Vantage | 25 req/day free | 4h |

### Postgres Tools (User Data)

Full set of tools the advisor can call against the user's real financial data:

```typescript
const getTransactions = tool(
  async ({ userId, startDate, endDate, categorySlug, type, limit }) => {
    return prisma.transaction.findMany({
      where: {
        userId,
        ...(startDate && { date: { gte: new Date(startDate) } }),
        ...(endDate && { date: { lte: new Date(endDate) } }),
        ...(categorySlug && { category: { slug: categorySlug } }),
        ...(type && { type }),
      },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: limit ?? 20,
    });
  },
  {
    name: 'getTransactions',
    description: 'Fetch recent transactions with optional filters for date range, category, and type.',
    schema: z.object({
      userId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      categorySlug: z.string().optional(),
      type: z.enum(['INCOME', 'EXPENSE']).optional(),
      limit: z.number().int().max(100).default(20),
    }),
  },
);

const getSpendingSummary = tool(
  async ({ userId, period, groupBy }) => { /* prisma aggregation */ },
  {
    name: 'getSpendingSummary',
    description: 'Get total spending grouped by category or time period.',
    schema: z.object({
      userId: z.string(),
      period: z.enum(['this_week', 'this_month', 'last_month', 'last_3_months', 'this_year']),
      groupBy: z.enum(['category', 'week', 'month']).default('category'),
    }),
  },
);

const getBudgets = tool(
  async ({ userId }) => { /* prisma query with current period spend vs limit */ },
  {
    name: 'getBudgets',
    description: 'Get all user budgets with current period spend vs limit.',
    schema: z.object({ userId: z.string() }),
  },
);

const getGoals = tool(
  async ({ userId }) => { /* prisma query with contribution history and pacing */ },
  {
    name: 'getGoals',
    description: 'Get savings goals with target amounts, saved amounts, and deadline pacing.',
    schema: z.object({ userId: z.string() }),
  },
);

const getRecurringItems = tool(
  async ({ userId }) => { /* prisma query */ },
  {
    name: 'getRecurringItems',
    description: 'Get all recurring income and expense items (bills, subscriptions, income).',
    schema: z.object({ userId: z.string() }),
  },
);

const getSplits = tool(
  async ({ userId, status }) => { /* prisma query with participant details and settlement status */ },
  {
    name: 'getSplits',
    description: 'Get group expense splits — open, settled, or all.',
    schema: z.object({
      userId: z.string(),
      status: z.enum(['OPEN', 'SETTLED', 'ALL']).default('OPEN'),
    }),
  },
);

const getCategoryBreakdown = tool(
  async ({ userId, startDate, endDate }) => { /* prisma aggregation */ },
  {
    name: 'getCategoryBreakdown',
    description: 'Get spending breakdown by category for a custom date range.',
    schema: z.object({ userId: z.string(), startDate: z.string(), endDate: z.string() }),
  },
);

// Vector tool — semantic fuzzy questions
const semanticSearchTransactions = tool(
  async ({ userId, query, limit }) => { /* pgvector cosine search — see RAG section */ },
  {
    name: 'semanticSearchTransactions',
    description: 'Find transactions semantically matching a natural language description. Use for fuzzy questions like "forgotten subscriptions" or "last time I splurged".',
    schema: z.object({
      userId: z.string(),
      query: z.string(),
      limit: z.number().int().max(20).default(10),
    }),
  },
);
```

### Agentic Actions — Proposals with Human-in-the-Loop Approval

The advisor can propose concrete changes to the user's financial setup. These always require explicit user approval. The `action_node` is never reached without the user accepting via the approval card in the UI.

**Action types:**

| Action | Description |
|--------|-------------|
| `adjust_budget` | Raise or lower an existing budget limit |
| `create_budget` | Create a new budget for an un-budgeted category |
| `adjust_goal_contribution` | Increase monthly contribution to a goal |
| `suggest_recurring` | Create a new recurring item from a detected pattern |
| `flag_subscription` | Mark a transaction pattern as a subscription |

**Graph flow:**

```
[respond_node] model outputs { proposedAction: AdvisorAction }
  │
  ▼
[__interrupt__]  ← graph pauses, checkpointed
                   SSE stream yields { type: 'approval_required', action }
                   Frontend renders inline approval card in advisor UI

User taps Approve → POST /api/advisor/resume { approved: true }
User taps Reject  → POST /api/advisor/resume { approved: false }
  │
  ▼
[action_node]
  approved: execute action via internal gRPC call to finance_service
  rejected: record rejection in store — never re-propose the same thing
  │
  ▼
[respond_node] confirms: "Done — your Food budget is now ₦42,000."
```

```typescript
const actionNode = async (state: typeof AdvisorState.State, runtime) => {
  if (!state.approved || !state.proposedAction) {
    // Record rejection so advisor doesn't re-propose
    const userId = runtime.context?.userId as string;
    if (state.proposedAction) {
      await runtime.store?.put(
        ['user', userId, 'rejections'],
        `${state.proposedAction.kind}:${JSON.stringify(state.proposedAction)}`,
        { rejectedAt: new Date().toISOString() },
      );
    }
    return { proposedAction: null, actionResult: 'rejected' };
  }

  const action = state.proposedAction;
  const userId = runtime.context?.userId as string;

  switch (action.kind) {
    case 'adjust_budget':
      await financeClient.updateBudget({ budgetId: action.budgetId, limit: action.proposedLimit, userId });
      return { actionResult: `Budget updated to ₦${action.proposedLimit.toLocaleString()}`, proposedAction: null };

    case 'create_budget':
      await financeClient.createBudget({ categorySlug: action.categorySlug, limit: action.proposedLimit, userId });
      return { actionResult: `Budget created`, proposedAction: null };

    case 'adjust_goal_contribution':
      await financeClient.updateGoalContribution({ goalId: action.goalId, monthlyAmount: action.proposedAmount, userId });
      return { actionResult: `Monthly contribution updated`, proposedAction: null };

    case 'suggest_recurring':
      await financeClient.createRecurringItem({ ...action, userId });
      return { actionResult: `Recurring item added`, proposedAction: null };
  }
};
```

### Transaction-time Advisor Triggers (FE inline)

The frontend shows advisor suggestions inline during transaction creation without requiring a full advisor conversation. Fast Postgres query — no AI involved.

```typescript
// tRPC procedure
checkBudgetImpact: protectedProcedure
  .input(z.object({ categorySlug: z.string(), amount: z.number(), date: z.string() }))
  .query(async ({ ctx, input }) => {
    const budget = await getBudgetForCategory(ctx.session.user.id, input.categorySlug);
    if (!budget) return { willBreach: false, willWarn: false };

    const currentSpend = await getMonthlySpend(ctx.session.user.id, input.categorySlug, startOfMonth(new Date(input.date)));
    const projectedPct = (currentSpend + input.amount) / budget.limit;

    return {
      willBreach: projectedPct > 1,
      willWarn: projectedPct > 0.8,
      currentPct: currentSpend / budget.limit,
      projectedPct,
      budgetLimit: budget.limit,
      currentSpend,
    };
  }),
```

FE usage in transaction form: when category or amount changes, debounce 300ms → query `advisor.checkBudgetImpact` → if `willWarn` or `willBreach`, show inline banner: *"Food budget is 68% used (₦20,400 of ₦30,000). Adding this will push it to 82%."*

### LangGraph Agent Loop

```
[START]
  │
  ▼
[guardian_node]      ← gemini-2.5-flash — finance relevance check (~200 tokens)
  │
  ├── irrelevant → [reject_node] → END
  │
  └── relevant
        │
        ▼
[compact_node]       ← no-op if messages ≤ 20, else summarise oldest
  │
  ▼
[respond_node]       ← claude-sonnet-4.6 — main advisor (tools + oracle + user data)
  │
  ├── tool call   → [tool_node] → [compact_node] → (loop)
  │
  ├── action proposal → [__interrupt__] → (wait for user) → [action_node] → [respond_node]
  │
  └── final answer  → END
```

### State

```typescript
const AdvisorState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  userId: Annotation<string>(),
  guardianResult: Annotation<{ relevant: boolean } | null>({ default: () => null }),
  proposedAction: Annotation<AdvisorAction | null>({ default: () => null }),
  approved: Annotation<boolean | null>({ default: () => null }),
  actionResult: Annotation<string | null>({ default: () => null }),
  attachments: Annotation<FileAttachment[]>({ default: () => [] }),
});
```

### Memory Architecture

```
Short-term (checkpointer — per thread)
  What:  Full message history for the current conversation
  Dev:   MemorySaver()
  Prod:  PostgresSaver (langgraph_checkpoints table)

Long-term (store — cross thread)
  What:  User preferences, detected patterns, rejected proposals
  Dev:   InMemoryStore({ index: { embeddings, dims: 1536 } })
  Prod:  PostgresStore (langgraph_store table + vector index)

Store namespaces:
  ['user', userId, 'preferences']  — currency, tone
  ['user', userId, 'context']      — "freelancer", "saving for house", semantic-searched
  ['user', userId, 'patterns']     — recurring flags, known merchants, semantic-searched
  ['user', userId, 'rejections']   — proposals user has previously rejected

Compaction thresholds:
  COMPACTION_THRESHOLD = 20   messages before summarising oldest
  MESSAGES_TO_KEEP = 6        always keep the most recent N messages
```

### Service Pattern

```typescript
// advisor.module.ts
@Module({
  providers: [
    {
      provide: ADVISOR_CHECKPOINTER,
      useFactory: async () => {
        const saver = new PostgresSaver(new Pool({ connectionString: process.env.DATABASE_URL }));
        await saver.setup();
        return saver;
      },
    },
    {
      provide: ADVISOR_STORE,
      useFactory: async (embeddingRepo: OpenAiEmbeddingRepo) => {
        const store = new PostgresStore(
          new Pool({ connectionString: process.env.DATABASE_URL }),
          { index: { embeddings: embeddingRepo.getEmbeddings(), dims: 1536 } },
        );
        await store.setup();
        return store;
      },
      inject: [OpenAiEmbeddingRepo],
    },
    AdvisorService,
  ],
  exports: [AdvisorService],
})
export class AdvisorModule {}
```

```typescript
// advisor.service.ts (core structure)
@Injectable()
export class AdvisorService implements OnModuleInit {
  private graph: CompiledStateGraph<any, any, any>;

  constructor(
    private readonly langGraph: LangGraphService,
    private readonly langChain: LangChainService,
    @Inject(ADVISOR_CHECKPOINTER) private readonly checkpointer: PostgresSaver,
    @Inject(ADVISOR_STORE) private readonly store: PostgresStore,
    private readonly prisma: PrismaService,
    private readonly financeClient: FinanceServiceClient,
  ) {}

  onModuleInit() {
    const tools = this.buildTools();           // all Postgres + oracle tools
    const toolNode = new ToolNode(tools);
    const model = this.langGraph.getModel('anthropic:claude-sonnet-4.6').bindTools(tools);

    const builder = new StateGraph(AdvisorState)
      .addNode('guardian', this.buildGuardianNode())
      .addNode('reject', () => ({
        messages: [new AIMessage("I'm your financial advisor — finance questions only.")],
      }))
      .addNode('compact', this.buildCompactNode())
      .addNode('respond', this.buildRespondNode(model))
      .addNode('tools', toolNode)
      .addNode('action', this.buildActionNode())
      .addEdge(START, 'guardian')
      .addConditionalEdges('guardian',
        (s) => s.guardianResult?.relevant ? 'compact' : 'reject',
        ['compact', 'reject'])
      .addEdge('reject', END)
      .addEdge('compact', 'respond')
      .addConditionalEdges('respond', this.shouldContinue, ['tools', 'action', END])
      .addEdge('tools', 'compact')
      .addEdge('action', 'respond');

    this.graph = this.langGraph.compile(builder, {
      checkpointer: this.checkpointer,
      store: this.store,
      interruptBefore: ['action'],
    });
  }

  async *streamResponse(req: AdvisorMessageReq) {
    const userContext = await this.buildUserContext(req.userId);
    yield* this.langGraph.streamEvents(
      this.graph,
      {
        messages: [buildMultimodalMessage(req.message, req.attachments ?? [])],
        userId: req.userId,
        attachments: req.attachments ?? [],
      },
      {
        threadId: req.conversationId,
        context: { userId: req.userId, userContext },
      },
    );
  }

  async resumeAfterApproval(req: AdvisorApprovalReq) {
    return this.graph.invoke(
      { approved: req.approved },
      { configurable: { thread_id: req.conversationId } },
    );
  }

  private shouldContinue(state: typeof AdvisorState.State) {
    const last = state.messages.at(-1);
    if (last?.tool_calls?.length) return 'tools';
    if (state.proposedAction) return 'action';
    return END;
  }
}
```

### Data shapes

```typescript
interface AdvisorMessageReq {
  conversationId: string;   // maps to LangGraph thread_id
  userId: string;
  message: string;
  attachments?: FileAttachment[];
}

interface AdvisorChunkRes {
  delta: string;
  done: boolean;
}

interface AdvisorApprovalReq {
  conversationId: string;
  userId: string;
  approved: boolean;
}
```

### Streaming — Vercel AI SDK (web client only)

```
Browser
  useChat({ api: '/api/advisor' })  ← Vercel AI SDK — message state, loading, abort
  │  HTTP stream (AI SDK wire format)
  ▼
Next.js Route Handler  /api/advisor/route.ts
  proxies SSE chunks via createDataStreamResponse()
  surfaces approval_required as custom data annotations
  │  fetch/SSE
  ▼
api_gateway  /ai/advisor  (NestJS SSE endpoint)
  │  gRPC server-stream
  ▼
ai_service  AdvisorService  LangGraph agent
```

### gRPC methods

```proto
rpc SendAdvisorMessage(AdvisorMessageReq) returns (stream AdvisorChunkRes) {}
rpc ResumeAdvisorApproval(AdvisorApprovalReq) returns (AdvisorResumeRes) {}
```

### Implementation Phases — Financial Advisor

Build in this order. Each phase is independently testable before moving to the next.

#### Phase 1: Rename pass (Chat → Advisor)

Execute all renames from the Rename Map table. In order:

1. Rename directory: `apps/ai_service/src/chat/` → `apps/ai_service/src/advisor/`
2. Update all import paths in `AppModule` and any consumers
3. Rename classes: `ChatService` → `AdvisorService`, `ChatModule` → `AdvisorModule`, `ChatController` → `AdvisorController`
4. Rename types: `ChatMessageReq` → `AdvisorMessageReq`, `ChatChunkRes` → `AdvisorChunkRes`
5. Rename constants: `CHAT_CHECKPOINTER` → `ADVISOR_CHECKPOINTER`, `CHAT_STORE` → `ADVISOR_STORE`
6. Update proto file: `rpc Chat(...)` → `rpc SendAdvisorMessage(...)`; regenerate with `pnpm proto:gen`
7. Update Next.js route: `apps/web/src/app/api/chat/route.ts` → `apps/web/src/app/api/advisor/route.ts`
8. Update tRPC router key: `ai.chat` → `advisor.send`
9. Update FE component: `chat.tsx` → `advisor.tsx`
10. Update pricing copy: all instances of `"AI chat"` → `"AI Advisor"`

Verification: `grep -rn "chat" apps/ai_service/src/ apps/web/src/app/\(dashboard\)/advisor/` should return zero matches in advisor-related files.

#### Phase 2: Postgres memory infrastructure

Set up `PostgresSaver` and `PostgresStore` before writing a single graph node. Use environment-gated factories:

```typescript
// Development
const checkpointer = new MemorySaver();
const store = new InMemoryStore({ index: { embeddings, dims: 1536 } });

// Production
const checkpointer = new PostgresSaver(new Pool({ connectionString: process.env.DATABASE_URL }));
await checkpointer.setup();   // creates langgraph_checkpoints table

const store = new PostgresStore(
  new Pool({ connectionString: process.env.DATABASE_URL }),
  { index: { embeddings: embeddingRepo.getEmbeddings(), dims: 1536 } },
);
await store.setup();           // creates langgraph_store table + vector index
```

Wire `ADVISOR_CHECKPOINTER` and `ADVISOR_STORE` providers in `AdvisorModule` with `NODE_ENV`-based factories (see Service Pattern above). Verify both tables appear in Neon before adding any nodes.

#### Phase 3: Guardian node

Implement the finance relevance classifier as the first graph node. Wire the minimal graph skeleton — `guardian_node` and `reject_node` only:

```
START → guardian → (relevant? → compact : reject) → END
```

Test both branches independently before adding anything downstream:

- Finance question (`"How much did I spend on food?"`) → `guardianResult.relevant = true` → routes to `compact`
- Off-topic question (`"What is the capital of France?"`) → `guardianResult.relevant = false` → routes to `reject` → canned response

Measure token cost on the reject path — should be 150–250 tokens total. This validates the cost-efficiency of the guardian before the expensive path is built.

#### Phase 4: Compact node + respond node (core conversation loop)

Build the core advisor loop in three steps:

1. **`buildAdvisorSystemPrompt(context)`** — accepts `AdvisorContext`, returns a `SystemMessage` with the user's real financial position. Query the user's current month income, spending, savings rate, active budgets, and goals from Postgres to populate this. This runs on every invocation to ensure the advisor always has fresh context.

2. **`compactNode`** — no-op if `state.messages.length ≤ 20`. When the threshold is hit, summarise the oldest `(messages.length − MESSAGES_TO_KEEP)` messages into a single `SystemMessage` via `OpenAiRepo.summarize()`, then splice: `[compaction_summary, ...last_6_messages]`.

3. **`respondNode`** — invokes `claude-sonnet-4.6` with the system prompt + compacted message history. At this stage bind no tools — just verify the model responds in advisor voice with specific references to the user's real numbers from the system prompt.

Extend the graph:

```
START → guardian → compact → respond → END
```

Test: send `"Am I saving enough?"`. Verify the response mentions the user's actual savings rate and income figures, not generic advice.

#### Phase 5: Postgres tools (one at a time)

Add tools to `respondNode`'s binding one at a time. After adding each tool, test it independently via a direct `tool(...)` call before wiring into the graph.

Build and test in this order:

1. **`getTransactions`** — test: `"What did I spend on food last week?"` → tool called with `categorySlug: 'food'` and correct date range → response lists real transactions with amounts.

2. **`getSpendingSummary`** — test: `"How much did I spend this month by category?"` → `groupBy: 'category'` → response matches Prisma aggregation totals.

3. **`getBudgets`** — test: `"Which budgets am I close to hitting?"` → returns budgets with utilisation ≥ 70%.

4. **`getGoals`** — test: `"Am I on track for my Emergency Fund?"` → response includes calculated pacing.

5. **`getRecurringItems`** — test: `"What bills do I have coming up?"` → returns all active recurring expenses with amounts and frequencies.

6. **`getSplits`** — test: `"Who owes me money?"` → returns OPEN splits with participant names and outstanding amounts.

7. **`getCategoryBreakdown`** — test: custom date range → correctly groups spend, totals match direct Prisma query.

8. **`semanticSearchTransactions`** — requires pgvector embeddings to be populated (from the embedding worker). Test last: `"Any transactions that look like forgotten subscriptions?"` → returns semantically matching results.

After all 8 tools pass individual tests, run the full graph with all tools bound and verify the model selects the correct tool for each question type without hallucinating data.

#### Phase 6: Oracle tools + Redis caching

Add the three oracle tools to the tool set. Test each in isolation:

1. **`getNgnExchangeRate`** — cold call → Redis key `oracle:ngn_rate` is populated, TTL = 3600s. Warm call → returns cached result with zero HTTP requests. Verify with `"What's the dollar rate today?"`.

2. **`getNigerianInflation`** — cold call → World Bank API queried, result cached 24h. Test with `year: 2024` (current year may return null from the World Bank API). Verify `inflationRate` is a float, not null.

3. **`getMarketData`** — cold call with `symbol: 'GBP', type: 'forex'` → Alpha Vantage queried, cached 4h. Do not call the live Alpha Vantage API in automated tests (25 req/day limit) — stub this in unit tests, test live only manually.

After all three pass, verify a conversation that mentions `"the CBN rate"` or `"inflation"` triggers the appropriate oracle tool call automatically.

#### Phase 7: Streaming via Vercel AI SDK

Wire the full end-to-end streaming path:

1. **`ai_service`** — `AdvisorService.streamResponse()` calls `LangGraphService.streamEvents()` which yields `GraphStreamEvent` objects via gRPC server-stream.

2. **`api_gateway`** — SSE endpoint `/ai/advisor` consumes the gRPC stream and forwards chunks to the HTTP client as they arrive.

3. **`apps/web/src/app/api/advisor/route.ts`** — Next.js route handler wraps the api_gateway stream in `createDataStreamResponse()`. When an `approval_required` event arrives from the stream, emit it as a custom data annotation: `dataStream.writeData({ type: 'approval_required', action })`.

4. **`apps/web` advisor component** — uses `useChat({ api: '/api/advisor' })`. Subscribe to `data` from `useChat` to detect `approval_required` annotations alongside the normal token stream.

Tests:
- Send a message → streaming tokens appear in the UI within 500ms of the model beginning its response.
- Abort mid-stream → `useChat`'s abort controller cancels cleanly with no dangling gRPC streams.

#### Phase 8: Multimodal input

Add file attachment support to the advisor input:

1. **FE input**: add a file picker (accept: `image/*,application/pdf`) to the advisor message input area. On file select, read as base64 and attach to the next `useChat` message send as `body: { attachments: FileAttachment[] }`.

2. **`buildMultimodalMessage(text, attachments)`** — already defined above. Wire it in `AdvisorService.streamResponse()` so attachments are passed as multimodal content when present.

3. **Model routing**: route requests with PDF attachments to `google:gemini-2.5-pro` (native PDF support). Route requests with image attachments to `anthropic:claude-sonnet-4.6` (Claude 3+ vision). Text-only requests use `claude-sonnet-4.6` as normal.

4. Enforce 10 MB per-attachment limit — reject oversized files with a user-facing error before the request is sent.

Tests:
- Upload a bank statement PDF → verify the advisor extracts transactions and identifies patterns.
- Upload a receipt photo → verify the advisor identifies merchant, amount, and suggested category.
- Message with no attachment still works identically to before.

#### Phase 9: Long-term memory writes

After each `respond_node` turn, write detected patterns and preferences to `PostgresStore` so they persist across conversations:

```typescript
// Every 5 turns, update long-term memory
if (state.messages.length % 5 === 0) {
  const patterns = await extractPatterns(state.messages.slice(-10), langChain);
  await store.put(
    ['user', state.userId, 'patterns'],
    state.userId,
    {
      knownMerchants: patterns.knownMerchants,
      detectedSubscriptions: patterns.detectedSubscriptions,
      lastUpdated: new Date().toISOString(),
    },
  );
}
```

On graph start, read from `['user', userId, 'context']` and `['user', userId, 'preferences']` and inject into the system prompt as supplementary context.

Test: have a 10-message conversation about food spending patterns. Start a new conversation (new `threadId`). Verify the advisor references previously detected food patterns without the user re-stating them.

#### Phase 10: HITL interrupt + action node

Implement human-in-the-loop for agentic proposals:

1. Compile graph with `interruptBefore: ['action']`.

2. In `respondNode`: when the model detects an actionable opportunity (overspend, goal risk, subscription), it outputs a structured `proposedAction: AdvisorAction` field via a tool call or structured output wrapper alongside its prose message.

3. `LangGraphService.streamEvents()` surfaces the `__interrupt__` checkpoint as a `{ type: 'approval_required', action: AdvisorAction }` stream event — forwarded to the FE via the custom data annotation mechanism from Phase 7.

4. FE: detect the `approval_required` data event. Render an approval card inline below the advisor message showing a human-readable action summary. The card has two buttons: **Approve** and **Reject**.

5. Approve → `POST /api/advisor/resume { conversationId, approved: true }` → `AdvisorService.resumeAfterApproval()` → `graph.invoke({ approved: true }, { configurable: { thread_id } })` → `actionNode` executes the action via `financeClient` gRPC.

6. Reject → same flow with `approved: false` → `actionNode` writes a rejection entry to `['user', userId, 'rejections']` in `PostgresStore` so the advisor never re-proposes the same action.

Implement and test all 5 action types:

- `adjust_budget` → `financeClient.updateBudget` → verify budget limit changes in DB
- `create_budget` → `financeClient.createBudget` → verify new budget appears
- `adjust_goal_contribution` → `financeClient.updateGoalContribution` → verify goal updated
- `suggest_recurring` → `financeClient.createRecurringItem` → verify recurring item created
- `flag_subscription` → marks the transaction pattern — no write to finance_service, write to store only

Test rejection persistence: reject a proposal → start a new conversation → verify the advisor does not re-propose the same action.

#### Phase 11: Transaction-time inline warning

Implement `advisor.checkBudgetImpact` as a fast tRPC procedure — no AI, no LangGraph, pure Postgres:

```typescript
checkBudgetImpact: protectedProcedure
  .input(z.object({ categorySlug: z.string(), amount: z.number(), date: z.string() }))
  .query(async ({ ctx, input }) => {
    const budget = await getBudgetForCategory(ctx.session.user.id, input.categorySlug);
    if (!budget) return { willBreach: false, willWarn: false };

    const currentSpend = await getMonthlySpend(
      ctx.session.user.id,
      input.categorySlug,
      startOfMonth(new Date(input.date)),
    );
    const projectedPct = (currentSpend + input.amount) / budget.limit;

    return {
      willBreach: projectedPct > 1,
      willWarn: projectedPct > 0.8,
      currentPct: currentSpend / budget.limit,
      projectedPct,
      budgetLimit: budget.limit,
      currentSpend,
    };
  }),
```

Wire into `transaction_form_dialog.tsx`:
- Debounce 300ms on `categorySlug` or `amount` change
- `willWarn` (≥ 80%): yellow inline banner — `"Food budget 68% used. Adding this will push it to 82%."`
- `willBreach` (> 100%): red inline banner — `"This transaction exceeds your Food budget."`
- No budget for that category: no banner, no query

Test: create a Food budget at ₦30,000. Set current spend to ₦20,400 (68%). Enter ₦4,200 in the form → warning banner appears. Verify the query is debounced and fires once, not on every keystroke.

#### Phase 12: Conversation history UI

Build the conversation list panel alongside the advisor chat:

- Query `langgraph_checkpoints` for distinct `thread_id` values belonging to the user, ordered by latest `checkpoint_at` DESC (the `PostgresSaver` table schema includes this timestamp)
- Display each thread with: first message preview (truncated to 60 chars), timestamp, message count
- Clicking a thread sets the active `threadId` in `useChat` — LangGraph restores full conversation state from the checkpointer, and the full history renders
- **New conversation** button generates a fresh `threadId` (UUID v4) and clears the chat window

Test: start a conversation, close the browser, reopen, click the previous thread — verify the full conversation history is restored without re-sending any messages.

#### Phase 13: Compaction + trimming verification

End-to-end test of the memory compaction path:

1. Send 22 consecutive messages in a single conversation thread.
2. After message 20, verify `compactNode` fires: inspect `state.messages` — should contain 6 messages, with the first being a `SystemMessage` whose content is the compaction summary.
3. Verify the advisor's response to messages 21 and 22 correctly references content from messages 1–5 (which were compacted into the summary) — confirms the summary preserves semantic continuity.
4. Verify the compaction summary is coherent prose, not a JSON dump of messages.
5. Run a 40-message conversation. Verify compaction fires again after the next threshold, producing a second-generation summary that incorporates the first.

---

## RAG — Semantic Transaction Search

### Why it exists

SQL tools handle structured questions precisely:

```
"How much did I spend on food last month?" → getSpendingSummary({ period: 'last_month' })
```

But some questions are semantically vague and don't map to SQL predicates:

```
"When did I last really splurge?"
"Find any transaction that looks like a forgotten subscription."
"Which payments feel like mistakes?"
```

There is no `WHERE feels_like_mistake = true` column. These require vector embeddings.

### What is a vector embedding?

A list of 1536 numbers representing the _meaning_ of text. "KFC IKEJA food expense" and "fast food dinner payment" are different strings but their vectors are close in embedding space.

### Why pgvector — no new database

```
pgvector (what we use):
  Postgres (transactions + embeddings in the same row)
  One database, one query, joins work naturally.
  No sync, no extra infrastructure.
```

### Schema setup

```prisma
model Transaction {
  narration    String?
  bankCategory String?
  embedding    Unsupported("vector(1536)")?
}
```

HNSW index in migration:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX transactions_embedding_hnsw
  ON "Transaction"
  USING hnsw (embedding vector_cosine_ops);
```

Use **HNSW** (not IVFFlat): no training phase, handles continuous inserts without degrading search quality. Use `vector_cosine_ops` — measures angle between vectors, captures semantic similarity regardless of text length.

### What gets embedded

```typescript
function buildEmbeddingDocument(tx: Transaction, categoryName: string): string {
  return [
    tx.narration ?? tx.description,
    categoryName,
    tx.type === 'INCOME' ? 'income received' : 'expense paid',
    `amount ${tx.amount}`,
    format(tx.date, 'MMMM YYYY'),
  ].join(' ');
}
// "KFC IKEJA Food & Dining expense paid amount 4500 March 2026"
```

### When embeddings are generated

Background job via BullMQ after `batchCreateTransactions` completes:

```
finance_service: batchCreateTransactions completes
  → BullMQ: EmbeddingJobPayload { userId, transactionIds }
  → ai_service EmbeddingWorker: buildEmbeddingDocument() → OpenAI batch → UPDATE embedding
```

### The `semanticSearchTransactions` tool

```typescript
async function semanticSearchTransactions({ userId, query, limit = 10 }) {
  const [queryVector] = await embeddingRepo.embed([query], { model: 'text-embedding-3-small' });
  return prisma.$queryRaw`
    SELECT id, narration, description, amount, type, date, category_id,
           1 - (embedding <=> ${queryVector}::vector) AS similarity
    FROM transactions
    WHERE user_id = ${userId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${queryVector}::vector
    LIMIT ${limit}
  `;
}
```

### Two retrieval paths in the advisor

```
User question arrives
  │
  ▼
LangGraph respond_node → model decides:
  │
  ├── structured question → SQL tool → Postgres (exact aggregation)
  │
  └── semantic question → semanticSearchTransactions → pgvector cosine
                                                       top-k → grounded answer
```

---

## Analytics Architecture

### Two things called "analytics"

1. **Aggregated metrics** — numbers computed via SQL. "Total spent on food in March: ₦45,000."
2. **AI insights** — observations generated by the AI service. "You're spending significantly more on food than last month."

### Why Postgres (JSONB) for analytics snapshots

Analytics snapshots and AI insights are stored in two Postgres tables using `JSONB` columns for the flexible payload. Postgres 14+ supports full JSON operators, GIN indexing on JSONB, and partial updates — there is no reason to run a separate MongoDB instance. Everything stays in the same Neon database already used for the rest of the app.

| Requirement | How Postgres handles it |
|---|---|
| Flexible snapshot shape (varies by period/type) | `JSONB` column — no schema migration per new aggregation shape |
| Efficient reads by `userId` + `period` | B-tree index on `(user_id, period)` |
| JSON field queries (e.g. `data->>'totalIncome'`) | Native JSONB operators (`->`, `->>`, `@>`) |
| Historical insight lookups (last 3 runs) | `ORDER BY generated_at DESC LIMIT 3` — standard SQL |
| Atomic upsert of snapshot + invalidate Redis | Single transaction — no cross-database saga |

### Why Redis for serving

```
GET insights:{userId}   → Redis HIT → return immediately (TTL 1h)
                        → Redis MISS → Postgres → populate Redis → return
```

### Data flow

```
Postgres transactions
  │
  scheduler_service (nightly aggregation job)
  │
  ├─ computes: monthly totals, category breakdown, budget utilisation, goal progress
  ├─ upserts: analytics_snapshots table (JSONB)
  └─ publishes: BullMQ job → ai_service → generate insights → upserts ai_insights table (JSONB)

api_gateway tRPC (analytics.getSummary, advisor.getInsights)
  │
  Redis cache → (miss) → Postgres JSONB tables
```

### Postgres table schemas

```sql
-- analytics_snapshots: one row per (user, period, type)
CREATE TABLE analytics_snapshots (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  period      TEXT        NOT NULL,  -- "2026-03" (YYYY-MM)
  type        TEXT        NOT NULL,  -- 'monthly_summary' | 'quarterly_summary' | 'yearly_summary'
  data        JSONB       NOT NULL,  -- flexible payload, see shape below
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_snapshot UNIQUE (user_id, period, type)
);

CREATE INDEX idx_snapshots_user_period ON analytics_snapshots (user_id, period);
CREATE INDEX idx_snapshots_data ON analytics_snapshots USING GIN (data);

-- ai_insights: one row per generation run
CREATE TABLE ai_insights (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT        NOT NULL,
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger        TEXT        NOT NULL,  -- 'daily' | 'post_sync' | 'month_end' | 'budget_breach'
  summary        TEXT        NOT NULL,
  anomalies      JSONB       NOT NULL DEFAULT '[]',
  goal_alerts    JSONB       NOT NULL DEFAULT '[]',
  cash_flow_forecast TEXT,
  recommendations JSONB      NOT NULL DEFAULT '[]',
  macro_context  JSONB       NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_insights_user_date ON ai_insights (user_id, generated_at DESC);
```

Prisma models (add to `schema.prisma`):

```prisma
model AnalyticsSnapshot {
  id          String   @id @default(cuid())
  userId      String
  period      String   // "2026-03"
  type        String   // monthly_summary | quarterly_summary | yearly_summary
  data        Json
  computedAt  DateTime @default(now())

  @@unique([userId, period, type])
  @@index([userId, period])
  @@map("analytics_snapshots")
}

model AiInsight {
  id                String   @id @default(cuid())
  userId            String
  generatedAt       DateTime @default(now())
  trigger           String
  summary           String
  anomalies         Json     @default("[]")
  goalAlerts        Json     @default("[]")
  cashFlowForecast  String?
  recommendations   Json     @default("[]")
  macroContext      Json     @default("{}")

  @@index([userId, generatedAt(sort: Desc)])
  @@map("ai_insights")
}
```

### TypeScript shapes (JSONB payloads)

```typescript
// data field of AnalyticsSnapshot
interface AnalyticsSnapshotData {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  topCategories: Array<{ slug: string; total: number; transactionCount: number }>;
  budgetUtilisation: Array<{ categorySlug: string; budgeted: number; spent: number; pct: number }>;
  goalProgress: Array<{ goalId: string; targetAmount: number; savedAmount: number; pct: number }>;
}

// Represents a full AiInsight row with typed JSON fields
interface AiInsightRecord {
  id: string;
  userId: string;
  generatedAt: Date;
  trigger: 'daily' | 'post_sync' | 'month_end' | 'budget_breach';
  summary: string;
  anomalies: string[];
  goalAlerts: string[];
  cashFlowForecast: string | null;
  recommendations: InsightRecommendation[];
  macroContext: MacroContext;
}
```

---

## Rename Map — Chat → Advisor

All instances of "chat" are renamed to "advisor" across FE and BE.

| Old | New |
|-----|-----|
| `apps/ai_service/src/chat/` | `apps/ai_service/src/advisor/` |
| `ChatService` | `AdvisorService` |
| `ChatController` | `AdvisorController` |
| `ChatModule` | `AdvisorModule` |
| `ChatMessageReq` | `AdvisorMessageReq` |
| `ChatChunkRes` | `AdvisorChunkRes` |
| `CHAT_CHECKPOINTER` | `ADVISOR_CHECKPOINTER` |
| `CHAT_STORE` | `ADVISOR_STORE` |
| `/api/chat` (Next.js route) | `/api/advisor` |
| `ai.chat` (tRPC router key) | `advisor.send` |
| `chat.tsx` component | `advisor.tsx` |
| `"AI chat (10 messages/mo)"` (pricing) | `"AI Advisor (10 messages/mo)"` |
| `"Unlimited AI chat"` (pricing) | `"Unlimited AI Advisor"` |
| Proto `rpc Chat(...)` | `rpc SendAdvisorMessage(...)` |

---

## gRPC Contract Summary

```proto
service AiService {
  // Domain 1: called by account.processor during bank sync
  rpc ClassifyTransactions(ClassifyTransactionsReq) returns (ClassifyTransactionsRes) {}

  // Domain 2: called by scheduler_service via BullMQ
  rpc GenerateInsights(GenerateInsightsReq) returns (GenerateInsightsRes) {}

  // Domain 3: called by api_gateway for advisor UI
  rpc SendAdvisorMessage(AdvisorMessageReq) returns (stream AdvisorChunkRes) {}
  rpc ResumeAdvisorApproval(AdvisorApprovalReq) returns (AdvisorResumeRes) {}
}
```

---

## What to Ignore (Non-Goals)

- **Voice interface** — out of scope
- **Predictive ML forecasting** — insights pipeline covers the meaningful signals
- **Fine-tuning** — prompt engineering + few-shot with Claude Sonnet is sufficient
- **External vector databases** — pgvector inside Postgres is sufficient at this scale
- **Multi-currency advisor** — NGN only for now; currency selector disabled until multi-currency ships
