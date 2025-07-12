/**
 * DIRECT TABLE SEARCH - NO DATA DEPENDENCIES
 * ==========================================
 * Searches directly in the rendered table without needing global data variables
 */

function createDirectTableSearch() {
    console.log('🔍 Creating direct table search...');
    
    // Create the search function that works directly on table rows
    window.filterSupplements = function() {
        console.log('🔍 DIRECT SEARCH: Filtering table rows...');
        
        // Get search term
        const searchInput = document.getElementById('supplement-search');
        if (!searchInput) {
            console.warn('❌ Search input not found');
            return;
        }
        
        const searchTerm = searchInput.value.toLowerCase().trim();
        console.log('🔍 Search term:', `"${searchTerm}"`);
        
        // Get table body
        const tbody = document.getElementById('supplements-table-body');
        if (!tbody) {
            console.warn('❌ Table body not found');
            return;
        }
        
        // Get all table rows
        const rows = tbody.querySelectorAll('tr');
        console.log(`📋 Found ${rows.length} table rows`);
        
        if (rows.length === 0) {
            console.warn('❌ No table rows found');
            return;
        }
        
        let visibleCount = 0;
        let hiddenCount = 0;
        
        // Filter each row
        rows.forEach((row, index) => {
            // Skip empty state rows or header-like content
            const hasButtons = row.querySelector('button');
            if (!hasButtons) {
                console.log(`  Row ${index}: Skipping (no buttons - likely empty state)`);
                return;
            }
            
            // Get text content from the row
            const nameCell = row.querySelector('td:first-child strong');
            const descriptionCell = row.querySelector('td:first-child small');
            const categoryCell = row.querySelector('td:nth-child(2)');
            
            if (!nameCell) {
                console.log(`  Row ${index}: Skipping (no name cell)`);
                return;
            }
            
            // Extract searchable text
            const name = nameCell.textContent.toLowerCase().trim();
            const description = descriptionCell ? descriptionCell.textContent.toLowerCase().trim() : '';
            const category = categoryCell ? categoryCell.textContent.toLowerCase().trim() : '';
            
            console.log(`  Row ${index}: "${name}" | "${description}" | "${category}"`);
            
            // Check if row matches search
            const matches = searchTerm === '' || 
                           name.includes(searchTerm) || 
                           description.includes(searchTerm) || 
                           category.includes(searchTerm);
            
            // Show or hide the row
            if (matches) {
                row.style.display = '';
                visibleCount++;
                console.log(`    ✅ MATCH: Showing row`);
            } else {
                row.style.display = 'none';
                hiddenCount++;
                console.log(`    ❌ NO MATCH: Hiding row`);
            }
        });
        
        console.log(`✅ Search complete: ${visibleCount} visible, ${hiddenCount} hidden`);
        
        // Show "no results" message if needed
        showNoResultsMessage(visibleCount, searchTerm);
        
        // Update any count displays
        updateSearchResultsCount(visibleCount);
    };
    
    console.log('✅ Direct table search function created');
}

function showNoResultsMessage(visibleCount, searchTerm) {
    const tbody = document.getElementById('supplements-table-body');
    if (!tbody) return;
    
    // Remove any existing "no results" message
    const existingMessage = tbody.querySelector('.no-search-results');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Add "no results" message if needed
    if (visibleCount === 0 && searchTerm !== '') {
        const noResultsRow = document.createElement('tr');
        noResultsRow.className = 'no-search-results';
        noResultsRow.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 30px; color: #666;">
                <div style="font-size: 18px; margin-bottom: 10px;">🔍</div>
                <div style="font-weight: 600; margin-bottom: 5px;">No supplements found</div>
                <div style="font-size: 14px;">No supplements match "${searchTerm}"</div>
                <button onclick="clearSearch()" style="margin-top: 10px; padding: 5px 15px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 4px; cursor: pointer;">
                    Clear Search
                </button>
            </td>
        `;
        tbody.appendChild(noResultsRow);
    }
}

function updateSearchResultsCount(count) {
    // Look for any element that might show the count
    const countElements = [
        document.getElementById('supplements-count'),
        document.querySelector('.supplements-count'),
        document.querySelector('[class*="count"]')
    ].filter(el => el);
    
    countElements.forEach(element => {
        const originalText = element.textContent;
        if (originalText.includes('supplement')) {
            element.textContent = `${count} supplement${count !== 1 ? 's' : ''} shown`;
        }
    });
}

function clearSearch() {
    console.log('🧹 Clearing search...');
    
    const searchInput = document.getElementById('supplement-search');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Show all rows
    const tbody = document.getElementById('supplements-table-body');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            row.style.display = '';
        });
        
        // Remove "no results" message
        const noResultsMessage = tbody.querySelector('.no-search-results');
        if (noResultsMessage) {
            noResultsMessage.remove();
        }
    }
    
    console.log('✅ Search cleared');
}

function setupDirectSearch() {
    console.log('🔧 Setting up direct search...');
    
    const searchInput = document.getElementById('supplement-search');
    if (!searchInput) {
        console.warn('❌ Search input not found');
        return false;
    }
    
    console.log('✅ Found search input:', searchInput.placeholder);
    
    // Remove any existing event listeners
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    // Add our event listener with debouncing
    let searchTimeout;
    newSearchInput.addEventListener('input', function() {
        console.log('🔍 Search input detected:', this.value);
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterSupplements();
        }, 300);
    });
    
    // Also handle Enter key
    newSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            filterSupplements();
        }
    });
    
    console.log('✅ Direct search input setup complete');
    return true;
}

function testDirectSearch() {
    console.log('🧪 Testing direct search...');
    
    // Check table structure
    const tbody = document.getElementById('supplements-table-body');
    if (!tbody) {
        console.error('❌ Cannot test - table body not found');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    console.log(`📋 Table has ${rows.length} rows`);
    
    if (rows.length === 0) {
        console.warn('⚠️ No table rows to search');
        return;
    }
    
    // Show details of first few rows
    Array.from(rows).slice(0, 3).forEach((row, index) => {
        const nameCell = row.querySelector('td:first-child strong');
        const hasButtons = row.querySelector('button');
        
        console.log(`📝 Row ${index}:`, {
            hasName: !!nameCell,
            name: nameCell?.textContent || 'N/A',
            hasButtons: !!hasButtons,
            visible: row.style.display !== 'none'
        });
    });
    
    // Test the search function
    if (typeof filterSupplements === 'function') {
        console.log('✅ filterSupplements function exists');
        
        // Test with empty search (should show all)
        filterSupplements();
    } else {
        console.error('❌ filterSupplements function not found');
    }
}

// ========================================================================
// EXECUTION
// ========================================================================

console.log('🚀 SETTING UP DIRECT TABLE SEARCH...');

// Create the search function
createDirectTableSearch();

// Make clearSearch globally available
window.clearSearch = clearSearch;

// Setup the search input
const setupSuccess = setupDirectSearch();

if (setupSuccess) {
    // Test the search
    testDirectSearch();
    
    console.log('✅ DIRECT TABLE SEARCH READY!');
    console.log('💡 Try typing in the search box now');
    console.log('💡 Available functions:');
    console.log('  - filterSupplements() - Manual search');
    console.log('  - clearSearch() - Clear search');
} else {
    console.error('❌ Setup failed - search input not found');
}