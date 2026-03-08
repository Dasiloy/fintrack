# FinTrack — Stripe & Subscription Implementation Guide

FinTrack uses a **Free + Pro** model. All users sign up as Free — no plan selection at registration. Upgrade is contextual: triggered by hitting a quota limit, reaching 80% of a limit, or clicking the persistent sidebar badge. Pro costs $5/month, billed via Stripe.

**Key principles:**
- Plan state lives in the database (`User.plan`), NOT in the JWT — stale JWT risk on downgrade is too high
- Server-side quota checks are mandatory; client-side UI gates (disabled buttons, hidden elements) are UX only
- Existing user data is NEVER deleted on downgrade — only creation of new items is blocked

---

## Architecture Overview

FinTrack uses three Stripe touch-points:

| Service | Role | Key |
|---|---|---|
| `apps/payment_service` | Server-side SDK — customer creation, checkout sessions, webhook handling | `STRIPE_SECRET_KEY` |
| `apps/api_gateway` | Webhook endpoint — receives and verifies Stripe events | `STRIPE_WEBHOOK_SECRET` |
| `apps/web` | Redirect to hosted Checkout — needs publishable key for client | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |

The secret key **never** touches the browser. Only the publishable key is safe to expose.

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

---

## Prisma Schema

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

## Plan Limits Constants

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

## Stripe Setup

### 1. Create a Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete business verification (can skip for test mode development)
3. Stay in **Test mode** (toggle in top-left) until you are ready to go live

### 2. Create the Product & Price

> Docs: [https://docs.stripe.com/products-prices/overview](https://docs.stripe.com/products-prices/overview)

**Create the Product:**
1. Dashboard → **Product catalogue** → **Add product**
2. Fill in:
   - **Name:** `FinTrack Pro`
   - **Description:** `Unlimited budgets, AI insights, CSV export, PDF reports & more`
3. Click **Save product**

**Create the Price** (still on the product page):
1. Click **Add price**
2. Set:
   - **Pricing model:** Standard pricing
   - **Price:** `5.00` USD
   - **Billing period:** Monthly
3. Click **Save price**
4. **Copy the `price_...` ID** — this is your `STRIPE_PRO_MONTHLY_PRICE_ID`

### 3. Get API Keys

> Docs: [https://docs.stripe.com/keys](https://docs.stripe.com/keys)

1. Dashboard → **Developers** → **API keys**
2. Copy both keys (Test mode):
   - **Publishable key** → `pk_test_...` → `apps/web` only
   - **Secret key** → `sk_test_...` → `apps/payment_service` only
3. Never commit these to git.

> **Security rule:** If `STRIPE_SECRET_KEY` ever appears in a `NEXT_PUBLIC_*` variable or client bundle, rotate it immediately.

### 4. Enable the Customer Portal

> Docs: [https://docs.stripe.com/customer-management/activate-no-code-customer-portal](https://docs.stripe.com/customer-management/activate-no-code-customer-portal)

1. Dashboard → **Settings** → **Billing** → **Customer portal**
2. Enable: Cancel subscription, Update payment method, View invoice history
3. Click **Save**

### 5. Install the Stripe SDK

```bash
# Server-side SDK — payment_service only
pnpm add stripe --filter payment_service
```

> Docs: [https://docs.stripe.com/api?lang=node](https://docs.stripe.com/api?lang=node)

Initialize the client in `payment_service`:

```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia', // pin to a specific version — never use 'latest'
  typescript: true,
});
```

### 6. Environment Variables

```bash
# apps/payment_service/.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...

# apps/api_gateway/.env
STRIPE_WEBHOOK_SECRET=whsec_...          # Same value — needed to verify signatures

# apps/web/.env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...   # Used server-side when creating Checkout Sessions
```

---

## Webhook Setup

Stripe sends webhook events to notify your server of payment outcomes. You must verify every incoming webhook with the signing secret to prevent forged events.

> **Why this matters:** Without signature verification, any attacker could POST a fake `checkout.session.completed` event to your endpoint and get a free Pro upgrade.

### Local Development — Stripe CLI

> Docs: [https://docs.stripe.com/stripe-cli](https://docs.stripe.com/stripe-cli)

**Install:**

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe

# Windows (via scoop)
scoop install stripe
```

**Login:**

```bash
stripe login
# Opens browser — authorize the CLI with your Stripe account
```

**Forward events to your local API Gateway:**

```bash
stripe listen \
  --events checkout.session.completed,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed \
  --forward-to localhost:3001/api/payment/webhook
```

The CLI prints a webhook signing secret:
```
> Ready! Your webhook signing secret is whsec_abc123... (^C to quit)
```

Copy that `whsec_...` value and set it as `STRIPE_WEBHOOK_SECRET` in your local `.env` files.

> Keep this terminal running while you develop. Every time you restart it, a new `whsec_...` is generated — update your `.env` accordingly.

### Signature Verification in Code

**File:** `apps/api_gateway/src/payment/payment.controller.ts`

```typescript
// MUST read raw body bytes, not parsed JSON
// NestJS: use RawBodyMiddleware or @RawBody() decorator
// Express: app.use('/webhook', express.raw({ type: 'application/json' }))

const sig = request.headers['stripe-signature'] as string;

let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
} catch (err) {
  throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
}
```

> **Gotcha:** Your webhook route must receive the raw `Buffer`, not a parsed JSON object. If you apply `express.json()` globally, exclude the webhook path from it.

### Idempotency Pattern

Stripe may deliver the same event more than once. Guard against duplicate processing using `StripeWebhookEvent`. Run this **first** in every handler:

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

### Webhook Event Handlers

| Stripe Event | Action |
|---|---|
| `checkout.session.completed` | Set `User.plan = PRO`. Upsert `Subscription` with `customerId`, `subscriptionId`, `status = ACTIVE`, period dates. Queue `SUBSCRIPTION_UPGRADED` email job. |
| `customer.subscription.updated` | Update `Subscription.status`, `cancelAtPeriodEnd`, period dates. Re-set `User.plan = PRO` if returning from `CANCELED`. |
| `customer.subscription.deleted` | Set `User.plan = FREE`. Set `Subscription.status = CANCELED`. Do NOT delete user data. Queue `SUBSCRIPTION_CANCELED` email. |
| `invoice.payment_succeeded` | Update `Subscription` period dates, set `status = ACTIVE`. Create fresh `UsageTracker` rows for the new billing period (Pro users reset with Stripe cycle, not calendar month). |
| `invoice.payment_failed` | Set `Subscription.status = PAST_DUE`. Queue `PAYMENT_FAILED` email. Do NOT downgrade immediately — Stripe retries before deleting the subscription. |

### Production Webhook — Dashboard

> Docs: [https://docs.stripe.com/webhooks](https://docs.stripe.com/webhooks)

1. Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL:** `https://yourdomain.com/api/payment/webhook`
3. **Select events:** all 5 events listed above
4. Click **Add endpoint**
5. Click **Reveal** on the signing secret → copy `whsec_...` → set as `STRIPE_WEBHOOK_SECRET` in production

---

## Stripe Customer Creation

FinTrack eagerly creates a Stripe customer for every user when their email is verified. This makes the upgrade checkout flow instant (no customer creation delay at checkout time).

**Queue-based pattern** — Stripe API calls are HTTP. Running them inside a Prisma `$transaction` risks timeout and partial commits. The queue decouples the Stripe call from the database transaction.

**Trigger point** — `apps/auth_service/src/auth.service.ts`, inside the `verifyEmail()` Prisma transaction:

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
    { userId: user.id, feature: 'AI_CHAT_MESSAGES', count: 0, periodStart, periodEnd },
    { userId: user.id, feature: 'RECEIPT_UPLOADS', count: 0, periodStart, periodEnd },
  ],
  skipDuplicates: true,
});

// User.plan defaults to FREE in schema — no explicit set needed
```

**The worker** (`apps/payment_service`):

```typescript
@Processor(TOKEN_NOTIFICATION_QUEUE)
export class StripeCustomerWorker {
  @Process('CREATE_STRIPE_CUSTOMER')
  async handle(job: Job<{ userId: string; email: string }>) {
    const { userId, email } = job.data;

    const customer = await stripe.customers.create({
      email,
      metadata: { userId }, // critical — ties Stripe customer back to your DB user
    });

    await db.subscription.create({
      data: {
        userId,
        stripeCustomerId: customer.id,
        plan: 'FREE',
        status: 'ACTIVE',
      },
    });
  }
}
```

---

## Checkout & Portal Sessions

### Checkout Session (Upgrade Flow)

```
1. User clicks "Upgrade to Pro" (sidebar badge or locked feature overlay)
2. POST /payment/create-checkout-session
3. API Gateway → payment service gRPC → stripe.checkout.sessions.create
   (success_url: /settings/account?upgraded=true, cancel_url: /pricing)
4. Client redirects to Stripe-hosted Checkout page
5. On success: checkout.session.completed webhook → User.plan = PRO
```

```typescript
// In payment_service — called via gRPC from api_gateway
async createCheckoutSession(userId: string): Promise<string> {
  const subscription = await db.subscription.findUnique({ where: { userId } });

  if (!subscription?.stripeCustomerId) {
    throw new Error('Stripe customer not yet created — retry in a moment');
  }

  const session = await stripe.checkout.sessions.create({
    customer: subscription.stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRO_MONTHLY_PRICE_ID, quantity: 1 }],
    success_url: `${baseUrl}/settings/billing?upgraded=1`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: { userId }, // always include — webhook uses this to identify user
    subscription_data: { metadata: { userId } },
  });

  return session.url; // redirect user to this URL
}
```

> Docs: [https://docs.stripe.com/api/checkout/sessions/create](https://docs.stripe.com/api/checkout/sessions/create)

### Customer Portal Session

`POST /payment/create-portal-session` — redirects user to Stripe's hosted portal to cancel, update payment method, or view invoice history. No custom billing UI needed.

```typescript
const portalSession = await stripe.billingPortal.sessions.create({
  customer: subscription.stripeCustomerId,
  return_url: `${baseUrl}/settings/billing`,
});
// redirect user to portalSession.url
```

### Proto Updates

Add to `payment.proto`:

```protobuf
rpc CreateCheckoutSession(CreateCheckoutSessionRequest) returns (CreateCheckoutSessionResponse);
rpc CreatePortalSession(CreatePortalSessionRequest) returns (CreatePortalSessionResponse);
```

---

## Server-Side Quota Enforcement

**New file:** `packages/trpc_app/src/lib/quota.ts`

Every helper must be called inside a `db.$transaction`. Client-side guards are UX only — NEVER the sole enforcement.

> **Do NOT put `plan` in the JWT.** Read `User.plan` from the DB on each tRPC request. If plan is in the JWT, a downgraded user retains Pro access until expiry. Enrich `createTRPCContext` by fetching `user.plan` from DB (use Redis cache TTL 60s to avoid N+1 if needed).

### `assertStructuralLimit`

For features with a maximum count of DB records (budgets, goals, splits, etc.):

```typescript
async function assertStructuralLimit(
  plan: PlanName,
  feature: keyof typeof PLAN_LIMITS.FREE,
  currentCount: number,
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

For features tracked by monthly count (AI queries, chat, receipt uploads). Upserts the tracker row and atomically checks + increments:

```typescript
async function assertAndIncrementUsageQuota(
  tx: PrismaTransactionClient,
  userId: string,
  plan: PlanName,
  feature: UsageFeature,
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

For boolean-gated features (PDF reports, CSV export):

```typescript
function assertFeatureEnabled(plan: PlanName, feature: 'PDF_REPORTS' | 'CSV_EXPORT'): void {
  if (!PLAN_LIMITS[plan][feature]) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `${feature} is a Pro feature. Upgrade to unlock.`,
    });
  }
}
```

### Endpoints Requiring Quota Checks

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

## Monthly Usage Reset

### Pro Users

Reset is triggered by `invoice.payment_succeeded` — create new `UsageTracker` rows for `periodStart = stripeCurrentPeriodStart` of the new invoice. This aligns reset with the Stripe billing cycle, not the calendar month.

### Free Users

`assertAndIncrementUsageQuota` uses `periodStart = first day of current UTC month` as the upsert key. A new month naturally creates a new row — no explicit reset job needed.

### Cleanup Cron

Delete `UsageTracker` rows where `periodEnd < NOW() - 90 days` to prevent table bloat. Run daily at low-traffic hours.

---

## Downgrade Handling

When `customer.subscription.deleted` fires and `User.plan` is set to `FREE`:

- **Data preservation:** All existing records (budgets, goals, splits, categories, etc.) are kept. Users can view and use all existing data.
- **Creation blocked:** Any new item that would exceed the Free limit throws `FORBIDDEN`. Example: user with 8 budgets can view all 8 but cannot create a 9th (Free limit is 5).
- **Banner:** Show inline banner: `"You have 8 budgets. Free plan includes 5. Existing budgets are preserved."`
- **Analytics:** Apply 6-month cutoff filter from the moment of downgrade (not retroactive deletion).
- **AI quotas:** Apply immediately — `assertAndIncrementUsageQuota` reads `User.plan` live on each request.

---

## Frontend Plan Context

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

## Queue Job Constants

Add to `packages/types/src/constants/queues.constants.ts`:

```typescript
CREATE_STRIPE_CUSTOMER  // Worker: create Stripe customer, write stripeCustomerId to Subscription
SUBSCRIPTION_UPGRADED   // Worker: send upgrade confirmation email
SUBSCRIPTION_CANCELED   // Worker: send cancellation confirmation + downgrade notice email
PAYMENT_FAILED          // Worker: send payment failure email with portal link
USAGE_RESET             // Worker: (optional) Pro user UsageTracker reset on renewal
```

---

## Testing

### Test Cards

> Docs: [https://docs.stripe.com/testing#cards](https://docs.stripe.com/testing#cards)

| Card number | Behaviour |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Insufficient funds |

Use any future expiry date and any 3-digit CVC.

### Trigger Webhook Events Manually

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

### Inspect Events & Logs

- **Dashboard → Developers → Events** — full history with payload viewer
- **Dashboard → Developers → Logs** — every API call your server made to Stripe

### Full Upgrade Flow End-to-End

1. `stripe listen --forward-to localhost:3001/api/payment/webhook`
2. Register a new user and verify their email → confirm Stripe customer is created in Dashboard → Customers
3. Click "Upgrade to Pro" → redirected to Stripe Checkout
4. Enter card `4242 4242 4242 4242`, any expiry, any CVC
5. Submit → redirected to `/settings/billing?upgraded=1`
6. Confirm `Subscription.plan = PRO` in your database
7. Confirm `checkout.session.completed` appears in Dashboard → Events

---

## Production Checklist

- [ ] Toggle Stripe Dashboard from **Test mode** to **Live mode**
- [ ] Generate live API keys: `pk_live_...` and `sk_live_...`
- [ ] Create a new product and price in live mode (test data does not carry over)
- [ ] Update all production env vars with live keys
- [ ] Add production webhook endpoint (Dashboard → Developers → Webhooks)
- [ ] Copy the live `whsec_...` signing secret → update `STRIPE_WEBHOOK_SECRET`
- [ ] Verify Stripe Radar is active (fraud protection — enabled by default in live mode)
- [ ] Set up billing failure alerts: Dashboard → Settings → **Alerts**
- [ ] Confirm `StripeWebhookEvent` idempotency is working (check logs after first live payment)
- [ ] Test with a real card for $0.50 then immediately refund via Dashboard

> Docs: [https://docs.stripe.com/production-checklist](https://docs.stripe.com/production-checklist)

---

## Quick Reference

| Item | Where to find it |
|---|---|
| Publishable key | Dashboard → Developers → API keys |
| Secret key | Dashboard → Developers → API keys (click Reveal) |
| Price ID | Dashboard → Product catalogue → your product → price row |
| Webhook signing secret (local) | Printed by `stripe listen` |
| Webhook signing secret (prod) | Dashboard → Developers → Webhooks → your endpoint → Reveal |
| Test cards | [https://docs.stripe.com/testing#cards](https://docs.stripe.com/testing#cards) |
| Stripe CLI install | [https://docs.stripe.com/stripe-cli](https://docs.stripe.com/stripe-cli) |
| Node.js SDK reference | [https://docs.stripe.com/api?lang=node](https://docs.stripe.com/api?lang=node) |
