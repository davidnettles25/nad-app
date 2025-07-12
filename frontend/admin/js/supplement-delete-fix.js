/**
 * SUPPLEMENT ACTIVATE BUTTON TO DELETE FIX
 * =========================================
 * Changes the Activate/Deactivate button to be Delete button
 * Updates the supplement table rendering and button actions
 */

(function() {
    'use strict';
    
    console.log('🔄 Loading Activate → Delete Button Fix...');
    
    // ========================================================================
    // ENHANCED SUPPLEMENT TABLE RENDERING WITH DELETE BUTTON
    // ========================================================================
    
    function renderSupplementsTableWithDelete() {
        console.log('🔄 Rendering supplements table with Delete button...');
        
        const tbody = document.getElementById('supplements-table-body');
        if (!tbody) {
            console.warn('❌ Supplements table body not found');
            return;
        }
        
        if (!window.allSupplements || !Array.isArray(window.allSupplements)) {
            console.warn('❌ No supplements data available');
            tbody.innerHTML = '<tr><td colspan="5">No supplements available</td></tr>';
            return;
        }
        
        tbody.innerHTML = ''; // Clear existing content
        
        const supplements = window.filteredSupplements || window.allSupplements;
        
        supplements.forEach(supplement => {
            const row = document.createElement('tr');
            row.className = supplement.is_active ? 'supplement-active' : 'supplement-inactive';
            
            const dose = supplement.default_dose ? 
                supplement.default_dose + ' ' + (supplement.unit || 'mg') : 
                'Not set';
            
            row.innerHTML = `
                <td>
                    <strong>${supplement.name}</strong>
                    ${supplement.description ? `<br><small class="text-muted">${supplement.description}</small>` : ''}
                </td>
                <td>${supplement.category || 'Other'}</td>
                <td>${dose}</td>
                <td>
                    <span class="status-badge ${supplement.is_active ? 'status-active' : 'status-inactive'}">
                        ${supplement.is_active ? '✅ Active' : '❌ Inactive'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-primary" onclick="editSupplement(${supplement.id})" title="Edit supplement">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteSupplement(${supplement.id})" title="Delete supplement">
                        🗑️ Delete
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        console.log(`✅ Rendered ${supplements.length} supplements with Delete buttons`);
    }
    
    // ========================================================================
    // DELETE SUPPLEMENT FUNCTION WITH CONFIRMATION
    // ========================================================================
    
    async function confirmDeleteSupplement(id) {
        console.log('🗑️ Delete supplement requested for ID:', id);
        
        if (!window.allSupplements) {
            console.error('❌ No supplements data available');
            showAlert('❌ Unable to find supplement data', 'error');
            return;
        }
        
        const supplement = window.allSupplements.find(s => s.id == id);
        if (!supplement) {
            console.error('❌ Supplement not found with ID:', id);
            showAlert('❌ Supplement not found', 'error');
            return;
        }
        
        // Enhanced confirmation dialog
        const confirmMessage = `⚠️ DELETE SUPPLEMENT
        
Name: "${supplement.name}"
Category: ${supplement.category || 'Other'}
Status: ${supplement.is_active ? 'Active' : 'Inactive'}

This action cannot be undone and will remove:
• The supplement from the system
• All associated test data and results
• Any customer supplement histories

Are you sure you want to permanently delete this supplement?`;
        
        if (!confirm(confirmMessage)) {
            console.log('❌ Delete cancelled by user');
            return;
        }
        
        // Show loading state
        showAlert('🔄 Deleting supplement...', 'info');
        
        try {
            console.log('🌐 Making DELETE request for supplement:', supplement.name);
            
            const response = await fetch(`${API_BASE}/api/supplements/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📨 Delete response status:', response.status);
            
            const result = await response.json();
            console.log('📨 Delete response data:', result);
            
            if (response.ok && result.success) {
                console.log('✅ Supplement deleted successfully');
                showAlert(`✅ Supplement "${supplement.name}" deleted successfully!`, 'success');
                
                // Remove from local data
                if (window.allSupplements) {
                    window.allSupplements = window.allSupplements.filter(s => s.id != id);
                }
                if (window.filteredSupplements) {
                    window.filteredSupplements = window.filteredSupplements.filter(s => s.id != id);
                }
                
                // Update any selected supplements
                if (window.selectedSupplements && window.selectedSupplements.has) {
                    window.selectedSupplements.delete(id);
                }
                
                // Re-render the table
                renderSupplementsTableWithDelete();
                
                // Update stats if function exists
                if (typeof updateSupplementStats === 'function') {
                    updateSupplementStats(window.allSupplements);
                }
                
                // Reload supplements from server to ensure sync
                if (typeof loadSupplements === 'function') {
                    setTimeout(() => loadSupplements(), 1000);
                }
                
            } else {
                throw new Error(result.error || result.message || 'Failed to delete supplement');
            }
            
        } catch (error) {
            console.error('❌ Error deleting supplement:', error);
            const errorMessage = error.message || 'Unknown error occurred';
            showAlert(`❌ Failed to delete supplement: ${errorMessage}`, 'error');
        }
    }
    
    // ========================================================================
    // OVERRIDE EXISTING RENDER FUNCTIONS
    // ========================================================================
    
    function overrideSupplementRenderFunctions() {
        console.log('🔄 Overriding supplement render functions...');
        
        // Override the main render function
        if (window.renderSupplementsTable) {
            window.renderSupplementsTable = renderSupplementsTableWithDelete;
            console.log('✅ Overridden renderSupplementsTable');
        }
        
        // Override alternative render function names
        const renderFunctionNames = [
            'renderSupplements',
            'displaySupplements',
            'showSupplements',
            'updateSupplementsDisplay'
        ];
        
        renderFunctionNames.forEach(funcName => {
            if (window[funcName]) {
                window[funcName] = renderSupplementsTableWithDelete;
                console.log(`✅ Overridden ${funcName}`);
            }
        });
        
        // Add the delete function globally
        window.confirmDeleteSupplement = confirmDeleteSupplement;
        window.deleteSupplement = confirmDeleteSupplement; // Alias
        
        console.log('✅ Delete function added globally');
    }
    
    // ========================================================================
    // REMOVE EXISTING ACTIVATE/DEACTIVATE BUTTONS
    // ========================================================================
    
    function removeActivateButtons() {
        console.log('🔄 Removing existing activate/deactivate buttons...');
        
        // Find and remove activate/deactivate buttons
        const activateButtons = document.querySelectorAll('button[onclick*="activate"], button[onclick*="deactivate"]');
        activateButtons.forEach(button => {
            if (button.textContent.includes('Activate') || button.textContent.includes('Deactivate')) {
                console.log('🗑️ Removing activate/deactivate button:', button.textContent);
                button.remove();
            }
        });
        
        // Remove activate/deactivate functions from global scope
        if (window.activateSupplement) {
            delete window.activateSupplement;
            console.log('✅ Removed activateSupplement function');
        }
        
        if (window.deactivateSupplement) {
            delete window.deactivateSupplement;
            console.log('✅ Removed deactivateSupplement function');
        }
        
        if (window.toggleSupplementStatus) {
            delete window.toggleSupplementStatus;
            console.log('✅ Removed toggleSupplementStatus function');
        }
    }
    
    // ========================================================================
    // UPDATE CSS FOR BETTER DELETE BUTTON STYLING
    // ========================================================================
    
    function addDeleteButtonStyles() {
        console.log('🎨 Adding enhanced delete button styles...');
        
        const style = document.createElement('style');
        style.textContent = `
            /* Enhanced supplement table styles */
            .supplement-active {
                background-color: #f8f9fa;
            }
            
            .supplement-inactive {
                background-color: #fff3cd;
                opacity: 0.8;
            }
            
            .status-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.875em;
                font-weight: 500;
            }
            
            .status-active {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .status-inactive {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .actions-cell {
                white-space: nowrap;
            }
            
            .actions-cell .btn {
                margin-right: 5px;
            }
            
            .btn-danger {
                background-color: #dc3545;
                border-color: #dc3545;
                color: white;
            }
            
            .btn-danger:hover {
                background-color: #c82333;
                border-color: #bd2130;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
            }
            
            .btn-danger:active {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
            }
        `;
        
        document.head.appendChild(style);
        console.log('✅ Delete button styles added');
    }
    
    // ========================================================================
    // INITIALIZATION AND MONITORING
    // ========================================================================
    
    function initializeDeleteButtonFix() {
        console.log('🚀 Initializing Delete Button Fix...');
        
        // Apply overrides immediately
        overrideSupplementRenderFunctions();
        addDeleteButtonStyles();
        
        // Remove existing activate buttons after a short delay
        setTimeout(() => {
            removeActivateButtons();
            
            // Re-render the table if supplements are already loaded
            if (window.allSupplements && window.allSupplements.length > 0) {
                renderSupplementsTableWithDelete();
            }
        }, 500);
        
        // Set up observer for dynamic content
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.querySelector) {
                            // Check for new activate buttons and remove them
                            const newActivateButtons = node.querySelectorAll('button[onclick*="activate"]');
                            newActivateButtons.forEach(btn => {
                                if (btn.textContent.includes('Activate')) {
                                    btn.remove();
                                }
                            });
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Delete Button Fix initialized successfully!');
    }
    
    // ========================================================================
    // PUBLIC API AND EXECUTION
    // ========================================================================
    
    // Expose functions for debugging
    window.SupplementDeleteFix = {
        render: renderSupplementsTableWithDelete,
        delete: confirmDeleteSupplement,
        removeActivateButtons: removeActivateButtons,
        init: initializeDeleteButtonFix
    };
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDeleteButtonFix);
    } else {
        initializeDeleteButtonFix();
    }
    
    console.log('🔄 Activate → Delete Button Fix loaded successfully!');
    console.log('💡 Debug: window.SupplementDeleteFix contains manual functions');
    
})();