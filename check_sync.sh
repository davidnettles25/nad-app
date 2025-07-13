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
