// PASTE THIS INTO BROWSER CONSOLE FOR IMMEDIATE TESTING

(function() {
    console.log('🔧 Console dropdown fix...');
    
    const statusFilter = document.getElementById('status-filter');
    if (!statusFilter) {
        console.error('❌ Status filter not found');
        return;
    }
    
    // Replace element to clear existing listeners
    const parent = statusFilter.parentNode;
    const newFilter = statusFilter.cloneNode(true);
    newFilter.onchange = null;
    newFilter.removeAttribute('onchange');
    parent.replaceChild(newFilter, statusFilter);
    
    // Add working listener
    newFilter.addEventListener('change', function(e) {
        const status = e.target.value;
        console.log('🔽 Status:', status);
        
        const tests = window.allTests || [];
        let filtered = tests;
        
        if (status === 'activated') {
            filtered = tests.filter(t => t.is_activated);
        } else if (status === 'pending') {
            filtered = tests.filter(t => !t.is_activated);
        }
        
        console.log(`Showing ${filtered.length} of ${tests.length} tests`);
        
        if (window.renderTestsTable) {
            window.renderTestsTable(filtered);
        }
    });
    
    console.log('✅ Console fix applied');
})();
