# Payment Service — Architecture & Implementation Guide

## What the Payment Service Is Responsible For

All Stripe interactions. No other service touches the Stripe API directly.
The payment_service is the single boundary between this system and Stripe.

```
┌──────────────────────────────────────────────────────┐
│                    payment_service                   │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ Checkout / Portal│  │  Subscription Management │  │
│  │   Sessions       │  │  & Webhook Processing    │  │
│  └──────────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                    │ gRPC
        ┌───────────┴────────────┐
        │      api_gateway       │
        └────────────────────────┘
                    │ Webhook HTTP
        ┌───────────┴────────────┐
        │         Stripe         │
        └────────────────────────┘
```

---

## Domain 1 — Checkout Session

### What it does

Generates a Stripe-hosted checkout URL for a user to upgrade from FREE to PRO.
The user is redirected to Stripe's checkout page; on success Stripe fires a
webhook back to api_gateway.

### How it works

```
CreateCheckoutSession({ userId, originUrl })
  │
  lookup Subscription by userId
    → reject if not found (user must have a subscription row from registration)
    → reject if stripeSubscriptionId already set (already subscribed)
  │
  stripe.customers.create({ email: user.email })
    → returns stripeCustomerId (not persisted here — stored on webhook confirmation)
  │
  stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: STRIPE_PRO_MONTHLY_PRICE_ID, quantity: 1 }],
    success_url: `${originUrl}/dashboard`,
    cancel_url: `${originUrl}/pricing`,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
    customer: customer.id,
  })
  │
  CreateCheckoutSessionResponse { checkoutSessionUrl }
    → api_gateway redirects the browser to this URL
```

### Why this approach

The service creates a fresh Stripe customer on every checkout attempt rather
than caching the customerId. This avoids stale customer state and handles the
case where a user's Stripe customer was deleted or the account was in a bad
state. The authoritative `stripeCustomerId` is written to the DB only after
Stripe fires the `checkout.session.completed` webhook — not before.

---

## Domain 2 — Billing Portal Session

### What it does

Generates a Stripe-hosted billing portal URL where the user can manage their
subscription: update payment method, view invoices, or cancel.

### How it works

```
CreatePortalSession({ userId, originUrl })
  │
  lookup Subscription by userId
    → reject if not found
    → reject if stripeCustomerId is null (user never completed checkout)
  │
  stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: originUrl,
  })
  │
  CreatePortalSessionResponse { portalSessionUrl }
```

---

## Domain 3 — Subscription Cancellation

### What it does

Immediately cancels the user's active Stripe subscription, with an idempotency
key to prevent double-cancellation.

### How it works

```
CancelSubscription({ userId })
  │
  lookup Subscription by userId
    → reject if not found
    → reject if stripeSubscriptionId is null
  │
  stripe.subscriptions.cancel(stripeSubscriptionId, {
    cancellation_details: { feedback: 'customer_service' },
  }, {
    idempotencyKey: stripeSubscriptionId,
  })
  │
  Empty {}
  → Stripe fires subscription.deleted webhook → webhook handler downgrades plan
```

The idempotency key is the `stripeSubscriptionId` itself — retrying this call
with the same subscription ID produces the same result without double-charging
or throwing.

---

## Domain 4 — Webhook Processing (api_gateway → payment_service via BullMQ)

### What it does

Stripe fires events to a webhook endpoint in api_gateway. The gateway verifies
the signature and enqueues the event onto `PAYMENT_QUEUE`. The payment_service
processor picks it up and updates the subscription state in Postgres.

### Webhook events handled

| Stripe event | Job name | What happens |
|---|---|---|
| `checkout.session.completed` | `CREATE_CHECKOUT_SESSION_JOB` | Write `stripeCustomerId`, activate PRO plan, send email |
| `invoice.paid` | `INVOICE_PAID_JOB` | Send invoice receipt email |
| `invoice.payment_failed` | `INVOICE_PAYMENT_FAILED_JOB` | Send payment failure alert email |
| `customer.subscription.updated` | `SUBSCRIPTION_ACTIVATED_JOB` | Update plan status in DB, send activation email |
| `customer.subscription.deleted` | `SUBSCRIPTION_DELETED_JOB` | Downgrade to FREE, send ended email |

### Why BullMQ, not direct gRPC

Webhook handlers must return HTTP 200 within seconds or Stripe retries. Offloading
to BullMQ decouples the HTTP acknowledgement from the DB write. If the DB write
fails, BullMQ retries the job without Stripe needing to fire the webhook again.

---

## Stripe Client Configuration

```typescript
this.stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
  telemetry: false,
  maxNetworkRetries: 3,
});
```

`maxNetworkRetries: 3` means the Stripe SDK automatically retries idempotent
requests on network errors. Combined with the idempotency key on cancellation,
double-processing is avoided.

---

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...     # used in api_gateway to verify webhook signatures
STRIPE_PRO_MONTHLY_PRICE_ID=price_... # Stripe Price ID for the PRO monthly plan
```

---

## gRPC Contract Summary

```proto
service PaymentService {
  rpc CreateCheckoutSession(OriginUrlReq) returns (CreateCheckoutSessionResponse) {}
  rpc CreatePortalSession(OriginUrlReq) returns (CreatePortalSessionResponse) {}
  rpc CancelSubscription(Empty) returns (Empty) {}
}
```

---

## Implementation Order

### Step 1 — Checkout Session

Build `CreateCheckoutSession`. This is the only path a free user has to become
a paying user. Wire it to the api_gateway payment module.

Deliverable: user can click "Upgrade" in the UI, get redirected to Stripe, and
complete payment.

### Step 2 — Webhook Handler

Build the webhook endpoint in api_gateway, the signature verification, and the
BullMQ queue. Build the processor that handles `checkout.session.completed`.
This completes the checkout round-trip.

Deliverable: after Stripe fires the webhook, the user's plan is updated to PRO
in Postgres.

### Step 3 — Remaining Webhook Events

Add handlers for `invoice.paid`, `invoice.payment_failed`,
`customer.subscription.updated`, `customer.subscription.deleted`.

### Step 4 — Portal + Cancellation

Build `CreatePortalSession` and `CancelSubscription`. These require an active
subscription to exist, so they depend on Steps 1–2.

---

## What to Ignore (Non-Goals)

- **One-time payments** — the product is subscription-only
- **Multiple plans / tiers** — one PRO plan; plan variants are V3 work
- **Invoice PDF generation** — Stripe's hosted portal handles this
- **Proration / mid-cycle upgrades** — not applicable with a single plan
