#!/bin/bash
set -euo pipefail

# This script runs on the server after rsync. It installs prod deps and reloads PM2.

APP_DIR="/var/www/prompt-studio"
cd "$APP_DIR"

# Ensure required files exist
[ -f package.json ] || { echo "package.json missing"; exit 1; }
[ -f ecosystem.config.js ] || { echo "ecosystem.config.js missing"; exit 1; }

# Stop app to avoid issues while replacing node_modules
pm2 stop ecosystem.config.js || true

# Install production dependencies only
npm ci --omit=dev

# Optional Prisma migrations if present
if [ -d prisma ]; then
  npx prisma generate || true
  npx prisma migrate deploy || true
fi

# Ensure logs directory exists
mkdir -p logs

# Start or reload app
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

# Basic health check (best-effort)
if command -v curl >/dev/null; then
  if curl -fsS -o /dev/null http://localhost:3000; then
    echo "Health check OK"
  else
    echo "Health check failed (HTTP)"
  fi
fi
