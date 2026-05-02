# Scheduler Service — Architecture & Implementation Guide

## What the Scheduler Service Is Responsible For

Time-driven background work that no user action triggers. Three recurring jobs,
each on its own cron schedule, each writing to Postgres via Prisma. The service
has no gRPC endpoints and is not called by any other service — it runs on its
own clock and publishes to queues when work is done.

```
┌──────────────────────────────────────────────────────────────┐
│                     scheduler_service                        │
│                                                              │
│  Cron: 0 3 * * *         Cron: 0 * * * *   Cron: 0 1 1 * * │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │ Account Cleanup  │  │  Recurring Tx  │  │    Usage    │  │
│  │  (3 AM daily)    │  │  (every hour)  │  │   Reset     │  │
│  └────────┬─────────┘  └───────┬────────┘  │(1AM, 1st)  │  │
│           │                    │           └──────┬──────┘  │
│           ▼                    ▼                  ▼         │
│   ACCOUNT_CLEANUP_QUEUE  RECURRING_QUEUE   USAGE_TRACKING   │
│                                            _QUEUE           │
└──────────────────────────────────────────────────────────────┘
```

---

## Job 1 — Account Cleanup

**Cron:** `0 3 * * *` — 3:00 AM every day

### What it does

Hard-deletes all user rows whose `scheduledDeletionAt` timestamp is in the past.
Prisma's cascade rules handle all child rows automatically.

### How it works

```
scheduler.service.ts → purgeScheduledAccountDeletion()
  │
  enqueue PURGE_SCHEDULED_DELETIONS_JOB → ACCOUNT_CLEANUP_QUEUE
  │
  CleanupProcessor.purgeScheduledDeletions()
    │
    prisma.user.deleteMany({
      where: { scheduledDeletionAt: { lt: new Date() } }
    })
    → Prisma cascade deletes: sessions, accounts, transactions,
      budgets, goals, subscriptions, usage trackers — everything
    │
    log: "Purged N scheduled account deletion(s)"
```

### Why 30-day grace period

`auth_service.deleteAccount()` sets `scheduledDeletionAt = now + 30 days`,
not an immediate delete. This gives users a window to contact support and
recover their account. The nightly job only acts on accounts past that date.

### Why a processor, not direct Prisma in the cron

The cron method just enqueues a job. The actual database work runs in
`CleanupProcessor`. This pattern means: if the scheduler_service crashes
mid-cron, BullMQ retries the job on restart rather than silently losing it.

---

## Job 2 — Recurring Transactions

**Cron:** `0 * * * *` — top of every hour

### What it does

Finds all active `RecurringItem` rows whose `nextRunAt` is due, creates a
transaction for each, advances `nextRunAt` to the next period, and deactivates
items that have passed their `endDate`. Sends a per-user email summary of what
was created.

### How it works

```
scheduler.service.ts → createRecurringTransactions()
  │
  enqueue CREATE_RECURRING_TRANSACTION → RECURRING_QUEUE
  │
  RecurringProcessor.createRecurringTransactions()
    │
    prisma.recurringItem.findMany({
      where: { isActive: true, nextRunAt: { lte: now },
               OR: [{ endDate: null }, { endDate: { gte: now } }] },
      include: { category: true }
    })
    │
    for each item:
      pre-check: does transaction already exist for this sourceId?
        sourceId = `${item.id}-${item.nextRunAt.toISOString()}`
        → skip if exists (idempotency guard)
      │
      compute nextRunAt via computeNextRunAt(frequency, current nextRunAt)
      │
      prisma.$transaction(SERIALIZABLE):
        create Transaction {
          source: 'RECURRING', sourceId,
          userId, categoryId, date: item.nextRunAt,
          amount, type, description, merchant
        }
        update RecurringItem {
          lastRunAt: item.nextRunAt,
          nextRunAt: <computed>,
          ...(shouldDeactivate && { isActive: false })
        }
      │
      failures are isolated — one bad item never blocks the rest

    after all items:
      for each userId with created items:
        fetch user email + name
        TOKEN_NOTIFICATION_QUEUE → RECURRING_TRANSACTIONS_EMAIL_JOB
```

### Frequency → nextRunAt arithmetic

```
DAILY     → +1 day
WEEKLY    → +7 days
BIWEEKLY  → +14 days
MONTHLY   → +1 month (UTC)
QUARTERLY → +3 months (UTC)
YEARLY    → +1 year (UTC)
CUSTOM    → +1 day (safe default — caller controls externally)
```

All arithmetic uses UTC methods (`setUTCDate`, `setUTCMonth`, `setUTCFullYear`)
to avoid daylight saving time boundary issues.

### Idempotency — two layers

1. **Pre-check:** query for existing transaction with the same `sourceId` before
   starting the Prisma transaction. Skips duplicates cheaply.
2. **DB constraint:** `(userId, source, sourceId)` has a unique constraint.
   Even under concurrent workers, the second insert fails safely.

---

## Job 3 — Usage Tracker Reset

**Cron:** `0 1 1 * *` — 1:00 AM on the first of every month

### What it does

For all FREE-plan users, deletes their existing usage trackers and creates
fresh ones for the new period. PRO users are not touched — their usage limits
are managed by Stripe subscription state.

### How it works

```
scheduler.service.ts → cleanupUsageTrackers()
  │
  enqueue PURGE_USAGE_TRACKING_JOB → USAGE_TRACKING_QUEUE
  │
  UsageProcessor.purgeUsageTracking()
    │
    prisma.user.findMany({ where: { subscription: { plan: 'FREE' } } })
    │
    [periodStart, periodEnd] = getPeriodRange()  → current month bounds
    │
    for each free user:
      prisma.$transaction([
        usageTracker.deleteMany({ where: { userId } }),
        usageTracker.createMany({
          data: [
            { feature: 'AI_INSIGHTS_QUERIES', count: 0, periodStart, periodEnd },
            { feature: 'AI_CHAT_MESSAGES',    count: 0, periodStart, periodEnd },
            { feature: 'RECEIPT_UPLOADS',     count: 0, periodStart, periodEnd },
          ],
          skipDuplicates: true,
        })
      ])
      │
      PAYMENT_QUEUE → NEW_USAGE_TRACKERS_CREATED_JOB
        → notification_service sends usage reset email
```

### Usage features tracked

| Feature | Free limit | Who resets |
|---|---|---|
| `AI_INSIGHTS_QUERIES` | configurable | scheduler_service monthly |
| `AI_CHAT_MESSAGES` | configurable | scheduler_service monthly |
| `RECEIPT_UPLOADS` | configurable | scheduler_service monthly |

PRO users have these same tracker rows but the api_gateway usage guard checks
`subscription.plan` first and bypasses the limit check for PRO.

---

## Queue Topology

```
scheduler_service publishes to:

ACCOUNT_CLEANUP_QUEUE
  PURGE_SCHEDULED_DELETIONS_JOB    → CleanupProcessor (in this service)

RECURRING_QUEUE
  CREATE_RECURRING_TRANSACTION     → RecurringProcessor (in this service)

USAGE_TRACKING_QUEUE
  PURGE_USAGE_TRACKING_JOB         → UsageProcessor (in this service)

TOKEN_NOTIFICATION_QUEUE           → notification_service
  RECURRING_TRANSACTIONS_EMAIL_JOB

PAYMENT_QUEUE                      → notification_service
  NEW_USAGE_TRACKERS_CREATED_JOB
```

The scheduler service both publishes and consumes its own cleanup queues.
The notification queues (`TOKEN_NOTIFICATION_QUEUE`, `PAYMENT_QUEUE`) are
consumed by notification_service — they share the same Redis-backed queue names.

---

## Implementation Order

### Step 1 — Recurring Transactions

Build first. This is the most business-critical job — it's what makes
recurring bills and subscriptions actually work in the app.

Deliverable: recurring items with past `nextRunAt` are auto-created as
transactions every hour, and users receive email summaries.

### Step 2 — Usage Tracker Reset

Build second. Required for the usage gate in api_gateway to function correctly
at month boundaries.

Deliverable: free user limits reset on the first of each month.

### Step 3 — Account Cleanup

Build last. The 30-day deletion grace period means there's no urgency here
during early development — no accounts will be pending deletion yet.

Deliverable: accounts scheduled for deletion are hard-deleted nightly.

---

## What to Ignore (Non-Goals)

- **Analytics aggregation job** — the AI-SERVICE.md doc describes this as a
  future scheduler job; it is not yet implemented
- **Scheduled push notifications** — not planned; push is event-driven, not cron
- **Job history / observability UI** — BullMQ Board can be added later as ops tooling
- **Dynamic cron schedules** — all schedules are hardcoded; no admin UI to change them
