# Finance Service — Architecture & Implementation Guide

## What the Finance Service Is Responsible For

All core financial data: creating, reading, updating, and deleting the records
that represent a user's financial life. Five distinct modules, each with its own
gRPC controller. The service owns Postgres as the source of truth for financial
data.

```
┌──────────────────────────────────────────────────────────────┐
│                      finance_service                         │
│                                                              │
│  ┌─────────────┐ ┌────────┐ ┌─────────┐ ┌──────┐ ┌───────┐ │
│  │ Transaction │ │ Budget │ │Recurring│ │ Goal │ │ Split │ │
│  │   Module    │ │ Module │ │ Module  │ │Module│ │Module │ │
│  └──────┬──────┘ └───┬────┘ └────┬────┘ └──┬───┘ └───┬───┘ │
│         │            │           │          │         │     │
│         └────────────┴───────────┴──────────┴─────────┘     │
│                                 │                           │
│                          RpcAuthGuard                       │
│                    (validates userId from gRPC metadata)    │
└──────────────────────────────────────────────────────────────┘
                          │ gRPC
              ┌───────────┴────────────┐
              │      api_gateway       │
              └────────────────────────┘
```

---

## Module 1 — Transactions

### What it does

The core record of every financial event. All other finance modules (budgets,
goals, recurring, splits) ultimately reference or derive from transactions.

### gRPC methods

```proto
rpc CreateTransaction(CreateTransactionReq) returns (TransactionRes) {}
rpc BatchCreateTransactions(BatchCreateTransactionsReq) returns (BatchCreateTransactionsRes) {}
rpc GetTransactions(GetTransactionsReq) returns (GetTransactionsRes) {}
rpc GetTransaction(GetTransactionReq) returns (TransactionRes) {}
rpc UpdateTransaction(UpdateTransactionReq) returns (TransactionRes) {}
rpc DeleteTransaction(DeleteTransactionReq) returns (Empty) {}
```

### Key design decisions

**`BatchCreateTransactions` is separate from `CreateTransaction`.**
Bank sync (via Mono) creates dozens to hundreds of transactions at once. Batching
avoids N gRPC round-trips from api_gateway and allows a single Prisma
`createMany()` call. The batch path also publishes a single BullMQ job for
downstream work (embeddings, analytics) rather than one job per transaction.

**`source` and `sourceId` fields.**
Every transaction carries a `source` enum (`MANUAL`, `MONO`, `RECURRING`) and a
`sourceId`. The `(userId, source, sourceId)` triple has a unique constraint.
This is what prevents duplicate transactions when:
- Mono sends the same bank transaction twice
- The recurring processor runs twice before the idempotency guard fires

**Queue publishing after write.**
After a successful write, the transaction module publishes to three queues:

```
create / batchCreate completes
  │
  ├─ ACTIVITY_NOTIFICATION_QUEUE → api_gateway activity module
  │    records event in activity feed
  │
  ├─ FCM_NOTIFICATION_QUEUE → api_gateway fcm module
  │    sends push notification to mobile
  │
  └─ ANALYTICS_NOTIFICATION_QUEUE → future: ai_service embedding worker
       triggers embedding generation for new transactions
```

---

## Module 2 — Budgets

### What it does

A budget is a spending cap on a category for a given period. The api_gateway
analytics module computes budget utilisation by comparing budget amounts against
transaction totals — the finance_service only stores and manages the budget
records.

### gRPC methods

```proto
rpc CreateBudget(CreateBudgetReq) returns (BudgetRes) {}
rpc UpdateBudget(UpdateBudgetReq) returns (BudgetRes) {}
rpc DeleteBudget(DeleteBudgetReq) returns (Empty) {}
```

### Design note

Budgets are intentionally simple — a `{ userId, categoryId, amount, period }`
record. The intelligence (utilisation percentage, alerts) is computed at
read time in analytics, not stored here.

---

## Module 3 — Recurring Items

### What it does

Recurring items are templates that the scheduler_service uses to auto-create
transactions on a schedule. A user creates a recurring item (e.g. "Netflix,
₦3,500, monthly") and the scheduler creates a real transaction on each due date.

### gRPC methods

```proto
rpc CreateRecurring(CreateRecurringReq) returns (RecurringRes) {}
rpc GetRecurrings(GetRecurringsReq) returns (GetRecurringsRes) {}
rpc GetRecurring(GetRecurringReq) returns (RecurringRes) {}
rpc UpdateRecurring(UpdateRecurringReq) returns (RecurringRes) {}
rpc ToggleRecurring(ToggleRecurringReq) returns (RecurringRes) {}
rpc DeleteRecurring(DeleteRecurringReq) returns (Empty) {}
```

### Key fields

```
RecurringItem {
  id, userId, name, amount, type, frequency
  categoryId
  isActive          ← scheduler only processes active items
  nextRunAt         ← scheduler uses this to find due items
  lastRunAt         ← for display ("last ran 3 days ago")
  startDate
  endDate           ← nullable; scheduler deactivates when reached
  description, merchant
}
```

**`ToggleRecurring`** enables/disables a recurring item without deleting it.
A user who pauses Netflix over the holidays disables the item; it won't generate
transactions until re-enabled.

---

## Module 4 — Goals

### What it does

Savings goals with contribution tracking. A goal has a target amount and an
optional target date. Users add contributions (which optionally create
corresponding transactions) toward the goal and track progress.

### gRPC methods

```proto
rpc CreateGoal(CreateGoalReq) returns (GoalRes) {}
rpc GetGoals(GetGoalsReq) returns (GetGoalsRes) {}
rpc GetGoal(GetGoalReq) returns (GoalRes) {}
rpc UpdateGoal(UpdateGoalReq) returns (GoalRes) {}
rpc DeleteGoal(DeleteGoalReq) returns (Empty) {}
rpc ContributeToGoal(ContributeToGoalReq) returns (GoalContributionRes) {}
rpc UpdateGoalContribution(UpdateGoalContributionReq) returns (GoalContributionRes) {}
rpc DeleteContribution(DeleteContributionReq) returns (Empty) {}
```

### Goal model

```
Goal {
  id, userId, name, targetAmount, targetDate (nullable)
  priority (LOW / MEDIUM / HIGH)
  status (IN_PROGRESS / COMPLETED / PAUSED)
  contributions: GoalContribution[]
}

GoalContribution {
  id, goalId, userId, amount, date, note
  transactionId (nullable) ← links to a real transaction if one was created
}
```

**`GetGoal` returns the full contribution list.** The progress percentage
(`sum(contributions.amount) / targetAmount`) is computed in the service layer
and returned in the response, not computed by the client.

**`DeleteGoal` cascades.** Prisma cascade deletes all contributions when a goal
is deleted. The linked transactions (if any) are NOT deleted — they are
independent financial records.

---

## Module 5 — Splits

### What it does

Expense splitting between multiple people. A user creates a split (e.g. "Dinner
at Cactus, ₦45,000"), adds participants with their shares, and records
settlements as participants pay back.

### gRPC methods

```proto
rpc CreateSplit(CreateSplitReq) returns (SplitRes) {}
rpc GetSplitAggregate(GetSplitAggregateReq) returns (SplitAggregateRes) {}
rpc GetSplits(GetSplitsReq) returns (GetSplitsRes) {}
rpc GetSplit(GetSplitReq) returns (SplitRes) {}
rpc UpdateSplit(UpdateSplitReq) returns (SplitRes) {}
rpc DeleteSplit(DeleteSplitReq) returns (Empty) {}
rpc AddParticipant(AddParticipantReq) returns (ParticipantRes) {}
rpc UpdateParticipant(UpdateParticipantReq) returns (ParticipantRes) {}
rpc DeleteParticipant(DeleteParticipantReq) returns (Empty) {}
rpc PaySettlement(PaySettlementReq) returns (SettlementRes) {}
rpc DeleteSettlement(DeleteSettlementReq) returns (Empty) {}
```

### Data model

```
Split {
  id, userId, name, totalAmount, status (PENDING / PARTIAL / SETTLED)
  participants: SplitParticipant[]
}

SplitParticipant {
  id, splitId, name, email (optional), amount (their share)
  settlements: Settlement[]
}

Settlement {
  id, participantId, amount, date, note
}
```

**`GetSplitAggregate`** returns summary stats — total splits, how many are
pending/partial/settled, total amount outstanding. This is used for the
dashboard overview card, not a full list.

**Status is computed, not stored directly.** The service derives status from
settlement totals: if all participants are fully settled, the split is SETTLED;
if some are, it is PARTIAL; otherwise PENDING.

---

## RpcAuthGuard

Applied globally to the finance_service. Validates the `userId` from gRPC
call metadata — api_gateway injects the authenticated user's ID into metadata
before forwarding any call. No business logic runs without a valid userId.

---

## Queue Topology

```
finance_service publishes to (via transaction module):

ACTIVITY_NOTIFICATION_QUEUE
  → api_gateway activity module logs the event

FCM_NOTIFICATION_QUEUE
  → api_gateway fcm module sends mobile push notification

ANALYTICS_NOTIFICATION_QUEUE
  → future: ai_service embedding worker
```

---

## gRPC Contract Summary

```proto
service FinanceService {
  // Transactions
  rpc CreateTransaction(CreateTransactionReq) returns (TransactionRes) {}
  rpc BatchCreateTransactions(BatchCreateTransactionsReq) returns (BatchCreateTransactionsRes) {}
  rpc GetTransactions(GetTransactionsReq) returns (GetTransactionsRes) {}
  rpc GetTransaction(GetTransactionReq) returns (TransactionRes) {}
  rpc UpdateTransaction(UpdateTransactionReq) returns (TransactionRes) {}
  rpc DeleteTransaction(DeleteTransactionReq) returns (Empty) {}

  // Budgets
  rpc CreateBudget(CreateBudgetReq) returns (BudgetRes) {}
  rpc UpdateBudget(UpdateBudgetReq) returns (BudgetRes) {}
  rpc DeleteBudget(DeleteBudgetReq) returns (Empty) {}

  // Recurring
  rpc CreateRecurring(CreateRecurringReq) returns (RecurringRes) {}
  rpc GetRecurrings(GetRecurringsReq) returns (GetRecurringsRes) {}
  rpc GetRecurring(GetRecurringReq) returns (RecurringRes) {}
  rpc UpdateRecurring(UpdateRecurringReq) returns (RecurringRes) {}
  rpc ToggleRecurring(ToggleRecurringReq) returns (RecurringRes) {}
  rpc DeleteRecurring(DeleteRecurringReq) returns (Empty) {}

  // Goals
  rpc CreateGoal(CreateGoalReq) returns (GoalRes) {}
  rpc GetGoals(GetGoalsReq) returns (GetGoalsRes) {}
  rpc GetGoal(GetGoalReq) returns (GoalRes) {}
  rpc UpdateGoal(UpdateGoalReq) returns (GoalRes) {}
  rpc DeleteGoal(DeleteGoalReq) returns (Empty) {}
  rpc ContributeToGoal(ContributeToGoalReq) returns (GoalContributionRes) {}
  rpc UpdateGoalContribution(UpdateGoalContributionReq) returns (GoalContributionRes) {}
  rpc DeleteContribution(DeleteContributionReq) returns (Empty) {}

  // Splits
  rpc CreateSplit(CreateSplitReq) returns (SplitRes) {}
  rpc GetSplitAggregate(GetSplitAggregateReq) returns (SplitAggregateRes) {}
  rpc GetSplits(GetSplitsReq) returns (GetSplitsRes) {}
  rpc GetSplit(GetSplitReq) returns (SplitRes) {}
  rpc UpdateSplit(UpdateSplitReq) returns (SplitRes) {}
  rpc DeleteSplit(DeleteSplitReq) returns (Empty) {}
  rpc AddParticipant(AddParticipantReq) returns (ParticipantRes) {}
  rpc UpdateParticipant(UpdateParticipantReq) returns (ParticipantRes) {}
  rpc DeleteParticipant(DeleteParticipantReq) returns (Empty) {}
  rpc PaySettlement(PaySettlementReq) returns (SettlementRes) {}
  rpc DeleteSettlement(DeleteSettlementReq) returns (Empty) {}
}
```

---

## Implementation Order

### Step 1 — Transactions

Build first. Every other module depends on this. Start with `CreateTransaction`
and `GetTransactions` (with basic filters). Add `BatchCreateTransactions` when
the Mono bank sync flow is ready.

### Step 2 — Budgets

Build second — simple CRUD, no dependencies beyond transactions existing.

### Step 3 — Recurring

Build before scheduler_service. The recurring module creates the template;
the scheduler creates the transactions from it. You can test the module
independently by manually setting `nextRunAt` to a past date.

### Step 4 — Goals

Build independently of recurring and budgets.

### Step 5 — Splits

Build last. Most complex data model (split → participants → settlements)
but no external dependencies.

---

## What to Ignore (Non-Goals)

- **Transaction import from CSV** — separate feature, not part of this service
- **Multi-currency support** — all amounts in NGN; currency conversion is V3 work
- **Budget rollover logic** — budgets reset per period; no carry-forward
- **Goal interest calculations** — goals track contributions only, not projected growth
- **Split notifications to participants** — no external messaging to non-users
