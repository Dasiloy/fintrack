# FinTrack — Subscription & Plan Implementation Guide

## Overview

FinTrack uses a **Free + Pro** model. All users sign up as Free automatically — no plan selection at registration. Upgrade is contextual: triggered by hitting a quota limit, reaching 80% of a limit, or clicking the persistent sidebar badge. Pro costs $5/month, billed via Stripe.

**Key principles:**
- Plan state lives in the database (`User.plan`), NOT in the JWT — stale JWT risk on downgrade is too high
- Server-side quota checks are mandatory; client-side UI gates (disabled buttons, hidden elements) are UX only
- Existing user data is NEVER deleted on downgrade — only creation of new items is blocked

---

## 1. Prisma Schema Additions

**File:** `packages/database/prisma/schema.prisma`

### New Enums

```prisma
enum Plan {
  FREE
  PRO
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  TRIALING
  INCOMPLETE
}

enum UsageFeature {
  AI_INSIGHTS_QUERIES
  AI_CHAT_MESSAGES
  RECEIPT_UPLOADS
}
```

### Additions to Existing `User` Model

```prisma
// Add these fields to the existing User model:
plan           Plan           @default(FREE)
subscription   Subscription?
usageTrackers  UsageTracker[]
```

### New `Subscription` Model

```prisma
model Subscription {
  id                       String             @id @default(cuid())
  userId                   String             @unique
  user                     User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId         String             @unique
  stripeSubscriptionId     String?            @unique
  stripePriceId            String?
  stripeCurrentPeriodStart DateTime?
  stripeCurrentPeriodEnd   DateTime?
  stripeCancelAtPeriodEnd  Boolean            @default(false)
  status                   SubscriptionStatus @default(ACTIVE)
  plan                     Plan               @default(FREE)
  createdAt                DateTime           @default(now())
  updatedAt                DateTime           @updatedAt
}
```

### New `UsageTracker` Model

Tracks monthly-quota features (AI queries, chat messages, receipt uploads). A new row per user per feature per billing period — auto-expires naturally as new periods begin.

```prisma
model UsageTracker {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  feature     UsageFeature
  count       Int          @default(0)
  periodStart DateTime     // First day of current month (UTC midnight)
  periodEnd   DateTime     // First day of next month (UTC midnight)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([userId, feature, periodStart])
  @@index([userId, feature])
}
```

### New `StripeWebhookEvent` Model (idempotency)

```prisma
model StripeWebhookEvent {
  id          String   @id @default(cuid())
  eventId     String   @unique  // Stripe event.id
  eventType   String
  processedAt DateTime @default(now())
}
```

---

## 2. Plan Limits Constants

**New file:** `packages/types/src/constants/plan.constants.ts`

```typescript
export const PLAN_LIMITS = {
  FREE: {
    MAX_CUSTOM_CATEGORIES: 3,
    MAX_BUDGETS: 5,
    MAX_RECURRING_ITEMS: 5,
    MAX_GOALS: 3,
    MAX_ACTIVE_SPLITS: 3,
    MAX_PEOPLE_PER_SPLIT: 3,
    AI_INSIGHTS_QUERIES_PER_MONTH: 20,
    AI_CHAT_MESSAGES_PER_MONTH: 10,
    RECEIPT_UPLOADS_PER_MONTH: 10,
    PDF_REPORTS: false,
    CSV_EXPORT: false,
    ANALYTICS_ALL_TIME: false,
    ANALYTICS_MONTHS_LIMIT: 6,
  },
  PRO: {
    MAX_CUSTOM_CATEGORIES: Infinity,
    MAX_BUDGETS: Infinity,
    MAX_RECURRING_ITEMS: Infinity,
    MAX_GOALS: Infinity,
    MAX_ACTIVE_SPLITS: Infinity,
    MAX_PEOPLE_PER_SPLIT: Infinity,
    AI_INSIGHTS_QUERIES_PER_MONTH: Infinity,
    AI_CHAT_MESSAGES_PER_MONTH: Infinity,
    RECEIPT_UPLOADS_PER_MONTH: Infinity,
    PDF_REPORTS: true,
    CSV_EXPORT: true,
    ANALYTICS_ALL_TIME: true,
    ANALYTICS_MONTHS_LIMIT: null,
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;
export type PlanLimits = (typeof PLAN_LIMITS)[PlanName];
```

---

## 3. Plan Initialization on Email Verification

**File:** `apps/auth_service/src/auth.service.ts`
**Location:** Inside the `verifyEmail()` Prisma transaction, after setting `emailVerified: true`

```typescript
// After emailVerified: true is set inside tx:

// 1. Queue Stripe customer creation (keeps the transaction fast — no external HTTP in tx)
this.tokenQueue.add('CREATE_STRIPE_CUSTOMER', { userId: user.id, email: user.email });

// 2. Seed UsageTrackers for this month (creates the initial quota rows)
const now = new Date();
const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

await tx.usageTracker.createMany({
  data: [
    { userId: user.id, feature: 'AI_INSIGHTS_QUERIES', count: 0, periodStart, periodEnd },
    { userId: user.id, feature: 'AI_CHAT_MESSAGES',    count: 0, periodStart, periodEnd },
    { userId: user.id, feature: 'RECEIPT_UPLOADS',     count: 0, periodStart, periodEnd },
  ],
  skipDuplicates: true,
});

// User.plan defaults to FREE in schema — no explicit set needed
```

**Why queue Stripe customer creation:** Stripe API calls are HTTP — running them inside a DB transaction risks timeout and partial commits. Queue decouples them; the worker creates the Stripe customer and writes back `Subscription.stripeCustomerId` when done.

---

## 4. Server-Side Quota Check Helpers

**New file:** `packages/trpc_app/src/lib/quota.ts`

Every helper must be called inside a `db.$transaction`. Client-side guards (disabled buttons, hidden UI) are UX only — NEVER the sole enforcement.

### `assertStructuralLimit`

For features with a maximum count of DB records (budgets, goals, splits, etc.).

```typescript
/**
 * Throws FORBIDDEN if the user's current count of `feature` items is >= plan limit.
 * Pass the current count from a DB COUNT query done inside the same transaction.
 */
async function assertStructuralLimit(
  plan: PlanName,
  feature: keyof typeof PLAN_LIMITS.FREE,
  currentCount: number
): Promise<void> {
  const limit = PLAN_LIMITS[plan][feature] as number;
  if (currentCount >= limit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `${plan} plan limit reached for ${feature} (${limit}). Upgrade to Pro.`,
    });
  }
}
```

### `assertAndIncrementUsageQuota`

For features tracked by monthly count (AI queries, chat, receipt uploads). Upserts the tracker row and atomically checks + increments.

```typescript
/**
 * Checks monthly usage quota and increments counter.
 * Throws FORBIDDEN if limit already reached.
 * Must be called inside a db.$transaction.
 */
async function assertAndIncrementUsageQuota(
  tx: PrismaTransactionClient,
  userId: string,
  plan: PlanName,
  feature: UsageFeature
): Promise<void> {
  const limitKey = `${feature}_PER_MONTH` as keyof typeof PLAN_LIMITS.FREE;
  const limit = PLAN_LIMITS[plan][limitKey] as number;

  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  // Upsert: creates row if new month, reuses existing row otherwise
  const tracker = await tx.usageTracker.upsert({
    where: { userId_feature_periodStart: { userId, feature, periodStart } },
    create: { userId, feature, count: 0, periodStart, periodEnd },
    update: {},
  });

  if (tracker.count >= limit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Monthly limit reached for ${feature}. Upgrade to Pro for unlimited access.`,
    });
  }

  await tx.usageTracker.update({
    where: { userId_feature_periodStart: { userId, feature, periodStart } },
    data: { count: { increment: 1 } },
  });
}
```

### `assertFeatureEnabled`

For boolean-gated features (PDF reports, CSV export).

```typescript
/**
 * Throws FORBIDDEN if a boolean feature flag is disabled for the plan.
 */
function assertFeatureEnabled(plan: PlanName, feature: 'PDF_REPORTS' | 'CSV_EXPORT'): void {
  if (!PLAN_LIMITS[plan][feature]) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `${feature} is a Pro feature. Upgrade to unlock.`,
    });
  }
}
```

---

## 5. Endpoints Requiring Quota Checks

| tRPC Endpoint | Check Type | Limit Constant |
|---|---|---|
| `category.create` (custom only) | Structural | `MAX_CUSTOM_CATEGORIES` |
| `budget.create` | Structural | `MAX_BUDGETS` |
| `recurring.create` | Structural | `MAX_RECURRING_ITEMS` |
| `goal.create` | Structural | `MAX_GOALS` |
| `split.create` | Structural | `MAX_ACTIVE_SPLITS` |
| `split.addParticipant` | Structural | `MAX_PEOPLE_PER_SPLIT` |
| `ai.queryInsight` | Usage + Increment | `AI_INSIGHTS_QUERIES_PER_MONTH` |
| `ai.sendChatMessage` | Usage + Increment | `AI_CHAT_MESSAGES_PER_MONTH` |
| `receipt.upload` | Usage + Increment | `RECEIPT_UPLOADS_PER_MONTH` |
| `report.generatePdf` | Feature flag | `PDF_REPORTS` |
| `report.exportCsv` | Feature flag | `CSV_EXPORT` |
| `analytics.query` | Conditional date filter | `ANALYTICS_MONTHS_LIMIT` — apply `WHERE date >= cutoff`, not a hard block |

**Note on analytics:** For Free users, add a date filter `WHERE date >= (NOW() - INTERVAL '6 months')` to the query. Do not throw an error — just silently limit the data range.

---

## 6. Stripe Webhook Handlers

**File:** `apps/api_gateway/src/payment/payment.controller.ts`

**Critical:** Use raw body parsing for Stripe signature verification. Never parse the body as JSON before verifying.

```typescript
// In the webhook route — raw body must be preserved:
stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
```

**Idempotency pattern — run this FIRST in every handler:**

```typescript
// Prevent duplicate processing (Stripe retries on network failure)
try {
  await db.stripeWebhookEvent.create({
    data: { eventId: event.id, eventType: event.type },
  });
} catch (e) {
  if (e.code === 'P2002') return; // Already processed — P2002 = unique constraint
  throw e;
}
```

### Event Handlers

| Stripe Event | Action |
|---|---|
| `checkout.session.completed` | Set `User.plan = PRO`. Upsert `Subscription` with `customerId`, `subscriptionId`, `status = ACTIVE`, period dates. Queue `SUBSCRIPTION_UPGRADED` email job. |
| `customer.subscription.updated` | Update `Subscription.status`, `cancelAtPeriodEnd`, period dates. Re-set `User.plan = PRO` if returning from `CANCELED`. |
| `customer.subscription.deleted` | Set `User.plan = FREE`. Set `Subscription.status = CANCELED`. Do NOT delete user data (budgets, goals, etc. are preserved). Queue `SUBSCRIPTION_CANCELED` email. |
| `invoice.payment_succeeded` | Update `Subscription` period dates, set `status = ACTIVE`. Create fresh `UsageTracker` rows for the new billing period (Pro users reset with Stripe cycle, not calendar month). |
| `invoice.payment_failed` | Set `Subscription.status = PAST_DUE`. Queue `PAYMENT_FAILED` email. Do NOT downgrade immediately — Stripe retries before deleting the subscription. |

---

## 7. Monthly Usage Reset

### Pro Users
Reset is triggered by `invoice.payment_succeeded` — create new `UsageTracker` rows for `periodStart = stripeCurrentPeriodStart` of the new invoice. This aligns reset with the Stripe billing cycle, not the calendar month.

### Free Users
`assertAndIncrementUsageQuota` uses `periodStart = first day of current UTC month` as the upsert key. A new month naturally creates a new row — no explicit reset job needed.

### Cleanup Cron
Delete `UsageTracker` rows where `periodEnd < NOW() - 90 days` to prevent table bloat. Run daily at low-traffic hours.

---

## 8. Downgrade Handling

When `customer.subscription.deleted` fires and `User.plan` is set to `FREE`:

- **Data preservation:** All existing records (budgets, goals, splits, categories, etc.) are kept. Users can VIEW and use all existing data.
- **Creation blocked:** Any new item that would exceed the Free limit throws `FORBIDDEN`. Example: user with 8 budgets can view all 8 but cannot create a 9th (Free limit is 5).
- **Banner:** Show inline banner: `"You have 8 budgets. Free plan includes 5. Existing budgets are preserved."`
- **Analytics:** Apply 6-month cutoff filter from the moment of downgrade (not retroactive deletion).
- **AI quotas:** Apply immediately — `assertAndIncrementUsageQuota` reads `User.plan` live on each request.

---

## 9. Frontend Plan Context

### tRPC Route

New route `plan.getStatus` — returns current plan status with usage data:

```typescript
// Returns:
{
  plan: 'FREE' | 'PRO',
  subscription: { status, cancelAtPeriodEnd, stripeCurrentPeriodEnd } | null,
  usage: {
    AI_INSIGHTS_QUERIES: { count: number, limit: number, periodEnd: Date },
    AI_CHAT_MESSAGES:    { count: number, limit: number, periodEnd: Date },
    RECEIPT_UPLOADS:     { count: number, limit: number, periodEnd: Date },
  },
  limits: typeof PLAN_LIMITS[plan],
}
```

### Web Provider

**New file:** `apps/web/src/app/providers/plan_provider.tsx`

- Wraps `(dashboard)/layout.tsx`
- Uses `staleTime: 5 * 60 * 1000` (5-minute cache) — plan changes are infrequent
- Exposes hooks:
  - `usePlan()` — returns full plan status object
  - `useIsPro()` — boolean shortcut
  - `useCanUseFeature(feature)` — returns `{ allowed: boolean, current: number, limit: number }`

### Mobile Provider

Same pattern, wrapping `(app)/_layout.tsx` in the Expo router.

---

## 10. Additional Requirements

### Stripe Checkout Flow

```
1. User clicks "Upgrade to Pro" (sidebar badge or locked feature overlay)
2. POST /payment/create-checkout-session
3. API Gateway → payment service gRPC → stripe.checkout.sessions.create
   (success_url: /settings/account?upgraded=true, cancel_url: /pricing)
4. Client redirects to Stripe-hosted Checkout page
5. On success: checkout.session.completed webhook → User.plan = PRO
```

### Customer Portal

`POST /payment/create-portal-session` — redirects user to Stripe's hosted portal to:
- Cancel subscription
- Update payment method
- View invoice history

No custom cancel/billing UI needed.

### Proto Updates

Add to `payment.proto`:
```protobuf
rpc CreateCheckoutSession(CreateCheckoutSessionRequest) returns (CreateCheckoutSessionResponse);
rpc CreatePortalSession(CreatePortalSessionRequest) returns (CreatePortalSessionResponse);
```

### Environment Variables

```bash
# Add to all relevant .env files:
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

### Queue Job Constants

Add to `packages/types/src/constants/queues.constants.ts`:

```typescript
CREATE_STRIPE_CUSTOMER   // Worker: create Stripe customer, write stripeCustomerId to Subscription
SUBSCRIPTION_UPGRADED    // Worker: send upgrade confirmation email
SUBSCRIPTION_CANCELED    // Worker: send cancellation confirmation + downgrade notice email
PAYMENT_FAILED           // Worker: send payment failure email with portal link
USAGE_RESET              // Worker: (optional) Pro user UsageTracker reset on renewal
```

### Do NOT Put `plan` in the JWT

Reading `User.plan` from the DB on each tRPC request is required. If plan is in the JWT, a user who downgrades would retain Pro access until their JWT expires. Instead: enrich `createTRPCContext` by fetching `user.plan` from DB (use a short Redis cache with TTL 60s to avoid N+1 on every request if needed).

---

## Plan Feature Matrix

| Feature | Free | Pro |
|---|---|---|
| Transactions | Unlimited, full history | Unlimited, full history |
| Custom categories | 3 | Unlimited |
| Budgets | 5 | Unlimited |
| Bills & Recurring items | 5 | Unlimited |
| Goals | 3 | Unlimited |
| Active splits | 3 (max 3 people/split) | Unlimited |
| Analytics history | Last 6 months | All-time |
| AI Insights queries | 20/month | Unlimited |
| AI Chat messages | 10/month | Unlimited |
| Receipt uploads | 10/month | Unlimited |
| PDF Reports | No | Yes |
| CSV Export | No | Yes |
