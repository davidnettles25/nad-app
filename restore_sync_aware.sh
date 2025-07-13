#!/bin/bash
# NAD Sync-Aware Restore Script
# Restores with clear sync warnings and guidance

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show available backups
list_backups() {
    echo "📦 Available Backups:"
    echo ""
    
    if [ ! -d "/home/bitnami/backups" ]; then
        log_error "Backup directory not found: /home/bitnami/backups"
        exit 1
    fi
    
    cd /home/bitnami/backups/
    local count=0
    for backup_dir in */; do
        if [ -d "$backup_dir" ]; then
            count=$((count + 1))
            backup_name=$(basename "$backup_dir")
            backup_date=$(date -d "${backup_name:0:8} ${backup_name:9:2}:${backup_name:11:2}:${backup_name:13:2}" 2>/dev/null || echo "Unknown")
            
            echo "  $count) $backup_name"
            echo "     Date: $backup_date"
            
            # Check contents
            if [ -f "$backup_dir/backend-backup.tar.gz" ] && [ -f "$backup_dir/frontend-backup.tar.gz" ]; then
                echo -e "     Status: ${GREEN}✅ Complete${NC}"
            else
                echo -e "     Status: ${YELLOW}⚠️ Incomplete${NC}"
            fi
            echo ""
        fi
    done
    
    if [ $count -eq 0 ]; then
        log_error "No backups found"
        exit 1
    fi
}

# Validate backup
validate_backup() {
    local backup_name="$1"
    local backup_path="/home/bitnami/backups/$backup_name"
    
    if [ ! -d "$backup_path" ]; then
        log_error "Backup not found: $backup_path"
        echo ""
        list_backups
        exit 1
    fi
    
    if [ ! -f "$backup_path/backend-backup.tar.gz" ] || [ ! -f "$backup_path/frontend-backup.tar.gz" ]; then
        log_error "Incomplete backup: missing required files"
        exit 1
    fi
    
    return 0
}

# Show sync warning
show_sync_warning() {
    local backup_name="$1"
    
    echo ""
    log_warning "⚠️  IMPORTANT: SYNC WARNING"
    echo "=============================="
    echo ""
    echo "You are about to restore from backup: $backup_name"
    echo ""
    echo -e "${YELLOW}This will create a REPO/DEPLOYMENT SYNC PROBLEM:${NC}"
    echo "  📦 Your GitHub repo will have different code"
    echo "  🚀 Your deployment will have the restored code"
    echo ""
    echo "After restore, you MUST choose one of these options:"
    echo ""
    echo -e "${GREEN}Option 1: Keep the restored version${NC}"
    echo "  1. Test the restored deployment"
    echo "  2. If good: Download the restored files to your local machine"
    echo "  3. Commit the restored files to your GitHub repo"
    echo "  4. Push to GitHub"
    echo "  → Result: Repo and deployment back in sync"
    echo ""
    echo -e "${BLUE}Option 2: Discard the restored version${NC}"
    echo "  1. Test the restored deployment" 
    echo "  2. If bad: Run ./deploy.sh"
    echo "  3. This will deploy the latest code from your repo"
    echo "  → Result: Back to repo state, sync restored"
    echo ""
    echo -e "${RED}Option 3: Do nothing (NOT RECOMMENDED)${NC}"
    echo "  → Result: Permanent sync problem"
    echo ""
}

# Perform the restore
perform_restore() {
    local backup_name="$1"
    local backup_path="/home/bitnami/backups/$backup_name"
    
    log_info "Creating pre-restore backup of current state..."
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local pre_restore_backup="/home/bitnami/backups/pre_restore_$timestamp"
    mkdir -p "$pre_restore_backup"
    
    # Backup current state
    if [ -d "/opt/nad-app" ]; then
        tar -czf "$pre_restore_backup/backend-backup.tar.gz" -C "/opt/nad-app" . 2>/dev/null || true
    fi
    if [ -d "/home/bitnami/htdocs/nad-app" ]; then
        tar -czf "$pre_restore_backup/frontend-backup.tar.gz" -C "/home/bitnami/htdocs/nad-app" . 2>/dev/null || true
    fi
    
    log_success "Pre-restore backup created: $pre_restore_backup"
    
    log_info "Stopping NAD API..."
    pm2 stop nad-api 2>/dev/null || log_warning "NAD API was not running"
    
    log_info "Restoring backend from backup..."
    cd /opt/nad-app
    tar -xzf "$backup_path/backend-backup.tar.gz"
    
    log_info "Restoring frontend from backup..."
    cd /home/bitnami/htdocs/nad-app
    tar -xzf "$backup_path/frontend-backup.tar.gz"
    
    log_info "Setting permissions..."
    sudo chown -R bitnami:bitnami /opt/nad-app /home/bitnami/htdocs/nad-app
    
    log_info "Starting NAD API..."
    cd /opt/nad-app
    pm2 restart nad-api || pm2 start ecosystem.config.js
    
    log_success "Restore completed!"
    
    # Test the restoration
    sleep 3
    if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
        log_success "✅ API health check passed"
    else
        log_warning "⚠️ API health check failed - may need manual restart"
    fi
}

# Show post-restore instructions
show_post_restore_instructions() {
    local backup_name="$1"
    
    echo ""
    echo "🎉 RESTORE COMPLETED"
    echo "==================="
    echo ""
    echo "Restored from backup: $backup_name"
    echo ""
    log_warning "⚠️ CRITICAL: Your repo and deployment are now OUT OF SYNC!"
    echo ""
    echo "📋 Next Steps (CHOOSE ONE):"
    echo ""
    echo "1️⃣  Test the restored deployment:"
    echo "   🌐 https://mynadtest.info/nad-app/admin.html"
    echo ""
    echo "2️⃣  If restored version is GOOD (keep it):"
    echo "   📥 Download restored files to your local machine"
    echo "   💾 git add . && git commit -m 'Restored from backup $backup_name'"
    echo "   📤 git push origin main"
    echo ""
    echo "3️⃣  If restored version is BAD (discard it):"
    echo "   🔄 ./deploy.sh"
    echo "   (This will restore your repo state)"
    echo ""
    echo "4️⃣  Check sync status anytime:"
    echo "   🔍 ./check_sync.sh"
    echo ""
    log_warning "Don't forget to resolve the sync issue!"
}

# Main function
main() {
    echo "🔄 NAD Sync-Aware Restore"
    echo "========================="
    echo ""
    
    # Handle arguments
    local backup_name="$1"
    
    if [ -z "$backup_name" ]; then
        echo "Usage: $0 <backup_name>"
        echo "       $0 latest"
        echo ""
        list_backups
        exit 1
    fi
    
    # Handle "latest" option
    if [ "$backup_name" = "latest" ]; then
        backup_name=$(ls -t /home/bitnami/backups/ | head -1)
        if [ -z "$backup_name" ]; then
            log_error "No backups found"
            exit 1
        fi
        log_info "Latest backup: $backup_name"
    fi
    
    # Validate backup
    validate_backup "$backup_name"
    
    # Show sync warning and get confirmation
    show_sync_warning "$backup_name"
    
    echo ""
    read -p "Do you understand the sync implications and want to proceed? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled by user"
        exit 0
    fi
    
    # Perform restore
    echo ""
    perform_restore "$backup_name"
    
    # Show post-restore instructions
    show_post_restore_instructions "$backup_name"
}

# Run main function
main "$@"
