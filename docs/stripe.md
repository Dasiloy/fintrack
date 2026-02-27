# FinTrack — Stripe Integration Setup Guide

This guide walks through everything needed to wire Stripe into the FinTrack subscription system — from dashboard configuration to local webhook testing to production deployment.

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

## 1. Create a Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete business verification (can skip for test mode development)
3. Stay in **Test mode** (toggle in top-left) until you are ready to go live

---

## 2. Create the Product & Price

> Docs: [https://docs.stripe.com/products-prices/overview](https://docs.stripe.com/products-prices/overview)

### 2a. Create the Product

1. Dashboard → **Product catalogue** → **Add product**
2. Fill in:
   - **Name:** `FinTrack Pro`
   - **Description:** `Unlimited budgets, AI insights, CSV export, PDF reports & more`
   - **Image:** (optional — upload your logo)
3. Click **Save product**

### 2b. Create the Price

Still on the product page:

1. Click **Add price**
2. Set:
   - **Pricing model:** Standard pricing
   - **Price:** `5.00`
   - **Currency:** USD
   - **Billing period:** Monthly
3. Click **Save price**
4. **Copy the `price_...` ID** — this is your `STRIPE_PRO_MONTHLY_PRICE_ID`

---

## 3. Get API Keys

> Docs: [https://docs.stripe.com/keys](https://docs.stripe.com/keys)

1. Dashboard → **Developers** → **API keys**
2. You will see two keys in Test mode:
   - **Publishable key** → `pk_test_...` → goes in `apps/web`
   - **Secret key** → `sk_test_...` → goes in `apps/payment_service` only
3. Never commit these to git. Add them to `.env` files which are in `.gitignore`.

> **Security rule:** If `STRIPE_SECRET_KEY` ever appears in a `NEXT_PUBLIC_*` variable or client bundle, rotate it immediately.

---

## 4. Enable the Customer Portal (Recommended)

> Docs: [https://docs.stripe.com/customer-management/activate-no-code-customer-portal](https://docs.stripe.com/customer-management/activate-no-code-customer-portal)

The Customer Portal lets subscribers manage their own billing (cancel, update card) without you building a custom UI.

1. Dashboard → **Settings** → **Billing** → **Customer portal**
2. Enable:
   - ✅ Cancel subscription
   - ✅ Update payment method
   - ✅ View invoice history
3. Click **Save**

Your payment service can redirect users to the portal with:
```typescript
const portalSession = await stripe.billingPortal.sessions.create({
  customer: subscription.stripeCustomerId,
  return_url: `${baseUrl}/settings/billing`,
});
// redirect user to portalSession.url
```

---

## 5. Install the Stripe SDK

```bash
# Server-side SDK — payment_service only
pnpm add stripe --filter payment_service

# Optional: type-safe Stripe.js for embedded Elements (not needed for hosted Checkout redirect)
# pnpm add @stripe/stripe-js --filter web
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

Pinning the API version prevents Stripe's breaking changes from silently affecting your code.

---

## 6. Environment Variables

Add the following to each service's `.env` file. **Do not share `.env` files across services.**

```bash
# apps/payment_service/.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...          # See Section 7 below
STRIPE_PRO_MONTHLY_PRICE_ID=price_...

# apps/api_gateway/.env
STRIPE_WEBHOOK_SECRET=whsec_...          # Same value — needed to verify signatures

# apps/web/.env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...   # Used server-side when creating Checkout Sessions
```

Add all Stripe variable names (without values) to a `.env.example` file so other developers know what to fill in:

```bash
# .env.example
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## 7. Webhook Setup

Stripe sends webhook events to notify your server of payment outcomes. You must verify every incoming webhook with the signing secret to prevent forged events.

> **Why this matters:** Without signature verification, any attacker could POST a fake `checkout.session.completed` event to your endpoint and get a free Pro upgrade.

### 7a. Local Development — Stripe CLI

> Docs: [https://docs.stripe.com/stripe-cli](https://docs.stripe.com/stripe-cli)

**Install the CLI:**

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
  --events checkout.session.completed,customer.subscription.updated,customer.subscription.deleted,invoice.payment_failed \
  --forward-to localhost:3001/api/payment/webhook
```

The CLI prints a webhook signing secret:
```
> Ready! Your webhook signing secret is whsec_abc123... (^C to quit)
```

Copy that `whsec_...` value → paste it as `STRIPE_WEBHOOK_SECRET` in your local `.env` files.

> Keep this terminal running while you develop. Every time you restart it, a new `whsec_...` is generated — update your `.env` accordingly.

### 7b. Signature Verification in Code

```typescript
// In your webhook controller — MUST read raw body bytes, not parsed JSON
// NestJS: use RawBodyMiddleware or @RawBody() decorator
// Express: app.use('/webhook', express.raw({ type: 'application/json' }))

const sig = request.headers['stripe-signature'] as string;

let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
} catch (err) {
  // Invalid signature — reject the request
  throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
}
```

> **Gotcha:** Your webhook route must receive the raw `Buffer`, not a parsed JSON object. If you apply `express.json()` globally, exclude the webhook path from it.

### 7c. Events to Handle

| Event | What it means | Action |
|---|---|---|
| `checkout.session.completed` | User successfully paid | Create/update `Subscription` row, set `plan = PRO` |
| `customer.subscription.updated` | Subscription changed (period renewal, plan change) | Update `stripeCurrentPeriodEnd`, `status` |
| `customer.subscription.deleted` | Subscription cancelled and expired | Set `plan = FREE`, `status = CANCELED` |
| `invoice.payment_failed` | Monthly renewal failed | Set `status = PAST_DUE`, send payment failure email |

### 7d. Idempotency

Stripe may deliver the same event more than once. Guard against duplicate processing using the `StripeWebhookEvent` model (already in the Prisma schema):

```typescript
// Before processing any event:
const existing = await db.stripeWebhookEvent.findUnique({
  where: { eventId: event.id },
});
if (existing) return; // already processed — skip

// Process the event...

// After successful processing:
await db.stripeWebhookEvent.create({
  data: { eventId: event.id, eventType: event.type },
});
```

### 7e. Production Webhook — Dashboard

> Docs: [https://docs.stripe.com/webhooks](https://docs.stripe.com/webhooks)

1. Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL:** `https://yourdomain.com/api/payment/webhook`
3. **Select events:** check all 4 events listed in Section 7c
4. Click **Add endpoint**
5. Click **Reveal** on the signing secret → copy `whsec_...` → set as `STRIPE_WEBHOOK_SECRET` in production

---

## 8. Stripe Customer Creation

FinTrack eagerly creates a Stripe customer for every user when their email is verified. This makes the upgrade checkout flow instant (no customer creation delay at checkout time).

**Queue-based pattern** — Stripe API calls are HTTP. Running them inside a Prisma `$transaction` risks timeout and partial commits. The queue decouples the Stripe call from the database transaction:

```typescript
// Inside verifyEmail() — after setting emailVerified: true inside tx:
this.tokenQueue.add('CREATE_STRIPE_CUSTOMER', { userId: user.id, email: user.email });
```

**The worker (to be implemented in `apps/payment_service`):**

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

## 9. Checkout Session (Upgrade Flow)

When a free user clicks "Upgrade to Pro":

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
    line_items: [
      {
        price: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/settings/billing?upgraded=1`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: { userId }, // always include — webhook uses this to identify user
    // Prevent duplicate subscriptions if user already has one
    subscription_data: {
      metadata: { userId },
    },
  });

  return session.url; // redirect user to this URL
}
```

> Docs: [https://docs.stripe.com/api/checkout/sessions/create](https://docs.stripe.com/api/checkout/sessions/create)

---

## 10. Testing

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
# Simulate a successful upgrade payment
stripe trigger checkout.session.completed

# Simulate subscription renewal
stripe trigger customer.subscription.updated

# Simulate cancellation
stripe trigger customer.subscription.deleted

# Simulate a failed payment
stripe trigger invoice.payment_failed
```

### Inspect Events & Logs

- **Dashboard → Developers → Events** — full history of all events, with payload viewer
- **Dashboard → Developers → Logs** — every API call your server made to Stripe

### Test the Full Upgrade Flow End-to-End

1. `stripe listen --forward-to localhost:3001/api/payment/webhook`
2. Register a new user and verify their email → confirm Stripe customer is created in Dashboard → Customers
3. Click "Upgrade to Pro" → redirected to Stripe Checkout
4. Enter card `4242 4242 4242 4242`, any expiry, any CVC
5. Submit → redirected to `/settings/billing?upgraded=1`
6. Confirm `Subscription.plan = PRO` in your database
7. Confirm `checkout.session.completed` appears in Dashboard → Events

---

## 11. Going to Production Checklist

- [ ] Toggle Stripe Dashboard from **Test mode** to **Live mode**
- [ ] Generate live API keys: `pk_live_...` and `sk_live_...`
- [ ] Create a new product and price in live mode (test data does not carry over)
- [ ] Update all `.env` files in production with live keys
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
