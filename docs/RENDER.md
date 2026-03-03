# Render Deployment Guide

This guide covers how to set up the 4 FinTrack backend services on Render using Docker Hub images pushed by the GitHub Actions CI/CD pipeline.

---

## Architecture Overview

```
GitHub (main push)
  └── GitHub Actions CI/CD
        ├── Type check + Tests
        ├── Build Docker images → Docker Hub
        └── Trigger Render deploy hooks
              ├── fintrack-api-gateway          (Web Service — public)
              ├── fintrack-auth-service         (Private Service — internal gRPC)
              ├── fintrack-notification-service (Private Service — internal gRPC)
              └── fintrack-payment-service      (Private Service — internal gRPC)
```

Only `api_gateway` is publicly accessible. The three gRPC services are Render Private Services — internal only, no public URL, cheaper tier.

> **Important:** Docker images are built without any secrets. All environment variables are runtime config injected by Render when the container starts — nothing is baked into the image.

---

## Step 1 — Create the 4 Render Services

Go to [render.com](https://render.com) → **New** → choose service type → **"Deploy an existing image from a registry"**.

| Service Name | Type | Docker Image | Port |
|---|---|---|---|
| `fintrack-api-gateway` | **Web Service** | `dasiloy/fintrack-api-gateway:latest` | `4001` |
| `fintrack-auth-service` | **Private Service** | `dasiloy/fintrack-auth-service:latest` | `4002` |
| `fintrack-notification-service` | **Private Service** | `dasiloy/fintrack-notification-service:latest` | `4009` |
| `fintrack-payment-service` | **Private Service** | `dasiloy/fintrack-payment-service:latest` | `4008` |

> **Private Services** have no public URL and are only reachable within Render's internal network — exactly what you want for gRPC services.

---

## Step 2 — Set Environment Variables

Set these on each service via **Settings → Environment**.

### api_gateway

Handles HTTP traffic and routes requests to the gRPC microservices.

```env
NODE_ENV=production
API_GATEWAY_PORT=4001

DATABASE_URL=          # Neon PostgreSQL connection string

SWAGGER_DOC_USER=      # Basic auth username for /api/docs
SWAGGER_DOC_PASS=      # Basic auth password for /api/docs

# Internal Render hostnames for gRPC services
# Find these in each Private Service → Settings → Internal Address
AUTH_SERVICE_HOST=fintrack-auth-service
AUTH_SERVICE_PORT=4002

NOTIFICATION_SERVICE_HOST=fintrack-notification-service
NOTIFICATION_SERVICE_PORT=4009

PAYMENT_SERVICE_HOST=fintrack-payment-service
PAYMENT_SERVICE_PORT=4008
```

---

### auth_service

Handles authentication, JWT issuance, sessions, OTP, and login limits.

```env
NODE_ENV=production
AUTH_SERVICE_PORT=4002

DATABASE_URL=          # Neon PostgreSQL connection string
REDIS_URL=             # Upstash Redis connection string

AUTH_SECRET=           # Same value as JWT_SECRET

JWT_SECRET=            # Long random string (openssl rand -base64 64)
JWT_REFRESH_SECRET=    # Different long random string
JWT_OTP_SECRET=        # Different long random string

JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=1d
JWT_OTP_TOKEN_EXPIRATION=60m

MAX_LOGIN_ATTEMPTS=3
OTP_EXPIRY_MINUTES=5
```

---

### notification_service

Processes email jobs from Redis queue and sends via Mailtrap.

```env
NODE_ENV=production
NOTIFICATION_SERVICE_PORT=4009

DATABASE_URL=          # Neon PostgreSQL connection string
REDIS_URL=             # Upstash Redis connection string

MAIL_FROM=noreply@fintrack.live
MAIL_TOKEN=            # Mailtrap API token (mailtrap.io → API Tokens)
```

---

### payment_service

Handles Stripe subscriptions and billing.

```env
NODE_ENV=production
PAYMENT_SERVICE_PORT=4008

DATABASE_URL=          # Neon PostgreSQL connection string
REDIS_URL=             # Upstash Redis connection string
```

---

## Step 3 — Disable Auto-Deploy on All 4 Services

Each service → **Settings → Build & Deploy → Auto-Deploy → Off**

This prevents Render from deploying on git push before GitHub Actions finishes building the new Docker image. The CI/CD pipeline is the sole deploy trigger via deploy hooks — image is always ready before Render pulls it.

---

## Step 4 — Get Deploy Hook URLs

Each service → **Settings → Deploy Hook** → copy the URL.

Add to GitHub: **repo → Settings → Secrets and variables → Actions → New repository secret**

| GitHub Secret | Where to get the value |
|---|---|
| `RENDER_DEPLOY_HOOK_API_GATEWAY` | Render → fintrack-api-gateway → Settings → Deploy Hook |
| `RENDER_DEPLOY_HOOK_AUTH_SERVICE` | Render → fintrack-auth-service → Settings → Deploy Hook |
| `RENDER_DEPLOY_HOOK_NOTIFICATION_SERVICE` | Render → fintrack-notification-service → Settings → Deploy Hook |
| `RENDER_DEPLOY_HOOK_PAYMENT_SERVICE` | Render → fintrack-payment-service → Settings → Deploy Hook |

---

## Step 5 — Add Docker Hub Secrets to GitHub

| GitHub Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | `dasiloy` |
| `DOCKERHUB_TOKEN` | Docker Hub → Account Settings → Personal Access Tokens → Generate |

These are the **only** secrets GitHub Actions needs. All other env vars go on Render, not GitHub.

---

## Full Deploy Flow (after setup)

```
git push origin main
  └── GitHub Actions triggers
        ├── [quality]  Type check passes
        ├── [test]     All service tests pass
        ├── [docker]   Builds 4 images, pushes to Docker Hub
        │               dasiloy/fintrack-api-gateway:latest
        │               dasiloy/fintrack-auth-service:latest
        │               dasiloy/fintrack-notification-service:latest
        │               dasiloy/fintrack-payment-service:latest
        └── [deploy]   Calls Render deploy hooks (image already on Docker Hub)
                        → Render pulls new images
                        → Zero-downtime redeploy
```

Total time: ~8–12 minutes depending on build cache hits.

---

## Internal Hostname Note

After creating the Private Services, get each one's internal address from:
**Render → \<service\> → Settings → Internal Address**

The hostname part (before the colon) is what goes into `*_HOST` env vars on api_gateway. For example:
```
Internal Address:  fintrack-auth-service:4002
AUTH_SERVICE_HOST: fintrack-auth-service   ← hostname only
AUTH_SERVICE_PORT: 4002
```

---

## Troubleshooting

**Service can't reach another service (gRPC connection refused)**
- Check `*_HOST` and `*_PORT` env vars on api_gateway match the Render internal address exactly
- Ensure the target Private Service is healthy (check its Render logs)

**Deploy hook fires but Render pulls old image**
- Auto-Deploy was still enabled and fired before CI finished
- Go to each service → Settings → Auto-Deploy → Off

**Image pull fails on Render**
- If your Docker Hub repos are private: Render → Account Settings → Integrations → Docker Hub
- If public, no credentials needed

**Container crashes on startup**
- Almost always a missing or wrong environment variable
- Check Render logs for the specific validation error from ConfigModule
