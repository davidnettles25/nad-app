#!/bin/bash
# NAD Test Cycle - Backup Restore Script
# Restores NAD application from specified backup directory
# Usage: ./restore.sh [backup_directory_name]
# Example: ./restore.sh 20250113_143022

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Display usage information
show_usage() {
    echo "NAD Test Cycle - Backup Restore Script"
    echo "======================================"
    echo ""
    echo "Usage: $0 [backup_directory_name]"
    echo ""
    echo "Options:"
    echo "  backup_directory_name    Specific backup directory to restore from"
    echo "                          (if not provided, will list available backups)"
    echo ""
    echo "Examples:"
    echo "  $0                      # List available backups"
    echo "  $0 20250113_143022      # Restore from specific backup"
    echo "  $0 latest               # Restore from most recent backup"
    echo ""
}

# List available backups
list_backups() {
    log_info "Available backups in /home/bitnami/backups/:"
    echo ""
    
    if [ ! -d "/home/bitnami/backups" ]; then
        log_error "Backup directory /home/bitnami/backups/ does not exist"
        exit 1
    fi
    
    # List backups with details
    cd /home/bitnami/backups/
    for backup_dir in */; do
        if [ -d "$backup_dir" ]; then
            backup_name=$(basename "$backup_dir")
            backup_date=$(date -d "${backup_name:0:8} ${backup_name:9:2}:${backup_name:11:2}:${backup_name:13:2}" 2>/dev/null || echo "Unknown date")
            
            echo "📦 $backup_name"
            echo "   Date: $backup_date"
            
            # Check what's in the backup
            if [ -f "$backup_dir/backend-backup.tar.gz" ]; then
                backend_size=$(du -h "$backup_dir/backend-backup.tar.gz" | cut -f1)
                echo "   Backend: ✅ ($backend_size)"
            else
                echo "   Backend: ❌ Missing"
            fi
            
            if [ -f "$backup_dir/frontend-backup.tar.gz" ]; then
                frontend_size=$(du -h "$backup_dir/frontend-backup.tar.gz" | cut -f1)
                echo "   Frontend: ✅ ($frontend_size)"
            else
                echo "   Frontend: ❌ Missing"
            fi
            echo ""
        fi
    done
}

# Validate backup directory
validate_backup() {
    local backup_name="$1"
    local backup_path="/home/bitnami/backups/$backup_name"
    
    log_info "Validating backup: $backup_name"
    
    # Check if backup directory exists
    if [ ! -d "$backup_path" ]; then
        log_error "Backup directory does not exist: $backup_path"
        log_info "Available backups:"
        list_backups
        exit 1
    fi
    
    # Check if required backup files exist
    local missing_files=()
    
    if [ ! -f "$backup_path/backend-backup.tar.gz" ]; then
        missing_files+=("backend-backup.tar.gz")
    fi
    
    if [ ! -f "$backup_path/frontend-backup.tar.gz" ]; then
        missing_files+=("frontend-backup.tar.gz")
    fi
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        log_error "Missing backup files in $backup_path:"
        for file in "${missing_files[@]}"; do
            echo "  ❌ $file"
        done
        exit 1
    fi
    
    log_success "Backup validation passed"
    return 0
}

# Create pre-restore backup
create_pre_restore_backup() {
    log_info "Creating pre-restore backup of current state..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local pre_restore_backup="/home/bitnami/backups/pre_restore_$timestamp"
    
    mkdir -p "$pre_restore_backup"
    
    # Backup current backend
    if [ -d "/opt/nad-app" ]; then
        tar -czf "$pre_restore_backup/backend-backup.tar.gz" -C "/opt/nad-app" . 2>/dev/null || log_warning "Failed to backup current backend"
    fi
    
    # Backup current frontend
    if [ -d "/home/bitnami/htdocs/nad-app" ]; then
        tar -czf "$pre_restore_backup/frontend-backup.tar.gz" -C "/home/bitnami/htdocs/nad-app" . 2>/dev/null || log_warning "Failed to backup current frontend"
    fi
    
    log_success "Pre-restore backup created: $pre_restore_backup"
}

# Perform the restore
perform_restore() {
    local backup_name="$1"
    local backup_path="/home/bitnami/backups/$backup_name"
    
    log_info "Starting restore from: $backup_path"
    
    # Stop the API gracefully
    log_info "Stopping NAD API..."
    pm2 stop nad-api 2>/dev/null || log_warning "NAD API was not running"
    
    # Restore backend
    log_info "Restoring backend..."
    if [ ! -d "/opt/nad-app" ]; then
        sudo mkdir -p "/opt/nad-app"
        sudo chown bitnami:bitnami "/opt/nad-app"
    fi
    
    cd /opt/nad-app
    tar -xzf "$backup_path/backend-backup.tar.gz"
    log_success "Backend restored"
    
    # Restore frontend
    log_info "Restoring frontend..."
    if [ ! -d "/home/bitnami/htdocs/nad-app" ]; then
        sudo mkdir -p "/home/bitnami/htdocs/nad-app"
        sudo chown bitnami:bitnami "/home/bitnami/htdocs/nad-app"
    fi
    
    cd /home/bitnami/htdocs/nad-app
    tar -xzf "$backup_path/frontend-backup.tar.gz"
    log_success "Frontend restored"
    
    # Set proper permissions
    log_info "Setting proper permissions..."
    sudo chown -R bitnami:bitnami /opt/nad-app
    sudo chown -R bitnami:bitnami /home/bitnami/htdocs/nad-app
    
    # Restart the API
    log_info "Restarting NAD API..."
    cd /opt/nad-app
    pm2 restart nad-api || pm2 start ecosystem.config.js
    
    # Wait for API to start
    sleep 3
    
    # Test the restoration
    log_info "Testing restored application..."
    if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
        log_success "✅ API health check passed"
    else
        log_warning "⚠️ API health check failed - API may need manual restart"
    fi
    
    log_success "Restore completed successfully!"
    echo ""
    log_info "Application URLs:"
    echo "  🌐 Frontend: https://mynadtest.info/nad-app/"
    echo "  🔗 API: https://mynadtest.info:3001/"
    echo ""
    log_info "Backup restored from: $backup_path"
}

# Main script logic
main() {
    echo "🔄 NAD Test Cycle - Backup Restore Script"
    echo "========================================="
    echo ""
    
    # Check if running as appropriate user
    if [ "$EUID" -eq 0 ]; then
        log_warning "Running as root. Consider using bitnami user."
    fi
    
    # Handle command line arguments
    case "${1:-}" in
        "-h"|"--help"|"help")
            show_usage
            exit 0
            ;;
        "")
            # No arguments - list available backups
            list_backups
            echo ""
            log_info "To restore from a specific backup, run:"
            echo "  $0 [backup_directory_name]"
            exit 0
            ;;
        "latest")
            # Restore from latest backup
            if [ ! -d "/home/bitnami/backups" ]; then
                log_error "Backup directory /home/bitnami/backups/ does not exist"
                exit 1
            fi
            
            LATEST_BACKUP=$(ls -t /home/bitnami/backups/ | head -1)
            if [ -z "$LATEST_BACKUP" ]; then
                log_error "No backups found in /home/bitnami/backups/"
                exit 1
            fi
            
            log_info "Latest backup found: $LATEST_BACKUP"
            BACKUP_NAME="$LATEST_BACKUP"
            ;;
        *)
            # Specific backup directory provided
            BACKUP_NAME="$1"
            ;;
    esac
    
    # Validate the backup
    validate_backup "$BACKUP_NAME"
    
    # Confirm restoration
    echo ""
    log_warning "⚠️  WARNING: This will overwrite your current NAD application!"
    echo ""
    echo "Backup to restore: $BACKUP_NAME"
    echo "Backup path: /home/bitnami/backups/$BACKUP_NAME"
    echo ""
    read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled by user"
        exit 0
    fi
    
    # Create pre-restore backup
    create_pre_restore_backup
    
    # Perform the restore
    perform_restore "$BACKUP_NAME"
}

# Run the main function with all arguments
main "$@"