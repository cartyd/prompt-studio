#!/bin/bash
set -e

# Configuration
SERVER="root@45.55.131.181"
APP_DIR="/var/www/prompt-studio"

echo "🔍 Checking for uncommitted changes..."
if [[ -n $(git status -s) ]]; then
  echo "⚠️  You have uncommitted changes:"
  git status -s
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "📤 Pushing to git..."
git push origin main

echo "🔗 Connecting to production server: $SERVER"
ssh $SERVER <<'ENDSSH'
set -e
cd /var/www/prompt-studio

echo "🚀 Running deployment on production..."
./deploy.sh

echo ""
echo "✅ Deployment complete!"
echo "📊 Application status:"
pm2 status prompt-studio

echo ""
echo "📜 Recent logs:"
pm2 logs prompt-studio --lines 10 --nostream
ENDSSH

echo ""
echo "🎉 Remote deployment complete!"
echo "🌐 Visit http://45.55.131.181 to verify"
