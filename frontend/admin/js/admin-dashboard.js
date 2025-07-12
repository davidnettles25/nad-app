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
