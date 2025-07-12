/**
 * SUPPLEMENT DELETE BUTTON FIX - NON-INTERFERING VERSION
 * ======================================================
 * Changes Activate buttons to Delete without breaking data loading
 * This version works AFTER the table is rendered, not before
 */

(function() {
    'use strict';
    
    console.log('🔧 Loading Non-Interfering Delete Button Fix...');
    
    // ========================================================================
    // SIMPLE BUTTON REPLACEMENT (NO RENDER OVERRIDE)
    // ========================================================================
    
    function replaceActivateButtonsWithDelete() {
        console.log('🔄 Replacing Activate buttons with Delete buttons...');
        
        // Find individual Activate buttons (not bulk actions)
        const activateButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
            const text = btn.textContent.trim();
            return text === '⚡ Activate' || (text.includes('Activate') && !text.includes('All') && !text.includes('Selected'));
        });
        
        console.log(`🔍 Found ${activateButtons.length} Activate buttons to replace`);
        
        activateButtons.forEach((button, index) => {
            const tableRow = button.closest('tr');
            if (tableRow) {
                // Find supplement ID from Edit button in same row
                const editButton = tableRow.querySelector('button[onclick*="editSupplementFinal"]');
                if (editButton) {
                    const onclickStr = editButton.getAttribute('onclick');
                    const idMatch = onclickStr?.match(/\((\d+)\)/);
                    if (idMatch) {
                        const supplementId = idMatch[1];
                        
                        // Replace the button
                        button.innerHTML = '🗑️ Delete';
                        button.className = 'btn btn-sm btn-danger';
                        button.title = 'Delete supplement';
                        button.removeAttribute('onclick');
                        button.onclick = null;
                        
                        // Add delete functionality
                        button.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteSupplementSafe(supplementId);
                        });
                        
                        console.log(`✅ Replaced button ${index + 1} for supplement ID ${supplementId}`);
                    }
                }
            }
        });
        
        return activateButtons.length;
    }
    
    // ========================================================================
    // SAFE DELETE FUNCTION
    // ========================================================================
    
    function deleteSupplementSafe(id) {
        console.log('🗑️ Safe delete for supplement ID:', id);
        
        // Find supplement name from table
        let supplementName = `Supplement ${id}`;
        const tableRows = document.querySelectorAll('#supplements-table-body tr');
        for (const row of tableRows) {
            const editButton = row.querySelector(`button[onclick*="editSupplementFinal"][onclick*="${id}"]`);
            if (editButton) {
                const nameCell = row.querySelector('td:first-child strong');
                if (nameCell) {
                    supplementName = nameCell.textContent.trim();
                    break;
                }
            }
        }
        
        // Confirmation
        if (!confirm(`⚠️ DELETE SUPPLEMENT\n\nName: "${supplementName}"\nID: ${id}\n\nThis action cannot be undone. Continue?`)) {
            return;
        }
        
        // Show loading
        if (typeof showAlert === 'function') {
            showAlert('🔄 Deleting supplement...', 'info');
        }
        
        // Make delete request
        fetch(`${API_BASE}/api/supplements/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(error => Promise.reject(error));
            }
        })
        .then(result => {
            console.log('✅ Delete successful:', result);
            
            if (typeof showAlert === 'function') {
                showAlert(`✅ "${supplementName}" deleted successfully!`, 'success');
            }
            
            // Update local data if available
            if (window.allSupplements) {
                window.allSupplements = window.allSupplements.filter(s => s.id != id);
            }
            if (window.filteredSupplements) {
                window.filteredSupplements = window.filteredSupplements.filter(s => s.id != id);
            }
            
            // Reload supplements using the original function
            if (typeof loadSupplements === 'function') {
                setTimeout(() => loadSupplements(), 500);
            }
        })
        .catch(error => {
            console.error('❌ Delete error:', error);
            const message = error.error || error.message || 'Unknown error';
            if (typeof showAlert === 'function') {
                showAlert(`❌ Failed to delete: ${message}`, 'error');
            } else {
                alert(`❌ Failed to delete: ${message}`);
            }
        });
    }
    
    // ========================================================================
    // MONITORING FOR NEW BUTTONS (LIGHT VERSION)
    // ========================================================================
    
    function setupLightMonitoring() {
        console.log('👁️ Setting up light monitoring...');
        
        // Monitor for table changes
        const observer = new MutationObserver(function(mutations) {
            let shouldCheck = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) {
                            // Only check if new content contains supplement table or buttons
                            if (node.id === 'supplements-table-body' || 
                                (node.querySelector && node.querySelector('#supplements-table-body')) ||
                                (node.textContent && node.textContent.includes('⚡ Activate'))) {
                                shouldCheck = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldCheck) {
                console.log('🔍 New supplement content detected, checking buttons...');
                setTimeout(replaceActivateButtonsWithDelete, 200);
            }
        });
        
        // Only observe the supplements section
        const supplementsSection = document.getElementById('supplements');
        if (supplementsSection) {
            observer.observe(supplementsSection, {
                childList: true,
                subtree: true
            });
            console.log('✅ Light monitoring active on supplements section');
        }
        
        return observer;
    }
    
    // ========================================================================
    // ENHANCED SECTION MONITORING
    // ========================================================================
    
    function monitorSupplementsSection() {
        console.log('📍 Setting up supplements section monitoring...');
        
        // Check when supplements section becomes active
        const checkSupplementsSection = () => {
            const supplementsSection = document.getElementById('supplements');
            if (supplementsSection && supplementsSection.classList.contains('active')) {
                // Wait a bit for content to load, then fix buttons
                setTimeout(() => {
                    const fixedCount = replaceActivateButtonsWithDelete();
                    if (fixedCount > 0) {
                        console.log(`🔄 Fixed ${fixedCount} buttons in active supplements section`);
                    }
                }, 300);
            }
        };
        
        // Check periodically (lighter than constant monitoring)
        setInterval(checkSupplementsSection, 2000);
        
        // Also check immediately if already active
        checkSupplementsSection();
    }
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    function initializeNonInterferingFix() {
        console.log('🚀 Initializing Non-Interfering Delete Button Fix...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeNonInterferingFix);
            return;
        }
        
        // Initial button replacement (if supplements already loaded)
        setTimeout(() => {
            const initialCount = replaceActivateButtonsWithDelete();
            if (initialCount > 0) {
                console.log(`🔧 Initially replaced ${initialCount} buttons`);
            }
        }, 1000);
        
        // Set up monitoring
        setupLightMonitoring();
        monitorSupplementsSection();
        
        console.log('✅ Non-Interfering Delete Button Fix initialized!');
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    // Expose functions for manual use
    window.SupplementDeleteFix = {
        replaceButtons: replaceActivateButtonsWithDelete,
        deleteSupplementSafe: deleteSupplementSafe,
        init: initializeNonInterferingFix
    };
    
    // Auto-initialize
    initializeNonInterferingFix();
    
    console.log('🔧 Non-Interfering Delete Button Fix loaded successfully!');
    console.log('💡 Manual function: SupplementDeleteFix.replaceButtons()');
    
})();