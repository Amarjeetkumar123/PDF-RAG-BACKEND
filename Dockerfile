# ---------- Build Stage ----------
FROM node:23-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# ---------- Runtime Stage ----------
FROM node:23-alpine AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.15.1 --activate
RUN apk add --no-cache wget   # keep wget for healthcheck

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Copy all source code
COPY --from=build /app/. .

RUN chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

USER node

CMD ["node", "app.js"]
