# Dashboard & Analytics — Implementation Spec

## Architecture Decision

`/dashboard`, `/analytics`, and `/analytics/chat` serve distinct purposes and remain separate routes.

| Route                 | Purpose                                              | Time horizon             |
| --------------------- | ---------------------------------------------------- | ------------------------ |
| `/dashboard`          | "Where do I stand right now?" — operational snapshot | Today / this month       |
| `/analytics/realtime` | "How am I trending?" — cross-feature synthesis       | 3 / 6 / 12 mo / all-time |
| `/analytics/advisor`  | AI financial advisor (deferred — backend not built)  | Conversational           |

**Key constraint:** The analytics page must only contain cross-feature insights that cannot be seen on any individual feature page. Repeating what the budgets, goals, splits, or bills pages already show is zero value.

**Balance definition:** Net balance = sum of all INCOME transactions − sum of all EXPENSE transactions. Not derived from linked bank account balances.

---

## Phase 0 — Materialized Balance Infrastructure

**Do this before anything else.** Constant `SUM(amount) WHERE userId = X` over the full transaction table is O(n) and degrades linearly as users accumulate transactions. The fix is a **materialized running balance**: a single row per user that is atomically incremented/decremented on every transaction mutation. Lookups become O(1).

This is the standard approach used by neobanks and fintech platforms. We use a hybrid:

- `UserBalance` — live, always-current figures (O(1) read)
- `MonthlyBalanceSnapshot` — end-of-month archive for historical analytics series

### 0A — Prisma Schema

**File:** `packages/database/prisma/schema.prisma`

Add two new models:

```prisma
model UserBalance {
  id             String   @id @default(cuid())
  userId         String   @unique
  netBalance     Decimal  @default(0) @db.Decimal(20, 2)
  totalIncome    Decimal  @default(0) @db.Decimal(20, 2)
  totalExpense   Decimal  @default(0) @db.Decimal(20, 2)
  monthlyIncome  Decimal  @default(0) @db.Decimal(20, 2)
  monthlyExpense Decimal  @default(0) @db.Decimal(20, 2)
  monthYear      String   // "YYYY-MM" — which month the monthly counters belong to
  updatedAt      DateTime @updatedAt
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model MonthlyBalanceSnapshot {
  id        String   @id @default(cuid())
  userId    String
  monthYear String   // "YYYY-MM"
  income    Decimal  @db.Decimal(20, 2)
  expense   Decimal  @db.Decimal(20, 2)
  net       Decimal  @db.Decimal(20, 2)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, monthYear])
}
```

Generate and apply migration:

```bash
pnpm --filter @fintrack/database prisma migrate dev --name add_user_balance
```

---

### 0B — Synchronous Balance Update (inside DB transaction)

**Balance updates are NOT queued via BullMQ.** BullMQ is eventually consistent — jobs can lag, fail, or be dropped. A user's balance is a financial figure they trust; it must be immediately correct or not updated at all. The right guarantee is atomicity, not eventual delivery.

**The balance update runs inside the same Prisma `$transaction()` as the transaction mutation itself.** If the balance increment fails, the entire write rolls back. There is no window where a transaction exists but the balance is stale.

BullMQ still handles: activity logs, budget threshold alerts, notifications — all non-financial side effects that are safe to be eventual.

**File:** `apps/finance_service/src/transaction/balance.service.ts` (new helper, injected into `TransactionService`)

The service exposes **two methods** that must be called in a specific order to handle all three transaction date scenarios correctly (past, present, future):

| Scenario             | `netBalance` | Monthly counters | Snapshot               |
| -------------------- | ------------ | ---------------- | ---------------------- |
| Past (Jan in May)    | ✓ updated    | May untouched    | Jan snapshot patched   |
| Present (May in May) | ✓ updated    | May updated      | —                      |
| Future (Aug in May)  | ✓ updated    | May untouched    | Aug caught at rollover |

**Why two methods?** The month rollover step must run BEFORE `tx.transaction.create()` so the initialization raw query doesn't see the current transaction and double-count it. `applyBalanceDelta` runs AFTER the create.

```typescript
// ── Method 1 ─────────────────────────────────────────────────────────────────
// Call BEFORE tx.transaction.create(). Handles month rollover only — no delta.
// Initializes new month counters from a raw bounded query, which catches any
// future-dated transactions entered in prior months.
async ensureCurrentMonth(tx: Prisma.TransactionClient, userId: string) {
  const currentMonthYear = dayjs().format('YYYY-MM');

  const existing = await tx.userBalance.findUnique({
    where: { userId },
    select: { monthYear: true, monthlyIncome: true, monthlyExpense: true },
  });

  if (!existing || existing.monthYear === currentMonthYear) return;

  // Archive the stale month's counters
  await tx.monthlyBalanceSnapshot.upsert({
    where: { userId_monthYear: { userId, monthYear: existing.monthYear } },
    create: {
      userId, monthYear: existing.monthYear,
      income:  existing.monthlyIncome,
      expense: existing.monthlyExpense,
      net:     existing.monthlyIncome.sub(existing.monthlyExpense),
    },
    update: {},  // idempotent — never overwrite
  });

  // Initialize new month counters from existing transactions (catches future-dated entries).
  // Safe to query here because the current transaction hasn't been created yet.
  const monthStart = dayjs().startOf('month').toDate();
  const monthEnd   = dayjs().endOf('month').toDate();
  const totals = await tx.transaction.groupBy({
    by: ['type'],
    where: { userId, date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
  });

  const initIncome  = totals.find(r => r.type === 'INCOME') ?._sum.amount  ?? new Prisma.Decimal(0);
  const initExpense = totals.find(r => r.type === 'EXPENSE')?._sum.amount ?? new Prisma.Decimal(0);

  await tx.userBalance.update({
    where: { userId },
    data: { monthYear: currentMonthYear, monthlyIncome: initIncome, monthlyExpense: initExpense },
  });
}

// ── Method 2 ─────────────────────────────────────────────────────────────────
// Call AFTER tx.transaction.create(). Pure delta — no rollover logic.
// Month is guaranteed current because ensureCurrentMonth ran first.
async applyBalanceDelta(
  tx: Prisma.TransactionClient,
  userId: string,
  type: 'INCOME' | 'EXPENSE',
  amount: Prisma.Decimal,
  operation: 'ADD' | 'REMOVE',
  txDate: Date,
) {
  const currentMonthYear = dayjs().format('YYYY-MM');
  const txMonthYear      = dayjs(txDate).format('YYYY-MM');
  const isIncome    = type === 'INCOME';
  const sign        = operation === 'ADD' ? 1 : -1;
  const delta       = amount.mul(sign);
  const isCurrentMonth  = txMonthYear === currentMonthYear;
  const isPastMonth     = txMonthYear < currentMonthYear;

  await tx.userBalance.upsert({
    where: { userId },
    create: {
      userId, monthYear: currentMonthYear,
      netBalance:    isIncome ? delta : delta.neg(),
      totalIncome:   isIncome ? delta : new Prisma.Decimal(0),
      totalExpense:  isIncome ? new Prisma.Decimal(0) : delta,
      monthlyIncome:  isIncome  && isCurrentMonth ? delta : new Prisma.Decimal(0),
      monthlyExpense: !isIncome && isCurrentMonth ? delta : new Prisma.Decimal(0),
    },
    update: {
      netBalance:  { increment: isIncome ? delta : delta.neg() },
      totalIncome:  isIncome  ? { increment: delta } : undefined,
      totalExpense: !isIncome ? { increment: delta } : undefined,
      ...(isCurrentMonth && isIncome  ? { monthlyIncome:  { increment: delta } } : {}),
      ...(isCurrentMonth && !isIncome ? { monthlyExpense: { increment: delta } } : {}),
    },
  });

  // Past-dated: upsert the historical snapshot so analytics monthly_series stays accurate.
  // Uses upsert (not updateMany) because the snapshot may not exist at all — a user who
  // signed up in March adding a January transaction has no January snapshot row yet.
  // upsert creates it seeded with the delta; subsequent back-dates to the same month
  // will hit the update branch and increment correctly.
  // Uses < not !== to exclude future months — handled by ensureCurrentMonth at rollover.
  if (isPastMonth) {
    const netDelta = isIncome ? delta : delta.neg();
    await tx.monthlyBalanceSnapshot.upsert({
      where: { userId_monthYear: { userId, monthYear: txMonthYear } },
      create: {
        userId,
        monthYear: txMonthYear,
        income:  isIncome  ? delta : new Prisma.Decimal(0),
        expense: !isIncome ? delta : new Prisma.Decimal(0),
        net:     netDelta,
      },
      update: {
        ...(isIncome  ? { income:  { increment: delta } } : {}),
        ...(!isIncome ? { expense: { increment: delta } } : {}),
        net: { increment: netDelta },
      },
    });
  }

  // Future-dated (txMonthYear > currentMonthYear):
  // netBalance and all-time totals are updated above. Monthly counters for that future
  // month are captured when ensureCurrentMonth runs at the start of that month — it
  // queries all existing transactions in range, including this one.
}
```

---

### 0C — Wire Into Transaction Service

**File:** `apps/finance_service/src/transaction/transaction.service.ts`

`ensureCurrentMonth` must be called **before** `tx.transaction.create()` so the rollover raw-init query doesn't see the incoming transaction and double-count it. `applyBalanceDelta` (or `applyBatchBalanceDelta` for bank imports) runs after.

```typescript
// SINGLE CREATE
const created = await this.prisma.$transaction(async (tx) => {
  await this.balanceService.ensureCurrentMonth(tx, userId);
  const row = await tx.transaction.create({ data: payload });
  await this.balanceService.applyBalanceDelta(tx, userId, txType, txAmount, 'ADD', txDate);
  return row;
});
// BullMQ side-effect jobs enqueued AFTER the $transaction commits

// DELETE
const deleted = await this.prisma.$transaction(async (tx) => {
  await this.balanceService.ensureCurrentMonth(tx, userId);
  const row = await tx.transaction.delete({ where: { id } });
  await this.balanceService.applyBalanceDelta(
    tx,
    userId,
    existing.type,
    existing.amount,
    'REMOVE',
    existing.date,
  );
  return row;
});

// UPDATE — remove old delta then add new whenever amount, type, or date changes
const updated = await this.prisma.$transaction(async (tx) => {
  if (financiallyChanged) await this.balanceService.ensureCurrentMonth(tx, userId);
  const row = await tx.transaction.update({ where: { id }, data: payload });
  if (financiallyChanged) {
    await this.balanceService.applyBalanceDelta(
      tx,
      userId,
      existing.type,
      existing.amount,
      'REMOVE',
      existing.date,
    );
    await this.balanceService.applyBalanceDelta(tx, userId, newType, newAmount, 'ADD', newDate);
  }
  return row;
});
```

#### Batch creates (`batchCreateTransactions` — bank import path)

`createMany` with `skipDuplicates` returns only a count, not which records were actually inserted. Calling `applyBalanceDelta` per input item would over-count duplicates and produce O(n) DB round trips for large imports.

The solution is two-pass:

1. **Pre-query** existing `bankTransactionId`s from the input set (one `findMany` outside the transaction).
2. Diff to compute the truly new records (`newItems`).
3. Inside a single `$transaction`: run `createMany` then call `applyBatchBalanceDelta` for `newItems` only.

`applyBatchBalanceDelta` collapses the entire set into:

- **1 upsert** on `UserBalance` (all-time totals + current-month counters accumulated in memory first)
- **1 upsert per distinct past calendar month** in the batch (snapshot patches)

For a typical bank import of 90 transactions across 3 months this is 1 + 3 = 4 DB writes instead of 90 × 2 = 180.

**Trade-off acknowledged:** single writes now cost three DB operations (ensureCurrentMonth read + balance upsert + optional snapshot patch) instead of one. At this scale the overhead is negligible. Correctness is non-negotiable for a financial balance figure.

---

### 0D — Month Rollover Cron (Safety Net Only)

**Files:**

- `apps/scheduler_service/src/processors/balance_rollover.processor.ts` — BullMQ worker
- `apps/scheduler_service/src/scheduler.service.ts` — `@Cron` that enqueues the job

The cron is a **safety net** for users who make zero transactions in a new month (so the write-path rollover in 0B never fires for them). It lives in `scheduler_service`, which owns all cron jobs, following the existing BullMQ processor pattern (`CleanupProcessor`, `RecurringProcessor`, etc.).

The `@Cron('1 0 1 * *')` in `SchedulerService.rolloverBalances()` fires at 00:01 on the first of every month and enqueues a `BALANCE_ROLLOVER_JOB` onto `BALANCE_ROLLOVER_QUEUE`. `BalanceRolloverProcessor` dequeues it and:

1. Queries all `UserBalance` rows where `monthYear !== currentMonth` (catches users inactive for multiple months, not just one)
2. For each stale row, runs a `$transaction` with `Serializable` isolation:
   - Archives the stale month's counters to `MonthlyBalanceSnapshot` (upsert — idempotent)
   - Re-derives new month counters via `transaction.groupBy` (captures future-dated entries; never resets to 0)
   - Updates `UserBalance.monthYear` + monthly counters
3. Processes each user independently — a single failure does not abort the rest
4. Throws after the loop if any users failed (BullMQ will retry the job)

**If the cron fails:** no financial data is corrupted. Active users are already correct (rolled over synchronously in 0B on their next write). Failed runs are safe to retry at any time.

---

### 0E — Backfill Migration for Existing Users

**File:** `packages/database/prisma/scripts/backfill_user_balance.ts` ✓ implemented

Existing users have no `UserBalance` row. This script seeds it by aggregating their historical transactions. Run once on production after deploying the `add_user_balance` migration, before the new balance-aware application code goes live.

```bash
# Run against production (requires DATABASE_URL + DATABASE_CA_CERTIFICATE in env)
pnpm --filter @fintrack/database db:backfill
```

Key design decisions in the script:

**Serializable isolation** — `groupBy` reads inside the `$transaction` use `isolationLevel: Serializable`. Postgres defaults to `ReadCommitted`, which allows non-repeatable reads. During backfill, if a user is actively adding transactions concurrently, `ReadCommitted` could aggregate inconsistent totals. `Serializable` takes a consistent snapshot at transaction start.

**`maxWait: 10_000, timeout: 60_000`** — backfill transactions aggregate N months of history per user, which is slower than normal mutations. Defaults (`maxWait: 2s, timeout: 5s`) would time out on users with long histories.

**Idempotent upserts** — `UserBalance.upsert({ update: {} })` and `MonthlyBalanceSnapshot.upsert({ update: {} })` skip rows that already exist. Safe to re-run if the script is interrupted mid-way.

**All-time aggregation outside the `$transaction`** — the all-time totals and past-month list are read before the transaction opens (plain reads, no write intent). Only the per-month groupBy queries and upserts run inside the transaction, keeping its footprint smaller.

This is the only time a full `SUM(*)` scan per user is acceptable — it is a one-time migration cost, not a query path.

---

### 0F — CI/CD: Production Migration on Main Merge

**File:** `.github/workflows/ci-cd.yml` — new `migrate` job

Two-database strategy:

| Environment     | Database variable | How set                                                                     |
| --------------- | ----------------- | --------------------------------------------------------------------------- |
| Local dev       | `DATABASE_URL`    | `.env` file                                                                 |
| CI quality/test | `DATABASE_URL`    | Placeholder (no real DB needed for type-check)                              |
| Production      | `DATABASE_URL`    | `PROD_DATABASE_URL` GitHub secret → overrides `DATABASE_URL` in migrate job |

On every merge to `main`, the `migrate` job runs `prisma migrate deploy` against the production database using `PROD_DATABASE_URL` and `PROD_DATABASE_CA_CERTIFICATE` secrets. Render's auto-deploy fires at the same time via Git integration.

**Why parallel (not sequential) with Render deploy?** Enforcing strict ordering requires disabling Render's auto-deploy and triggering it via a deploy hook from GitHub Actions after the migrate job completes. This adds complexity. The simpler requirement is: **all migrations must be backwards-compatible** (additive only — new nullable columns, new tables, new indexes). An additive migration applied while old code is still running causes zero breakage. Destructive changes (dropping columns, changing types) use a two-release strategy: deprecate in release N, drop in release N+1.

Required GitHub repository secrets:

- `PROD_DATABASE_URL` — production Postgres connection string
- `PROD_DATABASE_CA_CERTIFICATE` — base64-encoded CA certificate (same format as dev)

---

### Phase 0 — Files Summary

| File                                                                  | Action                                                                  |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/database/prisma/schema.prisma`                              | Add `UserBalance` + `MonthlyBalanceSnapshot` models                     |
| `packages/database/prisma/migrations/`                                | New migration: `add_user_balance`                                       |
| `apps/finance_service/src/transaction/balance.service.ts`             | New — balance bookkeeping: write-path + batch-import methods            |
| `apps/scheduler_service/src/processors/balance_rollover.processor.ts` | New — monthly rollover BullMQ worker (safety net)                       |
| `apps/scheduler_service/src/scheduler.service.ts`                     | Add `rolloverBalances()` @Cron + inject `BALANCE_ROLLOVER_QUEUE`        |
| `apps/scheduler_service/src/scheduler.module.ts`                      | Register `BALANCE_ROLLOVER_QUEUE` + `BalanceRolloverProcessor`          |
| `packages/database/prisma/scripts/backfill_user_balance.ts`           | New — one-time backfill script ✓                                        |
| `packages/database/package.json`                                      | Add `db:backfill` script ✓                                              |
| `.github/workflows/ci-cd.yml`                                         | Add `migrate` job for prod DB on main merge ✓                           |
| `apps/finance_service/src/transaction/transaction.service.ts`         | Wrap create/update/delete in `$transaction` + call both balance methods |
| `apps/finance_service/src/transaction/transaction.module.ts`          | Add `BalanceService` to `providers` array                               |

---

## Phase 1 — `getTransactionSummary` Endpoint

All dashboard hero data, stat cards, weekly spending chart, and heatmap come from one new endpoint. **Phase 0 must be complete first** — this endpoint reads from `UserBalance` and `MonthlyBalanceSnapshot` (O(1) and O(12)) instead of aggregating raw transactions.

### 1A — Proto (`packages/types/proto/finance/`)

**`transaction.proto`** — add two new messages:

```proto
message DailySpending {
  string date   = 1;  // "YYYY-MM-DD"
  string amount = 2;  // decimal string, expense amount only
}

message MonthlyFinancials {
  string month   = 1;  // "YYYY-MM"
  string income  = 2;  // decimal string
  string expense = 3;  // decimal string
}

message GetTransactionSummaryRes {
  string net_balance        = 1;  // all-time income − expense
  string monthly_income     = 2;  // current calendar month INCOME sum
  string monthly_expense    = 3;  // current calendar month EXPENSE sum
  string monthly_net        = 4;  // monthly_income − monthly_expense
  double balance_change_pct = 5;  // ((this_net − last_net) / |last_net|) × 100
  repeated DailySpending    weekly_spending  = 6;  // Mon–Sun this week, 7 items
  repeated DailySpending    spending_heatmap = 7;  // last 84 days (12 weeks × 7)
  repeated MonthlyFinancials monthly_series  = 8;  // for analytics income vs expense chart
}
```

**`finance.proto`** — add inside `FinanceService` block after existing transaction RPCs:

```proto
rpc GetTransactionSummary (google.protobuf.Empty) returns (GetTransactionSummaryRes) {}
```

Regenerate after editing: `pnpm --filter @fintrack/types proto:gen`

---

### 1B — Finance Service (`apps/finance_service/src/transaction/`)

**`transaction.service.ts`** — add `getTransactionSummary(userId: string)`:

Phase 0 delivers `UserBalance` (O(1)) and `MonthlyBalanceSnapshot` (O(12)). This method reads from those tables — no full transaction scan.

The only raw queries remaining are the **weekly** and **heatmap** daily breakdowns, which are bounded by time range (≤ 7 rows and ≤ 84 rows respectively) and do not grow with total transaction count.

```typescript
async getTransactionSummary(userId: string): Promise<GetTransactionSummaryRes> {
  // ISO week start (Monday)
  const now = new Date();
  const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dow);
  startOfWeek.setHours(0, 0, 0, 0);

  const start84 = new Date(now);
  start84.setDate(now.getDate() - 83);
  start84.setHours(0, 0, 0, 0);

  const [balance, snapshots, weeklyRaw, heatmapRaw] = await Promise.all([
    // O(1) — single row from Phase 0 materialized table
    this.prisma.userBalance.findUnique({ where: { userId } }),

    // O(12) — last 12 monthly snapshots for analytics monthly_series
    this.prisma.monthlyBalanceSnapshot.findMany({
      where: { userId },
      orderBy: { monthYear: 'desc' },
      take: 12,
    }),

    // O(≤7) — daily expense totals for this week only
    this.prisma.$queryRaw`
      SELECT DATE(date) AS day, SUM(amount) AS total
      FROM "Transaction"
      WHERE "userId" = ${userId} AND type = 'EXPENSE' AND date >= ${startOfWeek}
      GROUP BY DATE(date) ORDER BY day ASC
    `,

    // O(≤84) — daily expense totals for heatmap (12 weeks)
    this.prisma.$queryRaw`
      SELECT DATE(date) AS day, SUM(amount) AS total
      FROM "Transaction"
      WHERE "userId" = ${userId} AND type = 'EXPENSE' AND date >= ${start84}
      GROUP BY DATE(date) ORDER BY day ASC
    `,
  ]);

  // balance_change_pct:
  //   lastMonthNet = snapshots[0]?.net (most recent archived month)
  //   thisMonthNet = balance.monthlyIncome - balance.monthlyExpense
  //   if |lastMonthNet| === 0 or no snapshots: return 0.0 (avoid division by zero)
  //   else: ((thisMonthNet - lastMonthNet) / |lastMonthNet|) * 100

  // weekly_spending[7]: iterate Mon–Sun of current ISO week, merge raw results by date.
  //   Missing days → DailySpending { date, amount: "0" }. Always exactly 7 items.

  // spending_heatmap[84]: iterate the 84 days from start84 to today, merge raw results.
  //   Missing days → DailySpending { date, amount: "0" }. Always exactly 84 items.

  // monthly_series: reverse snapshots to ascending order, then APPEND current month
  //   { month: currentMonthYear, income: balance.monthlyIncome, expense: balance.monthlyExpense }
  //   so the chart always includes the live running month.
  //   If balance is null (new user, no transactions yet), append zeros.

  // Return GetTransactionSummaryRes
}
```

No Redis cache needed on this endpoint — reads are already O(1)/O(12) from indexed primary key lookups. The `UserBalance` row is always fresh because the balance worker updates it synchronously within the transaction mutation flow.

**`transaction.controller.ts`** — add gRPC handler:

```typescript
@GrpcMethod(FINANCE_SERVICE_NAME, 'GetTransactionSummary')
getTransactionSummary(@RpcUser() user: User): Promise<GetTransactionSummaryRes> {
  return this.transactionService.getTransactionSummary(user.id);
}
```

---

### 1C — API Gateway (`apps/api_gateway/src/transaction/`)

**`transaction.service.ts`**:

```typescript
async getTransactionSummary(user: User): Promise<GetTransactionSummaryRes> {
  const metadata = new Metadata();
  metadata.add('x-user-id', user.id);
  return lastValueFrom(this.financeService.getTransactionSummary({}, metadata));
}
```

**`transaction.controller.ts`** — add BEFORE `@Get(':id')` (specific routes before parameterised):

```typescript
@Get('summary')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Financial summary — balance, cashflow, weekly and heatmap spending' })
async getTransactionSummary(
  @CurrentUser() user: User,
): Promise<StandardResponse<GetTransactionSummaryRes>> {
  const data = await this.transactionService.getTransactionSummary(user);
  return { success: true, message: 'Financial summary retrieved', statusCode: HttpStatus.OK, data };
}
```

---

### 1D — tRPC Router (`packages/trpc_app/src/routers/transaction.ts`)

The `months` input controls how many months of `monthly_series` are returned. Dashboard always passes `undefined` (defaults to 12). Analytics page passes the user's selected range. Free-user cap is enforced server-side.

```typescript
getSummary: protectedProcedure
  .input(z.object({ months: z.number().int().min(1).optional() }).optional())
  .query(async ({ ctx, input }) => {
    const params = new URLSearchParams();
    if (input?.months) params.set('months', String(input.months));

    const response = await fetch(
      `${GATEWAY_URL}/api/transaction/summary?${params.toString()}`,
      { headers: gatewayHeaders(ctx.headers) },
    );
    if (!response.ok) await throwGatewayError(response);
    const data: StandardResponse<GetTransactionSummaryRes> = await response.json();
    return data;
  }),
```

Update the gateway controller, service, and finance service to accept and forward `months` (query param → gRPC field → `take` on the snapshot query). Server-side cap: `Math.min(months ?? 12, isPro ? Infinity : ANALYTICS_MONTHS_LIMIT)` where `ANALYTICS_MONTHS_LIMIT = 6` for free users.

---

## Phase 2 — Dashboard Page

**Rewrite:** `apps/web/src/app/(dashboard)/dashboard/page.tsx`

**New components:** `apps/web/src/app/(dashboard)/dashboard/_components/`

### Visual layout (Vaulto-adapted for fintrack)

```text
┌──────────────────────────────────────────────────────────────────┐
│  HERO — Net Balance  ₦X,XXX,XXX   ▲+X.X% vs last month          │
│  [Income ₦X chip]  [Expense ₦X chip]                             │
│  [+ Add Transaction]  [New Goal]  [View Bills]                   │
├─────────────┬─────────────┬─────────────┬────────────────────────┤
│ Monthly     │ Monthly     │ Net         │ Savings Rate            │
│ Income      │ Expense     │ Cashflow    │ X.X%                    │
├─────────────────────────────┬────────────────────────────────────┤
│ Spending Trend — 6 months   │ This Week                          │
│ Expense area chart          │ Bar chart Mon–Sun, today highlighted│
│ (getSpendingTrend, reused)  │ (weekly_spending from getSummary)  │
├──────────────┬──────────────────────────┬─────────────────────────┤
│ Recent       │ This Month Breakdown     │ Spending Activity       │
│ Activity     │ Top 5 categories as      │ 12-week heatmap grid    │
│ (existing)   │ horizontal bars + %      │ intensity by ₦/day      │
└──────────────┴──────────────────────────┴─────────────────────────┘
```

### Components

**`dashboard_hero.tsx`**

- Data: `api_client.transaction.getSummary.useQuery(undefined, { staleTime: 5 * 60 * 1000 })`
- Primary figure: `netBalance` — large, `tabular-nums`, `font-bold`
- Change badge: `balanceChangePct` with ▲/▼ icon, emerald if positive / rose if negative
- Chips: "Income ₦{monthlyIncome}" (emerald-tinted) + "Expense ₦{monthlyExpense}" (rose-tinted)
- Buttons: `+ Add Transaction` (opens drawer), `New Goal` (link `/planning/goals`), `View Bills` (link `/finances/bills`)
- Skeleton: 3 lines

**`stat_cards.tsx`**

- Grid: `grid-cols-2 md:grid-cols-4`
- Reuse `MetricCard` from `apps/web/src/app/(dashboard)/finances/bills/_components/metric_card.tsx`
- Cards: Monthly Income (TrendingUp, emerald) · Monthly Expense (TrendingDown, rose) · Net Cashflow (ArrowRightLeft, primary — green/red by sign) · Savings Rate % (PiggyBank, amber)
- Savings Rate: `monthlyIncome > 0 ? ((monthlyNet / monthlyIncome) * 100).toFixed(1) + '%' : '—'` — guard against division by zero when income is 0
- All data from single `getSummary` call

**`spending_trend_chart.tsx`** _(dashboard only — expense trend, not income vs expense)_

- Left chart. Title: "Spending Trend"
- Uses `ChartContainer` + `AreaChart` from `packages/ui/src/components/atoms/chart.tsx`
- Data: `api_client.budget.getSpendingTrend.useQuery({ months: 6 }, { staleTime: 15 * 60 * 1000 })`
- Reuse `formatYAxisTick` from `apps/web/src/app/(dashboard)/finances/budgets/helpers.ts`
- Height: `h-72` (matches existing `SpendingTrendChart` and `GoalProjectionChart`)
- The analytics income vs expense chart is a separate component in `analytics/_components/income_expense_chart.tsx`

**`weekly_spending_chart.tsx`**

- Right chart. Title: "This Week" + week range label (e.g. "May 12–18")
- Data: `weeklySpending[7]` from `getSummary`
- Uses `ChartContainer` + `BarChart` + `Bar` from chart.tsx
- Map `date` → "Mon/Tue/…/Sun" labels; `amount` → bar height
- Today highlighted: `fill="var(--color-primary)"` · others: `fill="var(--color-primary)"` at 35% opacity
- `radius={[4, 4, 0, 0]}` on bars; `formatYAxisTick` on Y-axis
- Height: `h-72`

**`spending_breakdown_card.tsx`**

- Middle bottom. Title: "This Month"
- Data: `api_client.budget.getSpendingTrend.useQuery({ months: 1 })` — extract current month `byCategory`
- Top 5 categories as horizontal progress bars with category dot + name + amount + %
- "View budgets →" link at bottom
- Skeleton: 5 rows

**`spending_heatmap.tsx`**

- Bottom right. Title: "Spending Activity"
- Data: `spendingHeatmap[84]` from `getSummary`
- Layout: `grid-cols-12` × 7 rows (12 weeks × 7 days, week = column, day = row, Mon top)
- Cell: `aspect-square rounded-sm`; intensity: `rgba(124, 122, 255, 0.1 + (amount/max) * 0.9)`
- Zero-spend days: `bg-bg-elevated`
- Hover tooltip (Radix `Tooltip`): formatted date + `formatCurrency(amount)`
- Pattern copied from `GoalHealthPanel` contribution heatmap — `apps/web/src/app/(dashboard)/planning/goals/_components/goal_health_panel.tsx`

**Page assembly:**

```tsx
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <DashboardHero />
      <StatCards />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SpendingTrendChart />
        <WeeklySpendingChart />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ActivityFeed />
        <SpendingBreakdownCard />
        <SpendingHeatmap />
      </div>
    </div>
  );
}
```

### staleTime values (matches backend Redis TTLs)

| Query                     | staleTime |
| ------------------------- | --------- |
| `transaction.getSummary`  | 5 min     |
| `budget.getSpendingTrend` | 15 min    |
| `goal.getAggregate`       | 2 min     |
| `recurring.getSummary`    | 5 min     |
| `split.getAggregate`      | 5 min     |

---

## Phase 3 — Analytics Page

**Create:** `apps/web/src/app/(dashboard)/analytics/page.tsx`

**Rule:** Nothing on this page may duplicate what a feature page already shows. Every section must be a cross-feature insight.

### What NOT to include (already on feature pages)

- Spending by category/budget → budgets page
- Goal projection chart + heatmap → goals page
- Split owed/paid breakdown → splits page
- Recurring items list → bills page

### Cross-feature sections (all new)

**Financial Health Scorecard** — 4 chips full-width at the top. Each chip evaluates one cross-feature threshold:

| Chip             | Formula                    | Green | Amber  | Red   |
| ---------------- | -------------------------- | ----- | ------ | ----- |
| Cashflow         | monthlyNet                 | > 0   | = 0    | < 0   |
| Budget adherence | % budgets under threshold  | ≥ 80% | 60–80% | < 60% |
| Goals on pace    | % active goals on track    | ≥ 75% | 50–75% | < 50% |
| Savings rate     | monthlyNet / monthlyIncome | ≥ 20% | 10–20% | < 10% |

**Income vs Expense Monthly Trend** — grouped bar chart per month: income (emerald) vs expense (rose), net savings line overlaid. Data from `monthly_series` in `getSummary`. Selected time range controls how many months are shown.

**Savings Rate Trend** — line chart: `((income − expense) / income) × 100` per month. Flat reference line at 20% (target). This answers "am I getting better at saving?" — not visible anywhere in the app.

**Subscription Burden** — single-stat card: "Fixed costs are X% of your monthly income." Formula: `RecurringAggregateRes.monthlyExpense / GetTransactionSummaryRes.monthlyIncome × 100`. Industry callout: < 50% is healthy. Frontend path: `recurringSummary.data.monthlyExpense` and `summary.data.monthlyIncome` (both are inside `StandardResponse.data`). Cross-feature: recurring × transactions.

**Goal Funding Rate** — single-stat card: "On average, X% of your income goes toward goals." Formula: `GoalsAggregate.avgMonthlyContribution / GetTransactionSummaryRes.monthlyIncome × 100`. `avgMonthlyContribution` is the all-time average monthly contribution across all goals (not this month's figure). Frontend path: `goalAggregate.data.avgMonthlyContribution` and `summary.data.monthlyIncome` (both are inside `StandardResponse.data`). Cross-feature: goals × transactions.

**Export row** (bottom, open to all) — "Export CSV" + "Download PDF" — available to all users; backend enforces the free-user date window silently.

### Layout

```text
┌──────────────────────────────────────────────────────────────────┐
│  Analytics          [3mo]  [6mo]  [12mo]  [All time — Pro]      │
├──────────────────────────────────────────────────────────────────┤
│  Health Scorecard: Cashflow ✓  Budget ✓  Goals ✗  Savings ✓    │
├──────────────────────┬───────────────────────────────────────────┤
│  Income vs Expense   │  Savings Rate Trend                       │
│  Grouped bar/month   │  Line chart %, 20% reference line        │
├──────────────────────┴───────────────────────────────────────────┤
│  Subscription Burden (X% of income)  │  Goal Funding Rate (X%) │
├──────────────────────────────────────┴──────────────────────────┤
│  [Export CSV]   [PDF Report]                                    │
└──────────────────────────────────────────────────────────────────┘
```

### Pro gating

Free users: time range capped at 6 months server-side (`ANALYTICS_MONTHS_LIMIT: 6` from `plan.constants.ts`). "All time" button renders with a Pro badge and is disabled. **Export buttons are NOT gated** — all users can export all document types; the backend silently caps the date window to 120 days for free users.

## Full File Manifest

### Backend

| File                                                             | Change                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| `packages/types/proto/finance/transaction.proto`                 | Add `DailySpending`, `MonthlyFinancials`, `GetTransactionSummaryRes` |
| `packages/types/proto/finance/finance.proto`                     | Add `rpc GetTransactionSummary`                                      |
| `apps/finance_service/src/transaction/transaction.service.ts`    | Add `getTransactionSummary()`                                        |
| `apps/finance_service/src/transaction/transaction.controller.ts` | Add gRPC handler                                                     |
| `apps/api_gateway/src/transaction/transaction.service.ts`        | Add gateway method                                                   |
| `apps/api_gateway/src/transaction/transaction.controller.ts`     | Add `GET /api/transaction/summary`                                   |
| `packages/trpc_app/src/routers/transaction.ts`                   | Add `getSummary` query                                               |

### Frontend

| File                                                                              | Change                                    |
| --------------------------------------------------------------------------------- | ----------------------------------------- |
| `apps/web/src/app/(dashboard)/dashboard/page.tsx`                                 | Rewrite                                   |
| `apps/web/src/app/(dashboard)/dashboard/_components/dashboard_hero.tsx`           | New                                       |
| `apps/web/src/app/(dashboard)/dashboard/_components/stat_cards.tsx`               | New                                       |
| `apps/web/src/app/(dashboard)/dashboard/_components/spending_trend_chart.tsx`     | New — expense-only area chart (dashboard) |
| `apps/web/src/app/(dashboard)/dashboard/_components/weekly_spending_chart.tsx`    | New                                       |
| `apps/web/src/app/(dashboard)/dashboard/_components/spending_breakdown_card.tsx`  | New                                       |
| `apps/web/src/app/(dashboard)/dashboard/_components/spending_heatmap.tsx`         | New                                       |
| `apps/web/src/app/(dashboard)/analytics/page.tsx`                                 | Create                                    |
| `apps/web/src/app/(dashboard)/analytics/_components/health_scorecard.tsx`         | New                                       |
| `apps/web/src/app/(dashboard)/analytics/_components/income_expense_chart.tsx`     | New                                       |
| `apps/web/src/app/(dashboard)/analytics/_components/savings_rate_chart.tsx`       | New                                       |
| `apps/web/src/app/(dashboard)/analytics/_components/subscription_burden_card.tsx` | New                                       |
| `apps/web/src/app/(dashboard)/analytics/_components/goal_funding_card.tsx`        | New                                       |
| `apps/web/src/app/(dashboard)/analytics/chat/page.tsx`                            | Create (placeholder)                      |

---

## Verification

1. `pnpm --filter @fintrack/types proto:gen` — no errors, types regenerated
2. `GET /api/transaction/summary` — returns `netBalance`, `monthlyIncome`, `monthlyExpense`, `weeklySpending[7]`, `spendingHeatmap[84]`, `monthlySeries[n]`
3. Dashboard loads with real numbers — no empty cards, charts render, heatmap grid visible
4. Dashboard with zero transactions — all widgets show ₦0 and empty states without crashing
5. Analytics health scorecard — chips reflect actual thresholds, not hardcoded values
6. Analytics time range — "All time" shows Pro badge and is disabled for free user; works for Pro
7. `pnpm --filter web tsc --noEmit` — zero errors

---

## Phase 4 — Export Center

> **UI: ✅ Built** (`export_center.tsx` + wired into `analytics_client.tsx`)
> **Backend (generation + caching): 🔜 Next sprint**

### Goal

Give users clear, purposeful financial documents — not just raw data dumps. Each export type has a plain-English description of what it contains and why it's useful, so a non-technical user can confidently pick the right one. The Export Center replaces the current two-button "Export CSV / PDF Report" row at the bottom of the analytics page.

All six document types are built in this sprint. All file generation happens server-side (API gateway) so that: (a) XLSX and PDF work consistently regardless of browser, (b) generated files can be cached in Redis and served instantly on repeat requests, and (c) the web bundle stays lean.

---

### 4A — Document taxonomy (all 6 — build now)

All 6 document types are available to **every user**. The only difference between Free and Pro is the date window: free users are capped at 6 months / 120 days server-side (derived from `PLAN_LIMITS.FREE.ANALYTICS_MONTHS_LIMIT = 6` in `plan.constants.ts`). Pro users have no date limit. The FE applies no gate — the backend enforces the cap silently.

| #   | Name                          | What the user gets                                                                                                                                                                                               | Best for                                                                  | Formats   |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------- |
| 1   | **Transaction History**       | Every transaction in the selected time range: date, amount, category, merchant, source. One row per transaction.                                                                                                 | Tax prep, importing into a spreadsheet, reconciling with a bank statement | CSV, XLSX |
| 2   | **Monthly Summary Report**    | A narrative-style document: income vs. expense per month, savings rate trend, health score with plain-English explanation of each metric, biggest spending categories. Reads like a personal finance newsletter. | Monthly reviews, sharing with a financial advisor or partner              | PDF       |
| 3   | **Spending Breakdown**        | The Income Allocation donut and Net Worth trajectory charts rendered as a high-res image you can save or share. Numbers are labelled — no app needed to read it.                                                 | Sharing progress, social media, quick visual snapshot                     | PNG       |
| 4   | **Budget Performance Report** | Each budget category side-by-side with its limit; over/under amounts highlighted in red/green; total utilisation summary.                                                                                        | Reviewing last month before setting next month's budgets                  | PDF, XLSX |
| 5   | **Goal Progress Report**      | All active goals with target amount, saved so far, monthly contribution history, projection data, and on-track status — each explained in plain terms.                                                           | Annual review, sharing goal progress, long-term planning                  | PDF       |
| 6   | **Net Worth Statement**       | Cumulative income minus expenses month by month — a running balance sheet. Includes all-time net balance, trend direction, and a brief interpretation ("you've built ₦X net worth in Y months").                 | Financial milestones, tracking wealth over years                          | PDF, PNG  |

---

### 4B — Architecture: all generation is server-side

Every format is generated in the API gateway. No PDF library, canvas library, or file assembly code ships to the browser.

| Format   | Library (gateway)               | Notes                                                                                                                                                                       |
| -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CSV**  | Native Node string              | No dependency — `Array.join('\r\n')` is sufficient                                                                                                                          |
| **XLSX** | `exceljs`                       | Multi-sheet workbook support; styled headers; runs in Node with no canvas requirement                                                                                       |
| **PDF**  | `@react-pdf/renderer`           | Runs server-side in Node without a browser; produces clean A4 output from JSX-like templates                                                                                |
| **PNG**  | `puppeteer` (headless Chromium) | Screenshots a dedicated internal `/export/preview/:type` Next.js route that renders the charts in isolation; produces pixel-perfect output matching the app's visual design |

#### Caching strategy

Generated files are cached in Redis. Repeat downloads within the TTL return the cached bytes instantly with no re-generation.

**Cache key:** `export:{userId}:{docType}:{format}:{sha256(canonicalParams)}`

**TTL:** `EXPORT_CACHE_TTL_SECONDS` — a compile-time constant defined in `packages/types/src/constants/export.constants.ts` (value: `3600`). Not an env var — the TTL is not environment-specific and should not require an operational knob.

**Storage:** Redis stores the file as a binary buffer. Files above 8 MB are stored in object storage (S3/R2) instead; Redis holds the URL. In practice CSV and XLSX files are well under 1 MB for typical users; PDFs are 100–500 KB.

**Cache invalidation** — invalidate all `export:{userId}:*` keys for a user when any of the following events occur:

| Event                                   | Trigger point                                           |
| --------------------------------------- | ------------------------------------------------------- |
| Transaction created / updated / deleted | After the `$transaction` commit in `TransactionService` |
| Budget created / updated / deleted      | After the write in `BudgetService`                      |
| Goal contribution added / removed       | After the write in `GoalService`                        |
| Recurring item toggled active/inactive  | After the write in `RecurringService`                   |

Invalidation is a synchronous Redis `DEL` pattern call (not a BullMQ job) — it must complete before the API returns so the next export request sees fresh data. The pattern scan is cheap: `SCAN … MATCH export:{userId}:*`.

**User-initiated regeneration** — each export card has a "Regenerate" option (small refresh icon next to the download button). This calls the same mutation with a `force: true` flag, which skips the cache read, generates fresh, and overwrites the cache entry.

#### Preview requirement

Every export must be previewable before (or instead of) an immediate download. The preview flow is:

1. User clicks **"Preview"** on an export card → the `generate` mutation fires normally.
2. The response (base64 payload) is held in component state — **not** automatically downloaded.
3. A **preview sheet** (`ExportPreviewSheet`) opens over the card grid displaying the document inline:
   - **CSV / XLSX** — a styled `<table>` showing the first 20 rows with truncation notice if more rows exist.
   - **PDF** — an `<iframe src="data:application/pdf;base64,…">` filling the sheet height (works in all modern browsers).
   - **PNG** — an `<img src="data:image/png;base64,…">` with `object-fit: contain`.
4. The sheet has a prominent **"Download"** button that calls `downloadFromBase64` (see §4E) immediately — no second network request needed since the buffer is already in state.
5. The sheet also has a small secondary **"Regenerate"** icon button that re-runs the mutation with `force: true` and refreshes the preview in-place.

The preview sheet is a `<Sheet>` (side panel, `side="bottom"`, `h-[80vh]`) so it works on both desktop and mobile. It is the same component for all document types — only the content renderer inside switches by `mimeType`.

---

### 4C — API Gateway — new `export` module

**New files:**

```
apps/api_gateway/src/export/
  export.module.ts
  export.controller.ts
  export.service.ts
  export.cache.service.ts         ← Redis cache read/write/invalidate
  generators/
    csv.generator.ts
    xlsx.generator.ts
    pdf.generator.ts
    image.generator.ts
  dto/
    generate_export.dto.ts
```

**Install in `api_gateway`:**

```bash
pnpm --filter api_gateway add @react-pdf/renderer exceljs puppeteer
```

#### `generate_export.dto.ts`

```typescript
export type ExportDocType =
  | 'transaction-history'
  | 'monthly-summary'
  | 'spending-breakdown'
  | 'budget-performance'
  | 'goal-progress'
  | 'net-worth';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'image';

export class GenerateExportDto {
  @IsIn([
    'transaction-history',
    'monthly-summary',
    'spending-breakdown',
    'budget-performance',
    'goal-progress',
    'net-worth',
  ])
  type: ExportDocType;

  @IsIn(['csv', 'xlsx', 'pdf', 'image'])
  format: ExportFormat;

  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsIn(['INCOME', 'EXPENSE']) txType?: string;
  @IsOptional() @IsInt() @Min(1) @Max(12) months?: number;
  @IsOptional() @IsBoolean() force?: boolean; // bypass cache
}
```

#### `export.controller.ts`

```typescript
@Controller('export')
@UseGuards(AuthGuard)
export class ExportController {
  // --- Section: Generate or return cached export ---
  @Post('generate')
  @HttpCode(200)
  async generate(
    @CurrentUser() user: User,
    @Body() dto: GenerateExportDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.exportService.generate(dto, user);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('X-Export-Cached', String(result.cached));
    res.setHeader('X-Export-Generated-At', result.generatedAt);
    res.send(result.buffer);
  }

  // --- Section: Invalidate user export cache ---
  @Delete('cache')
  @HttpCode(204)
  async invalidateCache(@CurrentUser() user: User): Promise<void> {
    await this.exportCacheService.invalidateUser(user.id);
  }
}
```

#### `export.service.ts` — generation dispatcher

```typescript
async generate(dto: GenerateExportDto, user: User): Promise<ExportResult> {
  // Plan enforcement: all users can export all formats and document types.
  // Free users are silently capped to the last ANALYTICS_MONTHS_LIMIT months (120 days).
  // The FE sends no gate — this is the single enforcement point.
  if (user.plan === 'FREE') {
    const freeDays = PLAN_LIMITS.FREE.ANALYTICS_MONTHS_LIMIT * 20; // 6 months → 120 days
    const cutoff = dayjs().subtract(freeDays, 'days').toISOString();
    dto.startDate = dto.startDate && dto.startDate > cutoff ? dto.startDate : cutoff;
  }

  const cacheKey = this.cacheService.buildKey(user.id, dto);

  if (!dto.force) {
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return { ...cached, cached: true };
  }

  // Fetch required data from finance_service via gRPC (reuse existing service methods)
  const data = await this.fetchDataForType(dto, user);

  // Route to appropriate generator
  const buffer = await this.callGenerator(dto.type, dto.format, data, user);
  const filename = this.buildFilename(dto.type, dto.format);
  const mimeType = MIME_TYPES[dto.format];
  const generatedAt = new Date().toISOString();

  await this.cacheService.set(cacheKey, { buffer, filename, mimeType, generatedAt });
  return { buffer, filename, mimeType, generatedAt, cached: false };
}
```

#### `export.cache.service.ts`

```typescript
async buildKey(userId: string, dto: GenerateExportDto): string {
  const params = { type: dto.type, format: dto.format, startDate: dto.startDate,
                   endDate: dto.endDate, txType: dto.txType, months: dto.months };
  const hash = createHash('sha256').update(JSON.stringify(params)).digest('hex').slice(0, 12);
  return `export:${userId}:${dto.type}:${dto.format}:${hash}`;
}

async invalidateUser(userId: string): Promise<void> {
  // SCAN is non-blocking; safe on production Redis
  const keys = await this.redis.keys(`export:${userId}:*`);
  if (keys.length) await this.redis.del(...keys);
}
```

**MIME type map:**

```typescript
const MIME_TYPES: Record<ExportFormat, string> = {
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
  image: 'image/png',
};
```

#### Register in `app.module.ts`:

```typescript
ExportModule,
```

---

### 4D — Generators

#### `csv.generator.ts`

Plain string construction — no library needed.

```typescript
export function generateTransactionCsv(rows: Transaction[]): Buffer {
  const header = 'Date,Type,Amount,Currency,Category,Merchant,Description,Source';
  const lines = rows.map((tx) =>
    [
      tx.date,
      tx.type,
      tx.amount,
      'NGN',
      tx.category?.name ?? '',
      tx.merchant ?? '',
      tx.description ?? '',
      tx.source,
    ]
      .map(csvEscape)
      .join(','),
  );
  return Buffer.from([header, ...lines].join('\r\n'), 'utf-8');
}
```

For the Budget Performance XLSX variant, a separate `generateBudgetCsv` function follows the same pattern with budget-specific columns.

#### `xlsx.generator.ts`

Uses `exceljs` to produce a styled multi-sheet workbook.

```typescript
import ExcelJS from 'exceljs';

export async function generateTransactionXlsx(rows: Transaction[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FinTrack';
  wb.created = new Date();

  const ws = wb.addWorksheet('Transactions');

  // Header row — bold, primary colour background
  ws.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Amount (₦)', key: 'amount', width: 16 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Merchant', key: 'merchant', width: 24 },
    { header: 'Description', key: 'description', width: 32 },
    { header: 'Source', key: 'source', width: 14 },
  ];

  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C7AFF' } };

  rows.forEach((tx) =>
    ws.addRow({
      date: tx.date,
      type: tx.type,
      amount: parseFloat(tx.amount),
      category: tx.category?.name ?? '',
      merchant: tx.merchant ?? '',
      description: tx.description ?? '',
      source: tx.source,
    }),
  );

  // Conditional formatting: expense rows red-tinted, income rows green-tinted
  ws.addConditionalFormatting({
    ref: `B2:B${rows.length + 1}`,
    rules: [
      {
        type: 'containsText',
        operator: 'containsText',
        text: 'EXPENSE',
        style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '33FF453A' } } },
      },
      {
        type: 'containsText',
        operator: 'containsText',
        text: 'INCOME',
        style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '3330D158' } } },
      },
    ],
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
```

Budget Performance XLSX follows the same pattern with budget-specific columns and a second "Summary" sheet.

#### `pdf.generator.ts`

Uses `@react-pdf/renderer` running server-side in Node. Each document type has its own renderer function.

```typescript
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

// Monthly Summary PDF
export async function generateMonthlySummaryPdf(data: ReportData): Promise<Buffer> {
  return Buffer.from(await renderToBuffer(React.createElement(MonthlySummaryDocument, { data })));
}
```

`MonthlySummaryDocument` is a plain React component (no browser APIs) built with `@react-pdf/renderer` primitives (`Document`, `Page`, `View`, `Text`). It contains:

1. **Cover block** — FinTrack wordmark, "Monthly Financial Summary", period label
2. **Metrics row** — 4 cards: Total Income (green accent), Total Spent (red), Net Saved (purple), Savings Rate (amber)
3. **Health Score section** — plain-English explanation per chip: what the score means and why it matters
4. **Month-by-Month Trend table** — all months in the selected range: Income / Expense / Net / Savings Rate columns
5. **Where Your Money Went** — top 8 categories, each with amount + % of total spending
6. **Footer** — "Generated by FinTrack · [date]"

The same pattern applies to `generateBudgetPerformancePdf`, `generateGoalProgressPdf`, and `generateNetWorthPdf` — each with content specific to its data source.

#### `image.generator.ts`

Uses `puppeteer` to screenshot a dedicated internal chart-render route in the web app. This produces pixel-perfect output that matches the app's visual design exactly.

```typescript
import puppeteer from 'puppeteer';

export async function generateSpendingBreakdownImage(params: {
  userId: string;
  token: string;
  months?: number;
}): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  // The export preview route renders only the chart components in dark mode,
  // no sidebar/header, full-bleed. Auth token passed as query param (short-lived JWT).
  const url = `${WEB_APP_URL}/export/preview/spending-breakdown?token=${params.token}&months=${params.months ?? 6}`;
  await page.goto(url, { waitUntil: 'networkidle0' });

  const buffer = await page.screenshot({ type: 'png', fullPage: false });
  await browser.close();
  return buffer as Buffer;
}
```

The export preview route (`apps/web/src/app/export/preview/[type]/page.tsx`) is a public route gated by a short-lived JWT issued by the gateway specifically for this purpose (valid 60 s, single-use). It renders the relevant chart components using data embedded in the token payload (no additional API call needed).

Net Worth PNG follows the same pattern — `generateNetWorthImage` screenshots `/export/preview/net-worth`.

---

### 4E — tRPC router — new `export` router

**File:** `packages/trpc_app/src/routers/export.ts` (new)

tRPC cannot stream binary. The mutation calls the gateway, receives the file as a base64-encoded payload, and returns it to the client. The client converts to a blob and triggers the browser download — no separate download URL needed.

```typescript
export const exportRouter = router({
  generate: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          'transaction-history',
          'monthly-summary',
          'spending-breakdown',
          'budget-performance',
          'goal-progress',
          'net-worth',
        ]),
        format: z.enum(['csv', 'xlsx', 'pdf', 'image']),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        txType: z.enum(['INCOME', 'EXPENSE']).optional(),
        months: z.number().int().min(1).max(12).optional(),
        force: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/export/generate`, {
        method: 'POST',
        headers: { ...gatewayHeaders(ctx.headers), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) await throwGatewayError(response);

      const buffer = await response.arrayBuffer();
      const filename =
        response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ??
        'fintrack-export';
      const mimeType = response.headers.get('Content-Type') ?? 'application/octet-stream';
      const cached = response.headers.get('X-Export-Cached') === 'true';
      const generatedAt = response.headers.get('X-Export-Generated-At') ?? '';

      return {
        data: Buffer.from(buffer).toString('base64'),
        filename,
        mimeType,
        cached,
        generatedAt,
      };
    }),
});
```

Client-side download trigger — add `downloadFromBase64` to the existing `packages/utils/src/file.ts` (alongside `fileToBase64` and `base64ToBufferingString` that are already used across the app for file uploads):

```typescript
// packages/utils/src/file.ts — append
export function downloadFromBase64(base64: string, filename: string, mimeType: string): void {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

Import in `ExportCenter` and `ExportPreviewSheet` via `import { downloadFromBase64 } from '@fintrack/utils/file'`.

Register `exportRouter` in `packages/trpc_app/src/routers/app.ts`.

---

### 4F — Web app: export preview routes (for PNG generation)

**New route:** `apps/web/src/app/export/preview/[type]/page.tsx`

This is an internal-only Next.js route that puppeteer screenshots. It:

1. Reads a short-lived JWT from `?token=` query param — verifies it server-side (App Router route handler).
2. Extracts data from the token payload (summary data is embedded; no further API calls).
3. Renders the relevant chart components in isolation: dark background (`bg-bg-deep`), no sidebar, no header, fixed `1200 × 630` viewport.
4. The `spending-breakdown` type renders `<IncomeAllocationDonut>` + `<NetWorthChart>` side by side.
5. The `net-worth` type renders `<NetWorthChart>` full width.

This route is excluded from the app's auth middleware (it is token-gated, not session-gated) and is not linked from any navigation.

---

### 4G — UI: Export Center component

**File:** `apps/web/src/app/(dashboard)/analytics/_components/export_center.tsx` (new)

Replaces the existing two-button export row. Sits at the very bottom of the analytics `<main>`.

#### Layout

A glass card with a header bar and a 3-column document card grid (1 column mobile, 2 columns tablet, 3 columns desktop):

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ↓ Export & Download                                                     │
│  Your financial data, in formats built for how you actually use it       │
├──────────────────┬──────────────────────┬───────────────────────────────-┤
│ 📄 Transaction   │ 📊 Monthly Summary   │ 🖼 Spending Snapshot           │
│ History  [Free]  │                [Pro] │                          [Pro] │
│ Every tx with    │ Income, expenses,    │ Income allocation + net worth  │
│ date, amount,    │ health score — all   │ charts as a high-res image,    │
│ category &       │ explained in plain   │ ready to share anywhere.       │
│ merchant.        │ English.             │                                │
│ Format:[CSV][XLS]│ Format:[PDF]         │ Format:[PNG]                   │
│ [↓ Download]     │ [↓ Download]         │ [↓ Download]                   │
├──────────────────┼──────────────────────┼────────────────────────────────┤
│ 📈 Budget        │ 🎯 Goal Progress     │ 💹 Net Worth Statement         │
│ Performance [Pro]│                [Pro] │                          [Pro] │
│ Each budget vs.  │ All goals with       │ Your running balance sheet —   │
│ its limit.       │ saved, target,       │ month by month, with a plain-  │
│ Over/under       │ projections &        │ English interpretation of      │
│ highlighted.     │ on-track status.     │ your wealth-building progress. │
│ Format:[PDF][XLS]│ Format:[PDF]         │ Format:[PDF][PNG]              │
│ [↓ Download]     │ [↓ Download]         │ [↓ Download]                   │
└──────────────────┴──────────────────────┴────────────────────────────────┘
```

#### Per-card anatomy

- **Icon** (Lucide) + **title** (no plan badge — all formats are available to everyone)
- **Description** — 2–3 sentences, plain English, no jargon
- **"Best for:"** — muted subtext line
- **Format selector** — small segmented control showing only formats available for this document; only one format active at a time
- **Cache indicator** — small "cached · generated X min ago" pill shown when `cached === true` from the last response; "Regenerate" refresh icon beside it
- **Action buttons** — two side-by-side full-width buttons:
  - **"Preview"** — generates the export, holds the buffer in state, opens `ExportPreviewSheet`
  - **"Download"** — generates (or re-uses cached) and immediately triggers `downloadFromBase64` without showing the preview sheet
  - Both show a spinner + "Preparing…" while the mutation is in-flight; on error show a red inline message with retry
- Free users see a muted footnote beneath the buttons: `"Date range limited to 6 months on the free plan"` — no lock, no modal, no upgrade prompt in this component.

#### Component types

```typescript
type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'image';
type ExportDocType =
  | 'transaction-history'
  | 'monthly-summary'
  | 'spending-breakdown'
  | 'budget-performance'
  | 'goal-progress'
  | 'net-worth';

interface ExportDoc {
  id: ExportDocType;
  title: string;
  description: string;
  bestFor: string;
  icon: LucideIcon;
  formats: ExportFormat[];
  defaultFormat: ExportFormat;
  // No proOnly — all document types are available to every user.
  // Backend enforces the 120-day date window for free users.
}
```

The six `ExportDoc` definitions live as constants in `export_center.tsx`. The `generate` mutation is called with the current card's `id`, selected `format`, and the analytics page's active `months` / date range.

#### Per-card state

```typescript
interface CardState {
  format: ExportFormat;
  status: 'idle' | 'loading' | 'error';
  cached?: boolean;
  generatedAt?: string;
  // Preview sheet state — held here so re-opening doesn't re-fetch
  previewBase64?: string;
  previewMimeType?: string;
  previewFilename?: string;
  previewOpen?: boolean;
}

const [cardState, setCardState] = React.useState<Record<ExportDocType, CardState>>(() => ({
  'transaction-history': { format: 'csv', status: 'idle' },
  'monthly-summary': { format: 'pdf', status: 'idle' },
  'spending-breakdown': { format: 'image', status: 'idle' },
  'budget-performance': { format: 'pdf', status: 'idle' },
  'goal-progress': { format: 'pdf', status: 'idle' },
  'net-worth': { format: 'pdf', status: 'idle' },
}));
```

The `ExportPreviewSheet` component reads `previewBase64 / previewMimeType` from card state and renders the appropriate inline viewer. The "Download" button inside the sheet calls `downloadFromBase64` from `@fintrack/utils/file` — no second network request.

---

### 4H — Wire into `analytics_client.tsx`

Replace the existing two-button row:

```tsx
{
  /* Old: Export row */
}
<div className="glass-card …">…</div>;
```

With:

```tsx
<ExportCenter months={months} />
```

`months` is the analytics page's active range selector value (3 / 6 / 12 / null for all-time). The Export Center passes it into every `generate` mutation so exports respect the same time window the user is currently viewing. Backend caps this at 120 days for free users regardless of what `months` resolves to.

No `chartsRef` needed — images are generated server-side via puppeteer.
No `isProUser` prop — all gating logic lives in the backend.

---

### 4I — No FE gate on exports

Export buttons carry **no `useProGate` call**. The backend is the single enforcement point for plan limits. Removing the FE gate means:

- No `ProGateModal` triggered by export actions.
- No lock overlays or dimmed cards.
- Free users see an informational footnote (`"Date range limited to 6 months on the free plan"`) — not a paywall.
- `Usage.CSV_EXPORT` and `Usage.PDF_REPORTS` are no longer used in the Export Center. They remain in `plan.constants.ts` for potential future use elsewhere.

---

### Files to create / modify (Phase 4)

| File                                                                          | Action                                                                |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `packages/types/src/constants/export.constants.ts`                            | New — `EXPORT_CACHE_TTL_SECONDS = 3600` constant                      |
| `packages/utils/src/file.ts`                                                  | Add `downloadFromBase64` alongside existing `fileToBase64`            |
| `apps/api_gateway/src/export/export.module.ts`                                | New NestJS module                                                     |
| `apps/api_gateway/src/export/export.controller.ts`                            | `POST /api/export/generate`, `DELETE /api/export/cache`               |
| `apps/api_gateway/src/export/export.service.ts`                               | Generation dispatcher + free-user 120-day cap (no format restriction) |
| `apps/api_gateway/src/export/export.cache.service.ts`                         | Redis cache — uses `EXPORT_CACHE_TTL_SECONDS` constant                |
| `apps/api_gateway/src/export/generators/csv.generator.ts`                     | CSV buffer builder                                                    |
| `apps/api_gateway/src/export/generators/xlsx.generator.ts`                    | `exceljs` workbook builder                                            |
| `apps/api_gateway/src/export/generators/pdf.generator.ts`                     | `@react-pdf/renderer` server-side PDF generation                      |
| `apps/api_gateway/src/export/generators/image.generator.ts`                   | `puppeteer` screenshot of preview route                               |
| `apps/api_gateway/src/export/dto/generate_export.dto.ts`                      | Request DTO                                                           |
| `apps/api_gateway/src/app.module.ts`                                          | Register `ExportModule`                                               |
| `apps/api_gateway/src/transaction/transaction.service.ts`                     | Call `exportCacheService.invalidateUser` after mutations              |
| `apps/api_gateway/src/budget/budget.service.ts`                               | Same — invalidate on budget mutations                                 |
| `apps/api_gateway/src/goal/goal.service.ts`                                   | Same — invalidate on contribution mutations                           |
| `apps/api_gateway/src/recurring/recurring.service.ts`                         | Same — invalidate on toggle mutations                                 |
| `packages/trpc_app/src/routers/export.ts`                                     | New `generate` mutation                                               |
| `packages/trpc_app/src/routers/app.ts`                                        | Add `exportRouter` to root router                                     |
| `apps/web/src/app/export/preview/[type]/page.tsx`                             | Internal puppeteer screenshot target route                            |
| `apps/web/src/app/(dashboard)/analytics/_components/export_center.tsx`        | Export Center — no pro gates, Preview + Download buttons per card     |
| `apps/web/src/app/(dashboard)/analytics/_components/export_preview_sheet.tsx` | New — inline CSV table / PDF iframe / PNG lightbox + Download button  |
| `apps/web/src/app/(dashboard)/analytics/_components/analytics_client.tsx`     | Replace old export row with `<ExportCenter months={months} />`        |

---

### Phase 4 — Verification checklist

1. Free user requests any export format (CSV, PDF, XLSX, PNG) → request succeeds, no 403. Date range is silently capped to 120 days by the gateway.
2. Free user on analytics page with "12mo" range selected → export contains only 120 days of data, card shows `"Date range limited to 6 months on the free plan"` footnote.
3. Pro user requests Transaction History XLSX for full history → no date cap applied; styled workbook with conditional row colouring; Income rows green-tinted, Expense rows red-tinted.
4. **Preview flow** — clicking "Preview" opens `ExportPreviewSheet`:
   - CSV/XLSX → styled table of first 20 rows visible.
   - PDF → `<iframe>` rendering the PDF inline.
   - PNG → `<img>` displaying the chart image.
   - "Download" button in the sheet calls `downloadFromBase64` from `@fintrack/utils/file` — no second request.
5. **Direct download** — clicking "Download" on the card (not via preview) triggers `downloadFromBase64` immediately without opening the sheet.
6. PDF Monthly Summary → A4 PDF with cover block, 4 metric cards, health score section, monthly trend table, category breakdown.
7. PDF Budget Performance → each budget with limit, spent, over/under highlighted; summary sheet in XLSX variant.
8. PDF Goal Progress → all active goals with saved, target, monthly contribution history, on-track badge.
9. PDF Net Worth → cumulative balance sheet table + plain-English trend interpretation.
10. PNG Spending Breakdown → 2× retina PNG with Income Allocation donut + Net Worth chart; dark background matches app theme.
11. Second download of same export within 1 hour → `X-Export-Cached: true` header; response is instant (no regeneration).
12. "Regenerate" icon clicked → `force: true` sent → fresh file generated, cache overwritten, new `generatedAt` shown.
13. Transaction created → subsequent export request produces a fresh file (cache invalidated).
14. No `ProGateModal` triggered anywhere in the Export Center. No lock overlays. No dimmed cards.
15. `EXPORT_CACHE_TTL_SECONDS` is imported from `@fintrack/types/constants/export.constants` — not read from `process.env`.
16. `pnpm --filter web tsc --noEmit` — no errors.

responsiveness
ensure all pdf preview use app theme so they dont appear off in dark mode
production transaction upload from receipt failed
redocument all service and controller methods or export generators or services touched by export invalidations in modules concerned
