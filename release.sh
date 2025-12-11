#!/bin/bash
set -euo pipefail

# Release workflow script: bump version, tag, and optionally deploy
# Usage: ./release.sh [patch|minor|major]

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { printf "${BLUE}[%s]${NC} %s\n" "$(date -u '+%H:%M:%S')" "$*"; }
success() { printf "${GREEN}✓${NC} %s\n" "$*"; }
error() { printf "${RED}✗${NC} %s\n" "$*"; exit 1; }
warn() { printf "${YELLOW}⚠${NC} %s\n" "$*"; }

# Check if on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  error "Must be on main branch to release (currently on: $CURRENT_BRANCH)"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  error "Uncommitted changes detected. Commit or stash before releasing."
fi

# Check if remote is up to date
git fetch origin main --quiet
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  error "Local main is not up to date with origin/main. Pull latest changes first."
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
log "Current version: ${GREEN}v${CURRENT_VERSION}${NC}"

# Determine version type
VERSION_TYPE=""
if [ $# -eq 1 ]; then
  VERSION_TYPE="$1"
else
  echo ""
  echo "Select version bump type:"
  echo "  ${GREEN}1)${NC} patch   - Bug fixes (e.g., 0.1.3 → 0.1.4)"
  echo "  ${BLUE}2)${NC} minor   - New features (e.g., 0.1.3 → 0.2.0)"
  echo "  ${RED}3)${NC} major   - Breaking changes (e.g., 0.1.3 → 1.0.0)"
  echo ""
  read -p "Enter choice [1-3]: " choice
  
  case "$choice" in
    1) VERSION_TYPE="patch" ;;
    2) VERSION_TYPE="minor" ;;
    3) VERSION_TYPE="major" ;;
    *) error "Invalid choice" ;;
  esac
fi

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
  error "Invalid version type: $VERSION_TYPE (must be: patch, minor, or major)"
fi

log "Bumping version (${VERSION_TYPE})..."
npm run "version:${VERSION_TYPE}" --silent

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
success "Version bumped to: ${GREEN}v${NEW_VERSION}${NC}"

# Show git status
log "Changes made:"
git status --short

echo ""
read -p "Commit and tag this version? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  warn "Release cancelled. Rolling back package.json changes..."
  git checkout package.json
  exit 0
fi

# Commit version bump
log "Committing version bump..."
git add package.json
git commit -m "chore: bump version to v${NEW_VERSION}" --no-verify

# Create git tag
log "Creating git tag v${NEW_VERSION}..."
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"

# Push to remote
echo ""
read -p "Push to remote (main + tags)? [y/N]: " push_confirm
if [[ "$push_confirm" =~ ^[Yy]$ ]]; then
  log "Pushing to remote..."
  git push origin main
  git push origin "v${NEW_VERSION}"
  success "Pushed to remote"
else
  warn "Skipped push to remote"
  warn "To push manually: git push origin main && git push origin v${NEW_VERSION}"
fi

# Ask about deployment
echo ""
read -p "Deploy to production now? [y/N]: " deploy_confirm
if [[ "$deploy_confirm" =~ ^[Yy]$ ]]; then
  log "Starting deployment..."
  ./deploy.sh
  success "Deployment complete!"
else
  warn "Skipped deployment"
  warn "To deploy manually: ./deploy.sh"
fi

echo ""
success "Release v${NEW_VERSION} complete! 🎉"
echo ""
echo "Summary:"
echo "  • Version: ${GREEN}v${CURRENT_VERSION}${NC} → ${GREEN}v${NEW_VERSION}${NC}"
echo "  • Type: ${VERSION_TYPE}"
echo "  • Tag: v${NEW_VERSION}"
if [[ "$push_confirm" =~ ^[Yy]$ ]]; then
  echo "  • Pushed: ${GREEN}✓${NC}"
else
  echo "  • Pushed: ${YELLOW}✗${NC}"
fi
if [[ "$deploy_confirm" =~ ^[Yy]$ ]]; then
  echo "  • Deployed: ${GREEN}✓${NC}"
else
  echo "  • Deployed: ${YELLOW}✗${NC}"
fi
echo ""
