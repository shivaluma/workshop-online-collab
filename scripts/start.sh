#!/bin/sh
set -e

echo "Running database migrations..."
node node_modules/prisma/build/index.js db push --skip-generate

echo "Starting WebSocket server..."
node src/server/ws-server.js &

echo "Starting Next.js server..."
exec node server.js
