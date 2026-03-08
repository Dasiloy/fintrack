# =============================================================================
# FinTrack — API Gateway (production)
#
# 5-stage multi-stage build using Turborepo workspace pruning.
# Build context MUST be the monorepo root:
#   docker build -f docker/api_gateway/Dockerfile .
#
# Why WORKDIR is /app/apps/api_gateway in the runner:
#   services.ts resolves proto paths as:
#     join(process.cwd(), '..', '..', 'packages/types/proto/...')
#   Setting WORKDIR to apps/api_gateway makes process.cwd() point two levels
#   below the monorepo root, so the proto path resolves correctly.
# =============================================================================

# ── Stage 1: Base ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
# Use corepack to activate the exact pnpm version from package.json
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN npm install -g turbo@2.8.4

# ── Stage 2: Prune workspace ──────────────────────────────────────────────────
# turbo prune creates a minimal subset of the monorepo containing only the
# packages and apps required to build api_gateway, plus a pruned lock file.
# Output: out/json/ (manifests only) and out/full/ (all source files).
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune api_gateway --docker

# ── Stage 3: Install dependencies (layer-cached) ──────────────────────────────
# Copy only the pruned package.json files first. Docker caches this layer
# separately, so pnpm install only re-runs when dependencies change.
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# .npmrc must be present so pnpm hoists @prisma/* and the prisma CLI to root node_modules.
# Without this, the custom Prisma output at dist/generated/ cannot resolve
# @prisma/client-runtime-utils via standard Node module resolution.
COPY --from=pruner /app/.npmrc ./.npmrc
RUN pnpm install --frozen-lockfile

# ── Stage 4: Build ────────────────────────────────────────────────────────────
# Brings in the full source and builds api_gateway and all its workspace deps.
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
# Generate the Prisma client for Linux before the TypeScript build.
# prisma generate only reads schema.prisma — no DATABASE_URL needed.
RUN pnpm --filter @fintrack/database run db:generate
RUN pnpm turbo build --filter=api_gateway

# ── Stage 5: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init netcat-openbsd

# Least-privilege user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

ENV NODE_ENV=production
# Bind on all interfaces so the container is reachable in Docker / Render
ENV API_GATEWAY_HOST=0.0.0.0
ENV API_GATEWAY_PORT=4001
ENV MICROSERVICE_NAME=API_GATEWAY
# Safe non-secret defaults — override in Render environment if needed
ENV JWT_ACCESS_TOKEN_EXPIRATION=1h
ENV JWT_REFRESH_TOKEN_EXPIRATION=1d
ENV JWT_OTP_TOKEN_EXPIRATION=60m
ENV OTP_EXPIRY_MINUTES=5
ENV MAX_LOGIN_ATTEMPTS=3

# CRITICAL: WORKDIR must be apps/api_gateway so that process.cwd() inside the
# running container resolves the proto file paths correctly (see header note).
WORKDIR /app/apps/api_gateway

# Compiled service output
COPY --from=builder --chown=nestjs:nodejs /app/apps/api_gateway/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api_gateway/package.json ./package.json

# Shared workspace packages:
#   • packages/*/dist/   — compiled JS that node_modules symlinks point to
#   • packages/types/proto/ — .proto files required at runtime by gRPC
COPY --from=builder --chown=nestjs:nodejs /app/packages /app/packages

# External node_modules (includes pnpm symlinks into /app/packages)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules /app/node_modules

USER nestjs
EXPOSE 4001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
