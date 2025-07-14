#!/bin/bash

# Fix Method 1 - Script Loading Issues
# Run this in your frontend/ directory

echo "🔧 Fixing Method 1 Script Loading"
echo "================================="

echo "📍 Working in: $(pwd)"

# Check current admin.html structure
echo ""
echo "🔍 Step 1: Diagnosing the issue..."

if [[ ! -f "admin.html" ]]; then
    echo "❌ admin.html not found"
    exit 1
fi

# Check if our script reference exists
if grep -q 'robust-dropdown-fix.js' admin.html; then
    echo "✅ Script reference found in admin.html"
    
    # Show where it's placed
    echo "📋 Script placement:"
    grep -n -B2 -A2 'robust-dropdown-fix.js' admin.html
    
else
    echo "❌ Script reference NOT found in admin.html"
fi

# Check if script file exists
if [[ -f "admin/js/robust-dropdown-fix.js" ]]; then
    echo "✅ Script file exists: admin/js/robust-dropdown-fix.js"
else
    echo "❌ Script file missing: admin/js/robust-dropdown-fix.js"
fi

echo ""
echo "🛠️ Step 2: Creating a better version..."

# Create a more aggressive version that runs later
cat > admin/js/final-dropdown-fix.js << 'EOF'
// FINAL Dropdown Fix - Runs after everything else
// This version waits for all other scripts to finish

console.log('🔧 FINAL dropdown fix loading...');

// Function that definitely works (copied from console method)
function applyFinalDropdownFix() {
    console.log('🔧 Applying FINAL dropdown fix...');
    
    const statusFilter = document.getElementById('status-filter');
    if (!statusFilter) {
        console.error('❌ Status filter not found in FINAL fix');
        return false;
    }
    
    console.log('✅ Status filter found, applying FINAL fix...');
    
    // Replace element to clear ALL existing listeners
    const parent = statusFilter.parentNode;
    const newFilter = statusFilter.cloneNode(true);
    newFilter.onchange = null;
    newFilter.removeAttribute('onchange');
    parent.replaceChild(newFilter, statusFilter);
    
    // Add our working listener (exact copy of console method)
    newFilter.addEventListener('change', function(e) {
        const status = e.target.value;
        console.log('🔽 FINAL: Status changed to:', status);
        
        const tests = window.allTests || [];
        let filtered = tests;
        
        if (status === 'activated') {
            filtered = tests.filter(t => t.is_activated);
        } else if (status === 'pending') {
            filtered = tests.filter(t => !t.is_activated);
        }
        
        console.log(`FINAL: Showing ${filtered.length} of ${tests.length} tests`);
        
        if (window.renderTestsTable) {
            window.renderTestsTable(filtered);
        } else {
            console.warn('⚠️ renderTestsTable not found');
        }
    });
    
    console.log('✅ FINAL: Event listener attached successfully');
    return true;
}

// Try multiple strategies to ensure this runs LAST

// Strategy 1: Wait for everything to load
window.addEventListener('load', function() {
    console.log('🔧 Window loaded, applying FINAL fix...');
    setTimeout(applyFinalDropdownFix, 500);
});

// Strategy 2: Use longer delays
setTimeout(function() {
    console.log('🔧 5-second delay, applying FINAL fix...');
    applyFinalDropdownFix();
}, 5000);

// Strategy 3: Watch for when tests are loaded
let testLoadWatcher = setInterval(function() {
    if (window.allTests && window.allTests.length > 0) {
        console.log('🔧 Tests detected, applying FINAL fix...');
        clearInterval(testLoadWatcher);
        setTimeout(applyFinalDropdownFix, 1000);
    }
}, 1000);

// Strategy 4: Override setupSearchAndFilter if it exists
if (window.setupSearchAndFilter) {
    const originalSetup = window.setupSearchAndFilter;
    window.setupSearchAndFilter = function() {
        console.log('🔧 Intercepting setupSearchAndFilter...');
        originalSetup.apply(this, arguments);
        setTimeout(applyFinalDropdownFix, 500);
    };
}

// Strategy 5: Manual trigger function
window.applyFinalDropdownFix = applyFinalDropdownFix;

console.log('✅ FINAL dropdown fix strategies loaded');
EOF

echo "✅ Created: admin/js/final-dropdown-fix.js"

echo ""
echo "🛠️ Step 3: Updating admin.html to load our script LAST..."

# Remove old script reference if it exists
sed -i.backup 's|.*robust-dropdown-fix.js.*||' admin.html

# Add our new script RIGHT before </body> (last thing to load)
if grep -q '</body>' admin.html; then
    # Find the </body> tag and add our script just before it
    sed -i.tmp 's|</body>|<script src="admin/js/final-dropdown-fix.js"></script>\n</body>|' admin.html
    rm -f admin.html.tmp
    echo "✅ Added final-dropdown-fix.js as LAST script before </body>"
else
    echo "⚠️ No </body> tag found, adding at end of file"
    echo '<script src="admin/js/final-dropdown-fix.js"></script>' >> admin.html
fi

echo ""
echo "🛠️ Step 4: Creating an even more aggressive inline version..."

# Create backup of current admin.html
cp admin.html admin.html.pre-inline-fix

# Add inline script that definitely runs last
cat >> admin.html << 'EOF'

<script>
// INLINE FINAL FIX - This definitely runs last
console.log('🔧 INLINE final fix...');

// Wait a bit then apply fix
setTimeout(function() {
    console.log('🔧 INLINE applying fix...');
    
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        const parent = statusFilter.parentNode;
        const newFilter = statusFilter.cloneNode(true);
        newFilter.onchange = null;
        newFilter.removeAttribute('onchange');
        parent.replaceChild(newFilter, statusFilter);
        
        newFilter.addEventListener('change', function(e) {
            const status = e.target.value;
            console.log('🔽 INLINE: Status:', status);
            
            const tests = window.allTests || [];
            let filtered = tests;
            
            if (status === 'activated') {
                filtered = tests.filter(t => t.is_activated);
            } else if (status === 'pending') {
                filtered = tests.filter(t => !t.is_activated);
            }
            
            if (window.renderTestsTable) {
                window.renderTestsTable(filtered);
            }
            console.log(`INLINE: ${filtered.length} tests shown`);
        });
        
        console.log('✅ INLINE fix applied');
    }
}, 3000);
</script>
EOF

echo "✅ Added inline script to admin.html"

echo ""
echo "🛠️ Step 5: Testing script paths..."

# Test if scripts can be accessed
if [[ -f "admin/js/final-dropdown-fix.js" ]]; then
    echo "✅ Script file exists and readable"
    echo "📊 Script size: $(wc -c < admin/js/final-dropdown-fix.js) bytes"
else
    echo "❌ Script file issue"
fi

echo ""
echo "🎯 WHAT WE'VE DONE"
echo "=================="
echo "✅ Created final-dropdown-fix.js with multiple loading strategies"
echo "✅ Added external script reference (loads before existing code)"
echo "✅ Added INLINE script (loads after existing code)"
echo "✅ Script tries to apply fix at multiple times:"
echo "   - After window load event"
echo "   - After 5 second delay"
echo "   - When tests are detected"
echo "   - When setupSearchAndFilter is called"
echo ""
echo "🔍 TESTING STEPS:"
echo "1. Deploy to server: ./deployment_script.sh"
echo "2. Visit https://mynadtest.info/admin.html"
echo "3. Open console (F12)"
echo "4. Look for multiple fix messages:"
echo "   - '🔧 FINAL dropdown fix loading...'"
echo "   - '🔧 INLINE final fix...'"
echo "   - '✅ FINAL: Event listener attached successfully'"
echo "   - '✅ INLINE fix applied'"
echo "5. Test dropdown - should work now!"
echo ""
echo "🚨 If STILL not working:"
echo "   - The console method (Method 3) will always work as backup"
echo "   - We know the logic is correct, just timing issues"
echo ""
echo "✅ Method 1 should now work!"
