// ============================================================================
// SUPPLEMENT MANAGEMENT FUNCTIONS - FIXED VERSION
// ============================================================================

// Enhanced supplement form creation with all fields
function createEnhancedSupplementModal() {
    console.log('🏗️ Creating enhanced supplement modal...');
    
    const modalHTML = `
        <div id="supplement-modal" class="modal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                <div class="modal-header" style="padding: 20px 24px 16px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: between; align-items: center;">
                    <h3 id="supplement-form-title" style="margin: 0; color: #2c3e50; font-size: 1.4rem;">Add New Supplement</h3>
                    <button class="btn-close" onclick="hideSupplementForm()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6c757d; padding: 0; margin-left: auto;">&times;</button>
                </div>
                
                <div class="modal-body" style="padding: 24px;">
                    <div id="supplement-alert" style="margin-bottom: 16px;"></div>
                    
                    <form id="supplement-form" onsubmit="saveSupplementForm(event)">
                        <input type="hidden" id="supplement-id" name="id">
                        
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <!-- First Row -->
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label for="supplement-name" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Supplement Name *</label>
                                <input type="text" id="supplement-name" name="name" required 
                                       placeholder="Enter supplement name"
                                       style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <small style="color: #6b7280; font-size: 12px;">Common or scientific name</small>
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
                            
                            <!-- Second Row -->
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
                            
                            <!-- Third Row - Dosage Range -->
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label for="supplement-min-dose" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Minimum Dose</label>
                                <input type="number" id="supplement-min-dose" name="min_dose" step="0.1" min="0"
                                       placeholder="Optional minimum"
                                       style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <small style="color: #6b7280; font-size: 12px;">Lowest recommended dose</small>
                            </div>
                            
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label for="supplement-max-dose" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Maximum Dose</label>
                                <input type="number" id="supplement-max-dose" name="max_dose" step="0.1" min="0"
                                       placeholder="Optional maximum"
                                       style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <small style="color: #6b7280; font-size: 12px;">Highest safe dose</small>
                            </div>
                        </div>
                        
                        <!-- Full Width Fields -->
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label for="supplement-description" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Description</label>
                            <textarea id="supplement-description" name="description" rows="3"
                                      placeholder="Brief description of the supplement and its benefits"
                                      style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;"></textarea>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label for="supplement-notes" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Notes</label>
                            <textarea id="supplement-notes" name="notes" rows="2"
                                      placeholder="Additional notes, warnings, or special instructions"
                                      style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;"></textarea>
                        </div>
                        
                        <!-- Checkboxes -->
                        <div class="form-row" style="display: flex; gap: 24px; margin-bottom: 24px;">
                            <div class="form-check" style="display: flex; align-items: center;">
                                <input type="checkbox" id="supplement-active" name="is_active" checked
                                       style="margin-right: 8px;">
                                <label for="supplement-active" style="margin: 0; font-weight: 500; color: #374151;">Active</label>
                            </div>
                            
                            <div class="form-check" style="display: flex; align-items: center;">
                                <input type="checkbox" id="supplement-featured" name="is_featured"
                                       style="margin-right: 8px;">
                                <label for="supplement-featured" style="margin: 0; font-weight: 500; color: #374151;">Featured</label>
                            </div>
                        </div>
                        
                        <!-- Form Actions -->
                        <div class="form-actions" style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e9ecef;">
                            <button type="button" onclick="hideSupplementForm()" 
                                    style="padding: 8px 16px; border: 1px solid #d1d5db; background: #f8f9fa; color: #6c757d; border-radius: 6px; cursor: pointer;">
                                Cancel
                            </button>
                            <button type="submit" 
                                    style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 6px; cursor: pointer;">
                                <span id="supplement-save-spinner"></span>
                                <span id="supplement-save-text">Save Supplement</span>
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

// ============================================================================
// COMPLETE SUPPLEMENT MANAGEMENT FUNCTIONS
// Replace your existing supplement functions with these
// ============================================================================

// Global variables for supplements
let allSupplements = [];
let filteredSupplements = [];
let selectedSupplements = new Set();

// Load supplements from API
async function loadSupplements() {
    console.log('💊 Loading supplements from API...');
    showSupplementAlert('🔄 Loading supplements from database...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/api/supplements`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            allSupplements = data.supplements || [];
            filteredSupplements = [...allSupplements];
            
            updateSupplementStats(allSupplements);
            renderSupplementsTable();
            
            showSupplementAlert(`✅ Loaded ${allSupplements.length} supplements successfully!`, 'success');
            console.log('✅ Supplements loaded:', allSupplements.length);
        } else {
            throw new Error(data.error || 'Failed to load supplements');
        }
    } catch (error) {
        console.error('❌ Error loading supplements:', error);
        showSupplementsError(error.message);
    }
}

// Calculate supplement statistics
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

// Update supplement statistics display
function updateSupplementStats(supplements) {
    const stats = calculateSupplementStats(supplements);
    
    // Update stat cards if they exist
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
                <span class="status-badge">${formatCategory(supplement.category || 'other')}</span>
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
                <button class="btn btn-sm btn-danger" onclick="deleteSupplement(${supplement.id})" title="Delete">
                    🗑️ Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('📊 Rendered supplements table with', filteredSupplements.length, 'items');
}

// Show supplements error
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
    showSupplementAlert('❌ Failed to load supplements.', 'error');
}

// Show supplement alert
function showSupplementAlert(message, type) {
    console.log(`📢 Supplement Alert: ${message}`);
    
    // Try to find existing alert container
    let alertContainer = document.getElementById('supplement-alert');
    
    // If no dedicated supplement alert, use generic showAlert
    if (!alertContainer) {
        showAlert(message, type);
        return;
    }
    
    // Set alert content and styling
    alertContainer.className = `alert alert-${type}`;
    alertContainer.textContent = message;
    alertContainer.style.display = 'block';
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            alertContainer.style.display = 'none';
        }, 3000);
    }
}

// Format category for display
function formatCategory(category) {
    const categoryNames = {
        'vitamins': 'Vitamins',
        'minerals': 'Minerals',
        'antioxidants': 'Antioxidants',
        'herbs': 'Herbs',
        'amino_acids': 'Amino Acids',
        'enzymes': 'Enzymes',
        'probiotics': 'Probiotics',
        'fatty_acids': 'Fatty Acids',
        'other': 'Other'
    };
    return categoryNames[category] || category || 'Other';
}

// Edit supplement
async function editSupplement(id) {
    console.log(`📝 Editing supplement ID: ${id}`);
    
    try {
        // First, get the supplement data from the API
        const response = await fetch(`${API_BASE}/api/supplements/${id}`);
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to fetch supplement data');
        }
        
        const supplement = result.data;
        console.log('📝 Supplement data for editing:', supplement);
        
        // Show the form
        showSupplementFormForEdit();
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            populateSupplementForm(supplement);
        }, 100);
        
    } catch (error) {
        console.error('❌ Error fetching supplement for edit:', error);
        showSupplementAlert(`❌ Failed to load supplement: ${error.message}`, 'error');
    }
}

// Save supplement form
async function saveSupplementForm(event) {
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
        min_dose: formData.get('min_dose') || null,
        max_dose: formData.get('max_dose') || null,
        notes: formData.get('notes').trim(),
        is_active: formData.has('is_active'),
        is_featured: formData.has('is_featured')
    };
    
    // Validation
    if (!supplementData.name || !supplementData.category) {
        showSupplementAlert('❌ Please fill in all required fields (Name and Category)', 'error');
        return;
    }
    
    try {
        showSupplementAlert('🔄 Saving supplement...', 'info');
        
        const url = isEdit ? `${API_BASE}/api/supplements/${id}` : `${API_BASE}/api/supplements`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplementData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSupplementAlert(`✅ Supplement ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
            hideSupplementForm();
            loadSupplements();
        } else {
            throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} supplement`);
        }
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showSupplementAlert(`❌ Failed to save supplement: ${error.message}`, 'error');
    }
}

// Activate supplement
async function activateSupplement(id) {
    await toggleSupplementStatus(id, true);
}

// Deactivate supplement
async function deactivateSupplement(id) {
    await toggleSupplementStatus(id, false);
}

// Toggle supplement status
async function toggleSupplementStatus(id, isActive) {
    const supplement = allSupplements.find(s => s.id === id);
    if (!supplement) {
        showSupplementAlert('❌ Supplement not found', 'error');
        return;
    }
    
    const action = isActive ? 'activate' : 'deactivate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${supplement.name}"?`)) return;
    
    try {
        showSupplementAlert(`🔄 ${action.charAt(0).toUpperCase() + action.slice(1)}ing supplement...`, 'info');
        
        const response = await fetch(`${API_BASE}/api/supplements/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...supplement, is_active: isActive })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSupplementAlert(`✅ Supplement ${action}d successfully!`, 'success');
            loadSupplements();
        } else {
            throw new Error(data.error || `Failed to ${action} supplement`);
        }
    } catch (error) {
        console.error(`❌ Error ${action}ing supplement:`, error);
        showSupplementAlert(`❌ Failed to ${action} supplement: ${error.message}`, 'error');
    }
}

// Delete supplement
async function deleteSupplement(id) {
    const supplement = allSupplements.find(s => s.id === id);
    if (!supplement) {
        showSupplementAlert('❌ Supplement not found', 'error');
        return;
    }
    
    if (!confirm(`Delete "${supplement.name}"?\n\nThis action cannot be undone.`)) return;
    
    try {
        showSupplementAlert('🔄 Deleting supplement...', 'info');
        
        const response = await fetch(`${API_BASE}/api/supplements/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSupplementAlert(`✅ Supplement "${supplement.name}" deleted successfully!`, 'success');
            loadSupplements();
        } else {
            throw new Error(data.error || 'Failed to delete supplement');
        }
    } catch (error) {
        console.error('❌ Error deleting supplement:', error);
        showSupplementAlert(`❌ Failed to delete supplement: ${error.message}`, 'error');
    }
}

// Show supplement form for editing
function showSupplementFormForEdit() {
    console.log('📝 Showing supplement form for edit...');
    
    // Try to find existing form containers
    let formContainer = document.getElementById('supplement-form-container') ||
                       document.getElementById('supplement-modal') ||
                       document.getElementById('add-supplement-modal');
    
    if (!formContainer) {
        console.log('❌ Container not found: supplement-form-container');
        console.log('❌ Container not found: supplement-modal');
        console.log('❌ Container not found: add-supplement-modal');
        console.log('⚠️ No existing form container found, creating enhanced modal...');
        formContainer = createEnhancedSupplementModal();
    }
    
    // Make sure the form is visible
    console.log('📺 Making form container visible...');
    if (formContainer) {
        formContainer.style.display = 'flex';
        
        // Update the title for editing
        const titleElement = document.getElementById('supplement-form-title');
        if (titleElement) {
            titleElement.textContent = 'Edit Supplement';
        }
        
        console.log('✅ Form container should now be visible');
    }
}

// ============================================================================
// SUPPLEMENT MANAGEMENT FUNCTIONS - FIXED VERSION
// ============================================================================

// Enhanced supplement form creation with all fields
function createEnhancedSupplementModal() {
    console.log('🏗️ Creating enhanced supplement modal...');
    
    const modalHTML = `
        <div id="supplement-modal" class="modal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                <div class="modal-header" style="padding: 20px 24px 16px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: between; align-items: center;">
                    <h3 id="supplement-form-title" style="margin: 0; color: #2c3e50; font-size: 1.4rem;">Add New Supplement</h3>
                    <button class="btn-close" onclick="hideSupplementForm()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6c757d; padding: 0; margin-left: auto;">&times;</button>
                </div>
                
                <div class="modal-body" style="padding: 24px;">
                    <div id="supplement-alert" style="margin-bottom: 16px;"></div>
                    
                    <form id="supplement-form" onsubmit="saveSupplementForm(event)">
                        <input type="hidden" id="supplement-id" name="id">
                        
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <!-- First Row -->
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label for="supplement-name" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Supplement Name *</label>
                                <input type="text" id="supplement-name" name="name" required 
                                       placeholder="Enter supplement name"
                                       style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <small style="color: #6b7280; font-size: 12px;">Common or scientific name</small>
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
                            
                            <!-- Second Row -->
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
                            
                            <!-- Third Row - Dosage Range -->
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label for="supplement-min-dose" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Minimum Dose</label>
                                <input type="number" id="supplement-min-dose" name="min_dose" step="0.1" min="0"
                                       placeholder="Optional minimum"
                                       style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <small style="color: #6b7280; font-size: 12px;">Lowest recommended dose</small>
                            </div>
                            
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label for="supplement-max-dose" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Maximum Dose</label>
                                <input type="number" id="supplement-max-dose" name="max_dose" step="0.1" min="0"
                                       placeholder="Optional maximum"
                                       style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <small style="color: #6b7280; font-size: 12px;">Highest safe dose</small>
                            </div>
                        </div>
                        
                        <!-- Full Width Fields -->
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label for="supplement-description" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Description</label>
                            <textarea id="supplement-description" name="description" rows="3"
                                      placeholder="Brief description of the supplement and its benefits"
                                      style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;"></textarea>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label for="supplement-notes" style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Notes</label>
                            <textarea id="supplement-notes" name="notes" rows="2"
                                      placeholder="Additional notes, warnings, or special instructions"
                                      style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;"></textarea>
                        </div>
                        
                        <!-- Checkboxes -->
                        <div class="form-row" style="display: flex; gap: 24px; margin-bottom: 24px;">
                            <div class="form-check" style="display: flex; align-items: center;">
                                <input type="checkbox" id="supplement-active" name="is_active" checked
                                       style="margin-right: 8px;">
                                <label for="supplement-active" style="margin: 0; font-weight: 500; color: #374151;">Active</label>
                            </div>
                            
                            <div class="form-check" style="display: flex; align-items: center;">
                                <input type="checkbox" id="supplement-featured" name="is_featured"
                                       style="margin-right: 8px;">
                                <label for="supplement-featured" style="margin: 0; font-weight: 500; color: #374151;">Featured</label>
                            </div>
                        </div>
                        
                        <!-- Form Actions -->
                        <div class="form-actions" style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e9ecef;">
                            <button type="button" onclick="hideSupplementForm()" 
                                    style="padding: 8px 16px; border: 1px solid #d1d5db; background: #f8f9fa; color: #6c757d; border-radius: 6px; cursor: pointer;">
                                Cancel
                            </button>
                            <button type="submit" 
                                    style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 6px; cursor: pointer;">
                                <span id="supplement-save-spinner"></span>
                                <span id="supplement-save-text">Save Supplement</span>
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

// ============================================================================
// COMPLETE SUPPLEMENT MANAGEMENT FUNCTIONS
// Replace your existing supplement functions with these
// ============================================================================

// Global variables for supplements
let allSupplements = [];
let filteredSupplements = [];
let selectedSupplements = new Set();

// Load supplements from API
async function loadSupplements() {
    console.log('💊 Loading supplements from API...');
    showSupplementAlert('🔄 Loading supplements from database...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/api/supplements`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            allSupplements = data.supplements || [];
            filteredSupplements = [...allSupplements];
            
            updateSupplementStats(allSupplements);
            renderSupplementsTable();
            
            showSupplementAlert(`✅ Loaded ${allSupplements.length} supplements successfully!`, 'success');
            console.log('✅ Supplements loaded:', allSupplements.length);
        } else {
            throw new Error(data.error || 'Failed to load supplements');
        }
    } catch (error) {
        console.error('❌ Error loading supplements:', error);
        showSupplementsError(error.message);
    }
}

// Calculate supplement statistics
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

// Update supplement statistics display
function updateSupplementStats(supplements) {
    const stats = calculateSupplementStats(supplements);
    
    // Update stat cards if they exist
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
                <span class="status-badge">${formatCategory(supplement.category || 'other')}</span>
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
                <button class="btn btn-sm btn-danger" onclick="deleteSupplement(${supplement.id})" title="Delete">
                    🗑️ Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('📊 Rendered supplements table with', filteredSupplements.length, 'items');
}

// Show supplements error
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
    showSupplementAlert('❌ Failed to load supplements.', 'error');
}

// Show supplement alert
function showSupplementAlert(message, type) {
    console.log(`📢 Supplement Alert: ${message}`);
    
    // Try to find existing alert container
    let alertContainer = document.getElementById('supplement-alert');
    
    // If no dedicated supplement alert, use generic showAlert
    if (!alertContainer) {
        showAlert(message, type);
        return;
    }
    
    // Set alert content and styling
    alertContainer.className = `alert alert-${type}`;
    alertContainer.textContent = message;
    alertContainer.style.display = 'block';
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            alertContainer.style.display = 'none';
        }, 3000);
    }
}

// Format category for display
function formatCategory(category) {
    const categoryNames = {
        'vitamins': 'Vitamins',
        'minerals': 'Minerals',
        'antioxidants': 'Antioxidants',
        'herbs': 'Herbs',
        'amino_acids': 'Amino Acids',
        'enzymes': 'Enzymes',
        'probiotics': 'Probiotics',
        'fatty_acids': 'Fatty Acids',
        'other': 'Other'
    };
    return categoryNames[category] || category || 'Other';
}

// Edit supplement
async function editSupplement(id) {
    console.log(`📝 Editing supplement ID: ${id}`);
    
    try {
        // First, get the supplement data from the API
        const response = await fetch(`${API_BASE}/api/supplements/${id}`);
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to fetch supplement data');
        }
        
        const supplement = result.data;
        console.log('📝 Supplement data for editing:', supplement);
        
        // Show the form
        showSupplementFormForEdit();
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            populateSupplementForm(supplement);
        }, 100);
        
    } catch (error) {
        console.error('❌ Error fetching supplement for edit:', error);
        showSupplementAlert(`❌ Failed to load supplement: ${error.message}`, 'error');
    }
}

// Save supplement form
async function saveSupplementForm(event) {
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
        min_dose: formData.get('min_dose') || null,
        max_dose: formData.get('max_dose') || null,
        notes: formData.get('notes').trim(),
        is_active: formData.has('is_active'),
        is_featured: formData.has('is_featured')
    };
    
    // Validation
    if (!supplementData.name || !supplementData.category) {
        showSupplementAlert('❌ Please fill in all required fields (Name and Category)', 'error');
        return;
    }
    
    try {
        showSupplementAlert('🔄 Saving supplement...', 'info');
        
        const url = isEdit ? `${API_BASE}/api/supplements/${id}` : `${API_BASE}/api/supplements`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplementData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSupplementAlert(`✅ Supplement ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
            hideSupplementForm();
            loadSupplements();
        } else {
            throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} supplement`);
        }
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showSupplementAlert(`❌ Failed to save supplement: ${error.message}`, 'error');
    }
}

// Activate supplement
async function activateSupplement(id) {
    await toggleSupplementStatus(id, true);
}

// Deactivate supplement
async function deactivateSupplement(id) {
    await toggleSupplementStatus(id, false);
}

// Toggle supplement status
async function toggleSupplementStatus(id, isActive) {
    const supplement = allSupplements.find(s => s.id === id);
    if (!supplement) {
        showSupplementAlert('❌ Supplement not found', 'error');
        return;
    }
    
    const action = isActive ? 'activate' : 'deactivate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${supplement.name}"?`)) return;
    
    try {
        showSupplementAlert(`🔄 ${action.charAt(0).toUpperCase() + action.slice(1)}ing supplement...`, 'info');
        
        const response = await fetch(`${API_BASE}/api/supplements/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...supplement, is_active: isActive })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSupplementAlert(`✅ Supplement ${action}d successfully!`, 'success');
            loadSupplements();
        } else {
            throw new Error(data.error || `Failed to ${action} supplement`);
        }
    } catch (error) {
        console.error(`❌ Error ${action}ing supplement:`, error);
        showSupplementAlert(`❌ Failed to ${action} supplement: ${error.message}`, 'error');
    }
}

// Delete supplement
async function deleteSupplement(id) {
    const supplement = allSupplements.find(s => s.id === id);
    if (!supplement) {
        showSupplementAlert('❌ Supplement not found', 'error');
        return;
    }
    
    if (!confirm(`Delete "${supplement.name}"?\n\nThis action cannot be undone.`)) return;
    
    try {
        showSupplementAlert('🔄 Deleting supplement...', 'info');
        
        const response = await fetch(`${API_BASE}/api/supplements/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSupplementAlert(`✅ Supplement "${supplement.name}" deleted successfully!`, 'success');
            loadSupplements();
        } else {
            throw new Error(data.error || 'Failed to delete supplement');
        }
    } catch (error) {
        console.error('❌ Error deleting supplement:', error);
        showSupplementAlert(`❌ Failed to delete supplement: ${error.message}`, 'error');
    }
}

// Show supplement form for editing
function showSupplementFormForEdit() {
    console.log('📝 Showing supplement form for edit...');
    
    // Try to find existing form containers
    let formContainer = document.getElementById('supplement-form-container') ||
                       document.getElementById('supplement-modal') ||
                       document.getElementById('add-supplement-modal');
    
    if (!formContainer) {
        console.log('❌ Container not found: supplement-form-container');
        console.log('❌ Container not found: supplement-modal');
        console.log('❌ Container not found: add-supplement-modal');
        console.log('⚠️ No existing form container found, creating enhanced modal...');
        formContainer = createEnhancedSupplementModal();
    }
    
    // Make sure the form is visible
    console.log('📺 Making form container visible...');
    if (formContainer) {
        formContainer.style.display = 'flex';
        
        // Update the title for editing
        const titleElement = document.getElementById('supplement-form-title');
        if (titleElement) {
            titleElement.textContent = 'Edit Supplement';
        }
        
        console.log('✅ Form container should now be visible');
    }
}

// Fixed form population function
function populateSupplementForm(supplement) {
    console.log('📝 Populating form with:', supplement);
    
    const fields = [
        { id: 'supplement-id', value: supplement.id },
        { id: 'supplement-name', value: supplement.name || '' },
        { id: 'supplement-category', value: supplement.category || '' },
        { id: 'supplement-description', value: supplement.description || '' },
        { id: 'supplement-dose', value: supplement.default_dose || '' },
        { id: 'supplement-unit', value: supplement.unit || 'mg' },
        { id: 'supplement-min-dose', value: supplement.min_dose || '' },
        { id: 'supplement-max-dose', value: supplement.max_dose || '' },
        { id: 'supplement-notes', value: supplement.notes || '' }
    ];
    
    // Populate text fields
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            element.value = field.value;
            console.log(`✅ Set ${field.id} = ${field.value}`);
        } else {
            console.log(`⚠️ Field not found: ${field.id}`);
        }
    });
    
    // Handle checkboxes
    const activeCheckbox = document.getElementById('supplement-active');
    if (activeCheckbox) {
        activeCheckbox.checked = supplement.is_active === true || supplement.is_active === 1;
        console.log(`✅ Set supplement-active = ${activeCheckbox.checked}`);
    }
    
    const featuredCheckbox = document.getElementById('supplement-featured');
    if (featuredCheckbox) {
        featuredCheckbox.checked = supplement.is_featured === true || supplement.is_featured === 1;
        console.log(`✅ Set supplement-featured = ${featuredCheckbox.checked}`);
    }
    
    // Focus on the name field for better UX
    setTimeout(() => {
        const nameField = document.getElementById('supplement-name');
        if (nameField) {
            nameField.focus();
            nameField.select();
        }
    }, 200);
    
    console.log('✅ Form populated successfully');
}

// Hide supplement form
function hideSupplementForm() {
    const modal = document.getElementById('supplement-modal');
    if (modal) {
        modal.style.display = 'none';
        // Optional: Remove the modal from DOM to clean up
        setTimeout(() => modal.remove(), 300);
    }
    
    // Also check for other possible containers
    const containers = [
        'supplement-form-container',
        'add-supplement-modal'
    ];
    
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.style.display = 'none';
        }
    });
}

// Show add supplement form
function showAddSupplementForm() {
    console.log('📝 Showing add supplement form...');
    
    // Create or show the form
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
    clearSupplementForm();
    
    // Focus on name field
    setTimeout(() => {
        const nameField = document.getElementById('supplement-name');
        if (nameField) {
            nameField.focus();
        }
    }, 100);
}

// Clear supplement form
function clearSupplementForm() {
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

// Hide supplement form
function hideSupplementForm() {
    const modal = document.getElementById('supplement-modal');
    if (modal) {
        modal.style.display = 'none';
        // Optional: Remove the modal from DOM to clean up
        setTimeout(() => modal.remove(), 300);
    }
    
    // Also check for other possible containers
    const containers = [
        'supplement-form-container',
        'add-supplement-modal'
    ];
    
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.style.display = 'none';
        }
    });
}

// Show add supplement form
function showAddSupplementForm() {
    console.log('📝 Showing add supplement form...');
    
    // Create or show the form
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
    clearSupplementForm();
    
    // Focus on name field
    setTimeout(() => {
        const nameField = document.getElementById('supplement-name');
        if (nameField) {
            nameField.focus();
        }
    }, 100);
}

// Clear supplement form
function clearSupplementForm() {
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

// Fixed saveSupplementForm to work with proper form handling
async function saveSupplementForm(event) {
    // Handle event
    if (event && event.preventDefault) {
        event.preventDefault();
    }
    
    console.log('💊 Starting supplement save process...');
    
    // Find form container
    const formContainer = document.getElementById('supplement-form');
    
    if (!formContainer) {
        console.error('❌ No element found with ID "supplement-form"');
        showAlert('❌ Form not found - check if supplements section is loaded', 'error');
        return;
    }
    
    console.log('✅ Form container found:', formContainer.tagName);
    
    // Get form data from individual inputs
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
        showAlert('❌ Please fill in all required fields (Name and Category)', 'error');
        return;
    }
    
    // Check if this is an edit or new supplement
    const isEdit = supplementData.id && supplementData.id !== '';
    
    try {
        showAlert('🔄 Saving supplement...', 'info');
        
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
            showAlert(successMessage, 'success');
            
            // Hide form
            hideSupplementForm();
            
            // Reload supplements list if function exists
            if (typeof loadSupplements === 'function') {
                loadSupplements();
            }
        } else {
            const errorMessage = data.error || data.message || `Failed to ${isEdit ? 'update' : 'create'} supplement`;
            throw new Error(errorMessage);
        }
        
    } catch (error) {
        console.error('❌ Error saving supplement:', error);
        showAlert(`❌ Failed to save supplement: ${error.message}`, 'error');
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

// Alert function
function showAlert(message, type) {
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

// Configuration
const API_BASE = 'https://mynadtest.info';

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
            // Use default stats if API fails
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
            console.log(`✅ Updated ${id}: ${value}`);
        }
    });
}

console.log('✅ Supplement management functions loaded');