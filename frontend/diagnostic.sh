#!/bin/bash
# NAD Test Cycle System Diagnostic
# Run this to identify URL and configuration issues

echo "🔍 NAD Test Cycle System Diagnostic"
echo "===================================="
echo ""

# Check system information
echo "📋 System Information:"
echo "----------------------"
echo "Date: $(date)"
echo "User: $(whoami)"
echo "PWD: $(pwd)"
echo ""

# Check web server
echo "🌐 Web Server Check:"
echo "--------------------"
if pgrep apache2 > /dev/null; then
    echo "✅ Apache2 is running"
elif pgrep httpd > /dev/null; then
    echo "✅ Apache (httpd) is running"
else
    echo "❌ Apache is not running"
fi
echo ""

# Check Node.js API
echo "🔧 Node.js API Check:"
echo "---------------------"
if command -v pm2 >/dev/null 2>&1; then
    echo "PM2 Status:"
    pm2 status nad-api 2>/dev/null || echo "❌ nad-api not found in PM2"
else
    echo "⚠️ PM2 not found"
fi

if pgrep node > /dev/null; then
    echo "✅ Node.js processes are running"
else
    echo "❌ No Node.js processes found"
fi
echo ""

# Check directory structure
echo "📁 Directory Structure Check:"
echo "-----------------------------"

# Find web root
WEB_ROOTS=("/opt/bitnami/apache/htdocs" "/home/mynadtes/public_html" "/var/www/html")
WEB_ROOT=""

for root in "${WEB_ROOTS[@]}"; do
    if [ -d "$root" ]; then
        WEB_ROOT="$root"
        echo "✅ Web root found: $WEB_ROOT"
        break
    fi
done

if [ -z "$WEB_ROOT" ]; then
    echo "❌ Web root not found"
    exit 1
fi

# Check NAD files
echo ""
echo "📄 NAD File Check:"
echo "------------------"
check_file() {
    local file="$1"
    local location="$2"
    if [ -f "$location/$file" ]; then
        echo "✅ $file found at $location"
    else
        echo "❌ $file missing from $location"
        
        # Check in nad-app subdirectory
        if [ -f "$location/nad-app/$file" ]; then
            echo "   ℹ️ Found in $location/nad-app/"
        fi
    fi
}

check_file "customer-portal.html" "$WEB_ROOT"
check_file "lab-interface.html" "$WEB_ROOT"  
check_file "admin-dashboard.html" "$WEB_ROOT"
check_file "test.html" "$WEB_ROOT"

# Check if there are any PHP files (not expected)
echo ""
echo "⚠️ PHP File Check (should be none):"
if find "$WEB_ROOT" -name "*.php" -type f 2>/dev/null | head -5 | grep -q .; then
    echo "Found unexpected PHP files:"
    find "$WEB_ROOT" -name "*.php" -type f | head -5 | sed 's/^/   /'
else
    echo "✅ No PHP files found (correct for HTML-only setup)"
fi

echo ""
echo "⚙️ Configuration Files:"
echo "-----------------------"
if [ -f "$WEB_ROOT/.htaccess" ]; then
    echo "✅ .htaccess found in web root"
    echo "   Content preview:"
    head -10 "$WEB_ROOT/.htaccess" | sed 's/^/   /'
else
    echo "❌ .htaccess missing from web root"
fi

if [ -f "$WEB_ROOT/nad-app/.htaccess" ]; then
    echo "✅ .htaccess found in nad-app directory"
else
    echo "ℹ️ No .htaccess in nad-app directory"
fi
echo ""

# Check URL patterns in files
echo "🔗 URL Pattern Analysis:"
echo "------------------------"
echo "Checking for problematic /nad-app/ URLs..."

problem_files=()
if [ -d "$WEB_ROOT" ]; then
    while IFS= read -r -d '' file; do
        if grep -l "nad-app" "$file" 2>/dev/null; then
            problem_files+=("$file")
        fi
    done < <(find "$WEB_ROOT" -name "*.html" -o -name "*.php" -o -name "*.js" -print0 2>/dev/null)
fi

if [ ${#problem_files[@]} -eq 0 ]; then
    echo "✅ No problematic /nad-app/ URLs found"
else
    echo "⚠️ Files containing /nad-app/ URLs:"
    for file in "${problem_files[@]}"; do
        echo "   - $(basename "$file")"
        grep -n "nad-app" "$file" | head -3 | sed 's/^/     /'
    done
fi
echo ""

# Test API endpoints
echo "🧪 API Endpoint Tests:"
echo "----------------------"
if command -v curl >/dev/null 2>&1; then
    test_endpoint() {
        local url="$1"
        local name="$2"
        echo -n "Testing $name ($url): "
        
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
        if [ "$response" = "200" ]; then
            echo "✅ OK"
        elif [ "$response" = "404" ]; then
            echo "❌ Not Found (404)"
        elif [ "$response" = "500" ]; then
            echo "❌ Server Error (500)"
        elif [ "$response" = "000" ]; then
            echo "❌ Connection Failed"
        else
            echo "⚠️ HTTP $response"
        fi
    }
    
    test_endpoint "https://mynadtest.info/" "Main Site"
    test_endpoint "https://mynadtest.info/portal/" "Customer Portal"
    test_endpoint "https://mynadtest.info/lab/" "Lab Interface"
    test_endpoint "https://mynadtest.info/admin/" "Admin Dashboard"
    test_endpoint "https://mynadtest.info/api/dashboard/stats" "API Dashboard"
    test_endpoint "https://mynadtest.info/health" "Health Check"
else
    echo "⚠️ curl not available - cannot test endpoints"
fi
echo ""

# Check logs for errors
echo "📋 Recent Error Check:"
echo "----------------------"
echo "Checking recent Apache errors..."

LOG_FILES=("/var/log/apache2/error.log" "/opt/bitnami/apache/logs/error.log" "/home/mynadtes/logs/nad-error.log")
found_logs=false

for log_file in "${LOG_FILES[@]}"; do
    if [ -f "$log_file" ]; then
        echo "📄 Checking $log_file:"
        tail -10 "$log_file" 2>/dev/null | grep -E "(404|500|error|Error|ERROR)" | tail -5 | sed 's/^/   /' || echo "   No recent errors found"
        found_logs=true
        break
    fi
done

if [ "$found_logs" = false ]; then
    echo "ℹ️ No accessible log files found"
fi
echo ""

# DNS and connectivity check
echo "🌍 DNS and Connectivity:"
echo "------------------------"
if command -v nslookup >/dev/null 2>&1; then
    echo "DNS lookup for mynadtest.info:"
    nslookup mynadtest.info | grep -E "(Address|Name)" | sed 's/^/   /'
else
    echo "ℹ️ nslookup not available"
fi
echo ""

# Quick fix recommendations
echo "🔧 Quick Fix Recommendations:"
echo "==============================="

if [ ${#problem_files[@]} -gt 0 ]; then
    echo "1. 🔗 Fix URL Issues:"
    echo "   Run the URL fix script to update /nad-app/ URLs"
    echo ""
fi

if [ ! -f "$WEB_ROOT/.htaccess" ]; then
    echo "2. ⚙️ Create .htaccess:"
    echo "   Copy the correct .htaccess configuration to web root"
    echo ""
fi

if ! pgrep apache2 > /dev/null && ! pgrep httpd > /dev/null; then
    echo "3. 🌐 Start Apache:"
    echo "   sudo systemctl start apache2"
    echo "   # OR for Bitnami:"
    echo "   sudo /opt/bitnami/ctlscript.sh start apache"
    echo ""
fi

if ! pm2 list 2>/dev/null | grep -q nad-api; then
    echo "4. 🔧 Start Node.js API:"
    echo "   pm2 start nad-api"
    echo "   # OR navigate to app directory and:"
    echo "   pm2 start ecosystem.config.js"
    echo ""
fi

echo "5. 📱 Test URLs manually:"
echo "   https://mynadtest.info/portal/"
echo "   https://mynadtest.info/admin/"
echo "   https://mynadtest.info/api/dashboard/stats"
echo ""

echo "✅ Diagnostic completed!"
echo "📝 Run this again after making fixes to verify resolution."
