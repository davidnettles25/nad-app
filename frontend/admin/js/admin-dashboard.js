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

// ============================================================================
// MODAL SUPPLEMENT FORM (PRETTIER VERSION)
// ============================================================================

function createSupplementModal() {
    console.log('🏗️ Creating supplement modal...');
    
    // Remove any existing modal
    const existingModal = document.getElementById('supplement-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'supplement-modal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 1000;
        align-items: center;
        justify-content: center;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            animation: modalFadeIn 0.3s ease-out;
        ">
            <div class="modal-header" style="
                padding: 24px 24px 16px;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px 12px 0 0;
            ">
                <h3 id="modal-supplement-form-title" style="
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 600;
                ">Add New Supplement</h3>
                <button type="button" class="btn-close" style="
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: white;
                    padding: 0;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">&times;</button>
            </div>
            
            <div class="modal-body" style="padding: 24px;">
                <form id="modal-supplement-form">
                    <input type="hidden" id="modal-supplement-id" name="id">
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div class="form-group">
                            <label for="modal-supplement-name" style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Supplement Name *</label>
                            <input type="text" id="modal-supplement-name" name="name" required 
                                   placeholder="Enter supplement name"
                                   style="
                                       width: 100%;
                                       padding: 12px 16px;
                                       border: 2px solid #e5e7eb;
                                       border-radius: 8px;
                                       font-size: 16px;
                                       transition: border-color 0.2s;
                                       box-sizing: border-box;
                                   "
                                   onfocus="this.style.borderColor='#667eea'"
                                   onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                        
                        <div class="form-group">
                            <label for="modal-supplement-category" style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Category *</label>
                            <select id="modal-supplement-category" name="category" required style="
                                width: 100%;
                                padding: 12px 16px;
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                font-size: 16px;
                                background: white;
                                transition: border-color 0.2s;
                                box-sizing: border-box;
                            "
                            onfocus="this.style.borderColor='#667eea'"
                            onblur="this.style.borderColor='#e5e7eb'">
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
                        
                        <div class="form-group">
                            <label for="modal-supplement-dose" style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Default Dose</label>
                            <input type="number" id="modal-supplement-dose" name="default_dose" 
                                   step="0.1" min="0" placeholder="e.g., 100"
                                   style="
                                       width: 100%;
                                       padding: 12px 16px;
                                       border: 2px solid #e5e7eb;
                                       border-radius: 8px;
                                       font-size: 16px;
                                       transition: border-color 0.2s;
                                       box-sizing: border-box;
                                   "
                                   onfocus="this.style.borderColor='#667eea'"
                                   onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                        
                        <div class="form-group">
                            <label for="modal-supplement-unit" style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Unit</label>
                            <select id="modal-supplement-unit" name="unit" style="
                                width: 100%;
                                padding: 12px 16px;
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                font-size: 16px;
                                background: white;
                                transition: border-color 0.2s;
                                box-sizing: border-box;
                            "
                            onfocus="this.style.borderColor='#667eea'"
                            onblur="this.style.borderColor='#e5e7eb'">
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
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label for="modal-supplement-description" style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #374151;
                            font-size: 14px;
                        ">Description</label>
                        <textarea id="modal-supplement-description" name="description" rows="3"
                                  placeholder="Brief description of the supplement and its benefits"
                                  style="
                                      width: 100%;
                                      padding: 12px 16px;
                                      border: 2px solid #e5e7eb;
                                      border-radius: 8px;
                                      font-size: 16px;
                                      resize: vertical;
                                      transition: border-color 0.2s;
                                      box-sizing: border-box;
                                      font-family: inherit;
                                  "
                                  onfocus="this.style.borderColor='#667eea'"
                                  onblur="this.style.borderColor='#e5e7eb'"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                        <label style="
                            display: flex;
                            align-items: center;
                            cursor: pointer;
                            font-weight: 600;
                            color: #374151;
                        ">
                            <input type="checkbox" id="modal-supplement-active" name="is_active" checked style="
                                margin-right: 12px;
                                transform: scale(1.2);
                                accent-color: #667eea;
                            ">
                            Active Supplement
                        </label>
                    </div>
                    
                    <div style="
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                        padding-top: 20px;
                        border-top: 1px solid #e9ecef;
                    ">
                        <button type="button" class="cancel-btn" style="
                            padding: 12px 24px;
                            border: 2px solid #d1d5db;
                            background: #f9fafb;
                            color: #6b7280;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            transition: all 0.2s;
                        " onmouseover="this.style.backgroundColor='#f3f4f6'"
                           onmouseout="this.style.backgroundColor='#f9fafb'">
                            Cancel
                        </button>
                        <button type="submit" class="save-btn" style="
                            padding: 12px 24px;
                            border: none;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='translateY(-1px)'"
                           onmouseout="this.style.transform='translateY(0)'">
                            💊 Save Supplement
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add CSS for modal animation
    if (!document.getElementById('modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            @keyframes modalFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-50px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add event listeners
    const closeBtn = modal.querySelector('.btn-close');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const form = modal.querySelector('#modal-supplement-form');
    
    closeBtn.addEventListener('click', hideSupplementModal);
    cancelBtn.addEventListener('click', hideSupplementModal);
    form.addEventListener('submit', saveModalSupplementForm);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideSupplementModal();
        }
    });
    
    document.body.appendChild(modal);
    console.log('✅ Beautiful modal created');
    return modal;
}

async function saveModalSupplementForm(event) {
    event.preventDefault();
    console.log('💾 Saving modal supplement form...');
    
    const nameField = document.getElementById('modal-supplement-name');
    const categoryField = document.getElementById('modal-supplement-category');
    const descriptionField = document.getElementById('modal-supplement-description');
    const doseField = document.getElementById('modal-supplement-dose');
    const unitField = document.getElementById('modal-supplement-unit');
    const activeField = document.getElementById('modal-supplement-active');
    
    const supplementData = {
        name: nameField?.value?.trim() || '',
        category: categoryField?.value || '',
        description: descriptionField?.value?.trim() || '',
        default_dose: doseField?.value || null,
        unit: unitField?.value || 'mg',
        is_active: activeField?.checked !== false
    };
    
    console.log('📝 Modal supplement data:', supplementData);
    
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
            hideSupplementModal();
            loadSupplements();
        } else {
            throw new Error(data.error || 'Failed to create supplement');
        }
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showAlert(`❌ Failed to save supplement: ${error.message}`, 'error');
    }
}

function hideSupplementModal() {
    const modal = document.getElementById('supplement-modal');
    if (modal) {
        modal.style.animation = 'modalFadeOut 0.2s ease-in';
        setTimeout(() => modal.remove(), 200);
    }
}

function showAddSupplementFormModal() {
    console.log('📝 Showing beautiful supplement modal...');
    
    // Create and show the modal
    createSupplementModal();
    
    // Focus on name field
    setTimeout(() => {
        const nameField = document.getElementById('modal-supplement-name');
        if (nameField) {
            nameField.focus();
        }
    }, 300);
}

// Override the showAddSupplementForm function to use modal
window.showAddSupplementForm = showAddSupplementFormModal;

console.log('✅ Beautiful modal supplement form loaded');

// ============================================================================
// EDIT SUPPLEMENT FUNCTIONALITY
// ============================================================================


function showEditSupplementModal(supplement) {
    console.log('📝 Showing edit supplement modal...');
    
    // Create the modal (same as add, but we'll populate it)
    createSupplementModal();
    
    // Update the title for editing
    const titleElement = document.getElementById('modal-supplement-form-title');
    if (titleElement) {
        titleElement.textContent = 'Edit Supplement';
    }
    
    // Populate the form with existing data
    populateModalSupplementForm(supplement);
    
    // Focus on name field
    setTimeout(() => {
        const nameField = document.getElementById('modal-supplement-name');
        if (nameField) {
            nameField.focus();
            nameField.select(); // Select all text for easy editing
        }
    }, 300);
}

function populateModalSupplementForm(supplement) {
    console.log('📝 Populating modal form with:', supplement);
    
    const fields = [
        { id: 'modal-supplement-id', value: supplement.id },
        { id: 'modal-supplement-name', value: supplement.name || '' },
        { id: 'modal-supplement-category', value: supplement.category || '' },
        { id: 'modal-supplement-description', value: supplement.description || '' },
        { id: 'modal-supplement-dose', value: supplement.default_dose || '' },
        { id: 'modal-supplement-unit', value: supplement.unit || 'mg' }
    ];
    
    // Populate text fields and selects
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            element.value = field.value;
            console.log(`✅ Set ${field.id} = ${field.value}`);
        } else {
            console.log(`⚠️ Field not found: ${field.id}`);
        }
    });
    
    // Handle checkbox
    const activeCheckbox = document.getElementById('modal-supplement-active');
    if (activeCheckbox) {
        activeCheckbox.checked = supplement.is_active === true || supplement.is_active === 1;
        console.log(`✅ Set modal-supplement-active = ${activeCheckbox.checked}`);
    }
    
    console.log('✅ Modal form populated successfully');
}

// Update the save function to handle both add and edit
async function saveModalSupplementFormUpdated(event) {
    event.preventDefault();
    console.log('💾 Saving modal supplement form...');
    
    const idField = document.getElementById('modal-supplement-id');
    const nameField = document.getElementById('modal-supplement-name');
    const categoryField = document.getElementById('modal-supplement-category');
    const descriptionField = document.getElementById('modal-supplement-description');
    const doseField = document.getElementById('modal-supplement-dose');
    const unitField = document.getElementById('modal-supplement-unit');
    const activeField = document.getElementById('modal-supplement-active');
    
    const id = idField?.value;
    const isEdit = id && id !== '';
    
    const supplementData = {
        name: nameField?.value?.trim() || '',
        category: categoryField?.value || '',
        description: descriptionField?.value?.trim() || '',
        default_dose: doseField?.value || null,
        unit: unitField?.value || 'mg',
        is_active: activeField?.checked !== false
    };
    
    console.log('📝 Modal supplement data:', supplementData);
    console.log('🔄 Is edit mode:', isEdit);
    
    if (!supplementData.name || !supplementData.category) {
        showAlert('❌ Please fill in all required fields (Name and Category)', 'error');
        return;
    }
    
    try {
        showAlert(`🔄 ${isEdit ? 'Updating' : 'Creating'} supplement...`, 'info');
        
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
            hideSupplementModal();
            loadSupplements(); // Reload the supplements list
        } else {
            throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} supplement`);
        }
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showAlert(`❌ Failed to save supplement: ${error.message}`, 'error');
    }
}

// Update the modal creation to use the updated save function
function createSupplementModalUpdated() {
    console.log('🏗️ Creating updated supplement modal...');
    
    // Remove any existing modal
    const existingModal = document.getElementById('supplement-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // This function is deprecated - use createSupplementModal instead
    return createSupplementModal();
}

// ============================================================================
// EDIT SUPPLEMENT FUNCTIONS (CLEAN VERSION)
// ============================================================================

function editSupplementClean(id) {
    console.log('📝 Editing supplement ID: ' + id);
    
    try {
        const supplement = allSupplements.find(s => s.id == id);
        if (!supplement) {
            throw new Error('Supplement not found');
        }
        
        console.log('📝 Found supplement:', supplement);
        showEditSupplementModalClean(supplement);
        
    } catch (error) {
        console.error('❌ Error:', error);
        showAlert('❌ Failed to load supplement: ' + error.message, 'error');
    }
}

function showEditSupplementModalClean(supplement) {
    console.log('📝 Showing edit modal...');
    
    // Use the existing modal creation but update for editing
    createSupplementModal();
    
    // Update title
    setTimeout(function() {
        const title = document.getElementById('modal-supplement-form-title');
        if (title) {
            title.textContent = 'Edit Supplement';
        }
        
        // Populate fields
        populateEditForm(supplement);
        
        // Focus on name field
        const nameField = document.getElementById('modal-supplement-name');
        if (nameField) {
            nameField.focus();
            nameField.select();
        }
    }, 200);
}

function populateEditForm(supplement) {
    console.log('📝 Populating form...');
    
    const idField = document.getElementById('modal-supplement-id');
    const nameField = document.getElementById('modal-supplement-name');
    const categoryField = document.getElementById('modal-supplement-category');
    const descField = document.getElementById('modal-supplement-description');
    const doseField = document.getElementById('modal-supplement-dose');
    const unitField = document.getElementById('modal-supplement-unit');
    const activeField = document.getElementById('modal-supplement-active');
    
    if (idField) idField.value = supplement.id;
    if (nameField) nameField.value = supplement.name || '';
    if (categoryField) categoryField.value = supplement.category || '';
    if (descField) descField.value = supplement.description || '';
    if (doseField) doseField.value = supplement.default_dose || '';
    if (unitField) unitField.value = supplement.unit || 'mg';
    if (activeField) activeField.checked = supplement.is_active !== false;
    
    console.log('✅ Form populated');
}

// Override the global functions
window.editSupplement = editSupplementClean;

console.log('✅ Clean edit functions loaded');
