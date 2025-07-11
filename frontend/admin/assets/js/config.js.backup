/**
 * NAD Test Cycle - Admin Configuration
 * For mynadtest.info on AWS Lightsail Bitnami LAMP Stack
 * Generated: 2025
 */

const NAD_CONFIG = {
    // Core API Configuration
    API_BASE: 'https://mynadtest.info',
    API_PORT: 3001,
    
    // API Endpoints
    ENDPOINTS: {
        // Health and System
        HEALTH: '/health',
        SYSTEM_STATUS: '/api/system/status',
        
        // Dashboard
        DASHBOARD_STATS: '/api/dashboard/stats',
        
        // Test Management
        TESTS: '/api/admin/tests',
        TEST_BY_ID: '/api/tests/{id}',
        TEST_ACTIVATE: '/api/admin/tests/{id}/activate',
        TEST_DEACTIVATE: '/api/admin/tests/{id}/deactivate',
        TEST_BULK_ACTIVATE: '/api/admin/tests/bulk-activate',
        TEST_BULK_DEACTIVATE: '/api/admin/tests/bulk-deactivate',
        TEST_EXPORT: '/api/admin/export/tests',
        TEST_VERIFY: '/api/tests/verify',
        TEST_SUPPLEMENTS: '/api/tests/{id}/supplements',
        TEST_RESULTS: '/api/tests/{id}/results',
        TEST_SCORE: '/api/tests/score',
        
        // User Management
        USERS: '/api/users',
        USER_BY_ID: '/api/users/{id}',
        USER_STATS: '/api/users/stats',
        USER_DEBUG: '/api/users/debug-all',
        USER_SIMPLE: '/api/users/simple',
        USER_ROLES: '/api/users/roles/available',
        USER_ACTIVATE_TESTS: '/api/users/{id}/activate-tests',
        
        // Supplement Management
        SUPPLEMENTS: '/api/supplements',
        SUPPLEMENT_BY_ID: '/api/supplements/{id}',
        
        // Analytics
        ANALYTICS_OVERVIEW: '/api/analytics/overview',
        ANALYTICS_PERFORMANCE: '/api/analytics/performance',
        
        // Lab Interface
        LAB_PENDING_TESTS: '/api/lab/pending-tests',
        LAB_STATS: '/api/lab/stats',
        
        // Reports and Export
        REPORTS_SUMMARY: '/api/reports/summary',
        EXPORT_TESTS: '/api/admin/export/tests',
        EXPORT_USERS: '/api/admin/export/users',
        EXPORT_SUPPLEMENTS: '/api/admin/export/supplements',
        
        // Notifications
        NOTIFICATIONS: '/api/notifications',
        
        // Batch Operations
        BATCH_ACTIVATE: '/api/batch/activate-tests'
    },
    
    // Database Configuration (for reference - not used in frontend)
    DATABASE: {
        NAME: 'nad_cycle',
        USER: 'nad_user',
        // Password not included for security
        TABLES: {
            TEST_IDS: 'nad_test_ids',
            TEST_SCORES: 'nad_test_scores', 
            USER_ROLES: 'nad_user_roles',
            USER_SUPPLEMENTS: 'nad_user_supplements',
            SUPPLEMENTS: 'nad_supplements',
            DOSES: 'nad_doses'
        }
    },
    
    // Shopify Integration
    SHOPIFY: {
        STORE_URL: 'mynadtest.myshopify.com',
        API_VERSION: '2023-10',
        // Access token not included for security
        WEBHOOK_ENDPOINTS: {
            ORDERS_CREATE: 'orders/create',
            ORDERS_PAID: 'orders/paid', 
            ORDERS_FULFILLED: 'orders/fulfilled'
        }
    },
    
    // Pagination Settings
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100,
        ITEMS_PER_PAGE_OPTIONS: [10, 20, 50, 100]
    },
    
    // Refresh Intervals (in milliseconds)
    REFRESH_INTERVALS: {
        DASHBOARD: 30000,      // 30 seconds
        ANALYTICS: 300000,     // 5 minutes
        TEST_QUEUE: 60000,     // 1 minute
        USER_ACTIVITY: 120000, // 2 minutes
        SYSTEM_HEALTH: 60000   // 1 minute
    },
    
    // File Upload Configuration
    UPLOAD: {
        MAX_FILE_SIZE: 10485760,  // 10MB
        ALLOWED_TYPES: ['jpg', 'jpeg', 'png', 'pdf', 'gif'],
        UPLOAD_PATH: '/uploads/',
        TEMP_PATH: '/tmp/'
    },
    
    // UI Configuration
    UI: {
        // Animation timings
        ANIMATION_DURATION: 300,
        LOADING_DELAY: 500,
        SUCCESS_MESSAGE_DURATION: 5000,
        ERROR_MESSAGE_DURATION: 10000,
        
        // Table settings
        DEFAULT_SORT: 'created_date',
        DEFAULT_SORT_ORDER: 'desc',
        
        // Color scheme
        COLORS: {
            PRIMARY: '#667eea',
            SUCCESS: '#28a745',
            WARNING: '#ffc107', 
            DANGER: '#dc3545',
            INFO: '#17a2b8'
        }
    },
    
    // Test ID Configuration
    TEST_ID: {
        FORMAT: 'NAD-YYYYMMDD-XXXX',
        PREFIX: 'NAD-',
        DATE_FORMAT: 'YYYYMMDD',
        RANDOM_LENGTH: 4
    },
    
    // User Roles and Permissions
    USER_ROLES: {
        CUSTOMER: {
            name: 'Customer',
            permissions: ['view_own_tests', 'submit_supplements', 'view_own_results']
        },
        LAB_TECHNICIAN: {
            name: 'Lab Technician', 
            permissions: ['manage_nad_test', 'submit_scores', 'view_dashboard', 'view_all_tests']
        },
        SHIPPING_MANAGER: {
            name: 'Shipping Manager',
            permissions: ['manage_nad_shipping_order', 'view_orders', 'update_shipping', 'view_dashboard']
        },
        BOSS_CONTROL: {
            name: 'Manager',
            permissions: ['manage_nad_test', 'manage_nad_shipping_order', 'full_access', 'view_dashboard', 'manage_users']
        },
        ADMINISTRATOR: {
            name: 'Administrator',
            permissions: ['manage_nad_test', 'manage_nad_shipping_order', 'full_access', 'manage_users', 'view_dashboard', 'system_admin']
        }
    },
    
    // Score Ranges for Analytics
    SCORE_RANGES: {
        EXCELLENT: { min: 80, max: 100, label: 'Excellent', color: '#28a745' },
        GOOD: { min: 60, max: 79, label: 'Good', color: '#17a2b8' },
        FAIR: { min: 40, max: 59, label: 'Fair', color: '#ffc107' },
        POOR: { min: 0, max: 39, label: 'Poor', color: '#dc3545' }
    },
    
    // Environment Configuration
    ENVIRONMENT: {
        NAME: 'production',
        DEBUG: false,
        API_TIMEOUT: 30000,     // 30 seconds
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000       // 1 second
    },
    
    // Bitnami-specific Configuration
    BITNAMI: {
        WEB_ROOT: '/opt/bitnami/apache/htdocs/nad-app/',
        NODE_API_PATH: '/opt/nad-api/',
        APACHE_CONFIG: '/opt/bitnami/apache/conf/',
        SSL_CERT_PATH: '/opt/bitnami/apache/conf/bitnami/certs/',
        PROCESS_MANAGER: 'pm2',
        PROCESS_NAME: 'nad-api'
    },
    
    // Error Messages
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
        API_ERROR: 'The server encountered an error. Please try again later.',
        PERMISSION_ERROR: 'You do not have permission to perform this action.',
        VALIDATION_ERROR: 'Please check your input and try again.',
        NOT_FOUND: 'The requested resource was not found.',
        SERVER_ERROR: 'Internal server error. Please contact support if this persists.'
    },
    
    // Success Messages
    SUCCESS_MESSAGES: {
        TEST_ACTIVATED: 'Test activated successfully!',
        TEST_DEACTIVATED: 'Test deactivated successfully!',
        USER_CREATED: 'User created successfully!',
        USER_UPDATED: 'User updated successfully!',
        SUPPLEMENT_SAVED: 'Supplement saved successfully!',
        DATA_EXPORTED: 'Data exported successfully!',
        BULK_OPERATION: 'Bulk operation completed successfully!'
    }
};

// Utility functions for working with the config
NAD_CONFIG.utils = {
    // Build full API URL
    getApiUrl: function(endpoint, params = {}) {
        let url = this.API_BASE + endpoint;
        
        // Replace path parameters
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`{${key}}`, value);
        }
        
        return url;
    },
    
    // Get endpoint with parameters
    getEndpoint: function(endpointKey, params = {}) {
        const endpoint = this.ENDPOINTS[endpointKey];
        if (!endpoint) {
            console.error(`Endpoint ${endpointKey} not found in config`);
            return null;
        }
        
        return this.getApiUrl(endpoint, params);
    },
    
    // Check if user has permission
    hasPermission: function(userRole, permission) {
        const role = this.USER_ROLES[userRole.toUpperCase()];
        return role && role.permissions.includes(permission);
    },
    
    // Get score range info
    getScoreRange: function(score) {
        const numScore = parseInt(score);
        for (const [key, range] of Object.entries(this.SCORE_RANGES)) {
            if (numScore >= range.min && numScore <= range.max) {
                return range;
            }
        }
        return this.SCORE_RANGES.POOR; // Default fallback
    },
    
    // Format test ID
    formatTestId: function(date, sequence) {
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const seqStr = sequence.toString().padStart(this.TEST_ID.RANDOM_LENGTH, '0');
        return `${this.TEST_ID.PREFIX}${dateStr}-${seqStr}`;
    },
    
    // Validate test ID format
    isValidTestId: function(testId) {
        const regex = new RegExp(`^${this.TEST_ID.PREFIX}\\d{8}-\\d{${this.TEST_ID.RANDOM_LENGTH}}$`);
        return regex.test(testId);
    }
};

// Bind utils to config object
Object.setPrototypeOf(NAD_CONFIG.utils, NAD_CONFIG);

// Make config globally available
if (typeof window !== 'undefined') {
    window.NAD_CONFIG = NAD_CONFIG;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NAD_CONFIG;
}

console.log('✅ NAD Configuration loaded successfully');
console.log('🌐 API Base:', NAD_CONFIG.API_BASE);
console.log('🗄️ Database:', NAD_CONFIG.DATABASE.NAME);
console.log('🏪 Shopify Store:', NAD_CONFIG.SHOPIFY.STORE_URL);
