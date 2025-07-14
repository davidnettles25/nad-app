#!/bin/bash

# Diagnose Admin Structure Issues
# Run this first to understand the current structure

echo "🔍 Diagnosing Admin Structure Issues"
echo "===================================="

echo "📍 Working in: $(pwd)"

if [[ ! -f "admin.html" ]]; then
    echo "❌ admin.html not found"
    exit 1
fi

echo ""
echo "📋 NAVIGATION ANALYSIS"
echo "====================="

echo "🔍 Current navigation items:"
grep -n 'data-section\|onclick.*show' admin.html | head -10

echo ""
echo "📋 SECTION ANALYSIS"  
echo "=================="

echo "🔍 Content sections found:"
grep -n 'content-section\|id="[^"]*".*class.*section' admin.html

echo ""
echo "📋 OVERVIEW SECTION CONTENT"
echo "=========================="

echo "🔍 What's currently in Overview section:"
# Extract content between overview section start and next section or end
awk '
/id="overview"/ { in_overview = 1; start_line = NR }
in_overview && /id="[^"]*".*content-section/ && !/id="overview"/ { 
    print "Overview section ends at line " NR-1
    in_overview = 0 
}
in_overview { 
    if (NR > start_line && length($0) > 0) {
        print NR ": " $0
    }
}
END { 
    if (in_overview) print "Overview section continues to end of file"
}
' admin.html | head -20

echo ""
echo "📋 BATCH PRINTING CHECK"
echo "======================"

if grep -q 'batch-printing' admin.html; then
    echo "✅ Batch printing references found:"
    grep -n 'batch-printing\|Batch Printing' admin.html
else
    echo "❌ No batch printing references found"
fi

echo ""
echo "📋 JAVASCRIPT FUNCTIONS"
echo "======================"

echo "🔍 Show functions found:"
grep -n 'function show\|showBatchPrinting\|showSection' admin.html

echo ""
echo "📋 CSS AND JS REFERENCES"
echo "========================"

echo "🔍 CSS files referenced:"
grep -n 'stylesheet\|\.css' admin.html

echo ""
echo "🔍 JS files referenced:"
grep -n 'script.*src' admin.html

echo ""
echo "🎯 DIAGNOSIS SUMMARY"
echo "==================="

# Check for common issues
issues_found=0

if ! grep -q 'batch-printing' admin.html; then
    echo "❌ Issue 1: Batch printing not integrated"
    ((issues_found++))
fi

if grep -A 50 'id="overview"' admin.html | grep -q 'Create Test\|test-quantity'; then
    echo "❌ Issue 2: Test creation form appears in Overview section"
    echo "   This content should only be in Test Management section"
    ((issues_found++))
fi

if ! grep -q 'showBatchPrinting' admin.html; then
    echo "❌ Issue 3: showBatchPrinting function missing"
    ((issues_found++))
fi

if ! grep -q 'batch-printing.css' admin.html; then
    echo "❌ Issue 4: Batch printing CSS not referenced"
    ((issues_found++))
fi

if ! grep -q 'batch-printing.js' admin.html; then
    echo "❌ Issue 5: Batch printing JS not referenced"
    ((issues_found++))
fi

if [[ $issues_found -eq 0 ]]; then
    echo "✅ No obvious issues detected"
else
    echo "⚠️ Found $issues_found issues that need fixing"
fi

echo ""
echo "📋 RECOMMENDED ACTIONS"
echo "====================="

if [[ $issues_found -gt 0 ]]; then
    echo "1. Run the fix script: ./fix_admin_sections.sh"
    echo "2. Manually check admin.html for content bleeding"
    echo "3. Ensure Overview section only contains dashboard stats"
    echo "4. Verify each section is properly contained in its div"
    echo "5. Test navigation after deployment"
else
    echo "✅ Structure looks good. If issues persist:"
    echo "1. Check browser console for JavaScript errors"
    echo "2. Verify API endpoints are working"
    echo "3. Clear browser cache and refresh"
fi

echo ""
echo "✅ Diagnosis complete!"
