# AI Service — Architecture & Implementation Guide

## The One Question First: Do You Need Python?

**No.**

LangChain and LangGraph both have official TypeScript SDKs:

```
langchain              — core chains, prompt templates, output parsers
@langchain/core        — base abstractions (runnable, messages)
@langchain/langgraph   — graph-based agent workflows
@langchain/openai      — OpenAI/Azure integration
@langchain/anthropic   — Anthropic (Claude) integration
```

Your project is already a TypeScript monorepo. The TS SDKs are first-class
and maintained by the same team as the Python versions. You build everything
inside the existing `apps/ai_service` NestJS app — no Python, no new runtime,
no context switching.

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
│                    LLM Repository                       │
│              (uniform interface over model)             │
└───────────────────────────┬─────────────────────────────┘
                            │ gRPC
              ┌─────────────┴──────────────┐
              │       api_gateway          │
              └────────────────────────────┘
```

---

## Domain 1 — Transaction Classification

### What it does

Receives the transactions that scored 0 in token scoring (Mono said `unknown`,
no merchant match, narration is opaque), classifies them against the user's
actual category list, returns a `{ transactionId → categorySlug }` map.

### Why LangChain (not LangGraph)

This is a single, stateless, structured extraction call. There is no agent
loop, no tool use, no branching. The model reads a prompt and returns JSON.
LangChain's chain primitive — `prompt | llm | outputParser` — is exactly
right for this and adds zero overhead.

### How it works

```
ClassifyTransactionsReq
  { transactions: [{ id, narration, monoCategory }], categories: [{ name, slug }] }
  │
  PromptTemplate
    "You are a financial transaction classifier.
     User's categories: {categories_json}
     Classify each transaction. Return JSON: { id: slug }.
     {transactions_json}"
  │
  ChatOpenAI (gpt-4o-mini — cheap, fast, sufficient for this task)
  │
  JsonOutputParser
  │
  validate: every slug in response exists in user's category list
  │
  ClassifyTransactionsRes { assignments: { [id]: slug } }
```

### Retry on parse failure

If the model returns malformed JSON, retry once with the error appended to
the prompt. If it fails again, assign the fallback category to all remaining
transactions. Never throw — the batch create must always complete.

### gRPC method

```proto
rpc ClassifyTransactions(ClassifyTransactionsReq) returns (ClassifyTransactionsRes) {}
```

---

## Domain 2 — AI Insights

### What it does

Proactively generates human-readable observations about a user's financial
patterns. These are not charts — they are sentences derived from the
pre-computed analytics data.

Examples:
- "You spent 43% more on food this month than last month."
- "Your transport costs have been consistently above your budget for 3 months."
- "At your current savings rate, you'll hit your Laptop goal 2 weeks ahead of schedule."
- "3 recurring charges are due in the next 7 days, totalling ₦24,500."

### Why LangGraph (not a plain chain)

Generating a meaningful insight set is not one call. The model needs to:
1. Decide which metrics are interesting enough to comment on
2. Optionally request additional context (e.g. "what was the budget for this category?")
3. Filter out obvious or unhelpful observations
4. Return a ranked list

That decision loop — look at data, decide what's interesting, maybe ask for
more, synthesise — is a graph, not a linear chain.

### LangGraph workflow

```
[start]
  │
  ▼
[load_analytics_node]
  reads MongoDB: spending by category, budget utilisation,
  goal progress, upcoming recurring bills
  │
  ▼
[decide_angles_node]   ← LLM call
  "Given this financial summary, list the top 5 angles worth
   commenting on. Output JSON: [{ angle, data_needed }]"
  │
  ▼
[fetch_detail_node]
  for each angle that has data_needed, query MongoDB/Postgres
  │
  ▼
[generate_insights_node]  ← LLM call
  "Write one clear, specific insight for each angle.
   Use real numbers. Be direct. No financial advice."
  │
  ▼
[rank_and_filter_node]
  remove insights that are trivial (< 5% change, fully on track)
  keep top 3-5
  │
  ▼
[end] → InsightSet { insights: [{ text, category, severity }] }
```

### When insights are generated

Not on demand per page load — that would be slow and expensive.

The `scheduler_service` triggers insight generation once per day per user
(or after a sync completes with > 10 new transactions). The result is stored
in MongoDB and served from Redis cache. The frontend polls the tRPC endpoint
which reads from cache.

```
scheduler_service (daily cron)
  → BullMQ job: { userId, trigger: "daily" }
  → ai_service picks up job
  → runs LangGraph insights workflow
  → writes result to MongoDB
  → invalidates Redis cache key "insights:{userId}"

frontend tRPC call: ai.getInsights()
  → reads Redis cache
  → if miss, reads MongoDB
  → returns InsightSet
```

### gRPC method

```proto
rpc GenerateInsights(GenerateInsightsReq) returns (GenerateInsightsRes) {}
```

---

## Domain 3 — Financial Chat Assistant

### What it does

A conversational assistant that answers natural language questions about the
user's finances. Not generic financial advice — it has access to the user's
actual data and speaks about it specifically.

Examples:
- "How much did I spend on food last month?"
- "Am I on track with my savings goals?"
- "What's my biggest expense category this year?"
- "How many times did I buy Shoprite groceries?"
- "Compare my spending this month to last month."

### Why LangGraph

The assistant is an **agent with tools**. The model decides which data to
fetch based on the question, fetches it, processes the result, and decides
whether it has enough to answer or needs more. That loop requires LangGraph.

### Tools the agent has access to

```typescript
tools = [
  // SQL tools — structured, precise questions
  getTransactions({ userId, startDate, endDate, categorySlug, limit }),
  getSpendingSummary({ userId, period, groupBy }),
  getBudgets({ userId, period }),
  getGoals({ userId }),
  getRecurringBills({ userId }),
  getCategoryBreakdown({ userId, startDate, endDate }),

  // Vector tool — semantic, fuzzy questions (see RAG section below)
  semanticSearchTransactions({ userId, query, limit }),
]
```

Each tool is a function that queries Postgres (through Prisma) and returns
structured data. The model sees the tool signatures and decides which ones to
call. For vague, semantic questions the model picks `semanticSearchTransactions`
instead of the SQL tools — see the RAG section for how that works.

### LangGraph agent loop

```
[start] user message arrives
  │
  ▼
[call_model_node]
  model sees: system prompt + conversation history + tool definitions
  model outputs: either a tool call or a final answer
  │
  ┌─────────────────────────┐
  │ did model call a tool?  │
  └───┬───────────────┬─────┘
     YES              NO
      │                │
      ▼                ▼
[tool_node]         [end]
  execute tool        return final answer to user
  append result
  to state
      │
      ▼
[call_model_node]  ← loop back, model now sees tool result
```

### State

LangGraph's state for the chat agent:

```typescript
interface ChatState {
  userId: string;
  messages: BaseMessage[];   // full conversation history
  toolResults: ToolResult[]; // accumulated tool outputs this turn
}
```

State persists across turns using LangGraph's built-in checkpointing,
so the model remembers what was said earlier in the conversation.

### Streaming — Vercel AI SDK (chat UI only)

The chat UI uses the **Vercel AI SDK** (`ai` package) for the browser ↔
Next.js streaming leg. It is not used for classification or insights — those
are non-streaming, non-interactive calls.

**Install in `apps/web` only:**

```
npm install ai                 (in apps/web)
```

**Full stream path:**

```
Browser
  useChat() hook  ← Vercel AI SDK manages message state, loading, abort
  │  HTTP stream (AI SDK wire format)
  ▼
Next.js Route Handler  /api/chat
  reads req body, pipes chunks from api_gateway into createDataStreamResponse()
  │  fetch/SSE proxy
  ▼
api_gateway  (NestJS SSE endpoint)
  │  gRPC stream
  ▼
ai_service  LangGraph chat agent  ← intelligence lives here, not in Next.js
```

**Why `useChat` instead of a raw `EventSource`:**

`useChat` gives you for free: the full message list across turns, per-message
streaming state, input field binding, abort on unmount, error recovery, and
optimistic appending of the user message before the stream starts. Without it
you write all of that manually.

**Next.js Route Handler (`apps/web/src/app/api/chat/route.ts`):**

```typescript
import { createDataStreamResponse } from 'ai';

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();

  return createDataStreamResponse({
    execute: async (dataStream) => {
      // proxy chunks from api_gateway SSE into the AI SDK stream format
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

The component has no knowledge of LangGraph, gRPC, or the ai_service. It only
talks to the Next.js route handler.

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
"Am I on track for my Laptop goal?"         →  getGoals()
```

But some questions are semantically vague and don't map to SQL predicates:

```
"When did I last really splurge?"
"Have I been eating out less lately?"
"Find any transaction that looks like a forgotten subscription."
"Which payments feel like mistakes?"
```

None of those are `WHERE amount > X AND category = Y`. They require semantic
understanding of the narration text across potentially thousands of records.
That is the exact problem RAG solves.

### Why pgvector — no new database

You don't need Pinecone, Weaviate, or any external vector store. Postgres has
a first-class vector extension called **pgvector** that adds a `vector` column
type and approximate nearest-neighbour search with a single `ORDER BY embedding
<=> $query_vector` clause. You are already on Postgres — this is a schema
change, not a new infrastructure component.

### Prisma schema change

```prisma
model Transaction {
  // ...existing fields...
  embedding Unsupported("vector(1536)")?   // ← new, nullable — backfilled async
}
```

And the pgvector index (in a raw migration, Prisma doesn't generate this):

```sql
-- HNSW index: fast approximate search, no training required
CREATE INDEX transactions_embedding_hnsw
  ON transactions
  USING hnsw (embedding vector_cosine_ops);
```

HNSW is preferred over IVFFlat for this use case — it doesn't need an upfront
training phase and handles incremental inserts naturally.

### What gets embedded

Each transaction is embedded as a short document that combines all its readable
signals into one string:

```typescript
function buildEmbeddingDocument(tx: Transaction, categoryName: string): string {
  return [
    tx.narration,
    categoryName,
    tx.type === 'INCOME' ? 'income received' : 'expense paid',
    `amount ${tx.amount}`,
    format(tx.date, 'MMMM YYYY'),
  ].join(' ');
}

// e.g. "KFC IKEJA Food & Dining expense paid amount 4500 March 2026"
```

This gives the embedding model enough context that a query like "fast food
dinner" finds "KFC IKEJA" even though those words don't overlap.

### Embedding model

**`text-embedding-3-small`** (OpenAI) — 1536 dimensions, ~$0.00002 per
transaction. A user with 3,000 transactions costs $0.06 to embed once. After
that, only new transactions trigger embedding calls.

### When embeddings are generated

Not synchronously during transaction creation — the bank sync batch create must
not block on embedding calls. Embeddings are generated as a background job:

```
batchCreateTransactions completes
  │
  publishes BullMQ job: { userId, transactionIds[] }
  │
  ai_service EmbeddingWorker picks up job
  │
  for each batch of 100 transactions:
    builds embedding documents
    calls OpenAI embeddings API (one batch request)
    UPDATE transactions SET embedding = $vector WHERE id = $id
```

This means a small window exists between transaction creation and the embedding
being available. That is acceptable — the semantic search tool is for
exploratory chat, not real-time sync confirmation.

### The `semanticSearchTransactions` tool

```typescript
async function semanticSearchTransactions({
  userId,
  query,
  limit = 10,
}: {
  userId: string;
  query: string;
  limit?: number;
}) {
  // 1. embed the user's natural language question
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  const vector = queryEmbedding.data[0].embedding;

  // 2. cosine similarity search in Postgres — returns most semantically similar transactions
  const results = await prisma.$queryRaw`
    SELECT id, narration, amount, type, date, category_id,
           1 - (embedding <=> ${vector}::vector) AS similarity
    FROM transactions
    WHERE user_id = ${userId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vector}::vector
    LIMIT ${limit}
  `;

  return results;
}
```

### How the agent decides which tool to use

The model sees the tool descriptions and picks based on the question:

```
Question: "How much did I spend on food in March?"
  → getSpendingSummary — structured, known date range, known category

Question: "When did I last really splurge?"
  → semanticSearchTransactions({ query: "large unusual expensive purchase splurge" })
  → model reads returned transactions and identifies the best answer

Question: "Find any payments that look like subscriptions I forgot about"
  → semanticSearchTransactions({ query: "recurring subscription monthly service" })
  → model reads results, looks for recurring patterns
```

The agent can also combine both tool types in one turn — e.g. use
`semanticSearchTransactions` to find candidates, then call `getTransactions`
with specific IDs to get full detail.

### Full picture — two retrieval paths in the chat agent

```
User question arrives
  │
  ▼
LangGraph: call_model_node
  model decides:
  │
  ├─ structured question ──► SQL tool ──► Postgres (exact aggregation)
  │
  └─ semantic question   ──► semanticSearchTransactions ──► pgvector cosine search
                                                            (RAG retrieval)
                                                              │
                                                            top-k transactions
                                                              │
                                                   LangGraph: call_model_node
                                                     (model generates answer
                                                      grounded in retrieved tx)
```

The retrieved transactions play the same role as retrieved documents in
classic document RAG — they are context injected into the model's prompt to
ground its answer in real data rather than hallucination.

### What this is not

This is **not** replacing the SQL tools. `semanticSearchTransactions` is an
additional tool for cases where the user's question is semantically vague. For
everything with a clear date range, category, or amount predicate, SQL is
faster, cheaper, and more accurate. The model picks the right tool for the
right question — that is the agent's job.

---

## Analytics Architecture

### What "analytics" means in this project

Two separate things that people call "analytics":

1. **Aggregated metrics** — "Total spent on food in March: ₦45,000". These
   are computed from Postgres transactions. Fast, exact, SQL aggregation.

2. **AI insights** — "You're spending significantly more on food than last
   month". These are generated by the AI service from the aggregated metrics.

Do not conflate them. Aggregated metrics are just numbers. AI insights are
observations drawn from those numbers.

### Why MongoDB for analytics

Postgres is the source of truth for transactions. But pre-computed analytics
snapshots — monthly breakdowns by category, year-over-year comparisons,
budget utilisation history — are documents with flexible shape that vary by
time period and aggregation level. MongoDB's document model fits this without
needing to version a schema for every new aggregation shape.

MongoDB also has native time-series collections and efficient $group / $sum
aggregation pipelines, which are exactly what analytics computation needs.

### Why Redis for serving analytics

Analytics don't change on every page load. A user's monthly breakdown doesn't
change until a new transaction is added. Redis sits in front of MongoDB:

```
GET insights:{userId}          → Redis HIT → return immediately
                               → Redis MISS → MongoDB → populate Redis (TTL 1h) → return
```

Memcached could also work but Redis is already in the project for BullMQ and
the Mono auth flow, so there's no reason to add another cache layer.

### Data flow

```
Postgres transactions
  │
  scheduler_service (nightly aggregation job)
  │
  ├─ computes: monthly totals, category breakdown, budget utilisation, goal progress
  ├─ writes: analytics snapshots → MongoDB
  └─ publishes: BullMQ job → ai_service → generate insights → write to MongoDB

api_gateway tRPC (analytics.getSummary, analytics.getInsights)
  │
  Redis cache
  │ (miss)
  MongoDB
```

### MongoDB collections

```
analytics_snapshots
  { userId, period: "2026-03", type: "monthly_summary", data: {...} }

category_breakdowns
  { userId, period: "2026-03", categories: [{ slug, total, count, budget }] }

ai_insights
  { userId, generatedAt, insights: [{ text, category, severity }] }
```

---

## LangChain vs LangGraph — Decision Table

| Use Case | Tool | Why |
|---|---|---|
| Transaction classification | LangChain chain | Single prompt → JSON output. No loops. |
| Insight generation | LangGraph | Multi-step: decide angles → fetch data → write → filter |
| Financial chat (structured) | LangGraph + SQL tools | Agent loops, exact Postgres queries |
| Financial chat (semantic) | LangGraph + pgvector RAG | Agent picks vector tool for fuzzy questions |
| Transaction embedding | OpenAI embeddings API | text-embedding-3-small, run as background job |
| Prompt templates | LangChain | All workflows use it internally |
| Output parsing | LangChain | All workflows use JsonOutputParser |

**Rule of thumb:** If the model decides what to do next, use LangGraph. If you
decide what happens next and the model just fills in text, use a LangChain chain.

---

## LLM Repository Pattern

Both LangChain and LangGraph call models through adapters. You still want a
single place in the codebase that configures the model, sets the default
parameters (temperature, max tokens, timeout), and lets you swap the provider
without touching business logic.

```typescript
// packages/ai/src/llm.ts
export function createChatModel(options?: { temperature?: number }) {
  return new ChatOpenAI({
    modelName:   configService.get('OPENAI_API_MODEL'),
    apiKey:      configService.get('OPENAI_API_KEY'),
    temperature: options?.temperature ?? 0,  // 0 for classification, higher for chat
    maxTokens:   2048,
    timeout:     30_000,
  });
}
```

The classification chain, insights graph, and chat agent all call
`createChatModel()`. Swap the import to `ChatAnthropic` and everything moves
to Claude without touching any business logic. That is still the repository
pattern — LangChain just provides the interface.

---

## gRPC Contract Summary

```proto
service AiService {
  // Domain 1: called by account.processor during bank sync
  rpc ClassifyTransactions(ClassifyTransactionsReq) returns (ClassifyTransactionsRes) {}

  // Domain 2: called by scheduler_service via BullMQ (not direct gRPC)
  rpc GenerateInsights(GenerateInsightsReq) returns (GenerateInsightsRes) {}

  // Domain 3: called by api_gateway for the chat UI
  rpc Chat(stream ChatMessageReq) returns (stream ChatChunkRes) {}
}
```

---

## Implementation Order

Build in this order — each step is independently useful and testable.

### Step 1 — Classification (unblock bank sync)

Build the LangChain classification chain first. This is the simplest call and
it unblocks the account processor's Layer 3 fallback. No MongoDB, no streaming,
no agent loops. One module, one chain, one gRPC method.

Deliverable: `ClassifyTransactions` gRPC method working end-to-end.

### Step 2 — Analytics data pipeline (unblock insights)

Build the MongoDB collections and the scheduler_service aggregation job that
populates them nightly. No AI yet — just raw numbers flowing from Postgres
into MongoDB snapshots. Expose a tRPC endpoint that reads those snapshots.

Deliverable: `analytics.getSummary` tRPC route returning real monthly totals
from MongoDB, with Redis caching.

### Step 3 — Insights (LangGraph practice)

Build the LangGraph insights workflow. It reads from the MongoDB snapshots
built in Step 2 and writes back AI-generated insight objects. Wire it into
the scheduler_service so it runs after the aggregation job.

Deliverable: `ai.getInsights` tRPC route returning real AI observations about
the user's spending.

### Step 4 — Chat assistant (LangGraph agent)

Build the LangGraph tool-calling agent. Define the Postgres query tools first
(no AI), test that they return correct data, then wire them into the agent.
Add streaming last.

Deliverable: Chat UI talking to a live agent with access to user's real data.

---

## What to Ignore (Non-Goals)

- **Voice interface** — out of scope
- **Predictive budgeting** (ML forecasting) — token scoring + AI insights
  already cover the meaningful insights; a full forecasting model is V3 work
- **Receipt OCR** — separate concern, not part of ai_service
- **Fine-tuning** — not needed; prompt engineering with GPT-4o-mini or
  Claude Haiku is sufficient for all three domains
- **External vector databases** — pgvector inside Postgres is sufficient;
  Pinecone, Weaviate, Qdrant add ops overhead with no benefit at this scale
