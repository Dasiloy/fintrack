# FinTrack - Smart Personal Finance Management

FinTrack is a comprehensive, learning-focused personal finance management solution designed to provide users with deep insights into their spending habits through modern architecture and advanced algorithms.

---

## 👑 Chief Contributor

| ![dasiloy](https://avatars.githubusercontent.com/dasiloy?v=4&s=150) |
| :-----------------------------------------------------------------: |
|              **[dasiloy](https://github.com/dasiloy)**              |
|                    _Lead Architect / Developer_                     |

---

## 🏗️ Architecture & Tech Stack

FinTrack is built as a highly scalable **Monorepo** using **Turborepo**, ensuring a shared source of truth for types, logic, and UI components across web, mobile, and backend.

### **System Overview**

```mermaid
graph TD
    subgraph Client
    A[Next.js Web<br/>React + RSC] --- tRPC
    B[Expo Mobile<br/>React Native] --- GQL
    end

    subgraph Gateway
    tRPC --> GW[API Gateway<br/>NestJS]
    GQL --> GW
    end

    subgraph Services
    GW --- |gRPC| S1[Auth Service]
    GW --- |gRPC| S2[Transaction Service]
    GW --- |gRPC| S3[Budget Service]
    end

    subgraph Storage
    S1 --- P[Prisma ORM]
    S2 --- P
    S3 --- P
    P --- DB[(PostgreSQL)]
    end
```

### **Tech Stack**

- **Monorepo**: Turborepo, PNPM Workspaces
- **Web**: Next.js 14, React Server Components, Tailwind CSS, Jotai
- **Mobile**: Expo (React Native), Apollo Client, GraphQL
- **API Gateway**: NestJS (tRPC, GraphQL, REST)
- **Microservices**: NestJS, gRPC
- **Database**: PostgreSQL (Neon), Prisma ORM
- **AI/ML**: Vercel AI SDK, TensorFlow.js

---

## 🎯 Key Features

- 🔐 **Unified Authentication**: Session-based auth with "Max 2" session limit. Supporting Web (NextAuth) and Mobile (JWT).
- 💸 **Transaction Tracking**: Manual income/expense entry with category auto-suggestion and evidence attachment.
- 📊 **Deep Analytics**: Line, bar, and pie charts for spending distribution and trend analysis.
- 🎯 **Budgeting**: Set limits per category with progress tracking and threshold alerts.
- 🔄 **Recurring Bills**: Managed via Cron jobs with push notification reminders.
- 🤝 **Bill Splitting**: Network-based debt management using the **MinCashFlow (Greedy)** algorithm for simplified settlements.
- 💰 **Savings Goals**: Track milestones with linear regression for completion prediction.
- 📄 **PDF Reports**: Professionally formatted monthly spending and budget vs. actual reports.
- 💳 **Premium Tier**: Stripe-integrated subscription management for advanced features.

---

## 📂 Project Structure

```text
fintrack/
├── apps/
│   ├── api_gateway/    # NestJS Gateway (tRPC/GraphQL proxy)
│   ├── auth_service/   # Core Auth logic (gRPC)
│   ├── payment_service/# Transaction/Split logic (gRPC)
│   └── web/            # Next.js web application
│   ├── mobile/          # Expo mobile application
├── packages/
│   ├── database/       # Prisma schema & Database service
│   ├── common/         # Shared Guards, Decorators & Config
│   ├── types/          # Generated Protobuf & Shared Interface types
│   └── ui/             # Shared Design System components
└── docs/               # Technical guides and journey logs
```

---

## 🎓 Learning Objectives

This project is built to master:

1.  **Microservices Architecture**: Service discovery, gRPC communication, and Gateway patterns.
2.  **DSA in Real World**: Implementing Graph algorithms (MinCashFlow) and Statistical models for financial predictions.
3.  **Modern Web/Mobile**: Reactive state management, Type-safe client-server communication, and Server-side rendering.

---

## 📜 Documentation

For more detailed guides, check the `docs/` folder:

- [System Architecture](docs/ARCHITECTURE.md)
- [Features & DSA Mapping](docs/FEATURES.md)
- [Design System & UI/UX](docs/DESIGN-SYSTEM.md)
- [Build Journey Log](docs/BUILD-JOURNEY.md)
- [Case Study & Business Value](docs/CASE-STUDY.md)
- [OAuth Setup](docs/OAUTH.md)
- [2FA / TOTP](docs/2FA-TOTP.md)
- [Stripe & Subscriptions](docs/STRIPE.md)
- [Render Deployment](docs/RENDER.md)
- [API Contract Index](docs/API-CONTRACT-TEMPLATE.json)
- [Backlog & Bug Tracker](docs/BACKLOG.md)

---

## 🚀 Getting Started (Developer Onboarding)

This guide walks a developer through setting up FinTrack on a fresh machine from scratch.

---

### 1. Prerequisites

Make sure the following tools are installed before continuing.

| Tool    | Minimum Version | Install                                                         |
| ------- | --------------- | --------------------------------------------------------------- |
| Node.js | 18.x or later   | https://nodejs.org (use the LTS release) or `nvm install --lts` |
| pnpm    | 9.x             | `npm install -g pnpm@9`                                         |
| Git     | any recent      | https://git-scm.com                                             |

Verify your versions:

```bash
node -v   # should print v18.x or higher
pnpm -v   # should print 9.x
git --version
```

---

### 2. External Services Setup

FinTrack depends on several third-party services. Create a free account for each one below, then collect the credentials — you will paste them into your `.env` files in the next step.

#### Aiven PostgreSQL (primary database)

Used by all backend services via Prisma ORM.

1. Sign up at https://neon.tech (free tier, no credit card required).
2. Create a new project (any name, choose the region closest to you).
3. Go to **Connection Details** and copy the **Pooled connection** string.
4. It looks like: `postgresql://user:password@host/dbname?sslmode=require`
5. This becomes your `DATABASE_URL`.
6. Copy the pem file

#### Upstash Redis (session store / cache)

Used by the API Gateway for rate limiting and session management.

1. Sign up at https://upstash.com (free tier).
2. Create a **Redis** database (choose a region, keep defaults).
3. Open the database → **Details** tab → copy the `REDIS_URL` field.
4. It starts with `rediss://` (double-s = TLS). Keep it in that format.
5. This becomes your `REDIS_URL`.

#### Google OAuth (social login)

Used by NextAuth to let users sign in with their Google account.

1. Go to https://console.cloud.google.com.
2. Create a project (or use an existing one).
3. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
4. Application type: **Web application**.
5. Add an Authorised redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy the **Client ID** → `AUTH_GOOGLE_ID`
7. Copy the **Client secret** → `AUTH_GOOGLE_SECRET`

#### Mailtrap (transactional email — development only)

Used by the Notification Service to send OTP codes and welcome emails. Mailtrap captures emails in a sandbox so they never reach real inboxes during development.

1. Sign up at https://mailtrap.io (free tier).
2. Go to **Email API → API Tokens** and generate a token for your sandbox inbox.
3. Copy the token → `MAIL_TOKEN`

#### Cloudinary (media / file uploads)

Used for profile picture uploads and transaction receipt attachments.

1. Sign up at https://cloudinary.com (free tier).
2. On your **Dashboard**, find the **Cloud name** at the top.
3. Copy it → `CLOUDINARY_ID`

---

### 3. Clone & Install

```bash
git clone https://github.com/dasiloy/fintrack.git
cd fintrack
pnpm install
```

`pnpm install` runs from the repo root and installs dependencies for every app and package in the monorepo simultaneously.

---

### 4. Environment Setup

FinTrack uses a **two-level env cascade**:

- **Root `.env`** — shared variables used by all services (database URL, Redis URL, JWT secrets, service ports, etc.).
- **Per-app `.env`** — service-specific variables that override or extend the root values.

Both files are loaded automatically when you run any app.

**Step-by-step:**

```bash
# 1. Root env (shared by everything)
cp .env.example .env

# 2. Per-app envs
cp apps/api_gateway/.env.example      apps/api_gateway/.env
cp apps/auth_service/.env.example     apps/auth_service/.env
cp apps/notification_service/.env.example apps/notification_service/.env
cp apps/payment_service/.env.example  apps/payment_service/.env
cp apps/web/.env.example              apps/web/.env
cp apps/mobile/.env.example           apps/mobile/.env
cp packages/database/.env.example     packages/database/.env
```

Now open the root `.env` and fill in the real values you collected in step 2. The comments in each file explain exactly what each variable is and how to generate it.

**Generating secrets locally:**

```bash
# JWT secrets (use a unique value for each one)
openssl rand -base64 48

# AES encryption key (must be exactly 64 hex chars)
openssl rand -hex 32
```

---

### 5. Database Setup

Run Prisma migrations to create the database schema in your Neon project:

```bash
pnpm db:generate --filter @fintrack/database && pnpm build
pnpm db:migrate --name init --filter @fintrack/database
```

---

### 6. Running the Project

Start every service at once using Turborepo:

```bash
pnpm dev
```

Turborepo runs all services in parallel and streams their logs to your terminal. Once everything is ready, the following URLs are available:

| Service                     | Port | URL                            |
| --------------------------- | ---- | ------------------------------ |
| Web App (Next.js)           | 3000 | http://localhost:3000          |
| API Gateway (NestJS)        | 4001 | http://localhost:4001          |
| Swagger UI                  | 4001 | http://localhost:4001/api/docs |
| Auth Service (gRPC)         | 4002 | gRPC only (no HTTP UI)         |
| Payment Service (gRPC)      | 4008 | gRPC only (no HTTP UI)         |
| Notification Service (gRPC) | 4009 | gRPC only (no HTTP UI)         |

The Swagger UI is protected by HTTP basic auth. The default credentials (for local dev) are set by `SWAGGER_DOC_USER` / `SWAGGER_DOC_PASS` in `apps/api_gateway/.env`.

---

### 7. Running Individual Services

To start only one service (useful when iterating on a single app):

```bash
# Replace <name> with the package name from that app's package.json
pnpm --filter @fintrack/api-gateway dev
pnpm --filter @fintrack/auth-service dev
pnpm --filter @fintrack/notification-service dev
pnpm --filter @fintrack/payment-service dev
pnpm --filter @fintrack/web dev
```

> Tip: check each app's `package.json` for its exact `"name"` field if the filter does not match.

---

### 8. Useful Commands

All commands below are run from the **repo root**.

| Command            | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `pnpm dev`         | Start all apps and services in development mode (watch mode) |
| `pnpm build`       | Build every app and package for production                   |
| `pnpm lint`        | Run ESLint across the entire monorepo                        |
| `pnpm check-types` | Run TypeScript type-checking across the entire monorepo      |
| `pnpm proto:gen`   | Regenerate TypeScript types from all `.proto` files          |
| `pnpm db:generate` | Regenerate the Prisma client (run after schema changes)      |
| `pnpm db:migrate`  | Run pending Prisma migrations against the database           |
| `pnpm docker:prod` | Start the full production stack with Docker Compose          |

---

### 9. Common Issues

**`MODULE_NOT_FOUND` errors referencing proto files**

The TypeScript types for gRPC are generated from `.proto` source files. If they are missing or stale, regenerate them:

```bash
pnpm proto:gen && pmpm build
```

**Prisma client errors (`Cannot find module '.prisma/client'` or similar)**

The Prisma client is generated locally and is not committed to the repo. Regenerate it:

```bash
pnpm db:generate
```

**Port already in use**

Another process is listening on one of the ports listed in the table above. Find and stop it:

```bash
npx kill-port [portnumber]
```

**Redis connection refused or TLS errors**

Upstash requires TLS. Make sure your `REDIS_URL` starts with `rediss://` (two s's), not `redis://`. A plain `redis://` URL will fail against Upstash.

run through the api_gateway and backend_services, all microservices

ensure that for all controllers, we have an updated oc.json file, with updated endpoint documentation,

also ensure all endpoints, all services, controlllers and functions are prpoerly documented based on my standard sepecifcations as you see in example documentations in those services and controlollers

DO NOT EDIT ANY FILE that does not fall in this category
DO NOT EDIT any lock file or change dependencies

You can remove unused imports if any oinly if you are sure that those imports are realkly unused

THIS IS BASICALLY A CLEANUP Process do not break any functionality or edit files you are not sure of

Instructions for api doc template is in docs folder in the api-contract-template.json file

---

Copyright © 2026 [dasiloy](https://github.com/dasiloy)

// mono
// users hould be able to connect bank,
// re-connect or sync bank
// get transactions details from the bank
