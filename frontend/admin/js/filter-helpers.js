/**
 * Filter Helper Functions
 * Additional helper functions for filter management
 */

function clearFilters() {
    console.log('🗑️ Clearing all filters...');
    
    // Clear search input
    const searchInput = document.getElementById('test-search');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Clear status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.value = '';
    }
    
    // Reset to show all tests
    const allTests = window.allTests || [];
    if (allTests.length > 0) {
        if (typeof renderTestsTable === 'function') {
            renderTestsTable(allTests);
        }
        window.filteredTests = [...allTests];
    }
    
    // Show feedback
    if (typeof showAlert === 'function') {
        showAlert('✅ Filters cleared - showing all tests', 'success');
    }
    
    console.log('✅ Filters cleared');
}

function refreshTests() {
    console.log('🔄 Refreshing tests...');
    
    if (typeof loadTestsFromAPI === 'function') {
        loadTestsFromAPI();
    } else {
        console.warn('⚠️ loadTestsFromAPI function not found');
    }
}

// Make functions globally available
window.clearFilters = clearFilters;
window.refreshTests = refreshTests;
