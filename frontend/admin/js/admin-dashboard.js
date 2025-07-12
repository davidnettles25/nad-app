// NAD Admin Dashboard - Clean Version
const API_BASE = 'https://mynadtest.info';

// Global variables
let allSupplements = [];
let filteredSupplements = [];

console.log('🚀 NAD Admin Dashboard JavaScript Loaded');
console.log('📡 API Base:', API_BASE);

// ============================================================================
// SUPPLEMENT FORM FUNCTIONS
// ============================================================================

async function saveSupplementForm(event) {
    if (event) event.preventDefault();
    console.log('💾 Saving supplement form...');
    
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

function showAddSupplementForm() {
    console.log('📝 Showing supplement form...');
    const form = document.getElementById('supplement-form');
    if (form) {
        clearSupplementForm();
        form.style.display = 'block';
        
        const title = document.getElementById('supplement-form-title');
        if (title) title.textContent = 'Add New Supplement';
        
        setTimeout(() => {
            const nameField = document.getElementById('supplement-name');
            if (nameField) nameField.focus();
        }, 100);
    }
}

function hideSupplementForm() {
    const form = document.getElementById('supplement-form');
    if (form) form.style.display = 'none';
}

function clearSupplementForm() {
    const fields = ['supplement-name', 'supplement-category', 'supplement-description', 'supplement-dose'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
    
    const unitField = document.getElementById('supplement-unit');
    if (unitField) unitField.value = 'mg';
    
    const activeField = document.getElementById('supplement-active');
    if (activeField) activeField.checked = true;
}

// ============================================================================
// SUPPLEMENT MANAGEMENT
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
    const stats = {
        total: supplements.length,
        active: supplements.filter(s => s.is_active).length,
        inactive: supplements.filter(s => !s.is_active).length,
        categories: new Set(supplements.map(s => s.category)).size
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
    
    console.log('📊 Supplement stats updated:', stats);
}

function renderSupplementsTable() {
    const tbody = document.getElementById('supplements-table-body');
    if (!tbody) return;
    
    if (filteredSupplements.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="5">
                <div class="empty-state">
                    <h4>No Supplements Found</h4>
                    <button class="btn" onclick="loadSupplements()">🔄 Retry</button>
                </div>
            </td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    filteredSupplements.forEach(supplement => {
        const row = document.createElement('tr');
        const dose = supplement.default_dose ? 
            `${supplement.default_dose} ${supplement.unit || 'mg'}` : 'Not set';
        
        row.innerHTML = `
            <td><strong>${supplement.name}</strong><br><small>${supplement.description || 'No description'}</small></td>
            <td>${supplement.category || 'Other'}</td>
            <td>${dose}</td>
            <td><span class="status-badge ${supplement.is_active ? 'status-activated' : 'status-not-activated'}">${supplement.is_active ? '✅ Active' : '❌ Inactive'}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editSupplement(${supplement.id})">✏️ Edit</button>
                <button class="btn btn-sm ${supplement.is_active ? 'btn-warning' : 'btn-success'}" onclick="${supplement.is_active ? 'deactivateSupplement' : 'activateSupplement'}(${supplement.id})">${supplement.is_active ? '❌ Deactivate' : '⚡ Activate'}</button>
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
        <tr><td colspan="5">
            <div class="empty-state">
                <h4>Error Loading Supplements</h4>
                <p>${errorMessage}</p>
                <button class="btn" onclick="loadSupplements()">🔄 Retry</button>
            </div>
        </td></tr>
    `;
    showAlert('❌ Failed to load supplements.', 'error');
}

// Placeholder functions
function editSupplement(id) {
    showAlert(`✏️ Edit supplement ${id} - Feature coming soon!`, 'info');
}

function activateSupplement(id) {
    showAlert(`⚡ Activate supplement ${id} - Feature coming soon!`, 'info');
}

function deactivateSupplement(id) {
    showAlert(`❌ Deactivate supplement ${id} - Feature coming soon!`, 'info');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const navLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    if (sectionName === 'supplements') {
        loadSupplements();
    }
}

function showAlert(message, type = 'info') {
    console.log('📢 Alert:', message, '(Type:', type + ')');
    
    let alertDiv = document.getElementById('supplement-alert');
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.id = 'supplement-alert';
        alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; max-width: 400px;';
        document.body.appendChild(alertDiv);
    }
    
    const colors = {
        success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
        error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
        warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
        info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
    };
    
    const style = colors[type] || colors.info;
    alertDiv.innerHTML = `<div style="padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid ${style.border}; background: ${style.bg}; color: ${style.color}; font-weight: 500;">${message}</div>`;
    
    if (type === 'success' || type === 'info') {
        setTimeout(() => alertDiv.innerHTML = '', 5000);
    }
}

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
    
    // Setup supplement form submit handler
    const supplementForm = document.getElementById('supplement-form');
    if (supplementForm) {
        supplementForm.removeAttribute('onsubmit');
        supplementForm.addEventListener('submit', saveSupplementForm);
        console.log('✅ Added submit handler to supplement form');
    }
    
    console.log('🎯 NAD Admin Dashboard initialization complete!');
});

// Make functions globally accessible
window.showAddSupplementForm = showAddSupplementForm;
window.hideSupplementForm = hideSupplementForm;
window.saveSupplementForm = saveSupplementForm;
window.loadSupplements = loadSupplements;
window.editSupplement = editSupplement;
window.activateSupplement = activateSupplement;
window.deactivateSupplement = deactivateSupplement;
window.showSection = showSection;
window.showAlert = showAlert;

console.log('📋 Admin Dashboard JavaScript file loaded successfully');
