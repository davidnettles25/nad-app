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
