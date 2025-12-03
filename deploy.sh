#!/bin/bash

# Deployment script for prompt-studio on DigitalOcean
# Run this script on the Droplet to update the application

set -e

APP_DIR="/var/www/prompt-studio"
BRANCH="main"

echo "🚀 Starting deployment..."

# Navigate to app directory
cd $APP_DIR

# Stash any local changes
echo "💾 Stashing any local changes..."
git stash

# Pull latest changes
echo "📥 Pulling latest code from $BRANCH..."
git pull origin $BRANCH

# Reapply stashed changes if any
if git stash list | grep -q "stash@{0}"; then
  echo "🔄 Reapplying stashed changes..."
  git stash pop || echo "⚠️  Could not reapply stash (conflicts may exist)"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

# Run database migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate:deploy

# Build TypeScript
echo "🔨 Building application..."
npm run build

# Restart PM2 process
echo "♻️  Restarting application..."
pm2 restart prompt-studio

# Save PM2 configuration
pm2 save

echo "✅ Deployment complete!"
echo "📊 Check status with: pm2 status"
echo "📜 View logs with: pm2 logs prompt-studio"
