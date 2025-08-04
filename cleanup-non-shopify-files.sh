#!/bin/bash

# NAD App - Cleanup Non-Shopify Authentication Files
# This script removes files that are not compatible with Shopify-only authentication
# Run from the project root directory

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="/Users/davidnettles/Projects/nad-app"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo -e "${BLUE}🧹 NAD App - Shopify-Only Authentication Cleanup${NC}"
echo "=================================================="

# Verify we're in the right directory
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

cd "$PROJECT_ROOT"

echo -e "${YELLOW}📍 Working directory: $(pwd)${NC}"
echo ""

# Function to safely remove file/directory
remove_item() {
    local item="$1"
    local description="$2"
    
    if [ -e "$item" ]; then
        echo -e "${YELLOW}🗑️  Removing: $description${NC}"
        echo "   Path: $item"
        rm -rf "$item"
        echo -e "${GREEN}   ✅ Deleted${NC}"
    else
        echo -e "${BLUE}   ℹ️  Not found (already removed): $item${NC}"
    fi
    echo ""
}

# Confirm before proceeding
echo -e "${YELLOW}⚠️  This will permanently delete the following files/directories:${NC}"
echo ""
echo "Frontend HTML Files:"
echo "  • customer-portal.html (standalone login portal)"
echo "  • index.html (general landing page)"
echo "  • test-interface.html (testing interface without auth)"
echo ""
echo "PHP Files (Legacy):"
echo "  • frontend/sections/*.php (all PHP implementations)"
echo "  • frontend/sections/junk/ (backup PHP files)"
echo ""
echo "Development/Testing Files:"
echo "  • frontend/test/ (entire test directory)"
echo ""
echo "Components (Legacy PHP):"
echo "  • frontend/components/*.php (PHP components)"
echo ""
echo "Scripts and Config:"
echo "  • frontend/migration.sh"
echo "  • frontend/create-nad-structure.sh"
echo ""

read -p "❓ Do you want to proceed with the cleanup? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚫 Cleanup cancelled by user${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Starting cleanup...${NC}"
echo ""

# Remove standalone authentication HTML files
echo -e "${BLUE}📱 Removing standalone authentication files...${NC}"
remove_item "$FRONTEND_DIR/customer-portal.html" "Customer portal (standalone login)"
remove_item "$FRONTEND_DIR/index.html" "General landing page"
remove_item "$FRONTEND_DIR/test-interface.html" "Test interface (check auth first)"

# Remove PHP files (legacy implementations)
echo -e "${BLUE}🐘 Removing legacy PHP files...${NC}"
remove_item "$FRONTEND_DIR/sections/analytics.php" "Legacy analytics PHP"
remove_item "$FRONTEND_DIR/sections/overview.php" "Legacy overview PHP"
remove_item "$FRONTEND_DIR/sections/supplements.php" "Legacy supplements PHP"
remove_item "$FRONTEND_DIR/sections/system.php" "Legacy system PHP"
remove_item "$FRONTEND_DIR/sections/tests.php" "Legacy tests PHP"
remove_item "$FRONTEND_DIR/sections/users.php" "Legacy users PHP"
remove_item "$FRONTEND_DIR/sections/junk/" "Backup PHP files directory"

# Remove PHP components
echo -e "${BLUE}🧩 Removing PHP components...${NC}"
remove_item "$FRONTEND_DIR/components/header.php" "PHP header component"
remove_item "$FRONTEND_DIR/components/sidebar.php" "PHP sidebar component"
remove_item "$FRONTEND_DIR/components/state-cards.php" "PHP state cards component"

# Remove development/testing directories (without authentication)
echo -e "${BLUE}🧪 Removing development/testing files...${NC}"
remove_item "$FRONTEND_DIR/test/" "Entire test directory (unauthenticated development tools)"

# Remove migration and setup scripts
echo -e "${BLUE}📦 Removing migration and setup scripts...${NC}"
remove_item "$FRONTEND_DIR/migration.sh" "Migration script"
remove_item "$FRONTEND_DIR/create-nad-structure.sh" "Structure creation script"

# Remove console fix (likely development)
remove_item "$FRONTEND_DIR/console-fix.js" "Console fix script"

# Clean up empty directories
echo -e "${BLUE}🧹 Cleaning up empty directories...${NC}"
if [ -d "$FRONTEND_DIR/components" ]; then
    if [ -z "$(ls -A "$FRONTEND_DIR/components")" ]; then
        remove_item "$FRONTEND_DIR/components" "Empty components directory"
    fi
fi

if [ -d "$FRONTEND_DIR/sections" ]; then
    if [ -z "$(ls -A "$FRONTEND_DIR/sections")" ]; then
        remove_item "$FRONTEND_DIR/sections" "Empty sections directory"
    fi
fi

echo -e "${GREEN}✅ Cleanup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Files preserved (Shopify-compatible):${NC}"
echo "  ✅ admin.html (with Shopify auth)"
echo "  ✅ customer-dashboard.html (with Shopify auth)"  
echo "  ✅ lab-interface.html (with Shopify auth)"
echo "  ✅ test-components.html (with Shopify admin auth)"
echo "  ✅ All directories: admin/, customer/, lab/, shared/"
echo "  ✅ All assets, CSS, and JavaScript files"
echo ""
echo -e "${YELLOW}🔍 Verification:${NC}"
echo "  • Check that remaining HTML files enforce Shopify authentication"
echo "  • Test that admin, customer, and lab interfaces still work"
echo "  • Verify no broken links to removed files"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "  1. Test all remaining interfaces with Shopify authentication"
echo "  2. Update any hardcoded links to removed files"
echo "  3. Commit changes: git add . && git commit -m 'Remove non-Shopify auth files'"
echo "  4. Deploy and verify production functionality"
echo ""
echo -e "${GREEN}🎉 Shopify-only authentication cleanup complete!${NC}"