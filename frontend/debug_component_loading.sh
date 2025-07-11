#!/bin/bash
# Debug NAD Component Loading Issues

echo "🔍 NAD Component Loading Debug"
echo "=============================="

NAD_APP="/opt/bitnami/apache/htdocs/nad-app"
cd "$NAD_APP"

echo "📁 Current directory: $(pwd)"
echo ""

echo "🔍 1. CHECK COMPONENT FILES EXIST:"
echo "================================="
echo ""

echo "📄 Admin Components:"
ls -la admin/components/ 2>/dev/null || echo "❌ admin/components/ directory missing"
echo ""

echo "📄 Key component files:"
files=(
    "admin/components/sidebar.html"
    "admin/components/header.html"
    "shared/components/alert-system.html"
    "admin/sections/overview.html"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        size=$(ls -lh "$file" | awk '{print $5}')
        lines=$(wc -l < "$file")
        echo "✅ $file ($size, $lines lines)"
        
        # Show first few lines to check content
        echo "   Preview:"
        head -3 "$file" | sed 's/^/   /'
        echo ""
    else
        echo "❌ $file - MISSING"
    fi
done

echo ""
echo "🔍 2. CHECK COMPONENT LOADER CONFIGURATION:"
echo "=========================================="

if [ -f "shared/js/components.js" ]; then
    echo "✅ components.js exists"
    echo ""
    echo "🔍 Component loader patterns:"
    grep -n "data-component\|data-nad-component\|loadComponent" shared/js/components.js | head -10
    echo ""
    echo "🔍 URL construction logic:"
    grep -n -A3 -B3 "fetchComponent\|baseUrl\|path" shared/js/components.js
else
    echo "❌ shared/js/components.js missing"
fi

echo ""
echo "🔍 3. TEST COMPONENT ACCESS:"
echo "==========================="

echo "📡 Testing component URLs:"
base_url="https://mynadtest.info"

test_urls=(
    "$base_url/admin/components/sidebar.html"
    "$base_url/admin/components/header.html"
    "$base_url/shared/components/alert-system.html"
)

for url in "${test_urls[@]}"; do
    echo -n "Testing $url: "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    if [ "$status" = "200" ]; then
        echo "✅ $status"
    else
        echo "❌ $status"
    fi
done

echo ""
echo "🔍 4. CHECK COMPONENT CONTENT:"
echo "============================="

echo "📄 Sidebar component content:"
if [ -f "admin/components/sidebar.html" ]; then
    echo "--- Start of sidebar.html ---"
    cat admin/components/sidebar.html
    echo "--- End of sidebar.html ---"
else
    echo "❌ Sidebar component missing"
fi

echo ""
echo "🔍 5. BROWSER CONSOLE SIMULATION:"
echo "================================"

echo "🌐 To debug in browser console, run these commands:"
echo ""
echo "// Check if component loader exists"
echo "console.log('Component Loader:', typeof window.NADComponentLoader);"
echo ""
echo "// Check component elements"
echo "console.log('Sidebar element:', document.getElementById('nad-sidebar'));"
echo "console.log('Header element:', document.getElementById('nad-header'));"
echo ""
echo "// Manual component loading test"
echo "if (window.NADComponentLoader) {"
echo "  window.NADComponentLoader.loadComponent('admin/components/sidebar.html')"
echo "    .then(html => console.log('Sidebar loaded:', html.substring(0, 100)))"
echo "    .catch(err => console.error('Sidebar failed:', err));"
echo "}"
echo ""
echo "// Test direct fetch"
echo "fetch('/admin/components/sidebar.html')"
echo "  .then(r => r.text())"
echo "  .then(html => console.log('Direct fetch:', html.substring(0, 100)))"
echo "  .catch(err => console.error('Direct fetch failed:', err));"
echo ""

echo "🔍 6. RECOMMENDED FIXES:"
echo "======================="

echo ""
echo "📋 Based on the debug results above:"

# Check if components are mostly placeholder files
placeholder_count=0
component_files=$(find admin/components admin/sections shared/components -name "*.html" 2>/dev/null)

for file in $component_files; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        if [ "$lines" -lt 5 ]; then
            placeholder_count=$((placeholder_count + 1))
        fi
    fi
done

if [ "$placeholder_count" -gt 5 ]; then
    echo "🎯 ISSUE: Many placeholder files detected ($placeholder_count files < 5 lines)"
    echo "   SOLUTION: Need to migrate content from admin-dashboard.html to component files"
    echo ""
    echo "   Quick fix command:"
    echo "   # Extract sidebar from monolithic file"
    echo "   grep -A 50 'class=\"sidebar\"' admin-dashboard.html > admin/components/sidebar.html"
    echo ""
else
    echo "🎯 ISSUE: Component loading configuration mismatch"
    echo "   SOLUTION: Check data-component attribute pattern in components.js"
fi

echo ""
echo "🚀 IMMEDIATE ACTIONS:"
echo "===================="
echo "1. Run this debug script to identify the exact issue"
echo "2. Check browser console at https://mynadtest.info/admin.html"
echo "3. Fix component files or loading configuration based on results"
echo "4. Test again"

echo ""
echo "Debug complete! 🎯"
