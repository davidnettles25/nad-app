<?php
/**
 * Tests Management Section
 * File: /opt/bitnami/apache/htdocs/nad-app/sections/tests.php
 */
?>

<div id="tests" class="content-section">
    <div class="card">
        <h3>🧪 Test Management</h3>
        
        <div id="test-alert"></div>
        
        <!-- Test Stats -->
        <?php 
        $visible_stats = ['total_tests', 'activated_tests', 'pending_tests', 'completed_tests'];
        include __DIR__ . '/../components/stats-cards.php'; 
        ?>

        <!-- Filters Section -->
        <div class="filters-section">
            <h4>🔍 Filters & Search</h4>
            <div class="filter-grid">
                <div class="form-group">
                    <label for="test-search">Search Tests</label>
                    <input type="text" id="test-search" placeholder="Search by Test ID, Order ID, or Customer ID...">
                </div>
                <div class="form-group">
                    <label for="status-filter">Status Filter</label>
                    <select id="status-filter">
                        <option value="">All Statuses</option>
                        <option value="not_activated">Not Activated</option>
                        <option value="activated">Activated</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="date-filter">Date Range</label>
                    <select id="date-filter">
                        <option value="">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>&nbsp;</label>
                    <button class="btn" onclick="applyFilters()">🔍 Apply Filters</button>
                </div>
            </div>
        </div>

        <!-- Bulk Actions -->
        <div id="bulk-actions" class="bulk-actions">
            <div class="bulk-header">
                <span id="selected-count">0 tests selected</span>
                <div class="bulk-buttons">
                    <button class="btn btn-success" onclick="bulkActivateSelected()" id="bulk-activate-btn" disabled>
                        ⚡ Activate Selected
                    </button>
                    <button class="btn btn-danger" onclick="bulkDeactivateSelected()" id="bulk-deactivate-btn" disabled>
                        ❌ Deactivate Selected
                    </button>
                    <button class="btn" onclick="clearSelection()">
                        🔄 Clear Selection
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Action Controls -->
        <div class="action-controls">
            <div class="controls-left">
                <button class="btn" onclick="loadTestsFromAPI()">
                    <span id="load-spinner"></span>🔄 Load Tests
                </button>
                <button class="btn btn-success" onclick="activateAllPendingTests()">
                    ⚡ Activate All Pending
                </button>
                <button class="btn btn-danger" onclick="deactivateAllActivatedTests()">
                    ❌ Deactivate All
                </button>
            </div>
            <div class="controls-right">
                <button class="btn btn-warning" onclick="exportTests()">
                    📊 Export Tests
                </button>
                <button class="btn btn-secondary" onclick="generateTestReport()">
                    📋 Generate Report
                </button>
            </div>
        </div>
        
        <!-- Tests Table -->
        <div class="table-container">
            <table class="data-table" id="tests-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">
                            <input type="checkbox" class="select-all-checkbox" id="select-all-checkbox">
                        </th>
                        <th class="sortable" data-sort="test_id">
                            Test ID <span class="sort-indicator">↕️</span>
                        </th>
                        <th class="sortable" data-sort="status">
                            Status <span class="sort-indicator">↕️</span>
                        </th>
                        <th class="sortable" data-sort="customer_id">
                            Customer ID <span class="sort-indicator">↕️</span>
                        </th>
                        <th class="sortable" data-sort="order_id">
                            Order ID <span class="sort-indicator">↕️</span>
                        </th>
                        <th class="sortable" data-sort="created_date">
                            Created <span class="sort-indicator">↕️</span>
                        </th>
                        <th style="width: 180px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="tests-table-body">
                    <tr>
                        <td colspan="7" class="loading-state">
                            <div class="empty-state">
                                <div class="icon">🧪</div>
                                <h4>Loading Tests...</h4>
                                <p>Fetching test data from API</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        <div class="pagination-container" id="pagination-container" style="display: none;">
            <div class="pagination-info">
                Showing <span id="pagination-start">0</span> to <span id="pagination-end">0</span> 
                of <span id="pagination-total">0</span> tests
            </div>
            <div class="pagination-controls">
                <button class="btn btn-sm" onclick="previousPage()" id="prev-btn" disabled>
                    ← Previous
                </button>
                <span class="pagination-pages" id="pagination-pages">
                    <!-- Page numbers will be inserted here -->
                </span>
                <button class="btn btn-sm" onclick="nextPage()" id="next-btn" disabled>
                    Next →
                </button>
            </div>
        </div>
    </div>
</div>

<style>
.filters-section {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    border: 1px solid #e9ecef;
}

.filters-section h4 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 1.1em;
}

.filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    align-items: end;
}

.bulk-actions {
    background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
    border: 2px solid #667eea;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    display: none;
    animation: slideIn 0.3s ease;
}

.bulk-actions.active {
    display: block;
}

.bulk-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
}

.bulk-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.action-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;
}

.controls-left,
.controls-right {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.table-container {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
}

.data-table th {
    background: #f8f9fa;
    padding: 15px 12px;
    text-align: left;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #e9ecef;
    position: sticky;
    top: 0;
    z-index: 10;
}

.data-table td {
    padding: 12px;
    border-bottom: 1px solid #e9ecef;
    vertical-align: middle;
}

.data-table tr:hover {
    background: #f8f9fa;
}

.sortable {
    cursor: pointer;
    user-select: none;
    transition: background 0.3s ease;
}

.sortable:hover {
    background: #e9ecef;
}

.sort-indicator {
    font-size: 12px;
    opacity: 0.6;
    margin-left: 5px;
}

.sortable.asc .sort-indicator::after {
    content: ' ↑';
    color: #667eea;
    font-weight: bold;
}

.sortable.desc .sort-indicator::after {
    content: ' ↓';
    color: #667eea;
    font-weight: bold;
}

.test-checkbox,
.select-all-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #667eea;
}

.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
}

.status-completed {
    background: #d1ecf1;
    color: #0c5460;
}

.status-activated {
    background: #d4edda;
    color: #155724;
}

.status-pending {
    background: #fff3cd;
    color: #856404;
}

.status-not-activated {
    background: #f8d7da;
    color: #721c24;
}

.action-buttons {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
}

.btn-sm {
    padding: 6px 12px;
    font-size: 12px;
}

.pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    flex-wrap: wrap;
    gap: 15px;
}

.pagination-info {
    color: #666;
    font-size: 14px;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 10px;
}

.pagination-pages {
    display: flex;
    gap: 5px;
}

.page-btn {
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.page-btn:hover {
    background: #f8f9fa;
}

.page-btn.active {
    background: #667eea;
    color: white;
    border-color: #667eea;
}

.loading-state {
    text-align: center;
    padding: 40px;
}

.empty-state {
    text-align: center;
    color: #666;
}

.empty-state .icon {
    font-size: 3em;
    margin-bottom: 15px;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive design */
@media (max-width: 768px) {
    .filter-grid {
        grid-template-columns: 1fr;
    }
    
    .action-controls {
        flex-direction: column;
        align-items: stretch;
    }
    
    .controls-left,
    .controls-right {
        justify-content: center;
    }
    
    .bulk-header {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
    }
    
    .table-container {
        font-size: 14px;
    }
    
    .data-table th,
    .data-table td {
        padding: 8px 6px;
    }
    
    .pagination-container {
        flex-direction: column;
        text-align: center;
    }
}

@media (max-width: 480px) {
    .bulk-buttons {
        flex-direction: column;
    }
    
    .btn {
        width: 100%;
        text-align: center;
    }
}
</style>

<script>
class TestsManager {
    constructor() {
        this.allTests = [];
        this.filteredTests = [];
        this.selectedTests = new Set();
        this.currentPage = 1;
        this.itemsPerPage = 25;
        this.sortField = 'created_date';
        this.sortDirection = 'desc';
        this.filters = {
            search: '',
            status: '',
            dateRange: ''
        };
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadTestsFromAPI();
    }
    
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('test-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }
        
        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }
        
        // Date filter
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.filters.dateRange = e.target.value;
                this.applyFilters();
            });
        }
        
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }
        
        // Table sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                this.sortBy(field);
            });
        });
    }
    
    async loadTestsFromAPI() {
        console.log('🧪 Loading tests from API...');
        this.showAlert('🔄 Loading test data from API...', 'info');
        this.setLoadingState(true);
        
        try {
            const response = await fetch('<?= API_BASE_URL ?>/api/admin/tests');
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.allTests = data.tests;
                this.applyFilters();
                this.showAlert(`✅ Loaded ${this.allTests.length} tests successfully!`, 'success');
                console.log('✅ Tests loaded:', this.allTests.length);
            } else {
                throw new Error(data.error || 'Failed to load tests');
            }
        } catch (error) {
            console.error('❌ Error loading tests:', error);
            this.showTestsError(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    applyFilters() {
        this.filteredTests = [...this.allTests];
        
        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            this.filteredTests = this.filteredTests.filter(test => 
                test.test_id.toLowerCase().includes(searchTerm) ||
                test.customer_id.toString().includes(searchTerm) ||
                test.order_id.toString().includes(searchTerm)
            );
        }
        
        // Apply status filter
        if (this.filters.status) {
            this.filteredTests = this.filteredTests.filter(test => {
                const status = this.getTestStatus(test);
                return status.toLowerCase().replace(/\s+/g, '_') === this.filters.status;
            });
        }
        
        // Apply date filter
        if (this.filters.dateRange) {
            const now = new Date();
            const startDate = new Date();
            
            switch (this.filters.dateRange) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
            }
            
            this.filteredTests = this.filteredTests.filter(test => 
                new Date(test.created_date) >= startDate
            );
        }
        
        // Apply sorting
        this.sortTests();
        
        // Reset pagination
        this.currentPage = 1;
        this.clearSelection();
        
        // Render results
        this.renderTestsTable();
        this.updatePagination();
    }
    
    sortBy(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        this.updateSortIndicators();
        this.sortTests();
        this.renderTestsTable();
    }
    
    sortTests() {
        this.filteredTests.sort((a, b) => {
            let aVal = a[this.sortField];
            let bVal = b[this.sortField];
            
            // Handle special cases
            if (this.sortField === 'status') {
                aVal = this.getTestStatus(a);
                bVal = this.getTestStatus(b);
            }
            
            // Convert to comparable values
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            let comparison = 0;
            if (aVal > bVal) comparison = 1;
            if (aVal < bVal) comparison = -1;
            
            return this.sortDirection === 'desc' ? -comparison : comparison;
        });
    }
    
    updateSortIndicators() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
            if (header.dataset.sort === this.sortField) {
                header.classList.add(this.sortDirection);
            }
        });
    }
    
    renderTestsTable() {
        const tbody = document.getElementById('tests-table-body');
        if (!tbody) return;
        
        if (this.filteredTests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="icon">🔍</div>
                            <h4>No Tests Found</h4>
                            <p>No tests match your current filters.</p>
                            <button class="btn" onclick="testsManager.clearFilters()" style="margin-top: 15px;">
                                🔄 Clear Filters
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredTests.length);
        const pageTests = this.filteredTests.slice(startIndex, endIndex);
        
        tbody.innerHTML = pageTests.map(test => {
            const status = this.getTestStatus(test);
            const statusClass = this.getTestStatusClass(status);
            const createdDate = new Date(test.created_date).toLocaleDateString();
            const isSelected = this.selectedTests.has(test.test_id);
            
            return `
                <tr ${isSelected ? 'class="selected"' : ''}>
                    <td>
                        <input type="checkbox" class="test-checkbox" 
                               data-test-id="${test.test_id}" 
                               ${isSelected ? 'checked' : ''}
                               onchange="testsManager.toggleTestSelection('${test.test_id}')">
                    </td>
                    <td><strong>${test.test_id}</strong></td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td>${test.customer_id}</td>
                    <td>#${test.order_id}</td>
                    <td>${createdDate}</td>
                    <td>
                        <div class="action-buttons">
                            ${!test.is_activated ? 
                                `<button class="btn btn-sm btn-success" onclick="testsManager.activateTest('${test.test_id}')">⚡ Activate</button>` : 
                                `<button class="btn btn-sm btn-danger" onclick="testsManager.deactivateTest('${test.test_id}')">❌ Deactivate</button>`}
                            <button class="btn btn-sm" onclick="testsManager.viewTest('${test.test_id}')">👁️ View</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        this.updateBulkActions();
    }
    
    getTestStatus(test) {
        if (test.score) return 'Completed';
        if (test.is_activated) return 'Activated';
        return 'Not Activated';
    }
    
    getTestStatusClass(status) {
        switch (status) {
            case 'Completed': return 'status-completed';
            case 'Activated': return 'status-activated';
            case 'Not Activated': return 'status-not-activated';
            default: return 'status-pending';
        }
    }
    
    toggleTestSelection(testId) {
        if (this.selectedTests.has(testId)) {
            this.selectedTests.delete(testId);
        } else {
            this.selectedTests.add(testId);
        }
        this.updateBulkActions();
        this.updateSelectAllCheckbox();
    }
    
    toggleSelectAll(checked) {
        if (checked) {
            const pageTests = this.getCurrentPageTests();
            pageTests.forEach(test => this.selectedTests.add(test.test_id));
        } else {
            this.selectedTests.clear();
        }
        
        document.querySelectorAll('.test-checkbox').forEach(checkbox => {
            checkbox.checked = this.selectedTests.has(checkbox.dataset.testId);
        });
        
        this.updateBulkActions();
        this.renderTestsTable(); // Re-render to show selection styling
    }
    
    getCurrentPageTests() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredTests.length);
        return this.filteredTests.slice(startIndex, endIndex);
    }
    
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (!selectAllCheckbox) return;
        
        const pageTests = this.getCurrentPageTests();
        const selectedOnPage = pageTests.filter(test => this.selectedTests.has(test.test_id)).length;
        
        if (selectedOnPage === 0) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = false;
        } else if (selectedOnPage === pageTests.length) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.indeterminate = true;
            selectAllCheckbox.checked = false;
        }
    }
    
    updateBulkActions() {
        const selectedCount = this.selectedTests.size;
        const bulkActionsDiv = document.getElementById('bulk-actions');
        const selectedCountSpan = document.getElementById('selected-count');
        const activateBtn = document.getElementById('bulk-activate-btn');
        const deactivateBtn = document.getElementById('bulk-deactivate-btn');
        
        if (!bulkActionsDiv || !selectedCountSpan) return;
        
        selectedCountSpan.textContent = `${selectedCount} test${selectedCount !== 1 ? 's' : ''} selected`;
        
        if (selectedCount > 0) {
            bulkActionsDiv.classList.add('active');
            
            const selectedTestData = Array.from(this.selectedTests).map(testId => 
                this.allTests.find(t => t.test_id === testId)
            ).filter(Boolean);
            
            const activatedCount = selectedTestData.filter(t => t.is_activated).length;
            const notActivatedCount = selectedTestData.filter(t => !t.is_activated).length;
            
            if (activateBtn) {
                activateBtn.disabled = notActivatedCount === 0;
                activateBtn.innerHTML = `⚡ Activate Selected (${notActivatedCount})`;
            }
            
            if (deactivateBtn) {
                deactivateBtn.disabled = activatedCount === 0;
                deactivateBtn.innerHTML = `❌ Deactivate Selected (${activatedCount})`;
            }
        } else {
            bulkActionsDiv.classList.remove('active');
        }
    }
    
    clearSelection() {
        this.selectedTests.clear();
        document.querySelectorAll('.test-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateBulkActions();
        this.updateSelectAllCheckbox();
        this.renderTestsTable(); // Re-render to remove selection styling
    }
    
    clearFilters() {
        this.filters = { search: '', status: '', dateRange: '' };
        document.getElementById('test-search').value = '';
        document.getElementById('status-filter').value = '';
        document.getElementById('date-filter').value = '';
        this.applyFilters();
        this.showAlert('🔄 Filters cleared', 'info');
    }
    
    updatePagination() {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;
        
        const totalTests = this.filteredTests.length;
        const totalPages = Math.ceil(totalTests / this.itemsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, totalTests);
        
        document.getElementById('pagination-start').textContent = startIndex;
        document.getElementById('pagination-end').textContent = endIndex;
        document.getElementById('pagination-total').textContent = totalTests;
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages;
        
        // Generate page numbers
        this.renderPageNumbers(totalPages);
    }
    
    renderPageNumbers(totalPages) {
        const pagesContainer = document.getElementById('pagination-pages');
        if (!pagesContainer) return;
        
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        let pagesHTML = '';
        
        for (let i = startPage; i <= endPage; i++) {
            pagesHTML += `
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="testsManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        pagesContainer.innerHTML = pagesHTML;
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.renderTestsTable();
        this.updatePagination();
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    }
    
    nextPage() {
        const totalPages = Math.ceil(this.filteredTests.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.goToPage(this.currentPage + 1);
        }
    }
    
    setLoadingState(loading) {
        const loadingSpinner = document.getElementById('load-spinner');
        if (loadingSpinner) {
            loadingSpinner.innerHTML = loading ? '<span class="loading"></span>' : '';
        }
    }
    
    showTestsError(errorMessage) {
        const tbody = document.getElementById('tests-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="icon">⚠️</div>
                            <h4>Error Loading Tests</h4>
                            <p>${errorMessage}</p>
                            <button class="btn" onclick="testsManager.loadTestsFromAPI()" style="margin-top: 15px;">
                                🔄 Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        this.showAlert('❌ Failed to load tests. Check if the API server is running.', 'error');
    }
    
    showAlert(message, type) {
        const alertDiv = document.getElementById('test-alert');
        if (alertDiv) {
            alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            
            if (type === 'success' || type === 'info') {
                setTimeout(() => {
                    alertDiv.innerHTML = '';
                }, 5000);
            }
        }
        console.log(`📢 Test Alert (${type}):`, message);
    }
    
    // Test action methods
    async activateTest(testId) {
        if (!confirm(`Activate test ${testId}?`)) return;
        
        try {
            this.showAlert('🔄 Activating test...', 'info');
            
            const response = await fetch(`<?= API_BASE_URL ?>/api/admin/tests/${testId}/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showAlert(`✅ Test ${testId} activated successfully!`, 'success');
                this.loadTestsFromAPI();
            } else {
                throw new Error(data.error || 'Failed to activate test');
            }
        } catch (error) {
            console.error('❌ Error activating test:', error);
            this.showAlert(`❌ Failed to activate test: ${error.message}`, 'error');
        }
    }
    
    async deactivateTest(testId) {
        if (!confirm(`Deactivate test ${testId}?`)) return;
        
        try {
            this.showAlert('🔄 Deactivating test...', 'info');
            
            const response = await fetch(`<?= API_BASE_URL ?>/api/admin/tests/${testId}/deactivate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showAlert(`✅ Test ${testId} deactivated successfully!`, 'success');
                this.loadTestsFromAPI();
            } else {
                throw new Error(data.error || 'Failed to deactivate test');
            }
        } catch (error) {
            console.error('❌ Error deactivating test:', error);
            this.showAlert(`❌ Failed to deactivate test: ${error.message}`, 'error');
        }
    }
    
    viewTest(testId) {
        const test = this.allTests.find(t => t.test_id === testId);
        if (!test) {
            this.showAlert('❌ Test not found', 'error');
            return;
        }
        
        const status = this.getTestStatus(test);
        const createdDate = new Date(test.created_date).toLocaleDateString();
        const activatedDate = test.activated_date ? new Date(test.activated_date).toLocaleDateString() : 'Not activated';
        
        const details = `
🧪 Test ID: ${test.test_id}
📊 Status: ${status}
👤 Customer ID: ${test.customer_id}
🛒 Order ID: ${test.order_id}
📅 Created: ${createdDate}
⚡ Activated: ${activatedDate}
${test.score ? `🎯 Score: ${test.score}` : ''}
        `;
        
        alert(`Test Details:\n\n${details}`);
    }
    
    async exportTests() {
        try {
            this.showAlert('📊 Exporting test data...', 'info');
            
            const response = await fetch('<?= API_BASE_URL ?>/api/admin/export/tests');
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nad_tests_export_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showAlert('✅ Test data exported successfully!', 'success');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            console.error('❌ Export error:', error);
            this.showAlert('❌ Failed to export test data', 'error');
        }
    }
    
    generateTestReport() {
        const stats = this.calculateStats();
        const reportData = {
            generated_date: new Date().toISOString(),
            total_tests: this.allTests.length,
            filtered_tests: this.filteredTests.length,
            stats: stats,
            filters_applied: this.filters
        };
        
        const reportText = `
NAD Test Management Report
Generated: ${new Date().toLocaleString()}

Summary:
- Total Tests: ${stats.total}
- Activated Tests: ${stats.activated} (${stats.activationRate}%)
- Completed Tests: ${stats.completed} (${stats.completionRate}%)
- Pending Tests: ${stats.pending}

Filters Applied:
- Search: ${this.filters.search || 'None'}
- Status: ${this.filters.status || 'All'}
- Date Range: ${this.filters.dateRange || 'All'}

Showing ${this.filteredTests.length} of ${this.allTests.length} tests
        `;
        
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nad_test_report_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.showAlert('✅ Test report generated successfully!', 'success');
    }
    
    calculateStats() {
        const total = this.allTests.length;
        const activated = this.allTests.filter(t => t.is_activated).length;
        const completed = this.allTests.filter(t => t.score).length;
        const pending = total - activated;
        
        return {
            total,
            activated,
            completed,
            pending,
            activationRate: total > 0 ? ((activated / total) * 100).toFixed(1) : 0,
            completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
        };
    }
}

// Global functions for backward compatibility
function loadTestsFromAPI() {
    if (window.testsManager) {
        window.testsManager.loadTestsFromAPI();
    }
}

function applyFilters() {
    if (window.testsManager) {
        window.testsManager.applyFilters();
    }
}

function bulkActivateSelected() {
    if (window.testsManager && window.bulkActivateSelected) {
        window.bulkActivateSelected();
    }
}

function bulkDeactivateSelected() {
    if (window.testsManager && window.bulkDeactivateSelected) {
        window.bulkDeactivateSelected();
    }
}

function clearSelection() {
    if (window.testsManager) {
        window.testsManager.clearSelection();
    }
}

function activateAllPendingTests() {
    if (window.activateAllPendingTests) {
        window.activateAllPendingTests();
    }
}

function deactivateAllActivatedTests() {
    if (window.deactivateAllActivatedTests) {
        window.deactivateAllActivatedTests();
    }
}

function exportTests() {
    if (window.testsManager) {
        window.testsManager.exportTests();
    }
}

function generateTestReport() {
    if (window.testsManager) {
        window.testsManager.generateTestReport();
    }
}

function previousPage() {
    if (window.testsManager) {
        window.testsManager.previousPage();
    }
}

function nextPage() {
    if (window.testsManager) {
        window.testsManager.nextPage();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('tests')) {
        window.testsManager = new TestsManager();
    }
});

// Export for global access
window.TestsManager = TestsManager;
window.loadTestsFromAPI = loadTestsFromAPI;
window.applyFilters = applyFilters;
window.exportTests = exportTests;
window.generateTestReport = generateTestReport;
</script>
