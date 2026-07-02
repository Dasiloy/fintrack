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
        FS --> DB[(PostgreSQL<br/>Prisma ORM)]
        AS --> DB
        PS --> DB
        GW --> RD[(Upstash Redis<br/>Cache · Rate-limit)]
    end

    subgraph External
        GW -->|webhook| MONO[Mono Bank API]
        GW -->|webhook| PAYSTACK[PayStack]
        NS -->|email| MAIL[Mailtrap / SMTP]
        NS -->|push| FCM[Firebase FCM]
        AIS -->|LLM| AI[OpenAI · Anthropic<br/>Google Gemini]
    end
```

### Tech Stack

| Layer              | Technology                                                              |
| ------------------ | ----------------------------------------------------------------------- |
| **Monorepo**       | Turborepo, pnpm Workspaces                                              |
| **Web**            | Next.js 15, React Server Components, Tailwind CSS, tRPC, TanStack Query |
| **API Gateway**    | NestJS (REST + Swagger), BullMQ, Passport JWT                           |
| **Microservices**  | NestJS, gRPC (protoc-gen-ts_proto)                                      |
| **Database**       | PostgreSQL, Prisma ORM                                                  |
| **Cache / Queues** | Upstash Redis, BullMQ                                                   |
| **AI**             | OpenAI, Anthropic Claude, Google Gemini                                 |
| **Bank Sync**      | Mono Connect (Nigerian banks)                                           |
| **Payments**       | Paystack Checkout + Billing Portal                                      |
| **Push**           | Firebase Cloud Messaging (FCM)                                          |
| **Email**          | Mailtrap (dev) / SMTP provider (prod), Handlebars templates             |
| **Auth**           | NextAuth v5, Google OAuth, TOTP 2FA, OTP email verification             |
| **File Uploads**   | Cloudinary                                                              |

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
- 💳 **Subscriptions** — Paystack Checkout for PRO plan upgrades, self-service billing management, and gated usage limits enforced at the API layer.
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
│   ├── payment_service/      # gRPC — Paystack checkout & webhook handling
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

## 🛠️ Service Overviews

### API Gateway (`apps/api_gateway` · port 4001)

The single HTTP entry point for all clients. Not a pass-through proxy — it owns Prisma directly for modules that do not need a dedicated microservice and is responsible for all real-time Socket.io connections.

- **14 feature modules** behind a unified NestJS server — REST + tRPC; Swagger UI at `/api/docs`
- Every request passes: `ThrottlerGuard` (10 req/60s) → `DeviceMiddleware` → `JwtAuthGuard` (validates token via gRPC to `auth_service`) → `ValidationPipe`
- Handles Mono bank-link and Paystack payment webhooks over HTTP
- Real-time analytics and activity feeds via Socket.io

### Auth Service (`apps/auth_service` · gRPC port 4002)

Sole owner of identity — no other service performs authentication logic. All services delegate via gRPC.

- Registration (bcrypt hash, Prisma transaction: User + Subscription + UsageTrackers) → OTP email verification → login → JWT access + refresh token pair
- Google OAuth via NextAuth v5; TOTP 2FA with per-device session management (max 2 active sessions)
- All auth-lifecycle emails (verification, password reset, welcome) go through BullMQ — never direct SMTP

### Finance Service (`apps/finance_service` · gRPC port 4003)

Source of truth for all financial data. Five gRPC modules, all protected by `RpcAuthGuard` (validates `userId` from gRPC metadata).

- **Transactions** — CRUD + `BatchCreateTransactions` for Mono bank sync (single `createMany`; idempotency via `(userId, source, sourceId)` unique constraint)
- **Budgets** — per-category with carry-over, alert thresholds, period tracking
- **Goals** — target-amount + date savings goals with contribution history
- **Recurring** — income/expense templates that the scheduler materialises hourly
- **Splits** — multi-participant expense splitting with per-participant settlement tracking

### Scheduler Service (`apps/scheduler_service` · gRPC port 4005)

No HTTP or gRPC endpoints — runs entirely on its own clock; never called by other services.

| Cron        | Job                    | What it does                                                     |
| ----------- | ---------------------- | ---------------------------------------------------------------- |
| `0 3 * * *` | Account Cleanup        | Hard-deletes users past `scheduledDeletionAt`; cascades all rows |
| `0 * * * *` | Recurring Transactions | Creates all recurring items that are due in the current hour     |
| `0 1 1 * *` | Usage Reset            | Resets monthly AI usage counters on the first of each month      |

### Notification Service (`apps/notification_service` · gRPC port 4009)

No HTTP or gRPC endpoints — entirely queue-driven via BullMQ. Callers publish and return immediately; BullMQ handles retries on SMTP failures.

- `TOKEN_NOTIFICATION_QUEUE` → auth-lifecycle emails: verification, welcome, password flows, recurring summaries
- `PAYMENT_QUEUE` → subscription billing emails
- Handlebars templates; Mailtrap sandbox in dev, sending API in prod (switched by `NODE_ENV`)

### Payment Service (`apps/payment_service` · gRPC port 4008)

Single boundary between the system and Paystack. No other service touches the Paystack API directly.

- Checkout session creation, billing portal, webhook verification, and subscription state sync
- Subscription status drives all feature gating across services via `UsageService`

### AI Service (`apps/ai_service` · gRPC port 4004)

Two-pass transaction categorisation pipeline (token scoring → LLM batch fallback), AI insights generation, and chat. See [AI-SERVICE.md](docs/AI-SERVICE.md) for the full deep-dive.

---

## 🗄️ Database Migration Strategy

Three environments: local dev, staging, and production. Migrations are applied automatically by GitHub Actions — never run manually against staging or production.

**Creating a migration locally** (after editing `packages/database/prisma/schema.prisma`):

```bash
pnpm --filter @fintrack/database exec prisma migrate dev --name describe_your_change
pnpm --filter @fintrack/database exec prisma generate
```

**Automated deployment:**

| Branch push | Secret used            | What happens                            |
| ----------- | ---------------------- | --------------------------------------- |
| `staging`   | `STAGING_DATABASE_URL` | `prisma migrate deploy` → staging DB    |
| `main`      | `PROD_DATABASE_URL`    | `prisma migrate deploy` → production DB |

**Golden rule — additive migrations only.** Migrations run in parallel with Railway's code deploy. Old code must stay functional against the new schema during the deploy window. Safe in one release: add nullable column, add column with `DEFAULT`, add new table/index/enum value. Requires two releases: drop column, rename column, change column type, add `NOT NULL` without a default.

---

## 🎨 Design System

Dark mode glassmorphism aesthetic. Primary typeface is **Manrope** (Google Fonts). Tailwind utility classes throughout — no inline style tokens in components.

### Color Tokens

| Token          | Hex       | Use                            |
| -------------- | --------- | ------------------------------ |
| Primary        | `#7C7AFF` | Buttons, accents               |
| Success        | `#00D9A5` | Positive values, income        |
| Error          | `#FF6B6B` | Expenses, over-budget alerts   |
| Warning        | `#FFB020` | Budget warnings, pending state |
| Background     | `#0F0F14` | Page background                |
| Elevated       | `#18181D` | Raised surfaces                |
| Surface        | `#1C1C23` | Cards, panels                  |
| Text Primary   | `#FFFFFF` | Headings                       |
| Text Secondary | `#B4B4C0` | Body text                      |
| Text Tertiary  | `#8B8B98` | Captions, labels               |
| Text Disabled  | `#5A5A68` | Disabled / placeholder         |

### Type Scale

| Level    | Size | Weight      |
| -------- | ---- | ----------- |
| H1       | 32px | 700 (Bold)  |
| H2       | 24px | 700 (Bold)  |
| H3       | 20px | 600         |
| Body     | 14px | 400         |
| Caption  | 12px | 400         |
| Overline | 11px | 600 (upper) |

---

## 📜 Documentation

- [AI Service Deep-Dive](docs/AI-SERVICE.md)
- [Paystack Payments & Free Trial](docs/PAYSTACK-PAYMENTS.md)
- [Backlog & Bug Tracker](docs/BACKLOG.md)

---

## 🚀 Developer Onboarding

### 1. Prerequisites

| Tool    | Minimum Version   | Install                                     |
| ------- | ----------------- | ------------------------------------------- |
| Node.js | 18.x LTS or later | <https://nodejs.org> or `nvm install --lts` |
| pnpm    | 9.x               | `npm install -g pnpm@9`                     |
| Git     | any recent        | <https://git-scm.com>                       |

```bash
node -v   # v18.x or higher
pnpm -v   # 9.x
git --version
```

---

### 2. External Services

Create a free account for each service below and collect the credentials — you will paste them into your `.env` files in step 4.

#### PostgreSQL (primary database)

All services share one Postgres database via Prisma. Use any hosted Postgres provider (Railway, Neon, Supabase, etc.).

1. Create a PostgreSQL database on your provider of choice.
2. Copy the connection string from your provider's dashboard.
3. Format: `postgresql://user:password@host:port/dbname`

#### Upstash Redis (cache, rate limiting, BullMQ queues)

1. Sign up at <https://upstash.com> (free tier).
2. Create a **Redis** database.
3. **Details** tab → copy the `REDIS_URL` field.
4. Must start with `rediss://` (TLS) — plain `redis://` will be rejected by Upstash.

#### Google OAuth (social login)

1. Go to <https://console.cloud.google.com> → **APIs & Services → Credentials → Create OAuth 2.0 Client ID**.
2. Application type: **Web application**.
3. Authorised redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy **Client ID** → `AUTH_GOOGLE_ID`, **Client secret** → `AUTH_GOOGLE_SECRET`.

#### Mailtrap (transactional email — dev)

Captures emails in a sandbox so nothing reaches real inboxes during development.

1. Sign up at <https://mailtrap.io> (free tier).
2. **Email API → API Tokens** → generate a token for your sandbox inbox.
3. Copy the token → `MAIL_TOKEN`.

#### Cloudinary (file uploads)

Profile pictures and receipt attachments are stored in Cloudinary.

1. Sign up at <https://cloudinary.com> (free tier).
2. Dashboard → **Cloud name** → `CLOUDINARY_ID`.

#### Paystack (subscriptions)

1. Sign up at <https://dashboard.paystack.com>.
2. **Settings → API Keys & Webhooks** → copy the secret key → `PAYSTACK_SECRET_KEY`, public key → `PAYSTACK_PUBLISHABLE_KEY`.
3. **Products → Plans** → create a monthly Pro plan → copy the Plan Code → `PAYSTACK_PRO_MONTHLY_PRICE_ID`.
4. **Settings → API Keys & Webhooks** → add your gateway webhook URL and copy the signing secret → `PAYSTACK_WEBHOOK_SECRET`.

#### Mono Connect (Nigerian bank sync)

Required to link and sync Nigerian bank accounts.

1. Sign up at <https://mono.co> (developer account).
2. **Settings → API Keys** → copy the **Secret Key** → `MONO_SECRET_KEY`.
3. **Settings → Webhooks** → add your gateway URL → copy the webhook secret → `MONO_WEBHOOK_SECRET`.

#### Firebase (FCM push notifications)

1. Go to <https://console.firebase.google.com> → create a project.
2. **Project Settings → Service Accounts** → generate a new private key → download the JSON file.
3. Set `FIREBASE_SERVICE_ACCOUNT` to the stringified JSON (or a path, depending on your setup).
4. **Project Settings → General → Web Push certificates** → copy the VAPID key → `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

#### AI (transaction classification)

The AI service supports OpenAI, Anthropic, and Google Gemini — set whichever you have access to.

- `OPENAI_API_KEY` — <https://platform.openai.com>
- `ANTHROPIC_API_KEY` — <https://console.anthropic.com>
- `GOOGLE_GEN_AI_API_KEY` — <https://aistudio.google.com>

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

### 6. Seed Demo Data

The seed script populates your account with 6 months of realistic Nigerian financial data so every feature in the app is immediately usable — no manual data entry required.

#### What gets seeded

| Entity            | Count | Details                                                   |
| ----------------- | ----- | --------------------------------------------------------- |
| System categories | 10    | Food, Transport, Bills, Entertainment, etc.               |
| Merchants         | 69    | Nigerian brands used by the AI classifier                 |
| Transactions      | 42    | Income + expenses across Nov 2025 – May 2026              |
| Budgets           | 6     | Monthly, quarterly, and yearly with limit-change history  |
| Goals             | 5     | ACTIVE, ON_HOLD, and COMPLETED with monthly contributions |
| Recurring items   | 10    | Salary, rent, subscriptions (all frequencies)             |
| Activity logs     | 20    | Timeline of key events shown in the dashboard feed        |

#### Steps

1. Sign up at [http://localhost:3000/signup](http://localhost:3000/signup) and verify your email.

2. Add your email to the root `.env`:

   ```env
   SEED_USER_EMAIL=your@email.com
   ```

3. Run the seed:

   ```bash
   pnpm --filter @fintrack/database db:seed
   ```

The seed is **idempotent** — running it a second time is safe. Each section checks for existing records and skips if data already exists for your account. If `SEED_USER_EMAIL` is not set, or no account matches the email, the script exits immediately with a clear error message.

> **Fixture files** live in `packages/database/prisma/json/`. Each entity type has its own JSON file. Modify them before running the seed to customise the demo data.

---

### 7. Running the Project

```bash
pnpm dev
```

Turborepo starts all services in parallel and streams their logs. Once ready:

| Service                     | Port | URL                              |
| --------------------------- | ---- | -------------------------------- |
| Web App (Next.js)           | 3000 | <http://localhost:3000>          |
| API Gateway (REST)          | 4001 | <http://localhost:4001>          |
| Swagger UI                  | 4001 | <http://localhost:4001/api/docs> |
| Auth Service (gRPC)         | 4002 | gRPC only                        |
| Finance Service (gRPC)      | 4003 | gRPC only                        |
| AI Service (gRPC)           | 4004 | gRPC only                        |
| Scheduler Service (gRPC)    | 4005 | gRPC only                        |
| Payment Service (gRPC)      | 4008 | gRPC only                        |
| Notification Service (gRPC) | 4009 | gRPC only                        |

---

### 8. Running Individual Services

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

### 9. Useful Commands

All commands run from the **repo root**.

| Command                                                    | Description                                         |
| ---------------------------------------------------------- | --------------------------------------------------- |
| `pnpm dev`                                                 | Start all apps and services in watch mode           |
| `pnpm build`                                               | Build every app and package for production          |
| `pnpm lint`                                                | Run ESLint across the entire monorepo               |
| `pnpm check-types`                                         | TypeScript type-check across the entire monorepo    |
| `pnpm --filter @fintrack/types proto:gen`                  | Regenerate TypeScript types from all `.proto` files |
| `pnpm --filter @fintrack/database exec prisma generate`    | Regenerate Prisma client after schema changes       |
| `pnpm --filter @fintrack/database exec prisma migrate dev` | Run pending migrations                              |
| `pnpm docker:prod`                                         | Start the full production stack with Docker Compose |

---

### 10. Common Issues

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

#### Port already in use

```bash
npx kill-port 4001   # or whichever port is blocked
```

#### Redis TLS errors

Upstash requires TLS. `REDIS_URL` must start with `rediss://` (two `s`). A plain `redis://` URL will fail.

#### DB connection pool exhausted

Check the connection limit for your Postgres provider. The default pool allocation across all services sums to ~13 (`DB_POOL_MAX` across each service's `.env`). If you add services or hit connection errors, lower `DB_POOL_MAX` on low-traffic services to stay within your provider's limit.

---

Copyright © 2026 [dasiloy](https://github.com/dasiloy)
