/**
 * Test Management Dropdown Fix
 * Fixes the status filter dropdown functionality
 */

// Loading Test Management Dropdown Fix

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initializeDropdownFix();
});

function initializeDropdownFix() {
    // Initialize dropdown fix
    
    // Setup status filter dropdown
    setupStatusFilter();
    
    // Setup search input (if exists)
    setupSearchInput();
    
    // Dropdown fix initialization complete
}

function setupStatusFilter() {
    const statusFilter = document.getElementById('status-filter');
    
    if (!statusFilter) {
        return;
    }
    
    // Status filter dropdown found
    
    // Remove any existing event listeners by cloning the element
    const newStatusFilter = statusFilter.cloneNode(true);
    statusFilter.parentNode.replaceChild(newStatusFilter, statusFilter);
    
    // Add the change event listener
    newStatusFilter.addEventListener('change', function(e) {
        const selectedStatus = e.target.value;
        
        handleStatusFilter(selectedStatus);
    });
    
    // Status filter event listener attached
}

function setupSearchInput() {
    const searchInput = document.getElementById('test-search');
    
    if (!searchInput) {
        return;
    }
    
    // Search input found
    
    // Remove existing listeners by cloning
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    // Add debounced search listener
    let searchTimeout;
    newSearchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            handleSearchFilter(searchTerm);
        }, 300); // 300ms debounce
    });
    
    // Search input event listener attached
}

function handleStatusFilter(status) {
    // Apply status filter
    
    // Get tests data from global variable
    const allTests = window.allTests || window.filteredTests || [];
    
    if (allTests.length === 0) {
        return;
    }
    
    let filtered = [...allTests];
    
    // Apply status filter
    if (status === 'activated') {
        filtered = allTests.filter(test => test.status === 'activated');
    } else if (status === 'pending') {
        filtered = allTests.filter(test => test.status === 'pending');
    } else if (status === 'completed') {
        filtered = allTests.filter(test => test.status === 'completed');
    }
    
    // Update the display
    updateTestsDisplay(filtered, `Status: ${status || 'All'}`);
}

function handleSearchFilter(searchTerm) {
    // Apply search filter
    
    const allTests = window.allTests || window.filteredTests || [];
    
    if (allTests.length === 0) {
        return;
    }
    
    let filtered = [...allTests];
    
    if (searchTerm) {
        filtered = allTests.filter(test => {
            return (
                (test.test_id && test.test_id.toLowerCase().includes(searchTerm)) ||
                (test.customer_id && test.customer_id.toLowerCase().includes(searchTerm)) ||
                (test.batch_id && test.batch_id.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    // Update the display
    updateTestsDisplay(filtered, `Search: "${searchTerm}"`);
}

function updateTestsDisplay(filteredTests, filterDescription) {
    // Update tests display
    
    // Try to call the existing render function
    if (typeof renderTestsTable === 'function') {
        renderTestsTable(filteredTests);
    } else if (typeof window.renderTestsTable === 'function') {
        window.renderTestsTable(filteredTests);
    } else {
        // Fallback: try to update table directly
        updateTableDirectly(filteredTests);
    }
    
    // Show user feedback
    if (typeof showAlert === 'function') {
        showAlert(`${filterDescription}: ${filteredTests.length} tests shown`, 'info');
    }
    
    // Update global filtered tests
    window.filteredTests = filteredTests;
}

function updateTableDirectly(tests) {
    // Attempt direct table update
    
    const tbody = document.getElementById('tests-table-body');
    if (!tbody) {
        return;
    }
    
    if (tests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div>No tests match the current filter</div>
                    <button onclick="clearFilters()" style="margin-top: 10px;">Clear Filters</button>
                </td>
            </tr>
        `;
        return;
    }
    
    // Basic table rendering (fallback)
    tbody.innerHTML = tests.map(test => `
        <tr>
            <td><strong>${test.test_id || 'N/A'}</strong></td>
            <td>
                <span class="status-badge status-${test.status || 'pending'}">
                    ${test.status ? test.status.charAt(0).toUpperCase() + test.status.slice(1) : 'Pending'}
                </span>
            </td>
            <td>${test.customer_id || 'N/A'}</td>
            <td>${test.batch_id || 'N/A'}</td>
            <td>${test.created_date ? new Date(test.created_date).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button onclick="viewTest('${test.test_id}')" class="btn btn-sm">View</button>
            </td>
        </tr>
    `).join('');
    
    // Table updated directly
}

// Global functions for external access
window.initializeDropdownFix = initializeDropdownFix;
window.handleStatusFilter = handleStatusFilter;
window.handleSearchFilter = handleSearchFilter;

// Dropdown fix module loaded
