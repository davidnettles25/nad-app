// NAD Admin Dashboard - Fixed JavaScript
// Add this to your admin-dashboard.js file or create it if missing

// Configuration
const API_BASE = 'https://mynadtest.info';

// Global variables
let allTests = [];
let filteredTests = [];
let selectedTests = new Set();
let allSupplements = [];
let filteredSupplements = [];

console.log('🚀 NAD Admin Dashboard JavaScript Loaded');
console.log('📡 API Base:', API_BASE);

// ============================================================================
// DASHBOARD STATS FUNCTIONS (THE MISSING FUNCTION!)
// ============================================================================

async function loadDashboardStats() {
    console.log('📊 Loading dashboard statistics...');
    try {
        const response = await fetch(`${API_BASE}/api/dashboard/stats`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            updateDashboardStats(data.stats);
            console.log('✅ Dashboard stats loaded:', data.stats);
            showAlert('✅ Dashboard statistics loaded successfully!', 'success');
        } else {
            console.error('❌ Failed to load dashboard stats:', data.error);
            updateDashboardStats({
                total_tests: 0,
                completed_tests: 0,
                pending_tests: 0,
                activated_tests: 0
            });
            showAlert('⚠️ Could not load dashboard statistics from API', 'warning');
        }
    } catch (error) {
        console.error('❌ Error loading dashboard stats:', error);
        updateDashboardStats({
            total_tests: 0,
            completed_tests: 0,
            pending_tests: 0,
            activated_tests: 0
        });
        showAlert('❌ Failed to connect to API for dashboard statistics', 'error');
    }
}

function updateDashboardStats(stats) {
    console.log('📈 Updating dashboard stats display with:', stats);
    
    // Update individual stat cards
    const elements = {
        'total-tests': stats.total_tests || 0,
        'completed-tests': stats.completed_tests || 0,
        'pending-tests': stats.pending_tests || 0,
        'active-users': stats.activated_tests || 0
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            console.log(`✅ Updated ${id}: ${value}`);
        } else {
            console.log(`⚠️ Element not found: ${id}`);
        }
    });
    
    // Calculate rates
    const total = stats.total_tests || 1;
    const activationRate = ((stats.activated_tests / total) * 100).toFixed(1);
    const completionRate = ((stats.completed_tests / total) * 100).toFixed(1);
    
    // Update overview stats if element exists
    const overviewStats = document.getElementById('overview-stats');
    if (overviewStats) {
        overviewStats.innerHTML = `
            📊 <strong>${stats.total_tests} tests created</strong> • 
            🎯 <strong>${stats.activated_tests} activated (${activationRate}%)</strong> • 
            ⏳ <strong>${stats.pending_tests} pending</strong> • 
            🏁 <strong>${stats.completed_tests} completed (${completionRate}%)</strong>
        `;
        console.log('✅ Updated overview stats');
    }
}

// ============================================================================
// NAVIGATION FUNCTIONS
// ============================================================================

function showSection(sectionName) {
    console.log('📍 Switching to section:', sectionName);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('✅ Section activated:', sectionName);
    } else {
        console.error('❌ Section not found:', sectionName);
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const navLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    // Auto-load data when switching sections
    switch(sectionName) {
        case 'overview':
            loadDashboardStats();
            break;
        case 'users':
            if (typeof loadUsers === 'function') {
                loadUsers();
            } else {
                showAlert('Users section coming soon!', 'info');
            }
            break;
        case 'tests':
            if (typeof loadTestsFromAPI === 'function') {
                loadTestsFromAPI();
            } else {
                showAlert('Tests section coming soon!', 'info');
            }
            break;
        case 'supplements':
            if (typeof loadSupplements === 'function') {
                loadSupplements();
            } else {
                showAlert('Supplements section coming soon!', 'info');
            }
            break;
        case 'analytics':
            if (typeof loadAnalytics === 'function') {
                loadAnalytics();
            } else {
                showAlert('Analytics section coming soon!', 'info');
            }
            break;
        case 'system':
            if (typeof testSystemHealth === 'function') {
                testSystemHealth();
            } else {
                showAlert('System health check coming soon!', 'info');
            }
            break;
        default:
            console.log('📍 Section loaded:', sectionName);
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showAlert(message, type = 'info') {
    console.log('📢 Alert:', message, '(Type:', type + ')');
    
    // Try to find section-specific alert div first
    const activeSection = document.querySelector('.content-section.active');
    let alertId = 'global-alert'; // default
    
    if (activeSection) {
        alertId = activeSection.id + '-alert';
    }
    
    let alertDiv = document.getElementById(alertId);
    
    // If section-specific alert doesn't exist, use global alert
    if (!alertDiv) {
        alertDiv = document.getElementById('global-alert');
    }
    
    // If still no alert div, create one
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.id = 'global-alert';
        alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; max-width: 400px;';
        document.body.appendChild(alertDiv);
    }
    
    if (alertDiv) {
        alertDiv.innerHTML = `<div class="alert alert-${type}" style="padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid; font-weight: 500;">${message}</div>`;
        
        // Set colors based on type
        const alertElement = alertDiv.querySelector('.alert');
        if (alertElement) {
            switch(type) {
                case 'success':
                    alertElement.style.backgroundColor = '#d4edda';
                    alertElement.style.color = '#155724';
                    alertElement.style.borderColor = '#c3e6cb';
                    break;
                case 'error':
                    alertElement.style.backgroundColor = '#f8d7da';
                    alertElement.style.color = '#721c24';
                    alertElement.style.borderColor = '#f5c6cb';
                    break;
                case 'warning':
                    alertElement.style.backgroundColor = '#fff3cd';
                    alertElement.style.color = '#856404';
                    alertElement.style.borderColor = '#ffeaa7';
                    break;
                default: // info
                    alertElement.style.backgroundColor = '#d1ecf1';
                    alertElement.style.color = '#0c5460';
                    alertElement.style.borderColor = '#bee5eb';
            }
        }
        
        // Auto-hide success and info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                if (alertDiv.innerHTML) {
                    alertDiv.innerHTML = '';
                }
            }, 5000);
        }
    }
}

function refreshData() {
    console.log('🔄 Refreshing dashboard data...');
    showAlert('🔄 Refreshing data from API...', 'info');
    
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        switch (activeSection.id) {
            case 'overview':
                loadDashboardStats();
                break;
            case 'users':
                if (typeof loadUsers === 'function') loadUsers();
                break;
            case 'tests':
                if (typeof loadTestsFromAPI === 'function') loadTestsFromAPI();
                break;
            case 'supplements':
                if (typeof loadSupplements === 'function') loadSupplements();
                break;
            case 'analytics':
                if (typeof loadAnalytics === 'function') loadAnalytics();
                break;
            case 'system':
                if (typeof testSystemHealth === 'function') testSystemHealth();
                break;
            default:
                loadDashboardStats();
        }
    } else {
        loadDashboardStats();
    }
}

// ============================================================================
// PLACEHOLDER FUNCTIONS (replace these with real implementations later)
// ============================================================================





function testSystemHealth() {
    showAlert('🔍 System health check coming soon!', 'info');
}

// ============================================================================
// SYSTEM HEALTH TESTING FUNCTION
// ============================================================================

async function testSystemHealth() {
    console.log('🔍 Testing system health...');
    
    const checks = document.getElementById('system-checks');
    const statusAlert = document.getElementById('system-status-alert');
    
    // Add null checks to prevent errors
    if (!checks) {
        console.log('⚠️ System health UI elements not available (section not active)');
        showAlert('🔍 System health: API connectivity test...', 'info');
        
        try {
            const response = await fetch(`${API_BASE}/api/dashboard/stats`);
            const working = response.ok;
            showAlert(
                working ? '✅ System health: API is responding normally' : '❌ System health: API connection issues detected',
                working ? 'success' : 'error'
            );
        } catch (error) {
            showAlert('❌ System health: Cannot connect to API', 'error');
        }
        return;
    }
    
    try {
        // Test API connectivity
        checks.innerHTML = '<li>🔄 Testing API connectivity...</li>';
        
        const apiResponse = await fetch(`${API_BASE}/api/dashboard/stats`);
        const apiWorking = apiResponse.ok;
        
        let healthStatus = '';
        
        if (apiWorking) {
            const data = await apiResponse.json();
            healthStatus = `
                <li>✅ API connectivity: Working</li>
                <li>✅ Database connection: ${data.success ? 'Connected' : 'Issues detected'}</li>
                <li>✅ Dashboard stats: ${data.stats ? 'Available' : 'Limited'}</li>
            `;
        } else {
            healthStatus = `
                <li>❌ API connectivity: Failed (Status: ${apiResponse.status})</li>
                <li>❓ Database connection: Cannot verify</li>
                <li>❓ Dashboard stats: Cannot verify</li>
            `;
        }
        
        checks.innerHTML = healthStatus;
        
        if (statusAlert) {
            statusAlert.innerHTML = `
                <div class="alert alert-${apiWorking ? 'success' : 'warning'}">
                    <h4>${apiWorking ? '✅ System Status: All Good' : '⚠️ System Status: Some Issues'}</h4>
                </div>
            `;
        }
        
        showAlert(
            apiWorking ? '✅ System health check completed - all systems operational!' : '⚠️ System health check completed - some issues detected',
            apiWorking ? 'success' : 'warning'
        );
        
    } catch (error) {
        console.error('❌ System health check failed:', error);
        
        if (checks) {
            checks.innerHTML = `
                <li>❌ API connectivity: Network error</li>
                <li>❓ Database connection: Cannot verify</li>
                <li>❓ Dashboard stats: Cannot verify</li>
            `;
        }
        
        if (statusAlert) {
            statusAlert.innerHTML = `
                <div class="alert alert-danger">
                    <h4>❌ System Status: Connection Failed</h4>
                    <p>Cannot connect to API server. Please check network connectivity.</p>
                </div>
            `;
        }
        
        showAlert('❌ System health check failed - cannot connect to API', 'error');
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Make functions globally accessible
window.loadDashboardStats = loadDashboardStats;
window.showSection = showSection;
window.showAlert = showAlert;
window.refreshData = refreshData;
window.testSystemHealth = testSystemHealth;

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ NAD Admin Dashboard DOM loaded, initializing...');
    
    // Setup navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
        });
    });
    
    // Load initial data after a short delay
    setTimeout(() => {
        console.log('🔄 Loading initial dashboard stats...');
        loadDashboardStats();
    }, 1000);
    
    // Show welcome message
    setTimeout(() => {
        showAlert('✅ NAD Admin Dashboard loaded successfully!', 'success');
    }, 2000);
    
    console.log('🎯 NAD Admin Dashboard initialization complete!');
});

console.log('📋 Admin Dashboard JavaScript file loaded successfully');
// ============================================================================
// SUPPLEMENT MANAGEMENT FUNCTIONS - REAL IMPLEMENTATION
// ============================================================================

async function loadSupplements() {
    console.log('💊 Loading supplements from API...');
    showAlert('🔄 Loading supplements from database...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/api/supplements`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            allSupplements = data.supplements || [];
            filteredSupplements = [...allSupplements];
            
            updateSupplementStats(allSupplements);
            renderSupplementsTable();
            
            showAlert(`✅ Loaded ${allSupplements.length} supplements successfully!`, 'success');
            console.log('✅ Supplements loaded:', allSupplements.length);
        } else {
            throw new Error(data.error || 'Failed to load supplements');
        }
    } catch (error) {
        console.error('❌ Error loading supplements:', error);
        showSupplementsError(error.message);
    }
}

function updateSupplementStats(supplements) {
    const stats = calculateSupplementStats(supplements);
    
    const totalElement = document.getElementById('supplement-total-count');
    const activeElement = document.getElementById('supplement-active-count');
    const inactiveElement = document.getElementById('supplement-inactive-count');
    const categoriesElement = document.getElementById('supplement-categories-count');
    
    if (totalElement) totalElement.textContent = stats.total;
    if (activeElement) activeElement.textContent = stats.active;
    if (inactiveElement) inactiveElement.textContent = stats.inactive;
    if (categoriesElement) categoriesElement.textContent = stats.categories;
    
    console.log('📊 Supplement stats updated:', stats);
}

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

function renderSupplementsTable() {
    const tbody = document.getElementById('supplements-table-body');
    if (!tbody) {
        console.error('❌ supplements-table-body element not found');
        return;
    }
    
    if (filteredSupplements.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="icon">💊</div>
                        <h4>No Supplements Found</h4>
                        <p>No supplements found or API connection failed.</p>
                        <button class="btn" onclick="loadSupplements()" style="margin-top: 15px;">
                            🔄 Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    filteredSupplements.forEach(supplement => {
        const row = document.createElement('tr');
        row.className = supplement.is_active ? '' : 'inactive-row';
        
        const dose = supplement.default_dose ? 
            `${supplement.default_dose} ${supplement.unit || 'mg'}` : 'Not set';
        
        row.innerHTML = `
            <td>
                <strong>${supplement.name}</strong>
                <div style="font-size: 12px; color: #666; margin-top: 2px;">
                    ${supplement.description || 'No description'}
                </div>
            </td>
            <td>
                <span class="status-badge">${supplement.category || 'Other'}</span>
            </td>
            <td>${dose}</td>
            <td>
                <span class="status-badge ${supplement.is_active ? 'status-activated' : 'status-not-activated'}">
                    ${supplement.is_active ? '✅ Active' : '❌ Inactive'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editSupplement(${supplement.id})" title="Edit">
                    ✏️ Edit
                </button>
                <button class="btn btn-sm ${supplement.is_active ? 'btn-warning' : 'btn-success'}" 
                        onclick="${supplement.is_active ? 'deactivateSupplement' : 'activateSupplement'}(${supplement.id})"
                        title="${supplement.is_active ? 'Deactivate' : 'Activate'}">
                    ${supplement.is_active ? '❌ Deactivate' : '⚡ Activate'}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('📊 Rendered supplements table with', filteredSupplements.length, 'items');
}

function showSupplementsError(errorMessage) {
    const tbody = document.getElementById('supplements-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="5">
                <div class="empty-state">
                    <div class="icon">⚠️</div>
                    <h4>Error Loading Supplements</h4>
                    <p>${errorMessage}</p>
                    <button class="btn" onclick="loadSupplements()" style="margin-top: 15px;">
                        🔄 Retry
                    </button>
                </div>
            </td>
        </tr>
    `;
    showAlert('❌ Failed to load supplements.', 'error');
}

// Placeholder functions for supplement actions (implement these later)
function editSupplement(id) {
    showAlert(`✏️ Edit supplement ${id} - Form coming soon!`, 'info');
}

function activateSupplement(id) {
    showAlert(`⚡ Activate supplement ${id} - Feature coming soon!`, 'info');
}

function deactivateSupplement(id) {
    showAlert(`❌ Deactivate supplement ${id} - Feature coming soon!`, 'info');
}

// Make functions globally accessible
window.loadSupplements = loadSupplements;
window.editSupplement = editSupplement;
window.activateSupplement = activateSupplement;
window.deactivateSupplement = deactivateSupplement;

console.log('✅ Real supplement management functions loaded');

// ============================================================================
// SUPPLEMENT FORM FUNCTIONS
// ============================================================================

function showAddSupplementForm() {
    console.log('📝 Showing add supplement form...');
    
    // Create or show the form modal
    let formContainer = document.getElementById('supplement-modal');
    if (!formContainer) {
        formContainer = createEnhancedSupplementModal();
    }
    
    formContainer.style.display = 'flex';
    
    // Update title for adding
    const titleElement = document.getElementById('supplement-form-title');
    if (titleElement) {
        titleElement.textContent = 'Add New Supplement';
    }
    
    // Clear the form
    clearSupplementFormFixed();
    
    // Focus on name field
    setTimeout(() => {
        const nameField = document.getElementById('supplement-name');
        if (nameField) {
            nameField.focus();
        }
    }, 100);
}

function hideSupplementForm() {
    const modal = document.getElementById('supplement-modal');
    if (modal) {
        modal.style.display = 'none';
        // Optional: Remove the modal from DOM to clean up
        setTimeout(() => modal.remove(), 300);
    }
}

function clearSupplementFormFixed() {
    const form = document.getElementById('supplement-form');
    if (form) {
        form.reset();
        
        // Set default values
        const activeCheckbox = document.getElementById('supplement-active');
        if (activeCheckbox) {
            activeCheckbox.checked = true;
        }
        
        const featuredCheckbox = document.getElementById('supplement-featured');
        if (featuredCheckbox) {
            featuredCheckbox.checked = false;
        }
        
        const unitSelect = document.getElementById('supplement-unit');
        if (unitSelect) {
            unitSelect.value = 'mg';
        }
    }
}

function createEnhancedSupplementModal() {
    console.log('🏗️ Creating enhanced supplement modal...');
    
    const modalHTML = `
        <div id="supplement-modal" class="modal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                <div class="modal-header" style="padding: 20px 24px 16px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center;">
                    <h3 id="supplement-form-title" style="margin: 0; color: #2c3e50; font-size: 1.4rem;">Add New Supplement</h3>
                    <button class="btn-close" onclick="hideSupplementForm()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6c757d; padding: 0;">&times;</button>
                </div>
                
                <div class="modal-body" style="padding: 24px;">
                    <div id="supplement-form-alert" style="margin-bottom: 16px; display: none;"></div>
                    
                    <form id="supplement-form" onsubmit="saveSupplementFormFixed(event)">
                        <input type="hidden" id="supplement-id" name="id">
                        
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label for="supplement-name" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Supplement Name *</label>
                                <input type="text" id="supplement-name" name="name" required 
                                       placeholder="Enter supplement name"
                                       style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                            </div>
                            
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label for="supplement-category" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Category *</label>
                                <select id="supplement-category" name="category" required
                                        style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                    <option value="">Select category...</option>
                                    <option value="Vitamins">Vitamins</option>
                                    <option value="Minerals">Minerals</option>
                                    <option value="Antioxidants">Antioxidants</option>
                                    <option value="Herbs">Herbs & Botanicals</option>
                                    <option value="Amino Acids">Amino Acids</option>
                                    <option value="Enzymes">Enzymes</option>
                                    <option value="Probiotics">Probiotics</option>
                                    <option value="Fatty Acids">Fatty Acids</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label for="supplement-dose" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Default Dose</label>
                                <input type="number" id="supplement-dose" name="default_dose" step="0.1" min="0"
                                       placeholder="e.g., 100"
                                       style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                            </div>
                            
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label for="supplement-unit" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Unit</label>
                                <select id="supplement-unit" name="unit"
                                        style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                    <option value="mg">mg</option>
                                    <option value="g">g</option>
                                    <option value="μg">μg (micrograms)</option>
                                    <option value="IU">IU (International Units)</option>
                                    <option value="mL">mL</option>
                                    <option value="drops">drops</option>
                                    <option value="capsules">capsules</option>
                                    <option value="tablets">tablets</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label for="supplement-description" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Description</label>
                            <textarea id="supplement-description" name="description" rows="3"
                                      placeholder="Brief description of the supplement and its benefits"
                                      style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;"></textarea>
                        </div>
                        
                        <div class="form-row" style="display: flex; gap: 24px; margin-bottom: 24px;">
                            <div class="form-check" style="display: flex; align-items: center;">
                                <input type="checkbox" id="supplement-active" name="is_active" checked
                                       style="margin-right: 8px;">
                                <label for="supplement-active" style="margin: 0; font-weight: 500; color: #374151;">Active</label>
                            </div>
                        </div>
                        
                        <div class="form-actions" style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e9ecef;">
                            <button type="button" onclick="hideSupplementForm()" 
                                    style="padding: 8px 16px; border: 1px solid #d1d5db; background: #f8f9fa; color: #6c757d; border-radius: 6px; cursor: pointer;">
                                Cancel
                            </button>
                            <button type="submit" 
                                    style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 6px; cursor: pointer;">
                                Save Supplement
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing modal
    const existingModal = document.getElementById('supplement-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add the modal to the body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    console.log('✅ Enhanced modal created with improved styling');
    return document.getElementById('supplement-modal');
}

async function saveSupplementFormFixed(event) {
    event.preventDefault();
    console.log('💾 Saving supplement form...');
    
    const formData = new FormData(document.getElementById('supplement-form'));
    const id = formData.get('id');
    const isEdit = id && id !== '';
    
    const supplementData = {
        name: formData.get('name').trim(),
        category: formData.get('category'),
        description: formData.get('description').trim(),
        default_dose: formData.get('default_dose') || null,
        unit: formData.get('unit'),
        is_active: formData.has('is_active')
    };
    
    // Validation
    if (!supplementData.name || !supplementData.category) {
        showAlert('❌ Please fill in all required fields (Name and Category)', 'error');
        return;
    }
    
    try {
        showAlert('🔄 Saving supplement...', 'info');
        
        const url = isEdit ? `${API_BASE}/api/supplements/${id}` : `${API_BASE}/api/supplements`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplementData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showAlert(`✅ Supplement ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
            hideSupplementForm();
            loadSupplements();
        } else {
            throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} supplement`);
        }
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showAlert(`❌ Failed to save supplement: ${error.message}`, 'error');
    }
}

// Make functions globally accessible
window.showAddSupplementForm = showAddSupplementForm;
window.hideSupplementForm = hideSupplementForm;
window.saveSupplementForm = saveSupplementForm;

console.log('✅ Supplement form functions loaded');

// ============================================================================
// FIXED SUPPLEMENT FORM FUNCTIONS
// ============================================================================

function clearSupplementFormFixed() {
    console.log('🧹 Clearing supplement form...');
    
    // Clear individual form fields
    const fields = [
        'supplement-id',
        'supplement-name', 
        'supplement-category',
        'supplement-description',
        'supplement-dose',
        'supplement-unit'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = fieldId === 'supplement-active'; // Only active should be checked by default
            } else {
                field.value = '';
            }
        }
    });
    
    // Set default values
    const unitSelect = document.getElementById('supplement-unit');
    if (unitSelect) {
        unitSelect.value = 'mg';
    }
    
    const activeCheckbox = document.getElementById('supplement-active');
    if (activeCheckbox) {
        activeCheckbox.checked = true;
    }
    
    console.log('✅ Form cleared');
}

async function saveSupplementFormFixed(event) {
    event.preventDefault();
    console.log('💾 Saving supplement form...');
    
    // Get form values manually instead of using FormData
    const supplementData = {
        name: document.getElementById('supplement-name')?.value?.trim() || '',
        category: document.getElementById('supplement-category')?.value || '',
        description: document.getElementById('supplement-description')?.value?.trim() || '',
        default_dose: document.getElementById('supplement-dose')?.value || null,
        unit: document.getElementById('supplement-unit')?.value || 'mg',
        is_active: document.getElementById('supplement-active')?.checked || false
    };
    
    console.log('📝 Supplement data:', supplementData);
    
    // Validation
    if (!supplementData.name || !supplementData.category) {
        showAlert('❌ Please fill in all required fields (Name and Category)', 'error');
        return;
    }
    
    try {
        showAlert('🔄 Saving supplement...', 'info');
        
        const response = await fetch(`${API_BASE}/api/supplements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplementData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showAlert('✅ Supplement created successfully!', 'success');
            hideSupplementForm();
            loadSupplements();
        } else {
            throw new Error(data.error || 'Failed to create supplement');
        }
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showAlert(`❌ Failed to save supplement: ${error.message}`, 'error');
    }
}

// Override the previous functions
window.clearSupplementForm = clearSupplementFormFixed;
window.saveSupplementForm = saveSupplementFormFixed;

console.log('✅ Fixed supplement form functions loaded');

// ============================================================================
// DEBUGGED SUPPLEMENT FORM FUNCTIONS
// ============================================================================

async function saveSupplementFormDebug(event) {
    event.preventDefault();
    console.log('💾 Saving supplement form...');
    
    // Debug: Check if form elements exist
    console.log('🔍 Debugging form elements:');
    const nameField = document.getElementById('supplement-name');
    const categoryField = document.getElementById('supplement-category');
    const descriptionField = document.getElementById('supplement-description');
    const doseField = document.getElementById('supplement-dose');
    const unitField = document.getElementById('supplement-unit');
    const activeField = document.getElementById('supplement-active');
    
    console.log('Name field:', nameField, 'Value:', nameField?.value);
    console.log('Category field:', categoryField, 'Value:', categoryField?.value);
    console.log('Description field:', descriptionField, 'Value:', descriptionField?.value);
    console.log('Dose field:', doseField, 'Value:', doseField?.value);
    console.log('Unit field:', unitField, 'Value:', unitField?.value);
    console.log('Active field:', activeField, 'Checked:', activeField?.checked);
    
    // If fields don't exist, try to find them by different methods
    if (!nameField) {
        console.log('❌ Name field not found, searching for alternatives...');
        const allInputs = document.querySelectorAll('input[name="name"]');
        console.log('Found inputs with name="name":', allInputs);
        
        const allInputsById = document.querySelectorAll('#supplement-name');
        console.log('Found inputs with id="supplement-name":', allInputsById);
    }
    
    // Get form values
    const supplementData = {
        name: nameField?.value?.trim() || '',
        category: categoryField?.value || '',
        description: descriptionField?.value?.trim() || '',
        default_dose: doseField?.value || null,
        unit: unitField?.value || 'mg',
        is_active: activeField?.checked !== false
    };
    
    console.log('📝 Supplement data:', supplementData);
    
    // Validation
    if (!supplementData.name || !supplementData.category) {
        showAlert('❌ Please fill in all required fields (Name and Category)', 'error');
        return;
    }
    
    try {
        showAlert('🔄 Saving supplement...', 'info');
        
        const response = await fetch(`${API_BASE}/api/supplements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplementData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showAlert('✅ Supplement created successfully!', 'success');
            hideSupplementForm();
            loadSupplements();
        } else {
            throw new Error(data.error || 'Failed to create supplement');
        }
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showAlert(`❌ Failed to save supplement: ${error.message}`, 'error');
    }
}

// Override the save function
window.saveSupplementForm = saveSupplementFormDebug;

console.log('✅ Debug supplement form function loaded');

// ============================================================================
// USE EXISTING SUPPLEMENT FORM
// ============================================================================

function showAddSupplementFormExisting() {
    console.log('📝 Using existing supplement form...');
    
    // Find the existing form
    const form = document.getElementById('supplement-form');
    const nameField = document.getElementById('supplement-name');
    
    if (form && nameField) {
        console.log('✅ Found existing form, showing it');
        
        // Clear the form
        clearExistingSupplementForm();
        
        // Show the form
        form.style.display = 'block';
        
        // Update title if it exists
        const title = document.getElementById('supplement-form-title');
        if (title) {
            title.textContent = 'Add New Supplement';
        }
        
        // Focus on name field
        setTimeout(() => {
            nameField.focus();
        }, 100);
        
    } else {
        console.log('❌ Existing form not found, falling back to modal');
        showAddSupplementFormFixed();
    }
}

function clearExistingSupplementForm() {
    console.log('🧹 Clearing existing supplement form...');
    
    const fields = [
        'supplement-id',
        'supplement-name', 
        'supplement-category',
        'supplement-description',
        'supplement-dose',
        'supplement-unit'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = fieldId === 'supplement-active';
            } else {
                field.value = '';
            }
            console.log(`✅ Cleared field: ${fieldId}`);
        } else {
            console.log(`⚠️ Field not found: ${fieldId}`);
        }
    });
    
    // Set defaults
    const unitField = document.getElementById('supplement-unit');
    if (unitField) {
        unitField.value = 'mg';
    }
    
    const activeField = document.getElementById('supplement-active');
    if (activeField) {
        activeField.checked = true;
    }
}

function hideExistingSupplementForm() {
    const form = document.getElementById('supplement-form');
    if (form) {
        form.style.display = 'none';
        console.log('✅ Hidden existing form');
    }
}

async function saveExistingSupplementForm(event) {
    if (event) event.preventDefault();
    
    console.log('💾 Saving existing supplement form...');
    
    // Get values from the existing form
    const nameField = document.getElementById('supplement-name');
    const categoryField = document.getElementById('supplement-category');
    const descriptionField = document.getElementById('supplement-description');
    const doseField = document.getElementById('supplement-dose');
    const unitField = document.getElementById('supplement-unit');
    const activeField = document.getElementById('supplement-active');
    
    console.log('🔍 Form fields found:');
    console.log('Name:', nameField?.value);
    console.log('Category:', categoryField?.value);
    console.log('Description:', descriptionField?.value);
    console.log('Dose:', doseField?.value);
    console.log('Unit:', unitField?.value);
    console.log('Active:', activeField?.checked);
    
    const supplementData = {
        name: nameField?.value?.trim() || '',
        category: categoryField?.value || '',
        description: descriptionField?.value?.trim() || '',
        default_dose: doseField?.value || null,
        unit: unitField?.value || 'mg',
        is_active: activeField?.checked !== false
    };
    
    console.log('📝 Supplement data:', supplementData);
    
    // Validation
    if (!supplementData.name || !supplementData.category) {
        showAlert('❌ Please fill in all required fields (Name and Category)', 'error');
        return;
    }
    
    try {
        showAlert('🔄 Saving supplement...', 'info');
        
        const response = await fetch(`${API_BASE}/api/supplements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplementData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showAlert('✅ Supplement created successfully!', 'success');
            hideExistingSupplementForm();
            loadSupplements();
        } else {
            throw new Error(data.error || 'Failed to create supplement');
        }
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showAlert(`❌ Failed to save supplement: ${error.message}`, 'error');
    }
}

// Override the functions to use existing form
window.showAddSupplementForm = showAddSupplementFormExisting;
window.hideSupplementForm = hideExistingSupplementForm;
window.saveSupplementForm = saveExistingSupplementForm;

console.log('✅ Existing supplement form functions loaded');

// ============================================================================
// SETUP EXISTING FORM EVENT LISTENERS
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Set up the existing supplement form submit handler
    const existingForm = document.getElementById('supplement-form');
    if (existingForm) {
        // Remove any existing onsubmit attribute
        existingForm.removeAttribute('onsubmit');
        
        // Add our event listener
        existingForm.addEventListener('submit', saveExistingSupplementForm);
        console.log('✅ Added submit handler to existing supplement form');
    }
});

console.log('✅ Existing form setup loaded');
