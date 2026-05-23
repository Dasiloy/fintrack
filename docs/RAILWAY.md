# Railway Deployment Guide

FinTrack's backend is deployed to Railway using the **native Node.js runtime** — no Docker required. All 7 services live in **one Railway project** with private networking between them. Only `api-gateway` gets a public domain; every other service is internal-only.

Each service has a corresponding `.env.prod` file at `apps/<service>/.env.prod` listing every required environment variable with placeholder values. Fill those in and set them in Railway's variable editor before the first deploy.

---

## Service overview

| Service | Railway name | Type | gRPC port | Outbound connections |
|---------|-------------|------|-----------|---------------------|
| `api_gateway` | `api-gateway` | Public (HTTP) | — | auth, finance, ai, payment, notification, scheduler |
| `auth_service` | `auth-service` | Private (gRPC) | 4002 | payment |
| `finance_service` | `finance-service` | Private (gRPC) | 4003 | — |
| `ai_service` | `ai-service` | Private (gRPC) | 4004 | — |
| `payment_service` | `payment-service` | Private (gRPC) | 4005 | — |
| `scheduler_service` | `scheduler-service` | Private (gRPC) | 4006 | — |
| `notification_service` | `notification-service` | Private (gRPC) | 4007 | — |

Private networking: within one Railway project, services reach each other at `{service-name}.railway.internal:{port}` without any public exposure or extra cost.

---

## Step 1 — Create the Railway project

1. Go to [railway.app](https://railway.app) → **New Project → Empty project**.
2. Name it `fintrack-backend`.
3. Connect your GitHub account if you haven't already.

---

## Step 2 — Create each service

For each of the 7 services below, follow the same sequence:

**Railway → New → GitHub Repo → select your repo → Configure:**

| Field | Value |
|-------|-------|
| **Service name** | Exactly as listed in the table above (e.g. `api-gateway`) |
| **Root directory** | *(leave blank — build runs from repo root)* |
| **Watch paths** | See per-service table below |
| **Builder** | Nixpacks (auto-detected) |

Every service shares the same four runtime packages (`common`, `database`, `utils`, `types`). Watch paths should include the service's own directory plus those four. Set them under **Settings → Source → Watch Paths**, one path per line:

| Service | Watch paths (one per line in Railway) |
|---------|--------------------------------------|
| `api-gateway` | `apps/api_gateway/**` `packages/common/**` `packages/database/**` `packages/types/**` `packages/utils/**` |
| `auth-service` | `apps/auth_service/**` `packages/common/**` `packages/database/**` `packages/types/**` `packages/utils/**` |
| `finance-service` | `apps/finance_service/**` `packages/common/**` `packages/database/**` `packages/types/**` `packages/utils/**` |
| `ai-service` | `apps/ai_service/**` `packages/common/**` `packages/database/**` `packages/types/**` `packages/utils/**` |
| `payment-service` | `apps/payment_service/**` `packages/common/**` `packages/database/**` `packages/types/**` `packages/utils/**` |
| `scheduler-service` | `apps/scheduler_service/**` `packages/common/**` `packages/database/**` `packages/types/**` `packages/utils/**` |
| `notification-service` | `apps/notification_service/**` `packages/common/**` `packages/database/**` `packages/types/**` `packages/utils/**` |

So for `api-gateway` you would enter exactly this in the Watch Paths field:

```
apps/api_gateway/**
packages/common/**
packages/database/**
packages/types/**
packages/utils/**
```

The other packages (`eslint-config`, `typescript-config`, `trpc_app`, `ui`, `react_query`, `next_auth`) are either build-only tooling or web-only — changes to them don't need to trigger a backend redeploy.

After creation, open **Settings → Networking**:
- `api-gateway` only: click **Generate Domain** to get a public HTTPS URL.
- All other services: leave networking private — no public domain.

---

## Step 3 — Set build & start commands

Open **Settings → Build** and **Settings → Deploy** for each service and fill in:

### `api-gateway`

```
Build:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=api_gateway
Start:  cd apps/api_gateway && node dist/main.js
```

### `auth-service`

```
Build:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=auth_service
Start:  cd apps/auth_service && node dist/main.js
```

### `finance-service`

```
Build:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=finance_service
Start:  cd apps/finance_service && node dist/main.js
```

### `ai-service`

```
Build:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=ai_service
Start:  cd apps/ai_service && node dist/main.js
```

### `payment-service`

```
Build:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=payment_service
Start:  cd apps/payment_service && node dist/main.js
```

### `scheduler-service`

```
Build:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=scheduler_service
Start:  cd apps/scheduler_service && node dist/main.js
```

### `notification-service`

```
Build:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=notification_service
Start:  cd apps/notification_service && node dist/main.js
```

---

## Step 4 — Set environment variables

Each service has a `.env.prod` template file in its directory. Open Railway → `<service>` → **Variables** and add every entry from that file with real values.

**Shared infrastructure** (same value copied to every service that needs it):

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | Neon → Connection Details → Pooled connection string (`postgres://...?sslmode=require`) |
| `DATABASE_CA_CERTIFICATE` | Neon → Download CA cert — paste the full PEM including `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` |
| `REDIS_URL` | Upstash → Redis → Details tab — must start with `rediss://` (double-s for TLS) |

**Service-to-service hostnames** (private networking — these are set on `api-gateway` and `auth-service`):

Once you have named your services exactly as shown in the table, the Railway internal hostnames are predictable:

| Variable | Value |
|----------|-------|
| `AUTH_SERVICE_HOST` | `auth-service.railway.internal` |
| `AUTH_SERVICE_PORT` | `4002` |
| `FINANCE_SERVICE_HOST` | `finance-service.railway.internal` |
| `FINANCE_SERVICE_PORT` | `4003` |
| `AI_SERVICE_HOST` | `ai-service.railway.internal` |
| `AI_SERVICE_PORT` | `4004` |
| `PAYMENT_SERVICE_HOST` | `payment-service.railway.internal` |
| `PAYMENT_SERVICE_PORT` | `4005` |
| `SCHEDULER_SERVICE_HOST` | `scheduler-service.railway.internal` |
| `SCHEDULER_SERVICE_PORT` | `4006` |
| `NOTIFICATION_SERVICE_HOST` | `notification-service.railway.internal` |
| `NOTIFICATION_SERVICE_PORT` | `4007` |

> **Confirm the internal hostname**: Railway → `<service>` → Settings → Networking → Private networking shows the actual `{name}.railway.internal` address. If you named the service exactly as shown above, it matches. If not, update the `*_HOST` variables on any service that connects to it.

---

## Step 5 — Custom domain: api.fintrack.live

Your domain `fintrack.live` is registered on GoDaddy with **nameservers pointing to Vercel**, so all DNS records are managed in the Vercel dashboard.

### 5A — Add the domain in Railway

1. Railway → `api-gateway` → **Settings → Networking → Custom Domain**.
2. Click **Add Custom Domain** and enter `api.fintrack.live`.
3. Railway shows you a **CNAME target** — it looks like `<random>.up.railway.app`. Copy it.

### 5B — Add the CNAME record in Vercel

1. Vercel Dashboard → your `fintrack.live` project → **Settings → Domains**.
2. Click **Add** and enter `api.fintrack.live`, then choose **Add as subdomain**.
3. Vercel may ask what it should point to — select **Custom CNAME** (not a Vercel deployment).
4. Enter the CNAME value copied from Railway in the previous step.

> If Vercel doesn't offer a "Custom CNAME" option on the domain settings page, go to your **Vercel team/account → Domains → fintrack.live → DNS Records**, add a new record:
>
> | Type | Name | Value |
> |------|------|-------|
> | `CNAME` | `api` | `<random>.up.railway.app` (from Railway) |

### 5C — Verify in Railway

Railway polls for DNS propagation automatically. Once the CNAME resolves, the domain status turns green and Railway provisions a TLS certificate via Let's Encrypt — usually within 1–5 minutes.

If it stays pending longer than 10 minutes, run:

```bash
dig api.fintrack.live CNAME
```

The answer section should show the Railway target. If it still shows Vercel's servers, wait for DNS propagation (can take up to 1 hour globally).

### 5D — Update env vars

Once the domain is live, update these two variables on the `api-gateway` Railway service:

| Variable | Value |
|----------|-------|
| `API_GATEWAY_URL` | `https://api.fintrack.live` |
| `NEXT_PUBLIC_APP_URL` | `https://fintrack.live` (the web app — used for CORS, not the API) |

Also update `API_GATEWAY_URL` in your Next.js web app's Vercel environment variables so tRPC calls route to the correct endpoint.

---

## Step 6 — CORS fix before deploying

The api_gateway currently has CORS hardcoded to `http://localhost:3000`. Before deploying, update `apps/api_gateway/src/main.ts`:

```typescript
// Replace the hardcoded origin:
app.enableCors({
  origin: [process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
});
```

Set `NEXT_PUBLIC_APP_URL` in api-gateway's Railway variables to your Vercel / web app production URL (e.g. `https://fintrack.live`).

---

## Step 7 — First deploy (order matters)

Deploy the gRPC services first so api-gateway doesn't hit connection errors on startup:

1. `auth-service`
2. `finance-service`
3. `ai-service`
4. `payment-service`
5. `scheduler-service`
6. `notification-service`
7. `api-gateway` — deploy last

In Railway: open each service → **Deploy → Deploy now** (or trigger via git push once all variables are set).

---

## Subsequent deploys

After the initial setup, every push to `main` triggers an automatic redeploy of all services in parallel. To redeploy a single service: Railway → `<service>` → **Redeploy**.

---

## Cost control

- Railway bills per service by actual CPU + RAM usage (not a flat fee per service).
- All 7 services in one project share the project's private network — no extra networking cost.
- Only `api-gateway` has a public domain; all others are internal — no external traffic charges on them.
- Set **Railway → Project → Settings → Spending limit** to cap monthly spend.
- Idle services that receive no traffic use minimal CPU (< 0.01 vCPU) — Railway does not charge for zero traffic.
- If the ai-service is idle most of the time, it costs almost nothing. Only costs when LLM calls come in.

---

## Troubleshooting

**Service can't reach another service (gRPC UNAVAILABLE)**
- Check the `*_HOST` env var matches `{service-name}.railway.internal` exactly (case-sensitive)
- Verify the target service is healthy in Railway dashboard (green dot)
- Confirm both services are in the same Railway project and environment

**Build fails — missing workspace package**
- Check build logs for the exact missing module
- Most common cause: wrong `--filter` name — must match `"name"` in the service's `package.json`

**Service crashes immediately on startup**
- Almost always a missing environment variable
- Check Railway logs for the Joi validation error — it names the missing variable

**Redis TLS errors**
- `REDIS_URL` must start with `rediss://` (double-s) — Upstash requires TLS

**DATABASE_CA_CERTIFICATE not loading**
- Paste the full PEM block including `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`
- In Railway variables, use the multiline text field (click expand icon next to the value)

**CORS errors from the web app**
- Ensure `NEXT_PUBLIC_APP_URL` in api-gateway equals the exact origin of the web app (no trailing slash)
- Redeploy api-gateway after updating the variable

**gRPC "failed to connect" during api-gateway startup**
- api-gateway tries to connect to all gRPC services at boot; if a service isn't ready yet it logs a warning but continues — it will reconnect automatically
- If it keeps failing, confirm the target service is running and the `*_HOST`/`*_PORT` vars are correct
