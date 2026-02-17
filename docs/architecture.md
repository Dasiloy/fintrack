# FinTrack - Architecture & Tech Stack

**Purpose:** Simple, learning-focused architecture for building FinTrack web (Next.js) and mobile (Expo) apps  
**Design:** Dark mode with glassmorphism effects

---

## 🏗️ System Overview

```
┌─────────────────┐      ┌─────────────────┐
│   Next.js Web   │      │   Expo Mobile   │
│  (React + RSC)  │      │ (React Native)  │
└────────┬────────┘      └────────┬────────┘
         │                        │
      [tRPC]                  [GraphQL]
      [HTTP]                   [HTTP]
         │                        │
         └────────┬───────────────┘
                  │
         ┌────────▼────────┐
         │  NestJS Backend │
         │                 │
         │  ├─ tRPC        │
         │  ├─ tRPC     │
         │  └─ HTTP/REST   │
         └────────┬────────┘
                  │
            [Prisma ORM]
                  │
          ┌──────▼──────┐
          │ PostgreSQL  │
          └─────────────┘
```

**NestJS Modules:**

- Auth Module: Authentication, user management, sessions
- Users Module: User profiles, settings
- Transactions Module: Transactions, categories, receipts
- Budgets Module: Budget tracking, analytics, recurring bills
- Splits Module: Bill splitting, settlements
- Goals Module: Savings goals tracking
- Subscriptions Module: Stripe payments, premium features, webhooks
- Upload Module: File uploads (Cloudinary integration)
- Notifications Module: SSE, push notifications

---

## 🎯 Communication Protocols

| From               | To       | Protocol                 | Why                                                    |
| ------------------ | -------- | ------------------------ | ------------------------------------------------------ |
| **Next.js Client** | NestJS   | **tRPC**                 | Type-safe CRUD, auto-complete, React Query integration |
| **Next.js Server** | NestJS   | **tRPC** (server caller) | Type-safe business logic calls                         |
| **Next.js Server** | Next.js  | **tRPC** (local)         | Quick Prisma queries, env vars                         |
| **Next.js**        | NestJS   | **HTTP/REST** (proxy)    | File uploads, SSE, streaming                           |
| **Expo Mobile**    | NestJS   | **GraphQL**              | Flexible queries, efficient mobile data                |
| **Expo Mobile**    | NestJS   | **HTTP/REST**            | File uploads, standard REST                            |
| **External**       | NestJS   | **HTTP/REST**            | Webhooks (Stripe, etc.)                                |
| **NestJS**         | Database | **Prisma**               | Type-safe ORM                                          |

> **📖 See [communication-architecture.md](./communication-architecture.md) for detailed implementation guide**

**Key Decisions:**

- **tRPC** serves Next.js web app (client + server components)
- **GraphQL** serves Expo mobile app exclusively
- **HTTP/REST** for file uploads, SSE, streaming, and webhooks
- **Next.js tRPC server** for Prisma queries in server components (minimal use)

---

## 💻 Frontend

### **Web: Next.js 14**

**Features:**

- React Server Components (RSC)
- Server Actions
- App Router
- Streaming UI

**State:** Jotai (atomic state)  
**Data:** tRPC client  
**Styling:** Tailwind CSS (dark mode)  
**UI:** Manrope font, glassmorphism effects

---

### **Mobile: Expo (React Native)**

**Features:**

- Cross-platform (iOS/Android)
- Native performance
- Camera, biometrics (via expo-local-authentication)
- Shared TypeScript types with web

**State:** Apollo Client (GraphQL caching)  
**Data:** GraphQL queries/mutations  
**Styling:** React Native StyleSheet / NativeWind  
**UI:** Expo components, native feel

**Key Benefits:**

- Share types from `@fintrack/types`
- Share utilities from `@fintrack/utils`
- Flexible queries (fetch only what you need)
- Efficient for mobile bandwidth
- TypeScript/React knowledge transfer
