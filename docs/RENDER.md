# Render Deployment Guide

FinTrack's 4 backend services are deployed to Render using Render's **native Node.js runtime** — no Docker required. Render installs dependencies and builds TypeScript directly from the GitHub repo. On every push to `main`, Render auto-deploys all services.

The `render.yaml` file at the repo root is a **Render Blueprint** — it defines all 4 services, their build/start commands, and non-secret environment variables as code. When you link the repo in Render, it reads this file and provisions everything automatically.

---

## Architecture

```
GitHub (push to main)
  └── Render Git Integration auto-deploys
        ├── fintrack-api-gateway          (Web Service — public HTTP, port 4001)
        ├── fintrack-auth-service         (Private Service — internal gRPC, port 4002)
        ├── fintrack-notification-service (Private Service — internal gRPC, port 4009)
        └── fintrack-payment-service      (Private Service — internal gRPC, port 4008)
```

Only `api_gateway` has a public URL. The three gRPC services are Render Private Services — internal only, reachable by name within the same Render project.

---

## Step 1 — Connect the repo to Render

1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect your GitHub account and select the `fintrack` repository
3. Render reads `render.yaml` and shows a preview of all 4 services
4. Click **Apply** — Render provisions the services and triggers the first build

> The first build installs all dependencies and compiles TypeScript. Expect 5–10 minutes.

---

## Step 2 — Set secrets in Render dashboard

The `render.yaml` defines all non-secret env vars. Secrets are marked `sync: false` — Render creates the env var slot but leaves it empty. You must fill them in once after the first deploy.

Go to each service → **Settings → Environment** and set:

### fintrack-api-gateway

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon → Connection Details → Pooled connection string |
| `REDIS_URL` | Upstash → Redis → Details tab (`rediss://...`) |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` (different value) |
| `JWT_OTP_SECRET` | `openssl rand -base64 48` (different value) |
| `AUTH_SECRET` | Same value as `JWT_SECRET` |
| `AUTH_GOOGLE_ID` | Google Cloud Console → OAuth 2.0 Client ID |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console → OAuth 2.0 Client Secret |
| `SWAGGER_DOC_USER` | Any username for the `/api/docs` basic auth |
| `SWAGGER_DOC_PASS` | Any strong password |
| `CLOUDINARY_ID` | Cloudinary Dashboard → Cloud name |
| `NEXT_PUBLIC_APP_URL` | Your production web app URL (e.g. `https://fintrack.live`) |

### fintrack-auth-service

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Same Neon connection string |
| `JWT_SECRET` | Same value as api_gateway |
| `JWT_REFRESH_SECRET` | Same value as api_gateway |
| `JWT_OTP_SECRET` | Same value as api_gateway |
| `JWT_2FA_SECRET` | `openssl rand -base64 48` (new unique value) |
| `AES_KEY` | `openssl rand -hex 32` — **must be exactly 64 hex characters** |

### fintrack-notification-service

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Same Neon connection string |
| `REDIS_URL` | Same Upstash URL |
| `MAIL_FROM` | Your verified Mailtrap sending domain address (e.g. `noreply@fintrack.live`) |
| `MAIL_TOKEN` | Mailtrap → Email API → API Tokens |

### fintrack-payment-service

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Same Neon connection string |
| `REDIS_URL` | Same Upstash URL |

---

## Step 3 — Confirm internal hostnames

After the Private Services are created, verify the internal hostnames Render assigned:

**Render → \<private service\> → Settings → Internal Address**

The hostname (before the colon) should match what `render.yaml` sets for `*_SERVICE_HOST` on api_gateway:

```
Internal Address:  fintrack-auth-service:4002
AUTH_SERVICE_HOST: fintrack-auth-service   ← hostname only, no port
AUTH_SERVICE_PORT: 4002
```

If Render assigns a different hostname, update the corresponding `*_SERVICE_HOST` value in the api_gateway environment settings.

---

## Deploy flow (after setup)

```
git push origin main
  └── Render detects push via Git integration
        └── Builds and deploys all 4 services in parallel
              pnpm install --frozen-lockfile
              pnpm turbo run db:generate --filter=@fintrack/database
              pnpm turbo build --filter=<service>
              → node apps/<service>/dist/main.js
```

CI (GitHub Actions) still runs type-check and tests on `feat/**` branches and PRs to `main`. Render handles the actual deployment independently.

---

## Troubleshooting

**Service can't reach another service (gRPC connection refused)**
- Check `*_HOST` and `*_PORT` env vars on api_gateway match the Render internal address exactly
- Ensure the target Private Service is healthy (check its Render logs)

**Build fails with missing module**
- Check Render logs for the exact error
- Most common: a secret env var is empty — fill it in and trigger a manual deploy

**Container crashes on startup**
- Almost always a missing or wrong environment variable
- Check Render logs for the specific validation error from ConfigModule/Joi
