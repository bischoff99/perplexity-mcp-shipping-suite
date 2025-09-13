# =============================================================================
# Production Dockerfile for EasyPost MCP Server
# Multi-stage build optimized for security and performance
# =============================================================================

# Stage 1: Dependencies and build
FROM node:24-alpine AS builder

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

# Install dependencies (including dev dependencies for build)
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY src/ ./src/
COPY tests/ ./tests/

# Build the application
RUN pnpm run build

# Remove dev dependencies after build
RUN pnpm prune --prod

# =============================================================================
# Stage 2: Production runtime
FROM node:24-alpine AS runtime

# Create non-root user for security
RUN addgroup -g 1001 -S easypost && \
    adduser -S easypost -u 1001 -G easypost

# Install runtime dependencies and upgrade curl to fix CVE-2025-5399
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    tzdata

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=easypost:easypost /app/dist ./dist
COPY --from=builder --chown=easypost:easypost /app/node_modules ./node_modules
COPY --from=builder --chown=easypost:easypost /app/package.json ./

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R easypost:easypost /app/logs && \
    chmod 755 /app/logs

# Switch to non-root user
USER easypost

# Environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose ports
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# Build arguments and labels
ARG BUILD_VERSION=1.0.0
ARG BUILD_DATE
ARG GIT_COMMIT
ARG GIT_BRANCH=main

LABEL org.opencontainers.image.title="EasyPost MCP Server" \
      org.opencontainers.image.description="Production-ready EasyPost MCP Server for shipping automation" \
      org.opencontainers.image.version="${BUILD_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.source="https://github.com/mcp-shipping/easypost-mcp-server" \
      org.opencontainers.image.revision="${GIT_COMMIT}" \
      org.opencontainers.image.vendor="MCP Shipping Suite" \
      org.opencontainers.image.licenses="MIT"