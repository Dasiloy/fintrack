# Communication Architecture

**Last Updated:** 2026-02-16  
**Purpose:** Define how Next.js (web), Expo (mobile), and NestJS (backend) communicate

---

## 🎯 Overview

FinTrack uses **three communication protocols** optimized for different clients:

| Protocol      | Client      | Use Case                                |
| ------------- | ----------- | --------------------------------------- |
| **tRPC**      | Next.js Web | Type-safe CRUD, business logic          |
| **GraphQL**   | Expo Mobile | Flexible queries, efficient mobile data |
| **HTTP/REST** | Both        | File uploads, SSE, streaming, webhooks  |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (Port 3000)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Client Components (Browser):                                │
│  └─ tRPC Client → NestJS tRPC (CRUD, business logic)        │
│                                                               │
│  Server Components (Next.js Server):                         │
│  ├─ tRPC Server Caller #1 → NestJS tRPC (business logic)    │
│  └─ tRPC Server Caller #2 → Next.js tRPC (Prisma, env)      │
│                                                               │
│  Next.js API Routes:                                         │
│  ├─ /api/trpc/[trpc] → Local Next.js tRPC server            │
│  ├─ /api/upload → Proxy to NestJS HTTP                      │
│  └─ /api/sse → Proxy to NestJS HTTP                         │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/WebSocket
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 NestJS Backend (Port 4001)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  /trpc/*          → tRPC Module (CRUD, business logic)       │
│  /graphql         → GraphQL Module (Expo mobile)             │
│  /api/upload      → HTTP Controller (file uploads)           │
│  /api/sse         → HTTP Controller (server-sent events)     │
│  /webhooks/*      → HTTP Controller (external webhooks)      │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Prisma ORM
                         ▼
                  ┌──────────────┐
                  │  PostgreSQL  │
                  └──────────────┘
                         ▲
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    Expo Mobile                               │
│                                                               │
│  └─ GraphQL Client → NestJS GraphQL (flexible queries)      │
│  └─ HTTP Client → NestJS HTTP (uploads, etc.)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📡 Communication Protocols

### **1. tRPC (Next.js ↔ NestJS)**

#### **Purpose**

- Type-safe CRUD operations
- Business logic calls
- Real-time type checking
- Auto-complete in IDE

#### **When to Use tRPC**

- ✅ CRUD operations (create, read, update, delete)
- ✅ Business logic calls
- ✅ Type-safe data fetching
- ❌ File uploads (use HTTP)
- ❌ Streaming data (use HTTP/SSE)
- ❌ External webhooks (use HTTP)

---

### **2. GraphQL (Expo ↔ NestJS)**

#### **Purpose**

- Flexible mobile queries
- Efficient data fetching (request only needed fields)
- Reduce over-fetching and under-fetching
- Strong typing with code generation

#### **Why GraphQL for Mobile?**

- **Bandwidth efficiency**: Mobile networks are slower/more expensive
- **Flexible queries**: Fetch exactly what you need in one request
- **Offline-first**: Works well with Apollo Client caching
- **Evolving schema**: Add fields without breaking existing queries

#### **Setup**

**NestJS GraphQL Resolver:**

```typescript
// apps/api_gateway/src/graphql/resolvers/users.resolver.ts
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UsersService } from '@/users/users.service';
import { User } from './types/user.type';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => User)
  async me(@Context() ctx) {
    return this.usersService.findById(ctx.user.id);
  }

  @Mutation(() => User)
  async updateProfile(@Args('name') name: string, @Context() ctx) {
    return this.usersService.update(ctx.user.id, { name });
  }
}
```

**Expo Mobile Component:**

```typescript
// apps/mobile/src/components/UserProfile.tsx
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      email
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String!) {
    updateProfile(name: $name) {
      id
      name
    }
  }
`;

export function UserProfile() {
  const { data } = useQuery(GET_ME);
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  return (
    <Button onPress={() => updateProfile({ variables: { name: 'New Name' } })}>
      Update {data?.me?.name}
    </Button>
  );
}
```

#### **When to Use GraphQL**

- ✅ All Expo mobile data fetching
- ✅ Complex nested queries
- ✅ Selective field fetching
- ✅ Real-time subscriptions (future)
- ❌ File uploads (use HTTP)

---

### **3. HTTP/REST (Both ↔ NestJS)**

#### **Purpose**

- File uploads (multipart/form-data)
- Server-sent events (SSE)
- Streaming responses
- External webhooks
- Third-party integrations

#### **When to Use HTTP/REST**

- ✅ File uploads (images, PDFs, receipts)
- ✅ Server-sent events (real-time notifications)
- ✅ Streaming responses (large data)
- ✅ Webhooks (Stripe, external services)
- ✅ Public APIs (no tRPC/GraphQL client)

---

## 🔄 Communication Flow Examples

### **Example 1: User Profile Update (Next.js Client)**

```
1. User clicks "Update Profile" button
2. Client Component calls: trpc.users.updateProfile.mutate({ name: 'John' })
3. tRPC Client sends: POST http://localhost:4001/trpc/users.updateProfile
4. NestJS tRPC Module routes to UsersRouter.updateProfile
5. UsersService.update() executes business logic
6. Prisma updates database
7. Response flows back with full TypeScript types
8. Client component re-renders with new data
```

### **Example 2: Mobile Transaction List (Expo)**

```
1. User opens transactions screen
2. Expo calls GraphQL query: getTransactions(limit: 20)
3. Apollo Client sends: POST http://localhost:4001/graphql
4. NestJS GraphQL resolver processes query
5. TransactionsService fetches data
6. GraphQL returns only requested fields
7. Expo deserializes to TypeScript models
8. UI renders transaction list
```

### **Example 3: File Upload (Expo)**

```
1. User selects photo from camera/gallery
2. Expo calls: uploadAvatar(fileUri)
3. FormData sent: POST http://localhost:4001/api/upload/avatar
4. NestJS UploadController processes file
5. Cloudinary stores file
6. URL returned to Expo
7. UI displays uploaded image
```

---

## 🎯 Decision Matrix

| Scenario                      | Protocol          | Why                                    |
| ----------------------------- | ----------------- | -------------------------------------- |
| Next.js client CRUD           | tRPC (NestJS)     | Type safety, DX                        |
| Next.js server business logic | tRPC (NestJS)     | Centralized logic                      |
| Expo data fetching            | GraphQL (NestJS)  | Flexible queries, bandwidth efficiency |
| File uploads (both)           | HTTP (NestJS)     | Multipart handling                     |
| External webhooks             | HTTP (NestJS)     | No client needed                       |
| Real-time notifications       | SSE/HTTP (NestJS) | Long-lived connections                 |

---

## ✅ Best Practices

### **tRPC (Web)**

- ✅ Use for all web CRUD operations
- ✅ Use Zod for input/output validation
- ✅ Enable batching for performance
- ❌ Don't use for file uploads

### **GraphQL (Mobile)**

- ✅ Use for all Expo data fetching
- ✅ Use fragments for reusable fields
- ✅ Generate TypeScript types from schema
- ✅ Use DataLoader to prevent N+1 queries
- ✅ Leverage Apollo Client caching

### **HTTP/REST**

- ✅ Use for file uploads, SSE, webhooks
- ✅ Forward cookies/auth headers properly
- ❌ Don't use for standard CRUD (use tRPC/GraphQL)

---

## 🔐 Authentication

All protocols use the same authentication strategy:

**Flow:**

1. User logs in via NextAuth.js (web) or JWT (mobile)
2. Session cookie or JWT token issued
3. Every request includes credentials
4. NestJS validates and extracts user context
5. User context passed to services

**Implementation:**

- tRPC (web): Cookies forwarded via `credentials: 'include'`
- GraphQL (mobile): JWT in Authorization header
- HTTP: Cookies or Authorization header

---

**Summary:** Three protocols (tRPC + GraphQL + HTTP), one backend, optimized for each client! 🚀
