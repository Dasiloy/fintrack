# =============================================================================
# FinTrack — Payment Service (production)
#
# gRPC microservice for subscription management (Stripe integration).
# Build context MUST be the monorepo root:
#   docker build -f docker/payment_service/Dockerfile .
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
RUN turbo prune payment_service --docker

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
RUN pnpm turbo build --filter=payment_service

# ── Stage 5: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init netcat-openbsd

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

ENV NODE_ENV=production

WORKDIR /app/apps/payment_service

COPY --from=builder --chown=nestjs:nodejs /app/apps/payment_service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/payment_service/package.json ./package.json

COPY --from=builder --chown=nestjs:nodejs /app/packages /app/packages
COPY --from=builder --chown=nestjs:nodejs /app/node_modules /app/node_modules

USER nestjs
EXPOSE 4008

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
