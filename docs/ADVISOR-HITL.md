# Advisor HITL (Phase 11) — End-to-End Build Plan

> **Purpose:** the build brief for the advisor's human-in-the-loop (HITL) action-approval capability — the single most complex advisor phase. Code-free by design: it specifies *what* to build, *where*, and the resolved design decisions, for an implementer to follow. Companion context lives in `docs/AI-SERVICE.md` (Domain 3) and the overall build plan.
>
> **Confirmed scope:**
>
> 1. **Action-approval only** — in-chat Approve/Reject cards for proposed financial changes. **Scope/permission requests are out of scope:** users grant/revoke data access themselves via the Context toggle panel, and the model just relays which scope to enable when blocked (existing `withScope` behaviour kept as-is).
> 2. Approved actions execute from **ai_service via a finance_service gRPC client** (same write path + activity log/notification as a manual change).
> 3. **All 5** `AdvisorAction` kinds wired with sensible defaults — including `flag_subscription`, which performs a **real recurring write** (adjust or cancel an existing subscription), not a store-only flag.

## 1. Context — why this phase

The advisor's headline promise is "propose concrete actions with one-tap approval." Today the whole pipeline is read-only and single-shot: a turn streams tokens to completion and never pauses for the human. HITL adds a mid-conversation pause built on LangGraph `interrupt()` + `Command({ resume })` over the durable Postgres checkpointer:

- **Action approval** — the advisor proposes a real financial change (adjust/create a budget, adjust a goal contribution, suggest a recurring item, or adjust/cancel an existing subscription), the graph pauses, the user Approves/Rejects in an in-chat card; only on Approve does the write execute, then the advisor confirms.

Scope handling stays as it is today (users grant/revoke via the Context toggle panel; the model relays which scope to enable when blocked) — **no in-chat permission prompt is built in this phase.**

Outcome: the advisor becomes safely agentic — it can act, but only with explicit consent, and it remembers rejections so it never nags.

## 2. What already exists (reuse, do not rebuild)

- **Types:** `AdvisorAction` (5 kinds) and `GraphStreamEvent` variants `approval_required` / `permission_required` are defined (`packages/types/src/interfaces/ai.ts`, `apps/ai_service/src/registory/lang.types.ts`). `AdvisorChunkRes` proto carries `{ type, content, data }`.
- **ai_service `toChunk()`** already maps `approval_required` / `permission_required` graph events → wire chunks (`apps/ai_service/src/advisor/advisor.service.ts`). They are typed and mappable but **never emitted** today.
- **FE is ~80% wired:** `AdvisorMessage` already has `proposedAction` + `actionState`; `ChatApprovalCard` exists and is rendered by `ChatMessage`; `chat_panel` has `handleActionApprove/handleActionReject`; `advisor.stream.ts` already routes non-token chunks to an `onEvent` handler. The gaps are: `onEvent` is a no-op and the handlers don't resume. (`permission_required` exists in the types but stays unused — no permission flow is built.)
- **Checkpointer** (`PostgresSaver`, `graph_persistence.service.ts`) makes `interrupt()`/resume durable across process restarts.
- **Proven streaming pipeline:** staged-token pattern (POST stages in Redis → `@Sse` GET streams) + abort propagation (FE → route signal → gateway unsubscribe → gRPC cancel → graph `signal`). Resume mirrors this exactly.
- **Finance writes:** `finance_service` exposes `CreateBudget/UpdateBudget/CreateGoal/UpdateGoal/ContributeToGoal/UpdateGoalContribution/CreateRecurring/UpdateRecurring/DeleteRecurring/ToggleRecurring` (`packages/types/proto/finance/*`). The **gateway already wires a finance gRPC client** (`apps/api_gateway/src/{budget,goal,recurring}/*`) — mirror that registration pattern in ai_service.
- **Scope infra:** `TOOL_SCOPES`, `SCOPE_CATALOG`, `withScope`, `toolsForScopes` (ai_service), `resolveGrantedScopes` + Redis scope cache (gateway), `AdvisorSetting` (Prisma).

## 3. The flow (resolved design)

1. Respond model decides to act → it calls a dedicated **`propose_action` tool** whose args are an `AdvisorAction` (discriminated by `kind`). The tool does not execute anything — it is a structured "I propose this" signal that fits the existing tool-call mechanism.
2. `routeAfterRespond` detects a `propose_action` call → routes to the new **`action` node** (other tool calls still → `tools`; none → `memory`).
3. The action node reads the proposed action and calls `interrupt({ kind: 'action', action })`. The graph **pauses and checkpoints**; the run ends.
4. `LangraphService` detects the interrupt in the stream and yields a `{ type: 'approval_required', action }` event → `toChunk` → wire → FE renders `ChatApprovalCard`.
5. User clicks **Approve/Reject** → FE opens a **fresh stream over the same pipeline** carrying a resume payload (the first stream already completed when the graph paused; see §4.3) → ai_service resumes the thread with `Command({ resume: approved })`. The `interrupt()` returns the boolean.
   - **Approve:** execute via finance gRPC (per-kind executor with field defaults); record an `actionResult`; answer the `propose_action` tool call with a `ToolMessage` (success/failure text). Every kind performs a real write — `flag_subscription` adjusts or cancels the targeted recurring item.
   - **Reject:** write the proposal to the **rejections** store namespace; answer the tool call with a "rejected by user" `ToolMessage`.
6. Control returns to `respond`, which reads the `ToolMessage` and streams a natural confirmation ("Done — your Food budget is now ₦42,000") or a graceful acknowledgement of the rejection.

The resume payload is just a boolean (`approved`).

## 4. Build breakdown by layer

### 4.1 Proto & shared types

- Add **`ResumeAdvisor(ResumeAdvisorReq) returns (stream AdvisorChunkRes)`** to `packages/types/proto/ai/ai.proto`; `ResumeAdvisorReq = { conversation_id, user_id, approved, granted_scopes }`. Regenerate (`pnpm proto:gen` + build).
- The interrupt value is `{ kind:'action', action }` — define it in `lang.types.ts` / advisor types; it is what `interrupt()` receives and what the emission step reads to produce the `approval_required` event.

### 4.2 ai_service — agentic core (the heavy lift)

- **State** (`advisor.graph.ts`): add `proposedAction` and `actionResult` channels (both nullable, replace-on-update). `turnCount`/`summary`/`messages` unchanged.
- **`propose_action` tool** (`advisor.tools.ts`): a single tool with a Zod schema mirroring `AdvisorAction` (discriminated by `kind`). Handler is inert (never reached — it's intercepted by routing). Bind it to the respond model alongside the read tools; describe in the system prompt _when_ to propose vs. when to just advise.
- **Routing** (`advisor.service.ts`): `routeAfterRespond` → if last AI message has a `propose_action` call → `ACTION`; else other tool calls → `TOOLS`; else → `MEMORY`. Add `ADVISOR_NODES.ACTION`.
- **`action` node** (`advisor.service.ts`): read the proposed action from the tool call; `interrupt({ kind:'action', action })`; on resume, execute-or-reject as in §3; always emit a `ToolMessage` answering the `propose_action` `tool_call_id` (LangGraph requires every tool call to be answered) and set `actionResult`; route back to `respond`.
- **`withScope` unchanged** (`advisor.tools.ts`): keep today's behaviour — a missing scope returns a relayable string telling the user to enable that data in the Context panel, and `toolsForScopes` keeps binding only granted tools. No permission interrupt is added.
- **`flag_subscription` reshape** (`packages/types/src/interfaces/ai.ts`): the current `{ name, amount, categorySlug, reason }` cannot target or execute a real change. Reshape it to carry the target recurring `id`, an `operation` (`'cancel' | 'adjust'`), and `proposedAmount?` (for adjust). The `get_recurring_items` read tool (`advisor.tools.ts`) must return each item's `id` so the model can reference a specific subscription when proposing the action.
- **Interrupt emission** (`registory/langraph.service.ts`): `streamEvents` must detect the `__interrupt__` surfaced by `graph.stream` (streamMode includes `updates`) and yield an `approval_required` event from the interrupt value. This is the single most important missing piece — without it the pause is invisible to the client.
- **Resume generator** (`advisor.service.ts`): `resumeResponse({ userId, conversationId, approved, grantedScopes, signal })` calls `graph.stream(new Command({ resume: approved }), { configurable: { thread_id }, context, signal })` and yields the same `GraphStreamEvent` union (continuation tokens, possibly a _further_ interrupt). Reuse the existing abort-signal wiring.
- **`ResumeAdvisor` rpc** (`advisor.controller.ts`): mirror `sendAdvisorMessage` — drive `resumeResponse` into the gRPC stream, same teardown/abort + user-safe error handling.
- **Finance executor**: register a finance gRPC client in ai_service (mirror gateway's `ClientsModule` + `FinanceServiceClient` resolution). A small `AdvisorActionExecutor` maps each `AdvisorAction` kind → finance rpc, filling gaps: `adjust_budget`/`create_budget` derive current `month`/`year` and synthesize a budget `name`; `create_budget` resolves `categorySlug`→ category; `adjust_goal_contribution` fetches the latest contribution id then `UpdateGoalContribution`; `suggest_recurring` defaults `type=EXPENSE`, `start_date=today`; `flag_subscription` targets an existing recurring by `id` and either adjusts it (`UpdateRecurring` with the new amount) or cancels it (`DeleteRecurring`), per its `operation` (`ToggleRecurring` is available if a "pause" operation is added later). Pass `x-user-id` metadata like the gateway does. Surface execution failures as a `ToolMessage` so the model apologizes rather than crashing.
- **Rejections memory**: write `{ kind, action, rejectedAt }` to `['user', userId, MEMORY_NAMESPACE.REJECTIONS]` on reject; **read** it in the respond node and inject a "previously rejected — do not re-propose" line into the system prompt (the respond node already assembles memory recall).

### 4.3 gateway — reuse the stream pipeline (discriminate by payload)

**Do NOT add a parallel resume route/pipeline.** The staged-token → `@Sse` → gRPC → abort → persist machinery is payload-agnostic; reuse it and branch on the staged payload. A resume is a *new request* (the first stream already completed when the graph paused), but it rides the **same** endpoint.

- **Staged payload** becomes a discriminated union: `{ conversationId, message }` (send) | `{ conversationId, resume: { approved } }` (resume). The existing `POST /advisor/message` stage and `@Sse /advisor/message/stream?token=` GET are shared unchanged.
- **`consumePending`** branches on the payload: for a `message`, `persistUserTurn` as today; for a `resume`, **skip** the user-turn persist (there is no user message). `resolveGrantedScopes` for both (the continuation may run more tools).
- **`streamMessage`** (the `switchMap`): call `aiServiceClient.resumeAdvisor(...)` for a resume payload, `sendAdvisorMessage(...)` otherwise. Everything downstream — token accumulation, `tap`/`map`/`catchError`, abort/cancel propagation, `finalize` → `persistAssistantTurn`, conversation-list cache-bust — is shared, unchanged.
- **Net new gateway code:** a payload-type check in `consumePending` + the one `switchMap` branch. No new endpoint, no `stageResume`/`streamResume`/`consumePendingResume`. (`ResumeAdvisor` stays a distinct **gRPC** method for a clean contract — the gateway just routes to it from the same HTTP endpoint.)

### 4.4 FE — action card + resume

- **`onEvent`** (`advisor.store.ts` `streamConversationMessage`): on `approval_required` → parse `data` and set the current assistant message's `proposedAction` + `actionState:'pending'`. (No `permission_required` handling — that flow isn't built.)
- **Components**: `ChatApprovalCard` + `ChatMessage` already render the action card; no new card needed.
- **Resume runner** (`advisor.store.ts`): `resumeConversation({ conversationId, approved })` reuses the existing send path — it POSTs to the **same** `POST /api/advisor` route with a resume body (`{ conversationId, resume: { approved } }`) and streams the continuation into the same conversation's live buffer (append the confirmation as a fresh assistant message), reusing the abort-controller + finalize/`appendToHead`/`lastFinalizedAt` machinery. The card's `actionState` locks to approved/rejected; show an in-flight state while resuming.
- **Route + stream helper:** extend the existing `apps/web/src/app/api/advisor/route.ts` + `_lib/advisor.stream.ts` to accept either a `message` or a `resume` body (no new route). Auth → stage → SSE pipe → `signal: request.signal` are unchanged.
- Wire `handleActionApprove/Reject` in `chat_panel.tsx` to call `resumeConversation`.

### 4.5 Reload persistence (recommended)

A pause that survives a refresh: the conversation-message rows store only `role`+`content`, so a still-pending card would be lost on reload. Add an optional JSON `metadata` column to `AdvisorChatMessage` (Prisma migration) holding `proposedAction`/`actionState`; the gateway persists it with the turn, `getConversationMessages` returns it, and the FE's `toAdvisorMessage` rehydrates it. (The interrupt itself is durable in the checkpointer, so resume still works; this is purely so the card re-renders.) If deferred, document that a pending card disappears on reload but the underlying interrupt is still resumable.

## 5. Edge cases to handle

- **Tool-call answer contract:** every `propose_action` call MUST be answered with a `ToolMessage` (executed/rejected) or the next model call fails — the action node is responsible for this on both branches.
- **Double/expired resume:** resuming a thread with no pending interrupt is a no-op/clear error (idempotent guard). Pending interrupts are durable — a late approval still resumes.
- **Abort + interrupt:** Stop only matters during active streaming; once interrupted the run is idle, so a pending card is unaffected by Stop. The resume stream is itself abortable.
- **Execution failure:** surface as a `ToolMessage`/`actionResult` so the advisor apologizes; never leak raw finance errors to the wire (mirror the existing user-safe error chunk).
- **`flag_subscription` target resolution:** the model must supply a valid recurring `id` (from `get_recurring_items`); if it's missing/stale, the action node returns a `ToolMessage` asking the user to clarify rather than guessing or writing to the wrong item.

## 6. Verification (end-to-end)

- **Action happy path:** "raise my Food budget to ₦42,000" → `approval_required` card → **Approve** → `finance_service.UpdateBudget` row changes in DB + `ActivityLogs`/notification fired (same as manual) → advisor confirms. **Reject** → rejection stored → new conversation → advisor does **not** re-propose the same change.
- **All 5 kinds:** exercise `create_budget`, `adjust_goal_contribution` (verify it targets the latest contribution), `suggest_recurring` (verify `type=EXPENSE`, `start_date=today`), and `flag_subscription` (verify it adjusts the real recurring via `UpdateRecurring`, and cancels via `DeleteRecurring`, on the item the model referenced).
- **Resume continuity:** confirmation streams into the same conversation; refresh mid-pending re-renders the card (if §4.5 done) and the underlying interrupt is still resumable.
- **Abort:** Stop during the initial streaming turn aborts the graph (existing behavior); a pending card is unaffected.
- **Regression:** normal (non-action) turns, scope-toggle panel, history/persistence, and abort all still work.

## 7. Critical files

- **proto:** `packages/types/proto/ai/ai.proto` (`ResumeAdvisor` + regen).
- **types:** `packages/types/src/interfaces/ai.ts` (`flag_subscription` reshape: `id` + `operation` + `proposedAmount?`).
- **ai_service:** `advisor.graph.ts` (state channels), `advisor.service.ts` (action node, routing, resume generator), `advisor.tools.ts` (`propose_action` tool + expose recurring `id`), `advisor.constants.ts` (`ACTION` node), `advisor.controller.ts` (`ResumeAdvisor`), `advisor.module.ts` / `ai.module.ts` (finance gRPC client) + new `AdvisorActionExecutor`, `registory/langraph.service.ts` (interrupt emission + `Command` resume), `registory/lang.types.ts`.
- **gateway:** `advisor.service.ts` only — `consumePending` payload branch (skip user-turn persist on resume) + `streamMessage` `switchMap` → `resumeAdvisor`. No new endpoint/route.
- **FE:** `_lib/advisor.store.ts` (onEvent + resume runner), `_lib/advisor.stream.ts` (accept message-or-resume body), `api/advisor/route.ts` (same — message-or-resume), `_components/chat_message.tsx`, `_components/chat_panel.tsx`. No new route file.
- **schema (optional, recommended):** `AdvisorChatMessage.metadata` JSON for card reload persistence.
