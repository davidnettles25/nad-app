// File: frontend/admin/js/sections/tests.js
// Enhanced Test Management Logic with Bulk Creation

class TestManagement {
    constructor() {
        this.tests = [];
        this.batches = [];
        this.initialized = false;
    }

    // Initialize when section becomes active
    async init() {
        if (this.initialized) return;
        
        console.log('🧪 Initializing Test Management...');
        
        this.setupEventListeners();
        this.startTestIdPreview();
        await this.loadInitialData();
        
        this.initialized = true;
        console.log('✅ Test Management initialized');
    }

    setupEventListeners() {
        // Bulk creation form
        const form = document.getElementById('bulk-creation-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleBulkCreation(e));
        }

        // Search and filter
        const searchInput = document.getElementById('test-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterTests(e.target.value));
        }

        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.filterByStatus(e.target.value));
        }
    }

    // Test ID Preview Animation
    startTestIdPreview() {
        this.updateTestIdPreview();
        this.previewInterval = setInterval(() => this.updateTestIdPreview(), 3000);
    }

    updateTestIdPreview() {
        const previewElement = document.getElementById('test-id-preview');
        if (!previewElement) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const randomId = Math.floor(Math.random() * 1000) + 100;
        const randomSuffix = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
        
        previewElement.textContent = `${year}-${month}-${randomId}-${randomSuffix}`;
    }

    // Bulk Test Creation
    async handleBulkCreation(e) {
        e.preventDefault();
        
        const quantity = parseInt(document.getElementById('test-quantity').value);
        const notes = document.getElementById('batch-notes').value;
        
        if (quantity < 1 || quantity > 1000) {
            this.showError('Quantity must be between 1 and 1000');
            return;
        }

        this.setLoading(true);
        this.hideMessages();

        try {
            const response = await fetch('/api/admin/create-test-batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity, notes })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(`Successfully created ${result.data.quantity} tests! Batch ID: ${result.data.batch_id}`);
                
                // Reset form
                document.getElementById('bulk-creation-form').reset();
                document.getElementById('test-quantity').value = 10;
                
                // Refresh data
                await this.loadTestsFromAPI();
                await this.loadBatchHistory();
            } else {
                this.showError(result.message || 'Failed to create test batch');
            }
        } catch (error) {
            console.error('Error creating test batch:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    // Load all tests
    async loadTestsFromAPI() {
        try {
            const response = await fetch('/api/tests');
            const result = await response.json();
            
            if (result.success) {
                this.tests = result.data;
                this.renderTestsTable(this.tests);
            } else {
                console.error('Failed to load tests:', result.message);
                this.showTestsError('Failed to load tests');
            }
        } catch (error) {
            console.error('Error loading tests:', error);
            this.showTestsError('Network error loading tests');
        }
    }

    // Load batch history
    async loadBatchHistory() {
        try {
            const response = await fetch('/api/admin/test-batches');
            const result = await response.json();
            
            if (result.success) {
                this.batches = result.data;
                this.displayBatches(result.data);
            } else {
                console.error('Failed to load batches:', result.message);
            }
        } catch (error) {
            console.error('Error loading batch history:', error);
        }
    }

    // Render tests table
    renderTestsTable(tests) {
        const tbody = document.getElementById('tests-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (tests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="icon">🧪</div>
                            <h4>No Tests Found</h4>
                            <p>No tests are available in the system.</p>
                            <button class="btn" onclick="testManager.loadTestsFromAPI()" style="margin-top: 15px;">
                                🔄 Retry Loading
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tests.forEach(test => {
            const row = document.createElement('tr');
            
            const status = this.getTestStatus(test);
            const statusClass = this.getTestStatusClass(status);
            const createdDate = new Date(test.created_date).toLocaleDateString();
            const batchDisplay = test.batch_id ? test.batch_id.split('-').pop() : 'Individual';
            
            row.innerHTML = `
                <td><strong>${test.test_id}</strong></td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${test.customer_id || 'N/A'}</td>
                <td>${test.order_id ? `#${test.order_id}` : 'Manual'}</td>
                <td>${batchDisplay}</td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn small" onclick="testManager.viewTest('${test.test_id}')">
                        👁️ View
                    </button>
                    ${!test.is_activated ? 
                        `<button class="btn small warning" onclick="testManager.activateTest('${test.test_id}')">
                            ⚡ Activate
                        </button>` : ''
                    }
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Display batches
    displayBatches(batches) {
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
                <button class="view-btn" onclick="testManager.viewBatch('${batch.batch_id}')">
                    View Details
                </button>
            </div>
        `).join('');
    }

    // View specific batch
    async viewBatch(batchId) {
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
            console.error('Error viewing batch:', error);
            this.showError('Failed to load batch details');
        }
    }

    // View specific test
    async viewTest(testId) {
        try {
            const test = this.tests.find(t => t.test_id === testId);
            if (test) {
                const details = `
Test ID: ${test.test_id}
Status: ${this.getTestStatus(test)}
Customer ID: ${test.customer_id || 'N/A'}
Order ID: ${test.order_id || 'Manual'}
Batch: ${test.batch_id || 'Individual'}
Created: ${new Date(test.created_date).toLocaleString()}
Activated: ${test.activated_date ? new Date(test.activated_date).toLocaleString() : 'No'}
                `.trim();
                alert(details);
            }
        } catch (error) {
            console.error('Error viewing test:', error);
        }
    }

    // Activate test
    async activateTest(testId) {
        if (!confirm(`Are you sure you want to activate test ${testId}?`)) return;
        
        try {
            const response = await fetch(`/api/tests/${testId}/activate`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(`Test ${testId} has been activated`);
                await this.loadTestsFromAPI(); // Refresh the table
            } else {
                this.showError(result.message || 'Failed to activate test');
            }
        } catch (error) {
            console.error('Error activating test:', error);
            this.showError('Network error. Please try again.');
        }
    }

    // Filter tests
    filterTests(searchTerm) {
        const filteredTests = this.tests.filter(test => 
            test.test_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (test.customer_id && test.customer_id.toString().includes(searchTerm)) ||
            (test.order_id && test.order_id.toString().includes(searchTerm)) ||
            (test.batch_id && test.batch_id.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        this.renderTestsTable(filteredTests);
    }

    filterByStatus(status) {
        if (!status) {
            this.renderTestsTable(this.tests);
            return;
        }
        
        const filteredTests = this.tests.filter(test => 
            this.getTestStatus(test).toLowerCase() === status.toLowerCase()
        );
        this.renderTestsTable(filteredTests);
    }

    // Helper methods
    getTestStatus(test) {
        if (test.is_activated) {
            return 'Activated';
        }
        return 'Pending';
    }

    getTestStatusClass(status) {
        const statusMap = {
            'Pending': 'warning',
            'Activated': 'success',
            'Completed': 'info'
        };
        return statusMap[status] || 'secondary';
    }

    showTestsError(message) {
        const tbody = document.getElementById('tests-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="icon">⚠️</div>
                            <h4>Error Loading Tests</h4>
                            <p>${message}</p>
                            <button class="btn" onclick="testManager.loadTestsFromAPI()" style="margin-top: 15px;">
                                🔄 Retry Loading
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    // UI Helper methods
    setLoading(loading) {
        const button = document.getElementById('create-test-btn');
        const spinner = document.getElementById('test-loading-spinner');
        const form = document.getElementById('bulk-creation-form');
        
        if (loading) {
            if (button) button.disabled = true;
            if (spinner) spinner.style.display = 'flex';
            if (form) form.style.opacity = '0.7';
        } else {
            if (button) button.disabled = false;
            if (spinner) spinner.style.display = 'none';
            if (form) form.style.opacity = '1';
        }
    }

    showSuccess(message) {
        const element = document.getElementById('test-success-message');
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
            setTimeout(() => element.style.display = 'none', 5000);
        }
    }

    showError(message) {
        const element = document.getElementById('test-error-message');
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    hideMessages() {
        const successMsg = document.getElementById('test-success-message');
        const errorMsg = document.getElementById('test-error-message');
        if (successMsg) successMsg.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'none';
    }

    // Load initial data
    async loadInitialData() {
        await Promise.all([
            this.loadTestsFromAPI(),
            this.loadBatchHistory()
        ]);
    }

    // Export functionality
    async exportTests() {
        try {
            const response = await fetch('/api/export/tests');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tests_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Export failed. Please try again.');
        }
    }

    // Cleanup when section is deactivated
    cleanup() {
        if (this.previewInterval) {
            clearInterval(this.previewInterval);
        }
    }
}

// Initialize test manager when this script loads
let testManager;

// Initialize when section is shown
function initTestManagement() {
    if (!testManager) {
        testManager = new TestManagement();
    }
    testManager.init();
}

// Global functions for onclick handlers
window.exportTests = () => testManager?.exportTests();
window.loadTestsFromAPI = () => testManager?.loadTestsFromAPI();

// Auto-initialize if tests section is already visible
document.addEventListener('DOMContentLoaded', () => {
    const testsSection = document.getElementById('tests');
    if (testsSection && testsSection.classList.contains('active')) {
        initTestManagement();
    }
});

// Export for use by navigation system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initTestManagement, testManager };
}