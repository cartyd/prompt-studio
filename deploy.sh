#!/bin/bash
set -euo pipefail

# Local deploy script: build a minimal release, rsync to server, then run server-side steps.

SERVER="root@45.55.131.181"
APP_DIR="/var/www/prompt-studio"
RELEASE_DIR="release"

log() { printf "[%s] %s\n" "$(date -u '+%H:%M:%S')" "$*"; }

log "Validating local toolchain (npm, rsync, ssh)"
command -v npm >/dev/null || { echo "npm not found"; exit 1; }
command -v rsync >/dev/null || { echo "rsync not found"; exit 1; }
command -v ssh >/dev/null || { echo "ssh not found"; exit 1; }

log "Clean staging folder"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

log "Install deps and build locally"
npm ci
npm run build

log "Stage minimal runtime files"
cp -r dist package.json package-lock.json ecosystem.config.js "$RELEASE_DIR"/
[ -d public ] && cp -r public "$RELEASE_DIR"/
[ -d prisma ] && cp -r prisma "$RELEASE_DIR"/
[ -d scripts ] && cp -r scripts "$RELEASE_DIR"/

log "Create server backup before deploy"
ssh "$SERVER" "set -e; ts=\$(date -u +%Y%m%d-%H%M%S); tar zcf /root/prompt-studio-backup-\$ts.tgz -C /var/www prompt-studio || true"

log "Sync release to server (preserve .env, logs, sessions.db)"
rsync -az --delete \
  --exclude '.env' \
  --exclude 'logs' \
  --exclude 'sessions.db' \
  --exclude 'prisma/data' \
  "$RELEASE_DIR"/ "$SERVER":"$APP_DIR"/

log "Upload server-side deploy script"
scp ./deploy-remote.sh "$SERVER":"$APP_DIR"/remote-deploy.sh
ssh "$SERVER" "chmod +x '$APP_DIR/remote-deploy.sh'"

log "Execute server-side deploy"
ssh "$SERVER" "bash '$APP_DIR/remote-deploy.sh'"

log "Deployment finished"
