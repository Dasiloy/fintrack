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

- Contribution history added to list endpoint (all-time, DB-level groupBy)
- Linear projection (contributed today → targetAmount at targetDate)
- ON_HOLD added to schema (migration done)
- CANCELLED removed from schema entirely (deprecated)
- Status change via dropdown in drawer (manual ACTIVE/ON_HOLD; COMPLETED = auto-only)
- Add Funds: amount + date by default, optional "Link transaction" toggle
- Projection: aggregate single combined line
- Streak: consecutive complete calendar months (any goal) with at least one contribution; Udemy-style display
- Caching lives at the **API gateway layer** (Redis cache-aside), not in the tRPC router

---

## What Already Exists (Do Not Rebuild)

Before touching any code, note what is fully implemented in the current backend:

### Database

- `Goal` table: `id`, `name`, `targetAmount`, `targetDate`, `priority` (LOW/MEDIUM/HIGH), `status` (ACTIVE/COMPLETED/ON_HOLD), `description`, `userId`, timestamps
- `GoalContribution` table: `id`, `goalId`, `amount`, `date`, `description`, `notes`, `transactionId` (optional link to an INCOME transaction), timestamps
- `Goalstatus` enum: ACTIVE, COMPLETED, ON_HOLD (CANCELLED removed)

### Proto (`packages/types/proto/finance/goal.proto`)

- `Goal` message with all fields including `status` (field 6) and `monthly_contributions` (field 12)
- `MonthlyContributionSummary`, `Contribution`, `ProjectionPoint`, `GoalsAggregate` messages
- `UpdateGoalStatusReq` message
- All CRUD request/response messages
- `rpc updateGoalStatus` and `rpc getGoalsAggregate` in the `FinanceService` block

### Finance Service (`apps/finance_service/src/goal/`)

- `createGoal`, `getGoals`, `getGoal`, `updateGoal`, `deleteGoal`
- `contributeToGoal`, `updateGoalContribution`, `deleteContribution`
- `updateGoalStatus`, `getGoalsAggregate`
- Contribution overflow guard (running sum cannot exceed `targetAmount`)
- Auto-complete: when a contribution pushes the sum to `targetAmount`, goal status is auto-set to `COMPLETED`
- `callEvents` / `callContributionEvents` called on every mutation → emits to `ACTIVITY_NOTIFICATION_QUEUE`
- Activity event names: `goal_created`, `goal_updated`, `goal_status_updated`, `goal_contribution_created`, `goal_contribution_deleted`

### API Gateway (`apps/api_gateway/src/goal/`)

- `GET    /api/goal`                                      — list goals (filters: status, priority, amount operator)
- `POST   /api/goal/create`                               — create goal
- `GET    /api/goal/aggregate`                            — aggregate health snapshot (cached 2 min)
- `GET    /api/goal/:id`                                  — get single goal
- `PATCH  /api/goal/:id`                                  — update goal fields
- `PATCH  /api/goal/:id/status`                           — update goal status (ACTIVE | ON_HOLD)
- `DELETE /api/goal/:id`                                  — delete goal
- `POST   /api/goal/:goalId/contribution`                 — add contribution
- `PATCH  /api/goal/:goalId/contribution/:contributionId` — update contribution
- `DELETE /api/goal/:goalId/contribution/:contributionId` — delete contribution

### tRPC Router (`packages/trpc_app/src/routers/goal.ts`)

- `goal.getAll`, `goal.getById`, `goal.create`, `goal.update`, `goal.delete`
- `goal.createContribution`, `goal.updateContribution`, `goal.deleteContribution`

### TypeScript types (`packages/types/src/protos/finance/goal.ts`)

All existing interfaces — `statsu` typo on `Goal` is fixed. `ProjectionPoint`, `GoalsAggregate`, `UpdateGoalStatusReq` are present.

---

## Layer 1 — Database (Schema Migration)

**Status: ✅ Done** — `Goalstatus` enum is `ACTIVE | COMPLETED | ON_HOLD`. CANCELLED removed.

---

## Layer 2 — Proto & Generated Types

### 2a. Proto file — `packages/types/proto/finance/goal.proto`

**Status: ✅ Done** — `ProjectionPoint`, `GoalsAggregate` messages present; `rpc getGoalsAggregate` and `rpc updateGoalStatus` in the service block.

### 2b. TypeScript types — `packages/types/src/protos/finance/goal.ts`

**Status: ✅ Done** — `statsu` typo fixed; `ProjectionPoint`, `GoalsAggregate`, `UpdateGoalStatusReq` present. `GoalsAggregate` fields: `totalSaved`, `activeTarget`, `activePercent`, `activeCount`, `completedCount`, `onHoldCount`, `overdueCount`, `onTrackCount`, `avgMonthlyContribution`, `streakMonths`, `contributionHeatmap`, `projectionData`.

### 2c. Finance interface — `packages/types/src/protos/finance/finance.ts`

**Status: ✅ Done** — `getGoalsAggregate` and `updateGoalStatus` are in `FinanceServiceClient`, `FinanceServiceController`, and the `grpcMethods` array.

---

## Layer 3 — Finance Service

Status: ✅ Done

File: `apps/finance_service/src/goal/goal.service.ts`

- `formatGoal` — `statsu` typo fixed; accepts optional `monthlyContributions` map.
- `getGoals` — raw SQL batch groupBy for monthly contributions + all-time totals in one pass.
- `updateGoalStatus` — validates ACTIVE/ON_HOLD only, rejects COMPLETED, emits activity event.
- `getGoalsAggregate` — 4 parallel DB queries (Q1a status groupBy, Q1b active findMany, Q2 all-time groupBy, Q3 recent findMany) decomposed into 7 private helpers:
  - `buildAllTimeTotalMap` — Q2 → `Map<goalId, allTimeTotal>`
  - `buildMonthlyBuckets` — Q3 → `{ monthBuckets, goalMonthBuckets }` in one O(n) pass
  - `computeAvgMonthlyContribution` — map-iteration, `activePeriods` divisor, excludes current month
  - `computeStreak` — walks back from last complete month, bounded by `monthBuckets.size`
  - `buildContributionHeatmap` — 12 fixed entries oldest → newest
  - `computeOnTrackAndOverdue` — per-goal pace comparison; handles `monthsLeft === 0` edge case
  - `buildProjectionData` — 3 actual past months + 12 projected future months; pre-computed `GoalPace` array

File: `apps/finance_service/src/goal/goal.controller.ts`

- `@GrpcMethod updateGoalStatus` and `@GrpcMethod getGoalsAggregate` added.
- Activity event names confirmed: `goal_contribution_created` / `goal_contribution_deleted` (prefix added).

---

## Layer 4 — API Gateway

Status: ✅ Done

Files: `apps/api_gateway/src/goal/`

### DTO — `dto/goal.dto.ts`

`UpdateGoalStatusDto` added: `@IsIn([Goalstatus.ACTIVE, Goalstatus.ON_HOLD])` on `status: string`.

### Service — `goal.service.ts`

Redis injected (`REDIS_CLIENT`). Two new methods added; all mutation methods now invalidate caches.

#### Cache strategy

<!-- markdownlint-disable MD060 -->
| Key                      | TTL   | Bypassed when                    |
| ------------------------ | ----- | -------------------------------- |
| `goal_list:{userId}`     | 120 s | any filter query param is present |
| `goal_aggregate:{userId}`| 120 s | never bypassed                   |
<!-- markdownlint-enable MD060 -->

`invalidateGoalCache(userId)` deletes both keys in a single `redis.del` call (fire-and-forget). Called after every mutation:

<!-- markdownlint-disable MD060 -->
| Mutation             | Invalidates                                    |
| -------------------- | ---------------------------------------------- |
| `createGoal`         | `goal_list`, `goal_aggregate`, gated usage     |
| `updateGoal`         | `goal_list`, `goal_aggregate`                  |
| `updateGoalStatus`   | `goal_list`, `goal_aggregate`                  |
| `deleteGoal`         | `goal_list`, `goal_aggregate`, gated usage     |
| `contributeToGoal`   | `goal_list`, `goal_aggregate`                  |
| `updateContribution` | `goal_list`, `goal_aggregate`                  |
| `deleteContribution` | `goal_list`, `goal_aggregate`                  |
<!-- markdownlint-enable MD060 -->

#### New Redis constants (`packages/types/src/constants/redis.costants.ts`)

```text
GOAL_LIST_CACHE_PREFIX      = 'goal_list'      TTL 120 s
GOAL_AGGREGATE_CACHE_PREFIX = 'goal_aggregate' TTL 120 s
```

### Controller — `goal.controller.ts`

Two new REST endpoints (both with Swagger docs):

```text
GET   /api/goal/aggregate    → getGoalsAggregate   (declared BEFORE /:id)
PATCH /api/goal/:id/status   → updateGoalStatus
```

---

## Layer 5 — tRPC Router

**File:** `packages/trpc_app/src/routers/goal.ts`

**Already exists (no changes needed):** `createContribution`, `updateContribution`, `deleteContribution`.

**Add (still needed):**

```typescript
updateStatus: protectedProcedure
  .input(z.object({ id: z.string(), status: z.enum(['ACTIVE', 'ON_HOLD']) }))
  .mutation(/* PATCH /api/goal/:id/status */),

getAggregate: protectedProcedure
  .query(/* GET /api/goal/aggregate */),
```

Update `getAll` return type annotation to include `monthlyContributions: { month: string; amount: number }[]`.

---

## Layer 6 — Frontend

### Directory structure (all new)

```text
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

Client component (`'use client'`). No server wrapper; loading states via `isLoading` skeletons.

- Queries: `api_client.goal.getAll.useQuery()` + `api_client.goal.getAggregate.useQuery()`
- State: `createOpen`, `drawerGoalId`
- Layout:

```text
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
- Status badge (hidden when ACTIVE): ON_HOLD=amber, COMPLETED=emerald
- `contributedAmount / targetAmount` + percentage
- Progress bar color: < 50% = blue, 50–89% = amber, ≥ 90% = emerald, COMPLETED = green
- Mini bar `BarChart` (Recharts) from `monthlyContributions` (all-time history)
- Context menu: View, Add Funds, Edit, Delete (AlertDialog)
- `onClick` → `setDrawerGoalId(goal.id)`

### `goal_form_dialog.tsx`

Fields: Name, Target Amount (₦), Target Date (future date picker), Priority (select), Description (optional).
Mutation: `api_client.goal.create.useMutation()` → invalidate `getAll` + `getAggregate`.

### `goal_drawer.tsx`

Sections:

1. **Header** — name + status/priority badges + edit toggle + delete
2. **Progress** — large contributed amount, `/targetAmount`, progress bar
3. **Status control** (edit mode) — Select: ACTIVE / ON_HOLD. COMPLETED shows as disabled with tooltip. Calls `updateStatus` mutation.
4. **Edit fields** — name, targetAmount, targetDate, priority, description
5. **Contributions list** — each entry: date, +₦amount, description, optional tx link badge. Delete per contribution (AlertDialog).
6. **Add Funds** — expands `GoalContributionForm` inline

Fetches: `api_client.goal.getById.useQuery({ id })` when open.
Invalidates on any mutation: `getAll`, `getById({ id })`, `getAggregate`.

### `goal_contribution_form.tsx`

- Amount (required), Date picker (default today), Description (optional)
- "Link to transaction" toggle — when active, shows a transaction search input instead of the date picker:
  - **No results by default** until the user types
  - Debounced input (300ms) → `api_client.transaction.search.useQuery({ q, type: ['INCOME'] })`
  - Selecting a result auto-fills amount + uses the transaction date
- `api_client.goal.createContribution.useMutation()`

### `goal_projection_chart.tsx`

`ComposedChart` (Recharts):

- Two series from `aggregate.projectionData`:
  - `isProjected === false`: solid `Area` fill (actual)
  - `isProjected === true`: dashed `Line` with lighter opacity (projected)
- `ReferenceLine` at the first projected month ("Today")
- Toggle: `'6M' | '12M'` — slices to `past3 + future3` or `past3 + future9`
- Y-axis: `formatCurrency` tick formatter

### `goal_health_panel.tsx`

**Streak block:**

- Large streak number + "month streak"
- Milestone badge: 🔥 ≥1, ⚡ ≥3, 💎 ≥6, 👑 ≥12
- 12-month heatmap grid (amount-scaled color intensity)
- If `streakMonths === 0`: "Contribute to any goal this month to start your streak"

**Stats block:** avg monthly contribution, on-track count, total saved vs active target, status counts.

### `goal_empty_state.tsx`

Centered empty state: Target icon, "No goals yet", subtitle, "+ Create your first goal" CTA.

---

## Layer 7 — Sidebar Navigation

**File:** `apps/web/src/constants/sidebar-nav.constants.ts`

Add Goals entry under `planning` section with `Target` lucide icon and `href: '/planning/goals'`.

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

## Implementation Order

1. ~~Schema migration~~ ✅
2. ~~Proto: `ProjectionPoint` + `GoalsAggregate` messages + new RPCs~~ ✅
3. ~~TypeScript types: `statsu` fix, new interfaces, finance interface~~ ✅
4. ~~Finance service: `formatGoal` fix, `getGoals` monthly SQL, `formatGoal` signature~~ ✅
5. ~~Finance service: `updateGoalStatus`, `getGoalsAggregate` (4-query + 7 helpers), controller handlers~~ ✅
6. ~~API gateway: `UpdateGoalStatusDto`, Redis cache-aside, two new routes~~ ✅
7. tRPC router: `updateStatus`, `getAggregate`, `getAll` return type update
8. Frontend: `page.tsx` → cards → form dialog → drawer → contribution form → projection chart → health panel → empty state
9. Activity feed: `goal_contribution` branch
10. Sidebar nav: Goals link

---

## Verification

1. Create goal → card appears, aggregate updates, activity log "Goal Created"
2. Add 3 months of contributions to any goal → streak = 3, ⚡ badge appears, heatmap shows 3 filled cells
3. Skip a month, add next month → streak resets to 1
4. Contributions fill target → status auto-sets to COMPLETED, progress bar turns green
5. Set status to ON_HOLD → card shows amber badge, excluded from on-track count
6. Projection chart: active goal 6 months from target → projected line reaches target at correct month
7. Delete goal → contributions cascade, aggregate recalculates
8. Cache: second request for `GET /api/goal` (unfiltered) within 2 min returns Redis hit; filtered request always hits gRPC
