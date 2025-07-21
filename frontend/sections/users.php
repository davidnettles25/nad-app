<?php
/**
 * Users Management Section
 * File: /opt/bitnami/apache/htdocs/nad-app/sections/users.php
 */
?>

<div id="users" class="content-section">
    <div class="card">
        <h3>👥 User Management</h3>
        
        <div id="user-alert"></div>
        
        <!-- User Stats -->
        <div class="stats-overview">
            <div class="stat-card primary">
                <div class="stat-icon">👥</div>
                <div class="stat-content">
                    <div class="stat-number primary" id="total-users-count">0</div>
                    <div class="stat-label">Total Users</div>
                </div>
            </div>
            <div class="stat-card success">
                <div class="stat-icon">👤</div>
                <div class="stat-content">
                    <div class="stat-number success" id="customers-count">0</div>
                    <div class="stat-label">Customers</div>
                </div>
            </div>
            <div class="stat-card info">
                <div class="stat-icon">🔬</div>
                <div class="stat-content">
                    <div class="stat-number info" id="lab-techs-count">0</div>
                    <div class="stat-label">Lab Technicians</div>
                </div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon">🛡️</div>
                <div class="stat-content">
                    <div class="stat-number warning" id="admins-count">0</div>
                    <div class="stat-label">Administrators</div>
                </div>
            </div>
        </div>

        <!-- User Controls -->
        <div class="user-controls">
            <div class="controls-left">
                <input type="text" id="user-search" placeholder="Search users by Customer ID, role..." class="search-input">
                <select id="role-filter" class="filter-select">
                    <option value="">All Roles</option>
                    <option value="customer">Customer</option>
                    <option value="lab_technician">Lab Technician</option>
                    <option value="shipping_manager">Shipping Manager</option>
                    <option value="boss_control">Manager</option>
                    <option value="administrator">Administrator</option>
                </select>
            </div>
            <div class="controls-right">
                <button class="btn" onclick="usersManager.loadUsers()">
                    🔄 Refresh Users
                </button>
                <button class="btn btn-success" onclick="usersManager.showAddUserForm()">
                    ➕ Add User
                </button>
                <button class="btn btn-warning" onclick="usersManager.exportUsers()">
                    📊 Export Users
                </button>
            </div>
        </div>

        <!-- Add User Form -->
        <div id="add-user-form" class="user-form" style="display: none;">
            <div class="form-header">
                <h4>➕ Add New User</h4>
                <button class="close-btn" onclick="usersManager.hideAddUserForm()">✕</button>
            </div>
            <div class="form-content">
                <div class="form-row">
                    <div class="form-group">
                        <label for="new-customer-id">Customer ID *</label>
                        <input type="number" id="new-customer-id" placeholder="Enter customer ID" min="1">
                        <small class="form-help">Unique identifier for the customer</small>
                    </div>
                    <div class="form-group">
                        <label for="new-user-role">Role *</label>
                        <select id="new-user-role" onchange="usersManager.updateRoleDescription()">
                            <option value="">Select a role...</option>
                            <option value="customer">Customer</option>
                            <option value="lab_technician">Lab Technician</option>
                            <option value="shipping_manager">Shipping Manager</option>
                            <option value="boss_control">Manager</option>
                            <option value="administrator">Administrator</option>
                        </select>
                        <small class="form-help" id="role-description">Select a role to see description</small>
                    </div>
                </div>
                <div class="form-group">
                    <label>Permissions Preview</label>
                    <div id="permissions-preview" class="permissions-preview">
                        Select a role to preview permissions
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-success" onclick="usersManager.createUser()">
                        ➕ Create User
                    </button>
                    <button class="btn btn-secondary" onclick="usersManager.hideAddUserForm()">
                        Cancel
                    </button>
                </div>
            </div>
        </div>

        <!-- Edit User Modal -->
        <div id="edit-user-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h4>✏️ Edit User</h4>
                    <button class="close-btn" onclick="usersManager.hideEditUserModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Customer ID</label>
                        <input type="text" id="edit-customer-id" readonly class="readonly-input">
                    </div>
                    <div class="form-group">
                        <label for="edit-user-role">Role *</label>
                        <select id="edit-user-role" onchange="usersManager.updateEditRoleDescription()">
                            <option value="customer">Customer</option>
                            <option value="lab_technician">Lab Technician</option>
                            <option value="shipping_manager">Shipping Manager</option>
                            <option value="boss_control">Manager</option>
                            <option value="administrator">Administrator</option>
                        </select>
                        <small class="form-help" id="edit-role-description"></small>
                    </div>
                    <div class="form-group">
                        <label>Current Permissions</label>
                        <div id="edit-permissions-preview" class="permissions-preview"></div>
                    </div>
                    <div class="form-group">
                        <label>User Statistics</label>
                        <div id="edit-user-stats" class="user-stats">
                            Loading user statistics...
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-success" onclick="usersManager.updateUser()">
                        💾 Update User
                    </button>
                    <button class="btn btn-danger" onclick="usersManager.deleteUser()" style="margin-left: auto;">
                        🗑️ Delete User
                    </button>
                    <button class="btn btn-secondary" onclick="usersManager.hideEditUserModal()">
                        Cancel
                    </button>
                </div>
            </div>
        </div>

        <!-- Users Table -->
        <div class="table-container">
            <table class="data-table" id="users-table">
                <thead>
                    <tr>
                        <th class="sortable" data-sort="customer_id">
                            Customer ID <span class="sort-indicator">↕️</span>
                        </th>
                        <th class="sortable" data-sort="role">
                            Role <span class="sort-indicator">↕️</span>
                        </th>
                        <th>Permissions</th>
                        <th>Test Activity</th>
                        <th class="sortable" data-sort="created_at">
                            Created <span class="sort-indicator">↕️</span>
                        </th>
                        <th style="width: 200px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="users-table-body">
                    <tr>
                        <td colspan="6" class="loading-state">
                            <div class="empty-state">
                                <div class="icon">👥</div>
                                <h4>Loading Users...</h4>
                                <p>Fetching user data from API</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- User Details Panel -->
        <div id="user-details-panel" class="details-panel" style="display: none;">
            <div class="panel-header">
                <h4>👤 User Details</h4>
                <button class="close-btn" onclick="usersManager.hideUserDetails()">✕</button>
            </div>
            <div class="panel-content" id="user-details-content">
                <!-- User details will be populated here -->
            </div>
        </div>
    </div>
</div>

<style>
.user-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;
}

.controls-left {
    display: flex;
    gap: 15px;
    align-items: center;
    flex-wrap: wrap;
}

.controls-right {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.search-input {
    padding: 10px 15px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 14px;
    min-width: 250px;
    transition: border-color 0.3s ease;
}

.search-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-select {
    padding: 10px 15px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    cursor: pointer;
}

.user-form {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 2px solid #667eea;
    border-radius: 15px;
    margin-bottom: 20px;
    overflow: hidden;
    animation: slideDown 0.3s ease;
}

.form-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.form-header h4 {
    margin: 0;
    font-size: 1.1em;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: background 0.3s ease;
}

.close-btn:hover {
    background: rgba(255,255,255,0.2);
}

.form-content {
    padding: 20px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 15px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.readonly-input {
    background: #f8f9fa;
    color: #666;
    cursor: not-allowed;
}

.form-help {
    display: block;
    margin-top: 5px;
    font-size: 12px;
    color: #666;
    font-style: italic;
}

.permissions-preview {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 12px;
    min-height: 60px;
    font-size: 13px;
    line-height: 1.4;
}

.permission-tag {
    display: inline-block;
    background: #e9ecef;
    color: #495057;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    margin: 2px 4px 2px 0;
}

.permission-tag.active {
    background: #d4edda;
    color: #155724;
}

.form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
}

.modal-content {
    background: white;
    border-radius: 15px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 15px 15px 0 0;
}

.modal-header h4 {
    margin: 0;
}

.modal-body {
    padding: 20px;
}

.modal-footer {
    padding: 15px 20px;
    border-top: 1px solid #e9ecef;
    display: flex;
    gap: 10px;
    align-items: center;
}

.user-stats {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 12px;
    font-size: 13px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
}

.stat-item:last-child {
    margin-bottom: 0;
}

.details-panel {
    position: fixed;
    right: 0;
    top: 0;
    width: 400px;
    height: 100vh;
    background: white;
    box-shadow: -5px 0 15px rgba(0,0,0,0.1);
    z-index: 999;
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.details-panel.open {
    transform: translateX(0);
}

.panel-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.panel-content {
    padding: 20px;
    height: calc(100vh - 70px);
    overflow-y: auto;
}

.role-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
}

.role-customer {
    background: #e3f2fd;
    color: #1976d2;
}

.role-lab_technician {
    background: #e8f5e8;
    color: #388e3c;
}

.role-shipping_manager {
    background: #fff3e0;
    color: #f57c00;
}

.role-boss_control {
    background: #f3e5f5;
    color: #7b1fa2;
}

.role-administrator {
    background: #ffebee;
    color: #c62828;
}

.activity-summary {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 10px;
    font-size: 12px;
    text-align: center;
}

.activity-number {
    font-weight: bold;
    color: #667eea;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Responsive design */
@media (max-width: 768px) {
    .user-controls {
        flex-direction: column;
        align-items: stretch;
    }
    
    .controls-left,
    .controls-right {
        justify-content: center;
    }
    
    .search-input {
        min-width: auto;
        width: 100%;
    }
    
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .modal-content {
        margin: 20px;
        width: auto;
    }
    
    .details-panel {
        width: 100%;
    }
    
    .form-actions {
        flex-direction: column;
    }
    
    .modal-footer {
        flex-direction: column;
    }
}
</style>

<script>
class UsersManager {
    constructor() {
        this.allUsers = [];
        this.filteredUsers = [];
        this.sortField = 'created_at';
        this.sortDirection = 'desc';
        this.currentEditUser = null;
        this.roleDefinitions = {
            'customer': {
                name: 'Customer',
                description: 'Regular customer with test access',
                permissions: ['view_own_tests', 'submit_supplements', 'view_own_results']
            },
            'lab_technician': {
                name: 'Lab Technician',
                description: 'Can score tests and manage lab results',
                permissions: ['manage_nad_test', 'submit_scores', 'view_dashboard', 'view_all_tests']
            },
            'shipping_manager': {
                name: 'Shipping Manager',
                description: 'Can manage orders and shipping',
                permissions: ['manage_nad_shipping_order', 'view_orders', 'update_shipping', 'view_dashboard']
            },
            'boss_control': {
                name: 'Manager',
                description: 'Full access to tests and shipping',
                permissions: ['manage_nad_test', 'manage_nad_shipping_order', 'full_access', 'view_dashboard', 'manage_users']
            },
            'administrator': {
                name: 'Administrator',
                description: 'Full system access including user management',
                permissions: ['manage_nad_test', 'manage_nad_shipping_order', 'full_access', 'manage_users', 'view_dashboard', 'system_admin']
            }
        };
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadUsers();
    }
    
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('user-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterUsers(e.target.value, document.getElementById('role-filter').value);
            });
        }
        
        // Role filter
        const roleFilter = document.getElementById('role-filter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                this.filterUsers(document.getElementById('user-search').value, e.target.value);
            });
        }
        
        // Table sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                this.sortBy(field);
            });
        });
    }
    
    async loadUsers() {
        console.log('👥 Loading users from API...');
        this.showAlert('🔄 Loading users from database...', 'info');
        
        try {
            const response = await fetch('<?= API_BASE_URL ?>/api/users');
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.allUsers = data.users;
                this.filteredUsers = [...this.allUsers];
                this.sortUsers();
                this.renderUsersTable();
                this.updateUserStats();
                this.showAlert(`✅ Loaded ${this.allUsers.length} users successfully!`, 'success');
            } else {
                throw new Error(data.error || 'Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showUsersError(error.message);
        }
    }
    
    filterUsers(searchTerm, roleFilter) {
        this.filteredUsers = this.allUsers.filter(user => {
            const matchesSearch = !searchTerm || 
                user.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.role.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesRole = !roleFilter || user.role === roleFilter;
            
            return matchesSearch && matchesRole;
        });
        
        this.sortUsers();
        this.renderUsersTable();
    }
    
    sortBy(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        this.updateSortIndicators();
        this.sortUsers();
        this.renderUsersTable();
    }
    
    sortUsers() {
        this.filteredUsers.sort((a, b) => {
            let aVal = a[this.sortField];
            let bVal = b[this.sortField];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            let comparison = 0;
            if (aVal > bVal) comparison = 1;
            if (aVal < bVal) comparison = -1;
            
            return this.sortDirection === 'desc' ? -comparison : comparison;
        });
    }
    
    updateSortIndicators() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
            if (header.dataset.sort === this.sortField) {
                header.classList.add(this.sortDirection);
            }
        });
    }
    
    renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <div class="icon">👥</div>
                            <h4>No Users Found</h4>
                            <p>No users match your current filters.</p>
                            <button class="btn" onclick="usersManager.showAddUserForm()" style="margin-top: 15px;">
                                ➕ Add First User
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.filteredUsers.map(user => {
            const roleInfo = this.roleDefinitions[user.role] || { name: user.role, permissions: [] };
            const createdDate = new Date(user.created_at).toLocaleDateString();
            
            return `
                <tr>
                    <td><strong>${user.customer_id}</strong></td>
                    <td><span class="role-badge role-${user.role}">${roleInfo.name}</span></td>
                    <td>
                        <div class="permissions-preview">
                            ${roleInfo.permissions.slice(0, 2).map(p => 
                                `<span class="permission-tag active">${p.replace(/_/g, ' ')}</span>`
                            ).join('')}
                            ${roleInfo.permissions.length > 2 ? `<span class="permission-tag">+${roleInfo.permissions.length - 2} more</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="activity-summary">
                            <div><span class="activity-number">${user.total_tests || 0}</span> tests</div>
                            <div><span class="activity-number">${user.completed_tests || 0}</span> completed</div>
                        </div>
                    </td>
                    <td>${createdDate}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm" onclick="usersManager.viewUserDetails(${user.customer_id})" title="View details">
                                👁️ View
                            </button>
                            <button class="btn btn-sm" onclick="usersManager.editUser(${user.customer_id})" title="Edit user" style="background: #ffc107; color: #333;">
                                ✏️ Edit
                            </button>
                            <button class="btn btn-sm btn-success" onclick="usersManager.activateUserTests(${user.customer_id})" title="Activate user tests">
                                ⚡ Activate
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    updateUserStats() {
        const stats = this.calculateUserStats();
        document.getElementById('total-users-count').textContent = stats.total;
        document.getElementById('customers-count').textContent = stats.customers;
        document.getElementById('lab-techs-count').textContent = stats.lab_techs;
        document.getElementById('admins-count').textContent = stats.admins;
    }
    
    calculateUserStats() {
        const stats = {
            total: this.allUsers.length,
            customers: 0,
            lab_techs: 0,
            admins: 0
        };
        
        this.allUsers.forEach(user => {
            switch (user.role) {
                case 'customer': stats.customers++; break;
                case 'lab_technician': stats.lab_techs++; break;
                case 'administrator': 
                case 'boss_control': 
                    stats.admins++; 
                    break;
            }
        });
        
        return stats;
    }
    
    showAddUserForm() {
        document.getElementById('add-user-form').style.display = 'block';
        document.getElementById('new-customer-id').focus();
        this.updateRoleDescription();
    }
    
    hideAddUserForm() {
        document.getElementById('add-user-form').style.display = 'none';
        this.clearAddUserForm();
    }
    
    clearAddUserForm() {
        document.getElementById('new-customer-id').value = '';
        document.getElementById('new-user-role').value = '';
        this.updateRoleDescription();
    }
    
    updateRoleDescription() {
        const roleSelect = document.getElementById('new-user-role');
        const description = document.getElementById('role-description');
        const preview = document.getElementById('permissions-preview');
        
        const selectedRole = roleSelect.value;
        if (selectedRole && this.roleDefinitions[selectedRole]) {
            const roleInfo = this.roleDefinitions[selectedRole];
            description.textContent = roleInfo.description;
            preview.innerHTML = roleInfo.permissions.map(p => 
                `<span class="permission-tag active">${p.replace(/_/g, ' ')}</span>`
            ).join('');
        } else {
            description.textContent = 'Select a role to see description';
            preview.textContent = 'Select a role to preview permissions';
        }
    }
    
    async createUser() {
        const customerId = document.getElementById('new-customer-id').value.trim();
        const role = document.getElementById('new-user-role').value;
        
        if (!customerId || !role) {
            this.showAlert('❌ Please fill in all required fields', 'error');
            return;
        }
        
        if (isNaN(customerId) || parseInt(customerId) <= 0) {
            this.showAlert('❌ Customer ID must be a valid positive number', 'error');
            return;
        }
        
        // Check if user already exists
        if (this.allUsers.find(u => u.customer_id == customerId)) {
            this.showAlert('❌ A user with this Customer ID already exists', 'error');
            return;
        }
        
        try {
            this.showAlert('🔄 Creating user...', 'info');
            
            const response = await fetch('<?= API_BASE_URL ?>/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: parseInt(customerId),
                    role: role,
                    permissions: this.getDefaultPermissions(role)
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showAlert(`✅ User created successfully! Customer ID: ${customerId}`, 'success');
                this.hideAddUserForm();
                this.loadUsers();
            } else {
                throw new Error(data.error || 'Failed to create user');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            this.showAlert(`❌ Failed to create user: ${error.message}`, 'error');
        }
    }
    
    getDefaultPermissions(role) {
        return this.roleDefinitions[role]?.permissions.reduce((acc, perm) => {
            acc[perm] = true;
            return acc;
        }, {}) || {};
    }
    
    async viewUserDetails(customerId) {
        try {
            this.showAlert('🔄 Loading user details...', 'info');
            
            const response = await fetch(`<?= API_BASE_URL ?>/api/users/${customerId}`);
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showUserDetailsPanel(data.user);
                this.showAlert(`✅ Loaded details for user ${customerId}`, 'success');
            } else {
                throw new Error(data.error || 'User not found');
            }
        } catch (error) {
            console.error('Error viewing user:', error);
            this.showAlert(`❌ Failed to load user details: ${error.message}`, 'error');
        }
    }
    
    showUserDetailsPanel(user) {
        const panel = document.getElementById('user-details-panel');
        const content = document.getElementById('user-details-content');
        
        const roleInfo = this.roleDefinitions[user.role] || { name: user.role, permissions: [] };
        const createdDate = new Date(user.created_at).toLocaleDateString();
        
        content.innerHTML = `
            <div class="user-detail-section">
                <h5>👤 Basic Information</h5>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Customer ID:</label>
                        <value>${user.customer_id}</value>
                    </div>
                    <div class="detail-item">
                        <label>Role:</label>
                        <value><span class="role-badge role-${user.role}">${roleInfo.name}</span></value>
                    </div>
                    <div class="detail-item">
                        <label>Created:</label>
                        <value>${createdDate}</value>
                    </div>
                    <div class="detail-item">
                        <label>Last Updated:</label>
                        <value>${new Date(user.updated_at).toLocaleDateString()}</value>
                    </div>
                </div>
            </div>
            
            <div class="user-detail-section">
                <h5>🔐 Permissions</h5>
                <div class="permissions-list">
                    ${roleInfo.permissions.map(p => 
                        `<span class="permission-tag active">${p.replace(/_/g, ' ')}</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="user-detail-section">
                <h5>📊 Test Activity</h5>
                <div class="activity-stats">
                    <div class="stat-item">
                        <label>Total Tests:</label>
                        <value>${user.tests?.length || 0}</value>
                    </div>
                    <div class="stat-item">
                        <label>Completed Tests:</label>
                        <value>${user.tests?.filter(t => t.score).length || 0}</value>
                    </div>
                    <div class="stat-item">
                        <label>Pending Tests:</label>
                        <value>${user.tests?.filter(t => t.status === 'activated' && !t.score).length || 0}</value>
                    </div>
                </div>
            </div>
            
            ${user.tests && user.tests.length > 0 ? `
                <div class="user-detail-section">
                    <h5>🧪 Recent Tests</h5>
                    <div class="tests-list">
                        ${user.tests.slice(0, 5).map(test => `
                            <div class="test-item">
                                <div class="test-id">${test.test_id}</div>
                                <div class="test-status">
                                    <span class="status-badge status-${test.status || 'pending'}">
                                        ${test.status ? test.status.charAt(0).toUpperCase() + test.status.slice(1) : 'Pending'}
                                        ${test.score ? ` (${test.score})` : ''}
                                    </span>
                                </div>
                                <div class="test-date">${new Date(test.created_date).toLocaleDateString()}</div>
                            </div>
                        `).join('')}
                        ${user.tests.length > 5 ? `<div class="more-tests">... and ${user.tests.length - 5} more tests</div>` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div class="panel-actions">
                <button class="btn btn-success" onclick="usersManager.editUser(${user.customer_id})">
                    ✏️ Edit User
                </button>
                <button class="btn btn-warning" onclick="usersManager.activateUserTests(${user.customer_id})">
                    ⚡ Activate Tests
                </button>
            </div>
        `;
        
        panel.classList.add('open');
        panel.style.display = 'block';
    }
    
    hideUserDetails() {
        const panel = document.getElementById('user-details-panel');
        panel.classList.remove('open');
        setTimeout(() => {
            panel.style.display = 'none';
        }, 300);
    }
    
    editUser(customerId) {
        const user = this.allUsers.find(u => u.customer_id == customerId);
        if (!user) {
            this.showAlert('❌ User not found', 'error');
            return;
        }
        
        this.currentEditUser = user;
        
        // Populate edit form
        document.getElementById('edit-customer-id').value = user.customer_id;
        document.getElementById('edit-user-role').value = user.role;
        
        this.updateEditRoleDescription();
        this.updateEditUserStats(user);
        
        // Show modal
        document.getElementById('edit-user-modal').style.display = 'flex';
    }
    
    hideEditUserModal() {
        document.getElementById('edit-user-modal').style.display = 'none';
        this.currentEditUser = null;
    }
    
    updateEditRoleDescription() {
        const roleSelect = document.getElementById('edit-user-role');
        const description = document.getElementById('edit-role-description');
        const preview = document.getElementById('edit-permissions-preview');
        
        const selectedRole = roleSelect.value;
        if (selectedRole && this.roleDefinitions[selectedRole]) {
            const roleInfo = this.roleDefinitions[selectedRole];
            description.textContent = roleInfo.description;
            preview.innerHTML = roleInfo.permissions.map(p => 
                `<span class="permission-tag active">${p.replace(/_/g, ' ')}</span>`
            ).join('');
        }
    }
    
    updateEditUserStats(user) {
        const statsDiv = document.getElementById('edit-user-stats');
        statsDiv.innerHTML = `
            <div class="stat-item">
                <span>Total Tests:</span>
                <span>${user.total_tests || 0}</span>
            </div>
            <div class="stat-item">
                <span>Activated Tests:</span>
                <span>${user.activated_tests || 0}</span>
            </div>
            <div class="stat-item">
                <span>Completed Tests:</span>
                <span>${user.completed_tests || 0}</span>
            </div>
            <div class="stat-item">
                <span>Last Test:</span>
                <span>${user.last_test_date ? new Date(user.last_test_date).toLocaleDateString() : 'None'}</span>
            </div>
        `;
    }
    
    async updateUser() {
        if (!this.currentEditUser) return;
        
        const newRole = document.getElementById('edit-user-role').value;
        
        if (!newRole) {
            this.showAlert('❌ Please select a role', 'error');
            return;
        }
        
        try {
            this.showAlert('🔄 Updating user role...', 'info');
            
            const response = await fetch(`<?= API_BASE_URL ?>/api/users/${this.currentEditUser.customer_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: newRole,
                    permissions: this.getDefaultPermissions(newRole)
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                const roleInfo = this.roleDefinitions[newRole];
                this.showAlert(`✅ User ${this.currentEditUser.customer_id} role updated to ${roleInfo.name}`, 'success');
                this.hideEditUserModal();
                this.loadUsers();
            } else {
                throw new Error(data.error || 'Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            this.showAlert(`❌ Failed to update user: ${error.message}`, 'error');
        }
    }
    
    async deleteUser() {
        if (!this.currentEditUser) return;
        
        const confirmMessage = `Delete user ${this.currentEditUser.customer_id}?\n\nThis action cannot be undone and will remove all associated data.`;
        if (!confirm(confirmMessage)) return;
        
        try {
            this.showAlert('🔄 Deleting user...', 'info');
            
            const response = await fetch(`<?= API_BASE_URL ?>/api/users/${this.currentEditUser.customer_id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showAlert(`✅ User ${this.currentEditUser.customer_id} deleted successfully`, 'success');
                this.hideEditUserModal();
                this.loadUsers();
            } else {
                throw new Error(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showAlert(`❌ Failed to delete user: ${error.message}`, 'error');
        }
    }
    
    async activateUserTests(customerId) {
        if (!confirm(`Activate all tests for user ${customerId}?`)) return;
        
        try {
            this.showAlert('🔄 Activating user tests...', 'info');
            
            const response = await fetch(`<?= API_BASE_URL ?>/api/users/${customerId}/activate-tests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showAlert(`✅ Activated ${data.activated_count} tests for user ${customerId}`, 'success');
                this.loadUsers();
            } else {
                throw new Error(data.error || 'Failed to activate tests');
            }
        } catch (error) {
            console.error('Error activating user tests:', error);
            this.showAlert(`❌ Failed to activate tests: ${error.message}`, 'error');
        }
    }
    
    async exportUsers() {
        try {
            this.showAlert('📊 Exporting user data...', 'info');
            
            const exportData = {
                export_date: new Date().toISOString(),
                total_users: this.allUsers.length,
                users: this.allUsers.map(user => ({
                    customer_id: user.customer_id,
                    role: user.role,
                    created_at: user.created_at,
                    total_tests: user.total_tests || 0,
                    activated_tests: user.activated_tests || 0,
                    completed_tests: user.completed_tests || 0
                }))
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nad_users_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showAlert('✅ User data exported successfully!', 'success');
        } catch (error) {
            console.error('❌ Export error:', error);
            this.showAlert('❌ Failed to export user data', 'error');
        }
    }
    
    showUsersError(errorMessage) {
        const tbody = document.getElementById('users-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <div class="icon">⚠️</div>
                            <h4>Error Loading Users</h4>
                            <p>${errorMessage}</p>
                            <button class="btn" onclick="usersManager.loadUsers()" style="margin-top: 15px;">
                                🔄 Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        this.showAlert('❌ Failed to load users.', 'error');
    }
    
    showAlert(message, type) {
        const alertDiv = document.getElementById('user-alert');
        if (alertDiv) {
            alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            
            if (type === 'success' || type === 'info') {
                setTimeout(() => {
                    alertDiv.innerHTML = '';
                }, 5000);
            }
        }
        console.log(`📢 User Alert (${type}):`, message);
    }
}

// Additional styles for user details
const additionalStyles = `
<style>
.user-detail-section {
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e9ecef;
}

.user-detail-section:last-child {
    border-bottom: none;
}

.user-detail-section h5 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 1.1em;
    display: flex;
    align-items: center;
    gap: 8px;
}

.detail-grid {
    display: grid;
    gap: 10px;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
}

.detail-item label {
    font-weight: 500;
    color: #666;
}

.detail-item value {
    color: #333;
    font-weight: 500;
}

.permissions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.activity-stats {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
}

.tests-list {
    max-height: 200px;
    overflow-y: auto;
}

.test-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    margin-bottom: 8px;
    background: #f8f9fa;
}

.test-id {
    font-family: monospace;
    font-weight: bold;
    color: #495057;
}

.test-date {
    font-size: 12px;
    color: #666;
}

.more-tests {
    text-align: center;
    padding: 10px;
    color: #666;
    font-style: italic;
}

.panel-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #e9ecef;
}

@media (max-width: 768px) {
    .detail-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }
    
    .test-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }
    
    .panel-actions {
        flex-direction: column;
    }
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Global functions for backward compatibility
function loadUsers() {
    if (window.usersManager) {
        window.usersManager.loadUsers();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('users')) {
        window.usersManager = new UsersManager();
    }
});

// Export for global access
window.UsersManager = UsersManager;
window.loadUsers = loadUsers;
</script>
