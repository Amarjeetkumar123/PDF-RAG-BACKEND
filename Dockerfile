# ---------- Single Stage ----------
FROM node:23-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate \
    && apk add --no-cache wget  # wget for healthcheck

# Copy only package.json first for cache
COPY package.json ./

# Install dependencies (prod only)
RUN pnpm install --prod

# Copy rest of source code
COPY . .

# Set permissions
RUN chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

USER node

CMD ["node", "app.js"]
