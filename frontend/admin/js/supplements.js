// NAD Supplements Management
const API_BASE = 'https://mynadtest.info';

// Supplements data
let allSupplements = [];
let filteredSupplements = [];

// Load supplements from API
async function loadSupplements() {
    console.log('💊 Loading supplements from API...');
    showSupplementAlert('🔄 Loading supplements from database...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/api/supplements`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Supplements API response:', data);
        
        if (data.success) {
            allSupplements = data.supplements || [];
            filteredSupplements = [...allSupplements];
            
            renderSupplementsTable();
            showSupplementAlert(`✅ Loaded ${allSupplements.length} supplements successfully!`, 'success');
            console.log(`✅ Loaded ${allSupplements.length} supplements`);
        } else {
            throw new Error(data.error || 'API returned success: false');
        }
    } catch (error) {
        console.error('❌ Error loading supplements:', error);
        showSupplementsError(error.message);
        showSupplementAlert(`❌ Failed to load supplements: ${error.message}`, 'error');
    }
}

// Render supplements table
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
                        <div class="icon">📦</div>
                        <h4>No Supplements Found</h4>
                        <p>Click "Add Supplement" to create your first supplement.</p>
                        <button class="btn btn-primary" onclick="showAddSupplementForm()">➕ Add First Supplement</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    filteredSupplements.forEach((supplement, index) => {
        const row = document.createElement('tr');
        
        const dose = supplement.default_dose ? 
            `${supplement.default_dose} ${supplement.unit || 'mg'}` : 
            'Not set';
        
        const statusBadge = supplement.is_active ? 
            '<span class="status-badge status-active">✅ Active</span>' :
            '<span class="status-badge status-inactive">❌ Inactive</span>';
        
        row.innerHTML = `
            <td>
                <strong>${supplement.name || 'Unnamed Supplement'}</strong>
                <br>
                <small>${supplement.description || 'No description'}</small>
            </td>
            <td>${supplement.category || 'Uncategorized'}</td>
            <td>${dose}</td>
            <td>${statusBadge}</td>
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
    
    console.log(`📊 Rendered ${filteredSupplements.length} supplements in table`);
}

// Show error state in table
function showSupplementsError(errorMessage) {
    const tbody = document.getElementById('supplements-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="5">
                <div class="error-state">
                    <div class="icon">⚠️</div>
                    <h4>Error Loading Supplements</h4>
                    <p>${errorMessage}</p>
                    <button class="btn btn-primary" onclick="loadSupplements()">🔄 Try Again</button>
                </div>
            </td>
        </tr>
    `;
}

// Show alerts for supplements section
function showSupplementAlert(message, type = 'info') {
    console.log(`📢 Supplement Alert [${type}]:`, message);
    
    let alertDiv = document.getElementById('supplement-alert');
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.id = 'supplement-alert';
        alertDiv.style.marginBottom = '20px';
        
        // Insert after section header
        const sectionHeader = document.querySelector('#supplements .section-header');
        if (sectionHeader) {
            sectionHeader.after(alertDiv);
        }
    }
    
    const alertClasses = {
        success: 'alert-success',
        error: 'alert-danger', 
        warning: 'alert-warning',
        info: 'alert-info'
    };
    
    const alertClass = alertClasses[type] || alertClasses.info;
    
    alertDiv.innerHTML = `
        <div class="alert ${alertClass}" role="alert">
            ${message}
        </div>
    `;
    
    // Auto-hide success and info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (alertDiv && alertDiv.innerHTML) {
                alertDiv.innerHTML = '';
            }
        }, 5000);
    }
}

// Placeholder functions
function showAddSupplementForm() {
    console.log('📝 Opening add supplement form...');
    showSupplementAlert('📝 Add supplement form - Coming soon!', 'info');
}

function editSupplement(id) {
    console.log(`✏️ Editing supplement ${id}...`);
    showSupplementAlert(`✏️ Edit supplement ${id} - Coming soon!`, 'info');
}

function activateSupplement(id) {
    console.log(`⚡ Activating supplement ${id}...`);
    showSupplementAlert(`⚡ Activate supplement ${id} - Coming soon!`, 'info');
}

function deactivateSupplement(id) {
    console.log(`❌ Deactivating supplement ${id}...`);
    showSupplementAlert(`❌ Deactivate supplement ${id} - Coming soon!`, 'info');
}

// Make functions globally available
window.loadSupplements = loadSupplements;
window.renderSupplementsTable = renderSupplementsTable;
window.showAddSupplementForm = showAddSupplementForm;
window.editSupplement = editSupplement;
window.activateSupplement = activateSupplement;
window.deactivateSupplement = deactivateSupplement;
window.showSupplementAlert = showSupplementAlert;

// Enhanced navigation setup
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Setting up navigation with auto-load...');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.getAttribute('data-section');
            console.log('🔗 Navigation clicked:', sectionName);
            
            if (sectionName) {
                showSection(sectionName);
            }
        });
    });
    
    // Show overview by default
    showSection('overview');
    
    console.log('✅ Navigation setup complete with auto-loading');
});

// Set flag to indicate supplements module is loaded
window.supplementsLoaded = true;
console.log('✅ Supplements management module loaded and flagged');