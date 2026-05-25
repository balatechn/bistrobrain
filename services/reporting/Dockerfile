FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl dumb-init python3 make g++
RUN npm install -g pnpm@9.12.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/database/prisma ./packages/database/prisma/
COPY services/reporting/package.json ./services/reporting/

RUN NODE_ENV=development pnpm install --frozen-lockfile

COPY packages/database/ ./packages/database/
COPY services/reporting/ ./services/reporting/

RUN pnpm --filter @bistrobrain/database db:generate
RUN pnpm --filter @bistrobrain/database build
RUN pnpm --filter @bistrobrain/reporting-service build

ENV NODE_ENV=production
EXPOSE 4009
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "services/reporting/dist/main.js"]
