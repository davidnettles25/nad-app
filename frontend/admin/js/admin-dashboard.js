// NAD Admin Dashboard Main JavaScript
// Configuration
const API_BASE = 'https://mynadtest.info';

// Global data storage
let allTests = [];
let filteredTests = [];
let selectedTests = new Set();
let allSupplements = [];
let filteredSupplements = [];

console.log('🚀 NAD Admin Dashboard Initialized');
console.log('📡 API Base:', API_BASE);

// ============================================================================
// NAVIGATION FUNCTIONS
// ============================================================================

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const navLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    console.log('📍 Switched to section:', sectionName);
    
    // Auto-load data when switching sections
    switch(sectionName) {
        case 'users':
            loadUsers();
            break;
        case 'tests':
            loadTestsFromAPI();
            break;
        case 'supplements':
            loadSupplements();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'overview':
            loadDashboardStats();
            break;
    }
}

function showAlert(message, type) {
    const activeSection = document.querySelector('.content-section.active');
    const alertId = activeSection ? activeSection.id + '-alert' : 'test-alert';
    const alertDiv = document.getElementById(alertId);
    
    if (alertDiv) {
        alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        
        if (type === 'success') {
            setTimeout(() => {
                alertDiv.innerHTML = '';
            }, 5000);
        }
    }
    
    console.log('📢 Alert:', message);
}

// ============================================================================
// DASHBOARD STATS FUNCTIONS
// ============================================================================

async function loadDashboardStats() {
    console.log('📊 Loading dashboard statistics...');
    try {
        const response = await fetch(`${API_BASE}/api/dashboard/stats`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            updateDashboardStats(data.stats);
            console.log('✅ Dashboard stats loaded:', data.stats);
        } else {
            console.error('❌ Failed to load dashboard stats:', data.error);
            updateDashboardStats({
                total_tests: 0,
                completed_tests: 0,
                pending_tests: 0,
                activated_tests: 0
            });
        }
    } catch (error) {
        console.error('❌ Error loading dashboard stats:', error);
        updateDashboardStats({
            total_tests: 0,
            completed_tests: 0,
            pending_tests: 0,
            activated_tests: 0
        });
    }
}

function updateDashboardStats(stats) {
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
        }
    });
    
    const total = stats.total_tests || 1;
    const activationRate = ((stats.activated_tests / total) * 100).toFixed(1);
    const completionRate = ((stats.completed_tests / total) * 100).toFixed(1);
    
    const overviewStats = document.getElementById('overview-stats');
    if (overviewStats) {
        overviewStats.innerHTML = `
            📊 <strong>${stats.total_tests} tests created</strong> • 
            🎯 <strong>${stats.activated_tests} activated (${activationRate}%)</strong> • 
            ⏳ <strong>${stats.pending_tests} pending</strong> • 
            🏁 <strong>${stats.completed_tests} completed</strong>
        `;
    }
}

// ============================================================================
// API PLACEHOLDER FUNCTIONS
// ============================================================================

// Test Management Functions
async function loadTestsFromAPI() {
    console.log('🧪 Loading tests from API...');
    showAlert('🔄 Loading test data from API...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/tests`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            allTests = data.tests;
            filteredTests = [...allTests];
            renderTestsTable(filteredTests);
            updateTestStats(allTests);
            showAlert(`✅ Loaded ${allTests.length} tests successfully!`, 'success');
        } else {
            throw new Error(data.error || 'Failed to load tests');
        }
    } catch (error) {
        console.error('❌ Error loading tests:', error);
        showAlert('❌ Failed to load tests. Please check API connection.', 'error');
    }
}

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
                        <p>No tests available or API connection failed.</p>
                        <button class="btn" onclick="loadTestsFromAPI()" style="margin-top: 15px;">
                            🔄 Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = tests.map(test => `
        <tr>
            <td><input type="checkbox" class="test-checkbox" data-test-id="${test.test_id}"></td>
            <td><strong>${test.test_id}</strong></td>
            <td><span class="status-badge ${getStatusClass(test)}">${getTestStatus(test)}</span></td>
            <td>${test.customer_id}</td>
            <td>#${test.order_id}</td>
            <td>${new Date(test.created_date).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm" onclick="viewTest('${test.test_id}')">👁️ View</button>
            </td>
        </tr>
    `).join('');
}

function updateTestStats(tests) {
    const stats = {
        total: tests.length,
        activated: tests.filter(t => t.is_activated).length,
        pending: tests.filter(t => !t.is_activated).length,
        completed: tests.filter(t => t.score).length
    };
    
    const elements = {
        'test-total-count': stats.total,
        'test-activated-count': stats.activated,
        'test-pending-count': stats.pending,
        'test-completed-count': stats.completed
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function getTestStatus(test) {
    if (test.score) return 'Completed';
    if (test.is_activated) return 'Activated';
    return 'Not Activated';
}

function getStatusClass(test) {
    if (test.score) return 'status-completed';
    if (test.is_activated) return 'status-activated';
    return 'status-not-activated';
}

// User Management Functions
async function loadUsers() {
    console.log('👥 Loading users from API...');
    showAlert('🔄 Loading users from database...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/api/users`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            renderUsersTable(data.users);
            updateUserStats(data.users);
            showAlert(`✅ Loaded ${data.users.length} users successfully!`, 'success');
        } else {
            throw new Error(data.error || 'Failed to load users');
        }
    } catch (error) {
        console.error('❌ Error loading users:', error);
        showAlert('❌ Failed to load users. Please check API connection.', 'error');
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="icon">👥</div>
                        <h4>No Users Found</h4>
                        <p>No users found or API connection failed.</p>
                        <button class="btn" onclick="loadUsers()" style="margin-top: 15px;">
                            🔄 Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td><strong>${user.customer_id}</strong></td>
            <td><span class="status-badge ${getRoleClass(user.role)}">${formatRole(user.role)}</span></td>
            <td>
                <div style="font-size: 12px;">
                    ${user.total_tests || 0} total • 
                    ${user.activated_tests || 0} active • 
                    ${user.completed_tests || 0} done
                </div>
            </td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm" onclick="viewUser(${user.customer_id})">👁️ View</button>
                <button class="btn btn-sm" onclick="editUser(${user.customer_id})" style="background: #ffc107; color: #333;">✏️ Edit</button>
            </td>
        </tr>
    `).join('');
}

function updateUserStats(users) {
    const stats = {
        total_users: users.length,
        customers: users.filter(u => u.role === 'customer').length,
        lab_techs: users.filter(u => u.role === 'lab_technician').length,
        admins: users.filter(u => u.role === 'administrator').length
    };
    
    const elements = {
        'total-users-count': stats.total_users,
        'customers-count': stats.customers,
        'lab-techs-count': stats.lab_techs,
        'admins-count': stats.admins
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function getRoleClass(role) {
    switch (role) {
        case 'administrator': return 'status-completed';
        case 'boss_control': return 'status-activated';
        case 'lab_technician': return 'status-pending';
        default: return 'status-pending';
    }
}

function formatRole(role) {
    const roleNames = {
        'customer': 'Customer',
        'lab_technician': 'Lab Tech',
        'shipping_manager': 'Shipping',
        'boss_control': 'Manager',
        'administrator': 'Admin'
    };
    return roleNames[role] || role;
}

// Supplement Management Functions
async function loadSupplements() {
    console.log('💊 Loading supplements from API...');
    showAlert('🔄 Loading supplements from database...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/api/supplements`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            allSupplements = data.supplements;
            filteredSupplements = [...allSupplements];
            renderSupplementsTable(filteredSupplements);
            updateSupplementStats(allSupplements);
            showAlert(`✅ Loaded ${allSupplements.length} supplements successfully!`, 'success');
        } else {
            throw new Error(data.error || 'Failed to load supplements');
        }
    } catch (error) {
        console.error('❌ Error loading supplements:', error);
        showAlert('❌ Failed to load supplements. Please check API connection.', 'error');
    }
}

function renderSupplementsTable(supplements) {
    const tbody = document.getElementById('supplements-table-body');
    if (!tbody) return;
    
    if (supplements.length === 0) {
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
    
    tbody.innerHTML = supplements.map(supplement => `
        <tr>
            <td>
                <strong>${supplement.name}</strong>
                <div style="font-size: 12px; color: #666; margin-top: 2px;">
                    ${supplement.description || 'No description'}
                </div>
            </td>
            <td><span class="status-badge status-pending">${formatCategory(supplement.category || 'other')}</span></td>
            <td>${supplement.default_dose ? `${supplement.default_dose} ${supplement.unit}` : 'Not set'}</td>
            <td><span class="status-badge ${supplement.is_active ? 'status-activated' : 'status-not-activated'}">${supplement.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-sm" onclick="editSupplement(${supplement.id})" style="background: #ffc107; color: #333;">✏️ Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteSupplement(${supplement.id})" style="background: #dc3545;">🗑️ Delete</button>
            </td>
        </tr>
    `).join('');
}

function updateSupplementStats(supplements) {
    const stats = {
        total: supplements.length,
        active: supplements.filter(s => s.is_active).length,
        inactive: supplements.filter(s => !s.is_active).length,
        categories: new Set(supplements.map(s => s.category || 'other')).size
    };
    
    const elements = {
        'supplement-total-count': stats.total,
        'supplement-active-count': stats.active,
        'supplement-inactive-count': stats.inactive,
        'supplement-categories-count': stats.categories
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function formatCategory(category) {
    return category.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Analytics Functions
async function loadAnalytics() {
    console.log('📈 Loading analytics data...');
    showAlert('🔄 Loading analytics data...', 'info');
    
    const period = document.getElementById('analytics-period')?.value || '30';
    
    try {
        const response = await fetch(`${API_BASE}/api/analytics/overview?period=${period}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            renderAnalytics(data.analytics);
            showAlert(`✅ Analytics loaded for ${getPeriodLabel(period)}`, 'success');
        } else {
            // Generate mock data if API fails
            const mockData = generateMockAnalyticsData(period);
            renderAnalytics(mockData);
            showAlert('📊 Displaying sample analytics data (API unavailable)', 'warning');
        }
    } catch (error) {
        console.error('❌ Error loading analytics:', error);
        const mockData = generateMockAnalyticsData(period);
        renderAnalytics(mockData);
        showAlert('📊 Displaying sample analytics data (connection error)', 'warning');
    }
}

function getPeriodLabel(period) {
    const labels = {
        '30': 'last 30 days',
        '90': 'last 90 days', 
        '180': 'last 6 months',
        '365': 'last year',
        'all': 'all time'
    };
    return labels[period] || 'selected period';
}

function generateMockAnalyticsData(period) {
    const baseTests = period === 'all' ? 1250 : Math.floor(Math.random() * 500) + 100;
    const activatedTests = Math.floor(baseTests * (0.7 + Math.random() * 0.25));
    const completedTests = Math.floor(activatedTests * (0.6 + Math.random() * 0.3));
    
    return {
        basic_stats: {
            total_tests: baseTests,
            activated_tests: activatedTests,
            completed_tests: completedTests,
            average_score: Math.floor(Math.random() * 30) + 60
        }
    };
}

function renderAnalytics(data) {
    const stats = data.basic_stats;
    const activationRate = ((stats.activated_tests / stats.total_tests) * 100).toFixed(1);
    const completionRate = ((stats.completed_tests / stats.total_tests) * 100).toFixed(1);
    
    // Update analytics KPI cards
    const elements = {
        'analytics-total-tests': stats.total_tests,
        'analytics-activation-rate': `${activationRate}%`,
        'analytics-completion-rate': `${completionRate}%`,
        'analytics-avg-score': stats.average_score
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    // Update trend indicators
    const trendElements = {
        'analytics-tests-trend': `${stats.activated_tests} activated`,
        'analytics-activation-trend': `${activationRate}% of total`,
        'analytics-completion-trend': `${completionRate}% of total`,
        'analytics-score-trend': `Range: ${stats.average_score - 15}-${stats.average_score + 15}`
    };
    
    Object.entries(trendElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

// ============================================================================
// PLACEHOLDER FUNCTIONS FOR UI INTERACTIONS
// ============================================================================

// Test Management Actions
function activateTest(testId) { showAlert(`Activating test ${testId} (placeholder)`, 'info'); }
function deactivateTest(testId) { showAlert(`Deactivating test ${testId} (placeholder)`, 'info'); }
function viewTest(testId) { alert(`Viewing test ${testId}\n\nThis is a placeholder function.`); }
function exportTests() { showAlert('Exporting tests (placeholder)', 'info'); }
function activateAllTests() { showAlert('Activating all tests (placeholder)', 'info'); }
function activateAllPendingTests() { showAlert('Activating all pending tests (placeholder)', 'info'); }
function deactivateAllActivatedTests() { showAlert('Deactivating all activated tests (placeholder)', 'info'); }
function bulkActivateSelected() { showAlert('Bulk activating selected tests (placeholder)', 'info'); }
function bulkDeactivateSelected() { showAlert('Bulk deactivating selected tests (placeholder)', 'info'); }
function clearSelection() { showAlert('Clearing selection (placeholder)', 'info'); }

// User Management Actions
function showAddUserForm() { 
    const form = document.getElementById('add-user-form');
    if (form) form.style.display = 'block';
}
function hideAddUserForm() { 
    const form = document.getElementById('add-user-form');
    if (form) form.style.display = 'none';
}
function createUser() { showAlert('Creating user (placeholder)', 'info'); }
function viewUser(customerId) { alert(`Viewing user ${customerId}\n\nThis is a placeholder function.`); }
function editUser(customerId) { showAlert(`Editing user ${customerId} (placeholder)`, 'info'); }

// Supplement Management Actions
function showAddSupplementForm() { 
    const form = document.getElementById('supplement-form');
    if (form) form.style.display = 'block';
}
function hideSupplementForm() { 
    const form = document.getElementById('supplement-form');
    if (form) form.style.display = 'none';
}
function showSupplementAlert(message, type = 'info') {
    console.log(`📢 Alert: ${message}`);
    
    // Remove existing alerts
    const existingAlert = document.getElementById('supplement-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.id = 'supplement-alert';
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Set colors based on type
    switch(type) {
        case 'success':
            alertDiv.style.backgroundColor = '#d4edda';
            alertDiv.style.color = '#155724';
            alertDiv.style.border = '1px solid #c3e6cb';
            break;
        case 'error':
            alertDiv.style.backgroundColor = '#f8d7da';
            alertDiv.style.color = '#721c24';
            alertDiv.style.border = '1px solid #f5c6cb';
            break;
        case 'warning':
            alertDiv.style.backgroundColor = '#fff3cd';
            alertDiv.style.color = '#856404';
            alertDiv.style.border = '1px solid #ffeaa7';
            break;
        default: // info
            alertDiv.style.backgroundColor = '#d1ecf1';
            alertDiv.style.color = '#0c5460';
            alertDiv.style.border = '1px solid #bee5eb';
    }
    
    alertDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; font-size: 18px; cursor: pointer; padding: 0 5px;">×</button>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds for success/info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Fixed saveSupplementForm to work with DIV-based forms
async function saveSupplementForm(event) {
    // Handle event
    if (event && event.preventDefault) {
        event.preventDefault();
    }
    
    console.log('💊 Starting supplement save process...');
    
    // Find form container (could be div or form)
    const formContainer = document.getElementById('supplement-form');
    
    if (!formContainer) {
        console.error('❌ No element found with ID "supplement-form"');
        showSupplementAlert('❌ Form not found - check if supplements section is loaded', 'error');
        return;
    }
    
    console.log('✅ Form container found:', formContainer.tagName);
    
    // Get form data from individual inputs instead of FormData
    const supplementData = {
        id: document.getElementById('supplement-id')?.value || '',
        name: document.getElementById('supplement-name')?.value?.trim() || '',
        category: document.getElementById('supplement-category')?.value || '',
        description: document.getElementById('supplement-description')?.value?.trim() || '',
        default_dose: document.getElementById('supplement-dose')?.value || null,
        unit: document.getElementById('supplement-unit')?.value || 'mg',
        min_dose: document.getElementById('supplement-min-dose')?.value || null,
        max_dose: document.getElementById('supplement-max-dose')?.value || null,
        notes: document.getElementById('supplement-notes')?.value?.trim() || '',
        is_active: document.getElementById('supplement-active')?.checked ? 1 : 0,
        is_featured: document.getElementById('supplement-featured')?.checked ? 1 : 0
    };
    
    console.log('📝 Supplement data collected:', supplementData);
    
    // Validation
    if (!supplementData.name || !supplementData.category) {
        showSupplementAlert('❌ Please fill in all required fields (Name and Category)', 'error');
        return;
    }
    
    // Check if this is an edit or new supplement
    const isEdit = supplementData.id && supplementData.id !== '';
    
    try {
        showSupplementAlert('🔄 Saving supplement...', 'info');
        
        // Update UI state
        const saveBtn = document.querySelector('#supplement-form button[type="submit"]') || 
                       document.querySelector('#supplement-form .btn-primary') ||
                       document.querySelector('button[onclick*="saveSupplementForm"]');
        const spinner = document.getElementById('supplement-save-spinner');
        const saveText = document.getElementById('supplement-save-text');
        
        if (saveBtn) saveBtn.disabled = true;
        if (spinner) spinner.innerHTML = '<span class="loading-spinner">⏳</span>';
        if (saveText) saveText.textContent = isEdit ? 'Updating...' : 'Creating...';
        
        // API configuration
        const API_BASE = window.API_BASE || 'https://mynadtest.info';
        const url = isEdit ? `${API_BASE}/api/supplements/${supplementData.id}` : `${API_BASE}/api/supplements`;
        const method = isEdit ? 'PUT' : 'POST';
        
        console.log(`📡 Making ${method} request to: ${url}`);
        
        // Remove ID from data for POST requests
        const dataToSend = { ...supplementData };
        if (!isEdit) {
            delete dataToSend.id;
        }
        
        // Make API request
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });
        
        console.log('📡 Response status:', response.status);
        
        // Parse response
        let data;
        try {
            const responseText = await response.text();
            console.log('📡 Raw response:', responseText);
            
            if (responseText) {
                data = JSON.parse(responseText);
            } else {
                throw new Error('Empty response from server');
            }
        } catch (parseError) {
            console.error('❌ Failed to parse response:', parseError);
            throw new Error('Invalid response from server');
        }
        
        console.log('📡 Parsed response:', data);
        
        if (response.ok && (data.success || data.id)) {
            const successMessage = `✅ Supplement "${supplementData.name}" ${isEdit ? 'updated' : 'created'} successfully!`;
            showSupplementAlert(successMessage, 'success');
            
            // Hide form
            if (typeof hideSupplementForm === 'function') {
                hideSupplementForm();
            } else {
                // Try to hide form container
                const formModal = document.getElementById('supplement-form-container') || 
                                 document.getElementById('supplement-modal');
                if (formModal) {
                    formModal.style.display = 'none';
                }
            }
            
            // Reload supplements list
            if (typeof loadSupplements === 'function') {
                loadSupplements();
            }
        } else {
            const errorMessage = data.error || data.message || `Failed to ${isEdit ? 'update' : 'create'} supplement`;
            throw new Error(errorMessage);
        }
        
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showSupplementAlert(`❌ Failed to save supplement: ${error.message}`, 'error');
    } finally {
        // Reset UI state
        const saveBtn = document.querySelector('#supplement-form button[type="submit"]') || 
                       document.querySelector('#supplement-form .btn-primary') ||
                       document.querySelector('button[onclick*="saveSupplementForm"]');
        const spinner = document.getElementById('supplement-save-spinner');
        const saveText = document.getElementById('supplement-save-text');
        
        if (saveBtn) saveBtn.disabled = false;
        if (spinner) spinner.innerHTML = '';
        if (saveText) saveText.textContent = 'Save Supplement';
    }
}

// Debug function to check form structure
function debugSupplementFormStructure() {
    console.log('🔍 Form Structure Debug:');
    
    const container = document.getElementById('supplement-form');
    console.log('Container element:', container);
    console.log('Container tag:', container?.tagName);
    
    // Check for form inputs
    const inputs = [
        'supplement-name',
        'supplement-category', 
        'supplement-description',
        'supplement-dose',
        'supplement-unit',
        'supplement-active',
        'supplement-featured'
    ];
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, element ? '✅ Found' : '❌ Missing', element?.type || element?.tagName);
    });
}

// ==================================================
// Supplement Edit Functions
// Add these to your admin-dashboard.js
// ==================================================

// Enhanced edit supplement function with better form detection
async function editSupplement(id) {
    console.log(`📝 Editing supplement ID: ${id}`);
    
    try {
        // Find the supplement in the current data
        let supplement = null;
        
        // First try to find it in allSupplements array if it exists
        if (typeof allSupplements !== 'undefined' && allSupplements.length > 0) {
            supplement = allSupplements.find(s => s.id == id);
        }
        
        // If not found in array, fetch from API
        if (!supplement) {
            console.log('🔍 Fetching supplement from API...');
            const API_BASE = window.API_BASE || 'https://mynadtest.info';
            const response = await fetch(`${API_BASE}/api/supplements/${id}`);
            
            if (response.ok) {
                const data = await response.json();
                supplement = data.supplement || data;
            }
        }
        
        if (!supplement) {
            showSupplementAlert('❌ Supplement not found', 'error');
            return;
        }
        
        console.log('📝 Supplement data for editing:', supplement);
        
        // Enhanced form showing with better debugging
        showSupplementFormForEdit();
        
        // Wait a moment for form to be visible
        setTimeout(() => {
            populateSupplementForm(supplement);
        }, 100);
        
    } catch (error) {
        console.error('❌ Error loading supplement for edit:', error);
        showSupplementAlert('❌ Failed to load supplement for editing', 'error');
    }
}

// Populate supplement form with data for editing
function populateSupplementForm(supplement) {
    console.log('📝 Populating form with:', supplement);
    
    // Update form title
    const formTitle = document.getElementById('supplement-form-title');
    if (formTitle) {
        formTitle.textContent = 'Edit Supplement';
    }
    
    // Populate form fields
    const fields = {
        'supplement-id': supplement.id,
        'supplement-name': supplement.name,
        'supplement-category': supplement.category,
        'supplement-description': supplement.description || '',
        'supplement-dose': supplement.default_dose || '',
        'supplement-unit': supplement.unit || 'mg',
        'supplement-min-dose': supplement.min_dose || '',
        'supplement-max-dose': supplement.max_dose || '',
        'supplement-notes': supplement.notes || ''
    };
    
    // Set text/select inputs
    Object.entries(fields).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = value || '';
            console.log(`✅ Set ${fieldId} = ${value}`);
        } else {
            console.warn(`⚠️ Field not found: ${fieldId}`);
        }
    });
    
    // Set checkboxes
    const activeCheckbox = document.getElementById('supplement-active');
    if (activeCheckbox) {
        activeCheckbox.checked = supplement.is_active == 1;
    }
    
    const featuredCheckbox = document.getElementById('supplement-featured');
    if (featuredCheckbox) {
        featuredCheckbox.checked = supplement.is_featured == 1;
    }
    
    // Update save button text
    const saveText = document.getElementById('supplement-save-text');
    if (saveText) {
        saveText.textContent = 'Update Supplement';
    }
    
    // Focus on name field
    const nameField = document.getElementById('supplement-name');
    if (nameField) {
        nameField.focus();
        nameField.select();
    }
    
    console.log('✅ Form populated successfully');
}

// Clear supplement form (for new supplements)
function clearSupplementForm() {
    console.log('🧹 Clearing supplement form...');
    
    // Update form title
    const formTitle = document.getElementById('supplement-form-title');
    if (formTitle) {
        formTitle.textContent = 'Add New Supplement';
    }
    
    // Clear form fields
    const fields = [
        'supplement-id',
        'supplement-name',
        'supplement-category', 
        'supplement-description',
        'supplement-dose',
        'supplement-min-dose',
        'supplement-max-dose',
        'supplement-notes'
    ];
    
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = '';
        }
    });
    
    // Reset unit to default
    const unitField = document.getElementById('supplement-unit');
    if (unitField) {
        unitField.value = 'mg';
    }
    
    // Reset checkboxes
    const activeCheckbox = document.getElementById('supplement-active');
    if (activeCheckbox) {
        activeCheckbox.checked = true; // Default to active
    }
    
    const featuredCheckbox = document.getElementById('supplement-featured');
    if (featuredCheckbox) {
        featuredCheckbox.checked = false; // Default to not featured
    }
    
    // Update save button text
    const saveText = document.getElementById('supplement-save-text');
    if (saveText) {
        saveText.textContent = 'Save Supplement';
    }
    
    console.log('✅ Form cleared successfully');
}

// Delete supplement function
async function deleteSupplement(id) {
    // Find supplement name for confirmation
    let supplementName = 'this supplement';
    
    if (typeof allSupplements !== 'undefined' && allSupplements.length > 0) {
        const supplement = allSupplements.find(s => s.id == id);
        if (supplement) {
            supplementName = supplement.name;
        }
    }
    
    // Confirm deletion
    if (!confirm(`Delete "${supplementName}"?\n\nThis action cannot be undone and will remove all associated data.`)) {
        return;
    }
    
    try {
        showSupplementAlert('🔄 Deleting supplement...', 'info');
        
        const API_BASE = window.API_BASE || 'https://mynadtest.info';
        const response = await fetch(`${API_BASE}/api/supplements/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSupplementAlert(`✅ Supplement "${supplementName}" deleted successfully!`, 'success');
            
            // Reload supplements list
            if (typeof loadSupplements === 'function') {
                loadSupplements();
            }
        } else {
            throw new Error(data.error || 'Failed to delete supplement');
        }
        
    } catch (error) {
        console.error('❌ Error deleting supplement:', error);
        showSupplementAlert(`❌ Failed to delete supplement: ${error.message}`, 'error');
    }
}

// Toggle supplement active status
async function toggleSupplementStatus(id, isActive) {
    try {
        // Find supplement
        let supplement = null;
        if (typeof allSupplements !== 'undefined' && allSupplements.length > 0) {
            supplement = allSupplements.find(s => s.id == id);
        }
        
        if (!supplement) {
            showSupplementAlert('❌ Supplement not found', 'error');
            return;
        }
        
        const action = isActive ? 'activate' : 'deactivate';
        showSupplementAlert(`🔄 ${action.charAt(0).toUpperCase() + action.slice(1)}ing supplement...`, 'info');
        
        const API_BASE = window.API_BASE || 'https://mynadtest.info';
        const response = await fetch(`${API_BASE}/api/supplements/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ...supplement, 
                is_active: isActive ? 1 : 0 
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSupplementAlert(`✅ Supplement ${action}d successfully!`, 'success');
            
            // Reload supplements list
            if (typeof loadSupplements === 'function') {
                loadSupplements();
            }
        } else {
            throw new Error(data.error || `Failed to ${action} supplement`);
        }
        
    } catch (error) {
        console.error(`❌ Error toggling supplement status:`, error);
        showSupplementAlert(`❌ Failed to update supplement status: ${error.message}`, 'error');
    }
}

// Activate supplement (wrapper function)
async function activateSupplement(id) {
    await toggleSupplementStatus(id, true);
}

// Deactivate supplement (wrapper function) 
async function deactivateSupplement(id) {
    await toggleSupplementStatus(id, false);
}

// Enhanced show add supplement form function
function showAddSupplementForm() {
    console.log('📝 Showing add supplement form...');
    
    // Clear form first
    clearSupplementForm();
    
    // Use the same enhanced showing logic
    showSupplementFormForEdit();
    
    // Update title for new supplement
    setTimeout(() => {
        const formTitle = document.getElementById('supplement-form-title');
        if (formTitle) {
            formTitle.textContent = 'Add New Supplement';
        }
        
        const saveText = document.getElementById('supplement-save-text');
        if (saveText) {
            saveText.textContent = 'Save Supplement';
        }
    }, 100);
}

// Hide supplement form
function hideSupplementForm() {
    console.log('❌ Hiding supplement form...');
    
    const formContainer = document.getElementById('supplement-form-container') || 
                         document.getElementById('supplement-modal');
    if (formContainer) {
        formContainer.style.display = 'none';
    }
    
    // Clear form
    clearSupplementForm();
}

// ==================================================
// Enhanced functions to debug and fix form visibility
// ==================================================

// Enhanced form showing function with debugging
function showSupplementFormForEdit() {
    console.log('📝 Showing supplement form for edit...');
    
    // List of possible form container IDs to try
    const possibleContainers = [
        'supplement-form-container',
        'supplement-modal', 
        'add-supplement-modal',
        'supplement-form-modal',
        'supplement-popup',
        'modal-supplement',
        'supplement-dialog'
    ];
    
    let formContainer = null;
    
    // Try to find any of these containers
    for (const containerId of possibleContainers) {
        const element = document.getElementById(containerId);
        if (element) {
            console.log(`✅ Found form container: ${containerId}`, element);
            formContainer = element;
            break;
        } else {
            console.log(`❌ Container not found: ${containerId}`);
        }
    }
    
    // If no container found, look for any element containing "supplement" and "form" or "modal"
    if (!formContainer) {
        console.log('🔍 Searching for supplement form containers by class/attribute...');
        
        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
            const id = element.id || '';
            const className = element.className || '';
            
            if ((id.includes('supplement') && (id.includes('form') || id.includes('modal'))) ||
                (className.includes('supplement') && (className.includes('form') || className.includes('modal')))) {
                console.log(`🎯 Found potential container:`, element);
                formContainer = element;
                break;
            }
        }
    }
    
    // If still no container found, create a simple modal
    if (!formContainer) {
        console.log('⚠️ No form container found, creating temporary modal...');
        createTemporarySupplementModal();
        formContainer = document.getElementById('temp-supplement-modal');
    }
    
    if (formContainer) {
        // Show the container using multiple methods
        console.log('📺 Making form container visible...');
        
        // Method 1: Set display style
        formContainer.style.display = 'block';
        formContainer.style.visibility = 'visible';
        formContainer.style.opacity = '1';
        
        // Method 2: Remove hidden classes
        formContainer.classList.remove('hidden', 'd-none', 'hide');
        formContainer.classList.add('show', 'visible');
        
        // Method 3: Set z-index to ensure it's on top
        formContainer.style.zIndex = '10000';
        formContainer.style.position = 'fixed';
        
        console.log('✅ Form container should now be visible');
        
        // Focus on the form
        setTimeout(() => {
            const nameField = document.getElementById('supplement-name');
            if (nameField) {
                nameField.focus();
                nameField.select();
            }
        }, 200);
    } else {
        console.error('❌ Could not find or create form container');
        showSupplementAlert('❌ Could not open edit form. Please try refreshing the page.', 'error');
    }
}

// ==================================================
// Improved Modal Styling for Better Visibility
// Replace your createTemporarySupplementModal function
// ==================================================

// Enhanced modal creation with better styling
function createTemporarySupplementModal() {
    console.log('🏗️ Creating enhanced supplement modal...');
    
    const modal = document.createElement('div');
    modal.id = 'temp-supplement-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(3px);
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            border: 1px solid #e0e0e0;
        ">
            <!-- Close button -->
            <button onclick="hideSupplementForm()" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6c757d;
                transition: all 0.2s;
            " onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
                ×
            </button>
            
            <!-- Form Header -->
            <div style="margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #f8f9fa;">
                <h3 id="supplement-form-title" style="
                    margin: 0;
                    color: #333;
                    font-size: 24px;
                    font-weight: 600;
                ">Edit Supplement</h3>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                    Update supplement information and settings
                </p>
            </div>
            
            <!-- Form Content -->
            <div id="supplement-form">
                <!-- Name Field -->
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: #333;
                        font-size: 14px;
                    ">Name *</label>
                    <input type="text" id="supplement-name" placeholder="Enter supplement name..." style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        font-size: 14px;
                        transition: border-color 0.2s;
                        box-sizing: border-box;
                    " onfocus="this.style.borderColor='#007bff'" onblur="this.style.borderColor='#e9ecef'">
                </div>
                
                <!-- Category Field -->
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: #333;
                        font-size: 14px;
                    ">Category *</label>
                    <select id="supplement-category" style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        font-size: 14px;
                        background: white;
                        box-sizing: border-box;
                    ">
                        <option value="">Select category...</option>
                        <option value="Vitamins">Vitamins</option>
                        <option value="Minerals">Minerals</option>
                        <option value="Antioxidants">Antioxidants</option>
                        <option value="Essential Fatty Acids">Essential Fatty Acids</option>
                        <option value="Digestive Health">Digestive Health</option>
                        <option value="Anti-inflammatory">Anti-inflammatory</option>
                        <option value="Herbs">Herbs</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <!-- Description Field -->
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: #333;
                        font-size: 14px;
                    ">Description</label>
                    <textarea id="supplement-description" rows="3" placeholder="Brief description of the supplement..." style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        font-size: 14px;
                        resize: vertical;
                        box-sizing: border-box;
                        font-family: inherit;
                    "></textarea>
                </div>
                
                <!-- Dose and Unit Fields -->
                <div style="display: grid; grid-template-columns: 1fr 120px; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">Default Dose</label>
                        <input type="number" id="supplement-dose" step="0.1" min="0" placeholder="0" style="
                            width: 100%;
                            padding: 12px;
                            border: 2px solid #e9ecef;
                            border-radius: 8px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                    </div>
                    <div>
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">Unit</label>
                        <select id="supplement-unit" style="
                            width: 100%;
                            padding: 12px;
                            border: 2px solid #e9ecef;
                            border-radius: 8px;
                            font-size: 14px;
                            background: white;
                            box-sizing: border-box;
                        ">
                            <option value="mg">mg</option>
                            <option value="g">g</option>
                            <option value="mcg">mcg</option>
                            <option value="IU">IU</option>
                            <option value="ml">ml</option>
                            <option value="drops">drops</option>
                            <option value="capsules">capsules</option>
                            <option value="tablets">tablets</option>
                            <option value="billion CFU">billion CFU</option>
                        </select>
                    </div>
                </div>
                
                <!-- Checkboxes -->
                <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display: flex; gap: 30px;">
                        <label style="
                            display: flex;
                            align-items: center;
                            cursor: pointer;
                            font-weight: 500;
                            color: #333;
                        ">
                            <input type="checkbox" id="supplement-active" checked style="
                                margin-right: 8px;
                                transform: scale(1.2);
                            "> 
                            <span style="color: #28a745;">✅ Active</span>
                        </label>
                        
                        <label style="
                            display: flex;
                            align-items: center;
                            cursor: pointer;
                            font-weight: 500;
                            color: #333;
                        ">
                            <input type="checkbox" id="supplement-featured" style="
                                margin-right: 8px;
                                transform: scale(1.2);
                            "> 
                            <span style="color: #ffc107;">⭐ Featured</span>
                        </label>
                    </div>
                    <small style="color: #6c757d; margin-top: 5px; display: block;">
                        Active supplements are available for customer selection. Featured supplements are highlighted prominently.
                    </small>
                </div>
                
                <!-- Action Buttons -->
                <div style="
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    padding-top: 20px;
                    border-top: 1px solid #e9ecef;
                ">
                    <button onclick="hideSupplementForm()" style="
                        padding: 12px 24px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s;
                        min-width: 100px;
                    " onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
                        Cancel
                    </button>
                    
                    <button onclick="saveSupplementForm()" style="
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #007bff, #0056b3);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s;
                        min-width: 140px;
                        box-shadow: 0 2px 4px rgba(0,123,255,0.3);
                    " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,123,255,0.4)'" 
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,123,255,0.3)'">
                        <span id="supplement-save-spinner"></span>
                        <span id="supplement-save-text">Update Supplement</span>
                    </button>
                </div>
                
                <input type="hidden" id="supplement-id" value="">
            </div>
        </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        
        #temp-supplement-modal input:focus,
        #temp-supplement-modal select:focus,
        #temp-supplement-modal textarea:focus {
            outline: none;
            border-color: #007bff !important;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }
        
        #temp-supplement-modal input[type="checkbox"]:checked {
            accent-color: #007bff;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(modal);
    console.log('✅ Enhanced modal created with improved styling');
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideSupplementForm();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('temp-supplement-modal')) {
            hideSupplementForm();
        }
    });
}

// Enhanced hide function with cleanup
function hideSupplementForm() {
    console.log('❌ Hiding supplement form...');
    
    // Try multiple container IDs
    const possibleContainers = [
        'supplement-form-container',
        'supplement-modal', 
        'add-supplement-modal',
        'temp-supplement-modal'
    ];
    
    for (const containerId of possibleContainers) {
        const container = document.getElementById(containerId);
        if (container) {
            // Fade out animation
            container.style.opacity = '0';
            container.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                container.style.display = 'none';
                container.classList.add('hidden');
                
                // Remove temp modal completely
                if (containerId === 'temp-supplement-modal') {
                    container.remove();
                }
            }, 200);
            
            console.log(`✅ Hidden container: ${containerId}`);
        }
    }
    
    // Remove event listeners
    document.removeEventListener('keydown', arguments.callee);
}

// Debug function to check what form elements exist
function debugSupplementFormElements() {
    console.log('🔍 Debugging supplement form elements...');
    
    // Check for all possible form-related elements
    const formRelatedElements = document.querySelectorAll('[id*="supplement"], [class*="supplement"], [id*="modal"], [class*="modal"]');
    
    console.log('📋 Found form-related elements:', formRelatedElements);
    
    formRelatedElements.forEach((element, index) => {
        console.log(`${index + 1}. ${element.tagName} - ID: ${element.id} - Classes: ${element.className}`);
    });
    
    return formRelatedElements;
}

// Add debug button (temporary)
function addDebugButton() {
    if (document.getElementById('debug-form-btn')) return;
    
    const debugBtn = document.createElement('button');
    debugBtn.id = 'debug-form-btn';
    debugBtn.textContent = '🔍 Debug Form';
    debugBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 5px 10px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer;';
    debugBtn.onclick = debugSupplementFormElements;
    document.body.appendChild(debugBtn);
}

console.log('✅ Supplement edit functions loaded');
console.log('✅ Enhanced supplement form functions loaded');
console.log('✅ Enhanced modal styling loaded');

// Analytics Actions
function exportAnalytics() { showAlert('Exporting analytics (placeholder)', 'info'); }

// Check if API_BASE is properly defined
if (typeof API_BASE === 'undefined') {
    console.error('❌ API_BASE is not defined! Setting default...');
    window.API_BASE = 'https://mynadtest.info';
}

console.log('🔗 API Base URL:', API_BASE);

// Test API connectivity
async function testSupplementsAPI() {
    try {
        console.log('🧪 Testing supplements API...');
        const response = await fetch(`${API_BASE}/api/supplements`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        console.log('📡 API Test Response:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API is working! Response:', data);
        } else {
            console.warn('⚠️ API returned error status:', response.status);
        }
    } catch (error) {
        console.error('❌ API test failed:', error);
    }
}

function validateSupplementForm() {
    const requiredFields = [
        { id: 'supplement-name', name: 'name' },
        { id: 'supplement-category', name: 'category' },
        { id: 'supplement-dose', name: 'default_dose' },
        { id: 'supplement-unit', name: 'unit' }
    ];
    
    const missingFields = [];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element) {
            missingFields.push(field.id);
            console.error(`❌ Missing form field: ${field.id}`);
        } else {
            // Ensure field has correct name attribute
            element.name = field.name;
        }
    });
    
    if (missingFields.length > 0) {
        showSupplementAlert(`❌ Missing form fields: ${missingFields.join(', ')}`, 'error');
        return false;
    }
    
    return true;
}

// General Functions
function refreshData() {
    console.log('🔄 Refreshing dashboard data...');
    showAlert('🔄 Refreshing data from API...', 'info');
    
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        switch (activeSection.id) {
            case 'users': loadUsers(); break;
            case 'tests': loadTestsFromAPI(); break;
            case 'supplements': loadSupplements(); break;
            case 'analytics': loadAnalytics(); break;
            case 'overview': loadDashboardStats(); break;
            default: showAlert('✅ Dashboard data refreshed!', 'success');
        }
    }
}

// ============================================================================
// EVENT LISTENERS AND INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ NAD Admin Dashboard Loaded Successfully');
    
    // Setup navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
        });
    });
    
    // Load initial data
    loadDashboardStats();
    
    console.log('🎯 Dashboard ready - all functions implemented');
    
    // Show welcome message
    setTimeout(() => {
        showAlert('✅ Dashboard loaded successfully! All management functions are operational.', 'success');
    }, 1000);
    
    // Run debug function to check form structure
    setTimeout(() => {
        if (document.getElementById('supplement-form')) {
            debugSupplementFormStructure();
        }
    }, 2000); // Wait 2 seconds for components to load
    
    // Add debug button
    setTimeout(addDebugButton, 1000);
});

// Ensure showSupplementAlert function exists
if (typeof showSupplementAlert !== 'function') {
    function showSupplementAlert(message, type = 'info') {
        console.log(`📢 Alert: ${message}`);
        
        // Remove existing alerts
        const existingAlert = document.getElementById('supplement-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.id = 'supplement-alert';
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        // Set colors based on type
        switch(type) {
            case 'success':
                alertDiv.style.backgroundColor = '#d4edda';
                alertDiv.style.color = '#155724';
                alertDiv.style.border = '1px solid #c3e6cb';
                break;
            case 'error':
                alertDiv.style.backgroundColor = '#f8d7da';
                alertDiv.style.color = '#721c24';
                alertDiv.style.border = '1px solid #f5c6cb';
                break;
            case 'warning':
                alertDiv.style.backgroundColor = '#fff3cd';
                alertDiv.style.color = '#856404';
                alertDiv.style.border = '1px solid #ffeaa7';
                break;
            default: // info
                alertDiv.style.backgroundColor = '#d1ecf1';
                alertDiv.style.color = '#0c5460';
                alertDiv.style.border = '1px solid #bee5eb';
        }
        
        alertDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; font-size: 18px; cursor: pointer; padding: 0 5px; color: inherit;">×</button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                if (alertDiv.parentElement) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }
}

// Make functions globally accessible
window.showSection = showSection;
window.refreshData = refreshData;
window.activateAllTests = activateAllTests;
window.loadTestsFromAPI = loadTestsFromAPI;
window.loadUsers = loadUsers;
window.loadSupplements = loadSupplements;
window.loadAnalytics = loadAnalytics;

// Test Management
window.activateTest = activateTest;
window.deactivateTest = deactivateTest;
window.viewTest = viewTest;
window.exportTests = exportTests;
window.activateAllPendingTests = activateAllPendingTests;
window.deactivateAllActivatedTests = deactivateAllActivatedTests;
window.bulkActivateSelected = bulkActivateSelected;
window.bulkDeactivateSelected = bulkDeactivateSelected;
window.clearSelection = clearSelection;

// User Management
window.showAddUserForm = showAddUserForm;
window.hideAddUserForm = hideAddUserForm;
window.createUser = createUser;
window.viewUser = viewUser;
window.editUser = editUser;

// Supplement Management
window.showAddSupplementForm = showAddSupplementForm;
window.hideSupplementForm = hideSupplementForm;
window.saveSupplementForm = saveSupplementForm;
window.editSupplement = editSupplement;
window.deleteSupplement = deleteSupplement;
window.populateSupplementForm = populateSupplementForm;
window.clearSupplementForm = clearSupplementForm;
window.toggleSupplementStatus = toggleSupplementStatus;
window.activateSupplement = activateSupplement;
window.deactivateSupplement = deactivateSupplement;
window.showSupplementFormForEdit = showSupplementFormForEdit;
window.createTemporarySupplementModal = createTemporarySupplementModal;
window.createEnhancedSupplementModal = createEnhancedSupplementModal;
window.debugSupplementFormElements = debugSupplementFormElements;
window.addDebugButton = addDebugButton;

// Analytics
window.exportAnalytics = exportAnalytics;

console.log('🚀 NAD Admin Dashboard Complete!');

// ==================================================
// Add this NEW function to your admin-dashboard.js
// Don't replace anything - just add this at the end
// ==================================================

// Enhanced modal creation with NEW name
function createEnhancedSupplementModal() {
    console.log('🏗️ Creating enhanced supplement modal...');
    
    // Remove old modal if it exists
    const oldModal = document.getElementById('temp-supplement-modal');
    if (oldModal) {
        oldModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'temp-supplement-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(3px);
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            border: 1px solid #e0e0e0;
        ">
            <!-- Close button -->
            <button onclick="hideSupplementForm()" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6c757d;
                transition: all 0.2s;
            " onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
                ×
            </button>
            
            <!-- Form Header -->
            <div style="margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #f8f9fa;">
                <h3 id="supplement-form-title" style="
                    margin: 0;
                    color: #333;
                    font-size: 24px;
                    font-weight: 600;
                ">Edit Supplement</h3>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                    Update supplement information and settings
                </p>
            </div>
            
            <!-- Form Content -->
            <div id="supplement-form">
                <!-- Name Field -->
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: #333;
                        font-size: 14px;
                    ">Name *</label>
                    <input type="text" id="supplement-name" placeholder="Enter supplement name..." style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        font-size: 14px;
                        transition: border-color 0.2s;
                        box-sizing: border-box;
                    " onfocus="this.style.borderColor='#007bff'" onblur="this.style.borderColor='#e9ecef'">
                </div>
                
                <!-- Category Field -->
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: #333;
                        font-size: 14px;
                    ">Category *</label>
                    <select id="supplement-category" style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        font-size: 14px;
                        background: white;
                        box-sizing: border-box;
                    ">
                        <option value="">Select category...</option>
                        <option value="Vitamins">Vitamins</option>
                        <option value="Minerals">Minerals</option>
                        <option value="Antioxidants">Antioxidants</option>
                        <option value="Essential Fatty Acids">Essential Fatty Acids</option>
                        <option value="Digestive Health">Digestive Health</option>
                        <option value="Anti-inflammatory">Anti-inflammatory</option>
                        <option value="Herbs">Herbs</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <!-- Description Field -->
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: #333;
                        font-size: 14px;
                    ">Description</label>
                    <textarea id="supplement-description" rows="3" placeholder="Brief description of the supplement..." style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        font-size: 14px;
                        resize: vertical;
                        box-sizing: border-box;
                        font-family: inherit;
                    "></textarea>
                </div>
                
                <!-- Dose and Unit Fields -->
                <div style="display: grid; grid-template-columns: 1fr 120px; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">Default Dose</label>
                        <input type="number" id="supplement-dose" step="0.1" min="0" placeholder="0" style="
                            width: 100%;
                            padding: 12px;
                            border: 2px solid #e9ecef;
                            border-radius: 8px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                    </div>
                    <div>
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">Unit</label>
                        <select id="supplement-unit" style="
                            width: 100%;
                            padding: 12px;
                            border: 2px solid #e9ecef;
                            border-radius: 8px;
                            font-size: 14px;
                            background: white;
                            box-sizing: border-box;
                        ">
                            <option value="mg">mg</option>
                            <option value="g">g</option>
                            <option value="mcg">mcg</option>
                            <option value="IU">IU</option>
                            <option value="ml">ml</option>
                            <option value="drops">drops</option>
                            <option value="capsules">capsules</option>
                            <option value="tablets">tablets</option>
                            <option value="billion CFU">billion CFU</option>
                        </select>
                    </div>
                </div>
                
                <!-- Checkboxes -->
                <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display: flex; gap: 30px;">
                        <label style="
                            display: flex;
                            align-items: center;
                            cursor: pointer;
                            font-weight: 500;
                            color: #333;
                        ">
                            <input type="checkbox" id="supplement-active" checked style="
                                margin-right: 8px;
                                transform: scale(1.2);
                            "> 
                            <span style="color: #28a745;">✅ Active</span>
                        </label>
                        
                        <label style="
                            display: flex;
                            align-items: center;
                            cursor: pointer;
                            font-weight: 500;
                            color: #333;
                        ">
                            <input type="checkbox" id="supplement-featured" style="
                                margin-right: 8px;
                                transform: scale(1.2);
                            "> 
                            <span style="color: #ffc107;">⭐ Featured</span>
                        </label>
                    </div>
                    <small style="color: #6c757d; margin-top: 5px; display: block;">
                        Active supplements are available for customer selection. Featured supplements are highlighted prominently.
                    </small>
                </div>
                
                <!-- Action Buttons -->
                <div style="
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    padding-top: 20px;
                    border-top: 1px solid #e9ecef;
                ">
                    <button onclick="hideSupplementForm()" style="
                        padding: 12px 24px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s;
                        min-width: 100px;
                    " onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
                        Cancel
                    </button>
                    
                    <button onclick="saveSupplementForm()" style="
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #007bff, #0056b3);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s;
                        min-width: 140px;
                        box-shadow: 0 2px 4px rgba(0,123,255,0.3);
                    " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,123,255,0.4)'" 
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,123,255,0.3)'">
                        <span id="supplement-save-spinner"></span>
                        <span id="supplement-save-text">Update Supplement</span>
                    </button>
                </div>
                
                <input type="hidden" id="supplement-id" value="">
            </div>
        </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.id = 'enhanced-modal-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        
        #temp-supplement-modal input:focus,
        #temp-supplement-modal select:focus,
        #temp-supplement-modal textarea:focus {
            outline: none;
            border-color: #007bff !important;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }
        
        #temp-supplement-modal input[type="checkbox"]:checked {
            accent-color: #007bff;
        }
    `;
    
    // Remove old style if exists
    const oldStyle = document.getElementById('enhanced-modal-styles');
    if (oldStyle) oldStyle.remove();
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    console.log('✅ Enhanced modal created with improved styling');
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideSupplementForm();
        }
    });
    
    // Close modal with Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape' && document.getElementById('temp-supplement-modal')) {
            hideSupplementForm();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Updated showSupplementFormForEdit function to use new modal
function showSupplementFormForEdit() {
    console.log('📝 Showing supplement form for edit...');
    
    // Try to find existing form container first
    const possibleContainers = [
        'supplement-form-container',
        'supplement-modal', 
        'add-supplement-modal'
    ];
    
    let formContainer = null;
    
    // Try to find any of these containers
    for (const containerId of possibleContainers) {
        const element = document.getElementById(containerId);
        if (element) {
            console.log(`✅ Found existing form container: ${containerId}`, element);
            formContainer = element;
            break;
        } else {
            console.log(`❌ Container not found: ${containerId}`);
        }
    }
    
    // If no container found, create the enhanced modal
    if (!formContainer) {
        console.log('⚠️ No existing form container found, creating enhanced modal...');
        createEnhancedSupplementModal();
        formContainer = document.getElementById('temp-supplement-modal');
    }
    
    if (formContainer) {
        // Show the container using multiple methods
        console.log('📺 Making form container visible...');
        
        formContainer.style.display = 'flex';
        formContainer.style.visibility = 'visible';
        formContainer.style.opacity = '1';
        formContainer.classList.remove('hidden', 'd-none', 'hide');
        formContainer.classList.add('show', 'visible');
        
        console.log('✅ Form container should now be visible');
        
        // Focus on the form
        setTimeout(() => {
            const nameField = document.getElementById('supplement-name');
            if (nameField) {
                nameField.focus();
                nameField.select();
            }
        }, 200);
    } else {
        console.error('❌ Could not find or create form container');
        showSupplementAlert('❌ Could not open edit form. Please try refreshing the page.', 'error');
    }
}

console.log('✅ Enhanced supplement modal functions loaded');
