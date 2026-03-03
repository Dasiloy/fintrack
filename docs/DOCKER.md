# FinTrack — Docker & CI/CD Guide

> Step-by-step guide for everything set up, plus a quick Docker refresher.

---

## Table of Contents

1. [Docker Refresher](#1-docker-refresher)
2. [Project Architecture](#2-project-architecture)
3. [File Map](#3-file-map)
4. [How the Builds Work](#4-how-the-builds-work)
5. [Development Workflow](#5-development-workflow)
6. [Production Workflow](#6-production-workflow)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Render Deployment](#8-render-deployment)
9. [GitHub Secrets Reference](#9-github-secrets-reference)
10. [Common Commands](#10-common-commands)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Docker Refresher

### Core concepts

| Term | What it is |
|------|-----------|
| **Image** | Read-only snapshot: app code + OS + dependencies. Think of it as a class definition. |
| **Container** | A running instance of an image. Like an object instantiated from a class. |
| **Dockerfile** | Recipe that describes how to build an image, step by step. |
| **Layer** | Each Dockerfile instruction creates a cached layer. Unchanged layers are reused on rebuild — this is why `COPY package.json` comes before `COPY src/`. |
| **Volume** | Persistent or shared storage that survives container restarts. |
| **Bind mount** | Maps a host directory directly into a container (`./:/app`). Changes on host appear instantly inside the container. |
| **Anonymous volume** | `- /app/node_modules` — Docker initialises this from the image at first run and keeps it isolated from any bind mount on the parent path. |
| **Network** | Virtual LAN that lets containers address each other by service name. |
| **Registry** | Remote store for images. Docker Hub is the public default. |
| **Compose** | CLI tool (`docker compose`) that starts multi-container apps from a YAML file. |

### Multi-stage builds

Only the **final stage** is shipped as the image — earlier stages are discarded after the build. This keeps production images small and free of build tools.

```dockerfile
FROM node:20-alpine AS builder   # stage 1 — build tools, full source
RUN pnpm run build               # compiles TypeScript → dist/

FROM node:20-alpine AS runner    # stage 2 — this is what gets shipped
COPY --from=builder /app/dist .  # cherry-pick only the compiled output
CMD ["node", "main.js"]
```

### Key Dockerfile instructions

```dockerfile
FROM      node:20-alpine            # base image to start from
WORKDIR   /app                      # set CWD (created if it doesn't exist)
COPY      src/ ./src/               # copy files from the build context into the image
RUN       pnpm install              # run a shell command (creates a new layer)
ENV       NODE_ENV=production       # bake an environment variable into the image
EXPOSE    4001                      # document which port the process listens on
ENTRYPOINT ["dumb-init", "--"]     # fixed executable (not overridable at runtime)
CMD       ["node", "dist/main.js"]  # default args passed to ENTRYPOINT
USER      nestjs                    # switch to a non-root user before CMD
```

### Docker Compose essentials

```yaml
services:
  api_gateway:
    image: dasiloy/fintrack-api-gateway:latest  # pull from registry
    build:                                        # OR build locally
      context: .
      dockerfile: docker/api_gateway/Dockerfile
    ports:
      - "4001:4001"       # HOST_PORT:CONTAINER_PORT
    environment:
      NODE_ENV: production
    volumes:
      - .:/app            # bind mount — host source overlays /app
      - /app/node_modules # anonymous volume — keeps container's node_modules safe
    depends_on:
      auth_service:
        condition: service_healthy   # wait for healthcheck to pass
    networks:
      - fintrack-net
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "4001"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 2. Project Architecture

```
  Browser / Mobile App
         │
         │  HTTP (tRPC / REST)
         ▼
  ┌──────────────────┐
  │   API Gateway    │  :4001
  │   NestJS + tRPC  │
  └───────┬──────────┘
          │  gRPC (internal Docker network)
   ┌──────┼──────────────┐
   ▼      ▼              ▼
 Auth   Payment     Notification
 :4002   :4008         :4009
   │                    ▲
   └── BullMQ queue ────┘  (via Upstash Redis)

 External (not containerised):
   • Neon PostgreSQL  (DATABASE_URL)
   • Upstash Redis    (REDIS_URL)
```

- gRPC services bind on `0.0.0.0` inside their container so they're reachable from other containers.
- The API Gateway connects to other services using their **Docker service name as the hostname** (`auth_service:4002`, `payment_service:4008`, etc.).
- Auth Service enqueues email jobs to Redis; Notification Service is a BullMQ worker that dequeues and sends them.

---

## 3. File Map

```
fintrack/
├── .dockerignore                      Excludes node_modules, .env, dist, etc.
├── .env.example                       Template — copy to .env and fill values
├── docker-compose.prod.yml            Production: BE services only (pulls from Docker Hub)
├── docker-compose.dev.yml             Development: all services + web, built locally
│
├── docker/
│   ├── dev.Dockerfile                 Shared dev image (installs ALL monorepo deps)
│   ├── api_gateway/Dockerfile         Production 5-stage image
│   ├── auth_service/Dockerfile
│   ├── notification_service/Dockerfile
│   └── payment_service/Dockerfile
│
└── .github/
    └── workflows/
        └── ci-cd.yml                  type-check → test → build+push → deploy
```

Smoke tests added to each service (`src/health.spec.ts`) so CI has something to run.

---

## 4. How the Builds Work

### Why `turbo prune`?

Without pruning, every Dockerfile would copy the entire monorepo (gigabytes of source + lock files) as the build context. `turbo prune <service> --docker` produces a **minimal workspace** containing only what that service needs:

```bash
turbo prune api_gateway --docker
# Writes:
#   out/json/          — package.json files only  → used for the install layer
#   out/full/          — full source of relevant packages → used for the build
#   out/pnpm-lock.yaml — pruned lock file
```

### 5-stage pattern (all production Dockerfiles)

```
Stage 1  base        node:20-alpine + pnpm + turbo
Stage 2  pruner      turbo prune → minimal workspace in out/
Stage 3  installer   pnpm install using only package.json files (layer-cached)
Stage 4  builder     pnpm turbo build → dist/ output
Stage 5  runner      Minimal alpine + dist/ + packages/ + node_modules/
```

Stages 1–4 are **discarded**. Only the runner is shipped.

### Why WORKDIR is `apps/<service>` in the runner

`packages/common/src/config/services.ts` resolves `.proto` paths as:

```ts
join(process.cwd(), '..', '..', 'packages/types/proto/auth/auth.proto')
```

| WORKDIR | Resolved path | Works? |
|---------|---------------|--------|
| `/app` | `/packages/types/proto/...` | ✗ |
| `/app/apps/api_gateway` | `/app/packages/types/proto/...` | ✓ |

Setting `WORKDIR /app/apps/<service>` makes `process.cwd()` resolve two levels below the monorepo root, matching where the proto files actually live.

### Why copy both `packages/` and `node_modules/`

pnpm workspaces create symlinks: `node_modules/@fintrack/common → ../../packages/common`. Both directories must be present at the correct relative paths or the symlinks break at runtime.

---

## 5. Development Workflow

### First time setup

```bash
# 1. Copy env template and fill in values
cp .env.example .env

# 2. Build the dev image and start everything
docker compose -f docker-compose.dev.yml up --build
```

No `pnpm install` on your machine — node_modules live inside the containers.

### How hot-reload works

```
host disk  ──bind mount──►  /app  (source files appear instantly)
                             /app/node_modules  ◄── anonymous volume from image
                                                     (never overwritten by host)
```

NestJS services use `nest start --watch`; Next.js uses its built-in HMR. Save a file on your machine → the change is visible in the container immediately → the watcher recompiles.

### Start specific services only

```bash
docker compose -f docker-compose.dev.yml up packages-build auth_service api_gateway
```

`packages-build` must always be included — it compiles the shared workspace packages that other services import.

### Adding a dependency

```bash
# On host machine (updates pnpm-lock.yaml)
pnpm add some-package --filter api_gateway

# Rebuild the image so the dep is installed inside the container
docker compose -f docker-compose.dev.yml up --build api_gateway
```

---

## 6. Production Workflow

### Pull and run the latest images

```bash
cp .env.example .env   # fill in production values

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Pin to a specific git SHA (rollback-safe)

```bash
IMAGE_TAG=ab12cd34 docker compose -f docker-compose.prod.yml up -d
```

Every CI run pushes two tags: `:latest` and `:<short-sha>`. The short SHA is immutable — perfect for rollbacks.

### Run database migrations

Prisma migrations are separate from the app containers. Run them from your local machine or a one-off task:

```bash
DATABASE_URL=<prod-url> pnpm --filter @fintrack/database db:deploy
```

### Build an image manually (for testing before CI)

```bash
# Build context MUST be the monorepo root
docker build -f docker/api_gateway/Dockerfile -t fintrack-api-gateway:local .
docker run --rm -p 4001:4001 --env-file .env fintrack-api-gateway:local
```

---

## 7. CI/CD Pipeline

File: `.github/workflows/ci-cd.yml`

```
Every push / PR:
  quality  →  type-check all apps (after building shared packages)
  test     →  jest smoke tests, one job per service (parallel)

Main branch pushes only:
  docker   →  build + push to Docker Hub (parallel per service)
  deploy   →  curl Render deploy hooks
```

### Image tags produced per CI run on `main`

```
dasiloy/fintrack-api-gateway:latest
dasiloy/fintrack-api-gateway:ab12cd34   ← short git SHA, immutable
```

### Build cache

Each service uses a scoped GitHub Actions cache (`type=gha,scope=<service>`). After the first build, only changed layers rebuild — typically 2–3 min instead of 10+.

---

## 8. Render Deployment

### How it works

1. CI pushes `dasiloy/fintrack-api-gateway:latest` to Docker Hub.
2. CI calls the **Render deploy hook** (`curl -X POST <hook-url>`).
3. Render pulls the new image and does a zero-downtime restart.

### Setting up a service on Render

1. **render.com → New → Web Service** (api_gateway) or **Private Service** (gRPC services).
2. **Source**: Deploy an existing image from a registry.
3. **Image URL**: `docker.io/dasiloy/fintrack-api-gateway:latest`
4. **Environment variables**: add every var from `.env.example` relevant to that service.
5. After creating: **Settings → Deploy Hook → copy the URL**.
6. Add the URL to GitHub as `RENDER_DEPLOY_HOOK_API_GATEWAY` (etc.).

> Use **Private Service** for `auth_service`, `notification_service`, `payment_service` — they don't need a public port.

### Internal networking on Render

Render private services are reachable via their service name within the same environment. Set:
```
AUTH_SERVICE_HOST = <render-internal-hostname>
AUTH_SERVICE_PORT = 4002
```
Render shows the internal hostname in the service dashboard.

---

## 9. GitHub Secrets Reference

**Repo → Settings → Secrets and variables → Actions → New repository secret**

### Docker Hub

| Secret | Value |
|--------|-------|
| `DOCKERHUB_USERNAME` | `dasiloy` |
| `DOCKERHUB_TOKEN` | Docker Hub → Account Settings → Security → New Access Token (Read & Write) |

### Production environment

| Secret | Notes |
|--------|-------|
| `DATABASE_URL` | Neon: `postgresql://user:pass@host/db?sslmode=require` |
| `REDIS_URL` | Upstash: `rediss://default:token@host:6379` |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` |
| `JWT_OTP_SECRET` | `openssl rand -base64 48` |
| `JWT_ACCESS_TOKEN_EXPIRATION` | `15m` |
| `JWT_REFRESH_TOKEN_EXPIRATION` | `1d` |
| `JWT_OTP_TOKEN_EXPIRATION` | `60m` |
| `AUTH_SECRET` | Same value as `JWT_SECRET` |
| `AUTH_GOOGLE_ID` | Google Cloud Console → Credentials → OAuth 2.0 |
| `AUTH_GOOGLE_SECRET` | Same location |
| `MAIL_FROM` | `noreply@fintrack.live` |
| `MAIL_TOKEN` | Mailtrap API token |
| `SWAGGER_DOC_USER` | Any username |
| `SWAGGER_DOC_PASS` | Strong password |
| `MAX_LOGIN_ATTEMPTS` | `3` |
| `OTP_EXPIRY_MINUTES` | `5` |

### Render deploy hooks

| Secret | Where to get it |
|--------|----------------|
| `RENDER_DEPLOY_HOOK_API_GATEWAY` | Render dashboard → service → Settings → Deploy Hook |
| `RENDER_DEPLOY_HOOK_AUTH_SERVICE` | same |
| `RENDER_DEPLOY_HOOK_NOTIFICATION_SERVICE` | same |
| `RENDER_DEPLOY_HOOK_PAYMENT_SERVICE` | same |

---

## 10. Common Commands

```bash
# ── Development ───────────────────────────────────────────────────────────────
docker compose -f docker-compose.dev.yml up --build        # first time (builds image)
docker compose -f docker-compose.dev.yml up                # subsequent starts
docker compose -f docker-compose.dev.yml up api_gateway    # single service
docker compose -f docker-compose.dev.yml down              # stop + remove containers
docker compose -f docker-compose.dev.yml logs -f web       # tail logs

# ── Production ────────────────────────────────────────────────────────────────
docker compose -f docker-compose.prod.yml pull             # pull latest images
docker compose -f docker-compose.prod.yml up -d            # start detached
docker compose -f docker-compose.prod.yml ps               # check status
docker compose -f docker-compose.prod.yml down             # stop

# ── Build a single image manually ─────────────────────────────────────────────
docker build -f docker/api_gateway/Dockerfile -t fintrack-api-gateway:local .

# ── Inspect / debug ───────────────────────────────────────────────────────────
docker exec -it fintrack-dev-api-gateway sh    # open shell inside container
docker logs fintrack-dev-api-gateway           # view container logs

# ── Clean up ──────────────────────────────────────────────────────────────────
docker compose -f docker-compose.dev.yml down -v  # also removes volumes
docker system prune -f                            # remove stopped containers + dangling images
docker builder prune -f                           # clear build cache
```

---

## 11. Troubleshooting

### `Cannot find module '@fintrack/common/...'`

Shared packages weren't built before the service started. In dev, the `packages-build` service must complete first. In production, `pnpm turbo build --filter=api_gateway` handles this automatically (Turbo runs workspace deps first).

### Proto file not found / gRPC startup crash

The runner `WORKDIR` must be `apps/<service>`. Verify the Dockerfile ends with:
```dockerfile
WORKDIR /app/apps/<service>
CMD ["node", "dist/main.js"]
```

### Connection refused to gRPC service

The gRPC server must bind on `0.0.0.0`, not `127.0.0.1`. In docker-compose:
```yaml
# Inside the auth_service container (its own binding address):
AUTH_SERVICE_HOST: 0.0.0.0

# Inside the api_gateway container (connecting to auth_service):
AUTH_SERVICE_HOST: auth_service
```

### Hot-reload not working

Check the volumes in `docker-compose.dev.yml`:
```yaml
volumes:
  - .:/app             # host source
  - /app/node_modules  # anonymous volume — must be a separate entry
```
If the anonymous volume line is missing, the host's (empty) `node_modules` overwrites the container's installed packages.

### Docker Hub push fails in CI

- Check `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` are set as GitHub secrets.
- The token needs **Read & Write** permissions (generate at Docker Hub → Account Settings → Security).

### Render doesn't redeploy after push

1. Test the hook manually: `curl -X POST <hook-url>`
2. Check Render logs — the image pulled successfully but the service may have crashed due to a missing env var.
3. Verify all secrets listed in [Section 9](#9-github-secrets-reference) are added to GitHub.
