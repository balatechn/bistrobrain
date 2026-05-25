# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat python3 make g++
RUN npm install -g pnpm@9.12.0

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./

# Copy all package.json files (for efficient caching)
COPY packages/database/package.json ./packages/database/
COPY services/auth/package.json ./services/auth/

COPY packages/database/prisma ./packages/database/prisma/
# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/database/ ./packages/database/
COPY services/auth/ ./services/auth/

# Generate Prisma client
RUN pnpm --filter @bistrobrain/database db:generate

# Build
RUN pnpm --filter @bistrobrain/auth-service build

# ============================================================
# Stage 2: Production
# ============================================================
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init wget
RUN npm install -g pnpm@9.12.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY services/auth/package.json ./services/auth/

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/services/auth/dist ./services/auth/dist

ENV NODE_ENV=production

EXPOSE 4001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "services/auth/dist/main.js"]

