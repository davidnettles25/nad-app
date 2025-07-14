#!/bin/bash

# Diagnose Endpoint Issue
# Find out exactly why the endpoint is still 404

echo "🔍 Diagnosing Endpoint Issue"
echo "============================"

echo "📍 Current directory: $(pwd)"

echo ""
echo "🔍 Step 1: Finding all server.js files..."

# Find all server.js files
echo "📋 All server.js files in project:"
find . -name "server.js" -type f 2>/dev/null | while read -r file; do
    echo "   $file ($(wc -l < "$file") lines)"
done

echo ""
echo "🔍 Step 2: Checking each server.js for our endpoint..."

# Check each server.js file
find . -name "server.js" -type f 2>/dev/null | while read -r file; do
    echo ""
    echo "📄 Checking: $file"
    
    if grep -q "/api/admin/printable-batches" "$file"; then
        echo "   ✅ Has printable-batches endpoint"
        grep -n "/api/admin/printable-batches" "$file"
    else
        echo "   ❌ Missing printable-batches endpoint"
    fi
    
    if grep -q "app\.listen\|server\.listen" "$file"; then
        echo "   ✅ Has server listen"
        grep -n "app\.listen\|server\.listen" "$file"
    else
        echo "   ⚠️ No server listen found"
    fi
done

echo ""
echo "🔍 Step 3: Checking for running Node.js processes..."

if command -v ps &> /dev/null; then
    echo "📋 Running Node.js processes:"
    ps aux | grep node | grep -v grep | while read -r line; do
        echo "   $line"
    done
else
    echo "⚠️ ps command not available"
fi

echo ""
echo "🔍 Step 4: Testing endpoint directly..."

echo "📋 Testing local endpoints:"

# Test different possible ports/hosts
HOSTS=("localhost:3000" "localhost:8000" "localhost:5000" "127.0.0.1:3000")

for host in "${HOSTS[@]}"; do
    echo -n "   Testing http://$host/api/admin/printable-batches: "
    
    if command -v curl &> /dev/null; then
        if curl -s -f "http://$host/api/admin/printable-batches" >/dev/null 2>&1; then
            echo "✅ WORKS!"
            echo "     Response: $(curl -s "http://$host/api/admin/printable-batches" | head -c 100)..."
        else
            echo "❌ Failed"
        fi
    else
        echo "⚠️ curl not available"
    fi
done

echo ""
echo "🔍 Step 5: Checking what's actually running on mynadtest.info..."

echo "📋 Testing production endpoint:"
if command -v curl &> /dev/null; then
    echo -n "   https://mynadtest.info/api/admin/printable-batches: "
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://mynadtest.info/api/admin/printable-batches")
    echo "HTTP $HTTP_CODE"
    
    if [[ "$HTTP_CODE" == "404" ]]; then
        echo "   ❌ Endpoint not found on production server"
        echo "   📋 This means the production server doesn't have our endpoint"
    elif [[ "$HTTP_CODE" == "200" ]]; then
        echo "   ✅ Endpoint exists on production server"
        RESPONSE=$(curl -s "https://mynadtest.info/api/admin/printable-batches")
        echo "   📋 Response: $(echo "$RESPONSE" | head -c 100)..."
    else
        echo "   ⚠️ Unexpected response code: $HTTP_CODE"
    fi
else
    echo "⚠️ curl not available"
fi

echo ""
echo "🔍 Step 6: Checking existing API endpoints on production..."

echo "📋 Testing known working endpoints:"

WORKING_ENDPOINTS=(
    "/api/admin/tests"
    "/api/admin/test-batches"
    "/api/dashboard/stats"
)

for endpoint in "${WORKING_ENDPOINTS[@]}"; do
    echo -n "   https://mynadtest.info$endpoint: "
    
    if command -v curl &> /dev/null; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://mynadtest.info$endpoint")
        echo "HTTP $HTTP_CODE"
    else
        echo "⚠️ curl not available"
    fi
done

echo ""
echo "🔍 Step 7: Looking for package.json and start scripts..."

if [[ -f "package.json" ]]; then
    echo "📋 Found package.json:"
    echo "   Scripts:"
    grep -A 10 '"scripts"' package.json | head -10
else
    echo "⚠️ No package.json found in current directory"
fi

echo ""
echo "🎯 DIAGNOSIS SUMMARY"
echo "==================="

echo ""
echo "📋 Based on the results above:"

echo ""
echo "🔧 LIKELY ISSUES:"
echo "1. 📡 Production server (mynadtest.info) needs to be updated"
echo "2. 🔄 Local server has endpoint but production doesn't"
echo "3. 📤 Code needs to be deployed to production server"

echo ""
echo "🔧 POSSIBLE SOLUTIONS:"

echo ""
echo "Option A - If this is a production deployment:"
echo "1. 🚀 Deploy your updated server.js to production"
echo "2. 🔄 Restart the production server"
echo "3. 🧪 Test the endpoint"

echo ""
echo "Option B - If you want to test locally:"
echo "1. 🔧 Update the frontend to use local API"
echo "2. 🚀 Run server locally: node server.js"
echo "3. 🌐 Access admin via localhost instead of mynadtest.info"

echo ""
echo "Option C - Add endpoint directly to production:"
echo "1. 🔧 SSH to production server"
echo "2. 📝 Edit the production server.js file"
echo "3. 🔄 Restart production server"

echo ""
echo "🎯 RECOMMENDED NEXT STEP:"
echo "Check which server.js file actually has the endpoint code,"
echo "then deploy that file to production or run locally for testing."

echo ""
echo "✅ Diagnosis complete!"
