#!/bin/sh
set -e

echo "Running database migrations..."

# Check if force reset is requested
if [ "$FORCE_DB_RESET" = "true" ]; then
    echo "⚠️ Force resetting database (FORCE_DB_RESET=true)..."
    node node_modules/prisma/build/index.js db push --force-reset --skip-generate
else
    node node_modules/prisma/build/index.js db push --skip-generate
fi

echo "Starting WebSocket server..."
node src/server/ws-server.js &

echo "Starting Next.js server..."
exec node server.js
