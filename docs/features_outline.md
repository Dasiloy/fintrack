# Fintrack: Features Outline

This document provides a comprehensive breakdown of the functional scope of the Fintrack ecosystem.

---

## 🔐 Authentication & Identity

Fintrack uses a hybrid authentication strategy to support both web and mobile platforms securely.

### Hybrid Auth Flow

```text
┌──────────────┐         ┌────────────────┐         ┌──────────────┐
│     USER     │         │ WEB (NextAuth) │         │ AUTH SERVICE │
└──────┬───────┘         └───────┬────────┘         └───────┬──────┘
       │                         │                          │
       │     [1] Login (Google)  │                          │
       ├────────────────────────▶│                          │
       │                         │      [2] Validate        │
       │                         ├─────────────────────────▶│
       │                         │                          │      ┌────────────┐
       │                         │                          ├─────▶│ UPSTASH RD │
       │                         │                          │      └────────────┘
       │                         │      [3] JWT Issued      │
       │                         │◀─────────────────────────┤
       │                         │                          │
       │                         │                          │
┌──────────────┐         ┌────────────────┐         ┌───────┴──────┐
│     USER     │         │ MOBILE (Social)│         │ AUTH SERVICE │
└──────┬───────┘         └───────┬────────┘         └───────┬──────┘
       │                         │                          │
       │   [1] Biometric/Social  │                          │
       ├────────────────────────▶│                          │
       │                         │    [2] Token Exchange    │
       │                         ├─────────────────────────▶│
       │                         │                          │      ┌────────────┐
       │                         │                          ├─────▶│ UPSTASH RD │
       │                         │                          │      └────────────┘
       │                         │      [3] System JWT      │
       │                         │◀─────────────────────────┤
```

- **NextAuth.js**: Primary session management for Web.
- **Native Social Auth**: Biometric-enabled social login for Flutter.
- **Upstash Redis**: Global session revocation (kill switch).

---

## ⚙️ Microservice Ecosystem

| Service     | Responsibility                 | Key Tech           |
| :---------- | :----------------------------- | :----------------- |
| **Auth**    | Identity, 2FA, RBAC            | NestJS, NextAuth   |
| **Trans**   | Ledger, Double-Entry Logic     | gRPC, Prisma       |
| **Budget**  | Limit Enforcement, Projections | DSA, Upstash       |
| **Payment** | Stripe, Billing, Entitlements  | Stripe SDK         |
| **AI**      | Insights, Chat, Categorization | Vercel AI SDK      |
| **Social**  | Bill Splitting, Friends        | Min-Cash-Flow Algo |
| **Notify**  | Push (FCM), Email (MailTrap)   | Firebase           |
| **Media**   | Receipt Storage                | Cloudinary         |
| **Report**  | PDF Generation                 | Puppeteer, BullMQ  |

---

## 🤖 AI & Intelligence

Fintrack implements a unique hybrid AI strategy to balance power and privacy.

### AI Data Privacy Flow

```text
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  MOBILE DEVICE   │       │   BROWSER LLM    │       │   AI SERVICE     │
│  (Raw Data)      │─────▶ │ (Transformers.js)│─────▶ │ (Vercel AI SDK)  │
└──────────────────┘       └────────┬─────────┘       └────────┬─────────┘
                                    │                          │
                                    │    [1] REDACT PII        │    [2] PROCESS
                                    │    (Device Local)        │    (Cloud LLM)
                                    ▼                          ▼
                           ┌──────────────────┐       ┌──────────────────┐
                           │ ANONYMIZED DATA  │◀──────│ FINANCE INSIGHT  │
                           └──────────────────┘       └──────────────────┘
```

- **Vercel AI SDK**: Powering the **Pulse Chat** assistant with streaming responses.
- **Transformers.js**: Running locally on the client to mask sensitive data (names, account numbers) before it ever leaves the device.

---

## 🤝 Social & Group Finance

Managing shared expenses using advanced graph algorithms.

### Debt Settlement (Social Service)

- **Min-Cash-Flow Algorithm**: Reduces the number of transactions needed to settle group debts.
- **Example**: If A owes B $10 and B owes C $10, the system automatically redirects A to pay C directly.

---

## 🛠️ Performance & Scalability

- **Turborepo**: Remote caching and workspace-aware builds.
- **Double-Entry Bookkeeping**: A mathematically sound ledger in the `trans-service`.
- **BullMQ**: Background processing for PDF generation, ensuring zero UI lag during exports.

---

## 🔒 Security & Privacy

- **Audit Logs**: Immutable history of sensitive account changes.
- **Logical Encapsulation**: Domain isolation within a shared Neon Postgres instance via Prisma models.
- **End-to-End Type Safety**: Shared TypeScript packages across Web, Mobile (via schema generators), and Backend.
