# API Gateway — Architecture & Implementation Guide

## What the API Gateway Is Responsible For

The single HTTP entry point for all clients (Next.js web app, mobile app via
GraphQL). It aggregates the microservices behind one address, enforces auth,
rate-limits, validates DTOs, and exposes real-time features via WebSocket.

The api_gateway is not a pass-through proxy. It owns Postgres directly (via
Prisma) for modules that don't need a dedicated microservice, handles Stripe
and Mono webhooks over HTTP, and is responsible for all real-time Socket.io
connections.

```
┌──────────────────────────────────────────────────────────────────┐
│                         api_gateway                              │
│                                                                  │
│  HTTP (REST/tRPC)          WebSocket (Socket.io)                │
│  ┌──────────────────┐      ┌──────────────────────────┐         │
│  │ 14 Feature Modules│      │   Real-time channels:    │         │
│  │  (controllers)   │      │   analytics, activity    │         │
│  └────────┬─────────┘      └────────────┬─────────────┘         │
│           │                             │                        │
│   Guards / Throttler / Pipes            │                        │
│   DeviceMiddleware                      │                        │
│           │                             │                        │
│     ┌─────┴─────────────────────────────┘                        │
│     │                                                            │
│     ▼                                                            │
│  gRPC Clients:                                                   │
│    AUTH_SERVICE   PAYMENT_SERVICE   FINANCE_SERVICE              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Request Lifecycle

Every HTTP request to api_gateway goes through this pipeline before reaching
a controller method:

```
HTTP Request
  │
  ThrottlerGuard    → 10 requests / 60s per IP (rate limit)
  │
  DeviceMiddleware  → extracts device info (platform, deviceId, deviceName)
                      from headers, attaches to request
  │
  JwtAuthGuard      → validates Authorization: Bearer <token> header
                      calls auth_service.ValidateToken() via gRPC
                      attaches { userId, sessionId } to request
  │
  ValidationPipe    → validates/transforms req.body against DTO class
                      strips unknown properties
                      throws 400 on schema mismatch
  │
  Controller method
  │
  AppExceptionFilter → catches RpcException from microservices
                       maps gRPC status codes to HTTP status codes
                       returns consistent error shape to client
```

The `JwtAuthGuard` is the gateway's primary security boundary. Before any
finance, analytics, or account call is forwarded to a microservice, the user
is authenticated here. Microservices trust the `userId` injected into gRPC
metadata by the gateway.

---

## Module Map

| Module | What it exposes | Backed by |
|---|---|---|
| `auth` | Register, login, 2FA, OAuth, tokens | auth_service gRPC |
| `payment` | Checkout, portal, Stripe webhooks | payment_service gRPC |
| `transaction` | CRUD transactions, bank sync | finance_service gRPC |
| `category` | Manage spending categories | Postgres (Prisma direct) |
| `budget` | CRUD budgets | finance_service gRPC |
| `recurring` | CRUD recurring items | finance_service gRPC |
| `goal` | CRUD goals + contributions | finance_service gRPC |
| `split` | CRUD splits + settlements | finance_service gRPC |
| `analytics` | Spending summaries, budget utilisation | Postgres (Prisma direct) |
| `activity` | User activity feed | Postgres (Prisma direct) |
| `account` | Mono bank account sync | Mono API + finance_service gRPC |
| `user` | User profile reads | Postgres (Prisma direct) |
| `usage` | Feature usage tracking | Postgres (Prisma direct) |
| `upload` | Cloudinary signed upload URLs | Cloudinary API |
| `fcm` | Firebase push notification tokens | Postgres (Prisma direct) |

---

## Domain 1 — Auth Module

### What it does

Proxies all auth operations to auth_service via gRPC. The gateway's auth
module does not contain auth logic — it translates HTTP requests into gRPC
calls and HTTP responses back.

### Key differences from other modules

The auth endpoints are **unauthenticated** (no `JwtAuthGuard`) since the user
doesn't have a token yet. The guard is excluded via `@Public()` decorator on
registration, login, forgot password, and OAuth endpoints.

```
POST /auth/register         → auth_service.Register()
POST /auth/verify-email     → auth_service.VerifyEmail()
POST /auth/login            → auth_service.Login()
POST /auth/google           → auth_service.LoginWithGoogle()
POST /auth/forgot-password  → auth_service.ForgotPassword()
POST /auth/reset-password   → auth_service.ResetPassword()
POST /auth/refresh          → auth_service.RefreshToken()
...
```

---

## Domain 2 — Account Module (Mono Bank Sync)

### What it does

Connects and syncs user bank accounts via the Mono API. This is the most
complex module in the gateway — it involves an OAuth-like Mono Connect flow,
webhook verification, and a multi-step transaction processing pipeline.

### Mono Connect flow

```
1. User clicks "Connect Bank" in UI
   → GET /account/connect → returns Mono Connect widget config

2. User completes bank auth in Mono Connect widget
   → widget fires onSuccess({ code }) to the frontend

3. POST /account/exchange-token { code }
   → gateway calls Mono API: exchange code for accountId
   → creates Account row in Postgres (accountId, provider: MONO)
   → GET Mono API: fetch initial transaction history
   → BatchCreateTransactions → finance_service
   → returns Account

4. Mono fires webhook on new transactions
   POST /account/webhook (verified with MONO_WEBHOOK_SECRET)
   → processes new transactions through scoring pipeline
   → BatchCreateTransactions → finance_service
```

### Transaction processing pipeline (inside webhook handler)

```
raw Mono transactions
  │
  Layer 1: Token Scoring
    map each tx against known merchant tokens
    score = exact match → 100, partial → 50, none → 0
    high-confidence scores: assign category directly
  │
  Layer 2: Mono Category Mapping
    map Mono's category labels to internal category slugs
    medium-confidence assignments
  │
  Layer 3: AI Classification (score = 0 only)
    POST to ai_service.ClassifyTransactions() via gRPC
    assigns category to unclassified transactions
  │
  BatchCreateTransactions → finance_service
```

---

## Domain 3 — Analytics Module

### What it does

Computes and serves spending analytics from Postgres. Unlike most modules,
analytics reads Postgres directly rather than going through finance_service —
analytics queries are aggregation-heavy SQL that don't fit the CRUD pattern
of the finance service.

### What it computes

```
GET /analytics/summary?period=2026-03
  → total income, total expenses, savings rate for the period
  → spending by category with budget comparison
  → net position

GET /analytics/trends?months=6
  → month-over-month spending trend per category
  → income vs expense balance over time

GET /analytics/budgets
  → budget utilisation: amount spent vs budget cap per category
  → over-budget alerts
```

### Redis caching

Analytics results are cached in Redis with a TTL. The cache is invalidated
when a new transaction is created for that user (via the
`ANALYTICS_NOTIFICATION_QUEUE` consumer in this module).

```
GET analytics/summary for userId X
  │
  Redis HIT → return cached result (TTL: 1h)
  │
  Redis MISS → compute from Postgres → cache → return

New transaction created
  │
  ANALYTICS_NOTIFICATION_QUEUE job arrives
  │
  delete Redis cache key "analytics:{userId}:{period}"
```

---

## Domain 4 — Payment Module (Stripe Webhooks)

### What it does

The payment module has two responsibilities: forwarding checkout/portal/cancel
calls to payment_service, and receiving Stripe webhook events.

### Webhook handling

```
POST /payment/webhook
  │
  verify Stripe-Signature header with STRIPE_WEBHOOK_SECRET
    → reject 400 if invalid
  │
  parse Stripe event type
  │
  enqueue to PAYMENT_QUEUE with appropriate job name:
    checkout.session.completed  → CREATE_CHECKOUT_SESSION_JOB
    invoice.paid                → INVOICE_PAID_JOB
    invoice.payment_failed      → INVOICE_PAYMENT_FAILED_JOB
    customer.subscription.*     → SUBSCRIPTION_* jobs
  │
  return HTTP 200 immediately
  → BullMQ handles the rest asynchronously
```

---

## Domain 5 — Activity Module

### What it does

Maintains a per-user activity feed — a log of significant events like
"Transaction created", "Budget exceeded", "Goal reached". Consumed by the
mobile and web dashboard.

Activity entries are created asynchronously via `ACTIVITY_NOTIFICATION_QUEUE`
which finance_service publishes to after writes. The module consumes the queue
and writes activity rows to Postgres.

---

## Domain 6 — Upload Module

### What it does

Returns a Cloudinary signed upload URL. The client uploads directly to
Cloudinary — no binary data passes through the gateway. The gateway only
generates the signed URL.

```
GET /upload/signature
  │
  generate Cloudinary upload signature (timestamp + CLOUDINARY_URL secret)
  │
  return { signature, timestamp, cloudName, apiKey }
    → client uploads directly to Cloudinary API
    → client receives back the cloudinary URL and stores it
```

---

## Global Configuration

### Rate Limiting

```typescript
ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 10 }] })
```

10 requests per 60 seconds per IP. Applied globally via `ThrottlerGuard`.
Adjust limits per route using `@Throttle()` decorator if specific endpoints
need different limits (e.g. auth endpoints may need stricter limits).

### WebSocket — Socket.io + Redis Adapter

```typescript
// main.ts
const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis();
app.useWebSocketAdapter(redisIoAdapter);
```

The Redis adapter means Socket.io works across multiple api_gateway instances.
Events emitted by one instance are broadcast to all connected clients regardless
of which instance they're connected to.

### Swagger

Available at `/docs` in all environments. Basic auth-protected in production
(`SWAGGER_DOC_USER` / `SWAGGER_DOC_PASS`). All DTOs decorated with
`@ApiProperty` are automatically documented.

---

## Environment Variables

```env
API_GATEWAY_PORT=4001
API_GATEWAY_HOST=0.0.0.0
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
CLOUDINARY_URL=cloudinary://...
CLOUDINARY_SIGNATURE_EXPIRATION=600
SWAGGER_DOC_USER=...
SWAGGER_DOC_PASS=...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SECRET_KEY=sk_...
MONO_SECRET_KEY=...
MONO_WEBHOOK_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SERVICE_HOST / AUTH_SERVICE_PORT
PAYMENT_SERVICE_HOST / PAYMENT_SERVICE_PORT
NOTIFICATION_SERVICE_HOST / NOTIFICATION_SERVICE_PORT
```

---

## Implementation Order

### Step 1 — Auth Module

Build first. Without auth, no other module is accessible. Wire
`JwtAuthGuard` globally and `@Public()` decorators on auth endpoints.

Deliverable: register → login → JWT → all subsequent calls authenticated.

### Step 2 — Category + User Modules

Build early. Categories are a prerequisite for transactions, budgets, and
recurring items. User module is needed for profile display.

### Step 3 — Transaction + Finance Modules

Build after finance_service is ready. Wire `BatchCreateTransactions` for
the Mono sync path. Build budget, recurring, goal, split in parallel.

### Step 4 — Analytics Module

Build after transactions exist so there is real data to aggregate.

### Step 5 — Account Module (Mono)

Build after the transaction module is complete since it depends on
`BatchCreateTransactions`.

### Step 6 — Payment + Webhooks

Build after payment_service is ready. Wire Stripe webhook endpoint and
BullMQ publishing.

### Step 7 — Activity, Upload, FCM, Usage

Build these alongside or after the main feature modules — they are support
modules that don't block core functionality.

---

## What to Ignore (Non-Goals)

- **GraphQL API** — mobile currently uses REST; GraphQL layer is not implemented
- **API versioning** — no `/v1/` prefix; breaking changes handled via deprecation
- **Request signing** — service-to-service calls use gRPC metadata, not HMAC
- **Response caching at gateway level** — caching is per-module (analytics Redis)
  not a blanket gateway cache
