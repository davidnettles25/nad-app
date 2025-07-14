#!/bin/bash

# Apply Robust Dropdown Fix
# Run this in your frontend/ directory

echo "🔧 Applying Robust Dropdown Fix"
echo "==============================="

# Check if we're in the right directory
if [[ ! -f "admin.html" ]]; then
    echo "❌ admin.html not found. Run this from frontend/ directory"
    exit 1
fi

echo "📍 Working in: $(pwd)"

# Method 1: Create external script file
echo "🛠️ Creating robust dropdown fix script..."

mkdir -p admin/js

cat > admin/js/robust-dropdown-fix.js << 'EOF'
// Robust Test Management Dropdown Fix
// This version works with existing code and handles conflicts

console.log('🔧 Loading ROBUST dropdown fix...');

(function() {
    'use strict';
    
    let fixApplied = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Function to apply the fix
    function applyDropdownFix() {
        if (fixApplied) {
            console.log('✅ Dropdown fix already applied');
            return true;
        }
        
        attempts++;
        console.log(`🔧 Attempting dropdown fix (attempt ${attempts}/${maxAttempts})...`);
        
        const statusFilter = document.getElementById('status-filter');
        if (!statusFilter) {
            console.warn(`⚠️ Status filter not found (attempt ${attempts})`);
            return false;
        }
        
        console.log('✅ Status filter found, applying fix...');
        
        // Clear all existing event listeners by replacing the element
        const parent = statusFilter.parentNode;
        const newFilter = statusFilter.cloneNode(true);
        
        // Clear any inline handlers
        newFilter.onchange = null;
        newFilter.removeAttribute('onchange');
        
        // Replace the element
        parent.replaceChild(newFilter, statusFilter);
        
        // Add our robust event listener
        newFilter.addEventListener('change', function(e) {
            const selectedStatus = e.target.value;
            console.log('🔽 ROBUST: Status changed to:', selectedStatus || 'All');
            
            // Try multiple ways to get test data
            const allTests = window.allTests || window.filteredTests || [];
                            
            if (allTests.length === 0) {
                console.warn('⚠️ No test data found');
                if (typeof loadTestsFromAPI === 'function') {
                    loadTestsFromAPI();
                }
                return;
            }
            
            console.log(`📊 Working with ${allTests.length} tests`);
            
            // Apply filter
            let filtered = [...allTests];
            
            if (selectedStatus === 'activated') {
                filtered = allTests.filter(test => test.is_activated === true || test.is_activated === 1);
            } else if (selectedStatus === 'pending') {
                filtered = allTests.filter(test => test.is_activated === false || test.is_activated === 0);
            }
            
            console.log(`📋 Filtered to ${filtered.length} tests`);
            
            // Try multiple ways to update the display
            let updateSuccess = false;
            
            if (typeof renderTestsTable === 'function') {
                try {
                    renderTestsTable(filtered);
                    updateSuccess = true;
                    console.log('✅ Updated via renderTestsTable()');
                } catch (error) {
                    console.warn('⚠️ renderTestsTable failed:', error);
                }
            }
            
            if (!updateSuccess && typeof window.renderTestsTable === 'function') {
                try {
                    window.renderTestsTable(filtered);
                    updateSuccess = true;
                    console.log('✅ Updated via window.renderTestsTable()');
                } catch (error) {
                    console.warn('⚠️ window.renderTestsTable failed:', error);
                }
            }
            
            // Update global variables
            window.filteredTests = filtered;
            
            // Show feedback
            const statusText = selectedStatus || 'All';
            if (typeof showAlert === 'function') {
                showAlert(`🔍 ${statusText} tests: ${filtered.length} shown`, 'info');
            } else {
                console.log(`📊 ${statusText} - ${filtered.length} tests shown`);
            }
        });
        
        console.log('✅ ROBUST: Event listener attached');
        fixApplied = true;
        return true;
    }
    
    // Try to apply fix at different times
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(applyDropdownFix, 100);
        });
    } else {
        setTimeout(applyDropdownFix, 100);
    }
    
    // Also try after delays
    setTimeout(function() {
        if (!fixApplied) applyDropdownFix();
    }, 1000);
    
    setTimeout(function() {
        if (!fixApplied) applyDropdownFix();
    }, 3000);
    
    // Manual retry function
    window.retryDropdownFix = function() {
        fixApplied = false;
        attempts = 0;
        applyDropdownFix();
    };
    
    console.log('✅ ROBUST dropdown fix loaded');
    
})();
EOF

echo "✅ Created: admin/js/robust-dropdown-fix.js"

# Method 2: Add script reference to admin.html
echo "🛠️ Adding script reference to admin.html..."

# Backup first
cp admin.html admin.html.backup.robust.$(date +%Y%m%d_%H%M%S)

# Check if already added
if grep -q 'robust-dropdown-fix.js' admin.html; then
    echo "⚠️ Script already referenced in admin.html"
else
    # Add before </body>
    sed -i.tmp 's|</body>|<script src="admin/js/robust-dropdown-fix.js"></script>\n</body>|' admin.html
    rm -f admin.html.tmp
    echo "✅ Added script reference to admin.html"
fi

# Method 3: Create inline version for immediate testing
echo "🛠️ Creating inline version for console testing..."

cat > console-fix.js << 'EOF'
// PASTE THIS INTO BROWSER CONSOLE FOR IMMEDIATE TESTING

(function() {
    console.log('🔧 Console dropdown fix...');
    
    const statusFilter = document.getElementById('status-filter');
    if (!statusFilter) {
        console.error('❌ Status filter not found');
        return;
    }
    
    // Replace element to clear existing listeners
    const parent = statusFilter.parentNode;
    const newFilter = statusFilter.cloneNode(true);
    newFilter.onchange = null;
    newFilter.removeAttribute('onchange');
    parent.replaceChild(newFilter, statusFilter);
    
    // Add working listener
    newFilter.addEventListener('change', function(e) {
        const status = e.target.value;
        console.log('🔽 Status:', status);
        
        const tests = window.allTests || [];
        let filtered = tests;
        
        if (status === 'activated') {
            filtered = tests.filter(t => t.is_activated);
        } else if (status === 'pending') {
            filtered = tests.filter(t => !t.is_activated);
        }
        
        console.log(`Showing ${filtered.length} of ${tests.length} tests`);
        
        if (window.renderTestsTable) {
            window.renderTestsTable(filtered);
        }
    });
    
    console.log('✅ Console fix applied');
})();
EOF

echo "✅ Created: console-fix.js"

echo ""
echo "🎯 THREE WAYS TO FIX THE DROPDOWN:"
echo "=================================="
echo ""
echo "📋 METHOD 1: File-based fix (recommended)"
echo "   - ✅ Script created: admin/js/robust-dropdown-fix.js"
echo "   - ✅ Reference added to admin.html"
echo "   - 🔄 Test by refreshing https://mynadtest.info/admin.html"
echo ""
echo "📋 METHOD 2: Console fix (immediate testing)"
echo "   - Copy contents of console-fix.js"
echo "   - Paste into browser console (F12)"
echo "   - Test dropdown immediately"
echo ""
echo "📋 METHOD 3: Manual retry (if needed)"
echo "   - Open browser console"
echo "   - Type: window.retryDropdownFix()"
echo "   - Press Enter"
echo ""
echo "🔍 WHAT TO LOOK FOR:"
echo "   - Console message: '🔧 Loading ROBUST dropdown fix...'"
echo "   - Console message: '✅ ROBUST: Event listener attached'"
echo "   - When changing dropdown: '🔽 ROBUST: Status changed to: [status]'"
echo ""
echo "✅ Robust fix ready for testing!"
