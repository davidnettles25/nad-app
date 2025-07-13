// Shopify Authentication Integration
// Handles Multipass authentication and role verification

class ShopifyAuth {
    constructor() {
        this.storeUrl = 'https://mynadtest.myshopify.com';
        this.token = null;
        this.userRole = null;
        this.customerId = null;
    }
    
    // Initialize authentication from URL parameters or session
    init() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Get auth data from URL (Multipass redirect)
        this.token = urlParams.get('token') || sessionStorage.getItem('shopify_token');
        this.userRole = urlParams.get('role') || sessionStorage.getItem('shopify_role');
        this.customerId = urlParams.get('customer_id') || sessionStorage.getItem('shopify_customer_id');
        
        if (this.token) {
            // Store in session for subsequent requests
            sessionStorage.setItem('shopify_token', this.token);
            sessionStorage.setItem('shopify_role', this.userRole);
            sessionStorage.setItem('shopify_customer_id', this.customerId);
            
            // Clean URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            return true;
        }
        
        return false;
    }
    
    // Verify user has required role for current interface
    verifyAccess(requiredRole) {
        if (!this.token) {
            this.redirectToLogin();
            return false;
        }
        
        if (requiredRole && this.userRole !== requiredRole) {
            this.showAccessDenied();
            return false;
        }
        
        return true;
    }
    
    // Redirect to Shopify login
    redirectToLogin() {
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `${this.storeUrl}/account/login?return_url=${returnUrl}`;
    }
    
    // Show access denied message and redirect
    showAccessDenied() {
        alert('Access denied. Please contact administrator for proper role assignment.');
        setTimeout(() => {
            window.location.href = this.storeUrl;
        }, 3000);
    }
    
    // Logout and return to Shopify
    logout() {
        sessionStorage.clear();
        window.location.href = `${this.storeUrl}/account/logout`;
    }
    
    // Get headers for API requests
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-Shopify-Token': this.token,
            'X-Shopify-Role': this.userRole,
            'X-Shopify-Customer-ID': this.customerId
        };
    }
    
    // Make authenticated API request
    async apiRequest(endpoint, options = {}) {
        const defaultOptions = {
            headers: this.getAuthHeaders()
        };
        
        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(endpoint, requestOptions);
            
            if (response.status === 401) {
                // Token expired or invalid
                this.redirectToLogin();
                return null;
            }
            
            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    // Get user info for display
    getUserInfo() {
        return {
            role: this.userRole,
            customerId: this.customerId,
            isAuthenticated: !!this.token
        };
    }
}

// Global instance
window.ShopifyAuth = new ShopifyAuth();

console.log('✅ Shopify Authentication utilities loaded');
