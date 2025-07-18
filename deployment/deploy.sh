#!/bin/bash
# NAD Production Deployment Script
# Run from production server: ./deploy.sh

set -e

echo "🚀 NAD Test Cycle - Production Deployment"
echo "========================================"

REPO_URL="https://github.com/davidnettles25/nad-app.git"
TEMP_DIR="/tmp/nad-deployment-$(date +%s)"
BACKEND_TARGET="/opt/nad-app"
FRONTEND_TARGET="/home/bitnami/htdocs/nad-app"
BACKUP_DIR="/home/bitnami/backups/$(date +%Y%m%d_%H%M%S)"

log() {
    echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

error() {
    echo -e "\033[0;31m[ERROR] $1\033[0m"
    exit 1
}

# Create backup
log "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
[ -d "$BACKEND_TARGET" ] && tar -czf "$BACKUP_DIR/backend-backup.tar.gz" -C "$BACKEND_TARGET" .
[ -d "$FRONTEND_TARGET" ] && tar -czf "$BACKUP_DIR/frontend-backup.tar.gz" -C "$FRONTEND_TARGET" .

# Download latest code
log "📥 Downloading latest code..."
git clone "$REPO_URL" "$TEMP_DIR"

# Deploy backend
log "🚀 Deploying backend..."
pm2 stop nad-api || true
[ -f "$BACKEND_TARGET/.env" ] && cp "$BACKEND_TARGET/.env" "$TEMP_DIR/backend/.env"
cp -r "$TEMP_DIR/backend/"* "$BACKEND_TARGET/"
cd "$BACKEND_TARGET"
npm install --production
pm2 start ecosystem.config.js || pm2 restart nad-api

# Deploy frontend  
log "🎨 Deploying frontend..."
mkdir -p "$FRONTEND_TARGET"
cp -r "$TEMP_DIR/frontend/"* "$FRONTEND_TARGET/"
chown -R bitnami:bitnami "$FRONTEND_TARGET"
chmod -R 755 "$FRONTEND_TARGET"

# Test deployment
log "🧪 Testing deployment..."
sleep 5
if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
    log "✅ API health check passed"
else
    log "⚠️ API health check inconclusive"
fi

# Cleanup
rm -rf "$TEMP_DIR"

log "✅ Deployment completed!"
log "🔗 Frontend: https://mynadtest.info/nad-app/"
log "🔗 API: https://mynadtest.info/"
log "📦 Backup: $BACKUP_DIR"
