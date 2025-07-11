#!/bin/bash
# ==================================================
# NAD Production Deployment Script
# File: deployment/deploy.sh
# ==================================================

set -e  # Exit on any error

echo "🚀 NAD Test Cycle - Production Deployment"
echo "========================================"

# Configuration
REPO_URL="https://github.com/davidnettles25/nad-app.git"
TEMP_DIR="/tmp/nad-deployment-$(date +%s)"
BACKEND_TARGET="/opt/nad-app"
FRONTEND_TARGET="/home/bitnami/htdocs/nad-app"
BACKUP_DIR="/home/bitnami/backups/$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Check if running as correct user
if [ "$USER" != "bitnami" ]; then
    error "This script must be run as the bitnami user"
fi

# Step 1: Create backup
log "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"

if [ -d "$BACKEND_TARGET" ]; then
    log "Backing up backend files..."
    tar -czf "$BACKUP_DIR/backend-backup.tar.gz" -C "$BACKEND_TARGET" .
fi

if [ -d "$FRONTEND_TARGET" ]; then
    log "Backing up frontend files..."
    tar -czf "$BACKUP_DIR/frontend-backup.tar.gz" -C "$FRONTEND_TARGET" .
fi

# Step 2: Clone repository
log "📥 Cloning repository..."
git clone "$REPO_URL" "$TEMP_DIR"
cd "$TEMP_DIR"

# Step 3: Deploy backend
log "🚀 Deploying backend..."

# Stop API server
log "Stopping NAD API..."
pm2 stop nad-api || warn "nad-api was not running"

# Backup .env file
if [ -f "$BACKEND_TARGET/.env" ]; then
    cp "$BACKEND_TARGET/.env" "$TEMP_DIR/backend/.env"
    log "Preserved .env file"
fi

# Sync backend files
log "Syncing backend files..."
sudo rsync -av --delete \
    --exclude='.env' \
    --exclude='node_modules' \
    --exclude='uploads' \
    --exclude='logs' \
    "$TEMP_DIR/backend/" "$BACKEND_TARGET/"

# Install dependencies
log "Installing backend dependencies..."
cd "$BACKEND_TARGET"
npm install --production

# Start API server
log "Starting NAD API..."
pm2 start ecosystem.config.js || pm2 restart nad-api

# Step 4: Deploy frontend
log "🎨 Deploying frontend..."

# Sync frontend files
log "Syncing frontend files..."
sudo rsync -av --delete \
    "$TEMP_DIR/frontend/" "$FRONTEND_TARGET/"

# Set proper permissions
log "Setting file permissions..."
sudo chown -R bitnami:daemon "$FRONTEND_TARGET"
sudo chmod -R 755 "$FRONTEND_TARGET"

# Step 5: Update database if needed
if [ -f "$TEMP_DIR/database/migrations/latest.sql" ]; then
    log "🗄️ Applying database migrations..."
    mysql -u nad_user -p nad_cycle < "$TEMP_DIR/database/migrations/latest.sql"
fi

# Step 6: Test deployment
log "🧪 Testing deployment..."

# Test API
if curl -f -s http://localhost:3001/health > /dev/null; then
    log "✅ API health check passed"
else
    error "❌ API health check failed"
fi

# Test frontend
if curl -f -s http://localhost/nad-app/ > /dev/null; then
    log "✅ Frontend accessible"
else
    warn "⚠️ Frontend test inconclusive"
fi

# Step 7: Cleanup
log "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"

log "✅ Deployment completed successfully!"
echo ""
echo "🔗 Endpoints:"
echo "   Frontend: https://mynadtest.info/nad-app/"
echo "   API:      https://mynadtest.info:3001/"
echo "   Admin:    https://mynadtest.info/nad-app/admin-dashboard.html"
echo ""
echo "📦 Backup location: $BACKUP_DIR"
echo ""
log "🎉 NAD Test Cycle deployment complete!"

# Optional: Send notification
# You can add email/Slack notification here
