#!/bin/bash
# NAD Sync Management Tools - Option C Implementation
# Creates practical sync management scripts

echo "🔧 Creating NAD Sync Management Tools"
echo "====================================="

# Tool 1: Sync Checker Script
create_sync_checker() {
    echo "📝 Creating sync checker script..."
    
    cat > check_sync.sh << 'EOF'
#!/bin/bash
# NAD Sync Checker - Check if repo and deployment are in sync

echo "🔍 NAD Repo/Deployment Sync Check"
echo "=================================="
echo ""

REPO_URL="https://github.com/davidnettles25/nad-app.git"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get latest commit from repo
echo "📦 Checking repository..."
REPO_COMMIT=$(git ls-remote "$REPO_URL" main 2>/dev/null | cut -f1)

if [ -z "$REPO_COMMIT" ]; then
    echo -e "${RED}❌ Cannot access repository${NC}"
    echo "Check your internet connection or repository URL"
    exit 1
fi

echo "   Latest repo commit: ${REPO_COMMIT:0:8}..."

# Check deployment status
echo ""
echo "🚀 Checking deployment..."

DEPLOY_STATUS="unknown"
DEPLOY_COMMIT=""

# Check if deployment has Git info
if [ -d "/opt/nad-app/.git" ]; then
    cd /opt/nad-app
    DEPLOY_COMMIT=$(git rev-parse HEAD 2>/dev/null)
    if [ -n "$DEPLOY_COMMIT" ]; then
        echo "   Deployed commit: ${DEPLOY_COMMIT:0:8}..."
        DEPLOY_STATUS="git_deployed"
    fi
elif [ -f "/opt/nad-app/package.json" ]; then
    DEPLOY_STATUS="file_deployed"
    echo "   Deployed: Files present (no Git info)"
else
    DEPLOY_STATUS="not_deployed"
    echo "   Deployed: No deployment found"
fi

# Compare and report
echo ""
echo "📊 Sync Status:"
echo "==============="

case $DEPLOY_STATUS in
    "git_deployed")
        if [ "$REPO_COMMIT" = "$DEPLOY_COMMIT" ]; then
            echo -e "${GREEN}✅ PERFECT SYNC${NC}"
            echo "   Repository and deployment are identical"
        else
            echo -e "${YELLOW}⚠️  OUT OF SYNC${NC}"
            echo "   Repository has different code than deployment"
            echo ""
            echo "To fix:"
            echo "   🔄 Deploy latest: ./deploy.sh"
            echo "   📤 Or commit deployment changes to repo"
        fi
        ;;
    "file_deployed")
        echo -e "${YELLOW}⚠️  UNKNOWN SYNC STATUS${NC}"
        echo "   Deployment has no Git info (likely from backup restore)"
        echo ""
        echo "To establish sync:"
        echo "   🔄 Deploy from repo: ./deploy.sh"
        echo "   📤 Or download files and commit to repo"
        ;;
    "not_deployed")
        echo -e "${RED}❌ NOT DEPLOYED${NC}"
        echo "   No NAD deployment found"
        echo ""
        echo "To deploy:"
        echo "   🚀 Run: ./deploy.sh"
        ;;
esac

echo ""
echo "📋 Quick Commands:"
echo "  ./deploy.sh           # Deploy latest from repo"
echo "  ./restore.sh latest   # Restore from backup"
echo "  ./check_sync.sh       # Run this check again"
EOF

    chmod +x check_sync.sh
    echo "✅ Created: check_sync.sh"
}

# Tool 2: Sync-Aware Restore Script
create_sync_aware_restore() {
    echo "📝 Creating sync-aware restore script..."
    
    cat > restore_sync_aware.sh << 'EOF'
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
EOF

    chmod +x restore_sync_aware.sh
    echo "✅ Created: restore_sync_aware.sh"
}

# Tool 3: Best Practices Guide
create_best_practices_guide() {
    echo "📝 Creating best practices guide..."
    
    cat > SYNC_BEST_PRACTICES.md << 'EOF'
# NAD Sync Management - Best Practices Guide

## 🎯 The Golden Rule: **Always Commit Before Deploy**

```bash
# ✅ CORRECT Workflow:
git add .
git commit -m "Describe your changes"
git push origin main
./deploy.sh

# ❌ WRONG Workflow:
./deploy.sh  # Deploy uncommitted changes
# (Creates immediate sync problem)
```

## 🔄 Common Scenarios & Solutions

### Scenario 1: Normal Development
```bash
# 1. Make changes locally
# 2. Test changes
# 3. Commit first
git add .
git commit -m "Add new feature"
git push origin main

# 4. Then deploy
./deploy.sh
```

### Scenario 2: Emergency Restore
```bash
# 1. Restore immediately (sync will break)
./restore_sync_aware.sh 20250113_143022

# 2. Test restored version
# 3a. If keeping restored version:
#     Download files → commit to repo
# 3b. If discarding restored version:
./deploy.sh  # Re-sync with repo
```

### Scenario 3: Testing an Old Backup
```bash
# 1. Note current state
./check_sync.sh

# 2. Restore for testing
./restore_sync_aware.sh 20250113_143022

# 3. Test the old version
# 4. Return to current state
./deploy.sh  # This restores repo sync
```

### Scenario 4: Fixing Sync Problems
```bash
# Check current sync status
./check_sync.sh

# If out of sync, choose:
# Option A: Deploy repo version
./deploy.sh

# Option B: Commit deployment version
# Download current deployment files
# git add . && git commit -m "Sync deployment to repo"
# git push origin main
```

## 🛠️ Available Tools

### `check_sync.sh`
- Checks if repo and deployment match
- Shows sync status and recommendations
- Run anytime to check current state

### `restore_sync_aware.sh`
- Restores from backup with sync warnings
- Creates pre-restore backup automatically
- Provides clear post-restore instructions

### `deploy.sh` (existing)
- Deploys latest code from repository
- Always creates backup before deployment
- Maintains sync by design

## 🚨 Warning Signs of Sync Problems

- Manual file edits on server
- Restoring from backups
- Deploying uncommitted changes
- Copying files directly to server

## ✅ Good Practices

1. **Always commit before deploying**
2. **Use `check_sync.sh` regularly**
3. **Test in development environment first**
4. **Document any manual changes**
5. **Resolve sync issues immediately**

## 📞 Troubleshooting

**Problem**: "I made changes on the server directly"
**Solution**: Download the changes and commit them to repo

**Problem**: "I restored a backup and now things are broken"
**Solution**: Run `./deploy.sh` to restore from repo

**Problem**: "I don't know if I'm in sync"
**Solution**: Run `./check_sync.sh`

**Problem**: "I deployed but my changes aren't there"
**Solution**: Check if you committed and pushed your changes first
EOF

    echo "✅ Created: SYNC_BEST_PRACTICES.md"
}

# Tool 4: Quick Setup Script
create_setup_script() {
    echo "📝 Creating setup script..."
    
    cat > setup_sync_tools.sh << 'EOF'
#!/bin/bash
# Setup NAD Sync Management Tools on Server

echo "🔧 Setting up NAD Sync Management Tools"
echo "======================================="

# Create tools directory
mkdir -p ~/nad-sync-tools
cd ~/nad-sync-tools

echo "📥 Downloading sync management tools..."

# This would typically download from your repo
# For now, we'll assume they're already created locally

if [ -f "../check_sync.sh" ]; then
    cp ../check_sync.sh .
    chmod +x check_sync.sh
    echo "✅ check_sync.sh installed"
fi

if [ -f "../restore_sync_aware.sh" ]; then
    cp ../restore_sync_aware.sh .
    chmod +x restore_sync_aware.sh
    echo "✅ restore_sync_aware.sh installed"
fi

if [ -f "../SYNC_BEST_PRACTICES.md" ]; then
    cp ../SYNC_BEST_PRACTICES.md .
    echo "✅ Best practices guide installed"
fi

# Create symlinks for easy access
ln -sf ~/nad-sync-tools/check_sync.sh ~/check_sync.sh
ln -sf ~/nad-sync-tools/restore_sync_aware.sh ~/restore_sync_aware.sh

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Available commands:"
echo "  ~/check_sync.sh                    # Check sync status"
echo "  ~/restore_sync_aware.sh [backup]  # Restore with sync awareness"
echo "  ./deploy.sh                       # Deploy from repo (existing)"
echo ""
echo "📖 Read best practices: ~/nad-sync-tools/SYNC_BEST_PRACTICES.md"
EOF

    chmod +x setup_sync_tools.sh
    echo "✅ Created: setup_sync_tools.sh"
}

# Main execution
main() {
    create_sync_checker
    echo ""
    create_sync_aware_restore
    echo ""
    create_best_practices_guide
    echo ""
    create_setup_script
    
    echo ""
    echo "🎉 NAD Sync Management Tools Created!"
    echo "===================================="
    echo ""
    echo "📁 Files created:"
    echo "  ✅ check_sync.sh              # Check repo/deployment sync status"
    echo "  ✅ restore_sync_aware.sh      # Restore with sync warnings"
    echo "  ✅ SYNC_BEST_PRACTICES.md     # Best practices guide"
    echo "  ✅ setup_sync_tools.sh        # Setup script for server"
    echo ""
    echo "📋 Next steps:"
    echo "1. 📤 Upload to your server:"
    echo "   scp *.sh *.md bitnami@your-server:~/"
    echo ""
    echo "2. 🔧 Setup on server:"
    echo "   ssh bitnami@your-server"
    echo "   ./setup_sync_tools.sh"
    echo ""
    echo "3. ✅ Test the tools:"
    echo "   ./check_sync.sh"
    echo ""
    echo "📖 Read SYNC_BEST_PRACTICES.md for detailed guidance!"
}

main
