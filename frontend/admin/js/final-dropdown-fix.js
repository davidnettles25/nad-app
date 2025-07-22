// FINAL Dropdown Fix - Runs after everything else
// This version waits for all other scripts to finish

// FINAL dropdown fix loading...

// Function that definitely works (copied from console method)
function applyFinalDropdownFix() {
    // Applying FINAL dropdown fix...
    
    const statusFilter = document.getElementById('status-filter');
    if (!statusFilter) {
        // Status filter not found in FINAL fix
        return false;
    }
    
    // Status filter found, applying FINAL fix...
    
    // Replace element to clear ALL existing listeners
    const parent = statusFilter.parentNode;
    const newFilter = statusFilter.cloneNode(true);
    newFilter.onchange = null;
    newFilter.removeAttribute('onchange');
    parent.replaceChild(newFilter, statusFilter);
    
    // Add our working listener (exact copy of console method)
    newFilter.addEventListener('change', function(e) {
        const status = e.target.value;
        // FINAL: Status changed to status
        
        const tests = window.allTests || [];
        let filtered = tests;
        
        if (status === 'activated') {
            filtered = tests.filter(t => t.status === 'activated');
        } else if (status === 'pending') {
            filtered = tests.filter(t => t.status === 'pending');
        } else if (status === 'completed') {
            filtered = tests.filter(t => t.status === 'completed');
        }
        
        // FINAL: Showing filtered tests
        
        if (window.renderTestsTable) {
            window.renderTestsTable(filtered);
        } else {
            // renderTestsTable not found
        }
    });
    
    // FINAL: Event listener attached successfully
    return true;
}

// Try multiple strategies to ensure this runs LAST

// Strategy 1: Wait for everything to load
window.addEventListener('load', function() {
    // Window loaded, applying FINAL fix...
    setTimeout(applyFinalDropdownFix, 500);
});

// Strategy 2: Use longer delays
setTimeout(function() {
    // 5-second delay, applying FINAL fix...
    applyFinalDropdownFix();
}, 5000);

// Strategy 3: Watch for when tests are loaded
let testLoadWatcher = setInterval(function() {
    if (window.allTests && window.allTests.length > 0) {
        // Tests detected, applying FINAL fix...
        clearInterval(testLoadWatcher);
        setTimeout(applyFinalDropdownFix, 1000);
    }
}, 1000);

// Strategy 4: Override setupSearchAndFilter if it exists
if (window.setupSearchAndFilter) {
    const originalSetup = window.setupSearchAndFilter;
    window.setupSearchAndFilter = function() {
        // Intercepting setupSearchAndFilter...
        originalSetup.apply(this, arguments);
        setTimeout(applyFinalDropdownFix, 500);
    };
}

// Strategy 5: Manual trigger function
window.applyFinalDropdownFix = applyFinalDropdownFix;

// FINAL dropdown fix strategies loaded
