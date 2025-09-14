# =============================================================================
# Production Dockerfile for Web Dashboard (Next.js)
# Multi-stage build optimized for security and performance
# =============================================================================

# Stage 1: Dependencies and build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for native modules and upgrade curl to fix CVE-2025-5399
RUN apk update && apk upgrade && apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install dependencies (including dev dependencies for build)
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Build the application
RUN pnpm run build

# =============================================================================
# Stage 2: Production runtime
FROM node:18-alpine AS runtime

# Create non-root user for security
RUN addgroup -g 1001 -S webapp && \
    adduser -S webapp -u 1001 -G webapp

# Install runtime dependencies and upgrade curl to fix CVE-2025-5399
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    tzdata

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=webapp:webapp /app/.next ./.next
COPY --from=builder --chown=webapp:webapp /app/public ./public
COPY --from=builder --chown=webapp:webapp /app/node_modules ./node_modules
COPY --from=builder --chown=webapp:webapp /app/package.json ./
COPY --from=builder --chown=webapp:webapp /app/next.config.js ./

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R webapp:webapp /app/logs && \
    chmod 755 /app/logs

# Switch to non-root user
USER webapp

# Environment variables
ENV NODE_ENV=production
ENV PORT=3003
ENV HOSTNAME=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose ports
EXPOSE 3003

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "node_modules/.bin/next", "start", "-p", "3003"]

# Build arguments and labels
ARG BUILD_VERSION=1.0.0
ARG BUILD_DATE
ARG GIT_COMMIT
ARG GIT_BRANCH=main

LABEL org.opencontainers.image.title="Web Dashboard" \
      org.opencontainers.image.description="Modern web interface for MCP Shipping Suite" \
      org.opencontainers.image.version="${BUILD_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.source="https://github.com/mcp-shipping/perplexity-suite" \
      org.opencontainers.image.revision="${GIT_COMMIT}" \
      org.opencontainers.image.vendor="MCP Shipping Suite" \
      org.opencontainers.image.licenses="MIT"
