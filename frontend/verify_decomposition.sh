#!/bin/bash
# NAD Admin Dashboard Decomposition Verification Script
# Checks progress of modular decomposition from monolithic admin-dashboard.html

echo "🔍 NAD Admin Dashboard Decomposition Verification"
echo "================================================="
echo ""

NAD_APP="/opt/bitnami/apache/htdocs/nad-app"
echo "📁 Base Directory: $NAD_APP"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if file exists and show size
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        local size=$(ls -lh "$file" | awk '{print $5}')
        local lines=$(wc -l < "$file" 2>/dev/null || echo "?")
        echo -e "  ${GREEN}✅ $description${NC} ($size, $lines lines)"
        return 0
    else
        echo -e "  ${RED}❌ $description${NC} - MISSING"
        return 1
    fi
}

# Function to check directory structure
check_directory() {
    local dir="$1"
    local description="$2"
    
    if [ -d "$dir" ]; then
        local count=$(find "$dir" -type f 2>/dev/null | wc -l)
        echo -e "  ${GREEN}✅ $description${NC} ($count files)"
        return 0
    else
        echo -e "  ${RED}❌ $description${NC} - MISSING"
        return 1
    fi
}

# Function to analyze file content
analyze_content() {
    local file="$1"
    local pattern="$2"
    local description="$3"
    
    if [ -f "$file" ]; then
        local count=$(grep -c "$pattern" "$file" 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            echo -e "    ${BLUE}📊 $description: $count matches${NC}"
        else
            echo -e "    ${YELLOW}⚠️ $description: No matches found${NC}"
        fi
    fi
}

echo "🎯 PRIORITY 1 VERIFICATION: CSS EXTRACTION"
echo "=========================================="

# Check shared CSS structure
echo "📁 Shared CSS Infrastructure:"
check_directory "$NAD_APP/shared/css" "Shared CSS directory"
check_file "$NAD_APP/shared/css/variables.css" "CSS Variables (Design tokens)"
check_file "$NAD_APP/shared/css/base.css" "Base styles and reset"
check_file "$NAD_APP/shared/css/components.css" "Shared component styles"
check_file "$NAD_APP/shared/css/utilities.css" "Utility classes"

echo ""
echo "📁 Admin CSS Infrastructure:"
check_directory "$NAD_APP/admin/css" "Admin CSS directory"
check_file "$NAD_APP/admin/css/admin-dashboard.css" "Admin-specific styles"
check_file "$NAD_APP/admin/css/sections.css" "Section-specific styles"
check_file "$NAD_APP/admin/css/tables.css" "Data table styles"

# Analyze CSS content
if [ -f "$NAD_APP/shared/css/variables.css" ]; then
    echo ""
    echo "🔍 CSS Variables Analysis:"
    analyze_content "$NAD_APP/shared/css/variables.css" "--.*:" "CSS custom properties"
fi

if [ -f "$NAD_APP/admin/css/admin-dashboard.css" ]; then
    echo ""
    echo "🔍 Admin CSS Analysis:"
    analyze_content "$NAD_APP/admin/css/admin-dashboard.css" "\.admin-" "Admin-specific classes"
    analyze_content "$NAD_APP/admin/css/admin-dashboard.css" "\.nav-" "Navigation classes"
fi

echo ""
echo "🎯 PRIORITY 2 VERIFICATION: JAVASCRIPT EXTRACTION"
echo "================================================="

# Check shared JavaScript structure
echo "📁 Shared JavaScript Infrastructure:"
check_directory "$NAD_APP/shared/js" "Shared JS directory"
check_file "$NAD_APP/shared/js/core.js" "Core utilities and helpers"
check_file "$NAD_APP/shared/js/api-client.js" "Centralized API client"
check_file "$NAD_APP/shared/js/components.js" "Component loading system"
check_file "$NAD_APP/shared/js/utils.js" "Utility functions"

echo ""
echo "📁 Admin JavaScript Infrastructure:"
check_directory "$NAD_APP/admin/js" "Admin JS directory"
check_file "$NAD_APP/admin/js/admin-dashboard.js" "Main admin controller"
check_file "$NAD_APP/admin/js/navigation.js" "Section navigation"
check_file "$NAD_APP/admin/js/data-management.js" "CRUD operations"

echo ""
echo "📁 Admin Section JavaScript:"
check_directory "$NAD_APP/admin/js/sections" "Admin sections JS directory"
check_file "$NAD_APP/admin/js/sections/tests.js" "Test management logic"
check_file "$NAD_APP/admin/js/sections/users.js" "User management logic"
check_file "$NAD_APP/admin/js/sections/supplements.js" "Supplement management logic"
check_file "$NAD_APP/admin/js/sections/analytics.js" "Analytics logic"
check_file "$NAD_APP/admin/js/sections/system.js" "System monitoring logic"

# Analyze JavaScript content
if [ -f "$NAD_APP/shared/js/api-client.js" ]; then
    echo ""
    echo "🔍 API Client Analysis:"
    analyze_content "$NAD_APP/shared/js/api-client.js" "class.*ApiClient" "API Client class"
    analyze_content "$NAD_APP/shared/js/api-client.js" "async.*get\|async.*post" "Async methods"
fi

if [ -f "$NAD_APP/admin/js/sections/tests.js" ]; then
    echo ""
    echo "🔍 Test Management Analysis:"
    analyze_content "$NAD_APP/admin/js/sections/tests.js" "function.*Test" "Test functions"
    analyze_content "$NAD_APP/admin/js/sections/tests.js" "loadTestsFromAPI\|activateTest" "Core test methods"
fi

echo ""
echo "🎯 PRIORITY 3 VERIFICATION: HTML COMPONENT EXTRACTION"
echo "====================================================="

# Check shared components
echo "📁 Shared Components:"
check_directory "$NAD_APP/shared/components" "Shared components directory"
check_file "$NAD_APP/shared/components/alert-system.html" "Alert/notification system"
check_file "$NAD_APP/shared/components/loading-spinner.html" "Loading indicators"
check_file "$NAD_APP/shared/components/modal-dialogs.html" "Modal templates"

echo ""
echo "📁 Admin Components:"
check_directory "$NAD_APP/admin/components" "Admin components directory"
check_file "$NAD_APP/admin/components/sidebar.html" "Navigation sidebar"
check_file "$NAD_APP/admin/components/header.html" "Admin header"
check_file "$NAD_APP/admin/components/stats-cards.html" "Dashboard stat cards"
check_file "$NAD_APP/admin/components/data-table.html" "Reusable data table"
check_file "$NAD_APP/admin/components/bulk-actions.html" "Bulk action controls"
check_file "$NAD_APP/admin/components/user-form.html" "User creation/edit form"
check_file "$NAD_APP/admin/components/filter-controls.html" "Data filtering controls"

echo ""
echo "📁 Admin Sections:"
check_directory "$NAD_APP/admin/sections" "Admin sections directory"
check_file "$NAD_APP/admin/sections/overview.html" "Dashboard overview section"
check_file "$NAD_APP/admin/sections/tests.html" "Test management section"
check_file "$NAD_APP/admin/sections/users.html" "User management section"
check_file "$NAD_APP/admin/sections/supplements.html" "Supplement management section"
check_file "$NAD_APP/admin/sections/analytics.html" "Analytics section"
check_file "$NAD_APP/admin/sections/system.html" "System health section"

# Analyze HTML content
if [ -f "$NAD_APP/admin/components/sidebar.html" ]; then
    echo ""
    echo "🔍 Sidebar Component Analysis:"
    analyze_content "$NAD_APP/admin/components/sidebar.html" "<nav" "Navigation elements"
    analyze_content "$NAD_APP/admin/components/sidebar.html" "nav-menu\|nav-link" "Navigation classes"
fi

if [ -f "$NAD_APP/admin/sections/tests.html" ]; then
    echo ""
    echo "🔍 Tests Section Analysis:"
    analyze_content "$NAD_APP/admin/sections/tests.html" "data-table\|test-" "Test-specific elements"
fi

echo ""
echo "🎯 MONOLITHIC vs MODULAR COMPARISON"
echo "===================================="

# Check original monolithic file
echo "📁 Original Implementation:"
check_file "$NAD_APP/admin-dashboard.html" "Monolithic admin dashboard"

if [ -f "$NAD_APP/admin-dashboard.html" ]; then
    echo ""
    echo "🔍 Monolithic File Analysis:"
    local total_lines=$(wc -l < "$NAD_APP/admin-dashboard.html")
    local css_lines=$(grep -c "<style>\|</style>\|{.*}\|.*:" "$NAD_APP/admin-dashboard.html" || echo "0")
    local js_lines=$(grep -c "<script>\|</script>\|function\|var\|const\|let" "$NAD_APP/admin-dashboard.html" || echo "0")
    local html_lines=$((total_lines - css_lines - js_lines))
    
    echo -e "    ${BLUE}📊 Total lines: $total_lines${NC}"
    echo -e "    ${BLUE}📊 Estimated CSS lines: $css_lines${NC}"
    echo -e "    ${BLUE}📊 Estimated JS lines: $js_lines${NC}"
    echo -e "    ${BLUE}📊 Estimated HTML lines: $html_lines${NC}"
fi

echo ""
echo "🎯 INTEGRATION VERIFICATION"
echo "============================"

# Check for main admin dashboard that loads components
check_file "$NAD_APP/admin.html" "Main admin dashboard (component loader)"
check_file "$NAD_APP/index.html" "Landing page/interface selector"

echo ""
echo "🔍 Component Loading Verification:"
if [ -f "$NAD_APP/shared/js/components.js" ]; then
    analyze_content "$NAD_APP/shared/js/components.js" "loadComponent\|ComponentLoader" "Component loading functions"
fi

echo ""
echo "🎯 FUNCTIONALITY VERIFICATION TESTS"
echo "===================================="

echo "📋 Manual Testing Checklist:"
echo -e "  ${YELLOW}⏳ Test 1: Admin dashboard loads without errors${NC}"
echo -e "  ${YELLOW}⏳ Test 2: Navigation between sections works${NC}"
echo -e "  ${YELLOW}⏳ Test 3: API calls function correctly${NC}"
echo -e "  ${YELLOW}⏳ Test 4: Data tables display and update${NC}"
echo -e "  ${YELLOW}⏳ Test 5: Forms submit and validate${NC}"
echo -e "  ${YELLOW}⏳ Test 6: Mobile responsiveness maintained${NC}"

echo ""
echo "🔍 Quick Functionality Test:"
if [ -f "$NAD_APP/admin.html" ] || [ -f "$NAD_APP/admin-dashboard.html" ]; then
    echo "📡 To test admin dashboard functionality, visit:"
    echo "   https://mynadtest.info/admin/"
    echo "   OR"
    echo "   https://mynadtest.info/admin-dashboard.html"
    echo ""
    echo "🧪 Key things to verify:"
    echo "   ✅ Page loads without console errors"
    echo "   ✅ All sections are accessible via navigation"
    echo "   ✅ API calls return data successfully"
    echo "   ✅ Interactive elements work (buttons, forms, tables)"
else
    echo -e "  ${RED}❌ No admin dashboard file found to test${NC}"
fi

echo ""
echo "🎯 DECOMPOSITION PROGRESS SUMMARY"
echo "================================="

# Count files in each category
css_files=$(find "$NAD_APP" -name "*.css" 2>/dev/null | wc -l)
js_files=$(find "$NAD_APP" -name "*.js" 2>/dev/null | wc -l)
html_components=$(find "$NAD_APP" -path "*/components/*.html" -o -path "*/sections/*.html" 2>/dev/null | wc -l)

echo -e "📊 ${GREEN}CSS Files Created: $css_files${NC}"
echo -e "📊 ${GREEN}JavaScript Modules: $js_files${NC}"
echo -e "📊 ${GREEN}HTML Components: $html_components${NC}"

total_modular_files=$((css_files + js_files + html_components))
echo -e "📊 ${BLUE}Total Modular Files: $total_modular_files${NC}"

# Estimate completion percentage
if [ $total_modular_files -gt 30 ]; then
    echo -e "🎯 ${GREEN}Decomposition Status: ADVANCED (Priorities 1-3 likely complete)${NC}"
elif [ $total_modular_files -gt 15 ]; then
    echo -e "🎯 ${YELLOW}Decomposition Status: MODERATE (Some priorities complete)${NC}"
elif [ $total_modular_files -gt 5 ]; then
    echo -e "🎯 ${YELLOW}Decomposition Status: BASIC (Early stage)${NC}"
else
    echo -e "🎯 ${RED}Decomposition Status: MINIMAL (Just getting started)${NC}"
fi

echo ""
echo "🚀 NEXT STEPS BASED ON VERIFICATION"
echo "==================================="

if [ $total_modular_files -gt 30 ]; then
    echo "✅ Ready for Priority 4: Integration & Testing"
    echo "   - Test all functionality works with modular structure"
    echo "   - Optimize loading performance"
    echo "   - Document the new architecture"
    echo "   - Create fallback mechanisms"
elif [ $total_modular_files -gt 15 ]; then
    echo "🔧 Continue with remaining component extraction"
    echo "   - Complete any missing HTML components"
    echo "   - Ensure all JavaScript functions are modularized"
    echo "   - Test component loading system"
elif [ $total_modular_files -gt 5 ]; then
    echo "📋 Focus on JavaScript extraction"
    echo "   - Extract remaining functions from monolithic file"
    echo "   - Create section-specific modules"
    echo "   - Set up component loading system"
else
    echo "🎨 Start with CSS extraction"
    echo "   - Extract styles from monolithic admin-dashboard.html"
    echo "   - Create CSS variable system"
    echo "   - Organize styles by component"
fi

echo ""
echo "🎯 Verification Complete!"
echo "========================"
