#!/bin/bash
# URL Path Configuration Fix for NAD Test Cycle
# Fixes URLs from /nad-app/ to direct paths

echo "🔧 Fixing URL paths for NAD Test Cycle deployment..."

# Check current directory structure
echo "📍 Current working directory: $(pwd)"
echo "📁 Checking directory structure..."

# Find the actual web root
if [ -d "/opt/bitnami/apache/htdocs" ]; then
    WEB_ROOT="/opt/bitnami/apache/htdocs"
elif [ -d "/home/mynadtes/public_html" ]; then
    WEB_ROOT="/home/mynadtes/public_html" 
else
    echo "❌ Cannot find web root directory"
    exit 1
fi

echo "🌐 Web root found: $WEB_ROOT"

# Check current NAD app location
if [ -d "$WEB_ROOT/nad-app" ]; then
    NAD_DIR="$WEB_ROOT/nad-app"
    echo "📁 NAD app found at: $NAD_DIR"
elif [ -d "$WEB_ROOT" ]; then
    NAD_DIR="$WEB_ROOT"
    echo "📁 NAD app appears to be in web root: $NAD_DIR"
else
    echo "❌ Cannot find NAD application directory"
    exit 1
fi

echo ""
echo "🔍 Analyzing current URL issues..."

# Function to fix URLs in files
fix_urls_in_file() {
    local file="$1"
    local backup_file="${file}.backup"
    
    # Create backup
    cp "$file" "$backup_file"
    
    echo "🔧 Fixing URLs in: $(basename "$file")"
    
    # Fix common URL patterns
    sed -i.tmp 's|https://mynadtest\.info/nad-app/|https://mynadtest.info/|g' "$file"
    sed -i.tmp 's|mynadtest\.info/nad-app/|mynadtest.info/|g' "$file"
    sed -i.tmp 's|/nad-app/portal|/portal|g' "$file"
    sed -i.tmp 's|/nad-app/lab|/lab|g' "$file"
    sed -i.tmp 's|/nad-app/admin|/admin|g' "$file"
    sed -i.tmp 's|/nad-app/test|/test|g' "$file"
    sed -i.tmp 's|/nad-app/api|/api|g' "$file"
    
    # Clean up temp file
    rm "${file}.tmp" 2>/dev/null || true
    
    echo "✅ Fixed URLs in: $(basename "$file")"
}

# Find and fix HTML files
echo ""
echo "🔍 Finding HTML files to fix..."

find "$NAD_DIR" -name "*.html" -type f | while read -r file; do
    if grep -q "nad-app" "$file" 2>/dev/null; then
        fix_urls_in_file "$file"
    fi
done

# Find and fix PHP files
echo ""
echo "🔍 Finding PHP files to fix..."

find "$NAD_DIR" -name "*.php" -type f | while read -r file; do
    if grep -q "nad-app" "$file" 2>/dev/null; then
        fix_urls_in_file "$file"
    fi
done

# Fix JavaScript files
echo ""
echo "🔍 Finding JavaScript files to fix..."

find "$NAD_DIR" -name "*.js" -type f | while read -r file; do
    if grep -q "nad-app" "$file" 2>/dev/null; then
        fix_urls_in_file "$file"
    fi
done

# Check Apache configuration
echo ""
echo "🔍 Checking Apache configuration..."

# Check for .htaccess files
if [ -f "$WEB_ROOT/.htaccess" ]; then
    echo "📄 Found .htaccess at web root"
    if grep -q "nad-app" "$WEB_ROOT/.htaccess"; then
        echo "🔧 Fixing .htaccess URLs..."
        fix_urls_in_file "$WEB_ROOT/.htaccess"
    fi
fi

if [ -f "$NAD_DIR/.htaccess" ]; then
    echo "📄 Found .htaccess in NAD directory"
    if grep -q "nad-app" "$NAD_DIR/.htaccess"; then
        echo "🔧 Fixing NAD .htaccess URLs..."
        fix_urls_in_file "$NAD_DIR/.htaccess"
    fi
fi

# Create correct .htaccess if needed
echo ""
echo "🔧 Creating/updating .htaccess configuration..."

cat > "$WEB_ROOT/.htaccess" << 'EOF'
# NAD Test Cycle - Apache Configuration
RewriteEngine On

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# API Routes - Proxy to Node.js (port 3001)
RewriteRule ^api/(.*)$ http://127.0.0.1:3001/api/$1 [P,L]
RewriteRule ^health$ http://127.0.0.1:3001/health [P,L]

# NAD Interface Routes (direct to files)
RewriteRule ^portal/?$ /portal.php [L]
RewriteRule ^lab/?$ /lab.php [L] 
RewriteRule ^admin/?$ /admin.php [L]
RewriteRule ^test/?$ /test.php [L]

# Asset routes (if you have subdirectories)
RewriteRule ^assets/(.*)$ /assets/$1 [L]
RewriteRule ^shared/(.*)$ /shared/$1 [L]

# Prevent access to sensitive files
RewriteRule ^\.env - [F,L]
RewriteRule ^\.git - [F,L]
RewriteRule ^node_modules - [F,L]

# Default fallback (optional)
# RewriteCond %{REQUEST_FILENAME} !-f
# RewriteCond %{REQUEST_FILENAME} !-d
# RewriteRule ^(.*)$ /index.php [L]
EOF

echo "✅ Created/updated main .htaccess"

# Check if files exist where they should
echo ""
echo "🔍 Checking file locations..."

check_file() {
    local file="$1"
    local expected_path="$WEB_ROOT/$file"
    
    if [ -f "$expected_path" ]; then
        echo "✅ Found: $file"
    else
        echo "❌ Missing: $file"
        
        # Try to find it in nad-app subdirectory
        local nad_path="$WEB_ROOT/nad-app/$file"
        if [ -f "$nad_path" ]; then
            echo "🔄 Moving $file from nad-app/ to web root..."
            cp "$nad_path" "$expected_path"
            echo "✅ Moved: $file"
        fi
    fi
}

# Check main interface files (HTML)
check_file "customer-portal.html"
check_file "lab-interface.html"
check_file "admin-dashboard.html"
check_file "test.html"

# Check if there are any PHP files (shouldn't be any)
if find "$WEB_ROOT" -name "*.php" -type f | grep -q .; then
    echo "⚠️ Found PHP files (not expected in this setup):"
    find "$WEB_ROOT" -name "*.php" -type f | head -5
fi

# Update API base URLs in remaining files
echo ""
echo "🔧 Updating API base URLs..."

update_api_base() {
    local file="$1"
    if [ -f "$file" ]; then
        # Update API_BASE variable
        sed -i.bak 's|const API_BASE = [^;]*;|const API_BASE = "https://mynadtest.info";|g' "$file"
        sed -i.bak "s|API_BASE = [^;]*;|API_BASE = 'https://mynadtest.info';|g" "$file"
        
        # Remove backup file
        rm "${file}.bak" 2>/dev/null || true
        
        echo "✅ Updated API_BASE in: $(basename "$file")"
    fi
}

# Update API base in all relevant files
find "$WEB_ROOT" -name "*.html" -o -name "*.php" -o -name "*.js" | while read -r file; do
    if grep -q "API_BASE" "$file" 2>/dev/null; then
        update_api_base "$file"
    fi
done

# Test the configuration
echo ""
echo "🧪 Testing URL configuration..."

# Function to test URL
test_url() {
    local url="$1"
    local description="$2"
    
    echo -n "Testing $description: "
    if curl -s -I "$url" | grep -q "200\|301\|302"; then
        echo "✅ OK"
    else
        echo "❌ Failed"
    fi
}

# Test main URLs (only if curl is available)
if command -v curl >/dev/null 2>&1; then
    test_url "https://mynadtest.info/portal/" "Customer Portal"
    test_url "https://mynadtest.info/lab/" "Lab Interface"
    test_url "https://mynadtest.info/admin/" "Admin Dashboard"
    test_url "https://mynadtest.info/api/dashboard/stats" "API Endpoint"
else
    echo "ℹ️ curl not available - skipping URL tests"
fi

# Restart Apache to apply changes
echo ""
echo "🔄 Restarting Apache to apply changes..."

if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl restart apache2 2>/dev/null || sudo systemctl restart httpd 2>/dev/null || echo "⚠️ Could not restart Apache automatically"
elif [ -f "/opt/bitnami/ctlscript.sh" ]; then
    sudo /opt/bitnami/ctlscript.sh restart apache
    echo "✅ Restarted Bitnami Apache"
else
    echo "⚠️ Please restart Apache manually"
fi

# Summary
echo ""
echo "📋 URL Fix Summary:"
echo "===================="
echo "✅ Fixed /nad-app/ URLs in HTML, PHP, and JS files"
echo "✅ Updated API_BASE variables to use https://mynadtest.info"
echo "✅ Created/updated .htaccess configuration"
echo "✅ Set up proper URL rewriting rules"
echo "✅ Moved files to correct locations if needed"
echo ""
echo "🎯 Your URLs should now work as:"
echo "   https://mynadtest.info/portal/"
echo "   https://mynadtest.info/lab/"
echo "   https://mynadtest.info/admin/"
echo "   https://mynadtest.info/test/"
echo "   https://mynadtest.info/api/..."
echo ""
echo "🔍 If issues persist, check:"
echo "   1. Apache error logs: tail -f /var/log/apache2/error.log"
echo "   2. Browser developer console for remaining URL errors"
echo "   3. Node.js API status: pm2 status nad-api"
echo ""
echo "✅ URL path fix completed!"
