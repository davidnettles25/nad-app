#!/bin/bash
# Debug NAD Component File Paths and Permissions

echo "🔍 Debugging NAD Component System"
echo "================================="

NAD_APP="/opt/bitnami/apache/htdocs/nad-app"

echo "📁 Current working directory:"
pwd

echo ""
echo "🔍 Searching for component files..."

# Find all component-related files
echo "📄 Looking for sidebar.html:"
find "$NAD_APP" -name "sidebar.html" -type f 2>/dev/null | head -10

echo ""
echo "📄 Looking for header.html:" 
find "$NAD_APP" -name "header.html" -type f 2>/dev/null | head -10

echo ""
echo "📄 Looking for alert-system.html:"
find "$NAD_APP" -name "alert-system.html" -type f 2>/dev/null | head -10

echo ""
echo "📄 Looking for components.js:"
find "$NAD_APP" -name "components.js" -type f 2>/dev/null | head -10

echo ""
echo "📁 Full directory structure of nad-app:"
ls -la "$NAD_APP" 2>/dev/null || echo "NAD_APP directory not found"

echo ""
echo "📁 Admin directory structure:"
ls -la "$NAD_APP/admin" 2>/dev/null || echo "Admin directory not found"

echo ""
echo "📁 Shared directory structure:"
ls -la "$NAD_APP/shared" 2>/dev/null || echo "Shared directory not found"

echo ""
echo "📁 Components directories:"
ls -la "$NAD_APP/admin/components" 2>/dev/null || echo "Admin components not found"
ls -la "$NAD_APP/shared/components" 2>/dev/null || echo "Shared components not found"
ls -la "$NAD_APP/shared/js" 2>/dev/null || echo "Shared JS not found"

echo ""
echo "🌐 Testing URL accessibility..."

# Test if we can access the files via HTTP
echo "🔗 Testing component URLs:"

# URLs being requested based on the errors
URLS=(
    "https://mynadtest.info/nad-app/admin/components/sidebar.html"
    "https://mynadtest.info/nad-app/admin/components/header.html"
    "https://mynadtest.info/nad-app/shared/components/alert-system.html"
    "https://mynadtest.info/nad-app/shared/js/components.js"
)

for url in "${URLS[@]}"; do
    echo -n "Testing: $url ... "
    if curl -s -f -I "$url" > /dev/null 2>&1; then
        echo "✅ Accessible"
    else
        echo "❌ Not accessible (404 or error)"
    fi
done

echo ""
echo "🔧 File permissions check:"

EXPECTED_FILES=(
    "$NAD_APP/admin/components/sidebar.html"
    "$NAD_APP/admin/components/header.html"
    "$NAD_APP/shared/components/alert-system.html"
    "$NAD_APP/shared/js/components.js"
)

for file in "${EXPECTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found: $file"
        ls -la "$file"
        
        # Check if it's readable
        if [ -r "$file" ]; then
            echo "   ✅ Readable"
            echo "   📄 First few lines:"
            head -3 "$file" | sed 's/^/   /'
        else
            echo "   ❌ Not readable"
        fi
    else
        echo "❌ Missing: $file"
        
        # Try to find it elsewhere
        basename_file=$(basename "$file")
        echo "   🔍 Searching for $basename_file elsewhere:"
        find "$NAD_APP" -name "$basename_file" -type f 2>/dev/null | sed 's/^/   Found: /'
    fi
    echo ""
done

echo "⚙️ Apache configuration check:"
echo "==============================="

# Check if nad-app directory is in Apache DocumentRoot
echo "📄 Apache virtual host config:"
if [ -f "/opt/bitnami/apache/conf/vhosts/nad-app.conf" ]; then
    grep -E "(DocumentRoot|Directory)" /opt/bitnami/apache/conf/vhosts/nad-app.conf
else
    echo "❌ NAD virtual host config not found"
fi

echo ""
echo "📄 Main Apache config DocumentRoot:"
grep -E "DocumentRoot" /opt/bitnami/apache/conf/httpd.conf | head -3

echo ""
echo "🔧 .htaccess files:"
if [ -f "$NAD_APP/.htaccess" ]; then
    echo "✅ Found .htaccess in nad-app:"
    cat "$NAD_APP/.htaccess"
else
    echo "❌ No .htaccess in nad-app"
fi

echo ""
echo "📋 SUMMARY & RECOMMENDATIONS:"
echo "============================="

# Provide specific recommendations based on findings
echo "1. Check if files exist at expected paths"
echo "2. Verify Apache can serve files from nad-app directory" 
echo "3. Check file permissions (should be readable by Apache)"
echo "4. Test direct URL access to component files"
echo "5. Verify components.js has proper configure function"

echo ""
echo "🚀 QUICK FIXES TO TRY:"
echo "======================="

cat << 'EOF'
# Fix 1: Ensure proper permissions
sudo chown -R bitnami:bitnami /opt/bitnami/apache/htdocs/nad-app
sudo chmod -R 755 /opt/bitnami/apache/htdocs/nad-app

# Fix 2: Test direct file access
curl -v https://mynadtest.info/nad-app/admin/components/sidebar.html

# Fix 3: Check if components.js has configure function
grep -n "configure" /opt/bitnami/apache/htdocs/nad-app/shared/js/components.js

# Fix 4: Restart Apache to reload config
sudo /opt/bitnami/ctlscript.sh restart apache
EOF

echo ""
echo "🔧 Run this script to see what's actually on your server:"
echo "sudo bash debug_component_paths.sh"
