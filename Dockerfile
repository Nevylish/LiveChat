FROM node:22-alpine AS builder

WORKDIR /app

ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1

# Install pnpm
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/server/package.json ./packages/server/
COPY packages/web/package.json ./packages/web/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# Build web frontend
RUN pnpm --filter @livechat/web build

# Build server
RUN pnpm --filter @livechat/server build

FROM node:22-alpine

RUN apk update
RUN apk upgrade
RUN apk add --no-cache ffmpeg python3 && ln -sf python3 /usr/bin/python
ENV FFPROBE_PATH=/usr/bin/ffprobe

WORKDIR /app

ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1

# Install pnpm
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/server/package.json ./packages/server/

RUN pnpm install --filter @livechat/server --prod --frozen-lockfile --ignore-scripts

# Copy built server
COPY --from=builder /app/packages/server/dist ./packages/server/dist

# Copy overlay (served as static files)
COPY --from=builder /app/packages/overlay ./packages/overlay

# Copy built web frontend
COPY --from=builder /app/packages/web/dist ./packages/web/dist

# Copy shared assets
COPY --from=builder /app/shared ./shared

# Copy .env
COPY --from=builder /app/.env ./.env

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
RUN chmod -R +x /app/packages/server/node_modules/@ffprobe-installer/linux-x64/ffprobe || true
USER appuser

CMD ["node", "packages/server/dist/index.js"]