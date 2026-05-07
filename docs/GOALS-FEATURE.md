# Goals Feature — End-to-End Implementation Plan

## Context

The Goals module exists end-to-end in the backend (Prisma models, gRPC service, API gateway, tRPC router) but has **zero frontend**. This plan covers everything needed to ship a complete Goals page matching the provided design spec:

- Goal cards with mini contribution history charts
- Savings Projection area chart (aggregate, linear trajectory)
- Savings Health panel with a **full streak tracking system** (Udemy-style, monthly unit)
- Form dialog (create) + Drawer sidebar (detail / edit / status management / add funds)
- Activity log support (no FCM notifications — goals already only enqueue to `ACTIVITY_NOTIFICATION_QUEUE`)
- Aggregate endpoint for health metrics

Decisions locked in:
- Contribution history added to list endpoint (batch groupBy)
- Linear projection (contributed today → targetAmount at targetDate)
- ON_HOLD + CANCELLED added to schema (migration required)
- Proto typo `statsu → status` fixed
- Status change via dropdown in drawer (manual ACTIVE/ON_HOLD/CANCELLED; COMPLETED = auto-only)
- Add Funds: amount + date by default, optional "Link transaction" toggle
- Projection: aggregate single combined line
- Streak: consecutive months (any goal) with at least one contribution; full Udemy-style display

---

## What Already Exists (Do Not Rebuild)

Before touching any code, note what is fully implemented in the current backend:

### Database
- `Goal` table: `id`, `name`, `targetAmount`, `targetDate`, `priority` (LOW/MEDIUM/HIGH), `status` (ACTIVE/COMPLETED/ON_HOLD/CANCELLED), `description`, `userId`, timestamps
- `GoalContribution` table: `id`, `goalId`, `amount`, `date`, `description`, `notes`, `transactionId` (optional link to an INCOME transaction), timestamps
- `Goalstatus` enum already includes `ON_HOLD` and `CANCELLED`

### Proto (`packages/types/proto/finance/goal.proto`)
- `Goal` message with all fields including `status` (field 6, correct spelling) and `monthly_contributions` (field 12)
- `MonthlyContributionSummary` message
- `Contribution` message (represents a single `GoalContribution` row)
- `UpdateGoalStatusReq` message
- All CRUD request/response messages

### Finance Service (`apps/finance_service/src/goal/`)
- `createGoal`, `getGoals`, `getGoal`, `updateGoal`, `deleteGoal`
- `contributeToGoal`, `updateGoalContribution`, `deleteContribution`
- Contribution overflow guard (running sum cannot exceed `targetAmount`)
- Auto-complete: when a contribution pushes the sum to `targetAmount`, goal status is auto-set to `COMPLETED`
- `callEvents` called on every mutation → emits to `ACTIVITY_NOTIFICATION_QUEUE`

### API Gateway (`apps/api_gateway/src/goal/`)
- `GET /api/goal` — list goals (filters: status, priority, amount operator)
- `POST /api/goal/create` — create goal
- `GET /api/goal/:id` — get single goal
- `PATCH /api/goal/:id` — update goal fields
- `DELETE /api/goal/:id` — delete goal
- `POST /api/goal/:goalId/contribution` — add contribution
- `PATCH /api/goal/:goalId/contribution/:contributionId` — update contribution
- `DELETE /api/goal/:goalId/contribution/:contributionId` — delete contribution

### tRPC Router (`packages/trpc_app/src/routers/goal.ts`)
- `goal.getAll`, `goal.getById`, `goal.create`, `goal.update`, `goal.delete`
- `goal.createContribution`, `goal.updateContribution`, `goal.deleteContribution`

### TypeScript types (`packages/types/src/protos/finance/goal.ts`)
- All existing interfaces — **except `Goal.status` has a typo on line 29: `statsu` instead of `status`**

---

## Layer 1 — Database (Schema Migration)

**Status: ✅ Already done** — `ON_HOLD` and `CANCELLED` are present in the `Goalstatus` enum in `packages/database/prisma/schema.prisma`. No migration needed.

---

## Layer 2 — Proto & Generated Types

### 2a. Proto file — `packages/types/proto/finance/goal.proto`

**Already exists (no changes needed):**
- `MonthlyContributionSummary` message
- `Goal.monthly_contributions` field (field 12)
- `UpdateGoalStatusReq` message
- `Goal.status` field (field 6) — the proto is correct; the typo is only in the TypeScript types

**Add (still needed):**
```proto
message ProjectionPoint {
  string month = 1;   // "YYYY-MM"
  float amount = 2;
  bool is_projected = 3;
}

message GoalHealthData {
  float total_saved = 1;
  float total_target = 2;
  float overall_percent = 3;
  int32 on_track_count = 4;
  int32 active_count = 5;
  int32 completed_count = 6;
  int32 on_hold_count = 7;
  float avg_monthly_contribution = 8;
  int32 streak_months = 9;
  repeated MonthlyContributionSummary contribution_heatmap = 10;
  repeated ProjectionPoint projection_data = 11;
}
```

Add new RPC methods to the `FinanceService` service block:
```proto
rpc updateGoalStatus (UpdateGoalStatusReq) returns (Goal);
rpc getGoalsAggregate (Empty) returns (GoalHealthData);
```

### 2b. TypeScript types — `packages/types/src/protos/finance/goal.ts`

**Fix typo (line 29):** `statsu: string` → `status: string` in the `Goal` interface.

**Add new interfaces:**
```typescript
export interface ProjectionPoint {
  month: string;
  amount: number;
  isProjected: boolean;
}

export interface GoalHealthData {
  totalSaved: number;
  totalTarget: number;
  overallPercent: number;
  onTrackCount: number;
  activeCount: number;
  completedCount: number;
  onHoldCount: number;
  avgMonthlyContribution: number;
  streakMonths: number;
  contributionHeatmap: MonthlyContributionSummary[];
  projectionData: ProjectionPoint[];
}
```

Also add `UpdateGoalStatusReq` interface if not yet present.

### 2c. Finance interface — `packages/types/src/interfaces/finance.ts`

Add `updateGoalStatus` and `getGoalsAggregate` to `FinanceServiceClient`, `FinanceServiceController`, and the `grpcMethods` array.

---

## Layer 3 — Finance Service

**File:** `apps/finance_service/src/goal/goal.service.ts`

### 3a. Fix `statsu → status` in `formatGoal`
```typescript
status: goal.status,  // was: statsu: goal.status
```

### 3b. `getGoals` — add monthly contributions batch (last 6 months, DB-level grouping)
After the existing `contributedAmount` groupBy, use a raw SQL query so grouping and summing happen in the database — not in application memory:

```typescript
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0, 0, 0, 0);

type MonthlyRow = { goalId: string; month: string; total: number };
const monthlyRows: MonthlyRow[] = goalIds.length
  ? await this.prismaService.$queryRaw`
      SELECT "goalId",
             TO_CHAR("date", 'YYYY-MM') AS month,
             SUM(amount)::float         AS total
      FROM   "GoalContribution"
      WHERE  "goalId" = ANY(${goalIds}::text[])
        AND  "date" >= ${sixMonthsAgo}
      GROUP  BY "goalId", TO_CHAR("date", 'YYYY-MM')
      ORDER  BY "goalId", month ASC
    `
  : [];

// Build Map<goalId, Map<"YYYY-MM", total>> from already-aggregated rows
const monthlyMap = new Map<string, Map<string, number>>();
for (const row of monthlyRows) {
  if (!monthlyMap.has(row.goalId)) monthlyMap.set(row.goalId, new Map());
  monthlyMap.get(row.goalId)!.set(row.month, row.total);
}
```

Pass `monthlyMap.get(goal.id)` as optional third arg to `formatGoal`.

### 3c. `formatGoal` — accept monthly contributions
```typescript
private formatGoal(
  goal: GoalWithOptionalJoins,
  contributedAmount = 0,
  monthlyContributions?: Map<string, number>,
): ProtoGoal {
  const monthly = monthlyContributions
    ? Array.from(monthlyContributions.entries()).map(([month, amount]) => ({ month, amount }))
    : [];
  return { ..., status: goal.status, contributedAmount, monthlyContributions: monthly };
}
```

Callers that don't pass monthly contributions (`getGoal`, `createGoal`, `updateGoal`, `updateGoalStatus`) get an empty array — no regression.

### 3d. New method: `updateGoalStatus`
- Validates goal ownership via existing `findGoalOrThrow`
- Rejects `status === 'COMPLETED'` (auto-only) with `INVALID_ARGUMENT`
- Rejects status change on already-COMPLETED goal with `FAILED_PRECONDITION`
- Updates `goal.status` and calls `callEvents(userId, updated, 'Goal Status Updated')`

> **Note on existing activity events**: `createContribution` and `deleteContribution` in the finance service already call `callEvents` (emit to `ACTIVITY_NOTIFICATION_QUEUE`). Confirm existing event names are `goal_contribution_created` and `goal_contribution_deleted` so the activity feed `entityType` maps correctly to `goal_contribution`.

### 3e. New method: `getGoalsAggregate`

#### What every metric means

| Metric | What it measures | Formula / Source |
|--------|-----------------|-----------------|
| **totalSaved** | Total money the user has actually put aside across ALL goals (active + completed). This is a sum of real contributions, not targets. | `SUM(GoalContribution.amount)` for goals where `status IN (ACTIVE, COMPLETED)` |
| **totalTarget** | Total amount the user is still trying to reach, across only their currently ACTIVE goals. Completed/cancelled/on-hold goals are excluded so it reflects remaining work, not all-time ambition. | `SUM(Goal.targetAmount)` where `status = ACTIVE` |
| **overallPercent** | How far along the user is across all active goals as a single blended number. Capped at 100 to avoid confusion when one goal is over-funded. | `(totalSaved / totalTarget) × 100`, capped `[0, 100]` |
| **activeCount** | Number of goals currently in progress. | Count of goals with `status = ACTIVE` |
| **completedCount** | Number of goals the user has fully funded and reached. | Count of goals with `status = COMPLETED` |
| **onHoldCount** | Goals the user has paused — they intend to resume but are not currently contributing. | Count of goals with `status = ON_HOLD` |
| **avgMonthlyContribution** | The user's average monthly saving rate over the last 6 full months. Used as the baseline "pace" to determine on-track status and as a reference for the streak. | `SUM(last-6-month contributions) / 6` |
| **onTrackCount** | Goals that the user is on pace to complete by their target date, given their current saving behaviour. A goal is "on track" if the user's goal-specific avg monthly ≥ required monthly to hit target. `required = (targetAmount − contributedAmount) / monthsLeft`. If `monthsLeft ≤ 0`, it's counted as on-track only if already completed. | Per-goal calculation using last-6-month per-goal avg vs required pace |
| **streakMonths** | Consecutive calendar months (backwards from the current month) in which the user made at least one contribution to ANY goal. Month M is "active" if `monthBuckets.has(M)`. The streak resets the moment there is a gap month with zero contributions. A streak of 0 means the user hasn't contributed yet this month. | Walk `currentMonth, currentMonth-1, currentMonth-2, ...` and count while `monthBuckets.has(month)` |
| **contributionHeatmap** | The last 12 calendar months as a fixed-size array (oldest → newest), each cell holding the total contributed that month (0 if nothing). Rendered as a row of 12 coloured squares — intensity proportional to the month's total relative to the user's max-month. Gives a GitHub contributions-style visual of saving consistency. | 12 entries from `monthBuckets`, filling missing months with 0 |
| **projectionData** | A time-series combining (a) actual past monthly totals (last 3 months, `isProjected: false`) and (b) forward-projected totals (up to 12 future months, `isProjected: true`). Future points are computed by linearly interpolating each ACTIVE goal's remaining amount across its remaining months, then summing across all ACTIVE goals at each future month. A goal that reaches its target is capped at `targetAmount` in future points. Used for the area chart. | Past: `monthBuckets` values; Future: `Σ goals min(contributed + linearProgress(goal, M), target)` per month M |

**3 queries total (run in parallel via `Promise.all`):**

**Query 1** — all non-cancelled goals with sums:
```typescript
const goals = await this.prismaService.goal.findMany({
  where: { userId, status: { not: 'CANCELLED' } },
});
const contribAggs = await this.prismaService.goalContribution.groupBy({
  by: ['goalId'],
  where: { goal: { userId } },
  _sum: { amount: true },
});
```

**Query 2** — last 12 months contributions for heatmap + streak + avg:
```typescript
const twelveMonthsAgo = new Date();
twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
twelveMonthsAgo.setDate(1); twelveMonthsAgo.setHours(0,0,0,0);

const recentContributions = await this.prismaService.goalContribution.findMany({
  where: { goal: { userId }, date: { gte: twelveMonthsAgo } },
  select: { date: true, amount: true, goalId: true },
  orderBy: { date: 'asc' },
});
```

All 3 queries run in parallel via `Promise.all`.

**Computed values:**
- `totalSaved` = sum of contributedAmounts (ACTIVE + COMPLETED goals)
- `totalTarget` = sum of targetAmounts (ACTIVE goals only)
- `overallPercent` = `totalSaved / totalTarget × 100` (capped 0–100)
- `activeCount`, `completedCount`, `onHoldCount` from `goal.status` counts
- Group `recentContributions` by "YYYY-MM" → `monthBuckets: Map<string, number>`
- `avgMonthlyContribution` = sum of last 6 months values ÷ 6
- **Streak**: walk backwards month by month from current month, count consecutive months present in `monthBuckets`
- **heatmap**: 12 "YYYY-MM" entries oldest-first, each with sum from `monthBuckets` (0 if absent)
- **onTrackCount**: for each ACTIVE goal, compute `monthsLeft = monthsBetween(today, targetDate)`, `required = (targetAmount - contributedAmount) / monthsLeft`, compare vs avg monthly contribution for that specific goal from recentContributions
- **projectionData**: past 3 actual months + up to 12 future projected months (15 points total). Frontend slices to 6M or 12M view. Each point: `{ month: "YYYY-MM", amount: number, isProjected: boolean }`. Past points use actual `monthBuckets` sums; future points use `sum over ACTIVE goals of min(contributedAmount + linearProgress(goal, M), targetAmount)`.

**File:** `apps/finance_service/src/goal/goal.controller.ts`

Add two new `@GrpcMethod` handlers: `updateGoalStatus` and `getGoalsAggregate`.

---

## Layer 4 — API Gateway

**File:** `apps/api_gateway/src/goal/goal.service.ts`
- `updateGoalStatus(user, id, status)` → gRPC `updateGoalStatus`
- `getGoalsAggregate(user)` → gRPC `getGoalsAggregate`

**File:** `apps/api_gateway/src/goal/goal.controller.ts`
```
GET  /api/goal/aggregate      → getGoalsAggregate   (declare BEFORE /:id)
PATCH /api/goal/:id/status    → updateGoalStatus
```

**File:** `apps/api_gateway/src/goal/dto/goal.dto.ts`
```typescript
export class UpdateGoalStatusDto {
  @IsEnum(['ACTIVE', 'ON_HOLD', 'CANCELLED'])
  status: string;
}
```

---

## Layer 5 — tRPC Router

**File:** `packages/trpc_app/src/routers/goal.ts`

**Already exists (no changes needed):** `createContribution`, `updateContribution`, `deleteContribution` procedures are all present.

**Add (still needed):**
```typescript
// Goal status
updateStatus: protectedProcedure
  .input(z.object({ id: z.string(), status: z.enum(['ACTIVE', 'ON_HOLD', 'CANCELLED']) }))
  .mutation(/* PATCH /api/goal/:id/status */),

// Aggregate
getAggregate: protectedProcedure
  .query(/* GET /api/goal/aggregate */),
```

Update `getAll` return type annotation to include `monthlyContributions: { month: string; amount: number }[]`.

**API gateway:** Add two new REST routes:
```
GET   /api/goal/aggregate      → getGoalsAggregate   (declare BEFORE /:id)
PATCH /api/goal/:id/status     → updateGoalStatus
```

**Contribution routes already exist** in the gateway (`POST /:goalId/contribution`, `PATCH /:goalId/contribution/:contributionId`, `DELETE /:goalId/contribution/:contributionId`) — no changes needed there.

---

## Layer 6 — Frontend

### Directory structure (all new)
```
apps/web/src/app/(dashboard)/planning/
  goals/
    page.tsx                       ← 'use client', merges page + client logic
    _components/
      goal_card.tsx
      goal_card_skeleton.tsx
      goal_form_dialog.tsx
      goal_drawer.tsx
      goal_contribution_form.tsx
      goal_projection_chart.tsx
      goal_health_panel.tsx
      goal_empty_state.tsx
```

### `page.tsx`
Client component (`'use client'`) — matches the project pattern used by all other feature pages (transactions, dashboard, etc.). No server component wrapper; no Suspense boundary needed since loading states are handled with skeletons via `isLoading` flags. Combines the page and client logic in one file.

- Queries: `api_client.goal.getAll.useQuery()` + `api_client.goal.getAggregate.useQuery()`
- State: `createOpen`, `drawerGoalId`
- **Layout:**
  ```
  PageHeader [Planning > Goals]  [+ Create New Goal]
  ┌────────────────────┬─────────────────────────────┐
  │  Savings Health    │  Savings Projection chart    │
  │  (streak + stats)  │  (area chart + 6M/12M toggle)│
  └────────────────────┴─────────────────────────────┘
  Goal cards grid  (grid-cols-2 → sm:grid-cols-3 → xl:grid-cols-4)
  ```

### `goal_card.tsx`
- Name, target date ("Due Dec 15, 2024")
- Priority badge: LOW=slate, MEDIUM=blue, HIGH=amber
- Status badge (hidden when ACTIVE): ON_HOLD=amber, CANCELLED=red, COMPLETED=emerald
- `contributedAmount / targetAmount` + percentage
- Progress bar color: < 50% = blue, 50–89% = amber, ≥ 90% = emerald, COMPLETED = green
- Mini 6-bar `BarChart` (Recharts) from `monthlyContributions`
- Context menu: View, Add Funds, Edit, Delete (AlertDialog)
- `onClick` → `setDrawerGoalId(goal.id)`

### `goal_form_dialog.tsx`
Fields: Name, Target Amount (₦), Target Date (future date picker), Priority (select), Description (optional).
Mutation: `api_client.goal.create.useMutation()` → invalidate `getAll` + `getAggregate`.

### `goal_drawer.tsx`
Sections:
1. **Header** — name + status/priority badges + edit toggle + delete
2. **Progress** — large contributed amount, `/targetAmount`, progress bar
3. **Status control** (edit mode) — Select: ACTIVE / ON_HOLD / CANCELLED. COMPLETED shows as disabled with tooltip. Calls `updateStatus` mutation.
4. **Edit fields** — name, targetAmount, targetDate, priority, description
5. **Contributions list** — each entry: date, +₦amount, description, optional tx link badge. Delete per contribution (AlertDialog).
6. **Add Funds** — expands `GoalContributionForm` inline

Fetches: `api_client.goal.getById.useQuery({ id })` when open.
Invalidates on any mutation: `getAll`, `getById({ id })`, `getAggregate`.

### `goal_contribution_form.tsx`
- Amount (required), Date picker (default today), Description (optional)
- "Link to transaction" toggle button — when active, shows a transaction search input instead of the date picker:
  - **No results by default** until the user types (avoids loading all transactions)
  - Debounced input (300ms) fires a single combined search query: `api_client.transaction.search.useQuery({ q, type: ['INCOME'] })` — searches description, merchant, sourceId, bankTransactionId, amount simultaneously
  - Selecting a result auto-fills amount + uses the transaction date; clears on deselect
  - Server route must apply rate limiting (e.g. 30 req/min per user) to prevent abuse on rapid keystroke queries
- `api_client.goal.createContribution.useMutation()`

### `goal_projection_chart.tsx`
`ComposedChart` (Recharts):
- X-axis: month labels from sliced `projectionData`
- Two series rendered from `aggregate.projectionData`:
  - Points where `isProjected === false`: solid `Area` fill (actual)
  - Points where `isProjected === true`: dashed `Line` with lighter opacity (projected)
- Separator `ReferenceLine` at the first projected month ("Today")
- Toggle state: `'6M' | '12M'` — slices `projectionData` to `past3 + future3` or `past3 + future9`
- Y-axis: `formatCurrency` tick formatter

### `goal_health_panel.tsx`
**Streak block (top, prominent):**
- Fire emoji + large streak number + "month streak"
- Milestone badge rendered based on streak: 🔥 ≥1, ⚡ ≥3, 💎 ≥6, 👑 ≥12
- 12-month heatmap grid: 12 cells in a row, each colored by intensity (no contribution = muted, any = brand color scaled by amount)
- If `streakMonths === 0`: "Contribute to any goal this month to start your streak"

**Stats block:**
- Avg monthly contribution
- On-track count ("X / Y goals on track")
- Total saved vs total target ("₦X of ₦Y · Z%")
- Status counts (X Active, X Completed, X On Hold)

### `goal_empty_state.tsx`
Centered empty state: Target icon, "No goals yet", subtitle, "+ Create your first goal" CTA button.

---

## Layer 7 — Sidebar Navigation

**File:** `apps/web/src/constants/sidebar-nav.constants.ts`

Confirm `planning` section exists and add Goals entry with `Target` lucide icon and `href: '/planning/goals'`.

---

## Layer 8 — Activity Feed (`goal_contribution` type)

**File:** `apps/web/src/app/(dashboard)/dashboard/_components/activity_feed.tsx`

Add `goal_contribution` to `ENTITY_ICONS` / `ENTITY_ICON_COLORS` (use `Coins` icon, emerald color).

Add branch to `ActivityDetail`:
```typescript
if (d.type === 'goal_contribution') {
  const amount = fmt(d.contributionAmount);
  const date = d.contributionDate ? dayjs(d.contributionDate).format('DD MMM YYYY') : null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      {amount && <span className="text-emerald-400 text-[11px] font-semibold tabular-nums">+{amount}</span>}
      {date && <span className="text-text-disabled text-[10px]">{date}</span>}
    </div>
  );
}
```

---

## Caching & Invalidation

**Apply `staleTime`** only to computationally heavy endpoints:
- `goal.getAll` — staleTime: 2 min (list with batch monthly contributions via raw SQL)
- `goal.getAggregate` — staleTime: 2 min (3 parallel queries + streak/projection computation)
- `goal.getById` — **no caching** (single-row fetch, not heavy; reads from the tRPC cache naturally)

**Invalidation on mutation:**

| Action | Invalidate |
|--------|-----------|
| Create goal | `goal.getAll`, `goal.getAggregate` |
| Update goal | `goal.getAll`, `goal.getById({ id })`, `goal.getAggregate` |
| Delete goal | `goal.getAll`, `goal.getAggregate` |
| Update status | `goal.getAll`, `goal.getById({ id })`, `goal.getAggregate` |
| Add contribution | `goal.getAll`, `goal.getById({ id })`, `goal.getAggregate` |
| Update contribution | `goal.getById({ id })`, `goal.getAggregate` |
| Delete contribution | `goal.getAll`, `goal.getById({ id })`, `goal.getAggregate` |

---

## Implementation Order

1. ~~Schema migration~~ ✅ already done
2. Proto: add `ProjectionPoint` + `GoalHealthData` messages + new RPCs
3. TypeScript types: fix `statsu` typo, add `GoalHealthData` + `ProjectionPoint` interfaces, update finance interface
4. Finance service: `formatGoal` fix, `getGoals` monthly SQL extension, `updateGoalStatus`, `getGoalsAggregate`, controller handlers
5. API gateway: DTO, two new routes
6. tRPC router: `updateStatus`, `getAggregate`, return type update
7. Frontend: `page.tsx` + cards → form dialog → drawer → contribution form → projection chart → health panel → empty state
8. Activity feed: `goal_contribution` branch
9. Sidebar nav: Goals link

---

## Verification

1. Create goal → card appears, aggregate updates, activity log "Goal Created"
2. Add 3 months of contributions to any goal → streak = 3, ⚡ badge appears, heatmap shows 3 filled cells
3. Skip a month, add next month → streak resets to 1
4. Contributions fill target → status auto-sets to COMPLETED, progress bar turns green
5. Set status to ON_HOLD → card shows amber badge, excluded from on-track count
6. Projection chart: active goal 6 months from target → projected line reaches target at correct month
7. `goal.statsu` removed entirely — TypeScript errors at compile time catch any missed references
8. Delete goal → contributions cascade, aggregate recalculates
