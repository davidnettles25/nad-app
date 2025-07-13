/**
 * NAD Test Cycle - Admin Configuration (Shopify Auth Version)
 * For mynadtest.info with Shopify Authentication
 */

const NAD_CONFIG = {
    // Core API Configuration
    API_BASE: 'https://mynadtest.info',
    API_PORT: 3001,
    
    // Shopify Configuration
    SHOPIFY_STORE: 'mynadtest.myshopify.com',
    SHOPIFY_STORE_URL: 'https://mynadtest.myshopify.com',
    
    // API Endpoints (REMOVED user management endpoints)
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
        
        // Supplement Management
        SUPPLEMENTS: '/api/supplements',
        SUPPLEMENT_BY_ID: '/api/supplements/{id}',
        
        // Analytics (REMOVED user analytics endpoints)
        ANALYTICS_OVERVIEW: '/api/analytics/overview',
        ANALYTICS_PERFORMANCE: '/api/analytics/performance',
        
        // Export (REMOVED users export)
        EXPORT_TESTS: '/api/admin/export/tests',
        EXPORT_SUPPLEMENTS: '/api/admin/export/supplements',
        
        // Lab Interface
        LAB_QUEUE: '/api/lab/queue',
        LAB_SUBMIT_SCORE: '/api/lab/submit-score',
        LAB_UPLOAD_IMAGE: '/api/lab/upload-image'
    },
    
    // Role-based Access Control
    ROLES: {
        ADMIN: 'admin',
        LAB: 'lab',
        CUSTOMER: 'customer'
    },
    
    // Interface URLs
    INTERFACES: {
        ADMIN: '/admin.html',
        LAB: '/lab.html', 
        CUSTOMER: '/customer.html'
    },
    
    // Authentication Settings
    AUTH: {
        REQUIRE_SHOPIFY: true,
        SESSION_TIMEOUT: 3600000, // 1 hour
        REDIRECT_UNAUTHENTICATED: true
    }
};

// Export for use in other scripts
window.NAD_CONFIG = NAD_CONFIG;

console.log('✅ NAD Configuration loaded (User Management removed)');
console.log('🔐 Shopify authentication required:', NAD_CONFIG.AUTH.REQUIRE_SHOPIFY);
