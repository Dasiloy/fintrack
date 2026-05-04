# Budget Page — End-to-End Implementation Plan

> Status markers: `[ ]` = pending · `[x]` = done · `[~]` = in-progress

---

## Overview

The budget page sits at `/finances/budgets` and gives users a clear view of their monthly spending
against set budget limits. It has three major sections:

1. **Spending Trend** — line chart of total monthly spending, filterable across 3/6/12 months, with per-category toggle
2. **Budget Cards** — per-category spend/budget ratio with circular progress, CRUD actions, alert threshold indicators
3. **Month Picker** — in-page monthly calendar driving all budget card data (trend chart has its own filter)

---

## Section 1 — Backend: Missing APIs · `[ ]`

The budget proto/service currently only has `CreateBudget`, `UpdateBudget`, `DeleteBudget`.
The page needs four additional capabilities: listing budgets with live spend totals, spending
trend aggregation, a single-budget detail with full history, and budget threshold alert dispatching.

---

### 1a. `GetBudgets` RPC · `[ ]`

**Why it's needed:** The page renders a card for every budget the user owns for the selected
month. Each card needs `spent` (sum of EXPENSE transactions in the period for that category).

**Edge case — unbudgeted spending:** A user may have EXPENSE transactions in categories where
no budget exists. Those categories are invisible if the query only fetches budget rows. The
response must surface them so users know where money is leaking outside their plan.

**Proto changes** — `packages/types/proto/finance/budget.proto`

Add `spent` to the `Budget` message and define the request/response types, including the
`UnbudgetedCategory` message for categories with spend but no budget:

```proto
// Add to Budget message
float spent              = 11;  // current-period spending total
int32 alert_throttle_days = 12; // per-budget throttle window in days (default 3)

message UnbudgetedCategory {
  string category_id = 1;
  string name        = 2;
  string color       = 3;
  string icon        = 4;
  float  spent       = 5;
}

message GetBudgetsReq {
  int32 month = 1;  // 0-indexed
  int32 year  = 2;
}

message GetBudgetsRes {
  repeated Budget             budgets    = 1;
  repeated UnbudgetedCategory unbudgeted = 2;
}
```

**Finance service** — `apps/finance_service/src/budget/budget.service.ts`

Add `getBudgets(userId, req)`. The groupBy query scans **all** EXPENSE categories in the period
(no `categoryId: { in: ... }` filter) — results are then split in memory into budgeted vs.
unbudgeted. This is one query instead of two and also eliminates the separate category lookup
for unbudgeted entries.

**Add `getEndOfPeriod` private helper** to `budget.service.ts` alongside the existing
`getStartOfPeriod` — it does not currently exist. For MONTHLY: `new Date(Date.UTC(y, m + 1, 1) - 1)`.
This same helper is also needed by the alert check in Section 1d.

```typescript
// 1. Fetch all budgets + all period spend in parallel
const anchor = new Date(Date.UTC(req.year, req.month, 1));
const periodStart = this.utilsService.getStartOfPeriod(BudgetPeriod.MONTHLY, anchor);
const periodEnd = this.utilsService.getEndOfPeriod(BudgetPeriod.MONTHLY, periodStart);

const [budgets, allSpend] = await Promise.all([
  prisma.budget.findMany({ where: { userId }, include: { category: true } }),
  prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type: 'EXPENSE', date: { gte: periodStart, lte: periodEnd } },
    _sum: { amount: true },
  }),
]);

// 2. Split spend results in memory — no second DB query
const budgetedIds = new Set(budgets.map((b) => b.categoryId));
const spentMap = new Map(allSpend.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]));

// 3. Budgets with their current spend
const budgetsWithSpend = budgets.map((b) => ({ ...b, spent: spentMap.get(b.categoryId) ?? 0 }));

// 4. Unbudgeted categories — spend exists but no budget row
const unbudgetedSpend = allSpend.filter((r) => !budgetedIds.has(r.categoryId));
const unbudgetedCategories = unbudgetedSpend.length
  ? await prisma.category.findMany({
      where: { id: { in: unbudgetedSpend.map((r) => r.categoryId) } },
    })
  : [];
const unbudgeted = unbudgetedCategories.map((c) => ({
  ...c,
  spent: spentMap.get(c.id) ?? 0,
}));

return { budgets: budgetsWithSpend, unbudgeted };
```

The category lookup for unbudgeted entries is conditional (`unbudgetedSpend.length` guard) — when
everything is budgeted it adds zero DB round-trips.

**Finance service controller** — add `GetBudgets` to `budget.controller.ts`

**Finance service proto block** — `packages/types/proto/finance/finance.proto`

```proto
rpc GetBudgets (GetBudgetsReq) returns (GetBudgetsRes) {}
```

**API Gateway** — `apps/api_gateway/src/budget/`

- Add `GET /api/budget` handler with `?month=&year=` query params
- Add Redis cache-aside in `budget.service.ts` (see Section 11 for cache strategy)
- Update `budget.doc.json` with the new endpoint

Run `pnpm --filter @fintrack/types proto:gen` after all proto changes.

---

### 1b. `GetSpendingTrend` RPC · `[ ]`

**Why it's needed:** The chart aggregates EXPENSE spending per month across N months.
This is analytical data that is expensive to compute on every request — it must be a dedicated
backend endpoint with Redis caching. Computing in the tRPC layer is the wrong place since it
cannot cache across users or invalidate intelligently.

**Proto changes** — `packages/types/proto/finance/budget.proto`

```proto
message SpendingTrendCategory {
  string category_id = 1;
  string name        = 2;
  string color       = 3;
  float  amount      = 4;
}

message SpendingTrendMonth {
  string label = 1;  // "Jan 2026"
  float  total = 2;  // all-category EXPENSE sum
  repeated SpendingTrendCategory by_category = 3;
}

message GetSpendingTrendReq {
  int32 months = 1;  // lookback window: 3, 6, or 12
}

message GetSpendingTrendRes {
  repeated SpendingTrendMonth data = 1;
}
```

**Finance service** — add `getSpendingTrend(userId, req)` to `budget.service.ts`:

- Compute `startDate` = N months ago (start of that month), `endDate` = end of current month
- Fetch all EXPENSE transactions in the range with `prisma.transaction.findMany`
  (Prisma `groupBy` cannot group by a computed month expression — `month` is not a schema field,
  so grouping by `YYYY-MM` must happen in application code, not the query)
- In-memory: reduce transactions into a `Map<'YYYY-MM', Map<categoryId, amount>>`, then flatten
  into `SpendingTrendMonth[]`
- Fill every month in the range with a zero entry first so missing months appear as 0 on the chart
- Include `byCategory` on each month (array of `{ categoryId, name, color, amount }`) by joining
  against the fetched category data

**Finance service proto block**:

```proto
rpc GetSpendingTrend (GetSpendingTrendReq) returns (GetSpendingTrendRes) {}
```

**API Gateway** — `GET /api/budget/trend?months=`

- Add to `budget.controller.ts` and `budget.service.ts`
- **Route ordering critical:** `GET /api/budget/trend` must be declared before `GET /api/budget/:id`
  in the NestJS controller. NestJS matches routes top-to-bottom; if `/:id` comes first, the string
  `"trend"` will be captured as an id param and the trend handler will never be reached.
- Cached in Redis (see Section 11)
- Update `budget.doc.json`

---

### 1c. `GetBudget` (single) with History Snapshot · `[ ]`

**Why it's needed:** When a user opens the edit drawer for a single budget, the FE needs the
full `BudgetHistory[]` to render a timeline showing how the budget limit has changed over time.
The list endpoint (`GetBudgets`) returns lean data without history.

**Proto changes** — `packages/types/proto/finance/budget.proto`

```proto
message BudgetHistoryEntry {
  string id         = 1;
  float  limit      = 2;
  string start_date = 3;
  optional string end_date = 4;
  string created_at = 5;
}

message BudgetDetail {
  Budget budget  = 1;
  repeated BudgetHistoryEntry history = 2;
}

message GetBudgetReq {
  string id = 1;
}
```

**Finance service** — add `getBudget(userId, req)`:

- Fetch budget by id + userId (ownership check)
- Include `budgetHistory` ordered by `startDate ASC`
- Return `BudgetDetail`

**Finance service proto block**:

```proto
rpc GetBudget (GetBudgetReq) returns (BudgetDetail) {}
```

**API Gateway** — `GET /api/budget/:id` with Redis cache (see Section 11)

---

### 1d. Budget Threshold Alert Notifications · `[ ]`

**Why it's needed:** Users need to be alerted when spending breaches `alertThreshold` (default 80%)
or reaches 100% of a budget. The infrastructure (`ANALYTICS_NOTIFICATION_QUEUE`,
`FCM_NOTIFICATION_QUEUE`) is already wired in the finance service — it just needs the
budget-specific check and dispatch.

**New constant** — `packages/types/src/constants/queus.constants.ts`

```typescript
export const BUDGET_ALERT_EMAIL_JOB = 'BUDGET_ALERT_EMAIL'; // reuses TOKEN_NOTIFICATION_QUEUE
```

There is no global `BUDGET_ALERT_THROTTLE_DAYS` constant — the throttle window is stored per
budget in the DB (see Prisma schema change below) so each budget can have its own cadence.

**Job payload interface** — `packages/types/src/interfaces/mail.interface.ts`

Add alongside the existing `RecurringTransactionsEmailPayload`:

```typescript
export interface BudgetAlertItem {
  budgetName: string;
  categoryName: string;
  spent: number;
  limit: number;
  percentage: number;
}

export interface BudgetAlertEmailPayload {
  email: string;
  firstName: string;
  lastName: string;
  budgetIds: string[]; // notification service stamps alertedAt after email is sent
  alerts: BudgetAlertItem[];
}
```

User contact details are resolved **in the finance service** before enqueuing — one `findUnique`
there eliminates a separate DB round-trip in the notification service. This matches the pattern
used by `RecurringTransactionsEmailPayload`.

Budget alert dispatch lives in the **transaction service**, triggered after any EXPENSE
transaction is created or updated.

**Dependency injection note:** `TransactionService` currently injects `ACTIVITY_NOTIFICATION_QUEUE`,
`ANALYTICS_NOTIFICATION_QUEUE`, and `FCM_NOTIFICATION_QUEUE` — but NOT `TOKEN_NOTIFICATION_QUEUE`.
Add `@InjectQueue(TOKEN_NOTIFICATION_QUEUE) private readonly tokenNotificationQueue: Queue` to
`TransactionService` constructor and update `TransactionModule` imports accordingly.

**Prisma schema change — `Budget` model:** Add two fields:

```prisma
alertedAt          DateTime?
alertThrottleDays  Int       @default(3)
```

`alertedAt` tracks when the last alert fired; `alertThrottleDays` is the per-budget minimum gap
between repeat alerts (user-configurable at create/edit time, defaults to 3 days). Run
`prisma migrate dev --name add_budget_alert_fields` after the change.

**Alert throttle logic:** `alertedAt` serves two purposes together:

1. **Period reset** — if `alertedAt < periodStart`, the threshold was crossed in a prior period; treat it as a fresh alert.
2. **Throttle window** — if `alertedAt >= periodStart` but the last alert was more than `BUDGET_ALERT_THROTTLE_DAYS` ago, the budget is still breached and the user should hear about it again.

Combining these: suppress the alert only when `alertedAt` is both within the current period **and** within the throttle window. Outside either condition, the alert re-arms.

```
Timeline example (alertThreshold = 80%, throttle = 3 days):

May  1 — spend crosses 80%          → alert fires  (alertedAt = May 1)
May  2 — another transaction added  → suppressed   (alertedAt within throttle window)
May  4 — another transaction added  → alert fires  (3+ days since May 1)
May  5 — another transaction added  → suppressed   (alertedAt = May 4, within window)
Jun  1 — new period starts          → alert fires  (alertedAt < Jun 1 periodStart)
```

**DB query design:** The `@@unique([userId, categoryId, period])` constraint means at most one
budget per userId + categoryId + period combination. In V1 (MONTHLY only) there is at most 1
budget per category per user. Rather than sequential `await` in a loop, use `Promise.all` so
all aggregate queries run in parallel — this is always correct and handles future multi-period
support without change:

**`getEndOfPeriod` placement:** Because `TransactionService` and `BudgetService` both need this helper,
extract it to the finance service's shared `UtilsService` rather than duplicating it. `TransactionService`
already injects `UtilsService` for other utilities — call `this.utilsService.getEndOfPeriod(...)` here.

**Finance service** — `transaction.service.ts`, after `createTransaction` / `updateTransaction`:

The function accepts an **array** of category IDs (all categories affected in this processing cycle).
This is the key design choice: a single creation run — whether it's one manual transaction or a
batch of 50 imported bank transactions — produces at most **one email per user** listing every
newly-breached budget together. No inbox flooding.

```typescript
private async checkAndDispatchBudgetAlerts(
  userId: string,
  categoryIds: string[],   // all distinct affected categories for this cycle
  referenceDate: Date,
): Promise<void> {
  // ONE query covers all affected categories — no per-category DB round-trips
  const budgets = await this.prismaService.budget.findMany({
    where: { userId, categoryId: { in: categoryIds } },
    include: { category: true },
  });
  if (budgets.length === 0) return;

  // Parallel aggregate queries — one per budget, all in-flight simultaneously
  const results = await Promise.all(
    budgets.map(async (budget) => {
      const periodStart = this.utilsService.getStartOfPeriod(budget.period, referenceDate);
      const periodEnd   = this.utilsService.getEndOfPeriod(budget.period, periodStart);
      const { _sum }    = await this.prismaService.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: 'EXPENSE',
          date: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amount: true },
      });
      return { budget, spent: Number(_sum.amount ?? 0), periodStart };
    }),
  );

  // Collect all fire-eligible budgets — filter in code, not with extra DB queries.
  // Each budget uses its own alertThrottleDays so the cutoff is computed per-budget.
  const newBreaches = results.filter(({ budget, spent, periodStart }) => {
    const ratio          = spent / Number(budget.amount);
    const shouldAlert    = ratio >= budget.alertThreshold;
    const throttleCutoff = new Date(
      referenceDate.getTime() - budget.alertThrottleDays * 86_400_000,
    );
    // Suppress only if alerted within this period AND within this budget's throttle window.
    const suppressed =
      budget.alertedAt !== null &&
      budget.alertedAt >= periodStart &&
      budget.alertedAt >= throttleCutoff;
    return shouldAlert && !suppressed;
  });

  if (newBreaches.length === 0) return;

  // Fetch user contact details once here — eliminates a DB round-trip in the notification service.
  const user = await this.prismaService.user.findUnique({
    where:  { id: userId },
    select: { email: true, firstName: true, lastName: true },
  });
  if (!user) return;

  // Enqueue only — no DB write here.
  // alertedAt is stamped by the notification handler after the email is confirmed sent,
  // so throttle state only advances when the notification actually goes out.
  await this.tokenNotificationQueue.add(BUDGET_ALERT_EMAIL_JOB, {
    email:     user.email,
    firstName: user.firstName,
    lastName:  user.lastName,
    budgetIds: newBreaches.map(({ budget }) => budget.id),
    alerts: newBreaches.map(({ budget, spent }) => ({
      budgetName:   budget.name,
      categoryName: budget.category.name,
      spent,
      limit:        Number(budget.amount),
      percentage:   Math.round((spent / Number(budget.amount)) * 100),
    })),
  } satisfies BudgetAlertEmailPayload);
}
```

**Call sites — two patterns:**

```typescript
// After a single EXPENSE transaction (create or update):
if (transaction.type === 'EXPENSE') {
  await this.checkAndDispatchBudgetAlerts(userId, [transaction.categoryId], transaction.date);
}

// After a Mono bank-sync batch (processBankTransactions or equivalent):
const expenseCategoryIds = [
  ...new Set(savedTransactions.filter((t) => t.type === 'EXPENSE').map((t) => t.categoryId)),
];
if (expenseCategoryIds.length) {
  await this.checkAndDispatchBudgetAlerts(userId, expenseCategoryIds, new Date());
}
```

**Notification service** — `token_notification.pro.ts`

- Add handler for `BUDGET_ALERT_EMAIL_JOB`
- `email`, `firstName`, `lastName` are already in the payload — no user DB lookup needed
- Render `budget_alert.hbs` template and send email
- Also enqueue `FCM_NOTIFICATION_JOB` for push notification
- After successful send: `prisma.budget.updateMany({ where: { id: { in: payload.budgetIds } }, data: { alertedAt: new Date() } })` — this is the only place `alertedAt` is written; throttle state only advances when the email actually goes out

**New email template** — `apps/notification_service/templates/budget_alert.hbs`

See Section 10 for the full template spec. Subject uses the dynamic count:
`"Budget Alert — N budget(s) need attention"`. Template loops over the `alerts` array with
one row per breached budget.

Update all the controlers doc.json for every new routes that was created in this flow

---

## Section 2 — tRPC Router · `[ ]`

**File:** `packages/trpc_app/src/routers/budget.ts`

Add three queries to the existing `budgetRouter`:

### 2a. `getAll` query · `[ ]`

```typescript
getAll: protectedProcedure
  .input(z.object({
    month: z.number().int().min(0).max(11),
    year:  z.number().int().min(2000),
  }))
  .query(async ({ ctx, input }) => {
    const params = new URLSearchParams({ month: String(input.month), year: String(input.year) });
    const response = await fetch(`${GATEWAY_URL}/api/budget?${params}`, {
      headers: gatewayHeaders(ctx.headers),
    });
    if (!response.ok) await throwGatewayError(response);
    const data: StandardResponse<GetBudgetsRes> = await response.json();
    return data;
  }),
```

### 2b. `getSpendingTrend` query · `[ ]`

```typescript
getSpendingTrend: protectedProcedure
  .input(z.object({ months: z.union([z.literal(3), z.literal(6), z.literal(12)]).default(6) }))
  .query(async ({ ctx, input }) => {
    const params = new URLSearchParams({ months: String(input.months) });
    const response = await fetch(`${GATEWAY_URL}/api/budget/trend?${params}`, {
      headers: gatewayHeaders(ctx.headers),
    });
    if (!response.ok) await throwGatewayError(response);
    const data: StandardResponse<GetSpendingTrendRes> = await response.json();
    return data;
  }),
```

Import `GetSpendingTrendRes` from the generated proto types after `proto:gen`. The generated
name matches the proto message name exactly (`GetSpendingTrendRes`), not a shortened alias.

### 2c. `getById` query · `[ ]`

```typescript
getById: protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .query(async ({ ctx, input }) => {
    const response = await fetch(`${GATEWAY_URL}/api/budget/${input.id}`, {
      headers: gatewayHeaders(ctx.headers),
    });
    if (!response.ok) await throwGatewayError(response);
    const data: StandardResponse<BudgetDetail> = await response.json();
    return data;
  }),
```

---

## Section 3 — Chart Component (shadcn + recharts) · `[ ]`

### 3a. Install via shadcn · `[ ]`

Shadcn provides a well-maintained recharts v3 wrapper with design system integration.

**Pre-condition:** `shadcn add chart` requires a `components.json` in the target directory.
Check whether `packages/ui` already has one. If not, initialise shadcn in that package first
(`pnpm dlx shadcn@latest init`) before running the add command, or copy the chart component
manually from the shadcn registry and install recharts directly:

```bash
pnpm --filter @fintrack/ui add recharts@latest
```

Then copy `chart.tsx` from the shadcn source (or run from a directory that already has
`components.json`) into `packages/ui/src/components/atoms/chart.tsx`.

Refer to the `shadcn` skill for the exact initialisation flow if `components.json` is missing.

### 3b. `SpendingTrendChart` component · `[ ]`

**File:** `packages/ui/src/app/(dasgboard/finance/budgets/_components/spending_trend_chart.tsx`

```typescript
interface SpendingTrendChartProps {
  data: SpendingTrendMonth[]; // from proto GetSpendingTrendRes
  mode: 'total' | 'category';
  isLoading?: boolean;
  className?: string;
}
```

**Mode: `total`** — single `<Line>` using `dataKey="total"`. One line across all months showing
the aggregate EXPENSE sum. No legend rendered.

**Mode: `category`** — one `<Line>` per category, each using the category ID as `dataKey`.
Recharts needs flat row objects, so transform `SpendingTrendMonth[]` before passing to the chart:

```typescript
// Transform for recharts — flat row per month
const chartData = data.map((month) => {
  const row: Record<string, string | number> = { label: month.label };
  for (const cat of month.byCategory) {
    row[cat.categoryId] = cat.amount;
  }
  return row;
});

// ChartConfig built dynamically — one entry per category
const chartConfig: ChartConfig = Object.fromEntries(
  (data[0]?.byCategory ?? []).map((cat) => [cat.categoryId, { label: cat.name, color: cat.color }]),
);
```

Render one `<Line>` per unique category ID:

```tsx
{
  mode === 'total' ? (
    <Line dataKey="total" stroke="var(--color-total)" dot={false} strokeWidth={2} />
  ) : (
    Object.keys(chartConfig).map((catId) => (
      <Line
        key={catId}
        dataKey={catId}
        stroke={chartConfig[catId].color}
        dot={false}
        strokeWidth={2}
      />
    ))
  );
}
```

**Legend:** shown only in `category` mode. Use recharts `<Legend>` with a custom renderer that
maps each category ID back to its name and color dot — `chartConfig[id].label` + a small
`inline-block` circle using `chartConfig[id].color`. Hide the legend in `total` mode.

```tsx
{
  mode === 'category' && (
    <Legend
      content={({ payload }) => (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs">
          {payload?.map((entry) => (
            <span key={entry.dataKey} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: entry.color }}
              />
              {chartConfig[entry.dataKey as string]?.label}
            </span>
          ))}
        </div>
      )}
    />
  );
}
```

**Other implementation notes:**

- `XAxis` `dataKey="label"` shows short month labels (`MMM`); `YAxis` formatted as `₦Xk` / `₦Xm`
- `ChartTooltip` with shadcn `ChartTooltipContent` — in category mode the tooltip shows all
  category values for that month, not just the hovered line
- Skeleton state: `animate-pulse` placeholder div matching chart height when `isLoading`
- Mobile: `YAxis` hidden via `hide` prop, `dot` radius reduced; desktop: full labels

Export from `packages/ui/src/components/index.ts`.

---

## Section 4 — MonthPicker Component · `[ ]`

**File:** `packages/ui/src/components/atoms/month_picker.tsx`

react-day-picker v9 has no built-in month-only mode. This is a custom component.
The picker lives **within the page** — not in the top nav or layout.

### Design

```
[ < ]  2026  [ > ]
Jan  Feb  Mar  Apr
May  Jun  Jul  Aug
Sep  Oct  Nov  Dec
```

Active month: filled `bg-primary text-white` pill.
Future months: `opacity-40 cursor-not-allowed`.
Past/current months: `text-text-primary hover:bg-bg-surface-hover`.

### Props

```typescript
interface MonthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxDate?: Date; // default: startOfMonth(new Date())
}
```

Implementation:

- Internal `displayYear` state initialized from `value`
- `<` / `>` arrows navigate years; `>` disabled when `displayYear >= maxDate.getFullYear()`
- Each month button is disabled when `new Date(displayYear, monthIndex, 1) > maxDate` — this
  correctly handles both future years AND months later in the current year (e.g. if today is
  May 2026, Jun–Dec 2026 are all disabled even though the `>` year arrow is also disabled)
- Click on a non-disabled month → `onChange(new Date(displayYear, monthIndex, 1))` → close popover
- Wrap in `AnchoredPopover` (already exported from `@fintrack/ui`)

Export from `packages/ui/src/components/index.ts`.

---

## Section 5 — Page Shell & State · `[ ]`

**File:** `apps/web/src/app/(dashboard)/finances/budgets/page.tsx`

The page is a **Client Component** with all state. The `MonthPicker` is rendered directly
on the page — not inside `BudgetPageHeader` and not in the global top nav or layout shell.

### State

```typescript
const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
const [trendMonths, setTrendMonths] = useState<3 | 6 | 12>(6);
const [trendMode, setTrendMode] = useState<'total' | 'category'>('total');
const [monthPickerOpen, setMonthPickerOpen] = useState(false);
const [createOpen, setCreateOpen] = useState(false);
const [editBudget, setEditBudget] = useState<Budget | null>(null);
const [historyBudgetId, setHistoryBudgetId] = useState<string | null>(null);
```

### Layout

```
┌────────────────────────────────────────────────────────┐
│  Budgets                                     [+ New]   │  ← BudgetPageHeader (title + button)
│  [< May 2026 >]                                        │  ← MonthPicker rendered on page
├────────────────────────────────────────────────────────┤
│  Spending Trend  [Total | By Category]  [3M] [6M] [12M]│
│  ┌──────────────────────────────────────────────────┐  │
│  │  <SpendingTrendChart />                          │  │
│  └──────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ Budget  │  │ Budget  │  │ Budget  │  │ Budget  │  │
│  │  Card   │  │  Card   │  │  Card   │  │  Card   │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
└────────────────────────────────────────────────────────┘
```

The `MonthPicker` drives only the budget cards. The trend chart has its own
`trendMonths` (3/6/12) and `trendMode` (total/by-category) controls.

---

## Section 6 — SSR Streaming Strategy · `[ ]`

**Trade-off for spending trend pre-loading:**

| Approach                                 | Pro                                                                                                         | Con                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Pure client fetch                        | Simple, fine-grained loading states                                                                         | Loading spinner visible on every page visit  |
| Full SSR (`generateMetadata` / RSC page) | Chart data in HTML, no spinner                                                                              | Page shell blocks until trend query resolves |
| **Streaming with `<Suspense>`**          | Chart renders instantly from cache on re-visits; skeleton shown only on first load; page shell never blocks | Slightly more complex component split        |

**Recommended:** Use Next.js Suspense streaming. Wrap `BudgetSpendingTrend` in a `<Suspense>`
with a skeleton fallback. The trend section is an async RSC that fetches trend data server-side
and streams it into the page:

```tsx
// page.tsx (Server Component shell)
export default function BudgetsPage() {
  return (
    <BudgetPageClient
      trendNode={
        <Suspense fallback={<SpendingTrendSkeleton />}>
          <BudgetSpendingTrendServer defaultMonths={6} />
        </Suspense>
      }
    />
  );
}
```

`BudgetPageClient` receives `trendNode: React.ReactNode` as an explicit named prop — not
`children`. This keeps the boundary between the server-rendered node and the client state
explicit and avoids confusion when `BudgetPageClient` renders other children of its own.

The budget cards remain client-side (they depend on the selected month state). Only the
trend section — which uses a fixed lookback window and doesn't depend on `selectedMonth` —
benefits from SSR streaming.

The server component calls `api.budget.getSpendingTrend` via the server-side tRPC caller.
The result is hydrated into a client component via `initialData` prop passed to the hook.

---

## Section 7 — UI Components · `[ ]`

**Directory:** `apps/web/src/app/modules/budget/ui/`

---

### 7a. `BudgetCategoryCard` · `[ ]`

**File:** `apps/web/src/app/(dashboard)/budgets/_components/budget_card.tsx`

```typescript
interface BudgetCategoryCardProps {
  budget: Budget; // includes spent from GetBudgets
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
  onHistory: (id: string) => void; // opens BudgetHistoryDrawer
}
```

Visual structure:

```
┌────────────────────────────────┐
│  [icon] Food & Dining      [.] │  ← category icon, name, kebab menu
│                                │
│     ╭──────╮                   │
│     │  72% │  ← SVG ring       │
│     ╰──────╯                   │
│                                │
│  N36,000 / N50,000             │  ← spent / budget (N = naira sign)
│  N14,000 remaining             │
└────────────────────────────────┘
```

**Circular progress ring:** Built as an SVG using `stroke-dashoffset` on a circle element.
This produces the exact same visual as a circular progress indicator — a colored arc on a
grey track, showing the consumed fraction of the budget. No additional library required.

```tsx
// circumference = 2π × radius
// strokeDashoffset = circumference × (1 − ratio)
const r = 36;
const circumference = 2 * Math.PI * r;
const offset = circumference * (1 - Math.min(ratio, 1));
```

Color thresholds:

- `ratio < alertThreshold` (default 0.8): `stroke-green-500`
- `ratio >= alertThreshold && ratio < 1`: `stroke-amber-500`
- `ratio >= 1`: `stroke-red-500`

**Alert badge:** When `ratio >= alertThreshold`, show a small `TriangleAlert` Lucide icon
in amber alongside the category name in the card header.

**Kebab menu:** `DropdownMenu` from `@fintrack/ui` with:

- "Edit" → `onEdit(budget)`
- "View History" → `onHistory(budget.id)` (opens `BudgetHistoryDrawer`)
- "Delete" → two-step confirm: first click shows "Confirm?" text, second click fires `onDelete`

---

### 7b. `BudgetFormDialog` · `[ ]`

**File:** `apps/web/src/app/modules/budget/ui/budget_form_dialog.tsx`

Used for Create flows.

```typescript
interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget; // undefined = create mode
  selectedMonth: Date;
  prefilledCategoryId?: string; // set when opened from UnbudgetedCategoryCard
}
```

Fields:

- **Name** — text input
- **Category** — select populated from `api.category.getAll`; pre-selected and locked when `prefilledCategoryId` is set
- **Amount** — number input (NGN)
- **Alert threshold** — slider 0–100% (stored as 0–1 float)
- **Alert frequency** — number input labeled "Re-alert every N days" (min 1, max 30, default 3); maps to `alertThrottleDays`

- Create mode: `api.budget.create.useMutation()` → on success, invalidate `api.budget.getAll`
- Edit mode: `api.budget.update.useMutation()` → on success, invalidate `api.budget.getAll` + `api.budget.getById`
- Period is always `MONTHLY` for V1; list all options from prisma schema but lets make sure to disable those other options

---

### 7f. `UnbudgetedCategoryCard` · `[ ]`

**File:** `apps/web/src/app/modules/budget/ui/unbudgeted_category_card.tsx`

Simpler read-only card shown below the budget grid when the user has EXPENSE transactions in
a category with no budget set. Signals the gap and prompts action.

```typescript
interface UnbudgetedCategoryCardProps {
  category: UnbudgetedCategory; // from proto GetBudgetsRes
  onSetBudget: (categoryId: string) => void;
}
```

Visual structure:

```
┌────────────────────────────────┐
│  [icon] Transport          [+] │  ← category icon, name, set-budget CTA
│                                │
│  ₦12,400 spent this month      │
│  No budget set                 │
└────────────────────────────────┘
```

- Muted/ghost variant of `BudgetCategoryCard` — dashed border or reduced opacity to visually
  distinguish it from cards that have an active budget
- `[+]` button calls `onSetBudget(category.categoryId)` → opens `BudgetFormDialog` with
  `prefilledCategoryId` set, category field pre-selected and locked

---

### 7c. `BudgetSpendingTrend` · `[ ]`

**File:** `apps/web/src/app/modules/budget/ui/budget_spending_trend.tsx`

Section component wrapping `SpendingTrendChart` with filter controls.

```typescript
interface BudgetSpendingTrendProps {
  months: 3 | 6 | 12;
  mode: 'total' | 'category';
  onMonthsChange: (months: 3 | 6 | 12) => void;
  onModeChange: (mode: 'total' | 'category') => void;
  initialData?: GetSpendingTrendRes; // from SSR; passed as initialData to hook
}
```

Internally calls `api.budget.getSpendingTrend.useQuery({ months }, { initialData })`.

Header row layout: `"Spending Trend"` on the left; mode toggle (`Total | By Category`) and
window pills (`3M 6M 12M`) on the right.

---

### 7d. `BudgetPageHeader` · `[ ]`

**File:** `apps/web/src/app/modules/budget/ui/budget_page_header.tsx`

```typescript
interface BudgetPageHeaderProps {
  onNewBudget: VoidFunction;
}
```

Renders: page title ("Budgets") and the "+ New Budget" CTA button. Does not own the
`MonthPicker` — that is rendered separately on the page, directly below the header row.

---

### 7e. `BudgetHistoryDrawer` · `[ ]`

**File:** `apps/web/src/app/modules/budget/ui/budget_history_drawer.tsx`

Opens when the user selects "View History" from the kebab menu on a budget card. Fetches the
full `BudgetDetail` (budget + history snapshot) via `api.budget.getById`.

```typescript
interface BudgetHistoryDrawerProps {
  budgetId: string | null;
  onOpenChange: (open: boolean) => void;
}
```

**Timeline rendering:**

```
Budget: Food & Dining (MONTHLY)

 ─── Jan 2026 ──────────────────
     ₦30,000 / month
     (3 months · ended Apr 2026)

 ─── Apr 2026 ──────────────────
     ₦50,000 / month
     (current · ongoing)
```

Each `BudgetHistoryEntry` maps to one timeline item. The most recent entry (where `endDate`
is null) is labelled "current". Entries are sorted oldest → newest.

Implementation: use a vertical `<ol>` with a left-border pseudo-element for the timeline line.
Use `vaul` `Drawer` (already in `@fintrack/ui`) for the sheet/drawer wrapper.

---

## Section 8 — Budget Page Assembly · `[ ]`

**File:** `apps/web/src/app/(dashboard)/finances/budgets/page.tsx`

```tsx
// Server Component shell — enables Suspense streaming for trend chart
export default function BudgetsPage() {
  return (
    <BudgetPageClient
      trendNode={
        <Suspense fallback={<SpendingTrendSkeleton />}>
          <BudgetSpendingTrendServer defaultMonths={6} />
        </Suspense>
      }
    />
  );
}
```

```tsx
// BudgetPageClient — all interactive state
'use client';
export function BudgetPageClient({ trendNode }: { trendNode: React.ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [trendMonths, setTrendMonths] = useState<3 | 6 | 12>(6);
  const [trendMode, setTrendMode] = useState<'total' | 'category'>('total');
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [prefilledCategoryId, setPrefilledCategoryId] = useState<string | null>(null);

  const { data, isLoading } = api.budget.getAll.useQuery({
    month: selectedMonth.getMonth(),
    year: selectedMonth.getFullYear(),
  });
  const budgets = data?.data?.budgets ?? [];
  const unbudgeted = data?.data?.unbudgeted ?? [];

  const deleteMutation = api.budget.delete.useMutation({
    onSuccess: () => utils.budget.getAll.invalidate(),
  });

  return (
    <div className="...">
      <BudgetPageHeader onNewBudget={() => setCreateOpen(true)} />

      <MonthPicker
        value={selectedMonth}
        onChange={setSelectedMonth}
        open={monthPickerOpen}
        onOpenChange={setMonthPickerOpen}
      />

      {trendNode}

      {/* Budgeted categories */}
      <section>
        {isLoading ? (
          <BudgetCardSkeleton count={4} />
        ) : budgets.length === 0 && unbudgeted.length === 0 ? (
          <BudgetEmptyState onNew={() => setCreateOpen(true)} />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {budgets.map((b) => (
              <BudgetCategoryCard
                key={b.id}
                budget={b}
                onEdit={setEditBudget}
                onDelete={(id) => deleteMutation.mutate({ id })}
                onHistory={setHistoryId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Unbudgeted spending — categories with spend but no budget set */}
      {!isLoading && unbudgeted.length > 0 && (
        <section>
          <h3 className="...">Unbudgeted Spending</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {unbudgeted.map((c) => (
              <UnbudgetedCategoryCard
                key={c.categoryId}
                category={c}
                onSetBudget={(categoryId) => {
                  setPrefilledCategoryId(categoryId);
                  setCreateOpen(true);
                }}
              />
            ))}
          </div>
        </section>
      )}

      <BudgetFormDialog
        open={createOpen || !!editBudget}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) {
            setEditBudget(null);
            setPrefilledCategoryId(null);
          }
        }}
        budget={editBudget ?? undefined}
        selectedMonth={selectedMonth}
        prefilledCategoryId={prefilledCategoryId ?? undefined}
      />

      <BudgetHistoryDrawer
        budgetId={historyId}
        onOpenChange={(o) => {
          if (!o) setHistoryId(null);
        }}
      />
    </div>
  );
}
```

---

## Section 9 — Empty & Loading States · `[ ]`

### 9a. `BudgetCardSkeleton` · `[ ]`

Pulse placeholders matching the card dimensions. Props: `count: number`.
Each skeleton has the same border, rounded corners, and height as `BudgetCategoryCard`.

### 9b. `SpendingTrendSkeleton` · `[ ]`

Pulse placeholder for the chart section — matching the chart container height with
`animate-pulse` bars at varying heights to hint at the chart shape.

### 9c. `BudgetEmptyState` · `[ ]`

Centered message: "No budgets for {month name}." + "+ Create your first budget" button.
Shown when `budgets.length === 0 && !isLoading`.

---

## Section 10 — Budget Alert Email Template · `[ ]`

**File:** `apps/notification_service/templates/budget_alert.hbs`

The notification service handler receives `{ userId, alerts: AlertItem[] }` where each
`AlertItem` is `{ budgetName, categoryName, spent, limit, percentage }`. Fetch the user's
`firstName` / `email` via `prisma.user.findUnique` before rendering the template.

Subject line (dynamic count): `Budget Alert — {{alerts.length}} budget{{#if (gt alerts.length 1)}}s need{{else}} needs{{/if}} attention`

Template structure (matches existing email design system — same styles as `recurring_transactions.hbs`):

- Header: logo + "Budget Alert" title + subtitle "One or more of your budgets has reached the alert threshold."
- Greeting: `Hi {{firstName}},`
- Intro sentence: `The following {{alerts.length}} budget{{#if (gt alerts.length 1)}}s have{{else}} has{{/if}} reached or exceeded your alert threshold:`
- `{{#each alerts}}` loop — one row per breach:
  - Category name + budget name
  - Spent (₦) / limit (₦)
  - Colored percentage bar (`width: {{this.percentage}}%`; amber when `percentage < 100`, red when `>= 100`)
  - Percentage label
- CTA: "View Budgets" button linking to `https://www.fintrack.live/finances/budgets`
- Footer: standard legal + support links

Use the same `transaction-list` / `transaction-item` row pattern from `recurring_transactions.hbs`
so rows are visually consistent across both alert emails.

---

## Section 11 — Caching Strategy · `[ ]`

All caching lives in the **API Gateway** using the existing `ioredis` `REDIS_CLIENT` injection
pattern (same as `usage.service.ts`, `user.service.ts`, and `app.service.ts`).

New cache key constants to add to `packages/types/src/constants/redis.costants.ts`:

```typescript
export const BUDGET_LIST_CACHE_PREFIX = 'budget_list'; // budget_list:{userId}:{YYYY-MM}
export const BUDGET_LIST_CACHE_TTL = 300; // 5 minutes

export const BUDGET_TREND_CACHE_PREFIX = 'budget_trend'; // budget_trend:{userId}:{months}
export const BUDGET_TREND_CACHE_TTL = 900; // 15 minutes

export const BUDGET_ONE_CACHE_PREFIX = 'budget_one'; // budget_one:{budgetId}
export const BUDGET_ONE_CACHE_TTL = 300; // 5 minutes
```

### What to cache

| Endpoint                       | Cache key                        | TTL    | Why                                             |
| ------------------------------ | -------------------------------- | ------ | ----------------------------------------------- |
| `GET /api/budget?month&year`   | `budget_list:{userId}:{YYYY-MM}` | 5 min  | groupBy query; called on every page view        |
| `GET /api/budget/trend?months` | `budget_trend:{userId}:{months}` | 15 min | Heaviest query; data changes rarely mid-session |
| `GET /api/budget/:id`          | `budget_one:{id}`                | 5 min  | Includes history joins; opened via drawer       |

### What NOT to cache

- `POST /api/budget`, `PATCH /api/budget/:id`, `DELETE /api/budget/:id` — mutations always fresh
- Category list — already cached separately
- User profile — already cached separately

### Cache invalidation

Invalidate in the **API Gateway** budget service on each mutation, using `SCAN` + `DEL`
(acceptable for a personal finance app with small key counts per user):

| Trigger             | Keys to invalidate                                                     |
| ------------------- | ---------------------------------------------------------------------- |
| `createBudget`      | `budget_list:{userId}:*`, `budget_trend:{userId}:*`                    |
| `updateBudget`      | `budget_list:{userId}:*`, `budget_trend:{userId}:*`, `budget_one:{id}` |
| `deleteBudget`      | `budget_list:{userId}:*`, `budget_trend:{userId}:*`, `budget_one:{id}` |
| `createTransaction` | `budget_list:{userId}:*`, `budget_trend:{userId}:*`                    |
| `updateTransaction` | `budget_list:{userId}:*`, `budget_trend:{userId}:*`                    |
| `deleteTransaction` | `budget_list:{userId}:*`, `budget_trend:{userId}:*`                    |

Transaction mutations already go through the API gateway. Add cache invalidation calls
to `transaction.service.ts` in the gateway alongside the existing gRPC forwarding.

Pattern for invalidation (matches existing `usage.service.ts`):

```typescript
// Invalidate all budget list keys for a user (any month)
const keys = await this.redis.keys(`${BUDGET_LIST_CACHE_PREFIX}:${userId}:*`);
if (keys.length) await this.redis.del(...keys);
```

---

## Implementation Order

Execute in this sequence to avoid type errors blocking builds:

1. `[ ]` Prisma: add `alertedAt DateTime?` + `alertThrottleDays Int @default(3)` to `Budget` model → `prisma migrate dev --name add_budget_alert_fields`
2. `[ ]` Shared helper: add `getEndOfPeriod` to `UtilsService` in finance service (MONTHLY: `new Date(Date.UTC(y, m + 1, 1) - 1)`)
3. `[ ]` New constants: `BUDGET_ALERT_EMAIL_JOB` + `BUDGET_ALERT_THROTTLE_DAYS = 3` in `queus.constants.ts`; add `BudgetAlertItem` + `BudgetAlertEmailPayload` interfaces to `mail.interface.ts`
4. `[ ]` New Redis cache constants: `BUDGET_LIST_CACHE_PREFIX/TTL`, `BUDGET_TREND_CACHE_PREFIX/TTL`, `BUDGET_ONE_CACHE_PREFIX/TTL` in `redis.costants.ts`
5. `[ ]` Proto changes: add Section 1a + 1b + 1c messages to `budget.proto` and RPCs to `finance.proto` → `pnpm --filter @fintrack/types proto:gen`
6. `[ ]` Finance service: implement `getBudgets` (batched groupBy) in `budget.service.ts`
7. `[ ]` Finance service: implement `getSpendingTrend` (findMany + in-memory grouping) in `budget.service.ts`
8. `[ ]` Finance service: implement `getBudget` (single + history) in `budget.service.ts`
9. `[ ]` Finance service: wire `GetBudgets`, `GetSpendingTrend`, `GetBudget` handlers in `budget.controller.ts`
10. `[ ]` Finance service: add `checkAndDispatchBudgetAlerts(userId, categoryIds[], referenceDate)` to `transaction.service.ts`; inject `TOKEN_NOTIFICATION_QUEUE`; update `TransactionModule`
11. `[ ]` Finance service: call `checkAndDispatchBudgetAlerts` after `createTransaction` + `updateTransaction` (EXPENSE guard); call with array for Mono batch sync
12. `[ ]` API Gateway: add `GET /api/budget` (budget list), `GET /api/budget/trend` (must be above `:id`), `GET /api/budget/:id` endpoints with Redis cache-aside
13. `[ ]` API Gateway: add `budget_list` + `budget_trend` cache invalidation to `transaction.service.ts` on create/update/delete
14. `[ ]` API Gateway: update `budget.doc.json` for all three new GET endpoints
15. `[ ]` tRPC router: add `getAll`, `getSpendingTrend`, `getById` queries to `budgetRouter`
16. `[ ]` shadcn chart: verify `components.json` in `packages/ui` → install recharts + copy `chart.tsx`
17. `[ ]` `SpendingTrendChart` component — total + category modes (Section 3b)
18. `[ ]` `MonthPicker` component — custom, no react-day-picker month mode (Section 4)
19. `[ ]` Module server hooks: `useBudgets`, `useBudgetSpendingTrend`, `useGetBudget`
20. `[ ]` UI components (Section 7): `BudgetCategoryCard` → `UnbudgetedCategoryCard` → `BudgetFormDialog` (with `prefilledCategoryId`) → `BudgetSpendingTrend` → `BudgetPageHeader` → `BudgetHistoryDrawer`
21. `[ ]` Empty + loading states: `BudgetCardSkeleton`, `SpendingTrendSkeleton`, `BudgetEmptyState` (Section 9)
22. `[ ]` SSR streaming: `BudgetSpendingTrendServer` async RSC + `page.tsx` Suspense shell (Section 6)
23. `[ ]` Page assembly: `BudgetPageClient` with all state + layout (Section 8)
24. `[ ]` Budget alert email template `budget_alert.hbs` — `{{#each alerts}}` array format (Section 10)
25. `[ ]` Notification service: `BUDGET_ALERT_EMAIL_JOB` handler in `token_notification.pro.ts` (receives `alerts` array, fetches user, renders template)
26. `[ ]` Nav link check (Section 12)

---

## Out of Scope for V1

- `carryOver` budget logic (DB column exists, UI + backend logic deferred)
