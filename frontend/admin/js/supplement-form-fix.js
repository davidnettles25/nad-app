/**
 * SUPPLEMENT FORM FIX
 * ===================
 * Permanent fix for supplement form save functionality
 * Handles multiple form instances and proper data extraction
 * 
 * Usage: Include this file after your main admin-dashboard.js
 * <script src="js/supplement-form-fix.js"></script>
 */

(function() {
    'use strict';
    
    console.log('🔧 Loading Supplement Form Fix...');
    
    // ========================================================================
    // ENHANCED SUPPLEMENT SAVE FUNCTION
    // ========================================================================
    
    function saveSupplementFormEnhanced() {
        console.log('💾 Enhanced supplement save initiated');
        
        try {
            // Find ALL supplement-related inputs on the page
            const allInputs = document.querySelectorAll('input, select, textarea');
            const supplementInputs = Array.from(allInputs).filter(input => 
                input.id && input.id.includes('supplement')
            );
            
            console.log('🔍 Found supplement inputs:', supplementInputs.length);
            
            // Find the visible ones (the active form)
            const visibleInputs = supplementInputs.filter(input => {
                // Check if element is visible and not in a hidden container
                return input.offsetParent !== null && 
                       input.style.display !== 'none' && 
                       !input.closest('[style*="display: none"]');
            });
            
            console.log('👁️ Visible supplement inputs:', visibleInputs.length);
            
            if (visibleInputs.length === 0) {
                console.warn('❌ No visible supplement form found');
                showAlert('❌ Please open the supplement form first', 'error');
                return;
            }
            
            // Extract data from visible inputs
            const formData = {};
            visibleInputs.forEach(input => {
                const key = input.id.replace('supplement-', '');
                formData[key] = input.type === 'checkbox' ? input.checked : input.value;
            });
            
            console.log('📝 Extracted form data:', formData);
            
            // Validate required fields
            const name = (formData.name || '').trim();
            const category = formData.category || '';
            
            if (!name) {
                console.warn('❌ Name validation failed');
                showAlert('❌ Please enter a supplement name', 'error');
                
                // Focus on the name field
                const nameField = visibleInputs.find(input => input.id.includes('name'));
                if (nameField) nameField.focus();
                return;
            }
            
            if (!category) {
                console.warn('❌ Category validation failed');
                showAlert('❌ Please select a category', 'error');
                
                // Focus on the category field
                const categoryField = visibleInputs.find(input => input.id.includes('category'));
                if (categoryField) categoryField.focus();
                return;
            }
            
            // Prepare supplement data
            const supplementData = {
                name: name,
                category: category,
                description: (formData.description || '').trim(),
                default_dose: formData.dose && formData.dose !== '' ? parseFloat(formData.dose) : null,
                unit: formData.unit || 'mg',
                is_active: formData.active !== false
            };
            
            console.log('🚀 Saving supplement:', supplementData);
            
            // Determine if this is an edit operation
            const isEdit = formData.id && formData.id !== '';
            const url = isEdit ? 
                `${API_BASE}/api/supplements/${formData.id}` : 
                `${API_BASE}/api/supplements`;
            const method = isEdit ? 'PUT' : 'POST';
            
            // Show loading state
            showAlert('🔄 Saving supplement...', 'info');
            
            // Make API call
            fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(supplementData)
            })
            .then(response => {
                console.log('📨 Response status:', response.status);
                if (!response.ok) {
                    return response.json().then(error => Promise.reject(error));
                }
                return response.json();
            })
            .then(result => {
                console.log('✅ Save successful:', result);
                showAlert(`✅ Supplement ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
                
                // Clear and hide form
                clearSupplementFormEnhanced();
                hideSupplementFormEnhanced();
                
                // Reload supplements list
                if (typeof loadSupplements === 'function') {
                    loadSupplements();
                }
            })
            .catch(error => {
                console.error('❌ Save error:', error);
                const message = error.error || error.message || 'Unknown error occurred';
                showAlert(`❌ Failed to save: ${message}`, 'error');
            });
            
        } catch (error) {
            console.error('❌ Unexpected error in save function:', error);
            showAlert('❌ An unexpected error occurred', 'error');
        }
    }
    
    // ========================================================================
    // ENHANCED FORM MANAGEMENT
    // ========================================================================
    
    function clearSupplementFormEnhanced() {
        console.log('🧹 Clearing supplement form...');
        
        const supplementInputs = document.querySelectorAll('[id*="supplement-"]');
        supplementInputs.forEach(input => {
            if (input.offsetParent !== null) { // Only clear visible inputs
                if (input.type === 'checkbox') {
                    input.checked = input.id.includes('active'); // Only 'active' should be checked by default
                } else if (input.tagName === 'SELECT') {
                    if (input.id.includes('unit')) {
                        input.value = 'mg';
                    } else {
                        input.selectedIndex = 0;
                    }
                } else if (input.type !== 'hidden') {
                    input.value = '';
                }
            }
        });
        
        console.log('✅ Form cleared');
    }
    
    function hideSupplementFormEnhanced() {
        console.log('🚪 Hiding supplement form...');
        
        // Hide modal if it exists
        const modal = document.getElementById('supplement-modal');
        if (modal) {
            modal.remove();
            console.log('✅ Modal removed');
        }
        
        // Hide form container if it exists
        const formContainer = document.getElementById('supplement-form-container');
        if (formContainer) {
            formContainer.style.display = 'none';
            console.log('✅ Form container hidden');
        }
        
        // Hide form if it exists
        const form = document.getElementById('supplement-form');
        if (form) {
            form.style.display = 'none';
            console.log('✅ Form hidden');
        }
    }
    
    // ========================================================================
    // BUTTON AND EVENT HANDLER FIXES
    // ========================================================================
    
    function fixSupplementButtons() {
        console.log('🔧 Fixing supplement buttons...');
        
        // Find and fix save buttons
        const saveButtons = [
            ...document.querySelectorAll('[id*="save-supplement"]'),
            ...document.querySelectorAll('button[onclick*="supplement"]'),
            ...document.querySelectorAll('button[type="submit"]')
        ].filter(btn => btn && (
            btn.textContent.toLowerCase().includes('save') ||
            btn.id.includes('save') ||
            btn.onclick?.toString().includes('supplement')
        ));
        
        saveButtons.forEach((btn, index) => {
            // Remove existing handlers
            btn.onclick = null;
            btn.removeAttribute('onclick');
            
            // Add our enhanced handler
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`💾 Enhanced save button ${index} clicked`);
                saveSupplementFormEnhanced();
                return false;
            });
        });
        
        console.log(`✅ Fixed ${saveButtons.length} save buttons`);
        
        // Fix form submit handlers
        const forms = document.querySelectorAll('form, #supplement-form');
        forms.forEach(form => {
            if (form.id === 'supplement-form' || 
                form.querySelector('[id*="supplement-"]')) {
                
                form.onsubmit = null;
                form.removeAttribute('onsubmit');
                
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('📝 Enhanced form submit intercepted');
                    saveSupplementFormEnhanced();
                    return false;
                });
            }
        });
        
        console.log('✅ Form submit handlers fixed');
    }
    
    // ========================================================================
    // DYNAMIC CONTENT MONITORING
    // ========================================================================
    
    function setupDynamicMonitoring() {
        console.log('👁️ Setting up dynamic content monitoring...');
        
        const observer = new MutationObserver(function(mutations) {
            let shouldCheckButtons = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            // Check if new supplement-related content was added
                            if ((node.id && node.id.includes('supplement')) ||
                                node.querySelector && node.querySelector('[id*="supplement-"]')) {
                                shouldCheckButtons = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldCheckButtons) {
                console.log('🔍 New supplement content detected, re-fixing buttons...');
                setTimeout(fixSupplementButtons, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Dynamic monitoring active');
        return observer;
    }
    
    // ========================================================================
    // GLOBAL FUNCTION OVERRIDES
    // ========================================================================
    
    function overrideGlobalFunctions() {
        console.log('🔄 Overriding global supplement functions...');
        
        // Override all possible save function names
        const saveOverrides = [
            'saveSupplementForm',
            'saveSupplementData',
            'saveSupplementFormDebug',
            'saveSupplementDataWithDebug',
            'saveSupplementFormExisting',
            'saveSupplementFormFixed'
        ];
        
        saveOverrides.forEach(funcName => {
            window[funcName] = saveSupplementFormEnhanced;
        });
        
        // Override clear function
        window.clearSupplementForm = clearSupplementFormEnhanced;
        
        // Override hide function  
        window.hideSupplementForm = hideSupplementFormEnhanced;
        
        console.log(`✅ Overridden ${saveOverrides.length + 2} functions`);
    }
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    function initializeSupplementFix() {
        console.log('🚀 Initializing Supplement Form Fix...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeSupplementFix);
            return;
        }
        
        try {
            // Apply all fixes
            overrideGlobalFunctions();
            
            // Initial button fix
            setTimeout(() => {
                fixSupplementButtons();
                setupDynamicMonitoring();
            }, 100);
            
            // Additional fix after potential dynamic content loads
            setTimeout(() => {
                fixSupplementButtons();
            }, 1000);
            
            console.log('✅ Supplement Form Fix initialized successfully!');
            
        } catch (error) {
            console.error('❌ Error initializing supplement fix:', error);
        }
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    // Expose functions for manual troubleshooting
    window.SupplementFormFix = {
        save: saveSupplementFormEnhanced,
        clear: clearSupplementFormEnhanced,
        hide: hideSupplementFormEnhanced,
        fixButtons: fixSupplementButtons,
        init: initializeSupplementFix
    };
    
    // Auto-initialize
    initializeSupplementFix();
    
    console.log('🔧 Supplement Form Fix loaded successfully!');
    console.log('💡 Troubleshooting: window.SupplementFormFix contains manual functions');
    
})();