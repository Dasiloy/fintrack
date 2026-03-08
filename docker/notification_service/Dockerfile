# =============================================================================
# FinTrack — Notification Service (production)
#
# gRPC microservice + BullMQ worker. Processes email jobs from Redis queue.
# nest-cli assets: ["templates/**/*"] — Handlebars templates copied to dist/.
# Build context MUST be the monorepo root:
#   docker build -f docker/notification_service/Dockerfile .
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
RUN turbo prune notification_service --docker

# ── Stage 3: Build ────────────────────────────────────────────────────────────
# Install then build in a single stage so pnpm creates all workspace package
# node_modules correctly (the previous installer→builder copy approach broke
# workspace package .bin symlinks, causing "prisma: not found").
# Layer caching is preserved: json/ and lock are copied before source, so
# pnpm install is only re-run when dependencies change, not on every code push.
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/.npmrc ./.npmrc
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# Generate the Prisma client for Linux before the TypeScript build.
RUN pnpm --filter @fintrack/database run db:generate
# nest-cli assets include "templates/**/*" so dist/ contains HBS email templates
RUN pnpm turbo build --filter=notification_service

# ── Stage 4: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init netcat-openbsd

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

ENV NODE_ENV=production
# Bind on all interfaces so the container is reachable in Docker / Render
ENV NOTIFICATION_SERVICE_HOST=0.0.0.0
ENV NOTIFICATION_SERVICE_PORT=4009
ENV MICROSERVICE_NAME=NOTIFICATION_SERVICE

WORKDIR /app/apps/notification_service

COPY --from=builder --chown=nestjs:nodejs /app/apps/notification_service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/notification_service/package.json ./package.json

COPY --from=builder --chown=nestjs:nodejs /app/packages /app/packages
COPY --from=builder --chown=nestjs:nodejs /app/node_modules /app/node_modules

USER nestjs
EXPOSE 4009

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
