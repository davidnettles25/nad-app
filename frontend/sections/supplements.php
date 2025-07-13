<?php
// sections/supplements.php - Supplements Management Section
?>
<div class="content-section" id="supplements" style="display: none;">
    <div class="section-header">
        <h2>💊 Supplement Management</h2>
        <p>Manage supplement database and dosage information</p>
    </div>

    <!-- Supplements Stats Cards -->
    <div class="stats-overview">
        <div class="stat-card">
            <div class="stat-number primary" id="supplement-total-count">0</div>
            <div class="stat-label">Total Supplements</div>
            <div class="stat-trend" id="supplement-total-trend">Loading...</div>
        </div>
        <div class="stat-card">
            <div class="stat-number success" id="supplement-active-count">0</div>
            <div class="stat-label">Active Supplements</div>
            <div class="stat-trend" id="supplement-active-trend">Loading...</div>
        </div>
        <div class="stat-card">
            <div class="stat-number info" id="supplement-categories-count">0</div>
            <div class="stat-label">Categories</div>
            <div class="stat-trend" id="supplement-categories-trend">Loading...</div>
        </div>
        <div class="stat-card">
            <div class="stat-number warning" id="supplement-inactive-count">0</div>
            <div class="stat-label">Inactive</div>
            <div class="stat-trend" id="supplement-inactive-trend">Loading...</div>
        </div>
    </div>

    <!-- Alert Area -->
    <div id="supplement-alert"></div>

    <!-- Action Buttons -->
    <div class="action-bar">
        <div class="action-group">
            <button class="btn btn-primary" onclick="loadSupplements()">
                <i class="icon">🔄</i> Refresh Supplements
            </button>
            <button class="btn btn-success" onclick="showAddSupplementForm()">
                <i class="icon">➕</i> Add New Supplement
            </button>
            <button class="btn btn-warning" onclick="exportSupplements()">
                <i class="icon">📊</i> Export Data
            </button>
        </div>
        <div class="search-group">
            <input type="text" id="supplement-search" placeholder="Search supplements..." 
                   onkeyup="filterSupplements()">
            <select id="supplement-filter" onchange="filterSupplements()">
                <option value="">All Categories</option>
                <option value="vitamins">Vitamins</option>
                <option value="minerals">Minerals</option>
                <option value="antioxidants">Antioxidants</option>
                <option value="herbs">Herbs & Botanicals</option>
                <option value="amino_acids">Amino Acids</option>
                <option value="enzymes">Enzymes</option>
                <option value="probiotics">Probiotics</option>
                <option value="fatty_acids">Fatty Acids</option>
                <option value="other">Other</option>
            </select>
            <select id="status-filter" onchange="filterSupplements()">
                <option value="">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
            </select>
        </div>
    </div>

    <!-- Add/Edit Supplement Form -->
    <div id="supplement-form-container" class="form-container" style="display: none;">
        <div class="card">
            <div class="card-header">
                <h3 id="supplement-form-title">Add New Supplement</h3>
                <button class="btn-close" onclick="hideSupplementForm()">×</button>
            </div>
            <form id="supplement-form" onsubmit="saveSupplementForm(event)">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="supplement-name">Supplement Name *</label>
                        <input type="text" id="supplement-name" name="name" required 
                               placeholder="Enter supplement name">
                        <small class="form-help">Common or scientific name</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="supplement-category">Category *</label>
                        <select id="supplement-category" name="category" required>
                            <option value="">Select category...</option>
                            <option value="vitamins">Vitamins</option>
                            <option value="minerals">Minerals</option>
                            <option value="antioxidants">Antioxidants</option>
                            <option value="herbs">Herbs & Botanicals</option>
                            <option value="amino_acids">Amino Acids</option>
                            <option value="enzymes">Enzymes</option>
                            <option value="probiotics">Probiotics</option>
                            <option value="fatty_acids">Fatty Acids</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="supplement-description">Description</label>
                    <textarea id="supplement-description" name="description" rows="3" 
                              placeholder="Enter supplement description, benefits, or notes..."></textarea>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label for="supplement-dose">Default Dose</label>
                        <input type="number" id="supplement-dose" name="default_dose" 
                               step="0.1" min="0" placeholder="Enter default dose">
                    </div>
                    
                    <div class="form-group">
                        <label for="supplement-unit">Unit</label>
                        <select id="supplement-unit" name="unit">
                            <option value="mg">mg (milligrams)</option>
                            <option value="g">g (grams)</option>
                            <option value="mcg">mcg (micrograms)</option>
                            <option value="IU">IU (International Units)</option>
                            <option value="ml">ml (milliliters)</option>
                            <option value="drops">drops</option>
                            <option value="capsules">capsules</option>
                            <option value="tablets">tablets</option>
                            <option value="servings">servings</option>
                        </select>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label for="supplement-min-dose">Minimum Dose</label>
                        <input type="number" id="supplement-min-dose" name="min_dose" 
                               step="0.1" min="0" placeholder="Optional minimum dose">
                    </div>
                    
                    <div class="form-group">
                        <label for="supplement-max-dose">Maximum Dose</label>
                        <input type="number" id="supplement-max-dose" name="max_dose" 
                               step="0.1" min="0" placeholder="Optional maximum dose">
                    </div>
                </div>

                <div class="form-group">
                    <label for="supplement-notes">Usage Notes</label>
                    <textarea id="supplement-notes" name="notes" rows="2" 
                              placeholder="Timing, frequency, or special instructions..."></textarea>
                </div>

                <div class="form-checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="supplement-active" name="is_active" checked>
                        <span class="checkmark"></span>
                        Active (available for customer selection)
                    </label>
                    
                    <label class="checkbox-label">
                        <input type="checkbox" id="supplement-featured" name="is_featured">
                        <span class="checkmark"></span>
                        Featured (show prominently in customer portal)
                    </label>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <span id="supplement-save-spinner"></span>
                        <span id="supplement-save-text">Save Supplement</span>
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="hideSupplementForm()">
                        Cancel
                    </button>
                </div>

                <input type="hidden" id="supplement-id" name="id" value="">
            </form>
        </div>
    </div>

    <!-- Supplements Table -->
    <div class="card">
        <div class="card-header">
            <h3>Supplements Database</h3>
            <div class="header-actions">
                <span id="supplements-count">Loading...</span>
                <button class="btn btn-sm" onclick="toggleSupplementsView()">
                    <i class="icon" id="view-toggle-icon">📋</i>
                    <span id="view-toggle-text">Grid View</span>
                </button>
            </div>
        </div>
        
        <div class="table-container">
            <table class="data-table" id="supplements-table">
                <thead>
                    <tr>
                        <th>
                            <input type="checkbox" id="select-all-supplements" 
                                   onchange="toggleAllSupplements()">
                        </th>
                        <th onclick="sortSupplements('name')" class="sortable">
                            Name <span class="sort-indicator"></span>
                        </th>
                        <th onclick="sortSupplements('category')" class="sortable">
                            Category <span class="sort-indicator"></span>
                        </th>
                        <th>Default Dose</th>
                        <th>Usage Count</th>
                        <th onclick="sortSupplements('status')" class="sortable">
                            Status <span class="sort-indicator"></span>
                        </th>
                        <th onclick="sortSupplements('created_at')" class="sortable">
                            Created <span class="sort-indicator"></span>
                        </th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="supplements-table-body">
                    <tr>
                        <td colspan="8">
                            <div class="loading-state">
                                <div class="loading-spinner"></div>
                                <p>Loading supplements...</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Bulk Actions Panel -->
    <div id="supplements-bulk-actions" class="bulk-actions" style="display: none;">
        <div class="bulk-info">
            <span id="supplements-selected-count">0 supplements selected</span>
        </div>
        <div class="bulk-buttons">
            <button class="btn btn-success" onclick="bulkActivateSupplements()">
                <i class="icon">⚡</i> Activate Selected
            </button>
            <button class="btn btn-warning" onclick="bulkDeactivateSupplements()">
                <i class="icon">❌</i> Deactivate Selected
            </button>
            <button class="btn btn-info" onclick="bulkCategorizeSupplements()">
                <i class="icon">🏷️</i> Change Category
            </button>
            <button class="btn btn-danger" onclick="bulkDeleteSupplements()">
                <i class="icon">🗑️</i> Delete Selected
            </button>
            <button class="btn btn-secondary" onclick="clearSupplementsSelection()">
                Clear Selection
            </button>
        </div>
    </div>

    <!-- Supplements Grid View (Alternative) -->
    <div id="supplements-grid" class="supplements-grid" style="display: none;">
        <div id="supplements-grid-container">
            <!-- Grid items will be populated by JavaScript -->
        </div>
    </div>

    <!-- Supplement Quick Add Modal -->
    <div id="quick-add-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Quick Add Supplement</h3>
                <button class="btn-close" onclick="hideQuickAddModal()">×</button>
            </div>
            <div class="modal-body">
                <form id="quick-add-form">
                    <div class="form-group">
                        <label for="quick-name">Name *</label>
                        <input type="text" id="quick-name" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="quick-category">Category *</label>
                            <select id="quick-category" required>
                                <option value="vitamins">Vitamins</option>
                                <option value="minerals">Minerals</option>
                                <option value="antioxidants">Antioxidants</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="quick-dose">Dose</label>
                            <input type="number" id="quick-dose" step="0.1">
                        </div>
                        <div class="form-group">
                            <label for="quick-unit">Unit</label>
                            <select id="quick-unit">
                                <option value="mg">mg</option>
                                <option value="g">g</option>
                                <option value="mcg">mcg</option>
                                <option value="IU">IU</option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="saveQuickAdd()">Add Supplement</button>
                <button class="btn btn-secondary" onclick="hideQuickAddModal()">Cancel</button>
            </div>
        </div>
    </div>
</div>

<style>
/* Supplements-specific styles */
.supplements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px 0;
}

.supplement-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    border: 1px solid #e9ecef;
}

.supplement-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.supplement-card.inactive {
    opacity: 0.6;
    background: #f8f9fa;
}

.supplement-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
}

.supplement-name {
    font-size: 1.1em;
    font-weight: 600;
    color: #333;
    margin: 0;
}

.supplement-category {
    background: #e3f2fd;
    color: #1976d2;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
}

.supplement-dose {
    font-size: 1.2em;
    font-weight: bold;
    color: #667eea;
    margin: 10px 0;
}

.supplement-description {
    font-size: 0.9em;
    color: #666;
    line-height: 1.4;
    margin-bottom: 15px;
}

.supplement-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 15px;
    border-top: 1px solid #e9ecef;
    font-size: 0.8em;
    color: #666;
}

.supplement-actions {
    display: flex;
    gap: 8px;
    margin-top: 15px;
}

.form-checkbox-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin: 20px 0;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
}

.checkbox-label input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #667eea;
}

.form-help {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
}

.bulk-actions {
    background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
    border: 2px solid #667eea;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.bulk-info {
    font-weight: 600;
    color: #333;
}

.bulk-buttons {
    display: flex;
    gap: 10px;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    padding: 20px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-body {
    padding: 20px;
}

.modal-footer {
    padding: 20px;
    border-top: 1px solid #e9ecef;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.btn-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.btn-close:hover {
    background: #f8f9fa;
    color: #333;
}

.sortable {
    cursor: pointer;
    user-select: none;
}

.sortable:hover {
    background: #f8f9fa;
}

.sort-indicator {
    margin-left: 5px;
    opacity: 0.5;
}

.sort-indicator.asc:after {
    content: "↑";
}

.sort-indicator.desc:after {
    content: "↓";
}

@media (max-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .form-checkbox-group {
        grid-template-columns: 1fr;
    }
    
    .bulk-actions {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
    
    .bulk-buttons {
        flex-wrap: wrap;
        justify-content: center;
    }
}
</style>

<script>
// Supplements Management JavaScript
let allSupplements = [];
let filteredSupplements = [];
let selectedSupplements = new Set();
let isGridView = false;
let sortColumn = '';
let sortDirection = 'asc';

// Load supplements from API
async function loadSupplements() {
    console.log('💊 Loading supplements from API...');
    showSupplementAlert('🔄 Loading supplements from database...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/api/supplements`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            allSupplements = data.supplements || [];
            filteredSupplements = [...allSupplements];
            
            updateSupplementStats(allSupplements);
            renderSupplements();
            
            showSupplementAlert(`✅ Loaded ${allSupplements.length} supplements successfully!`, 'success');
            console.log('✅ Supplements loaded:', allSupplements.length);
        } else {
            throw new Error(data.error || 'Failed to load supplements');
        }
    } catch (error) {
        console.error('❌ Error loading supplements:', error);
        showSupplementsError(error.message);
    }
}

// Update supplement statistics
function updateSupplementStats(supplements) {
    const stats = calculateSupplementStats(supplements);
    
    document.getElementById('supplement-total-count').textContent = stats.total;
    document.getElementById('supplement-active-count').textContent = stats.active;
    document.getElementById('supplement-inactive-count').textContent = stats.inactive;
    document.getElementById('supplement-categories-count').textContent = stats.categories;
    
    // Update trends (mock data for now)
    document.getElementById('supplement-total-trend').textContent = '+2 this month';
    document.getElementById('supplement-active-trend').textContent = `${((stats.active/stats.total)*100).toFixed(1)}% active`;
    document.getElementById('supplement-inactive-trend').textContent = `${stats.inactive} inactive`;
    document.getElementById('supplement-categories-trend').textContent = `${stats.categories} categories`;
    
    // Update count display
    document.getElementById('supplements-count').textContent = 
        `${supplements.length} supplement${supplements.length !== 1 ? 's' : ''}`;
}

// Calculate supplement statistics
function calculateSupplementStats(supplements) {
    const stats = {
        total: supplements.length,
        active: 0,
        inactive: 0,
        categories: new Set()
    };
    
    supplements.forEach(supplement => {
        if (supplement.is_active) {
            stats.active++;
        } else {
            stats.inactive++;
        }
        
        if (supplement.category) {
            stats.categories.add(supplement.category);
        }
    });
    
    stats.categories = stats.categories.size;
    return stats;
}

// Render supplements in table or grid view
function renderSupplements() {
    if (isGridView) {
        renderSupplementsGrid();
    } else {
        renderSupplementsTable();
    }
    updateBulkActionsPanel();
}

// Render supplements table
function renderSupplementsTable() {
    const tbody = document.getElementById('supplements-table-body');
    tbody.innerHTML = '';
    
    if (filteredSupplements.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="icon">💊</div>
                        <h4>No Supplements Found</h4>
                        <p>No supplements match your current filters.</p>
                        <button class="btn btn-primary" onclick="showAddSupplementForm()">
                            Add First Supplement
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    filteredSupplements.forEach(supplement => {
        const row = document.createElement('tr');
        row.className = supplement.is_active ? '' : 'inactive-row';
        
        const isSelected = selectedSupplements.has(supplement.id);
        const dose = supplement.default_dose ? 
            `${supplement.default_dose} ${supplement.unit || 'mg'}` : 'Not set';
        const createdDate = new Date(supplement.created_at).toLocaleDateString();
        const usageCount = supplement.usage_count || 0;
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="supplement-checkbox" 
                       data-supplement-id="${supplement.id}" 
                       ${isSelected ? 'checked' : ''}
                       onchange="toggleSupplementSelection(${supplement.id})">
            </td>
            <td>
                <div class="supplement-name-cell">
                    <strong>${supplement.name}</strong>
                    ${supplement.description ? `<div class="supplement-description-preview">${supplement.description.substring(0, 50)}${supplement.description.length > 50 ? '...' : ''}</div>` : ''}
                </div>
            </td>
            <td>
                <span class="category-badge category-${supplement.category || 'other'}">
                    ${formatCategory(supplement.category)}
                </span>
            </td>
            <td>
                <div class="dose-cell">
                    <strong>${dose}</strong>
                    ${supplement.min_dose || supplement.max_dose ? 
                        `<div class="dose-range">Range: ${supplement.min_dose || '0'}-${supplement.max_dose || '∞'} ${supplement.unit || 'mg'}</div>` : ''}
                </div>
            </td>
            <td>
                <span class="usage-count">${usageCount}</span>
                ${usageCount > 0 ? '<span class="usage-indicator">📊</span>' : ''}
            </td>
            <td>
                <span class="status-badge ${supplement.is_active ? 'status-active' : 'status-inactive'}">
                    ${supplement.is_active ? '✅ Active' : '❌ Inactive'}
                </span>
                ${supplement.is_featured ? '<span class="featured-badge">⭐</span>' : ''}
            </td>
            <td>${createdDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editSupplement(${supplement.id})" title="Edit">
                        ✏️
                    </button>
                    <button class="btn btn-sm ${supplement.is_active ? 'btn-warning' : 'btn-success'}" 
                            onclick="${supplement.is_active ? 'deactivateSupplement' : 'activateSupplement'}(${supplement.id})"
                            title="${supplement.is_active ? 'Deactivate' : 'Activate'}">
                        ${supplement.is_active ? '❌' : '⚡'}
                    </button>
                    <button class="btn btn-sm btn-info" onclick="viewSupplementUsage(${supplement.id})" title="View Usage">
                        📊
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSupplement(${supplement.id})" title="Delete">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Show supplement alert
function showSupplementAlert(message, type) {
    const alertDiv = document.getElementById('supplement-alert');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    if (type === 'success') {
        setTimeout(() => {
            alertDiv.innerHTML = '';
        }, 5000);
    }
}

// Show supplements error
function showSupplementsError(errorMessage) {
    const tbody = document.getElementById('supplements-table-body');
    tbody.innerHTML = `
        <tr>
            <td colspan="8">
                <div class="error-state">
                    <div class="icon">⚠️</div>
                    <h4>Error Loading Supplements</h4>
                    <p>${errorMessage}</p>
                    <button class="btn btn-primary" onclick="loadSupplements()">
                        🔄 Retry
                    </button>
                </div>
            </td>
        </tr>
    `;
    showSupplementAlert('❌ Failed to load supplements.', 'error');
}

// Format category for display
function formatCategory(category) {
    if (!category) return 'Other';
    return category.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Filter supplements based on search and filters
function filterSupplements() {
    const searchTerm = document.getElementById('supplement-search').value.toLowerCase();
    const categoryFilter = document.getElementById('supplement-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    filteredSupplements = allSupplements.filter(supplement => {
        const matchesSearch = !searchTerm || 
            supplement.name.toLowerCase().includes(searchTerm) ||
            (supplement.description && supplement.description.toLowerCase().includes(searchTerm));
            
        const matchesCategory = !categoryFilter || supplement.category === categoryFilter;
        
        const matchesStatus = !statusFilter || 
            (statusFilter === 'active' && supplement.is_active) ||
            (statusFilter === 'inactive' && !supplement.is_active);
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    renderSupplements();
}

// Show add supplement form
function showAddSupplementForm() {
    document.getElementById('supplement-form-title').textContent = 'Add New Supplement';
    document.getElementById('supplement-form-container').style.display = 'block';
    document.getElementById('supplement-id').value = '';
    clearSupplementForm();
    document.getElementById('supplement-name').focus();
}

// Hide supplement form
function hideSupplementForm() {
    document.getElementById('supplement-form-container').style.display = 'none';
    clearSupplementForm();
}

// Clear supplement form
function clearSupplementForm() {
    document.getElementById('supplement-form').reset();
    document.getElementById('supplement-active').checked = true;
    document.getElementById('supplement-featured').checked = false;
}

// Save supplement form
async function saveSupplementForm(event) {
    event.preventDefault();
    
    const formData = new FormData(document.getElementById('supplement-form'));
    const id = formData.get('id');
    const isEdit = id && id !== '';
    
    const supplementData = {
        name: formData.get('name').trim(),
        category: formData.get('category'),
        description: formData.get('description').trim(),
        default_dose: formData.get('default_dose') || null,
        unit: formData.get('unit'),
        min_dose: formData.get('min_dose') || null,
        max_dose: formData.get('max_dose') || null,
        notes: formData.get('notes').trim(),
        is_active: formData.has('is_active'),
        is_featured: formData.has('is_featured')
    };
    
    // Validation
    if (!supplementData.name || !supplementData.category) {
        showSupplementAlert('❌ Please fill in all required fields (Name and Category)', 'error');
        return;
    }
    
    try {
        showSupplementAlert('🔄 Saving supplement...', 'info');
        
        const saveBtn = document.querySelector('#supplement-form button[type="submit"]');
        const spinner = document.getElementById('supplement-save-spinner');
        const saveText = document.getElementById('supplement-save-text');
        
        saveBtn.disabled = true;
        spinner.innerHTML = '<span class="loading-spinner"></span>';
        saveText.textContent = isEdit ? 'Updating...' : 'Creating...';
        
        const url = isEdit ? `${API_BASE}/api/supplements/${id}` : `${API_BASE}/api/supplements`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplementData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSupplementAlert(`✅ Supplement ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
            hideSupplementForm();
            loadSupplements();
        } else {
            throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} supplement`);
        }
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showSupplementAlert(`❌ Failed to save supplement: ${error.message}`, 'error');
    } finally {
        const saveBtn = document.querySelector('#supplement-form button[type="submit"]');
        const spinner = document.getElementById('supplement-save-spinner');
        const saveText = document.getElementById('supplement-save-text');
        
        saveBtn.disabled = false;
        spinner.innerHTML = '';
        saveText.textContent = 'Save Supplement';
    }
}

// Edit supplement
async function editSupplement(id) {
    const supplement = allSupplements.find(s => s.id === id);
    if (!supplement) {
        showSupplementAlert('❌ Supplement not found', 'error');
        return;
    }
    
    document.getElementById('supplement-form-title').textContent = 'Edit Supplement';
    document.getElementById('supplement-id').value = id;
    document.getElementById('supplement-name').value = supplement.name;
    document.getElementById('supplement-category').value = supplement.category || '';
    document.getElementById('supplement-description').value = supplement.description || '';
    document.getElementById('supplement-dose').value = supplement.default_dose || '';
    document.getElementById('supplement-unit').value = supplement.unit || 'mg';
    document.getElementById('supplement-min-dose').value = supplement.min_dose || '';
    document.getElementById('supplement-max-dose').value = supplement.max_dose || '';
    document.getElementById('supplement-notes').value = supplement.notes || '';
    document.getElementById('supplement-active').checked = supplement.is_active;
    document.getElementById('supplement-featured').checked = supplement.is_featured || false;
    
    document.getElementById('supplement-form-container').style.display = 'block';
    document.getElementById('supplement-name').focus();
}

// Activate supplement
async function activateSupplement(id) {
    await toggleSupplementStatus(id, true);
}

// Deactivate supplement
async function deactivateSupplement(id) {
    await toggleSupplementStatus(id, false);
}

// Toggle supplement status
async function toggleSupplementStatus(id, isActive) {
    const supplement = allSupplements.find(s => s.id === id);
    if (!supplement) {
        showSupplementAlert('❌ Supplement not found', 'error');
        return;
    }
    
    const action = isActive ? 'activate' : 'deactivate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${supplement.name}"?`)) return;
    
    try {
        showSupplementAlert(`🔄 ${action.charAt(0).toUpperCase() + action.slice(1)}ing supplement...`, 'info');
        
        const response = await fetch(`${API_BASE}/api/supplements/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...supplement, is_active: isActive })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSupplementAlert(`✅ Supplement ${action}d successfully!`, 'success');
            loadSupplements();
        } else {
            throw new Error(data.error || `Failed to ${action} supplement`);
        }
    } catch (error) {
        console.error(`❌ Error ${action}ing supplement:`, error);
        showSupplementAlert(`❌ Failed to ${action} supplement: ${error.message}`, 'error');
    }
}

// Delete supplement
async function deleteSupplement(id) {
    const supplement = allSupplements.find(s => s.id === id);
    if (!supplement) {
        showSupplementAlert('❌ Supplement not found', 'error');
        return;
    }
    
    if (!confirm(`Delete "${supplement.name}"?\n\nThis action cannot be undone and will remove all associated data.`)) return;
    
    try {
        showSupplementAlert('🔄 Deleting supplement...', 'info');
        
        const response = await fetch(`${API_BASE}/api/supplements/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSupplementAlert(`✅ Supplement "${supplement.name}" deleted successfully!`, 'success');
            selectedSupplements.delete(id);
            loadSupplements();
        } else {
            throw new Error(data.error || 'Failed to delete supplement');
        }
    } catch (error) {
        console.error('❌ Error deleting supplement:', error);
        showSupplementAlert(`❌ Failed to delete supplement: ${error.message}`, 'error');
    }
}

// View supplement usage
async function viewSupplementUsage(id) {
    const supplement = allSupplements.find(s => s.id === id);
    if (!supplement) {
        showSupplementAlert('❌ Supplement not found', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/supplements/${id}/usage`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            const usage = data.usage;
            const details = `
Supplement: ${supplement.name}
Total Usage: ${usage.total_uses || 0} times
Active Users: ${usage.active_users || 0}
Average Dose: ${usage.average_dose || 'N/A'} ${supplement.unit || 'mg'}
Most Common Dose: ${usage.most_common_dose || 'N/A'} ${supplement.unit || 'mg'}
Last Used: ${usage.last_used ? new Date(usage.last_used).toLocaleDateString() : 'Never'}
            `;
            
            alert(`Usage Statistics:\n\n${details}`);
        } else {
            // Show basic info if usage API not available
            const basicInfo = `
Supplement: ${supplement.name}
Category: ${formatCategory(supplement.category)}
Default Dose: ${supplement.default_dose || 'Not set'} ${supplement.unit || 'mg'}
Status: ${supplement.is_active ? 'Active' : 'Inactive'}
Created: ${new Date(supplement.created_at).toLocaleDateString()}
            `;
            
            alert(`Supplement Information:\n\n${basicInfo}`);
        }
    } catch (error) {
        console.error('❌ Error loading usage data:', error);
        showSupplementAlert('❌ Unable to load usage statistics', 'error');
    }
}

// Export supplements
async function exportSupplements() {
    try {
        showSupplementAlert('📊 Exporting supplement data...', 'info');
        
        const exportData = {
            export_type: 'supplements',
            export_date: new Date().toISOString(),
            total_records: allSupplements.length,
            filters_applied: {
                search: document.getElementById('supplement-search').value,
                category: document.getElementById('supplement-filter').value,
                status: document.getElementById('status-filter').value
            },
            supplements: filteredSupplements.map(supplement => ({
                id: supplement.id,
                name: supplement.name,
                category: supplement.category,
                description: supplement.description,
                default_dose: supplement.default_dose,
                unit: supplement.unit,
                min_dose: supplement.min_dose,
                max_dose: supplement.max_dose,
                notes: supplement.notes,
                is_active: supplement.is_active,
                is_featured: supplement.is_featured,
                created_at: supplement.created_at,
                updated_at: supplement.updated_at
            }))
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nad_supplements_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showSupplementAlert('✅ Supplement data exported successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Export error:', error);
        showSupplementAlert('❌ Failed to export supplement data', 'error');
    }
}

// Toggle between table and grid view
function toggleSupplementsView() {
    isGridView = !isGridView;
    
    const table = document.getElementById('supplements-table').parentElement;
    const grid = document.getElementById('supplements-grid');
    const toggleIcon = document.getElementById('view-toggle-icon');
    const toggleText = document.getElementById('view-toggle-text');
    
    if (isGridView) {
        table.style.display = 'none';
        grid.style.display = 'block';
        toggleIcon.textContent = '📋';
        toggleText.textContent = 'Table View';
        renderSupplementsGrid();
    } else {
        table.style.display = 'block';
        grid.style.display = 'none';
        toggleIcon.textContent = '🏠';
        toggleText.textContent = 'Grid View';
        renderSupplementsTable();
    }
}

// Render supplements grid
function renderSupplementsGrid() {
    const container = document.getElementById('supplements-grid-container');
    container.innerHTML = '';
    
    if (filteredSupplements.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">💊</div>
                <h4>No Supplements Found</h4>
                <p>No supplements match your current filters.</p>
                <button class="btn btn-primary" onclick="showAddSupplementForm()">
                    Add First Supplement
                </button>
            </div>
        `;
        return;
    }
    
    filteredSupplements.forEach(supplement => {
        const card = document.createElement('div');
        card.className = `supplement-card ${supplement.is_active ? '' : 'inactive'}`;
        
        const dose = supplement.default_dose ? 
            `${supplement.default_dose} ${supplement.unit || 'mg'}` : 'Dose not set';
        
        card.innerHTML = `
            <div class="supplement-header">
                <div>
                    <h3 class="supplement-name">${supplement.name}</h3>
                    <span class="supplement-category">${formatCategory(supplement.category)}</span>
                </div>
                <input type="checkbox" class="supplement-checkbox" 
                       data-supplement-id="${supplement.id}" 
                       ${selectedSupplements.has(supplement.id) ? 'checked' : ''}
                       onchange="toggleSupplementSelection(${supplement.id})">
            </div>
            
            <div class="supplement-dose">${dose}</div>
            
            ${supplement.description ? 
                `<div class="supplement-description">${supplement.description}</div>` : ''}
            
            <div class="supplement-stats">
                <span>${supplement.is_active ? '✅ Active' : '❌ Inactive'}</span>
                <span>${supplement.usage_count || 0} uses</span>
                ${supplement.is_featured ? '<span>⭐ Featured</span>' : ''}
            </div>
            
            <div class="supplement-actions">
                <button class="btn btn-sm btn-primary" onclick="editSupplement(${supplement.id})">
                    ✏️ Edit
                </button>
                <button class="btn btn-sm ${supplement.is_active ? 'btn-warning' : 'btn-success'}" 
                        onclick="${supplement.is_active ? 'deactivateSupplement' : 'activateSupplement'}(${supplement.id})">
                    ${supplement.is_active ? '❌ Deactivate' : '⚡ Activate'}
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSupplement(${supplement.id})">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Bulk action functions
function toggleSupplementSelection(id) {
    if (selectedSupplements.has(id)) {
        selectedSupplements.delete(id);
    } else {
        selectedSupplements.add(id);
    }
    updateBulkActionsPanel();
}

function toggleAllSupplements() {
    const selectAllCheckbox = document.getElementById('select-all-supplements');
    
    if (selectAllCheckbox.checked) {
        filteredSupplements.forEach(supplement => {
            selectedSupplements.add(supplement.id);
        });
    } else {
        selectedSupplements.clear();
    }
    
    document.querySelectorAll('.supplement-checkbox').forEach(checkbox => {
        checkbox.checked = selectedSupplements.has(parseInt(checkbox.dataset.supplementId));
    });
    
    updateBulkActionsPanel();
}

function updateBulkActionsPanel() {
    const selectedCount = selectedSupplements.size;
    const bulkPanel = document.getElementById('supplements-bulk-actions');
    const countSpan = document.getElementById('supplements-selected-count');
    
    countSpan.textContent = `${selectedCount} supplement${selectedCount !== 1 ? 's' : ''} selected`;
    
    if (selectedCount > 0) {
        bulkPanel.style.display = 'flex';
    } else {
        bulkPanel.style.display = 'none';
    }
    
    // Update select all checkbox state
    const selectAllCheckbox = document.getElementById('select-all-supplements');
    const totalVisible = filteredSupplements.length;
    
    if (selectedCount === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (selectedCount === totalVisible) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else {
        selectAllCheckbox.indeterminate = true;
        selectAllCheckbox.checked = false;
    }
}

function clearSupplementsSelection() {
    selectedSupplements.clear();
    document.querySelectorAll('.supplement-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateBulkActionsPanel();
    showSupplementAlert('🔄 Selection cleared', 'info');
}

async function bulkActivateSupplements() {
    if (selectedSupplements.size === 0) {
        showSupplementAlert('❌ No supplements selected', 'warning');
        return;
    }
    
    const selectedIds = Array.from(selectedSupplements);
    if (!confirm(`Activate ${selectedIds.length} selected supplements?`)) return;
    
    try {
        showSupplementAlert('🔄 Activating selected supplements...', 'info');
        
        const promises = selectedIds.map(id => 
            fetch(`${API_BASE}/api/supplements/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ...allSupplements.find(s => s.id === id), 
                    is_active: true 
                })
            })
        );
        
        const results = await Promise.all(promises);
        const successful = results.filter(r => r.ok).length;
        
        showSupplementAlert(`✅ Successfully activated ${successful} supplements!`, 'success');
        clearSupplementsSelection();
        loadSupplements();
        
    } catch (error) {
        console.error('❌ Error in bulk activation:', error);
        showSupplementAlert(`❌ Failed to activate supplements: ${error.message}`, 'error');
    }
}

async function bulkDeactivateSupplements() {
    if (selectedSupplements.size === 0) {
        showSupplementAlert('❌ No supplements selected', 'warning');
        return;
    }
    
    const selectedIds = Array.from(selectedSupplements);
    if (!confirm(`Deactivate ${selectedIds.length} selected supplements?`)) return;
    
    try {
        showSupplementAlert('🔄 Deactivating selected supplements...', 'info');
        
        const promises = selectedIds.map(id => 
            fetch(`${API_BASE}/api/supplements/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ...allSupplements.find(s => s.id === id), 
                    is_active: false 
                })
            })
        );
        
        const results = await Promise.all(promises);
        const successful = results.filter(r => r.ok).length;
        
        showSupplementAlert(`✅ Successfully deactivated ${successful} supplements!`, 'success');
        clearSupplementsSelection();
        loadSupplements();
        
    } catch (error) {
        console.error('❌ Error in bulk deactivation:', error);
        showSupplementAlert(`❌ Failed to deactivate supplements: ${error.message}`, 'error');
    }
}

async function bulkCategorizeSupplements() {
    if (selectedSupplements.size === 0) {
        showSupplementAlert('❌ No supplements selected', 'warning');
        return;
    }
    
    const newCategory = prompt(`Change category for ${selectedSupplements.size} supplements to:\n\nvitamins, minerals, antioxidants, herbs, amino_acids, enzymes, probiotics, fatty_acids, other`);
    
    if (!newCategory) return;
    
    const validCategories = ['vitamins', 'minerals', 'antioxidants', 'herbs', 'amino_acids', 'enzymes', 'probiotics', 'fatty_acids', 'other'];
    if (!validCategories.includes(newCategory)) {
        showSupplementAlert('❌ Invalid category. Valid options: ' + validCategories.join(', '), 'error');
        return;
    }
    
    try {
        showSupplementAlert('🔄 Updating categories...', 'info');
        
        const selectedIds = Array.from(selectedSupplements);
        const promises = selectedIds.map(id => 
            fetch(`${API_BASE}/api/supplements/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ...allSupplements.find(s => s.id === id), 
                    category: newCategory 
                })
            })
        );
        
        const results = await Promise.all(promises);
        const successful = results.filter(r => r.ok).length;
        
        showSupplementAlert(`✅ Successfully updated ${successful} supplement categories!`, 'success');
        clearSupplementsSelection();
        loadSupplements();
        
    } catch (error) {
        console.error('❌ Error in bulk categorization:', error);
        showSupplementAlert(`❌ Failed to update categories: ${error.message}`, 'error');
    }
}

async function bulkDeleteSupplements() {
    if (selectedSupplements.size === 0) {
        showSupplementAlert('❌ No supplements selected', 'warning');
        return;
    }
    
    const selectedIds = Array.from(selectedSupplements);
    if (!confirm(`Delete ${selectedIds.length} selected supplements?\n\nThis action cannot be undone and will remove all associated data.`)) return;
    
    try {
        showSupplementAlert('🔄 Deleting selected supplements...', 'info');
        
        const promises = selectedIds.map(id => 
            fetch(`${API_BASE}/api/supplements/${id}`, {
                method: 'DELETE'
            })
        );
        
        const results = await Promise.all(promises);
        const successful = results.filter(r => r.ok).length;
        
        showSupplementAlert(`✅ Successfully deleted ${successful} supplements!`, 'success');
        clearSupplementsSelection();
        loadSupplements();
        
    } catch (error) {
        console.error('❌ Error in bulk deletion:', error);
        showSupplementAlert(`❌ Failed to delete supplements: ${error.message}`, 'error');
    }
}

// Sorting functions
function sortSupplements(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    filteredSupplements.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        // Handle special cases
        if (column === 'name') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        } else if (column === 'category') {
            aVal = formatCategory(aVal);
            bVal = formatCategory(bVal);
        } else if (column === 'status') {
            aVal = a.is_active ? 'active' : 'inactive';
            bVal = b.is_active ? 'active' : 'inactive';
        } else if (column === 'created_at') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }
        
        if (sortDirection === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
    });
    
    // Update sort indicators
    document.querySelectorAll('.sort-indicator').forEach(indicator => {
        indicator.className = 'sort-indicator';
    });
    
    const currentIndicator = document.querySelector(`th[onclick="sortSupplements('${column}')"] .sort-indicator`);
    if (currentIndicator) {
        currentIndicator.className = `sort-indicator ${sortDirection}`;
    }
    
    renderSupplements();
}

// Quick add modal functions
function showQuickAddModal() {
    document.getElementById('quick-add-modal').style.display = 'flex';
    document.getElementById('quick-name').focus();
}

function hideQuickAddModal() {
    document.getElementById('quick-add-modal').style.display = 'none';
    document.getElementById('quick-add-form').reset();
}

async function saveQuickAdd() {
    const name = document.getElementById('quick-name').value.trim();
    const category = document.getElementById('quick-category').value;
    const dose = document.getElementById('quick-dose').value;
    const unit = document.getElementById('quick-unit').value;
    
    if (!name || !category) {
        alert('Please fill in all required fields (Name and Category)');
        return;
    }
    
    const supplementData = {
        name: name,
        category: category,
        default_dose: dose || null,
        unit: unit,
        is_active: true
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/supplements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplementData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSupplementAlert(`✅ Supplement "${name}" added successfully!`, 'success');
            hideQuickAddModal();
            loadSupplements();
        } else {
            throw new Error(data.error || 'Failed to create supplement');
        }
    } catch (error) {
        console.error('❌ Error in quick add:', error);
        alert(`Failed to add supplement: ${error.message}`);
    }
}

// Initialize supplements section
function initializeSupplements() {
    console.log('💊 Initializing supplements section...');
    
    // Load supplements when section becomes active
    loadSupplements();
    
    // Set up search debouncing
    let searchTimeout;
    document.getElementById('supplement-search').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterSupplements, 300);
    });
    
    console.log('✅ Supplements section initialized');
}

// Auto-load supplements when section becomes visible
document.addEventListener('DOMContentLoaded', function() {
    // Check if supplements section is active and load data
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const supplementsSection = document.getElementById('supplements');
                if (supplementsSection && supplementsSection.style.display !== 'none') {
                    initializeSupplements();
                    observer.disconnect(); // Stop observing once initialized
                }
            }
        });
    });
    
    const supplementsSection = document.getElementById('supplements');
    if (supplementsSection) {
        observer.observe(supplementsSection, { attributes: true });
    }
});

// Make functions globally accessible
window.loadSupplements = loadSupplements;
window.showAddSupplementForm = showAddSupplementForm;
window.hideSupplementForm = hideSupplementForm;
window.saveSupplementForm = saveSupplementForm;
window.editSupplement = editSupplement;
window.activateSupplement = activateSupplement;
window.deactivateSupplement = deactivateSupplement;
window.deleteSupplement = deleteSupplement;
window.viewSupplementUsage = viewSupplementUsage;
window.exportSupplements = exportSupplements;
window.filterSupplements = filterSupplements;
window.toggleSupplementsView = toggleSupplementsView;
window.toggleSupplementSelection = toggleSupplementSelection;
window.toggleAllSupplements = toggleAllSupplements;
window.clearSupplementsSelection = clearSupplementsSelection;
window.bulkActivateSupplements = bulkActivateSupplements;
window.bulkDeactivateSupplements = bulkDeactivateSupplements;
window.bulkCategorizeSupplements = bulkCategorizeSupplements;
window.bulkDeleteSupplements = bulkDeleteSupplements;
window.sortSupplements = sortSupplements;
window.showQuickAddModal = showQuickAddModal;
window.hideQuickAddModal = hideQuickAddModal;
window.saveQuickAdd = saveQuickAdd;
window.initializeSupplements = initializeSupplements;

console.log('✅ Supplements section loaded successfully!');
</script>
