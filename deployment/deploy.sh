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

# Get deployment info from git
log "📋 Recording deployment information..."
cd "$TEMP_DIR"
COMMIT_HASH=$(git rev-parse HEAD | cut -c1-7)
COMMIT_DATE=$(git log -1 --format=%ci)
COMMIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
DEPLOY_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Create deployment info file
cat > deployment-info.json << EOF
{
  "commit": "$COMMIT_HASH",
  "date": "$COMMIT_DATE",
  "branch": "$COMMIT_BRANCH",
  "deployTime": "$DEPLOY_TIME",
  "deployedBy": "deploy.sh"
}
EOF

# Deploy backend
log "🚀 Deploying backend..."
pm2 stop nad-api || true

# Backup existing .env file to temp location
ENV_BACKUP=""
if [ -f "$BACKEND_TARGET/.env" ]; then
    ENV_BACKUP="/tmp/nad-env-backup-$(date +%s)"
    cp "$BACKEND_TARGET/.env" "$ENV_BACKUP"
    log "📋 Found existing .env file, backed up to temp location"
fi

# Remove old shopify directory to ensure clean update
[ -d "$BACKEND_TARGET/shopify" ] && rm -rf "$BACKEND_TARGET/shopify"

# Copy all backend files (including hidden files and directories)
rsync -av --delete --exclude='.env' --exclude='logs/' --exclude='node_modules/' "$TEMP_DIR/backend/" "$BACKEND_TARGET/"

# Ensure migrations directory exists and is copied
mkdir -p "$BACKEND_TARGET/migrations"
if [ -d "$TEMP_DIR/backend/migrations" ]; then
    cp -r "$TEMP_DIR/backend/migrations/"* "$BACKEND_TARGET/migrations/" 2>/dev/null || true
    log "✅ Migrations directory synchronized"
fi
cp "$TEMP_DIR/deployment-info.json" "$BACKEND_TARGET/"

# Restore .env file from backup
if [ -n "$ENV_BACKUP" ] && [ -f "$ENV_BACKUP" ]; then
    cp "$ENV_BACKUP" "$BACKEND_TARGET/.env"
    rm "$ENV_BACKUP"  # Clean up temp backup
    log "✅ Restored .env file to backend directory"
else
    log "⚠️ No .env file found - server will run without environment variables"
fi

cd "$BACKEND_TARGET"
npm install --production

# Setup logs directory with proper permissions
if [ -f "$BACKEND_TARGET/scripts/setup-logs.sh" ]; then
    log "📁 Setting up log directories..."
    sudo bash "$BACKEND_TARGET/scripts/setup-logs.sh"
fi

export $(cat .env | xargs) && pm2 start ecosystem.config.js --update-env || pm2 restart nad-api --update-env

# Deploy frontend  
log "🎨 Deploying frontend..."
mkdir -p "$FRONTEND_TARGET"
cp -r "$TEMP_DIR/frontend/"* "$FRONTEND_TARGET/"
cp "$TEMP_DIR/deployment-info.json" "$FRONTEND_TARGET/"
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

# Update deploy script itself
log "🔄 Updating deploy script..."
if [ -f "$TEMP_DIR/deployment/deploy.sh" ]; then
    cp "$TEMP_DIR/deployment/deploy.sh" ~/deploy.sh
    chmod +x ~/deploy.sh
    log "✅ Deploy script updated to latest version"
else
    log "⚠️ Deploy script not found in repository - skipping update"
fi

# Cleanup
rm -rf "$TEMP_DIR"

log "✅ Deployment completed!"
log "🔗 Frontend: https://mynadtest.info/nad-app/"
log "🔗 API: https://mynadtest.info/"
log "📦 Backup: $BACKUP_DIR"
