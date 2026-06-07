FROM node:20-alpine AS builder

WORKDIR /app

ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine

RUN apk update
RUN apk upgrade
RUN apk add --no-cache ffmpeg python3 && ln -sf python3 /usr/bin/python
ENV FFPROBE_PATH=/usr/bin/ffprobe

WORKDIR /app

ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/public ./dist/public
COPY --from=builder /app/.env ./.env

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
RUN chmod -R +x /app/node_modules/@ffprobe-installer/linux-x64/ffprobe || true
USER appuser

CMD ["node", "dist/index.js"]