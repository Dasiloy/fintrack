# FinTrack — Smart Personal Finance Management

FinTrack is a production-grade personal finance platform built for the Nigerian market, providing deep spending insights, bank account synchronisation, AI-powered categorisation, and automated recurring transaction processing.

---

## 👑 Chief Contributor

| ![dasiloy](https://avatars.githubusercontent.com/dasiloy?v=4&s=150) |
| :-----------------------------------------------------------------: |
|              **[dasiloy](https://github.com/dasiloy)**              |
|                    _Lead Architect / Developer_                     |

---

## 🏗️ Architecture & Tech Stack

FinTrack is a **Turborepo monorepo** with a NestJS API Gateway sitting in front of six gRPC microservices. All async work is handled through **BullMQ** queues backed by Upstash Redis.

### System Overview

```mermaid
graph TD
    subgraph Client
        W[Next.js Web<br/>React + tRPC]
    end

    subgraph Gateway
        W -->|REST / tRPC| GW[API Gateway<br/>NestJS · port 4001]
    end

    subgraph Microservices gRPC
        GW -->|gRPC| AS[Auth Service<br/>port 4002]
        GW -->|gRPC| FS[Finance Service<br/>port 4003]
        GW -->|gRPC| AIS[AI Service<br/>port 4004]
        GW -->|gRPC| SS[Scheduler Service<br/>port 4005]
        GW -->|gRPC| PS[Payment Service<br/>port 4008]
        GW -->|gRPC| NS[Notification Service<br/>port 4009]
    end

    subgraph Async BullMQ
        GW -->|queue| MQ[(Redis / BullMQ)]
        MQ --> SS
        MQ --> NS
    end

    subgraph Storage
        FS --> DB[(Aiven PostgreSQL<br/>Prisma ORM)]
        AS --> DB
        PS --> DB
        GW --> RD[(Upstash Redis<br/>Cache · Rate-limit)]
    end

    subgraph External
        GW -->|webhook| MONO[Mono Bank API]
        GW -->|webhook| STRIPE[Stripe]
        NS -->|email| MAIL[Mailtrap / SMTP]
        NS -->|push| FCM[Firebase FCM]
        AIS -->|LLM| AI[OpenAI · Anthropic<br/>Google Gemini]
    end
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | Turborepo, pnpm Workspaces |
| **Web** | Next.js 15, React Server Components, Tailwind CSS, tRPC, TanStack Query |
| **API Gateway** | NestJS (REST + Swagger), BullMQ, Passport JWT |
| **Microservices** | NestJS, gRPC (protoc-gen-ts_proto) |
| **Database** | Aiven PostgreSQL, Prisma ORM |
| **Cache / Queues** | Upstash Redis, BullMQ |
| **AI** | OpenAI, Anthropic Claude, Google Gemini |
| **Bank Sync** | Mono Connect (Nigerian banks) |
| **Payments** | Stripe Checkout + Billing Portal |
| **Push** | Firebase Cloud Messaging (FCM) |
| **Email** | Mailtrap (dev) / SMTP provider (prod), Handlebars templates |
| **Auth** | NextAuth v5, Google OAuth, TOTP 2FA, OTP email verification |
| **File Uploads** | Cloudinary |

---

## 🎯 Features

- 🔐 **Authentication** — Email/password, Google OAuth, OTP email verification, TOTP 2FA, device fingerprinting, session management with max-2 device limit.
- 💸 **Transaction Tracking** — Manual entry, OCR receipt scanning, bank sync, recurring auto-creation, and split-expense transactions. Each transaction carries a human-readable `sourceId` (`TXN-YYMMDD-XXXXXX` / `BNK-...` / `REC-...`) and a JSON `sourceData` audit blob.
- 🏦 **Bank Sync (Mono)** — Link Nigerian bank accounts via Mono Connect. Webhooks trigger paginated transaction imports with token-based + AI fallback categorisation.
- 🤖 **AI Categorisation** — Two-pass pipeline: token-scoring against category tag sets, then an LLM batch call for unresolved transactions. Correction feedback loop retrains the classifier on user overrides.
- 📊 **Budgets** — Per-category budgets with carry-over support, alert thresholds, and period tracking (monthly / quarterly / yearly).
- 🎯 **Savings Goals** — Target amount + date goals with contribution tracking, goal-status auto-evaluation, and linked transactions.
- 🔄 **Recurring Items** — Scheduler-driven (BullMQ, hourly) recurring income/expense creation with deterministic idempotency keys, email summaries, and end-date deactivation.
- 🤝 **Bill Splitting** — Create splits, add participants, record settlement payments, and track per-participant balances.
- 💳 **Subscriptions** — Stripe Checkout for PRO plan upgrades, Stripe Billing Portal for self-service management, and gated usage limits enforced at the API layer.
- 🔔 **Notifications** — FCM push notifications + transactional emails (verification, password reset, recurring summaries, budget alerts).

---

## 📂 Project Structure

```text
fintrack/
├── apps/
│   ├── api_gateway/          # NestJS REST gateway (Swagger, BullMQ producers, FCM)
│   ├── auth_service/         # gRPC — JWT auth, OAuth, 2FA, OTP, sessions
│   ├── finance_service/      # gRPC — transactions, budgets, goals, splits, recurring, categories
│   ├── ai_service/           # gRPC — transaction classification, AI insights, chat
│   ├── scheduler_service/    # gRPC + BullMQ — recurring transaction processor
│   ├── payment_service/      # gRPC — Stripe checkout & webhook handling
│   ├── notification_service/ # gRPC — email (Handlebars) + FCM push
│   └── web/                  # Next.js 15 web application
├── packages/
│   ├── database/             # Prisma schema, migrations, generated client
│   ├── common/               # Shared guards, decorators, interceptors, service config
│   ├── types/                # Proto-generated TypeScript types + shared interfaces
│   ├── utils/                # Shared utilities — date parsing, sourceId generators, recurring logic
│   ├── ui/                   # Shared React component library (Radix + Tailwind)
│   ├── next_auth/            # NextAuth v5 configuration
│   ├── react_query/          # TanStack Query client setup
│   └── trpc_app/             # tRPC router + type-safe client
└── docs/                     # Architecture guides, API contracts, feature deep-dives
```

---

## 📜 Documentation

### Architecture & Services

- [System Architecture](docs/ARCHITECTURE.md)
- [API Gateway](docs/API-GATEWAY.md)
- [Auth Service](docs/AUTH-SERVICE.md)
- [Finance Service](docs/FINANCE-SERVICE.md)
- [AI Service](docs/AI-SERVICE.md)
- [Payment Service](docs/PAYMENT-SERVICE.md)
- [Scheduler Service](docs/SCHEDULER-SERVICE.md)
- [Notification Service](docs/NOTIFICATION-SERVICE.md)

### Features & Flows

- [Features & DSA Mapping](docs/FEATURES.md)
- [Transaction Creation Flow](docs/TRANSACTION-CREATION-FLOW.md)
- [Transaction Auto-Categorisation](docs/TOKENIZATION.md)

### Security & Integrations

- [OAuth Setup](docs/OAUTH.md)
- [2FA / TOTP](docs/2FA-TOTP.md)
- [Stripe & Subscriptions](docs/STRIPE.md)

### Frontend

- [Design System & UI/UX](docs/DESIGN-SYSTEM.md)
- [UI Engineering Guidelines](docs/UI.md)

### Deployment & Operations

- [Render Deployment](docs/RENDER.md)

### Reference

- [Case Study & Business Value](docs/CASE-STUDY.md)
- [API Contract Template](docs/API-CONTRACT-TEMPLATE.json)
- [Backlog & Bug Tracker](docs/BACKLOG.md)

---

## 🚀 Developer Onboarding

### 1. Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Node.js | 18.x LTS or later | https://nodejs.org or `nvm install --lts` |
| pnpm | 9.x | `npm install -g pnpm@9` |
| Git | any recent | https://git-scm.com |

```bash
node -v   # v18.x or higher
pnpm -v   # 9.x
git --version
```

---

### 2. External Services

Create a free account for each service below and collect the credentials — you will paste them into your `.env` files in step 4.

#### Aiven PostgreSQL (primary database)

All services share one Postgres database via Prisma. The Aiven free tier allows **16 concurrent connections** — the pool allocation is pre-configured per service in each `.env.example`.

1. Sign up at https://console.aiven.io (free tier, no credit card for trial).
2. Create a new **PostgreSQL** service (choose the region closest to you).
3. Go to **Connection Info** and copy the **Service URI** (pooled).
4. Format: `postgresql://user:password@host:port/dbname?sslmode=require`
5. Also copy the **CA Certificate** (Base64) → `DATABASE_CA_CERTIFICATE`.

#### Upstash Redis (cache, rate limiting, BullMQ queues)

1. Sign up at https://upstash.com (free tier).
2. Create a **Redis** database.
3. **Details** tab → copy the `REDIS_URL` field.
4. Must start with `rediss://` (TLS) — plain `redis://` will be rejected by Upstash.

#### Google OAuth (social login)

1. https://console.cloud.google.com → **APIs & Services → Credentials → Create OAuth 2.0 Client ID**.
2. Application type: **Web application**.
3. Authorised redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy **Client ID** → `AUTH_GOOGLE_ID`, **Client secret** → `AUTH_GOOGLE_SECRET`.

#### Mailtrap (transactional email — dev)

Captures emails in a sandbox so nothing reaches real inboxes during development.

1. Sign up at https://mailtrap.io (free tier).
2. **Email API → API Tokens** → generate a token for your sandbox inbox.
3. Copy the token → `MAIL_TOKEN`.

#### Cloudinary (file uploads)

Profile pictures and receipt attachments are stored in Cloudinary.

1. Sign up at https://cloudinary.com (free tier).
2. Dashboard → **Cloud name** → `CLOUDINARY_ID`.

#### Stripe (subscriptions)

1. Sign up at https://dashboard.stripe.com.
2. **Developers → API keys** → copy the secret key → `STRIPE_SECRET_KEY`.
3. Create a **Product** with a monthly price → copy the Price ID → `STRIPE_PRO_MONTHLY_PRICE_ID`.
4. **Developers → Webhooks** → add a local endpoint via `stripe listen` → copy the signing secret → `STRIPE_WEBHOOK_SECRET`.

#### Mono Connect (Nigerian bank sync)

Required to link and sync Nigerian bank accounts.

1. Sign up at https://mono.co (developer account).
2. **Settings → API Keys** → copy the **Secret Key** → `MONO_SECRET_KEY`.
3. **Settings → Webhooks** → add your gateway URL → copy the webhook secret → `MONO_WEBHOOK_SECRET`.

#### Firebase (FCM push notifications)

1. https://console.firebase.google.com → create a project.
2. **Project Settings → Service Accounts** → generate a new private key → download the JSON file.
3. Set `FIREBASE_SERVICE_ACCOUNT` to the stringified JSON (or a path, depending on your setup).
4. **Project Settings → General → Web Push certificates** → copy the VAPID key → `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

#### AI (transaction classification)

The AI service supports OpenAI, Anthropic, and Google Gemini — set whichever you have access to.

- `OPENAI_API_KEY` — https://platform.openai.com
- `ANTHROPIC_API_KEY` — https://console.anthropic.com
- `GOOGLE_GEN_AI_API_KEY` — https://aistudio.google.com

---

### 3. Clone & Install

```bash
git clone https://github.com/dasiloy/fintrack.git
cd fintrack
pnpm install
```

`pnpm install` installs all workspace dependencies in a single pass.

---

### 4. Environment Setup

FinTrack uses a two-level env cascade:

- **Root `.env`** — shared variables (database, Redis, JWT, OAuth, service hosts/ports).
- **Per-app `.env`** — service-specific overrides (service name, email credentials, AI keys).

```bash
# Root (shared by all services)
cp .env.example .env

# Per-app
cp apps/api_gateway/.env.example          apps/api_gateway/.env
cp apps/auth_service/.env.example         apps/auth_service/.env
cp apps/finance_service/.env.example      apps/finance_service/.env
cp apps/ai_service/.env.example           apps/ai_service/.env
cp apps/scheduler_service/.env.example    apps/scheduler_service/.env
cp apps/notification_service/.env.example apps/notification_service/.env
cp apps/payment_service/.env.example      apps/payment_service/.env
cp apps/web/.env.example                  apps/web/.env
cp packages/database/.env.example         packages/database/.env
```

Open the root `.env` and fill in every value using the credentials from step 2.

**Generating secrets locally:**

```bash
# JWT / NextAuth secrets (use a unique value for each)
openssl rand -base64 48

# AES encryption key for 2FA secrets (must be exactly 64 hex chars)
openssl rand -hex 32
```

---

### 5. Database Setup

```bash
# Generate the Prisma client and build shared packages first
pnpm --filter @fintrack/database exec prisma generate
pnpm build

# Run migrations to create the schema
pnpm --filter @fintrack/database exec prisma migrate dev --name init
```

---

### 6. Running the Project

```bash
pnpm dev
```

Turborepo starts all services in parallel and streams their logs. Once ready:

| Service | Port | URL |
|---|---|---|
| Web App (Next.js) | 3000 | http://localhost:3000 |
| API Gateway (REST) | 4001 | http://localhost:4001 |
| Swagger UI | 4001 | http://localhost:4001/api/docs |
| Auth Service (gRPC) | 4002 | gRPC only |
| Finance Service (gRPC) | 4003 | gRPC only |
| AI Service (gRPC) | 4004 | gRPC only |
| Scheduler Service (gRPC) | 4005 | gRPC only |
| Payment Service (gRPC) | 4008 | gRPC only |
| Notification Service (gRPC) | 4009 | gRPC only |

Swagger is protected by HTTP basic auth. Credentials are `SWAGGER_DOC_USER` / `SWAGGER_DOC_PASS` in `apps/api_gateway/.env` (defaults: `fintrack` / `developer`).

---

### 7. Running Individual Services

```bash
pnpm --filter api_gateway          dev
pnpm --filter auth_service         dev
pnpm --filter finance_service      dev
pnpm --filter ai_service           dev
pnpm --filter scheduler_service    dev
pnpm --filter payment_service      dev
pnpm --filter notification_service dev
pnpm --filter web                  dev
```

---

### 8. Useful Commands

All commands run from the **repo root**.

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps and services in watch mode |
| `pnpm build` | Build every app and package for production |
| `pnpm lint` | Run ESLint across the entire monorepo |
| `pnpm check-types` | TypeScript type-check across the entire monorepo |
| `pnpm --filter @fintrack/types proto:gen` | Regenerate TypeScript types from all `.proto` files |
| `pnpm --filter @fintrack/database exec prisma generate` | Regenerate Prisma client after schema changes |
| `pnpm --filter @fintrack/database exec prisma migrate dev` | Run pending migrations |
| `pnpm docker:prod` | Start the full production stack with Docker Compose |

---

### 9. Common Issues

**`MODULE_NOT_FOUND` referencing proto files**

TypeScript types are generated from `.proto` source files. Regenerate them:

```bash
pnpm --filter @fintrack/types proto:gen && pnpm build
```

**Prisma client errors (`Cannot find module '.prisma/client'`)**

The Prisma client is generated locally and is not committed to the repo:

```bash
pnpm --filter @fintrack/database exec prisma generate
```

**Stale `dist/` types in `@fintrack/utils`**

If you see TypeScript errors like "Expected 0 arguments, got 1" after changing a util function, rebuild the package:

```bash
pnpm --filter @fintrack/utils build
```

**Port already in use**

```bash
npx kill-port 4001   # or whichever port is blocked
```

**Redis TLS errors**

Upstash requires TLS. `REDIS_URL` must start with `rediss://` (two `s`). A plain `redis://` URL will fail.

**Aiven DB connection pool exhausted**

The free tier allows 16 total connections. The default pool allocation across all services sums to ~13, leaving headroom for migrations and ad-hoc queries. If you add services, adjust `DB_POOL_MAX` in each service's `.env` to stay within the limit.

---

Copyright © 2026 [dasiloy](https://github.com/dasiloy)
