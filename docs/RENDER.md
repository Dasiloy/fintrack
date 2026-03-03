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
              ├── fintrack-api-gateway        (Web Service — public)
              ├── fintrack-auth-service       (Private Service — internal gRPC)
              ├── fintrack-notification-service (Private Service — internal gRPC)
              └── fintrack-payment-service    (Private Service — internal gRPC)
```

Only `api_gateway` is publicly accessible. The three gRPC services are Render Private Services — internal only, no public URL, cheaper tier.

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

```env
NODE_ENV=production
PORT=4001

DATABASE_URL=
REDIS_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_OTP_SECRET=
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=1d
JWT_OTP_TOKEN_EXPIRATION=60m

AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

SWAGGER_DOC_USER=
SWAGGER_DOC_PASS=

MAX_LOGIN_ATTEMPTS=3
OTP_EXPIRY_MINUTES=5

# Internal hostnames — get these from each service's dashboard after creation
# Render → <service> → Settings → Internal Address
AUTH_SERVICE_HOST=fintrack-auth-service
AUTH_SERVICE_PORT=4002

NOTIFICATION_SERVICE_HOST=fintrack-notification-service
NOTIFICATION_SERVICE_PORT=4009

PAYMENT_SERVICE_HOST=fintrack-payment-service
PAYMENT_SERVICE_PORT=4008
```

### auth_service

```env
NODE_ENV=production
PORT=4002

DATABASE_URL=
REDIS_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_OTP_SECRET=
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=1d
JWT_OTP_TOKEN_EXPIRATION=60m

MAX_LOGIN_ATTEMPTS=3
OTP_EXPIRY_MINUTES=5
```

### notification_service

```env
NODE_ENV=production
PORT=4009

MAIL_FROM=noreply@fintrack.live
MAIL_TOKEN=
```

### payment_service

```env
NODE_ENV=production
PORT=4008

DATABASE_URL=
REDIS_URL=
```

> **Internal hostnames:** After creating a Private Service, Render shows its internal address in the dashboard (e.g. `fintrack-auth-service:4002`). Use the hostname part only for `*_HOST` vars.

---

## Step 3 — Disable Auto-Deploy on All 4 Services

Each service → **Settings → Build & Deploy → Auto-Deploy → Off**

This prevents Render from deploying on git push before GitHub Actions has finished building and pushing the new Docker image. The CI/CD pipeline is the sole deploy trigger.

---

## Step 4 — Get Deploy Hook URLs

Each service → **Settings → Deploy Hook** → copy the URL.

Add these to GitHub: **repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `RENDER_DEPLOY_HOOK_API_GATEWAY` | `https://api.render.com/deploy/srv-...` |
| `RENDER_DEPLOY_HOOK_AUTH_SERVICE` | `https://api.render.com/deploy/srv-...` |
| `RENDER_DEPLOY_HOOK_NOTIFICATION_SERVICE` | `https://api.render.com/deploy/srv-...` |
| `RENDER_DEPLOY_HOOK_PAYMENT_SERVICE` | `https://api.render.com/deploy/srv-...` |

---

## Step 5 — Add Docker Hub Secrets to GitHub

| Secret Name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | `dasiloy` |
| `DOCKERHUB_TOKEN` | Docker Hub → Account Settings → Personal Access Tokens → Generate |

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
        └── [deploy]   Calls Render deploy hooks
                        → Render pulls new images
                        → Zero-downtime redeploy
```

Total time: ~8–12 minutes depending on build cache hits.

---

## Troubleshooting

**Service can't reach another service (gRPC connection refused)**
- Check `*_HOST` and `*_PORT` env vars on api_gateway match the Render internal address exactly
- Ensure the target service is healthy (check its Render logs)

**Deploy hook fires but Render pulls old image**
- This means auto-deploy was still enabled and fired before CI finished
- Go to each service → Settings → Auto-Deploy → Off

**Image pull fails on Render**
- If your Docker Hub repos are private, add credentials: Render → Account Settings → Integrations → Docker Hub
- If public, no credentials needed
