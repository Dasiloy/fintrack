# Render Deployment Guide

FinTrack's backend is deployed to Render using the **native Node.js runtime** — no Docker required. All 7 services are created and configured manually in the Render dashboard. There is no `render.yaml` Blueprint; each service is provisioned once and Render auto-deploys on every push to `main`.

---

## Service Overview

| Service | Type | Port | Description |
|---------|------|------|-------------|
| `fintrack-api-gateway` | Web Service (public) | 4001 | HTTP entry point — tRPC, GraphQL, REST |
| `fintrack-auth-service` | Private Service (gRPC) | 4002 | Authentication, sessions, JWT |
| `fintrack-finance-service` | Private Service (gRPC) | 4003 | Transactions, budgets, analytics |
| `fintrack-ai-service` | Private Service (gRPC) | 4004 | LLM inference, classification, insights |
| `fintrack-payment-service` | Private Service (gRPC) | 4005 | Stripe subscriptions, webhooks |
| `fintrack-scheduler-service` | Private Service (gRPC) | 4006 | Cron jobs, recurring bills |
| `fintrack-notification-service` | Private Service (gRPC) | 4007 | Email, push notifications |

Only `api-gateway` gets a public URL. All other services are Render Private Services — internal only, reachable from within the same Render project by hostname.

---

## Step 1 — Create each service in Render

For each service below, go to **Render → New → Web Service** (api-gateway) or **New → Private Service** (everything else), connect the GitHub repo, and fill in the settings.

### Common settings for all services

| Field | Value |
|-------|-------|
| **Runtime** | Node |
| **Region** | Choose one and keep all services in the same region |
| **Branch** | `main` |
| **Root directory** | *(leave blank — build runs from repo root)* |
| **Auto-Deploy** | Yes |

---

### `fintrack-api-gateway` — Web Service

```
Build command:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=api_gateway
Start command:  cd apps/api_gateway && node dist/main.js
```

**Non-secret env vars** (set as Environment Variables in Render):

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MICROSERVICE_NAME` | `API_GATEWAY` |
| `API_GATEWAY_HOST` | `0.0.0.0` |
| `API_GATEWAY_PORT` | `4001` |
| `AUTH_SERVICE_HOST` | `fintrack-auth-service` |
| `AUTH_SERVICE_PORT` | `4002` |
| `FINANCE_SERVICE_HOST` | `fintrack-finance-service` |
| `FINANCE_SERVICE_PORT` | `4003` |
| `AI_SERVICE_HOST` | `fintrack-ai-service` |
| `AI_SERVICE_PORT` | `4004` |
| `PAYMENT_SERVICE_HOST` | `fintrack-payment-service` |
| `PAYMENT_SERVICE_PORT` | `4005` |
| `SCHEDULER_SERVICE_HOST` | `fintrack-scheduler-service` |
| `SCHEDULER_SERVICE_PORT` | `4006` |
| `NOTIFICATION_SERVICE_HOST` | `fintrack-notification-service` |
| `NOTIFICATION_SERVICE_PORT` | `4007` |

**Secrets** (fill in Render → service → Settings → Environment):

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | Neon → Connection Details → Pooled connection string |
| `DATABASE_CA_CERTIFICATE` | Neon → Download CA certificate (paste full PEM content) |
| `REDIS_URL` | Upstash → Redis → Details tab (`rediss://...`) |
| `AUTH_GOOGLE_ID` | Google Cloud Console → OAuth 2.0 Client ID |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console → OAuth 2.0 Client Secret |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` (different value) |
| `JWT_OTP_SECRET` | `openssl rand -base64 48` (different value) |
| `AUTH_SECRET` | Same value as `JWT_SECRET` |
| `SWAGGER_DOC_USER` | Any username for `/api/docs` basic auth |
| `SWAGGER_DOC_PASS` | Any strong password |
| `CLOUDINARY_URL` | Cloudinary → Dashboard → API Environment variable |
| `CLOUDINARY_SIGNATURE_EXPIRATION` | `600` (seconds, adjust as needed) |
| `NEXT_PUBLIC_APP_URL` | Your production web app URL (e.g. `https://fintrack.live`) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → signing secret |

---

### `fintrack-auth-service` — Private Service

```
Build command:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=auth_service
Start command:  cd apps/auth_service && node dist/main.js
```

**Non-secret env vars:**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MICROSERVICE_NAME` | `AUTH_SERVICE` |
| `AUTH_SERVICE_HOST` | `0.0.0.0` |
| `AUTH_SERVICE_PORT` | `4002` |
| `JWT_OTP_TOKEN_EXPIRATION` | `30m` |
| `JWT_2FA_TOKEN_EXPIRATION` | `5m` |
| `OTP_EXPIRY_MINUTES` | `5` |
| `MAX_LOGIN_ATTEMPTS` | `3` |

**Secrets:**

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | Same Neon connection string |
| `DATABASE_CA_CERTIFICATE` | Same PEM content |
| `REDIS_URL` | Same Upstash URL |
| `JWT_SECRET` | Same value as api_gateway |
| `JWT_REFRESH_SECRET` | Same value as api_gateway |
| `JWT_OTP_SECRET` | Same value as api_gateway |
| `JWT_2FA_SECRET` | `openssl rand -base64 48` (unique) |
| `AES_KEY` | `openssl rand -hex 32` — must be exactly 64 hex characters |

---

### `fintrack-finance-service` — Private Service

```
Build command:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=finance_service
Start command:  cd apps/finance_service && node dist/main.js
```

**Non-secret env vars:**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MICROSERVICE_NAME` | `FINANCE_SERVICE` |
| `FINANCE_SERVICE_HOST` | `0.0.0.0` |
| `FINANCE_SERVICE_PORT` | `4003` |

**Secrets:**

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | Same Neon connection string |
| `DATABASE_CA_CERTIFICATE` | Same PEM content |
| `REDIS_URL` | Same Upstash URL |

---

### `fintrack-ai-service` — Private Service

```
Build command:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=ai_service
Start command:  cd apps/ai_service && node dist/main.js
```

**Non-secret env vars:**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MICROSERVICE_NAME` | `AI_SERVICE` |
| `AI_SERVICE_HOST` | `0.0.0.0` |
| `AI_SERVICE_PORT` | `4004` |

**Secrets:**

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | Same Neon connection string |
| `DATABASE_CA_CERTIFICATE` | Same PEM content |
| `REDIS_URL` | Same Upstash URL |
| `OPENAI_API_KEY` | OpenAI Platform → API Keys |
| `OPENAI_API_BASE` | `https://api.openai.com/v1` (or custom proxy URL) |
| `ANTHROPIC_API_KEY` | Anthropic Console → API Keys |
| `GOOGLE_GEN_AI_API_KEY` | Google AI Studio → API Keys |

---

### `fintrack-payment-service` — Private Service

```
Build command:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=payment_service
Start command:  cd apps/payment_service && node dist/main.js
```

**Non-secret env vars:**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MICROSERVICE_NAME` | `PAYMENT_SERVICE` |
| `PAYMENT_SERVICE_HOST` | `0.0.0.0` |
| `PAYMENT_SERVICE_PORT` | `4005` |

**Secrets:**

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | Same Neon connection string |
| `DATABASE_CA_CERTIFICATE` | Same PEM content |
| `REDIS_URL` | Same Upstash URL |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → signing secret |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe Dashboard → Products → Price ID |

---

### `fintrack-scheduler-service` — Private Service

```
Build command:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=scheduler_service
Start command:  cd apps/scheduler_service && node dist/main.js
```

**Non-secret env vars:**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MICROSERVICE_NAME` | `SCHEDULER_SERVICE` |
| `SCHEDULER_SERVICE_HOST` | `0.0.0.0` |
| `SCHEDULER_SERVICE_PORT` | `4006` |

**Secrets:**

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | Same Neon connection string |
| `DATABASE_CA_CERTIFICATE` | Same PEM content |
| `REDIS_URL` | Same Upstash URL |

---

### `fintrack-notification-service` — Private Service

```
Build command:  pnpm install --frozen-lockfile --prod=false && pnpm turbo build --filter=notification_service
Start command:  cd apps/notification_service && node dist/main.js
```

**Non-secret env vars:**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MICROSERVICE_NAME` | `NOTIFICATION_SERVICE` |
| `NOTIFICATION_SERVICE_HOST` | `0.0.0.0` |
| `NOTIFICATION_SERVICE_PORT` | `4007` |

**Secrets:**

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | Same Neon connection string |
| `DATABASE_CA_CERTIFICATE` | Same PEM content |
| `REDIS_URL` | Same Upstash URL |
| `MAIL_FROM` | Your verified sending address (e.g. `noreply@fintrack.live`) |
| `MAIL_TOKEN` | Mailtrap → Email API → API Tokens |

---

## Step 2 — Confirm internal hostnames

After all Private Services are created, verify the internal hostnames Render assigned:

**Render → \<private service\> → Settings → Internal Address**

The hostname (before the colon) must match the `*_SERVICE_HOST` values set on `api-gateway`. For example:

```
Render Internal Address:  fintrack-auth-service:4002
api-gateway env var:      AUTH_SERVICE_HOST = fintrack-auth-service
                          AUTH_SERVICE_PORT = 4002
```

If Render assigns a different hostname, update the corresponding `*_SERVICE_HOST` value in `api-gateway`'s environment settings and trigger a redeploy.

---

## Step 3 — First deploy

After creating all services and filling in their secrets, trigger a manual deploy on each service (Render → \<service\> → **Manual Deploy → Deploy latest commit**). Deploy in this order to avoid gRPC connection errors on startup:

1. `fintrack-auth-service`
2. `fintrack-finance-service`
3. `fintrack-ai-service`
4. `fintrack-payment-service`
5. `fintrack-scheduler-service`
6. `fintrack-notification-service`
7. `fintrack-api-gateway`

---

## Deploy flow (after initial setup)

Subsequent deploys happen automatically on every push to `main`:

```
git push origin main
  └── Render detects push via Git integration
        └── Builds and deploys all services in parallel
              pnpm install --frozen-lockfile --prod=false
              pnpm turbo build --filter=<service>
              → node apps/<service>/dist/main.js
```

To redeploy a single service manually: Render → \<service\> → **Manual Deploy → Deploy latest commit**.

---

## Troubleshooting

**Service can't reach another service (gRPC connection refused)**
- Check `*_HOST` and `*_PORT` env vars on `api-gateway` match the Render internal address exactly
- Ensure the target Private Service is healthy (green in Render dashboard)

**Build fails — missing module or workspace package**
- Check Render build logs for the exact error
- Most common: wrong `--filter` name — verify against the service's `package.json` `"name"` field

**Service crashes on startup**
- Almost always a missing or incorrect environment variable
- Check Render logs for the Joi/ConfigModule validation error — it lists the missing var by name

**Redis TLS errors**
- Upstash requires TLS — `REDIS_URL` must start with `rediss://` (double-s), not `redis://`

**DATABASE_CA_CERTIFICATE not loading**
- Paste the full PEM block including `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`
- In Render env vars, use the multiline value field (click the expand icon)
