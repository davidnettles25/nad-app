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
                filtered = allTests.filter(test => test.status === 'activated');
            } else if (selectedStatus === 'pending') {
                filtered = allTests.filter(test => test.status === 'pending');
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
