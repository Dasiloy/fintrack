# Fintrack: High-Level Architecture

Fintrack is a professional financial platform designed for high performance and long-term scaling. This document describes our technical setup, how components talk to each other, and where we apply advanced engineering patterns.

---

## 🗺️ System Topology (Simplified)

The diagram below shows how our **Gateway** acts as the central brain, talking to specialized **Microservices** to handle requests from our Web and Mobile apps.

```text
┌─────────────────────────────────────────────────────────────┐
│                   FINTRACK MONOREPO (TURBO)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐        ┌──────────────┐                  │
│   │   apps/web   │        │ apps/gateway │                  │
│   │   (Next.js)  │        │   (NestJS)   │                  │
│   └──────┬───────┘        └──────┬───────┘                  │
│          │                       │                          │
│          │       ┌───────────────┴───────────────┐          │
│          ├──────▶│          packages/            │          │
│          │       │  ┌─────────────────────────┐  │          │
│          │       │  │ @fintrack/ui (Styles)   │  │          │
│          │       │  │ @fintrack/api (Types)   │  │          │
│          │       │  │ @fintrack/db (Prisma)   │  │          │
│          │       │  └─────────────────────────┘  │          │
│          │       └───────────────────────────────┘          │
│          │                                                  │
│   ┌──────▼───────┐                                          │
│   │   mobile/    │◀────── [Separate Build Tooling]          │
│   │  (Flutter)   │                                          │
│   └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
┌───────────────────┐               ┌───────┴─────────────────┐
│ NEXT.js FRONTEND  │               │ FLUTTER MOBILE APP      │
│ (Vercel)          │               │ (iOS/Android)           │
└─────────┬─────────┘               └───────┬─────────────────┘
          │                                 │
          │ [tRPC (HTTP)]                   │ [GraphQL]
          ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  API GATEWAY (NestJS Master)                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  The Hub: Handles Security, Auth Checks, and Buffering  │ │
│ └────────────────────────────┬────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────┘
                               │
               [ gRPC (Binary / Blazing Fast) ]
                               │
       ┌───────────────────────┴────────────────────────────────┐
       ▼             ▼             ▼             ▼              ▼
┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐
│ AUTH SERVICE││ TRANS SERV  ││ BUDGET SERV ││ PAYMENT SERV││ AI SERVICE  │
└──────┬──────┘└──────┬──────┘└──────┬──────┘└──────┬──────┘└──────┬──────┘
       ▼             ▼             ▼             ▼              ▼
┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐
│ SOCIAL SERV ││ NOTIFY SERV ││ MEDIA SERV  ││ REPORT SERV ││             │
└──────┬──────┘└──────┬──────┘└──────┬──────┘└──────┬──────┘└──────┘
       │              │              │              │
       └──────────────┴──────┬───────┴──────────────┘
                             ▼
                      ┌─────────────┐
                      │ NEON DB     │
                      │ (Postgres)  │
                      └─────────────┘
```

---

## 📁 Workspace Folder Structure

The Fintrack monorepo is organized to separate high-level applications from shared business logic and configurations.

```text
FINTRACK-MONOREPO/
├── apps/                       # Deployable Applications
│   ├── web/                    # Next.js 15+ Frontend (Vercel)
│   ├── gateway/                # NestJS API Gateway (tRPC + GraphQL)
│   ├── auth-service/           # Auth, Roles, Profiles
│   ├── trans-service/          # Ledger & Core Transaction Logic
│   ├── budget-service/         # Budgeting & Savings Goals (DSA)
│   ├── payment-service/        # Subscriptions & External Integrations
│   ├── ai-service/             # Insights, Auto-categorization
│   ├── social-service/         # Friends System, Bill Splitting (DSA)
│   ├── notification-service/   # Push, Email, In-app Alerts
│   ├── media-service/          # Receipt Uploads (Cloudinary Integration)
│   └── report-service/         # PDF Generation (BullMQ + Puppeteer)
├── packages/                   # Shared Business Intelligence
│   ├── ui/                     # Shared React Components
│   ├── types/                  # Shared TS Interfaces (Cross-service)
│   ├── database/                     # Prisma Schema & Neon Connection
│   ├── utils/                  # Shared DSA helpers (Formatting, Logic)
│   ├── typescript-config/      # Base TS configs
│   └── eslint-config/          # Base Linting rules
├── mobile/                     # Flutter Mobile App
│   └── fintrack_mobile/        # Managed via Dart/Pub workflows
└── ...                         # Root configs (turbo.json, pnpm-workspace)
```

---

## 📱 Flutter Monorepo Strategy

| Topic             | Strategy                  | Outcome                                    |
| :---------------- | :------------------------ | :----------------------------------------- |
| **Orchestration** | `postinstall` script      | `pnpm install` triggers `flutter pub get`. |
| **Build Flow**    | Path-specific CI triggers | JS and Flutter graphs remain isolated.     |
| **Publishing**    | Fastlane integration      | Automated releases via `mobile/` source.   |

### Contract-First Code Sharing

```text
      [ SOURCE OF TRUTH ] (Prisma / TypeScript)
               │
       ┌───────┴───────┐
       ▼               ▼
 ┌───────────┐   ┌───────────┐
 │ BACKEND   │   │  MOBILE   │
 ├───────────┤   ├───────────┤
 │ TS Type   │<─>│ Dart Class│
 └─────┬─────┘   └─────┬─────┘
       ▼               ▼
 [  NestJS  ]    [  Flutter ]
```

---

## 🛠️ The Tech Breakdown

### 1. Entry Points & Routing

| Layer             | Tech                  | Logic                                           |
| :---------------- | :-------------------- | :---------------------------------------------- |
| **Web Dashboard** | Next.js 15+ (tRPC)    | Type-safe SSR & Optimized Optimistic UI.        |
| **Mobile App**    | Flutter (GraphQL)     | Efficient fetches for high-latency connections. |
| **API Gateway**   | NestJS (Orchestrator) | Handles Security, Auth, and gRPC Translation.   |

### 2. Standalone Microservices

Each service in `apps/` is a dedicated NestJS app Scaleable-by-Design.

| Service   | transports  | Core Responsibility                              |
| :-------- | :---------- | :----------------------------------------------- |
| **Auth**  | gRPC / HTTP | Identity, 2FA, Session Revocation (Upstash).     |
| **Trans** | gRPC        | Double-Entry Ledger, Budget Checks, Imports.     |
| **AI**    | gRPC        | Vercel AI SDK (Server) + Transformers.js (Edge). |

### 3. Communication & Persistence

```text
    [ EXTERNAL ]             [ INTERNAL ]             [ STORAGE ]
 tRPC / GraphQL / SSE       gRPC (Protobuf)          Neon / Upstash
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  API GATEWAY │───────▶ │ MICROSERVICES│───────▶ │ PERSISTENCE  │
└──────────────┘         └──────────────┘         └──────────────┘
```

---

## 🧬 Performance Strategy

| Problem             | DSA Solution          | Implementation                                     |
| :------------------ | :-------------------- | :------------------------------------------------- |
| **Debt Settling**   | Min-Cash-Flow (Graph) | Simplifies N-way peer debts into min payments.     |
| **Budget Checks**   | Interval Trees        | Efficiently checking overlapping date constraints. |
| **Background Jobs** | Priority Queues       | Tier-based processing for report generation.       |
| **Consistency**     | Double-Entry Ledger   | Mathematical auditability for every transaction.   |

---

## 🚀 Deployment Overview

| Component            | Platform | Pipeline                                        |
| :------------------- | :------- | :---------------------------------------------- |
| **Frontend/Web**     | Vercel   | Automatic CI on push to `main`.                 |
| **Backend Services** | Render   | Docker Swarm (Independent scaling per service). |
| **Database (SQL)**   | Neon     | Serverless Postgres (Branching enabled).        |
| **Cache / Queue**    | Upstash  | Serverless Redis (BullMQ support).              |
| **Mobile**           | Stores   | Fastlane (TestFlight / Play Store).             |
