// NAD Admin Dashboard - Debug Version
const API_BASE = 'https://mynadtest.info';
let allSupplements = [];
let filteredSupplements = [];

console.log('🚀 Debug Admin Dashboard Loaded');

// ============================================================================
// SUPPLEMENT FUNCTIONS WITH DEBUGGING
// ============================================================================

async function loadSupplements() {
    console.log('💊 Loading supplements...');
    try {
        const response = await fetch(API_BASE + '/api/supplements');
        const data = await response.json();
        
        if (response.ok && data.success) {
            allSupplements = data.supplements || [];
            filteredSupplements = [...allSupplements];
            renderSupplementsTable();
            console.log('✅ Loaded ' + allSupplements.length + ' supplements');
        }
    } catch (error) {
        console.error('❌ Error loading supplements:', error);
    }
}

function renderSupplementsTable() {
    const tbody = document.getElementById('supplements-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    filteredSupplements.forEach(supplement => {
        const row = document.createElement('tr');
        const dose = supplement.default_dose ? 
            supplement.default_dose + ' ' + (supplement.unit || 'mg') : 'Not set';
        
        row.innerHTML = 
            '<td><strong>' + supplement.name + '</strong><br><small>' + (supplement.description || '') + '</small></td>' +
            '<td>' + (supplement.category || 'Other') + '</td>' +
            '<td>' + dose + '</td>' +
            '<td><span class="status-badge">' + (supplement.is_active ? '✅ Active' : '❌ Inactive') + '</span></td>' +
            '<td>' +
                '<button class="btn btn-sm btn-primary" onclick="editSupplement(' + supplement.id + ')">✏️ Edit</button> ' +
                '<button class="btn btn-sm btn-success" onclick="showAlert(\'Feature coming soon\', \'info\')">⚡ Activate</button>' +
            '</td>';
        tbody.appendChild(row);
    });
}

function showAddSupplementForm() {
    console.log('📝 Add new supplement');
    showSupplementModal(null);
}

function editSupplement(id) {
    console.log('📝 Edit supplement:', id);
    const supplement = allSupplements.find(s => s.id == id);
    if (supplement) {
        showSupplementModal(supplement);
    } else {
        showAlert('Supplement not found', 'error');
    }
}

function showSupplementModal(supplement) {
    const isEdit = supplement !== null;
    console.log('📝 Showing modal, edit mode:', isEdit);
    
    // Remove existing modal
    const existingModal = document.getElementById('supplement-modal');
    if (existingModal) existingModal.remove();
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'supplement-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;';
    
    modal.innerHTML = 
        '<div style="background: white; padding: 20px; border-radius: 12px; width: 500px; max-width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">' +
            '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: -20px -20px 20px -20px; padding: 20px; border-radius: 12px 12px 0 0;">' +
                '<h3 style="margin: 0;">' + (isEdit ? '✏️ Edit Supplement' : '➕ Add New Supplement') + '</h3>' +
            '</div>' +
            
            '<div id="supplement-form-container">' +
                '<input type="hidden" id="supplement-id" value="' + (isEdit ? supplement.id : '') + '">' +
                '<input type="hidden" id="is-edit" value="' + (isEdit ? 'true' : 'false') + '">' +
                
                '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">' +
                    '<div>' +
                        '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Name *</label>' +
                        '<input type="text" id="supplement-name" required value="' + (isEdit ? supplement.name || '' : '') + '" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box;">' +
                    '</div>' +
                    '<div>' +
                        '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Category *</label>' +
                        '<select id="supplement-category" required style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box;">' +
                            '<option value="">Select...</option>' +
                            '<option value="Vitamins"' + (isEdit && supplement.category === 'Vitamins' ? ' selected' : '') + '>Vitamins</option>' +
                            '<option value="Minerals"' + (isEdit && supplement.category === 'Minerals' ? ' selected' : '') + '>Minerals</option>' +
                            '<option value="Antioxidants"' + (isEdit && supplement.category === 'Antioxidants' ? ' selected' : '') + '>Antioxidants</option>' +
                            '<option value="Other"' + (isEdit && supplement.category === 'Other' ? ' selected' : '') + '>Other</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                
                '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">' +
                    '<div>' +
                        '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Dose</label>' +
                        '<input type="number" id="supplement-dose" step="0.1" min="0" value="' + (isEdit ? supplement.default_dose || '' : '') + '" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box;">' +
                    '</div>' +
                    '<div>' +
                        '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Unit</label>' +
                        '<select id="supplement-unit" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box;">' +
                            '<option value="mg"' + (isEdit && supplement.unit === 'mg' ? ' selected' : '') + '>mg</option>' +
                            '<option value="g"' + (isEdit && supplement.unit === 'g' ? ' selected' : '') + '>g</option>' +
                            '<option value="IU"' + (isEdit && supplement.unit === 'IU' ? ' selected' : '') + '>IU</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                
                '<div style="margin-bottom: 15px;">' +
                    '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Description</label>' +
                    '<textarea id="supplement-description" rows="3" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box; resize: vertical;">' + (isEdit ? supplement.description || '' : '') + '</textarea>' +
                '</div>' +
                
                '<div style="margin-bottom: 20px;">' +
                    '<label style="display: flex; align-items: center; cursor: pointer;">' +
                        '<input type="checkbox" id="supplement-active"' + (isEdit ? (supplement.is_active ? ' checked' : '') : ' checked') + ' style="margin-right: 10px; transform: scale(1.2);"> Active' +
                    '</label>' +
                '</div>' +
                
                '<div style="text-align: right; border-top: 1px solid #e5e7eb; padding-top: 15px;">' +
                    '<button type="button" onclick="closeSupplementModal()" style="margin-right: 10px; padding: 10px 20px; border: 2px solid #d1d5db; background: #f9fafb; border-radius: 6px; cursor: pointer;">Cancel</button>' +
                    '<button type="button" id="save-supplement-btn" style="padding: 10px 20px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">💊 ' + (isEdit ? 'Update' : 'Create') + ' Supplement</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    document.body.appendChild(modal);
    
    // Add click handler to save button (NOT form submit)
    document.getElementById('save-supplement-btn').addEventListener('click', function(e) {
        console.log('🔘 Save button clicked');
        e.preventDefault();
        e.stopPropagation();
        saveSupplementData();
    });
    
    // Prevent any form submission
    const formContainer = document.getElementById('supplement-form-container');
    formContainer.addEventListener('submit', function(e) {
        console.log('❌ Form submit prevented');
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
    
    // Focus on name field
    setTimeout(() => {
        const nameField = document.getElementById('supplement-name');
        if (nameField) {
            nameField.focus();
            if (isEdit) nameField.select();
        }
    }, 100);
}

async function saveSupplementData() {
    console.log('💾 saveSupplementData called');
    
    const isEdit = document.getElementById('is-edit').value === 'true';
    const id = document.getElementById('supplement-id').value;
    
    const data = {
        name: document.getElementById('supplement-name').value.trim(),
        category: document.getElementById('supplement-category').value,
        description: document.getElementById('supplement-description').value.trim(),
        default_dose: document.getElementById('supplement-dose').value || null,
        unit: document.getElementById('supplement-unit').value,
        is_active: document.getElementById('supplement-active').checked
    };
    
    console.log('📝 Form data:', data);
    console.log('🔄 Is edit mode:', isEdit, 'ID:', id);
    
    if (!data.name || !data.category) {
        showAlert('Please fill in required fields (Name and Category)', 'error');
        return;
    }
    
    try {
        console.log('🚀 Starting API call...');
        
        const url = isEdit ? 
            API_BASE + '/api/supplements/' + id : 
            API_BASE + '/api/supplements';
        const method = isEdit ? 'PUT' : 'POST';
        
        console.log('🌐 Request:', method, url);
        console.log('📤 Sending data:', JSON.stringify(data));
        
        showAlert('🔄 Saving supplement...', 'info');
        
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('📨 Response status:', response.status);
        console.log('📨 Response ok:', response.ok);
        
        const result = await response.json();
        console.log('📨 Response data:', result);
        
        if (response.ok && result.success) {
            console.log('✅ Save successful!');
            showAlert('✅ Supplement ' + (isEdit ? 'updated' : 'created') + ' successfully!', 'success');
            
            // Close modal
            closeSupplementModal();
            
            // Reload supplements
            console.log('🔄 Reloading supplements...');
            await loadSupplements();
            
        } else {
            console.error('❌ API returned error:', result);
            throw new Error(result.error || result.message || 'Failed to save supplement');
        }
        
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showAlert('❌ Failed to save: ' + error.message, 'error');
    }
}

function closeSupplementModal() {
    console.log('🚪 Closing modal');
    const modal = document.getElementById('supplement-modal');
    if (modal) {
        modal.remove();
        console.log('✅ Modal removed');
    }
}

function showAlert(message, type) {
    console.log('📢 Alert:', message, 'Type:', type);
    
    // Remove existing alert
    const existingAlert = document.getElementById('alert');
    if (existingAlert) existingAlert.remove();
    
    const alert = document.createElement('div');
    alert.id = 'alert';
    alert.textContent = message;
    
    const colors = {
        success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
        error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
        info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
    };
    
    const style = colors[type] || colors.info;
    alert.style.cssText = 
        'position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 6px; z-index: 1001; font-weight: 500; max-width: 400px;' +
        'background: ' + style.bg + '; color: ' + style.color + '; border: 1px solid ' + style.border + ';';
    
    document.body.appendChild(alert);
    setTimeout(() => {
        if (alert.parentNode) alert.remove();
    }, type === 'error' ? 8000 : 4000);
}

// Make functions global
window.loadSupplements = loadSupplements;
window.editSupplement = editSupplement;
window.showAddSupplementForm = showAddSupplementForm;
window.closeSupplementModal = closeSupplementModal;
window.showAlert = showAlert;
window.saveSupplementData = saveSupplementData;

console.log('✅ Debug dashboard loaded');

// ============================================================================
// ENHANCED DEBUGGING FOR FORM FIELDS
// ============================================================================

async function saveSupplementDataWithDebug() {
    console.log('💾 saveSupplementDataWithDebug called');
    
    // Debug: Check if elements exist
    const isEditElement = document.getElementById('is-edit');
    const idElement = document.getElementById('supplement-id');
    const nameElement = document.getElementById('supplement-name');
    const categoryElement = document.getElementById('supplement-category');
    
    console.log('🔍 Form elements found:');
    console.log('  is-edit element:', isEditElement, 'value:', isEditElement?.value);
    console.log('  supplement-id element:', idElement, 'value:', idElement?.value);
    console.log('  supplement-name element:', nameElement, 'value:', nameElement?.value);
    console.log('  supplement-category element:', categoryElement, 'value:', categoryElement?.value);
    
    // Debug: Check if modal exists
    const modal = document.getElementById('supplement-modal');
    console.log('🔍 Modal found:', modal);
    
    // Debug: List all form inputs in the modal
    if (modal) {
        const allInputs = modal.querySelectorAll('input, select, textarea');
        console.log('🔍 All form inputs in modal:', allInputs.length);
        allInputs.forEach((input, index) => {
            console.log(`  Input ${index}: id="${input.id}", type="${input.type}", value="${input.value}"`);
        });
    }
    
    const isEdit = isEditElement?.value === 'true';
    const id = idElement?.value;
    
    const data = {
        name: nameElement?.value?.trim() || '',
        category: categoryElement?.value || '',
        description: document.getElementById('supplement-description')?.value?.trim() || '',
        default_dose: document.getElementById('supplement-dose')?.value || null,
        unit: document.getElementById('supplement-unit')?.value || 'mg',
        is_active: document.getElementById('supplement-active')?.checked || false
    };
    
    console.log('📝 Collected form data:', data);
    console.log('🔄 Is edit mode:', isEdit, 'ID:', id);
    
    if (!data.name || !data.category) {
        console.log('❌ Validation failed - missing required fields');
        console.log('  Name provided:', !!data.name, 'Value:', data.name);
        console.log('  Category provided:', !!data.category, 'Value:', data.category);
        showAlert('Please fill in required fields (Name and Category)', 'error');
        return;
    }
    
    // Continue with the save process...
    console.log('✅ Validation passed, proceeding with save');
    
    try {
        const url = isEdit ? 
            API_BASE + '/api/supplements/' + id : 
            API_BASE + '/api/supplements';
        const method = isEdit ? 'PUT' : 'POST';
        
        console.log('🌐 API Request:', method, url);
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showAlert('✅ Supplement ' + (isEdit ? 'updated' : 'created') + ' successfully!', 'success');
            closeSupplementModal();
            await loadSupplements();
        } else {
            throw new Error(result.error || 'Failed to save supplement');
        }
        
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showAlert('❌ Failed to save: ' + error.message, 'error');
    }
}

// Override the save function to use the debug version
window.saveSupplementData = saveSupplementDataWithDebug;

console.log('✅ Enhanced debugging added');

// ============================================================================
// DEBUG EDIT SUPPLEMENT FUNCTION
// ============================================================================

function editSupplementWithDebug(id) {
    console.log('📝 editSupplementWithDebug called with ID:', id, 'Type:', typeof id);
    
    // Debug: Check allSupplements array
    console.log('🔍 allSupplements array:', allSupplements);
    console.log('🔍 Looking for supplement with ID:', id);
    
    // Try different comparison methods
    const supplementById = allSupplements.find(s => s.id == id);
    const supplementByIdStrict = allSupplements.find(s => s.id === id);
    const supplementByIdString = allSupplements.find(s => s.id === String(id));
    const supplementByIdNumber = allSupplements.find(s => s.id === Number(id));
    
    console.log('🔍 Search results:');
    console.log('  Using == :', supplementById);
    console.log('  Using === :', supplementByIdStrict);
    console.log('  Using === String():', supplementByIdString);
    console.log('  Using === Number():', supplementByIdNumber);
    
    const supplement = supplementById || supplementByIdStrict || supplementByIdString || supplementByIdNumber;
    
    if (supplement) {
        console.log('✅ Found supplement:', supplement);
        showSupplementModalWithDebug(supplement);
    } else {
        console.log('❌ Supplement not found');
        console.log('🔍 Available supplement IDs:', allSupplements.map(s => `${s.id} (${typeof s.id})`));
        showAlert('Supplement not found', 'error');
    }
}

function showSupplementModalWithDebug(supplement) {
    const isEdit = supplement !== null;
    console.log('📝 showSupplementModalWithDebug - edit mode:', isEdit);
    console.log('📝 Supplement data:', supplement);
    
    // Remove existing modal
    const existingModal = document.getElementById('supplement-modal');
    if (existingModal) {
        console.log('🗑️ Removing existing modal');
        existingModal.remove();
    }
    
    // Create modal with debug info
    const modal = document.createElement('div');
    modal.id = 'supplement-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;';
    
    const supplementId = isEdit ? supplement.id : '';
    const supplementName = isEdit ? (supplement.name || '') : '';
    const supplementCategory = isEdit ? (supplement.category || '') : '';
    
    console.log('📝 Modal data to populate:');
    console.log('  ID:', supplementId);
    console.log('  Name:', supplementName);
    console.log('  Category:', supplementCategory);
    
    modal.innerHTML = 
        '<div style="background: white; padding: 20px; border-radius: 12px; width: 500px; max-width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">' +
            '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: -20px -20px 20px -20px; padding: 20px; border-radius: 12px 12px 0 0;">' +
                '<h3 style="margin: 0;">🔍 DEBUG: ' + (isEdit ? 'Edit Supplement (ID: ' + supplementId + ')' : 'Add New Supplement') + '</h3>' +
            '</div>' +
            
            '<div id="supplement-form-container">' +
                '<input type="hidden" id="supplement-id" value="' + supplementId + '">' +
                '<input type="hidden" id="is-edit" value="' + (isEdit ? 'true' : 'false') + '">' +
                
                '<div style="margin-bottom: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px; font-size: 12px;">' +
                    '<strong>Debug Info:</strong><br>' +
                    'Edit Mode: ' + isEdit + '<br>' +
                    'Supplement ID: ' + supplementId + '<br>' +
                    'Supplement Name: "' + supplementName + '"<br>' +
                    'Supplement Category: "' + supplementCategory + '"' +
                '</div>' +
                
                '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">' +
                    '<div>' +
                        '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Name * (Debug: "' + supplementName + '")</label>' +
                        '<input type="text" id="supplement-name" required value="' + supplementName + '" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box;">' +
                    '</div>' +
                    '<div>' +
                        '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Category * (Debug: "' + supplementCategory + '")</label>' +
                        '<select id="supplement-category" required style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box;">' +
                            '<option value="">Select...</option>' +
                            '<option value="Vitamins"' + (supplementCategory === 'Vitamins' ? ' selected' : '') + '>Vitamins</option>' +
                            '<option value="Minerals"' + (supplementCategory === 'Minerals' ? ' selected' : '') + '>Minerals</option>' +
                            '<option value="Antioxidants"' + (supplementCategory === 'Antioxidants' ? ' selected' : '') + '>Antioxidants</option>' +
                            '<option value="Other"' + (supplementCategory === 'Other' ? ' selected' : '') + '>Other</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                
                '<div style="margin-bottom: 15px;">' +
                    '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Description</label>' +
                    '<textarea id="supplement-description" rows="2" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box; resize: vertical;">' + (isEdit ? (supplement.description || '') : '') + '</textarea>' +
                '</div>' +
                
                '<div style="text-align: right; border-top: 1px solid #e5e7eb; padding-top: 15px;">' +
                    '<button type="button" onclick="closeSupplementModal()" style="margin-right: 10px; padding: 10px 20px; border: 2px solid #d1d5db; background: #f9fafb; border-radius: 6px; cursor: pointer;">Cancel</button>' +
                    '<button type="button" id="save-supplement-btn" style="padding: 10px 20px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">💾 DEBUG SAVE</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    document.body.appendChild(modal);
    console.log('✅ Debug modal created and added to DOM');
    
    // Add click handler
    document.getElementById('save-supplement-btn').addEventListener('click', function(e) {
        console.log('🔘 DEBUG Save button clicked');
        e.preventDefault();
        saveSupplementDataWithDebug();
    });
    
    // Focus and verify field population
    setTimeout(() => {
        const nameField = document.getElementById('supplement-name');
        const categoryField = document.getElementById('supplement-category');
        
        console.log('🔍 After modal creation:');
        console.log('  Name field value:', nameField?.value);
        console.log('  Category field value:', categoryField?.value);
        
        if (nameField) {
            nameField.focus();
            if (isEdit) nameField.select();
        }
    }, 100);
}

// Override the functions
window.editSupplement = editSupplementWithDebug;

console.log('✅ Debug edit functions added');
