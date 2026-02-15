# Complete Authentication Guide

This document serves as the comprehensive guide for the Fintrack authentication system. It covers the architecture, session management policy, JWT strategy, and implementation guides for both Next.js and Flutter clients.

## 1. Core Architecture

### 1.1 Unified Token-Based Authentication

Our system uses a **Stateless Access Token** + **Stateful Refresh Token** approach.

- **Access Token (JWT)**:
  - **Lifespan**: Short (e.g., 15 minutes).
  - **Payload**: `sub` (userId), `email`, `role`, `iat`, `exp`.
  - **Validation**: Stateless check by API Gateway (signature verification).
- **Refresh Token (Opaque/Hashed)**:
  - **Lifespan**: Long (e.g., 7 days).
  - **Storage**: Hashed in `Session` table in Database.
  - **Usage**: Exchanged for a new Access Token when the old one expires.
  - **Control**: Revocable by deleting the row from DB.

### 1.2 "Max 2 Sessions" Policy

To prevent account sharing and manage security, we enforce a strict limit of **2 active sessions** per user.

**The Algorithm (on Login/Refresh):**

1.  **Count** active sessions for `userId`.
2.  If `count >= 2`:
    - **Identify** the oldest session (based on `lastActive` or `createdAt`).
    - **Delete** it immediately.
3.  **Create** the new session (or update current one).

---

## 2. JWT System Details

We use standard RS256 or HS256 signing.

### 2.1 Refresh Token Strategy (Rotation & Expiry)

- **Rotation (Sliding Window)**:
  - When a Refresh Token is used, it is **consumed (deleted)**.
  - A **NEW** Refresh Token is issued with a **NEW** 7-day lifespan.
  - **Result**: As long as the user is active at least once every 7 days, they stay logged in indefinitely.
- **Absolute Expiry (Optional)**: Can be added later to force re-login after X months regardless of activity.

### 2.2 Data Mapping (Prisma <-> Proto)

Prisma models and Proto messages are separate contracts. We must map them explicitly to avoid leaks.

- **Why?**: Prisma objects may contain sensitive data (passwordHash) or internal fields not in the Proto definition.
- **Strategy**: Use utility functions (e.g., `mapUserToProto`) to convert Prisma objects to Proto responses.

```typescript
// utils/mappers.ts
function mapUserToProto(user: PrismaUser): ProtoUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    // passwordHash is STRIPPED automatically as it's not in ProtoUser
  };
}
```

### Token Lifecycle

1.  **Login**: User sends credentials -> returns `accessToken` + `refreshToken`.
2.  **API Call**: Client sends `Authorization: Bearer <accessToken>`.
3.  **Expiration**: API Gateway returns `401 Unauthorized` when Access Token expires.
4.  **Refresh**: Client calls `POST /auth/refresh` with `refreshToken`.
    - Server validates refresh token against DB.
    - Server implements **Token Rotation**: Deletes old refresh token, Issues NEW refresh token + NEW access token.
5.  **Logout**: Client calls `POST /auth/logout`. Server deletes session from DB.

---

## 3. BFF Architecture & Data Fetching

We use the **Backend-For-Frontend (BFF)** pattern.

### 3.1 Web BFF (Next.js + tRPC)

**Role**: The Next.js Server acts as the dedicated backend for the Web Client.

- **Client (React)**: Communicates **strictly over HTTP/JSON** with the Next.js Server.
- **Server (Next.js)**: Receives the request, executes business logic, and communicates with the **API Gateway** via **HTTP REST** (or GraphQL).

**End-to-End Flow:**

1.  **Browser**: Sends `POST /api/trpc/auth.login` (JSON payload).
2.  **Next.js Server**: - Intercepts the request in the tRPC Router. - Calls `POST {API_GATEWAY_URL}/auth/login` (REST). - **API Gateway**: Calls `AuthService.Login()` via **gRPC**. - Returns JSON response to Browser.
    **Key Point**: Next.js is just another client of the API Gateway.

### 3.1.1 Workflows Deep Dive

**Scenario A: Client Component (e.g., Login Form)**

1.  **Browser**: User submits form.
2.  **React Hook**: `trpc.auth.login.useMutation()` executes.
3.  **Network**: Sends `POST /api/trpc/auth.login` (JSON payload) to Next.js Server.
4.  **Next.js Router**:
    - Receives request.
    - Calls `POST http://api-gateway:4001/auth/login` (REST).
5.  **API Gateway**:
    - Validates request.
    - Calls `AuthService.Login()` (gRPC).
6.  **Auth Service**: Verifies credentials, generating tokens to return.
7.  **Return Path**: Tokens -> Gateway -> Next.js -> Browser.
8.  **Result**: Browser stores session cookie via NextAuth.

**Scenario B: Server Component (e.g., Profile Page)**

1.  **Browser**: User navigates to `/dashboard`.
2.  **Next.js Server**: Starts rendering `page.tsx`.
3.  **Server Component**:

    ```typescript
    // app/dashboard/page.tsx
    import { api } from "@/trpc/server";

    export default async function Dashboard() {
      const user = await api.auth.me.query(); // Direct Call (No HTTP to self!)
      return <div>Hello {user.name}</div>;
    }
    ```

4.  **Next.js Router**:
    - Executes `auth.me` logic directly.
    - Extracts Session Token from cookies.
    - Calls `GET http://api-gateway:4001/auth/me` (REST) with `Authorization` header.
5.  **API Gateway**:
    - Validates Token via `GatewayAuthGuard`.
    - Calls `AuthService.Validate()` (gRPC).
    - Returns user object.
6.  **Next.js Server**: Renders HTML with user data.
7.  **Return Path**: HTML -> Browser.
8.  **Result**: Instant page load with data (SSR).

### 3.1.2 Code Implementation: Web BFF

**1. The "Direct Caller" (`trpc/server.ts`)**
This creates the `api` object used in Server Components. It ensures context (headers/cookies) is passed correctly.

```typescript
// server/api/trpc.ts
import { appRouter } from '@/server/api/root';
import { createCallerFactory } from '@trpc/server';
import { headers } from 'next/headers';

const createCaller = createCallerFactory(appRouter);

export const api = createCaller(async () => {
  const heads = new Headers(await headers());
  heads.set('x-trpc-source', 'rsc');
  return { headers: heads };
});
```

**2. The tRPC Router ("The Proxy Logic")**
This is the code that actually runs when you call `api.auth.login` (Server) or `trpc.auth.login` (Client).

```typescript
// server/api/routers/auth.ts
export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      // PROXY LOGIC: Call API Gateway (HTTP)
      const res = await fetch(`${process.env.API_GATEWAY_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return await res.json();
    }),
});
```

**3. The Route Handler (Client Only)**
This handler catches `/api/trpc/*` requests from **Client Components** and routes them to the Router.
_Note: Server Components BYPASS this handler and use `api` (Direct Caller) instead._

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

### 3.2 Mobile BFF (NestJS Gateway + GraphQL)

**Role**: The NestJS Gateway acts as the dedicated backend for the Mobile Client.

- **Client (Flutter)**: Communicates **strictly over HTTP/GraphQL** with the NestJS Gateway.
- **Server (NestJS)**: Resolves the GraphQL query and communicates with internal microservices **strictly over gRPC**.

**End-to-End Flow:**

1.  **Mobile App**: Sends `POST /graphql` (GraphQL Query).
2.  **NestJS Gateway**: - Intercepts request in GraphQL Resolver. - Calls `AuthService.Login()` via **gRPC**. - Returns JSON response to Mobile App.
    **Key Point**: The Mobile App never sees gRPC.

---

## 4. Auth Implementation Details (NextAuth & Interceptors)

### 4.1 Next.js (NextAuth.js)

NextAuth handles the **Session Cookie** management for tRPC.

- **Login**: `signIn()` calls the Next.js backend, which verifies credentials via **API Gateway (HTTP)** and returns tokens.
- **Session**: Stored in HTTP-only cookie.
- **Context**: tRPC router checks `ctx.session` to authorize requests.

### 4.2 Flutter (Manual Interceptor)

Flutter manages the **Tokens** in secure storage.

```dart
dio.interceptors.add(InterceptorsWrapper(
  onError: (error, handler) async {
    if (error.response?.statusCode == 401) {
      // 1. Lock Request Queue
      // 2. Call Refresh Endpoint
      try {
        const newToken = await api.refreshToken();
        storage.write(newToken);
        // 3. Retry Failed Request
        return handler.resolve(await dio.fetch(retryOptions));
      } catch {
        // 4. Logout on Fail
        authBloc.add(LogoutEvent());
      }
    }
    return handler.next(error);
  }
));
```
