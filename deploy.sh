#!/bin/bash

# Deployment script for prompt-studio on DigitalOcean
# Run this script on the Droplet to update the application

set -e

APP_DIR="/var/www/prompt-studio"
BRANCH="main"

echo "🚀 Starting deployment..."

# Validate NODE_ENV is set to production
echo "🔍 Validating production environment..."
if [ ! -f "$APP_DIR/.env" ]; then
  echo "❌ Error: .env file not found at $APP_DIR/.env"
  echo "Please create .env file with NODE_ENV=production"
  exit 1
fi

if ! grep -q "NODE_ENV=production" "$APP_DIR/.env"; then
  echo "❌ Error: NODE_ENV is not set to 'production' in .env file"
  echo "Please set NODE_ENV=production in $APP_DIR/.env"
  exit 1
fi

# Check SESSION_SECRET is set and not default
if grep -q "SESSION_SECRET=" "$APP_DIR/.env"; then
  SECRET_VALUE=$(grep "SESSION_SECRET=" "$APP_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'")
  if [ -z "$SECRET_VALUE" ] || [ "$SECRET_VALUE" = "your-session-secret-here-change-in-production" ] || [ "$SECRET_VALUE" = "change-this-secret-in-production" ]; then
    echo "❌ Error: SESSION_SECRET is not set or using default value"
    echo "Generate a secure secret: openssl rand -base64 32"
    exit 1
  fi
else
  echo "❌ Error: SESSION_SECRET is not defined in .env"
  exit 1
fi

echo "✅ Production environment validated (NODE_ENV=production, SESSION_SECRET configured)"

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

# Clean up unnecessary files
echo "🧹 Cleaning up production files..."
if [ -f "$APP_DIR/cleanup-production.sh" ]; then
  ./cleanup-production.sh
else
  echo "⚠️  Cleanup script not found, skipping..."
fi

# Restart PM2 process
echo "♻️  Restarting application..."
pm2 restart prompt-studio

# Save PM2 configuration
pm2 save

# Wait for app to start
echo "⏳ Waiting for application to start..."
sleep 3

# Verify application is running
echo "🔍 Verifying application health..."
if pm2 list | grep -q "prompt-studio.*online"; then
  echo "✅ PM2 process is online"
else
  echo "❌ Error: PM2 process is not online"
  pm2 status
  exit 1
fi

# Check if application responds
if curl -f -s -o /dev/null http://localhost:3000; then
  echo "✅ Application is responding on port 3000"
else
  echo "⚠️  Warning: Application may not be responding (check logs)"
fi

echo ""
echo "✅ Deployment complete!"
echo "🎉 Application successfully deployed in PRODUCTION mode"
echo ""
echo "📊 Check status with: pm2 status"
echo "📜 View logs with: pm2 logs prompt-studio"
