FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
RUN npm install -g pnpm@9.12.0
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY services/purchase/package.json ./services/purchase/
RUN pnpm install --frozen-lockfile
COPY packages/database/ ./packages/database/
COPY services/purchase/ ./services/purchase/
RUN pnpm --filter @bistrobrain/database db:generate
RUN pnpm --filter @bistrobrain/purchase-service build

FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init wget
RUN npm install -g pnpm@9.12.0
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY services/purchase/package.json ./services/purchase/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/services/purchase/dist ./services/purchase/dist
ENV NODE_ENV=production
EXPOSE 4006
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "services/purchase/dist/main.js"]
