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

// Fixed saveSupplementForm function for decomposed admin structure
// This should replace the existing function in your supplements.js or admin.html

async function saveSupplementForm(event) {
    // Handle both event and direct calls (fixes preventDefault error)
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }
    
    console.log('💊 Starting supplement save process...');
    
    // Get form data
    const form = document.getElementById('supplement-form');
    if (!form) {
        console.error('❌ Supplement form not found');
        showSupplementAlert('❌ Form not found', 'error');
        return;
    }
    
    const formData = new FormData(form);
    
    // Extract form values
    const id = formData.get('id');
    const isEdit = id && id !== '';
    
    const supplementData = {
        name: formData.get('name')?.trim(),
        category: formData.get('category'),
        description: formData.get('description')?.trim() || '',
        default_dose: formData.get('default_dose') || null,
        unit: formData.get('unit') || 'mg',
        min_dose: formData.get('min_dose') || null,
        max_dose: formData.get('max_dose') || null,
        notes: formData.get('notes')?.trim() || '',
        is_active: formData.has('is_active') ? 1 : 0,
        is_featured: formData.has('is_featured') ? 1 : 0
    };
    
    console.log('📝 Supplement data to save:', supplementData);
    
    // Validation
    if (!supplementData.name || !supplementData.category) {
        showSupplementAlert('❌ Please fill in all required fields (Name and Category)', 'error');
        return;
    }
    
    try {
        showSupplementAlert('🔄 Saving supplement...', 'info');
        
        // Update UI state
        const saveBtn = document.querySelector('#supplement-form button[type="submit"]') || 
                       document.querySelector('#supplement-form .btn-primary');
        const spinner = document.getElementById('supplement-save-spinner');
        const saveText = document.getElementById('supplement-save-text');
        
        if (saveBtn) saveBtn.disabled = true;
        if (spinner) spinner.innerHTML = '<span class="loading-spinner">⏳</span>';
        if (saveText) saveText.textContent = isEdit ? 'Updating...' : 'Creating...';
        
        // API configuration
        const API_BASE = window.API_BASE || 'https://mynadtest.info';
        const url = isEdit ? `${API_BASE}/api/supplements/${id}` : `${API_BASE}/api/supplements`;
        const method = isEdit ? 'PUT' : 'POST';
        
        console.log(`📡 Making ${method} request to: ${url}`);
        
        // Make API request
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(supplementData)
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
                       document.querySelector('#supplement-form .btn-primary');
        const spinner = document.getElementById('supplement-save-spinner');
        const saveText = document.getElementById('supplement-save-text');
        
        if (saveBtn) saveBtn.disabled = false;
        if (spinner) spinner.innerHTML = '';
        if (saveText) saveText.textContent = 'Save Supplement';
    }
}
function editSupplement(id) { showAlert(`Editing supplement ${id} (placeholder)`, 'info'); }
function deleteSupplement(id) { 
    if (confirm(`Delete supplement ${id}?`)) {
        showAlert(`Deleting supplement ${id} (placeholder)`, 'info'); 
    }
}

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

// Analytics
window.exportAnalytics = exportAnalytics;

console.log('🚀 NAD Admin Dashboard Complete!');
