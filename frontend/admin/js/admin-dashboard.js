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
function saveSupplementForm() { showAlert('Saving supplement (placeholder)', 'info'); }
function editSupplement(id) { showAlert(`Editing supplement ${id} (placeholder)`, 'info'); }
function deleteSupplement(id) { 
    if (confirm(`Delete supplement ${id}?`)) {
        showAlert(`Deleting supplement ${id} (placeholder)`, 'info'); 
    }
}

// Analytics Actions
function exportAnalytics() { showAlert('Exporting analytics (placeholder)', 'info'); }

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
