/**
 * Test Management Dropdown Fix
 * Fixes the status filter dropdown functionality
 */

console.log('🔧 Loading Test Management Dropdown Fix...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initializeDropdownFix();
});

function initializeDropdownFix() {
    console.log('🧪 Initializing dropdown fix...');
    
    // Setup status filter dropdown
    setupStatusFilter();
    
    // Setup search input (if exists)
    setupSearchInput();
    
    console.log('✅ Dropdown fix initialization complete');
}

function setupStatusFilter() {
    const statusFilter = document.getElementById('status-filter');
    
    if (!statusFilter) {
        console.error('❌ Status filter dropdown not found (#status-filter)');
        return;
    }
    
    console.log('✅ Status filter dropdown found');
    
    // Remove any existing event listeners by cloning the element
    const newStatusFilter = statusFilter.cloneNode(true);
    statusFilter.parentNode.replaceChild(newStatusFilter, statusFilter);
    
    // Add the change event listener
    newStatusFilter.addEventListener('change', function(e) {
        const selectedStatus = e.target.value;
        console.log('📋 Status filter changed to:', selectedStatus || 'All');
        
        handleStatusFilter(selectedStatus);
    });
    
    console.log('✅ Status filter event listener attached');
}

function setupSearchInput() {
    const searchInput = document.getElementById('test-search');
    
    if (!searchInput) {
        console.warn('⚠️ Search input not found (#test-search)');
        return;
    }
    
    console.log('✅ Search input found');
    
    // Remove existing listeners by cloning
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    // Add debounced search listener
    let searchTimeout;
    newSearchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();
            console.log('🔍 Search term:', searchTerm || '(empty)');
            
            handleSearchFilter(searchTerm);
        }, 300); // 300ms debounce
    });
    
    console.log('✅ Search input event listener attached');
}

function handleStatusFilter(status) {
    console.log('🔽 Applying status filter:', status);
    
    // Get tests data from global variable
    const allTests = window.allTests || window.filteredTests || [];
    
    if (allTests.length === 0) {
        console.warn('⚠️ No tests data available. Make sure tests are loaded first.');
        return;
    }
    
    let filtered = [...allTests];
    
    // Apply status filter
    if (status === 'activated') {
        filtered = allTests.filter(test => test.is_activated === true || test.is_activated === 1);
        console.log(`📊 Filtered to activated tests: ${filtered.length} of ${allTests.length}`);
    } else if (status === 'pending') {
        filtered = allTests.filter(test => test.is_activated === false || test.is_activated === 0);
        console.log(`📊 Filtered to pending tests: ${filtered.length} of ${allTests.length}`);
    } else {
        console.log(`📊 Showing all tests: ${filtered.length}`);
    }
    
    // Update the display
    updateTestsDisplay(filtered, `Status: ${status || 'All'}`);
}

function handleSearchFilter(searchTerm) {
    console.log('🔍 Applying search filter:', searchTerm);
    
    const allTests = window.allTests || window.filteredTests || [];
    
    if (allTests.length === 0) {
        console.warn('⚠️ No tests data available for search');
        return;
    }
    
    let filtered = [...allTests];
    
    if (searchTerm) {
        filtered = allTests.filter(test => {
            return (
                (test.test_id && test.test_id.toLowerCase().includes(searchTerm)) ||
                (test.customer_id && test.customer_id.toString().toLowerCase().includes(searchTerm)) ||
                (test.order_id && test.order_id.toString().toLowerCase().includes(searchTerm)) ||
                (test.batch_id && test.batch_id.toLowerCase().includes(searchTerm))
            );
        });
        console.log(`📊 Search results: ${filtered.length} of ${allTests.length} tests`);
    } else {
        console.log(`📊 Showing all tests: ${filtered.length}`);
    }
    
    // Update the display
    updateTestsDisplay(filtered, `Search: "${searchTerm}"`);
}

function updateTestsDisplay(filteredTests, filterDescription) {
    console.log('🔄 Updating tests display...', filterDescription);
    
    // Try to call the existing render function
    if (typeof renderTestsTable === 'function') {
        renderTestsTable(filteredTests);
        console.log('✅ Called renderTestsTable()');
    } else if (typeof window.renderTestsTable === 'function') {
        window.renderTestsTable(filteredTests);
        console.log('✅ Called window.renderTestsTable()');
    } else {
        console.warn('⚠️ renderTestsTable function not found');
        
        // Fallback: try to update table directly
        updateTableDirectly(filteredTests);
    }
    
    // Show user feedback
    if (typeof showAlert === 'function') {
        showAlert(`🔍 ${filterDescription}: ${filteredTests.length} tests shown`, 'info');
    } else {
        console.log(`📊 ${filterDescription}: ${filteredTests.length} tests shown`);
    }
    
    // Update global filtered tests
    window.filteredTests = filteredTests;
}

function updateTableDirectly(tests) {
    console.log('🔄 Attempting direct table update...');
    
    const tbody = document.getElementById('tests-table-body');
    if (!tbody) {
        console.error('❌ Table body not found (#tests-table-body)');
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
                <span class="status-badge ${test.is_activated ? 'status-activated' : 'status-pending'}">
                    ${test.is_activated ? 'Activated' : 'Pending'}
                </span>
            </td>
            <td>${test.customer_id || 'N/A'}</td>
            <td>${test.order_id || 'N/A'}</td>
            <td>${test.batch_id || 'N/A'}</td>
            <td>${test.created_date ? new Date(test.created_date).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button onclick="viewTest('${test.test_id}')" class="btn btn-sm">View</button>
            </td>
        </tr>
    `).join('');
    
    console.log('✅ Table updated directly');
}

// Global functions for external access
window.initializeDropdownFix = initializeDropdownFix;
window.handleStatusFilter = handleStatusFilter;
window.handleSearchFilter = handleSearchFilter;

console.log('✅ Dropdown fix module loaded');
