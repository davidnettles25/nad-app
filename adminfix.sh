# Add the missing Test Management sections

echo "📝 Adding missing Test Management sections..."

cd /opt/nad-app

# Update the tests.html section to include ALL the missing parts
cat > frontend/admin/sections/tests.html << 'EOF'
<div id="tests" class="content-section">
    <div class="section-header">
        <h2>🧪 Test Management</h2>
        <p>Create test blocks and manage test lifecycle</p>
    </div>

    <!-- Bulk Test Creation Section -->
    <div class="bulk-creation-section">
        <h3>📦 Create Test Block</h3>
        <p>Generate a batch of test IDs for shipping. Tests will use the new format: <code>yyyy-mm-n-xxxxxx</code></p>
        
        <div class="success-message" id="test-success-message" style="display: none;"></div>
        <div class="error-message" id="test-error-message" style="display: none;"></div>
        
        <form id="bulk-creation-form" class="creation-form">
            <div class="form-group">
                <label for="test-quantity">Number of Tests</label>
                <input type="number" id="test-quantity" min="1" max="1000" value="10" required>
                <small>Min: 1, Max: 1000</small>
            </div>
            
            <div class="form-group">
                <label for="batch-notes">Notes (Optional)</label>
                <input type="text" id="batch-notes" placeholder="e.g., Q1 2025 Inventory">
            </div>
            
            <div class="form-group">
                <label>Preview Format</label>
                <div class="test-id-preview" id="test-id-preview">
                    2025-07-123-45678
                </div>
            </div>
            
            <button type="submit" class="create-btn" id="create-test-btn">
                📦 Create Tests
            </button>
        </form>
        
        <div class="loading-spinner" id="test-loading-spinner" style="display: none;">
            <div class="spinner"></div>
            <span>Creating tests...</span>
        </div>
    </div>

    <!-- Tests Management Controls -->
    <div class="tests-controls-section">
        <h3>📋 Existing Tests</h3>
        <div class="section-controls">
            <div class="search-filters">
                <input type="text" id="test-search" placeholder="🔍 Search tests..." class="search-input">
                <select id="status-filter" class="filter-select">
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="activated">Activated</option>
                    <option value="completed">Completed</option>
                </select>
                <button class="btn secondary" onclick="exportTests()">📊 Export</button>
                <button class="btn primary" onclick="loadAllTests()">🔄 Refresh</button>
            </div>
        </div>

        <!-- Tests Table -->
        <div class="table-container">
            <table class="data-table" id="tests-table">
                <thead>
                    <tr>
                        <th>Test ID</th>
                        <th>Status</th>
                        <th>Customer ID</th>
                        <th>Order ID</th>
                        <th>Batch</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tests-table-body">
                    <tr>
                        <td colspan="7">
                            <div class="loading-state">
                                <div class="spinner"></div>
                                <p>Loading tests...</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Recent Batches Section -->
    <div class="batch-history-section">
        <h3>📋 Recent Test Batches</h3>
        <div id="batch-list">
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading batches...</p>
            </div>
        </div>
    </div>

    <!-- Test Statistics -->
    <div class="test-stats-section">
        <h3>📊 Test Statistics</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number" id="total-created">-</div>
                <div class="stat-label">Total Created</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="total-activated">-</div>
                <div class="stat-label">Activated</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="total-pending">-</div>
                <div class="stat-label">Pending</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="total-batches">-</div>
                <div class="stat-label">Batches</div>
            </div>
        </div>
    </div>
</div>
EOF

echo "✅ Created complete tests.html with all sections"

# Add comprehensive CSS for all the new sections
cat >> frontend/admin.html << 'EOF'

<style>
/* Additional CSS for missing sections */

/* Tests Controls Section */
.tests-controls-section {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
}

.tests-controls-section h3 {
    margin: 0 0 20px 0;
    color: #495057;
    font-size: 18px;
    font-weight: 600;
}

.section-controls {
    margin-bottom: 20px;
}

.search-filters {
    display: flex;
    gap: 15px;
    align-items: center;
    flex-wrap: wrap;
}

.search-input {
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
    min-width: 200px;
}

.filter-select {
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
    background: white;
}

.btn.primary {
    background: #007bff;
    color: white;
}

.btn.primary:hover {
    background: #0056b3;
}

/* Table Styles */
.table-container {
    border: 1px solid #dee2e6;
    border-radius: 6px;
    overflow: hidden;
    background: white;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th {
    background: #f8f9fa;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #495057;
    border-bottom: 2px solid #dee2e6;
    font-size: 14px;
}

.data-table td {
    padding: 12px;
    border-bottom: 1px solid #f1f3f4;
    font-size: 14px;
}

.data-table tr:hover {
    background: #f8f9fa;
}

.data-table tr:nth-child(even) {
    background: #fafafa;
}

.data-table tr:nth-child(even):hover {
    background: #f0f0f0;
}

/* Status badges */
.status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    display: inline-block;
}

.status-badge.pending {
    background: #fff3cd;
    color: #856404;
}

.status-badge.activated {
    background: #d4edda;
    color: #155724;
}

.status-badge.completed {
    background: #d1ecf1;
    color: #0c5460;
}

/* Action buttons */
.action-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    margin-right: 4px;
    font-weight: 500;
}

.action-btn.view {
    background: #007bff;
    color: white;
}

.action-btn.activate {
    background: #28a745;
    color: white;
}

.action-btn.delete {
    background: #dc3545;
    color: white;
}

.action-btn:hover {
    opacity: 0.8;
}

/* Batch History Section */
.batch-history-section {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
}

.batch-history-section h3 {
    margin: 0 0 20px 0;
    color: #495057;
    font-size: 18px;
    font-weight: 600;
}

.batch-item {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 10px;
    display: grid;
    grid-template-columns: 1fr 120px 100px 100px auto;
    gap: 15px;
    align-items: center;
}

.batch-info h4 {
    margin: 0 0 5px 0;
    color: #495057;
    font-size: 14px;
    font-weight: 600;
}

.batch-info p {
    margin: 0;
    color: #6c757d;
    font-size: 12px;
}

.badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
}

.badge.success {
    background: #d4edda;
    color: #155724;
}

.view-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
}

.view-btn:hover {
    background: #0056b3;
}

/* Test Statistics */
.test-stats-section {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
}

.test-stats-section h3 {
    margin: 0 0 20px 0;
    color: #495057;
    font-size: 18px;
    font-weight: 600;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
}

.stat-item {
    text-align: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.stat-number {
    font-size: 24px;
    font-weight: bold;
    color: #007bff;
    margin-bottom: 5px;
}

.stat-label {
    font-size: 12px;
    color: #6c757d;
    text-transform: uppercase;
    font-weight: 600;
}

/* Loading and Empty States */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #6c757d;
    padding: 40px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #6c757d;
    padding: 40px;
}

.empty-state .icon {
    font-size: 48px;
    margin-bottom: 10px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .search-filters {
        flex-direction: column;
        align-items: stretch;
    }
    
    .batch-item {
        grid-template-columns: 1fr;
        gap: 10px;
    }
    
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
EOF

echo "✅ Added comprehensive CSS for all sections"

# Add enhanced JavaScript functionality for the new sections
cat >> frontend/admin.html << 'EOF'

<script>
// Enhanced Test Management with full functionality
let allTests = [];
let allBatches = [];

// Load all tests from API
async function loadAllTests() {
    console.log('📊 Loading all tests...');
    
    const tbody = document.getElementById('tests-table-body');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="loading-state"><div class="spinner"></div><p>Loading tests...</p></div></td></tr>';
    }
    
    try {
        const response = await fetch('/api/tests');
        const result = await response.json();
        
        if (result.success) {
            allTests = result.data;
            renderTestsTable(allTests);
            updateTestStats();
            console.log(`✅ Loaded ${allTests.length} tests`);
        } else {
            console.error('Failed to load tests:', result.message);
            showTestsError('Failed to load tests');
        }
    } catch (error) {
        console.error('Error loading tests:', error);
        showTestsError('Network error loading tests');
    }
}

// Load all batches from API
async function loadAllBatches() {
    console.log('📊 Loading all batches...');
    
    try {
        const response = await fetch('/api/admin/test-batches');
        const result = await response.json();
        
        if (result.success) {
            allBatches = result.data;
            renderBatchList(allBatches);
            console.log(`✅ Loaded ${allBatches.length} batches`);
        } else {
            console.error('Failed to load batches:', result.message);
        }
    } catch (error) {
        console.error('Error loading batches:', error);
    }
}

// Render tests table
function renderTestsTable(tests) {
    const tbody = document.getElementById('tests-table-body');
    if (!tbody) return;
    
    if (tests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="icon">🧪</div>
                        <h4>No Tests Found</h4>
                        <p>No tests match your search criteria.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = tests.map(test => {
        const status = test.is_activated ? 'activated' : 'pending';
        const statusLabel = test.is_activated ? 'Activated' : 'Pending';
        const createdDate = new Date(test.created_date).toLocaleDateString();
        const batchDisplay = test.batch_id ? test.batch_id.split('-').pop() : 'Individual';
        
        return `
            <tr>
                <td><strong>${test.test_id}</strong></td>
                <td><span class="status-badge ${status}">${statusLabel}</span></td>
                <td>${test.customer_id || 'N/A'}</td>
                <td>${test.order_id ? `#${test.order_id}` : 'Manual'}</td>
                <td>${batchDisplay}</td>
                <td>${createdDate}</td>
                <td>
                    <button class="action-btn view" onclick="viewTest('${test.test_id}')">👁️ View</button>
                    ${!test.is_activated ? 
                        `<button class="action-btn activate" onclick="activateTest('${test.test_id}')">⚡ Activate</button>` : 
                        '<span class="text-muted">Activated</span>'
                    }
                </td>
            </tr>
        `;
    }).join('');
}

// Render batch list
function renderBatchList(batches) {
    const batchList = document.getElementById('batch-list');
    if (!batchList) return;
    
    if (batches.length === 0) {
        batchList.innerHTML = `
            <div class="empty-state">
                <p>No test batches created yet.</p>
            </div>
        `;
        return;
    }
    
    batchList.innerHTML = batches.map(batch => `
        <div class="batch-item">
            <div class="batch-info">
                <h4>Batch ${batch.batch_id.split('-').pop()}</h4>
                <p>Created: ${new Date(batch.created_date).toLocaleDateString()}</p>
                <p>Sample IDs: ${batch.sample_test_ids}</p>
            </div>
            <div class="badge success">${batch.tests_created} Tests</div>
            <div>Requested: ${batch.batch_size}</div>
            <div>${batch.tests_created === batch.batch_size ? '✅ Complete' : '⚠️ Partial'}</div>
            <button class="view-btn" onclick="viewBatch('${batch.batch_id}')">View Details</button>
        </div>
    `).join('');
}

// Update test statistics
function updateTestStats() {
    const total = allTests.length;
    const activated = allTests.filter(t => t.is_activated).length;
    const pending = total - activated;
    const batches = allBatches.length;
    
    document.getElementById('total-created').textContent = total;
    document.getElementById('total-activated').textContent = activated;
    document.getElementById('total-pending').textContent = pending;
    document.getElementById('total-batches').textContent = batches;
}

// View test details
function viewTest(testId) {
    const test = allTests.find(t => t.test_id === testId);
    if (test) {
        const details = `
Test ID: ${test.test_id}
Status: ${test.is_activated ? 'Activated' : 'Pending'}
Customer ID: ${test.customer_id || 'N/A'}
Order ID: ${test.order_id || 'Manual'}
Batch: ${test.batch_id || 'Individual'}
Created: ${new Date(test.created_date).toLocaleString()}
${test.activated_date ? `Activated: ${new Date(test.activated_date).toLocaleString()}` : ''}
        `.trim();
        alert(details);
    }
}

// View batch details
async function viewBatch(batchId) {
    try {
        const response = await fetch(`/api/admin/test-batch/${batchId}`);
        const result = await response.json();
        
        if (result.success) {
            const tests = result.data;
            const testIds = tests.slice(0, 10).map(t => t.test_id).join('\n');
            const message = `Batch ${batchId} contains ${tests.length} tests.\n\nFirst ${Math.min(10, tests.length)} test IDs:\n${testIds}`;
            
            if (tests.length > 10) {
                alert(message + `\n\n... and ${tests.length - 10} more tests.`);
            } else {
                alert(message);
            }
        }
    } catch (error) {
        alert('Error loading batch details');
    }
}

// Activate test
async function activateTest(testId) {
    if (!confirm(`Activate test ${testId}?`)) return;
    
    try {
        const response = await fetch(`/api/tests/${testId}/activate`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ Test ${testId} activated successfully`);
            loadAllTests(); // Refresh the table
        } else {
            alert('❌ Failed to activate test: ' + result.message);
        }
    } catch (error) {
        alert('❌ Network error: ' + error.message);
    }
}

// Search and filter functions
function setupSearchAndFilter() {
    const searchInput = document.getElementById('test-search');
    const statusFilter = document.getElementById('status-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = allTests.filter(test => 
                test.test_id.toLowerCase().includes(searchTerm) ||
                (test.customer_id && test.customer_id.toString().includes(searchTerm)) ||
                (test.order_id && test.order_id.toString().includes(searchTerm)) ||
                (test.batch_id && test.batch_id.toLowerCase().includes(searchTerm))
            );
            renderTestsTable(filtered);
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            const status = e.target.value;
            let filtered = allTests;
            
            if (status === 'pending') {
                filtered = allTests.filter(test => !test.is_activated);
            } else if (status === 'activated') {
                filtered = allTests.filter(test => test.is_activated);
            }
            
            renderTestsTable(filtered);
        });
    }
}

// Show tests error
function showTestsError(message) {
    const tbody = document.getElementById('tests-table-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="icon">⚠️</div>
                        <h4>Error Loading Tests</h4>
                        <p>${message}</p>
                        <button class="btn primary" onclick="loadAllTests()" style="margin-top: 15px;">
                            🔄 Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Export tests (placeholder)
function exportTests() {
    alert('Export functionality will be implemented soon!');
}

// Enhanced setup function that includes loading data
function setupTestManagementComplete() {
    console.log('🧪 Setting up complete Test Management...');
    
    // First setup the form functionality
    const success = setupTestManagement();
    
    if (success) {
        // Then load all the data
        loadAllTests();
        loadAllBatches();
        setupSearchAndFilter();
        
        console.log('✅ Complete Test Management setup finished!');
    }
    
    return success;
}

// Update the navigation to use the complete setup
const originalShowSection = window.showSection;
window.showSection = function(sectionName) {
    originalShowSection(sectionName);
    
    if (sectionName === 'tests') {
        setTimeout(() => setupTestManagementComplete(), 150);
    }
};

// Make functions globally available
window.loadAllTests = loadAllTests;
window.viewTest = viewTest;
window.viewBatch = viewBatch;
window.activateTest = activateTest;
window.exportTests = exportTests;
</script>
EOF

echo ""
echo "🎉 Complete Test Management interface restored!"
echo "=============================================="
echo ""
echo "📋 Added back all missing sections:"
echo "✅ Tests table with search and filter"
echo "✅ Action buttons (View, Activate)"
echo "✅ Recent batches section"
echo "✅ Test statistics dashboard"
echo "✅ Comprehensive styling for all elements"
echo "✅ Full JavaScript functionality"
echo ""
echo "🔄 Refresh your browser (Ctrl+F5) to see all the restored functionality!"
