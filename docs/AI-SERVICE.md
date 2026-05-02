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
  @langchain/openai \
  @langchain/anthropic \
  @langchain/google-genai \
  openai \
  @anthropic-ai/sdk \
  @google/generative-ai \
  zod
```

### Web app only (chat UI streaming)

```bash
# Install in apps/web only
pnpm install ai
```

The Vercel AI SDK (`ai`) is only needed in `apps/web` for the `useChat` hook and `createDataStreamResponse`

### Environment variables (`apps/ai_service/.env`)

```env
MICROSERVICE_NAME=AI_SERVICE

OPENAI_API_KEY=sk-...

ANTHROPIC_API_KEY=sk-ant-...

GOOGLE_GEN_AI_API_KEY=...
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

Three distinct domains. Each is a separate NestJS module.

```
┌─────────────────────────────────────────────────────────┐
│                      ai_service                         │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │Classification│  │   Insights   │  │     Chat     │  │
│  │   Module     │  │   Module     │  │   Module     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └─────────────────┴──────────────────┘          │
│                           │                             │
│              RegistoryModule  (@Global)                 │
│   LangChainService · LangGraphService · ModelRessolver  │
│         OpenAI     ·   Anthropic     ·    Google        │
└───────────────────────────┬─────────────────────────────┘
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
  // 'memory' → new InMemoryStore()  |  BaseStore → passed through (e.g. PostgresStore-backed)  |  false → none
  store?: BaseStore | 'memory' | false;
  interruptBefore?: string[];
  interruptAfter?: string[];
}

export interface InvokeGraphOptions {
  threadId?: string;
  configurable?: Record<string, unknown>;
  context?: Record<string, unknown>; // passed to runtime.context inside nodes
}

export interface StreamGraphOptions extends InvokeGraphOptions {
  streamMode?: StreamMode | StreamMode[];
}

// Discriminated union yielded by LangGraphService.streamEvents()
export type GraphStreamEvent<TState> =
  | { type: 'token'; content: string }
  | { type: 'state'; node: string; state: Partial<TState> };
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
  // Return type is inferred from Zod schema — no manual casting at call site.
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

  // Escape hatch — returns raw BaseChatModel for tool binding or direct invocation.
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
} from './langchain.types';

@Injectable()
export class LangGraphService {
  constructor(private readonly resolver: ModelRessolver) {}

  // Feature modules call new StateGraph(...), add nodes/edges, hand it here.
  // checkpointer: 'memory' → MemorySaver (short-term, per-thread conversation history)
  // store: 'memory'        → InMemoryStore (long-term, cross-thread user context)
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

  // Raw stream — use when you need a specific streamMode not covered by streamEvents().
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

  // Mixed stream using streamMode: ['messages', 'updates'].
  // Yields token chunks AND node state updates in one pass — no need to run the graph twice.
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
          yield { type: 'state', node, state };
        }
      }
    }
  }

  // Graph nodes call this to access a model without importing ModelRessolver directly.
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

#### `registory.module.ts` (updated)

```typescript
import { Global, Module } from '@nestjs/common';
import {
  OpenAiRepo,
  AnthropicRepo,
  GoogleRepo,
  OpenAiEmbeddingRepo,
  GoogleEmbeddingRepo,
  ModelRessolver,
} from './repositories';
import { LangChainService } from './services/langchain.service';
import { LangGraphService } from './services/langgraph.service';

@Global()
@Module({
  providers: [
    // Chat providers
    OpenAiRepo,
    AnthropicRepo,
    GoogleRepo,
    // Embedding providers
    OpenAiEmbeddingRepo,
    GoogleEmbeddingRepo,
    // Resolver — routes ChatModelId → provider
    ModelRessolver,
    // Composition services — globally available, no extra imports needed
    LangChainService,
    LangGraphService,
  ],
  exports: [ModelRessolver, LangChainService, LangGraphService],
})
export class RegistoryModule {}
```

### Layer 2: Feature Layer

Feature modules own their own state schema, node functions, and graph topology. Because `RegistoryModule` is `@Global`, they inject `LangChainService` and `LangGraphService` directly — no extra `imports` needed.

```typescript
// In each feature module — no imports[] required
@Module({
  controllers: [...],
  providers: [...],
})
```

---

## LangChain & LangGraph — Types and API Reference

This section explains every type, interface, and API method used in `LangChainService` and `LangGraphService`. Each entry covers what the thing is, why we chose it, and how it maps to our specific usage. Read this once before building either service file.

---

### LangChain

#### `Runnable<TInput, TOutput>`

**What it is:** The core interface in LangChain. Anything that has an `invoke(input: TInput): Promise<TOutput>` method is a `Runnable`. Chat models, prompt templates, output parsers, and entire chains are all `Runnable`.

**Why we use it:** It is the type contract that makes LCEL pipe composition possible. Because everything shares the same interface, you can chain them without any glue code.

**In our service:**

```typescript
export interface BuildChainOptions<TInput = BaseMessage[], TOutput = string> {
  prompt?: Runnable<TInput, BaseMessage[]> | null;
  parser?: Runnable<BaseMessage, TOutput> | null;
}
```

`prompt` and `parser` are typed as `Runnable` — not `ChatPromptTemplate` or `StringOutputParser` specifically — so callers can pass any compatible transform without depending on a concrete class.

📄 [Runnable interface docs](https://reference.langchain.com/javascript/langchain-core/runnables)

---

#### LCEL — `pipe()` composition

**What it is:** LangChain Expression Language. The `pipe()` method on any `Runnable` returns a new `Runnable` whose `invoke()` feeds its output into the next component's `invoke()`. No callbacks, no manual wiring.

```typescript
// Each .pipe() returns a Runnable — the whole chain is still a Runnable
const chain = prompt.pipe(model).pipe(parser);
chain.invoke({ question: '...' }); // → parsed output
```

**Why we use it:** It eliminates boilerplate in `LangChainService.buildChain()`. The feature module just calls `buildChain()` and gets back a single `Runnable` it can invoke or stream.

**In our service:**

```typescript
buildChain(opts) {
  const model = this.resolver.getRunnable(opts.modelId);
  const parser = opts.parser ?? new StringOutputParser();
  if (opts.prompt) {
    return opts.prompt.pipe(model).pipe(parser); // ← LCEL composition
  }
  return RunnableSequence.from([model, parser]);
}
```

`RunnableSequence.from([a, b, c])` is the array equivalent of `a.pipe(b).pipe(c)` — use it when building from a dynamic list rather than a known chain.

📄 [LCEL concept docs](https://reference.langchain.com/javascript/langchain-core/runnables/RunnableSequence)

---

#### `BaseChatModel`

**What it is:** The abstract base class for all LangChain chat models. `ChatOpenAI`, `ChatAnthropic`, and `ChatGoogleGenerativeAI` all extend it. It is also a `Runnable<BaseMessage[], AIMessage>`.

**Why we use it:** `ModelRessolver.getRunnable()` returns `BaseChatModel` rather than a provider-specific type. `LangChainService` and `LangGraphService` both expose `getModel(modelId): BaseChatModel` so graph nodes can call the model without importing `ModelRessolver` directly.

**In our service:**

```typescript
// LangChainService
getModel(modelId: ChatModelId): BaseChatModel {
  return this.resolver.getRunnable(modelId);
}

// Graph node usage
const model = this.langGraph.getModel('anthropic:claude-sonnet-4.6');
const response = await model.invoke([systemMessage, ...state.messages]);
```

📄 [Chat models concept docs](https://reference.langchain.com/javascript/langchain-core/language_models/chat_models/BaseChatModel)

---

#### Message types — `BaseMessage`, `HumanMessage`, `AIMessage`, `SystemMessage`

**What they are:** Every LangChain chat model takes and returns messages, not raw strings. The four types map directly to chat roles:

```typescript
new SystemMessage('You are a financial assistant.'); // role: "system"
new HumanMessage('How much did I spend on food?'); // role: "user"
new AIMessage('You spent ₦12,500 on food.'); // role: "assistant"
```

`BaseMessage` is the parent class — use it when a type accepts any message.

**Why we use them:** Provider APIs differ in how they encode roles. LangChain normalises everything to these classes and handles provider-specific serialisation internally. We never need to write `{ role: "user", content: "..." }` objects.

**In our service:** Chat state uses `MessagesValue` (a LangGraph reducer) which stores `BaseMessage[]`. Every node appends to that array using these concrete types.

📄 [Messages concept docs](https://reference.langchain.com/javascript/langchain-core/messages/BaseMessage)

---

#### `model.withStructuredOutput(schema, options?)`

**What it is:** A method on `BaseChatModel` that wraps the model with a structured extraction contract. The model is instructed to return data matching the schema, and LangChain deserialises it automatically.

There are three schema types. The `method` option depends on which one you pass:

**1. Zod schema (what we use everywhere) — no `method` needed**

```typescript
const structured = model.withStructuredOutput(
  z.object({ category: z.string(), confidence: z.number() }),
  { strict: true }, // strict: true enforces the schema at API level — no extra fields
);
const result = await structured.invoke(messages);
// result is typed as { category: string; confidence: number }
```

Zod is the default and preferred. LangChain detects it automatically — no `method` required. `strict: true` is still recommended for gpt-4o: it enforces the schema at the API level rather than post-processing the output.

**2. Raw JSON Schema — requires `method: 'jsonSchema'`**

```typescript
const structured = model.withStructuredOutput(
  {
    type: 'object',
    properties: { category: { type: 'string' } },
    required: ['category'],
  },
  { method: 'jsonSchema' }, // must be explicit — LangChain can't auto-detect JSON Schema
);
```

Use when you need maximum interoperability (e.g. sharing a schema with a non-TypeScript system).

**3. Standard Schema (any library implementing the Standard Schema spec) — no `method` needed**

Validated at runtime via the schema's `~standard.validate()` method. Works the same as Zod from the caller's perspective.

**Why we use Zod:** It removes all manual JSON parsing and error handling from classification. The schema is the same one TypeScript uses for type-checking — one definition, two purposes.

**In our service:**

```typescript
buildStructuredChain<TOutput extends Record<string, unknown>>(
  opts: BuildStructuredChainOptions<TOutput>,
): Runnable<BaseMessage[], TOutput> {
  const model = this.resolver.getRunnable(opts.modelId);
  const structured = model.withStructuredOutput(opts.schema, {
    name:   opts.structuredOutputOptions?.name,
    method: opts.structuredOutputOptions?.method,   // undefined for Zod; 'jsonSchema' for raw JSON schema
    strict: opts.structuredOutputOptions?.strict,
  });
  if (opts.prompt) return opts.prompt.pipe(structured);
  return structured;
}
```

📄 [Structured output how-to](https://docs.langchain.com/oss/javascript/langchain/structured-output)

---

#### Output Parsers — `StringOutputParser` and `JsonOutputParser`

Parsers are the last step in a `buildChain()` pipeline. They receive an `AIMessage` and transform its `.content` into the output type the caller needs.

**Critical rule: parsers belong to `buildChain()` only — never to `buildStructuredChain()`.**

`withStructuredOutput()` wraps the model itself and handles deserialization internally. The result is already a typed object — there is no `AIMessage` to parse. Attaching a parser after `withStructuredOutput` would receive a structured object and try to stringify or re-parse it, which breaks the chain.

```
buildChain():          prompt → model → parser → TOutput
buildStructuredChain(): prompt → model.withStructuredOutput(schema) → TOutput
                                         ↑
                               no parser step — model already returns structured data
```

---

**`StringOutputParser`** — extracts `.content` as a plain string.

```typescript
import { StringOutputParser } from '@langchain/core/output_parsers';

// model.invoke(...) → AIMessage { content: "The total is ₦12,400." }
// parser.invoke(aiMessage) → "The total is ₦12,400."
```

Default in `buildChain()` when no parser is supplied. Use for all free-text outputs: chat responses, narrative summaries, insight paragraphs.

---

**`JsonOutputParser`** — parses the model's string output as JSON.

```typescript
import { JsonOutputParser } from '@langchain/core/output_parsers';

const parser = new JsonOutputParser<{ total: number; currency: string }>();
// model output: '{ "total": 12400, "currency": "NGN" }'
// parser.invoke(aiMessage) → { total: 12400, currency: "NGN" }
```

Use when you want a structured object from `buildChain()` but the model doesn't support function calling (e.g. some open-source models), or when the schema is too dynamic to define upfront with Zod. For everything else — use `buildStructuredChain()` with a Zod schema instead: it's more reliable because the schema is enforced at the API level with `strict: true`, not parsed from free text.

**`StructuredOutputParser`** (do not use) — an older LangChain approach that injects format instructions directly into the prompt and parses the output. Superseded by `withStructuredOutput()` and `JsonOutputParser`. Not used anywhere in this service.

---

#### `ChatPromptTemplate.fromMessages()`

**What it is:** A prompt template that takes named variables and returns a formatted message array. Feature modules build their prompts here; `buildChain()` accepts the template as the optional `prompt` field.

```typescript
const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a classifier. Categories: {categories_json}'],
  ['human', '{transactions_json}'],
]);
// prompt.invoke({ categories_json: "...", transactions_json: "..." })
// → [SystemMessage, HumanMessage] with values substituted
```

**Why we chose `fromMessages()` over `fromTemplate()`:** Single-string templates only produce a `HumanMessage`. `fromMessages()` lets us set system context separately, which consistently improves classification accuracy.

📄 [Prompt templates concept docs](https://docs.langchain.com/langsmith/create-a-prompt)

---

#### `tool(fn, { name, schema })`

**What it is:** A LangChain helper from `@langchain/core/tools` that wraps an async function as a tool the model can call. The `schema` is a Zod object — LangChain serialises it into the function definition the provider API expects.

```typescript
import { tool } from '@langchain/core/tools';

const getSpendingSummary = tool(
  async ({ userId, period }) => prisma.transaction.groupBy(...),
  {
    name: 'getSpendingSummary',
    schema: z.object({ userId: z.string(), period: z.string() }),
  }
);
```

**Why we use it:** Tools are how the chat agent fetches real data from Postgres and pgvector. The model decides which tool to call and with what arguments; LangGraph's `ToolNode` executes the call and appends the result to the message history.

📄 [Tools concept docs](https://docs.langchain.com/oss/javascript/langchain/tools)

---

### LangGraph

#### `StateGraph` and what state means

**What it is:** The central LangGraph class. A `StateGraph` is a directed graph where each node is an async function that receives the current state and returns a partial update. LangGraph merges the update into the state using a reducer before moving to the next node.

**Key insight:** Nodes never mutate state directly. They return `{ fieldName: newValue }`. LangGraph applies the returned object as a patch:

```typescript
// Wrong — never do this
const node = async (state) => {
  state.summary = '...';
  return state;
};

// Correct — return only what changed
const node = async (state) => ({ summary: '...' });
```

📄 [LangGraph StateGraph docs](https://docs.langchain.com/oss/javascript/langgraph/overview)

---

#### Defining state — `Annotation.Root()` and reducers

**What it is:** The way you declare the shape and merge behaviour of graph state in LangGraph TypeScript.

```typescript
import { Annotation, MessagesAnnotation } from '@langchain/langgraph';

const MyState = Annotation.Root({
  // Simple scalar — last-write-wins (default)
  summary: Annotation<string>({ default: () => '' }),

  // List with custom reducer — appends updates rather than replacing
  anomalies: Annotation<string[]>({
    default: () => [],
    reducer: (current, update) => current.concat(update),
  }),

  // Messages — special reducer provided by LangGraph that handles
  // message deduplication and ordering automatically
  messages: Annotation<BaseMessage[]>({
    reducer: messagesReducer,
    default: () => [],
  }),
});
```

`Annotation.Root()` is the **canonical TypeScript LangGraph API**. The doc also references `StateSchema` (Zod-based) — that is an alternate API available in some LangGraph versions; both produce equivalent state graphs.

**`MessagesValue`** — shorthand for the messages annotation above. Use it when your state needs a chat history field:

```typescript
const ChatState = Annotation.Root({
  messages: MessagesAnnotation.spec.messages, // or: MessagesValue
  userId: Annotation<string>(),
});
```

📄 [State and reducers docs](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#state)

---

#### `START` and `END`

**What they are:** Sentinel string constants from `@langchain/langgraph` that represent the graph's virtual entry and exit nodes. Every graph must have at least one `addEdge(START, 'firstNode')` and at least one path that reaches `END`.

```typescript
import { START, END } from '@langchain/langgraph';

builder
  .addEdge(START, 'summarize') // graph starts here
  .addEdge('summarize', 'detect')
  .addEdge('detect', END); // graph exits here
```

They are just strings (`'__start__'` and `'__end__'`) — the constants exist to avoid typos.

---

#### `graph.addNode()`, `graph.addEdge()`, `graph.addConditionalEdges()`

```typescript
// addNode: register an async function as a named node
builder.addNode('summarize', async (state) => ({ summary: '...' }));

// addEdge: unconditional transition after a node completes
builder.addEdge('summarize', 'detect');

// addConditionalEdges: the node's return value picks the next node
builder.addConditionalEdges(
  'respond', // from this node
  (state) =>
    state.messages.at(-1)?.tool_calls?.length
      ? 'tools' // if model called a tool
      : END, // if model gave a final answer
  ['tools', END], // declare all possible targets
);
```

`addConditionalEdges` is how agent loops are built — the condition function receives the current state and returns the name of the next node (or `END`).

📄 [Nodes and edges docs](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#nodes)

---

#### `graph.compile({ checkpointer, store })`

**What it is:** Turns the builder (`StateGraph`) into a runnable graph (`CompiledStateGraph`). Nothing can be invoked until after `.compile()`. The two important options:

| Option         | Type                  | Effect                                                      |
| -------------- | --------------------- | ----------------------------------------------------------- |
| `checkpointer` | `BaseCheckpointSaver` | Enables thread-scoped state persistence (short-term memory) |
| `store`        | `BaseStore`           | Enables cross-thread key-value storage (long-term memory)   |

Neither is required. Omit both for stateless graphs (e.g. insights).

**In our service:**

```typescript
compile(graph, opts) {
  const checkpointer = opts?.checkpointer === 'memory' ? new MemorySaver() : opts?.checkpointer;
  const store       = opts?.store       === 'memory' ? new InMemoryStore() : opts?.store;
  return graph.compile({ checkpointer, store });
}
```

The `'memory'` string shorthand lets feature modules request in-process memory without importing `MemorySaver` or `InMemoryStore` directly.

📄 [Compilation docs](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#compiling-your-graph)

---

#### `MemorySaver` and `BaseCheckpointSaver`

**What they are:** The checkpointer is a persistence backend for LangGraph's short-term memory. After every node runs, LangGraph serialises the full state and saves it under a `thread_id`. On the next invocation with the same `thread_id`, the state is restored before the graph starts.

```
Turn 1: graph.invoke({ messages: [HumanMessage("Hi")] }, { configurable: { thread_id: "conv-1" } })
  → MemorySaver stores state for "conv-1"

Turn 2: graph.invoke({ messages: [HumanMessage("What was my last question?")] }, { configurable: { thread_id: "conv-1" } })
  → MemorySaver restores state for "conv-1" — model sees Turn 1 messages
```

`MemorySaver` stores state in a JS `Map` in process — it is lost on restart. For production, swap it for a database-backed checkpointer (e.g. `PostgresSaver` from `@langchain/langgraph-checkpoint-postgres`).

`BaseCheckpointSaver` is the abstract base class. Our `CompileGraphOptions.checkpointer` is typed to it so feature modules can pass any implementation.

📄 [Persistence and checkpointers docs](https://langchain-ai.github.io/langgraphjs/concepts/persistence/)

---

#### `InMemoryStore` and `BaseStore`

**What they are:** The store is LangGraph's long-term, cross-thread memory. Unlike the checkpointer (which is scoped to one `thread_id`), the store is a key-value namespace shared across all threads.

Nodes access the store through the **`runtime` second parameter** of the node function — not via `config.store` or `getStore()`. The store is compiled in at graph build time; `runtime` delivers it to each node at execution time. `userId` (and any other per-invocation context) is passed at call time via `context` and read from `runtime.context`.

```typescript
// Node function signature: (state, runtime) => {}
const myNode = async (state: typeof GraphState.State, runtime) => {
  const userId = runtime.context?.userId as string;

  // Read — plain scan (all items in namespace)
  const prefs = await runtime.store?.search(['user', userId, 'preferences']);

  // Read — semantic search (requires index config on the store)
  const relevant = await runtime.store?.search(['user', userId, 'context'], {
    query: 'what is the user saving for',
    limit: 5,
  });

  // Write
  await runtime.store?.put(['user', userId, 'preferences'], 'currency', { value: 'NGN' });
};

// Compile: store attached at build time
const graph = builder.compile({ store });

// Invoke: userId passed at call time via context
await graph.invoke(
  { messages: [...] },
  {
    configurable: { thread_id: 'conv-1' },
    context: { userId: 'user-abc' },       // → runtime.context.userId inside every node
  },
);
```

Namespace is an array of strings acting as a path. The store is compiled in; context is per-invocation.

`InMemoryStore` is the in-process implementation (same caveats as `MemorySaver` — lost on restart). Production: swap for `PostgresStore` from `@langchain/langgraph-checkpoint-postgres` — same package as `PostgresSaver`, same Postgres connection.

**Why we separate checkpointer from store:**

|           | Checkpointer                  | Store                                   |
| --------- | ----------------------------- | --------------------------------------- |
| Scope     | One thread (one conversation) | All threads for a user                  |
| Lifecycle | Lost when conversation ends   | Persists indefinitely                   |
| Use case  | Message history, tool results | User prefs, financial context, patterns |

📄 [Memory architecture docs](https://langchain-ai.github.io/langgraphjs/concepts/memory/)

---

#### `graph.invoke()` and `graph.stream()`

**`invoke(input, config?)`** — runs the graph to completion and returns the final state object. Use for insights and classification where you want the full result at once.

```typescript
const result = await graph.invoke(
  { userId: '123', transactions: [...] },
  { configurable: { thread_id: 'conv-abc' } },
);
// result: full InsightState after all nodes have run
```

**`stream(input, config?)`** — same as `invoke` but returns an `AsyncIterable` that yields incremental updates. The `streamMode` option controls what each yielded chunk contains:

| `streamMode`              | Each chunk is                                                      |
| ------------------------- | ------------------------------------------------------------------ |
| `'values'`                | The full state after each node                                     |
| `'updates'`               | Only the partial update each node returned                         |
| `'messages'`              | Individual token chunks (for streaming text to clients)            |
| `['messages', 'updates']` | Both — use this for chat UI: tokens for display, updates for state |

**In our `streamEvents()` helper:**

```typescript
const s = await graph.stream(input, {
  configurable: { thread_id: opts.threadId },
  streamMode: ['messages', 'updates'],   // ← dual mode
});

for await (const chunk of s) {
  const [mode, payload] = chunk;         // LangGraph tags each chunk with its mode
  if (mode === 'messages') { yield { type: 'token', content: text }; }
  if (mode === 'updates')  { yield { type: 'state', node, state }; }
}
```

📄 [Streaming docs](https://langchain-ai.github.io/langgraphjs/concepts/streaming/)

---

#### `thread_id` and the `configurable` object

**What it is:** The mechanism that connects a graph invocation to its stored checkpoint. Every `graph.invoke()` or `graph.stream()` call takes an optional second argument `{ configurable: { thread_id: '...' } }`. LangGraph uses this string to look up (and save) the checkpoint.

```typescript
// First message in a conversation
graph.invoke({ messages: [msg1] }, { configurable: { thread_id: 'conv-abc' } });

// Second message — LangGraph rehydrates 'conv-abc' automatically
graph.invoke({ messages: [msg2] }, { configurable: { thread_id: 'conv-abc' } });
```

Without a `thread_id`, every invocation starts from scratch even if a checkpointer is configured. This is intentional for stateless uses like insights.

**In our service:** `InvokeGraphOptions.threadId` is the caller-facing field. `buildConfig()` maps it to the correct `configurable.thread_id` shape:

```typescript
private buildConfig(opts?: InvokeGraphOptions) {
  if (!opts?.threadId && !opts?.configurable) return undefined;
  return {
    configurable: {
      ...(opts.threadId && { thread_id: opts.threadId }),
      ...opts.configurable,
    },
  };
}
```

---

#### `GraphStreamEvent<TState>` — how the discriminated union was designed

`LangGraphService.streamEvents()` needs to yield two conceptually different things from the same stream: token text for the UI and state updates for the server. A single type would require callers to check fields before using them, leading to bugs.

A **discriminated union** solves this cleanly — the `type` field narrows the shape unambiguously:

```typescript
type GraphStreamEvent<TState> =
  | { type: 'token'; content: string } // safe to read .content
  | { type: 'state'; node: string; state: Partial<TState> }; // safe to read .node/.state

// Caller-side usage — TypeScript narrows inside each branch
for await (const event of langGraph.streamEvents(graph, input, opts)) {
  if (event.type === 'token') {
    res.write(event.content); // .content exists here
  } else {
    log(event.node, event.state); // .node and .state exist here
  }
}
```

The pattern is idiomatic TypeScript for heterogeneous async streams. `event.content` is a compile-time error outside the `type === 'token'` branch.

---

#### `CompileGraphOptions` — how the interface was designed

The raw LangGraph `.compile()` signature looks like:

```typescript
graph.compile({
  checkpointer?: BaseCheckpointSaver;
  store?: BaseStore;
  interruptBefore?: string[];
  interruptAfter?: string[];
})
```

`BaseCheckpointSaver` and `BaseStore` require importing their classes and constructing instances, which means feature modules would need to know about `MemorySaver` and `InMemoryStore`. Our wrapper adds the `'memory'` string literal as a shorthand:

```typescript
checkpointer?: BaseCheckpointSaver | 'memory' | false;
store?:        BaseStore | 'memory' | false;
```

- `'memory'` → the service constructs the in-process instance
- a class instance → passed through (for production implementations)
- `false` / omitted → stateless graph

Feature modules only write `{ checkpointer: 'memory', store: 'memory' }` — they never import `MemorySaver` or `InMemoryStore`.

---

## Domain 1 — Transaction Classification

### What it does

Receives transactions that scored 0 in token scoring (Mono said `unknown`, no merchant match, narration is opaque), classifies them against the user's actual category list, and returns a `{ transactionId → categorySlug }` map.

### Why LangChain (not LangGraph)

This is a single, stateless, structured extraction call — no agent loop, no tool use, no branching. LangChain's chain primitive (`prompt | llm | outputParser`) is exactly right and adds zero overhead.

### Data shapes

```typescript
// gRPC request
interface ClassifyTransactionsReq {
  transactions: Array<{
    id: string;
    narration: string; // Transaction.narration — immutable raw Mono text
    bankCategory: string; // Transaction.bankCategory — e.g. "food_and_drinks"
  }>;
  categories: Array<{
    name: string; // e.g. "Food & Dining"
    slug: string; // e.g. "food-dining"
  }>;
}

// gRPC response
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
  ChatOpenAI (gpt-4o — withStructuredOutput, jsonSchema mode)
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

#### The problem

After the AI classifies a Mono bank transaction, the user may disagree with the assigned category and change it in the UI. Without a feedback loop, that correction is a dead end — the next similar transaction from the same merchant hits the same prompt and gets the same wrong answer.

#### The solution: few-shot RAG from stored corrections

When a user corrects a category, store the narration with a pgvector embedding in a `classification_corrections` table. Before the next classification call, embed the incoming narration, retrieve the top-k most similar past corrections via cosine search, and inject them as few-shot examples in the prompt. The model now learns from the user's own correction history without any fine-tuning.

```
User changes category (UI)
  │
  finance_service publishes:  { event: 'CategoryCorrected', transactionId, userId, narration, correctedSlug }
  │
  ai_service EmbeddingWorker picks up event
  │
  embeds narration → stores { userId, narration, embedding, correctedSlug } in classification_corrections
  │
  ─────────────────────────────────────────────────────────────────────────────

Next classification call for same userId
  │
  embed incoming narrations (batch)
  │
  cosine search: SELECT top-5 corrections WHERE user_id = userId ORDER BY embedding <=> $vector
  │
  inject as few-shot examples in the ChatPromptTemplate
  │
  LLM produces corrected assignments guided by the user's own history
```

#### Event flow

The `finance_service` owns the category-update logic. When a user changes a Mono transaction's category it publishes a BullMQ event — it does not call the AI service directly.

```typescript
// finance_service — inside UpdateTransactionCategory handler
// transaction.narration is the immutable bank narration field (never description)
await this.correctionQueue.add('ai:category-corrected', {
  userId,
  transactionId,
  narration: transaction.narration, // Transaction.narration — raw Mono text
  correctedSlug: newCategorySlug,
});
```

The AI service registers a BullMQ worker for that queue:

```typescript
// ai_service — EmbeddingWorker (same worker handles both transaction embeddings and corrections)
@Processor('ai:category-corrected')
export class CorrectionWorker {
  constructor(
    private readonly embeddingRepo: OpenAiEmbeddingRepo,
    private readonly prisma: PrismaService,
  ) {}

  @Process()
  async handle(job: Job<{ userId: string; narration: string; correctedSlug: string }>) {
    const { userId, narration, correctedSlug } = job.data;

    const [embedding] = await this.embeddingRepo.embed([narration], {
      model: 'text-embedding-3-small',
    });

    await this.prisma.$executeRaw`
      INSERT INTO classification_corrections (id, user_id, narration, corrected_slug, embedding, created_at)
      VALUES (gen_random_uuid(), ${userId}, ${narration}, ${correctedSlug}, ${embedding}::vector, now())
    `;
  }
}
```

#### ClassificationService — dynamic few-shot augmentation

```typescript
@Injectable()
export class ClassificationService implements OnModuleInit {
  private chain: Runnable<any, TransactionClassification>;

  constructor(
    private readonly langChain: LangChainService,
    private readonly embeddingRepo: OpenAiEmbeddingRepo,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    // Chain is built once — prompt is dynamically augmented per call, not at build time.
    const schema = z.object({
      assignments: z.record(z.string()), // { transactionId: categorySlug }
    });

    this.chain = this.langChain.buildStructuredChain({
      modelId: 'openai:gpt-4o',
      schema,
      structuredOutputOptions: { strict: true },
    });
  }

  async classify(
    userId: string,
    transactions: Array<{ id: string; narration: string; monoCategory: string }>,
    categories: Array<{ name: string; slug: string }>,
  ) {
    // 1. Retrieve top-5 user corrections most similar to each transaction (batch by userId)
    const fewShotExamples = await this.fetchFewShotExamples(userId, transactions);

    // 2. Build the prompt with few-shot block injected
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a financial transaction classifier.
User's categories: {categories_json}

${
  fewShotExamples.length > 0
    ? `This user has previously corrected these classifications — follow their preferences:
{few_shot_block}

`
    : ''
}Return a JSON object mapping each transaction id to the best matching category slug.`,
      ],
      ['human', '{transactions_json}'],
    ]);

    return prompt.pipe(this.chain).invoke({
      categories_json: JSON.stringify(categories),
      transactions_json: JSON.stringify(transactions),
      few_shot_block: fewShotExamples
        .map((e) => `"${e.narration}" → "${e.correctedSlug}"`)
        .join('\n'),
    });
  }

  private async fetchFewShotExamples(
    userId: string,
    transactions: Array<{ narration: string }>,
  ): Promise<Array<{ narration: string; correctedSlug: string }>> {
    if (transactions.length === 0) return [];

    // Embed the first transaction as a representative query (batching optimisation)
    const [queryVector] = await this.embeddingRepo.embed([transactions[0].narration], {
      model: 'text-embedding-3-small',
    });

    return this.prisma.$queryRaw<Array<{ narration: string; corrected_slug: string }>>`
      SELECT narration, corrected_slug
      FROM classification_corrections
      WHERE user_id = ${userId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${queryVector}::vector
      LIMIT 5
    `.then((rows) =>
      rows.map((r) => ({ narration: r.narration, correctedSlug: r.corrected_slug })),
    );
  }
}
```

#### Degraded-gracefully behaviour

- No corrections yet → `fewShotExamples` is empty → the `few_shot_block` block is omitted from the prompt entirely. No regression for new users.
- Embedding call fails → catch the error, skip few-shot injection, classify without examples. The correction is not lost — the BullMQ job retries independently.
- Wrong correction (user flip-flopped) → later corrections overwrite earlier ones via recency in the cosine ranking because the same narration appears twice; the more recent embedding will be an exact match and rank highest.

---

## Domain 2 — AI Insights

### What it does

Proactively generates human-readable observations about a user's financial patterns — not charts, but sentences derived from pre-computed analytics data.

Examples:

- "You spent 43% more on food this month than last month."
- "Your transport costs have been consistently above your budget for 3 months."
- "At your current savings rate, you'll hit your Laptop goal 2 weeks ahead of schedule."

### Why LangGraph (not a plain chain)

Generating a meaningful insight set is not one call. The model needs to: decide which metrics are interesting, optionally request additional context, filter out obvious observations, and return a ranked list. That decision loop is a graph, not a linear chain.

### LangGraph workflow

```
[start]
  │
  ▼
[summarize_node]           ← google:gemini-2.5-pro
  reads transactions, builds concise summary
  │
  ▼
[detect_anomalies_node]    ← anthropic:claude-sonnet-4.6
  identifies spending anomalies from summary
  │
  ▼
[recommend_node]           ← openai:gpt-4o
  generates ranked financial recommendations
  │
  ▼
[end] → InsightSet { summary, anomalies[], recommendations[] }
```

Each node picks its own model — different strengths for different steps. The graph is **stateless** (`checkpointer: false`) because insights are triggered by the scheduler and stored to MongoDB, not held in memory between requests.

### Memory Architecture

```
Short-term   None — each run is independent. State flows through nodes
             but is not persisted between runs. No checkpointer needed.

Long-term    MongoDB stores every generated InsightSet with a timestamp.
             At the start of each new run, the graph loads the last 3
             insight sets as context so nodes can detect trends over time
             ("last month you also flagged high food spend") rather than
             treating every run as a fresh start.

RAG          The summarizeNode receives raw transactions but does not embed
             them for vector search — the volume is too high and the question
             is structured ("what patterns exist?"), not semantic. Instead,
             the loadContextNode fetches pre-computed MongoDB analytics
             snapshots (monthly breakdowns, budget utilisation) and injects
             them as structured context before the summarize step.

Compaction   When transaction volume is large (>500 rows), the summarizeNode
             receives a pre-aggregated snapshot from MongoDB rather than raw
             rows. Gemini 2.5 Pro's large context window handles the rest.
             No message compaction is needed — each graph run starts fresh.
```

**Updated workflow with long-term context:**

```
[start]
  │
  ▼
[load_context_node]
  reads: last 3 InsightSets from MongoDB (trend awareness)
  reads: current analytics snapshots from MongoDB
  │
  ▼
[summarize_node]           ← google:gemini-2.5-pro
  context: analytics snapshot + historical insight summaries
  │
  ▼
[detect_anomalies_node]    ← anthropic:claude-sonnet-4.6
  │
  ▼
[recommend_node]           ← openai:gpt-4o
  │
  ▼
[end] → writes InsightSet to MongoDB → invalidates Redis cache
```

**Updated state:**

```typescript
const InsightState = new StateSchema({
  userId: z.string(),
  transactions: z.array(z.any()),
  historicalInsights: z.array(z.any()).default(() => []), // loaded from MongoDB
  analyticsSnapshot: z.any().optional(), // pre-aggregated
  summary: z.string().default(''),
  anomalies: new ReducedValue(
    z.array(z.string()).default(() => []),
    { reducer: (curr, upd) => curr.concat(upd) },
  ),
  recommendations: z.array(z.string()).default(() => []),
});
```

### Data shapes

```typescript
// BullMQ job payload published by scheduler_service
interface InsightsJobPayload {
  userId: string;
  trigger: 'daily' | 'post_sync'; // post_sync fires after a bank sync with >10 new transactions
}

// gRPC request
interface GenerateInsightsReq {
  userId: string;
}

// gRPC response — also the shape written to MongoDB and served from Redis
interface GenerateInsightsRes {
  summary: string; // 2–3 sentence spending overview
  anomalies: string[]; // e.g. ["Food spend up 43% vs last month"]
  recommendations: string[]; // ranked, e.g. ["Set a ₦30,000 food budget"]
  generatedAt: string; // ISO 8601 timestamp
}

// MongoDB document shape (ai_insights collection)
interface AiInsightDocument {
  userId: string;
  generatedAt: Date;
  summary: string;
  anomalies: string[];
  recommendations: string[];
}
```

### When insights are generated

Not on demand per page load. The `scheduler_service` triggers insight generation once per day per user (or after a sync completes with >10 new transactions). Result stored in MongoDB, served from Redis cache.

```
scheduler_service (daily cron)
  → BullMQ: InsightsJobPayload { userId, trigger: "daily" }
  → ai_service InsightsWorker picks up job
  → runs LangGraph insights workflow
  → writes GenerateInsightsRes to MongoDB (ai_insights collection)
  → invalidates Redis cache key "insights:{userId}"

frontend tRPC call: ai.getInsights()
  → reads Redis cache key "insights:{userId}"  (TTL 1h)
  → on miss: reads MongoDB, populates Redis
  → returns GenerateInsightsRes
```

### Service pattern

```typescript
@Injectable()
export class InsightService implements OnModuleInit {
  private graph: any;

  constructor(private readonly langGraph: LangGraphService) {}

  onModuleInit() {
    const InsightState = new StateSchema({
      transactions: z.array(z.any()),
      summary: z.string().default(''),
      anomalies: new ReducedValue(
        z.array(z.string()).default(() => []),
        { reducer: (curr, upd) => curr.concat(upd) },
      ),
      recommendations: z.array(z.string()).default(() => []),
    });

    const summarizeNode = async (state: typeof InsightState.State) => {
      const model = this.langGraph.getModel('google:gemini-2.5-pro');
      const response = await model.invoke([
        new HumanMessage(
          `Summarize these ${state.transactions.length} financial transactions concisely.`,
        ),
      ]);
      return { summary: response.content as string };
    };

    // ... anomalyNode, recommendNode ...

    this.graph = this.langGraph.compile(
      new StateGraph(InsightState)
        .addNode('summarize', summarizeNode)
        .addNode('detectAnomalies', anomalyNode)
        .addNode('recommend', recommendNode)
        .addEdge(START, 'summarize')
        .addEdge('summarize', 'detectAnomalies')
        .addEdge('detectAnomalies', 'recommend')
        .addEdge('recommend', END),
      { checkpointer: false },
    );
  }

  async analyze(transactions: any[]) {
    return this.langGraph.invoke(this.graph, { transactions });
  }
}
```

### gRPC method

```proto
rpc GenerateInsights(GenerateInsightsReq) returns (GenerateInsightsRes) {}
```

---

## Domain 3 — Financial Chat Assistant

### What it does

A conversational assistant that answers natural language questions about the user's actual finances — not generic advice.

Examples:

- "How much did I spend on food last month?"
- "Am I on track with my savings goals?"
- "When did I last really splurge?"
- "Find any payments that look like forgotten subscriptions."

### Why LangGraph

The assistant is an **agent with tools**. The model decides which data to fetch based on the question, fetches it, processes the result, and decides whether it has enough to answer or needs more. That loop requires LangGraph.

### Data shapes

```typescript
// gRPC request — one message per turn
interface ChatMessageReq {
  conversationId: string; // maps to LangGraph thread_id
  userId: string;
  message: string;
}

// gRPC streaming response — one chunk per token
interface ChatChunkRes {
  delta: string; // partial token text
  done: boolean; // true on final chunk
}
```

### Tools the agent has access to

```typescript
// SQL tools — structured, precise questions
const getTransactions = tool(
  async ({ userId, startDate, endDate, categorySlug, limit }) => {
    /* prisma query */
  },
  {
    name: 'getTransactions',
    schema: z.object({
      userId: z.string(),
      startDate: z.string().optional(), // ISO 8601
      endDate: z.string().optional(),
      categorySlug: z.string().optional(),
      limit: z.number().int().max(100).default(20),
    }),
  },
);

const getSpendingSummary = tool(
  async ({ userId, period, groupBy }) => {
    /* prisma aggregation */
  },
  {
    name: 'getSpendingSummary',
    schema: z.object({
      userId: z.string(),
      period: z.enum(['this_month', 'last_month', 'last_3_months', 'this_year']),
      groupBy: z.enum(['category', 'week', 'month']).default('category'),
    }),
  },
);

const getBudgets = tool(
  async ({ userId, period }) => {
    /* prisma query */
  },
  {
    name: 'getBudgets',
    schema: z.object({
      userId: z.string(),
      period: z.enum(['MONTHLY', 'WEEKLY', 'QUARTERLY', 'YEARLY']).optional(),
    }),
  },
);

const getGoals = tool(
  async ({ userId }) => {
    /* prisma query */
  },
  { name: 'getGoals', schema: z.object({ userId: z.string() }) },
);

const getRecurringBills = tool(
  async ({ userId }) => {
    /* prisma query */
  },
  { name: 'getRecurringBills', schema: z.object({ userId: z.string() }) },
);

const getCategoryBreakdown = tool(
  async ({ userId, startDate, endDate }) => {
    /* prisma aggregation */
  },
  {
    name: 'getCategoryBreakdown',
    schema: z.object({
      userId: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    }),
  },
);

// Vector tool — semantic, fuzzy questions (see RAG section)
const semanticSearchTransactions = tool(
  async ({ userId, query, limit }) => {
    /* pgvector cosine search */
  },
  {
    name: 'semanticSearchTransactions',
    schema: z.object({
      userId: z.string(),
      query: z.string(), // natural language — embedded at query time
      limit: z.number().int().max(20).default(10),
    }),
  },
);
```

### LangGraph agent loop

```
[start] user message arrives
  │
  ▼
[call_model_node]
  model sees: system prompt + conversation history + tool definitions
  model outputs: tool call OR final answer
  │
  ┌──────────────────┐
  │ tool call?        │
  └──┬───────────┬───┘
    YES           NO
     │             │
     ▼             ▼
[tool_node]      [end]
  execute          stream final answer
  append result
  to messages
     │
     ▼
[call_model_node]  ← loop: model now sees tool result
```

### State

```typescript
// Using StateSchema (Zod-based) with MessagesValue reducer
const ChatState = new StateSchema({
  messages: MessagesValue, // full conversation history, built-in reducer
  userId: z.string(),
});
```

State persists across turns using LangGraph's built-in checkpointing (`checkpointer: 'memory'`), so the model remembers earlier turns in the same conversation thread.

### Memory Architecture

LangGraph has two distinct memory types. The chat agent uses both.

```
Short-term memory (checkpointer — thread-scoped)
  What:  Full message history for the current conversation
  Scope: One thread_id = one conversation
  Dev:   MemorySaver()       — in-process, lost on restart
  Prod:  PostgresSaver       — durable, survives restarts

Long-term memory (store — cross-thread)
  What:  User preferences, financial context, recurring patterns
         that should persist across separate conversations
  Scope: Keyed by [userId, namespace, key]
  Dev:   InMemoryStore({ index: { embeddings, dims: 1536 } })   — in-process
  Prod:  PostgresStore(pool, { index: { embeddings, dims: 1536 } }) — durable, vector-backed
  Note:  The index config enables store.search(ns, { query, limit }) — semantic similarity
         lookup within a namespace. Without it, search() returns all items (plain scan).

RAG (semantic search tool)
  What:  Vector search over transaction embeddings
  When:  Model picks semanticSearchTransactions() for fuzzy questions
  See:   RAG section below for full detail

Short-term management techniques (three layers, applied in order):
  1. Compaction  — when history ≥ 20 messages, summarise oldest messages into
                   a single SystemMessage. Primary strategy. Lossless.
  2. Trimming    — trimMessages() inside respondNode: hard token-budget cap.
                   Safety guard after compaction. Drops oldest messages that
                   still exceed maxTokens. Precise but lossy.
  3. RemoveMessage — selective deletion of specific messages by ID.
                   Used to clear large tool result payloads after processing.
```

**Short-term: how it works**

LangGraph's checkpointer automatically saves and restores the full `messages` state on every turn keyed by `thread_id`. No extra code needed — the `MessagesValue` reducer appends each new message to the history automatically.

```
Turn 1: user sends "How much did I spend on food?"
  → graph runs, appends HumanMessage + AIMessage to state
  → checkpointer saves state under thread_id: "conv-abc"

Turn 2: user sends "What about last month?"
  → checkpointer restores state (includes Turn 1 messages)
  → model sees full history, understands "last month" refers to food
```

**Long-term: what gets stored**

```typescript
// Namespace structure in the store:
['user', userId, 'preferences'][('user', userId, 'context')][('user', userId, 'patterns')]; // preferred currency, date format, tone // "user is saving for a house", "freelancer with irregular income" // recurring flagged categories, known merchants
```

Store is accessed through the **`runtime` second parameter** of the node. `userId` is not read from state — it comes from `runtime.context`, which is populated at invocation time by the caller. `store.search(namespace)` with no options is a plain scan; `store.search(namespace, { query, limit })` is a **semantic vector search** that embeds the query and finds the most similar stored items. The `index` config on the store enables this.

```typescript
// Node receives (state, runtime) — runtime carries store + context
const respondNode = async (state: typeof ChatState.State, runtime) => {
  const userId = runtime.context?.userId as string;
  const userMessage = state.messages.at(-1)?.content as string;

  const [prefs, context, patterns] = await Promise.all([
    // Preferences are small — plain scan, always load all
    runtime.store?.search(['user', userId, 'preferences']),

    // Context can grow large — semantic search returns only what's relevant to this question
    runtime.store?.search(['user', userId, 'context'], { query: userMessage, limit: 5 }),

    // Patterns: recurring behaviours flagged in past conversations
    runtime.store?.search(['user', userId, 'patterns'], { query: userMessage, limit: 3 }),
  ]);

  const model = this.langGraph.getModel('anthropic:claude-sonnet-4.6');
  const systemMessage = buildSystemPrompt(prefs, context, patterns);
  const response = await model.invoke([systemMessage, ...state.messages]);

  // Write back: persist newly detected pattern for future conversations
  if (newPatternDetected) {
    await runtime.store?.put(['user', userId, 'patterns'], patternKey, { summary: pattern });
  }

  return { messages: [response] };
};
```

**What gets stored in each namespace:**

| Namespace                         | Typical items                                                                     | Search strategy                                             |
| --------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `['user', userId, 'preferences']` | `{ currency: 'NGN', tone: 'casual' }`                                             | Plain scan — always load all                                |
| `['user', userId, 'context']`     | `"user is saving for a house"`, `"freelancer with irregular income"`              | Semantic — retrieve what's relevant to the current question |
| `['user', userId, 'patterns']`    | `"always categorises 'KUDA NIP' as Income"`, `"frequently asks about food spend"` | Semantic — retrieve what's relevant                         |

**Compile with both memory types:**

```typescript
// Dev — in-process, wiped on restart
this.graph = this.langGraph.compile(builder, {
  checkpointer: 'memory', // MemorySaver()
  store: 'memory', // InMemoryStore()
});

// Prod — inject PostgresSaver + PostgresStore via NestJS DI (see ChatModule below)
this.graph = this.langGraph.compile(builder, {
  checkpointer: this.checkpointer, // PostgresSaver — durable, survives restarts
  store: this.store, // PostgresStore — durable, shared across instances
});
```

Both `PostgresSaver` and `PostgresStore` come from `@langchain/langgraph-checkpoint-postgres` and reuse the existing Neon `DATABASE_URL`. Each calls `.setup()` once on module init to create their internal tables (`langgraph_checkpoints`, `langgraph_store`).

**Compaction: preventing unbounded context growth**

Without compaction, a long conversation eventually exceeds the model's context window (or becomes very expensive). The compaction node uses `OpenAiRepo.summarize()` — already implemented in the provider layer — to condense old messages.

```typescript
const COMPACTION_THRESHOLD = 20; // messages before compaction kicks in
const MESSAGES_TO_KEEP = 6; // always keep the most recent N messages fresh

const compactionNode = async (state: typeof ChatState.State) => {
  if (state.messages.length <= COMPACTION_THRESHOLD) return {}; // no-op

  const toCompress = state.messages.slice(0, -MESSAGES_TO_KEEP);
  const recent = state.messages.slice(-MESSAGES_TO_KEEP);

  // OpenAiRepo.summarize() is already built — condenses history to one string
  const summary = await openAiRepo.summarize(toCompress);

  return {
    messages: [new SystemMessage(`Conversation summary so far: ${summary}`), ...recent],
  };
};
```

The compaction node runs before every model call. It's a no-op until the threshold is hit, then it compresses transparently:

```
[start]
  │
  ▼
[compaction_node]   ← no-op if messages.length ≤ 20, else compress
  │
  ▼
[call_model_node]   ← always sees a bounded context window
  │
  ┌─────────────────┐
  │ tool call?       │
  └──┬──────────┬───┘
    YES          NO
     │            │
     ▼            ▼
[tool_node]     [end]
     │
     ▼
[compaction_node]   ← check again on next loop iteration
```

**Message trimming — the token-budget safety guard**

Compaction is the primary strategy. Trimming is the complementary guard: it runs inside `respondNode` and hard-drops messages that still exceed the token budget after compaction. Compaction preserves meaning through summarisation (lossless); trimming drops the oldest messages that don't fit (lossy but precise).

```typescript
import { trimMessages } from '@langchain/core/messages';

const respondNode = async (state: typeof ChatState.State) => {
  // Run after compaction — compaction has already shrunk the history,
  // trimming is the hard cap in case it's still too large for the model.
  const trimmed = await trimMessages(state.messages, {
    maxTokens: 4000,
    strategy: 'last', // keep the most recent messages
    tokenCounter: model, // use the actual model tokenizer for accurate count
    includeSystem: true, // never drop the system prompt
    startOn: 'human', // first kept message must be from the user (LLM constraint)
  });

  const response = await model.invoke([systemMessage, ...trimmed]);
  return { messages: [response] };
};
```

| Technique  | Mechanism                                          | When to use                                                                   |
| ---------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Compaction | Summarise oldest N messages → single SystemMessage | Primary: graceful degradation as conversation grows                           |
| Trimming   | Hard-drop messages exceeding token limit           | Safety guard: keeps model calls within budget regardless of compaction result |

**`RemoveMessage` — selective deletion**

For removing specific messages by ID — useful for clearing large tool results after they've been processed, preventing accumulation of verbose JSON payloads across turns.

```typescript
import { RemoveMessage } from '@langchain/langgraph';

// In a post-tool cleanup node — remove the raw tool response once it's been summarised
const cleanupNode = async (state: typeof ChatState.State) => {
  const toolMessages = state.messages.filter((m) => m._getType() === 'tool');
  return {
    messages: toolMessages.map((m) => new RemoveMessage({ id: m.id! })),
  };
};
```

`RemoveMessage` is processed by the `messagesStateReducer` — the reducer sees the special remove marker and deletes the corresponding message from the thread by ID.

### Service pattern

`ChatModule` wires production-grade memory backends via NestJS DI. Both use the existing Neon `DATABASE_URL` — no extra infrastructure needed.

```typescript
// chat.module.ts
import { Module } from '@nestjs/common';
import { PostgresSaver, PostgresStore } from '@langchain/langgraph-checkpoint-postgres';
import { Pool } from 'pg';
import { RegistoryModule } from '../registory/registory.module';
import { ChatService } from './chat.service';

export const CHAT_CHECKPOINTER = Symbol('CHAT_CHECKPOINTER');
export const CHAT_STORE = Symbol('CHAT_STORE');

@Module({
  imports: [RegistoryModule],
  providers: [
    {
      provide: CHAT_CHECKPOINTER,
      useFactory: async () => {
        const saver = new PostgresSaver(new Pool({ connectionString: process.env.DATABASE_URL }));
        await saver.setup(); // creates langgraph_checkpoints table (idempotent)
        return saver;
      },
    },
    {
      provide: CHAT_STORE,
      useFactory: async (embeddingRepo: OpenAiEmbeddingRepo) => {
        const store = new PostgresStore(new Pool({ connectionString: process.env.DATABASE_URL }), {
          index: {
            embeddings: embeddingRepo.getEmbeddings(), // OpenAIEmbeddings instance
            dims: 1536, // text-embedding-3-small dimensions
          },
        });
        await store.setup(); // creates langgraph_store table + vector index (idempotent)
        return store;
      },
      inject: [OpenAiEmbeddingRepo],
    },
    ChatService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
```

```typescript
// chat.service.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { PostgresSaver, PostgresStore } from '@langchain/langgraph-checkpoint-postgres';
import { CHAT_CHECKPOINTER, CHAT_STORE } from './chat.module';

@Injectable()
export class ChatService implements OnModuleInit {
  private graph: any;

  constructor(
    private readonly langGraph: LangGraphService,
    @Inject(CHAT_CHECKPOINTER) private readonly checkpointer: PostgresSaver,
    @Inject(CHAT_STORE) private readonly store: PostgresStore,
  ) {}

  onModuleInit() {
    const ChatState = new StateGraph(
      Annotation.Root({
        messages: Annotation<BaseMessage[]>({ reducer: messagesStateReducer }),
        userId: Annotation<string>(),
      }),
    );

    const compactionNode = async (state: typeof ChatState.State) => {
      if (state.messages.length <= 20) return {};
      const toCompress = state.messages.slice(0, -6);
      const recent = state.messages.slice(-6);
      const summary = await this.openAiRepo.summarize(toCompress);
      return {
        messages: [new SystemMessage(`Conversation summary: ${summary}`), ...recent],
      };
    };

    // runtime second parameter — carries store + per-invocation context
    const respondNode = async (state: typeof ChatState.State, runtime) => {
      const userId = runtime.context?.userId as string;
      const userMessage = state.messages.at(-1)?.content as string;

      const [prefs, context, patterns] = await Promise.all([
        runtime.store?.search(['user', userId, 'preferences']), // plain scan
        runtime.store?.search(['user', userId, 'context'], { query: userMessage, limit: 5 }), // semantic
        runtime.store?.search(['user', userId, 'patterns'], { query: userMessage, limit: 3 }), // semantic
      ]);

      const model = this.langGraph.getModel('anthropic:claude-sonnet-4.6');
      const systemMessage = buildSystemPrompt(prefs, context, patterns);

      const trimmed = await trimMessages(state.messages, {
        maxTokens: 4000,
        strategy: 'last',
        tokenCounter: model,
        includeSystem: true,
        startOn: 'human',
      });

      const response = await model.invoke([systemMessage, ...trimmed]);
      return { messages: [response] };
    };

    const shouldContinue = (state: typeof ChatState.State) =>
      state.messages.at(-1)?.tool_calls?.length ? 'tools' : END;

    this.graph = this.langGraph.compile(
      ChatState.addNode('compact', compactionNode)
        .addNode('respond', respondNode)
        .addNode('tools', toolNode)
        .addEdge(START, 'compact')
        .addEdge('compact', 'respond')
        .addConditionalEdges('respond', shouldContinue, ['tools', END])
        .addEdge('tools', 'compact'),
      {
        checkpointer: this.checkpointer, // PostgresSaver — durable, per-thread history
        store: this.store, // PostgresStore — durable, cross-thread user context
      },
    );
  }

  // userId passed via context — available as runtime.context.userId inside every node
  async *streamResponse(req: ChatMessageReq) {
    yield* this.langGraph.streamEvents(
      this.graph,
      { messages: [new HumanMessage(req.message)] },
      {
        threadId: req.conversationId,
        context: { userId: req.userId },
      },
    );
  }
}
```

### Streaming — Vercel AI SDK (web client only)

```
Browser
  useChat() hook  ← Vercel AI SDK manages message state, loading, abort
  │  HTTP stream (AI SDK wire format)
  ▼
Next.js Route Handler  /api/chat
  proxies SSE chunks via createDataStreamResponse()
  │  fetch/SSE
  ▼
api_gateway  (NestJS SSE endpoint)
  │  gRPC server-stream
  ▼
ai_service  LangGraph chat agent
```

**Next.js route handler (`apps/web/src/app/api/chat/route.ts`):**

```typescript
import { createDataStreamResponse } from 'ai';

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();
  return createDataStreamResponse({
    execute: async (dataStream) => {
      const upstream = await fetch(`${GATEWAY_URL}/ai/chat`, {
        method: 'POST',
        body: JSON.stringify({ messages, conversationId }),
        headers: { Authorization: req.headers.get('Authorization') ?? '' },
      });
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        dataStream.write(decoder.decode(value));
      }
    },
  });
}
```

**Chat component (`apps/web/src/app/(dashboard)/ai/chat/_components/chat.tsx`):**

```typescript
import { useChat } from 'ai/react';

export function FinancialChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });
  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <span>{m.role === 'user' ? 'You' : 'Fintrack AI'}</span>
          <p>{m.content}</p>
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

### gRPC method

```proto
rpc Chat(stream ChatMessageReq) returns (stream ChatChunkRes) {}
```

---

## RAG — Semantic Transaction Search

### Why it exists

SQL tools handle structured questions precisely:

```
"How much did I spend on food last month?"  →  getSpendingSummary({ period: 'last_month', groupBy: 'category' })
```

But some questions are semantically vague and don't map to SQL predicates:

```
"When did I last really splurge?"
"Find any transaction that looks like a forgotten subscription."
"Which payments feel like mistakes?"
```

There is no `WHERE feels_like_mistake = true` column. These require understanding what the user _means_ and finding the semantically closest transactions — that is what vector embeddings enable. Without them the agent either returns nothing or hallucinates.

### What is a vector embedding?

A list of numbers representing the _meaning_ of a piece of text. The embedding model outputs a fixed-length array — for `text-embedding-3-small` that's 1536 numbers.

```
"KFC IKEJA Food & Dining expense paid amount 4500 March 2026"
  │
  text-embedding-3-small
  │
  [0.023, -0.417, 0.891, 0.003, -0.210, ... ]  ← 1536 numbers
```

Texts with similar meaning produce similar vectors. "Fast food dinner" and "KFC IKEJA Food & Dining" are different strings but their vectors will be close in 1536-dimensional space. "Bank transfer to John" will be far away.

### Why pgvector — no new database

Postgres has the `pgvector` extension: a `vector` column type and approximate nearest-neighbour search with a single `ORDER BY embedding <=> $query_vector` clause. You are already on Postgres — this is a schema change, not a new infrastructure component.

```
External vector DB (unnecessary complexity):
  Postgres (transactions) ←→ Sync ←→ Pinecone (embeddings)
  Two databases, two failure modes, extra cost.

pgvector (what we use):
  Postgres (transactions + embeddings in the same row)
  One database, one query, joins work naturally.
```

### Schema setup

Already in `packages/database/prisma/schema.prisma`. The relevant fields on `Transaction`:

```prisma
model Transaction {
  // ...
  narration    String?                      // raw Mono bank narration — source text for embedding
  bankCategory String?                      // raw Mono category enum — also embedded as context
  embedding    Unsupported("vector(1536)")? // nullable — backfilled async by EmbeddingWorker
  // ...
}
```

The HNSW index and `vector` extension are applied in migration `20260419212421_init_db`:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX transactions_embedding_hnsw
  ON "Transaction"
  USING hnsw (embedding vector_cosine_ops);
```

Use **HNSW** (not IVFFlat): no training phase, handles continuous inserts without degrading search quality. Use `vector_cosine_ops` for text embeddings — measures angle between vectors, captures semantic similarity regardless of text length.

### What gets embedded

```typescript
function buildEmbeddingDocument(tx: Transaction, categoryName: string): string {
  return [
    tx.narration ?? tx.description, // narration = immutable bank text; fallback to description for manual transactions
    categoryName,
    tx.type === 'INCOME' ? 'income received' : 'expense paid',
    `amount ${tx.amount}`,
    format(tx.date, 'MMMM YYYY'),
  ].join(' ');
}
// e.g. "KFC IKEJA Food & Dining expense paid amount 4500 March 2026"
```

### When embeddings are generated

Not synchronously during transaction creation — the bank sync batch must not block on embedding calls. Background job via BullMQ:

```typescript
// BullMQ job payload published by finance_service after batchCreateTransactions
interface EmbeddingJobPayload {
  userId: string;
  transactionIds: string[]; // IDs of newly created transactions to embed
}
```

```
finance_service: batchCreateTransactions completes
  → BullMQ: EmbeddingJobPayload { userId, transactionIds }
  → ai_service EmbeddingWorker picks up job
  → batches of 100: buildEmbeddingDocument() → OpenAI batch request
  → UPDATE transactions SET embedding = $vector WHERE id = $id
```

### The `semanticSearchTransactions` tool

```typescript
// Return type — what the agent sees when this tool resolves
interface SemanticSearchResult {
  id: string;
  narration: string | null;
  description: string | null;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: Date;
  categoryId: string;
  similarity: number; // 0–1 cosine similarity score
}

async function semanticSearchTransactions({
  userId,
  query,
  limit = 10,
}: {
  userId: string;
  query: string;
  limit?: number;
}): Promise<SemanticSearchResult[]> {
  // 1. Embed the natural language question
  const [queryVector] = await embeddingRepo.embed([query], { model: 'text-embedding-3-small' });

  // 2. Cosine similarity search
  return prisma.$queryRaw<SemanticSearchResult[]>`
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

### Two retrieval paths in the chat agent

```
User question arrives
  │
  ▼
LangGraph: call_model_node  →  model decides:
  │
  ├─ structured question ──► SQL tool ──► Postgres (exact aggregation)
  │
  └─ semantic question   ──► semanticSearchTransactions ──► pgvector cosine search
                                                           top-k transactions injected as context
                                                           ──► model generates grounded answer
```

---

## Analytics Architecture

### Two things called "analytics"

1. **Aggregated metrics** — "Total spent on food in March: ₦45,000". Computed from Postgres transactions via SQL aggregation.
2. **AI insights** — "You're spending significantly more on food than last month". Generated by the AI service from the aggregated metrics.

Do not conflate them. Aggregated metrics are numbers. AI insights are observations drawn from those numbers.

### Why MongoDB for analytics snapshots

Pre-computed analytics snapshots (monthly breakdowns, year-over-year comparisons, budget utilisation history) are documents with flexible shape that vary by time period and aggregation level. MongoDB's document model fits this without requiring schema versioning for every new aggregation shape. Its native `$group` / `$sum` aggregation pipelines are exactly what analytics computation needs.

### Why Redis for serving analytics

Analytics don't change on every page load:

```
GET insights:{userId}   → Redis HIT  → return immediately (TTL 1h)
                        → Redis MISS → MongoDB → populate Redis → return
```

Redis is already in the project for BullMQ and the Mono auth flow — no new infrastructure.

### Data flow

```
Postgres transactions
  │
  scheduler_service (nightly aggregation job)
  │
  ├─ computes: monthly totals, category breakdown, budget utilisation, goal progress
  ├─ writes: analytics snapshots → MongoDB
  └─ publishes: BullMQ job → ai_service → generate insights → write to MongoDB

api_gateway tRPC (analytics.getSummary, ai.getInsights)
  │
  Redis cache → (miss) → MongoDB
```

### MongoDB document shapes

```typescript
// Collection: analytics_snapshots
interface AnalyticsSnapshotDocument {
  userId: string;
  period: string; // "2026-03" — YYYY-MM
  type: 'monthly_summary' | 'quarterly_summary' | 'yearly_summary';
  data: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    topCategories: Array<{ slug: string; total: number; transactionCount: number }>;
    budgetUtilisation: Array<{
      categorySlug: string;
      budgeted: number;
      spent: number;
      pct: number;
    }>;
    goalProgress: Array<{ goalId: string; targetAmount: number; savedAmount: number; pct: number }>;
  };
  computedAt: Date;
}

// Collection: category_breakdowns
interface CategoryBreakdownDocument {
  userId: string;
  period: string; // "2026-03"
  categories: Array<{
    slug: string;
    name: string;
    total: number;
    count: number;
    budget: number | null; // null if no budget set for this category
  }>;
  computedAt: Date;
}

// Collection: ai_insights  (same shape as GenerateInsightsRes above)
interface AiInsightDocument {
  userId: string;
  generatedAt: Date;
  summary: string;
  anomalies: string[];
  recommendations: string[];
}
```

---

## gRPC Contract Summary

```proto
service AiService {
  // Domain 1: called by account.processor during bank sync
  rpc ClassifyTransactions(ClassifyTransactionsReq) returns (ClassifyTransactionsRes) {}

  // Domain 2: called by scheduler_service via BullMQ
  rpc GenerateInsights(GenerateInsightsReq) returns (GenerateInsightsRes) {}

  // Domain 3: called by api_gateway for the chat UI
  rpc Chat(stream ChatMessageReq) returns (stream ChatChunkRes) {}
}
```

---

## Implementation Order

### Step 1 — RegistoryModule composition layer (unblocks everything)

Add `services/langchain.service.ts` and `services/langgraph.service.ts` inside `apps/ai_service/src/registory/`. Register both in `RegistoryModule` as providers and exports. No feature logic yet — feature modules get `LangChainService` and `LangGraphService` injected automatically because `RegistoryModule` is `@Global`.

Deliverable: `pnpm --filter ai_service build` passes clean.

### Step 2 — Classification (unblock bank sync)

Build the classification chain in `ClassificationService`. Implement the `ClassifyTransactions` gRPC method. No MongoDB, no streaming, no agent loops.

Deliverable: `ClassifyTransactions` gRPC method working end-to-end.

### Step 3 — Analytics data pipeline (unblock insights)

Build the MongoDB collections and the `scheduler_service` aggregation job. No AI yet — just numbers flowing from Postgres into MongoDB snapshots. Expose a tRPC endpoint reading those snapshots with Redis caching.

Deliverable: `analytics.getSummary` returning real monthly totals from MongoDB.

### Step 4 — Insights (LangGraph practice)

Build the LangGraph insights workflow reading from MongoDB. Wire it into the scheduler_service so it runs after aggregation.

Deliverable: `ai.getInsights` returning real AI observations about the user's spending.

### Step 5 — Chat assistant (LangGraph agent)

Define the Postgres query tools first (no AI), test they return correct data, then wire them into the LangGraph agent. Add pgvector RAG tool. Add streaming last.

Deliverable: Chat UI talking to a live agent with access to the user's real data.

---

## What to Ignore (Non-Goals)

- **Voice interface** — out of scope
- **Predictive budgeting (ML forecasting)** — token scoring + AI insights cover the meaningful signals; a full forecasting model is V3 work
- **Receipt OCR** — separate concern, not part of ai_service
- **Fine-tuning** — not needed; prompt engineering with gpt-4o or Claude Sonnet is sufficient for all three domains
- **External vector databases** — pgvector inside Postgres is sufficient; Pinecone/Weaviate/Qdrant add ops overhead with no benefit at this scale
