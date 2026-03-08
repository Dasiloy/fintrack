# =============================================================================
# FinTrack — Auth Service (production)
#
# gRPC microservice. Binds on AUTH_SERVICE_HOST:AUTH_SERVICE_PORT.
# Binds on 0.0.0.0 (set via ENV in runner stage) to accept traffic inside Docker / Render.
# Build context MUST be the monorepo root:
#   docker build -f docker/auth_service/Dockerfile .
# =============================================================================

# ── Stage 1: Base ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN npm install -g turbo@2.8.4

# ── Stage 2: Prune workspace ──────────────────────────────────────────────────
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune auth_service --docker

# ── Stage 3: Install dependencies (layer-cached) ──────────────────────────────
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/.npmrc ./.npmrc
RUN pnpm install --frozen-lockfile

# ── Stage 4: Build ────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
# Generate the Prisma client for Linux before the TypeScript build.
RUN pnpm --filter @fintrack/database run db:generate
# nest-cli.json assets: ["**/*.hbs"] — handlebars templates are copied to dist/
RUN pnpm turbo build --filter=auth_service

# ── Stage 5: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init netcat-openbsd

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

ENV NODE_ENV=production
# Bind on all interfaces so the container is reachable in Docker / Render
ENV AUTH_SERVICE_HOST=0.0.0.0
ENV AUTH_SERVICE_PORT=4002
ENV MICROSERVICE_NAME=AUTH_SERVICE
# Safe non-secret defaults — override in Render environment if needed
ENV JWT_OTP_TOKEN_EXPIRATION=30m
ENV JWT_2FA_TOKEN_EXPIRATION=5m
ENV OTP_EXPIRY_MINUTES=5
ENV MAX_LOGIN_ATTEMPTS=3

# WORKDIR = apps/auth_service so process.cwd() resolves proto paths correctly
WORKDIR /app/apps/auth_service

COPY --from=builder --chown=nestjs:nodejs /app/apps/auth_service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/auth_service/package.json ./package.json

COPY --from=builder --chown=nestjs:nodejs /app/packages /app/packages
COPY --from=builder --chown=nestjs:nodejs /app/node_modules /app/node_modules

USER nestjs
EXPOSE 4002

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
