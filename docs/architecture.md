# FinTrack - Architecture & Tech Stack

**Purpose:** Simple, learning-focused architecture for building FinTrack web (Next.js) and mobile (Flutter) apps  
**Design:** Dark mode with glassmorphism effects

---

## 🏗️ System Overview

```
┌─────────────────┐      ┌─────────────────┐
│   Next.js Web   │      │  Flutter Mobile │
│  (React + RSC)  │      │   (Riverpod)    │
└────────┬────────┘      └────────┬────────┘
         │                        │
      [tRPC]                  [GraphQL]
         │                        │
         └────────┬───────────────┘
                  │
         ┌────────▼────────┐
         │   API Gateway   │
         │    (NestJS)     │
         └────────┬────────┘
                  │
              [gRPC]
                  │
      ┌───────────┼───────────┐
      │           │           │
  ┌───▼───┐   ┌──▼──┐   ┌────▼────┐
  │ Auth  │   │Trans│   │ Budget  │
  │Service│   │Svc  │   │ Service │
  └───┬───┘   └──┬──┘   └────┬────┘
      └──────────┼───────────┘
                 │
            [Prisma ORM]
                 │
          ┌──────▼──────┐
          │ PostgreSQL  │
          └─────────────┘
```

**Microservices:**

- Auth Service: Authentication, user management
- Transaction Service: Transactions, categories, receipts
- Budget Service: Budgets, analytics, recurring bills
- Split Service (Week 8): Bill splitting, settlements
- Goal Service (Week 9): Savings goals tracking
- **Subscription Service (Week 11): Stripe payments, premium features**

---

## 🎯 Communication Protocols

| From        | To            | Protocol | Why                         |
| ----------- | ------------- | -------- | --------------------------- |
| Next.js     | API Gateway   | tRPC     | Type-safe, auto-complete    |
| Flutter     | API Gateway   | GraphQL  | Flexible queries, efficient |
| API Gateway | Microservices | gRPC     | Fast, efficient, typed      |
| Services    | Database      | Prisma   | Type-safe ORM               |

**Direct Database Access:**

- Simple reads (user profile, settings) can use Prisma directly
- Complex business logic must go through microservices

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

### **Mobile: Flutter**

**Features:**

- Cross-platform (iOS/Android)
- Native performance
- Camera, biometrics

**State:** Riverpod  
**Data:** GraphQL (via gql package)  
**UI:** Material Design 3 (dark mode)

---

## 🤖 ML/AI Stack

### **Vercel AI SDK** (Primary)

**For:** Auto-categorization, Financial chatbot

**Features:**

- Smart transaction categorization
- Financial insights chatbot
- Budget recommendations
- React hooks (useChat, useCompletion)
- Streaming responses

---

### **TensorFlow.js** (Learning)

**For:** Spending pattern recognition

**Features:**

- Client-side ML (browser)
- Privacy-friendly
- No API costs
- Spending pattern detection
- Time-based analysis

---

### **Statistical Models**

**Algorithms:** Linear Regression, Standard Deviation, Moving Average, K-Means

**Features:**

- Unusual transaction alerts
- Spending predictions
- Trend analysis

---

## 🔧 Backend

### **API Gateway: NestJS**

**Responsibilities:**

- Route client requests
- Authenticate requests (JWT)
- Forward to appropriate microservice
- REST API routes (webhooks, uploads)

---

### **Microservices: NestJS**

**Pattern:** One service per domain

**Services:**

1. **Auth Service** - User auth, sessions
2. **Transaction Service** - CRUD, categorization
3. **Budget Service** - Budget tracking, analytics
4. **Split Service** - Bill splitting logic
5. **Goal Service** - Savings goals
6. **Subscription Service** - Stripe integration, premium features
   - Handle Stripe webhooks
   - Create checkout sessions
   - Manage user premium status
   - Feature gating logic

**Communication:** gRPC between services

---

### **Database: PostgreSQL (Neon)**

**ORM:** Prisma

**Features:**

- Type-safe queries
- Auto-generated types
- Migration management

**Provider:** Neon (generous free tier)

---

### **Monorepo: Turborepo**

**Structure:**

```
fintrack/
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── app/               # App router pages
│   │   ├── components/        # Web-specific components
│   │   └── lib/               # Web-specific utilities
│   │
│   └── api/                    # NestJS Backend
│       ├── gateway/           # API Gateway
│       │   ├── src/
│       │   │   ├── trpc/      # tRPC endpoints
│       │   │   ├── graphql/   # GraphQL endpoints
│       │   │   └── rest/      # REST endpoints (webhooks)
│       │   └── package.json
│       │
│       └── services/          # Microservices
│           ├── auth/          # Auth Service
│           ├── transaction/   # Transaction Service
│           ├── budget/        # Budget Service
│           ├── split/         # Split Bills Service
│           ├── goal/          # Goals Service
│           └── subscription/  # Subscription/Payment Service
│
├── mobile/                 # Flutter mobile app
│   ├── lib/
│   │   ├── screens/       # Mobile screens
│   │   ├── widgets/       # Mobile widgets
│   │   └── providers/     # Riverpod providers
│   └── pubspec.yaml
│
├── packages/
│   ├── database/              # Prisma + Database utilities
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # Database schema
│   │   │   └── migrations/    # DB migrations
│   │   ├── src/
│   │   │   ├── client.ts      # Prisma client
│   │   │   └── seed.ts        # Seed data
│   │   └── package.json
│   │
│   ├── types/                 # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── user.ts        # User types
│   │   │   ├── transaction.ts # Transaction types
│   │   │   ├── budget.ts      # Budget types
│   │   │   ├── goal.ts        # Goal types
│   │   │   ├── split.ts       # Split types
│   │   │   ├── subscription.ts # Subscription types
│   │   │   └── index.ts       # Export all
│   │   └── package.json
│   │
│   ├── ui/                    # Shared React components
│   │   ├── src/
│   │   │   ├── button.tsx     # Button component
│   │   │   ├── card.tsx       # Card component
│   │   │   ├── input.tsx      # Input component
│   │   │   ├── chart.tsx      # Chart components
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── src/
│   │   │   ├── formatters/    # Date, currency formatters
│   │   │   ├── validators/    # Input validation
│   │   │   ├── constants/     # App constants
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── helpers/               # Business logic helpers
│   │   ├── src/
│   │   │   ├── budget-calc.ts       # Budget calculations
│   │   │   ├── split-algo.ts        # Split bill algorithm
│   │   │   ├── goal-tracker.ts      # Goal progress
│   │   │   ├── category-helper.ts   # Category utilities
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── api-client/            # API client libraries
│   │   ├── src/
│   │   │   ├── trpc/          # tRPC client setup
│   │   │   ├── graphql/       # GraphQL client setup
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── config/                # Shared configuration
│   │   ├── eslint/            # ESLint configs
│   │   ├── typescript/        # TS configs
│   │   └── tailwind/          # Tailwind config
│   │
│   └── auth/                  # Auth utilities
│       ├── src/
│       │   ├── jwt.ts         # JWT helpers
│       │   ├── session.ts     # Session management
│       │   └── index.ts
│       └── package.json
│
├── turbo.json                 # Turborepo config
├── package.json               # Root package.json
└── pnpm-workspace.yaml        # PNPM workspace config
```

**Benefits:**

- Shared code across web, mobile, and backend
- Type-safe imports with TypeScript
- Coordinated deploys
- Single source of truth for types and business logic
- Easier testing and maintenance

---

## 🔐 Authentication Flow

```
1. User logs in (web/mobile)
2. NextAuth.js (web) or secure storage (mobile)
3. JWT token issued
4. Every request includes token
5. API Gateway validates token
6. Passes user context to microservices
```

**Libraries:**

- Web: NextAuth.js
- Mobile: flutter_secure_storage + JWT

---

## 🚀 External Services

**Required:**
| Service | Purpose | Free Tier |
|---------|---------|-----------|
| PostgreSQL (Neon) | Database | 500MB |
| Cloudinary | Image storage | 25GB |
| MailTrap | Emails | 100/day |
| Vercel | Web hosting | Unlimited |
| Render | API hosting | 750hrs/mo |
| Firebase | Push notifications | Spark plan |
| Stripe | Payments | Test mode free |
| OpenAI | AI/ML (via Vercel AI SDK) | $5 credit |

**Optional:**

- Sentry (error tracking)
- Tesseract.js (OCR - client-side, free)

---

## 📊 Data Fetching Patterns

### **When to Use Direct Prisma vs Microservices**

| Use Direct Prisma | Use Microservice       |
| ----------------- | ---------------------- |
| Simple user data  | Transaction management |
| Profile updates   | Budget calculations    |
| Settings          | Bill splitting         |
| Read-only stats   | Recurring logic        |
| No business logic | Has validation/rules   |

**Rule:** If it's just fetching/updating data → Prisma. If it has logic → Microservice.

---

### **Flutter Mobile Data Fetching**

- Uses GraphQL exclusively
- No direct database access
- All requests → API Gateway → Microservices

---

## 📚 Learning Path

**Weeks 1-2:** Next.js + tRPC basics  
**Weeks 3-4:** Microservices + gRPC  
**Weeks 5-10:** Build all core features  
**Week 11:** Advanced features (Stripe, PDF)  
**Week 12:** Testing & deployment  
**Week 13:** AI Integration (Vercel AI SDK)  
**Week 14:** Advanced ML (TensorFlow.js)

---

## 🎓 What You'll Master

**Frontend:**

- React Server Components
- Client/Server composition
- State management (Jotai, Riverpod)
- Mobile development (Flutter)

**Backend:**

- Microservices architecture
- gRPC communication
- API design (tRPC, GraphQL)
- Database modeling (Prisma)

**DevOps:**

- Monorepo management (Turborepo)
- Deployment (Vercel, Render)
- CI/CD basics

**Integrations:**

- Payment processing (Stripe)
- File storage (Cloudinary)
- Email (MailTrap)
- Push notifications (Firebase)

**AI/ML:**

- Large Language Models (Vercel AI SDK)
- Prompt engineering
- Client-side ML (TensorFlow.js)
- Neural networks
- Statistical analysis
- Anomaly detection

---

**Focus:** Learn modern patterns through building a real app. Simple architecture, deep understanding. 🚀
