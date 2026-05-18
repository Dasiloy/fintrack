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

## Phase 1 — `getTransactionSummary` Endpoint

All dashboard hero data, stat cards, weekly spending chart, and heatmap come from one new endpoint. Follows the exact `getSplitAggregate` pattern across 4 layers.

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

```typescript
async getTransactionSummary(userId: string): Promise<GetTransactionSummaryRes> {
  const now = new Date();
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // ISO week starts Monday
  const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dow);
  startOfWeek.setHours(0, 0, 0, 0);

  const start84 = new Date(now);
  start84.setDate(now.getDate() - 83);
  start84.setHours(0, 0, 0, 0);

  const [allTime, thisMonth, lastMonth, weeklyRaw, heatmapRaw] = await Promise.all([
    this.prisma.transaction.groupBy({
      by: ['type'], where: { userId },
      _sum: { amount: true },
    }),
    this.prisma.transaction.groupBy({
      by: ['type'], where: { userId, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    this.prisma.transaction.groupBy({
      by: ['type'], where: { userId, date: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
    this.prisma.$queryRaw`
      SELECT DATE(date) AS day, SUM(amount) AS total
      FROM "Transaction"
      WHERE "userId" = ${userId} AND type = 'EXPENSE' AND date >= ${startOfWeek}
      GROUP BY DATE(date) ORDER BY day ASC
    `,
    this.prisma.$queryRaw`
      SELECT DATE(date) AS day, SUM(amount) AS total
      FROM "Transaction"
      WHERE "userId" = ${userId} AND type = 'EXPENSE' AND date >= ${start84}
      GROUP BY DATE(date) ORDER BY day ASC
    `,
  ]);

  // Derive allTimeIncome, allTimeExpense, monthly totals, changePct
  // Build weeklySpending (fill missing days with "0"), heatmap (fill missing days)
  // Build monthlySeries for analytics chart (last 12 months groupBy month+type)
  // Return GetTransactionSummaryRes
}
```

Redis cache: 5-minute TTL, invalidate on transaction create/update/delete (same pattern as recurring summary).

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

```typescript
getSummary: protectedProcedure.query(async ({ ctx }) => {
  const response = await fetch(`${GATEWAY_URL}/api/transaction/summary`, {
    headers: gatewayHeaders(ctx.headers),
  });
  if (!response.ok) await throwGatewayError(response);
  const data: StandardResponse<GetTransactionSummaryRes> = await response.json();
  return data;
}),
```

---

## Phase 2 — Dashboard Page

**Rewrite:** `apps/web/src/app/(dashboard)/dashboard/page.tsx`

**New components:** `apps/web/src/app/(dashboard)/dashboard/_components/`

### Visual layout (Vaulto-adapted for fintrack)

```
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
- All data from single `getSummary` call

**`income_expense_chart.tsx`**

- Left chart. Title: "Spending Trend"
- Uses `ChartContainer` + `AreaChart` from `packages/ui/src/components/atoms/chart.tsx`
- Data: `api_client.budget.getSpendingTrend.useQuery({ months: 6 }, { staleTime: 15 * 60 * 1000 })`
- Reuse `formatYAxisTick` from `apps/web/src/app/(dashboard)/finances/budgets/helpers.ts`
- Height: `h-72` (matches existing `SpendingTrendChart` and `GoalProjectionChart`)
- Phase 2: add income series from `monthly_series` in summary when analytics page is built

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
        <IncomeExpenseChart />
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

**Subscription Burden** — single-stat card: "Fixed costs are X% of your monthly income." Formula: `recurring.getSummary.monthlyExpense / transaction.getSummary.monthlyIncome × 100`. Industry callout: < 50% is healthy. Cross-feature: recurring × transactions.

**Goal Funding Rate** — single-stat card: "X% of income went toward goals this month." Formula: `goal.getAggregate.avgMonthlyContribution / transaction.getSummary.monthlyIncome × 100`. On-pace indicator based on total target vs current trajectory. Cross-feature: goals × transactions.

**Export row** (bottom, Pro-gated) — "Export CSV" + "Download PDF" — locked for free users.

### Layout

```
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
│  [Export CSV — Pro]   [PDF Report — Pro]                        │
└──────────────────────────────────────────────────────────────────┘
```

### Pro gating

Free users: time range capped at 6 months server-side (`ANALYTICS_MONTHS_LIMIT: 6`). "All time" button renders with a Pro badge and is disabled. Export buttons locked behind `useProGate(Usage.CSV_EXPORT)`.

---

## Phase 4 — Chat Placeholder

**Create:** `apps/web/src/app/(dashboard)/analytics/chat/page.tsx`

```tsx
import { MessageSquare } from 'lucide-react';
import { Empty } from '@ui/components';

export default function ChatPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Empty
        icon={MessageSquare}
        title="AI Advisor coming soon"
        description="Dasiloy, your personal financial advisor, will be available here soon."
      />
    </div>
  );
}
```

---

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

| File                                                                              | Change               |
| --------------------------------------------------------------------------------- | -------------------- |
| `apps/web/src/app/(dashboard)/dashboard/page.tsx`                                 | Rewrite              |
| `apps/web/src/app/(dashboard)/dashboard/_components/dashboard_hero.tsx`           | New                  |
| `apps/web/src/app/(dashboard)/dashboard/_components/stat_cards.tsx`               | New                  |
| `apps/web/src/app/(dashboard)/dashboard/_components/income_expense_chart.tsx`     | New                  |
| `apps/web/src/app/(dashboard)/dashboard/_components/weekly_spending_chart.tsx`    | New                  |
| `apps/web/src/app/(dashboard)/dashboard/_components/spending_breakdown_card.tsx`  | New                  |
| `apps/web/src/app/(dashboard)/dashboard/_components/spending_heatmap.tsx`         | New                  |
| `apps/web/src/app/(dashboard)/analytics/page.tsx`                                 | Create               |
| `apps/web/src/app/(dashboard)/analytics/_components/health_scorecard.tsx`         | New                  |
| `apps/web/src/app/(dashboard)/analytics/_components/income_expense_chart.tsx`     | New                  |
| `apps/web/src/app/(dashboard)/analytics/_components/savings_rate_chart.tsx`       | New                  |
| `apps/web/src/app/(dashboard)/analytics/_components/subscription_burden_card.tsx` | New                  |
| `apps/web/src/app/(dashboard)/analytics/_components/goal_funding_card.tsx`        | New                  |
| `apps/web/src/app/(dashboard)/analytics/chat/page.tsx`                            | Create (placeholder) |

---

## Verification

1. `pnpm --filter @fintrack/types proto:gen` — no errors, types regenerated
2. `GET /api/transaction/summary` — returns `netBalance`, `monthlyIncome`, `monthlyExpense`, `weeklySpending[7]`, `spendingHeatmap[84]`, `monthlySeries[n]`
3. Dashboard loads with real numbers — no empty cards, charts render, heatmap grid visible
4. Dashboard with zero transactions — all widgets show ₦0 and empty states without crashing
5. Analytics health scorecard — chips reflect actual thresholds, not hardcoded values
6. Analytics time range — "All time" shows Pro badge and is disabled for free user; works for Pro
7. `pnpm --filter web tsc --noEmit` — zero errors
