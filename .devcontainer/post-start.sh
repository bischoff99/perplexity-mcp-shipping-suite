#!/bin/bash

# Post-start script for devcontainer
set -e

echo "🔄 Running post-start setup..."

# Ensure services are healthy
echo "⏳ Waiting for database and cache to be ready..."

# Wait for PostgreSQL
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

# Wait for Redis
until redis-cli -h redis ping > /dev/null 2>&1; do
  echo "Waiting for Redis to be ready..."
  sleep 2
done

echo "✅ All services are ready!"

# Run any database migrations if they exist
if [ -f "scripts/migrate.sh" ]; then
    echo "🗄️  Running database migrations..."
    bash scripts/migrate.sh
fi

# Start development services in the background (optional)
if [ "$AUTO_START_SERVICES" = "true" ]; then
    echo "🚀 Auto-starting development services..."
    pnpm run dev &
fi

echo "✅ Post-start setup completed!"