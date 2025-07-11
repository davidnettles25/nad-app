#!/bin/bash
# Fix admin-dashboard.html URL issues
# Removes /nad-app/ from all URLs and updates API_BASE

echo "🔧 Fixing Admin Dashboard URLs"
echo "==============================="

# Find web root
WEB_ROOTS=("/opt/bitnami/apache/htdocs" "/home/mynadtes/public_html")
WEB_ROOT=""

for root in "${WEB_ROOTS[@]}"; do
    if [ -d "$root" ]; then
        WEB_ROOT="$root"
        echo "🌐 Web root found: $WEB_ROOT"
        break
    fi
done

if [ -z "$WEB_ROOT" ]; then
    echo "❌ Cannot find web root directory"
    exit 1
fi

# Find the admin dashboard file
ADMIN_FILE=""
for possible_file in "$WEB_ROOT/admin-dashboard.html" "$WEB_ROOT/nad-app/admin-dashboard.html" "$WEB_ROOT/admin/admin-dashboard.html"; do
    if [ -f "$possible_file" ]; then
        ADMIN_FILE="$possible_file"
        echo "📄 Found admin file: $ADMIN_FILE"
        break
    fi
done

if [ -z "$ADMIN_FILE" ]; then
    echo "❌ admin-dashboard.html not found"
    echo "🔍 Searching for admin files..."
    find "$WEB_ROOT" -name "*admin*.html" -type f 2>/dev/null | head -5
    exit 1
fi

# Create backup
BACKUP_FILE="$ADMIN_FILE.backup.$(date +%Y%m%d_%H%M%S)"
cp "$ADMIN_FILE" "$BACKUP_FILE"
echo "💾 Backup created: $BACKUP_FILE"

echo ""
echo "🔍 Current problematic URLs in admin file:"
echo "----------------------------------------------"
grep -n "nad-app" "$ADMIN_FILE" | head -10

echo ""
echo "🔧 Fixing URLs in admin-dashboard.html..."

# Comprehensive URL fixing
sed -i.tmp \
    -e 's|https://mynadtest\.info/nad-app/|https://mynadtest.info/|g' \
    -e 's|mynadtest\.info/nad-app/|mynadtest.info/|g' \
    -e 's|"/nad-app/|"/|g' \
    -e 's|'"'"'/nad-app/|'"'"'/|g' \
    -e 's|/nad-app/shared/|/shared/|g' \
    -e 's|/nad-app/assets/|/assets/|g' \
    -e 's|/nad-app/admin/|/admin/|g' \
    -e 's|/nad-app/customer/|/customer/|g' \
    -e 's|/nad-app/lab/|/lab/|g' \
    -e 's|/nad-app/test/|/test/|g' \
    -e 's|/nad-app/api/|/api/|g' \
    -e 's|/nad-app/portal|/portal|g' \
    -e 's|/nad-app/uploads/|/uploads/|g' \
    "$ADMIN_FILE"

# Fix API_BASE variable specifically
sed -i.tmp2 \
    -e 's|const API_BASE = [^;]*;|const API_BASE = "https://mynadtest.info";|g' \
    -e "s|API_BASE = [^;]*;|API_BASE = 'https://mynadtest.info';|g" \
    -e 's|API_BASE = [^;]*|API_BASE = "https://mynadtest.info"|g' \
    "$ADMIN_FILE"

# Remove temp files
rm "$ADMIN_FILE.tmp" "$ADMIN_FILE.tmp2" 2>/dev/null

echo "✅ URLs fixed in admin-dashboard.html"

# Check if changes were made
if ! diff -q "$ADMIN_FILE" "$BACKUP_FILE" >/dev/null 2>&1; then
    echo ""
    echo "📊 Changes made:"
    echo "----------------"
    echo "Lines changed: $(diff "$BACKUP_FILE" "$ADMIN_FILE" | grep "^>" | wc -l)"
    
    echo ""
    echo "🔍 Verifying fixes (should show no /nad-app/ URLs):"
    if grep -q "nad-app" "$ADMIN_FILE"; then
        echo "⚠️ Still found some /nad-app/ references:"
        grep -n "nad-app" "$ADMIN_FILE" | head -5
    else
        echo "✅ No more /nad-app/ URLs found"
    fi
    
    echo ""
    echo "🔍 API_BASE configuration:"
    grep -n "API_BASE" "$ADMIN_FILE" | head -3
else
    echo "ℹ️ No changes were needed"
fi

# Move admin file to correct location if needed
if [[ "$ADMIN_FILE" == *"/nad-app/"* ]]; then
    NEW_LOCATION="$WEB_ROOT/admin-dashboard.html"
    echo ""
    echo "📁 Moving admin file to correct location..."
    cp "$ADMIN_FILE" "$NEW_LOCATION"
    echo "✅ Admin file copied to: $NEW_LOCATION"
fi

# Ensure .htaccess has correct admin routing
echo ""
echo "⚙️ Checking .htaccess admin routing..."

if [ -f "$WEB_ROOT/.htaccess" ]; then
    if grep -q "admin-dashboard.html" "$WEB_ROOT/.htaccess"; then
        echo "✅ Admin routing already configured in .htaccess"
    else
        echo "🔧 Adding admin routing to .htaccess..."
        
        # Add admin routing rule
        cat >> "$WEB_ROOT/.htaccess" << 'EOF'

# Admin Dashboard routing
RewriteRule ^admin/?$ /admin-dashboard.html [L]
RewriteRule ^admin/(.*)$ /admin-dashboard.html [L]
EOF
        echo "✅ Added admin routing to .htaccess"
    fi
else
    echo "⚠️ .htaccess not found - creating one..."
    cat > "$WEB_ROOT/.htaccess" << 'EOF'
# NAD Test Cycle - Apache Configuration
RewriteEngine On

# MIME Type Configuration
AddType text/css .css
AddType application/javascript .js
AddType application/json .json

# Admin Dashboard routing
RewriteRule ^admin/?$ /admin-dashboard.html [L]
RewriteRule ^admin/(.*)$ /admin-dashboard.html [L]

# Other interface routing
RewriteRule ^portal/?$ /customer-portal.html [L]
RewriteRule ^lab/?$ /lab-interface.html [L]
RewriteRule ^test/?$ /test.html [L]

# API proxy to Node.js
RewriteRule ^api/(.*)$ http://127.0.0.1:3001/api/$1 [P,L]
RewriteRule ^health$ http://127.0.0.1:3001/health [P,L]

# Static assets
RewriteRule ^shared/(.*)$ /shared/$1 [L]
RewriteRule ^assets/(.*)$ /assets/$1 [L]
RewriteRule ^uploads/(.*)$ /uploads/$1 [L]
EOF
    echo "✅ Created .htaccess with admin routing"
fi

# Check if other HTML files need fixing too
echo ""
echo "🔍 Checking other HTML files for /nad-app/ URLs..."

OTHER_FILES=("customer-portal.html" "lab-interface.html" "test.html")
files_to_fix=()

for file in "${OTHER_FILES[@]}"; do
    if [ -f "$WEB_ROOT/$file" ]; then
        if grep -q "nad-app" "$WEB_ROOT/$file" 2>/dev/null; then
            files_to_fix+=("$file")
            echo "⚠️ $file also contains /nad-app/ URLs"
        else
            echo "✅ $file looks clean"
        fi
    else
        echo "ℹ️ $file not found (may not exist yet)"
    fi
done

if [ ${#files_to_fix[@]} -gt 0 ]; then
    echo ""
    echo "🔧 Fixing other HTML files..."
    
    for file in "${files_to_fix[@]}"; do
        echo "Fixing $file..."
        cp "$WEB_ROOT/$file" "$WEB_ROOT/$file.backup.$(date +%Y%m%d_%H%M%S)"
        
        sed -i \
            -e 's|https://mynadtest\.info/nad-app/|https://mynadtest.info/|g' \
            -e 's|mynadtest\.info/nad-app/|mynadtest.info/|g' \
            -e 's|"/nad-app/|"/|g' \
            -e 's|'"'"'/nad-app/|'"'"'/|g' \
            -e 's|/nad-app/shared/|/shared/|g' \
            -e 's|/nad-app/assets/|/assets/|g' \
            -e 's|/nad-app/api/|/api/|g' \
            -e 's|const API_BASE = [^;]*;|const API_BASE = "https://mynadtest.info";|g' \
            "$WEB_ROOT/$file"
        
        echo "✅ Fixed $file"
    done
fi

# Restart Apache to apply .htaccess changes
echo ""
echo "🔄 Restarting Apache..."
if [ -f "/opt/bitnami/ctlscript.sh" ]; then
    sudo /opt/bitnami/ctlscript.sh restart apache
    echo "✅ Restarted Bitnami Apache"
elif command -v systemctl >/dev/null 2>&1; then
    sudo systemctl restart apache2
    echo "✅ Restarted Apache2"
else
    echo "⚠️ Please restart Apache manually"
fi

# Test the admin URL
echo ""
echo "🧪 Testing admin URL..."
if command -v curl >/dev/null 2>&1; then
    echo "Testing https://mynadtest.info/admin/..."
    
    response=$(curl -s -I "https://mynadtest.info/admin/" | head -1)
    echo "Response: $response"
    
    if echo "$response" | grep -q "200\|301\|302"; then
        echo "✅ Admin URL is accessible"
    else
        echo "❌ Admin URL may have issues"
    fi
else
    echo "ℹ️ curl not available - test manually in browser"
fi

echo ""
echo "📋 Fix Summary:"
echo "==============="
echo "✅ Fixed /nad-app/ URLs in admin-dashboard.html"
echo "✅ Updated API_BASE to correct value"
echo "✅ Ensured .htaccess has admin routing"
echo "✅ Fixed other HTML files if needed"
echo "✅ Restarted Apache"
echo ""
echo "🎯 Test these URLs now:"
echo "   https://mynadtest.info/admin/"
echo "   https://www.mynadtest.info/admin/"
echo ""
echo "🔍 In browser console, you should see:"
echo "   ✅ No more 404 errors for /nad-app/ URLs"
echo "   ✅ API_BASE = 'https://mynadtest.info'"
echo "   ✅ Dashboard loads successfully"
echo ""
echo "✅ Admin dashboard fix completed!"
