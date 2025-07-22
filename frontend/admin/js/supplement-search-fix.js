/**
 * SUPPLEMENT SEARCH FIX - PERMANENT VERSION
 * ========================================
 * Direct table search with proper timing and monitoring
 */

(function() {
    'use strict';
    
    // Loading Supplement Search Fix
    
    let searchSetupComplete = false;
    
    // ========================================================================
    // DIRECT TABLE SEARCH FUNCTION
    // ========================================================================
    
    function createDirectTableSearch() {
        // Create direct table search function
        
        window.filterSupplements = function() {
            // Filter table rows
            
            const searchInput = document.getElementById('supplement-search');
            if (!searchInput) {
                return;
            }
            
            const searchTerm = searchInput.value.toLowerCase().trim();
            
            const tbody = document.getElementById('supplements-table-body');
            if (!tbody) {
                return;
            }
            
            const rows = tbody.querySelectorAll('tr');
            let visibleCount = 0;
            let hiddenCount = 0;
            
            rows.forEach((row, index) => {
                const hasButtons = row.querySelector('button');
                if (!hasButtons) return;
                
                const nameCell = row.querySelector('td:first-child strong');
                if (!nameCell) return;
                
                const name = nameCell.textContent.toLowerCase().trim();
                const descriptionCell = row.querySelector('td:first-child small');
                const description = descriptionCell ? descriptionCell.textContent.toLowerCase().trim() : '';
                const categoryCell = row.querySelector('td:nth-child(2)');
                const category = categoryCell ? categoryCell.textContent.toLowerCase().trim() : '';
                
                const matches = searchTerm === '' || 
                               name.includes(searchTerm) || 
                               description.includes(searchTerm) || 
                               category.includes(searchTerm);
                
                if (matches) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                    hiddenCount++;
                }
            });
            
            // Search complete
            showNoResultsMessage(tbody, visibleCount, searchTerm);
        };
        
        // Clear search function
        window.clearSupplementSearch = function() {
            // Clear supplement search
            
            const searchInput = document.getElementById('supplement-search');
            if (searchInput) {
                searchInput.value = '';
            }
            
            const tbody = document.getElementById('supplements-table-body');
            if (tbody) {
                const rows = tbody.querySelectorAll('tr');
                rows.forEach(row => row.style.display = '');
                
                const noResultsMessage = tbody.querySelector('.no-search-results');
                if (noResultsMessage) {
                    noResultsMessage.remove();
                }
            }
        };
        
        // Search functions created
    }
    
    function showNoResultsMessage(tbody, visibleCount, searchTerm) {
        const existingMessage = tbody.querySelector('.no-search-results');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        if (visibleCount === 0 && searchTerm !== '') {
            const noResultsRow = document.createElement('tr');
            noResultsRow.className = 'no-search-results';
            noResultsRow.innerHTML = `
                <td colspan="5" style="text-align: center; padding: 30px; color: #666;">
                    <div style="font-size: 18px; margin-bottom: 10px;">🔍</div>
                    <div style="font-weight: 600; margin-bottom: 5px;">No supplements found</div>
                    <div style="font-size: 14px;">No supplements match "${searchTerm}"</div>
                    <button onclick="clearSupplementSearch()" style="margin-top: 10px; padding: 5px 15px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 4px; cursor: pointer;">
                        Clear Search
                    </button>
                </td>
            `;
            tbody.appendChild(noResultsRow);
        }
    }
    
    // ========================================================================
    // SEARCH INPUT SETUP WITH PROPER EVENT BINDING
    // ========================================================================
    
    function setupSearchInput() {
        // Set up search input
        
        const searchInput = document.getElementById('supplement-search');
        if (!searchInput) {
            return false;
        }
        
        // Remove any existing inline event handlers
        searchInput.removeAttribute('onkeyup');
        searchInput.removeAttribute('oninput');
        searchInput.removeAttribute('onchange');
        
        // Clone the input to remove all event listeners
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        // Add our event listener with debouncing
        let searchTimeout;
        newSearchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (typeof filterSupplements === 'function') {
                    filterSupplements();
                }
            }, 300);
        });
        
        // Handle Enter key
        newSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (typeof filterSupplements === 'function') {
                    filterSupplements();
                }
            }
        });
        
        // Search input event listeners added
        return true;
    }
    
    // ========================================================================
    // MONITORING AND WAITING FOR ELEMENTS
    // ========================================================================
    
    function waitForSearchInput() {
        // Wait for search input to appear
        
        const checkForInput = () => {
            const searchInput = document.getElementById('supplement-search');
            const supplementsSection = document.getElementById('supplements');
            
            if (searchInput && supplementsSection) {
                if (!searchSetupComplete) {
                    const success = setupSearchInput();
                    if (success) {
                        searchSetupComplete = true;
                    }
                }
                return true;
            }
            return false;
        };
        
        // Check immediately
        if (checkForInput()) {
            return;
        }
        
        // Set up interval to check periodically
        const checkInterval = setInterval(() => {
            if (checkForInput()) {
                clearInterval(checkInterval);
            }
        }, 500);
        
        // Stop checking after 30 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 30000);
    }
    
    function monitorSectionChanges() {
        // Monitor for supplements section activation
        
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' || mutation.type === 'childList') {
                    const supplementsSection = document.getElementById('supplements');
                    if (supplementsSection && 
                        (supplementsSection.style.display !== 'none' || 
                         supplementsSection.classList.contains('active'))) {
                        
                        if (!searchSetupComplete) {
                            setTimeout(() => {
                                const searchInput = document.getElementById('supplement-search');
                                if (searchInput && !searchSetupComplete) {
                                    setupSearchInput();
                                    searchSetupComplete = true;
                                }
                            }, 200);
                        }
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        // Section change monitoring active
    }
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    function initializeSearchFix() {
        // Initialize Supplement Search Fix
        
        // Create the search functions first
        createDirectTableSearch();
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                waitForSearchInput();
                monitorSectionChanges();
            });
        } else {
            // DOM is already ready
            waitForSearchInput();
            monitorSectionChanges();
        }
        
        // Search fix initialization complete
    }
    
    // ========================================================================
    // EXECUTION
    // ========================================================================
    
    // Initialize immediately
    initializeSearchFix();
    
    // Make functions globally available for debugging
    window.SupplementSearchFix = {
        setup: setupSearchInput,
        filter: () => typeof filterSupplements === 'function' ? filterSupplements() : null,
        clear: () => typeof clearSupplementSearch === 'function' ? clearSupplementSearch() : null
    };
    
    // Supplement Search Fix loaded
    
})();