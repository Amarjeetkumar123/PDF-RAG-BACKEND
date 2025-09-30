# Use latest Node.js Alpine for smaller image size
FROM node:alpine

# Enable corepack and pin pnpm to the package.json version
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

# Set working directory
WORKDIR /app

# Copy lockfile and manifest first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
ENV NODE_ENV=production
RUN pnpm install --frozen-lockfile --prod

# Copy source code
COPY . .

# Ensure uploads directory exists and is writable
RUN mkdir -p uploads && chown -R node:node /app

# Expose port
ENV PORT=8000
EXPOSE 8000

# Add a simple healthcheck (tweak path/timeout as needed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:${PORT}/ || exit 1

# Drop root
USER node

# Default command
CMD ["node", "app.js"]