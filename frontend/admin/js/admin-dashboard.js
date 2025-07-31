// NAD Admin Dashboard - FINAL FIX
const API_BASE = 'https://mynadtest.info';
let allSupplements = [];
let filteredSupplements = [];

// Admin dashboard state
let adminUser = null;
let originalBodyContent = null;

// Initialize admin dashboard with authentication
async function initAdminDashboard() {
    try {
        console.log('Starting admin dashboard initialization...');
        
        // Show loading screen
        showAdminLoading();
        
        // Check authentication
        const authResult = await checkAdminAuthentication();
        console.log('Admin auth result:', authResult);
        if (!authResult.success) {
            console.log('Admin authentication failed, showing auth error');
            showAdminAuthError();
            return;
        }
        
        console.log('Admin authentication succeeded, loading dashboard...');
        adminUser = authResult.user;
        
        // Load the original dashboard
        await loadSupplements();
        setupAdminNavigation();
        
        // Hide loading screen
        hideAdminLoading();
        
    } catch (error) {
        console.error('Admin dashboard initialization failed:', error);
        showAdminAuthError('Admin dashboard initialization failed');
    }
}

/**
 * Check authentication for admin access
 */
async function checkAdminAuthentication() {
    try {
        // Check existing session first
        const authType = sessionStorage.getItem('nad_auth_type');
        const storedUser = sessionStorage.getItem('nad_user_data');
        
        if (authType === 'admin' && storedUser) {
            console.log('Existing admin session found');
            return { 
                success: true, 
                user: JSON.parse(storedUser),
                type: 'admin'
            };
        }
        
        // Only check for new tokens if no existing session
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('t');
        
        if (token) {
            console.log('Admin portal token found, validating...');
            const response = await fetch(`${API_BASE}/shopify/portal/validate-lab-admin?t=${token}&type=admin`, {
                method: 'GET'
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Store authentication
                sessionStorage.setItem('nad_auth_token', token);
                sessionStorage.setItem('nad_auth_type', 'admin');
                sessionStorage.setItem('nad_user_data', JSON.stringify(result.data));
                
                // Remove token from URL to prevent reuse on refresh
                const newUrl = new URL(window.location);
                newUrl.searchParams.delete('t');
                window.history.replaceState({}, document.title, newUrl.toString());
                
                return { success: true, user: result.data, type: 'admin' };
            } else {
                console.error('Admin token validation failed:', result.error);
                return { success: false, error: result.error };
            }
        }
        
        return { success: false, error: 'No admin authentication found' };
        
    } catch (error) {
        console.error('Admin authentication check failed:', error);
        return { success: false, error: 'Authentication check failed' };
    }
}

/**
 * Show loading screen
 */
function showAdminLoading() {
    // Store original content before replacing it
    if (!originalBodyContent) {
        originalBodyContent = document.body.innerHTML;
    }
    
    document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8f9fa;">
            <div style="text-align: center;">
                <div style="border: 4px solid #f3f3f3; border-top: 4px solid #dc3545; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <h3>Loading Admin Dashboard...</h3>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </div>
        </div>
    `;
}

/**
 * Hide loading screen
 */
function hideAdminLoading() {
    // Restore original content if we stored it
    if (originalBodyContent) {
        document.body.innerHTML = originalBodyContent;
        // Clear the stored content
        originalBodyContent = null;
    }
    console.log('Admin dashboard loaded successfully');
}

/**
 * Show authentication error
 */
function showAdminAuthError(message = 'Authentication Required') {
    document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8f9fa;">
            <div style="text-align: center; max-width: 500px; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h2>Admin Access Required</h2>
                <p style="color: #666; margin-bottom: 30px;">
                    ${message === 'Authentication Required' ? 
                        'Please access the admin dashboard through your account at mynadtest.com.' : 
                        message
                    }
                </p>
                <a href="https://mynadtest.com" 
                   style="display: inline-block; background: #dc3545; color: white; text-decoration: none; padding: 12px 24px; border-radius: 5px;">
                    Go to NAD Test
                </a>
            </div>
        </div>
    `;
}

/**
 * Setup admin navigation after authentication
 */
function setupAdminNavigation() {
    // Setup navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.getAttribute('data-section');
            if (sectionName) {
                showSection(sectionName);
            }
        });
    });
    
    // Show default section
    showSection('dashboard');
    
    console.log('Admin navigation setup complete');
}

// FINAL FIX Admin Dashboard Loaded

async function loadSupplements() {
    // Loading supplements
    try {
        const response = await fetch(API_BASE + '/api/supplements');
        const data = await response.json();
        
        if (response.ok && data.success) {
            allSupplements = data.supplements || [];
            filteredSupplements = [...allSupplements];
            renderSupplementsTable();
        }
    } catch (error) {
        // Error loading supplements
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
                '<button class="btn btn-sm btn-primary" onclick="editSupplementFinal(' + supplement.id + ')">✏️ Edit</button> ' +
                '<button class="btn btn-sm btn-success" onclick="showAlert(\'Feature coming soon\', \'info\')">⚡ Activate</button>' +
            '</td>';
        tbody.appendChild(row);
    });
}

function showAddSupplementForm() {
    editSupplementFinal(null);
}

function editSupplementFinal(id) {
    // Edit supplement
    
    let supplement = null;
    let isEdit = false;
    
    if (id !== null) {
        supplement = allSupplements.find(s => s.id == id);
        isEdit = true;
        // Found supplement for edit
    } else {
        // Creating new supplement
    }
    
    // Remove any existing modal
    const existingModal = document.getElementById('final-supplement-modal');
    if (existingModal) existingModal.remove();
    
    // Create modal with UNIQUE IDs
    const modal = document.createElement('div');
    modal.id = 'final-supplement-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;';
    
    // Use unique ID prefix
    const idPrefix = 'final-';
    
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 12px; width: 500px; max-width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: -20px -20px 20px -20px; padding: 20px; border-radius: 12px 12px 0 0;">
                <h3 style="margin: 0;">${isEdit ? '✏️ Edit Supplement' : '➕ Add New Supplement'}</h3>
            </div>
            
            <div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Name *</label>
                        <input type="text" id="${idPrefix}supplement-name" required value="${isEdit ? supplement.name : ''}" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Category *</label>
                        <select id="${idPrefix}supplement-category" required style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box;">
                            <option value="">Select...</option>
                            <option value="Vitamins" ${isEdit && supplement.category === 'Vitamins' ? 'selected' : ''}>Vitamins</option>
                            <option value="Minerals" ${isEdit && supplement.category === 'Minerals' ? 'selected' : ''}>Minerals</option>
                            <option value="Antioxidants" ${isEdit && supplement.category === 'Antioxidants' ? 'selected' : ''}>Antioxidants</option>
                            <option value="Other" ${isEdit && supplement.category === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Dose</label>
                        <input type="number" id="${idPrefix}supplement-dose" step="0.1" min="0" value="${isEdit ? (supplement.default_dose || '') : ''}" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Unit</label>
                        <select id="${idPrefix}supplement-unit" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box;">
                            <option value="mg" ${isEdit && supplement.unit === 'mg' ? 'selected' : ''}>mg</option>
                            <option value="g" ${isEdit && supplement.unit === 'g' ? 'selected' : ''}>g</option>
                            <option value="IU" ${isEdit && supplement.unit === 'IU' ? 'selected' : ''}>IU</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Description</label>
                    <textarea id="${idPrefix}supplement-description" rows="3" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; box-sizing: border-box; resize: vertical;">${isEdit ? (supplement.description || '') : ''}</textarea>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="${idPrefix}supplement-active" ${isEdit ? (supplement.is_active ? 'checked' : '') : 'checked'} style="margin-right: 10px; transform: scale(1.2);"> Active
                    </label>
                </div>
                
                <div style="text-align: right; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                    <button type="button" onclick="closeFinalModal()" style="margin-right: 10px; padding: 10px 20px; border: 2px solid #d1d5db; background: #f9fafb; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button type="button" onclick="saveFinalSupplement(${isEdit ? supplement.id : 'null'})" style="padding: 10px 20px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">💊 ${isEdit ? 'Update' : 'Create'} Supplement</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    // Modal created with unique IDs
    
    // Focus on name field
    setTimeout(() => {
        const nameField = document.getElementById(idPrefix + 'supplement-name');
        if (nameField) {
            nameField.focus();
            if (isEdit) nameField.select();
        }
    }, 100);
}

async function saveFinalSupplement(editId) {
    // Save function called
    
    const isEdit = editId !== null;
    const idPrefix = 'final-';
    
    // Read from elements with unique IDs
    const data = {
        name: document.getElementById(idPrefix + 'supplement-name').value.trim(),
        category: document.getElementById(idPrefix + 'supplement-category').value,
        description: document.getElementById(idPrefix + 'supplement-description').value.trim(),
        default_dose: document.getElementById(idPrefix + 'supplement-dose').value || null,
        unit: document.getElementById(idPrefix + 'supplement-unit').value,
        is_active: document.getElementById(idPrefix + 'supplement-active').checked
    };
    
    // Form data collected
    
    if (!data.name || !data.category) {
        showAlert('Please fill in required fields (Name and Category)', 'error');
        return;
    }
    
    try {
        const url = isEdit ? 
            API_BASE + '/api/supplements/' + editId : 
            API_BASE + '/api/supplements';
        const method = isEdit ? 'PUT' : 'POST';
        
        // Making request
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showAlert('✅ Supplement ' + (isEdit ? 'updated' : 'created') + ' successfully!', 'success');
            closeFinalModal();
            await loadSupplements();
        } else {
            throw new Error(result.error || 'Failed to save supplement');
        }
        
    } catch (error) {
        // Error saving supplement
        showAlert('❌ Failed to save: ' + error.message, 'error');
    }
}

function closeFinalModal() {
    const modal = document.getElementById('final-supplement-modal');
    if (modal) modal.remove();
}

function showAlert(message, type) {
    // Show alert
    
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
window.editSupplement = editSupplementFinal;
window.showAddSupplementForm = showAddSupplementForm;
window.closeFinalModal = closeFinalModal;
window.saveFinalSupplement = saveFinalSupplement;
window.showAlert = showAlert;

// FINAL FIX dashboard loaded
