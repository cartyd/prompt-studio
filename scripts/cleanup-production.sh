#!/bin/bash
# Remove unnecessary files from production server
# Run this on the production server after deployment

set -e

APP_DIR="/var/www/prompt-studio"
cd $APP_DIR

echo "🧹 Cleaning up production server..."

# Remove development/testing files
echo "📋 Removing test files..."
rm -rf tests/
rm -rf test-results/
rm -rf playwright-report/
rm -f playwright.config.ts
rm -f jest.config.js
rm -f TESTING.md

# Remove documentation
echo "📚 Removing documentation..."
rm -rf docs/
rm -f README.md
rm -f DEPLOYMENT.md
rm -f VERSION.md

# Remove development scripts and configs
echo "🔧 Removing dev configs..."
rm -rf .vscode/
rm -f tsconfig.json
rm -f .gitignore
rm -f .env.example

# Remove source files (we only need dist/)
echo "💾 Removing source files..."
rm -rf src/

# Remove setup/deployment scripts
echo "📜 Removing setup scripts..."
rm -f setup-droplet.sh
rm -f deploy-remote.sh
rm -f nginx-config

# Remove misc files
echo "🗑️  Removing misc files..."
rm -f simplicate-02.png
rm -f sh
rm -f session.db  # empty duplicate

# Remove git repository (optional but recommended)
echo "🔐 Removing .git directory..."
rm -rf .git/

# Remove scripts except create-admin (might be useful)
echo "📦 Cleaning scripts directory..."
find scripts/ -type f ! -name 'create-admin.ts' -delete 2>/dev/null || true

echo "✅ Production cleanup complete!"
echo ""
echo "📊 Remaining essential files:"
ls -lh
