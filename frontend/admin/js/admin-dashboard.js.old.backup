// NAD Admin Dashboard - Fixed JavaScript
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
// SUPPLEMENT FORM FUNCTIONS - DEFINED FIRST
// ============================================================================

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
        console.log('❌ Existing form not found');
        showAlert('❌ Form not found', 'error');
    }
}

function clearExistingSupplementForm() {
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
        }
    });
    
    // Set defaults
    const unitField = document.getElementById('supplement-unit');
    if (unitField) unitField.value = 'mg';
    
    const activeField = document.getElementById('supplement-active');
    if (activeField) activeField.checked = true;
}

function hideExistingSupplementForm() {
    const form = document.getElementById('supplement-form');
    if (form) {
        form.style.display = 'none';
    }
}

// Make functions globally accessible
window.showAddSupplementForm = showAddSupplementFormExisting;
window.hideSupplementForm = hideExistingSupplementForm;
window.saveSupplementForm = saveExistingSupplementForm;

console.log('✅ Supplement form functions defined');

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

// ============================================================================
// SUPPLEMENT MANAGEMENT FUNCTIONS
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

// ============================================================================
// INITIALIZATION
// ============================================================================

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
    
    // Set up the existing supplement form submit handler
    const existingForm = document.getElementById('supplement-form');
    if (existingForm) {
        existingForm.removeAttribute('onsubmit');
        existingForm.addEventListener('submit', saveExistingSupplementForm);
        console.log('✅ Added submit handler to existing supplement form');
    }
    
    // Load initial data after a short delay
    setTimeout(() => {
        console.log('🔄 Loading initial dashboard stats...');
        loadDashboardStats();
    }, 1000);
    
    console.log('🎯 NAD Admin Dashboard initialization complete!');
});

console.log('📋 Admin Dashboard JavaScript file loaded successfully');
