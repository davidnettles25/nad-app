/**
 * NAD Test Cycle - API Helper Functions
 * For mynadtest.info on AWS Lightsail Bitnami LAMP Stack
 * Depends on: config.js
 */

const NAD_API = {
    // Base API configuration
    timeout: NAD_CONFIG.ENVIRONMENT.API_TIMEOUT,
    retryAttempts: NAD_CONFIG.ENVIRONMENT.RETRY_ATTEMPTS,
    retryDelay: NAD_CONFIG.ENVIRONMENT.RETRY_DELAY,
    
    /**
     * Core API request function with retry logic
     */
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : NAD_CONFIG.API_BASE + endpoint;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: this.timeout
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        // Add request logging in debug mode
        if (NAD_CONFIG.ENVIRONMENT.DEBUG) {
            console.log(`🌐 API Request: ${requestOptions.method} ${url}`, requestOptions);
        }
        
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                // Create timeout promise
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Request timeout')), this.timeout);
                });
                
                // Make the request
                const fetchPromise = fetch(url, requestOptions);
                const response = await Promise.race([fetchPromise, timeoutPromise]);
                
                // Handle response
                if (response.ok) {
                    const data = await response.json();
                    
                    if (NAD_CONFIG.ENVIRONMENT.DEBUG) {
                        console.log(`✅ API Success: ${url}`, data);
                    }
                    
                    return {
                        success: true,
                        data: data,
                        status: response.status,
                        headers: response.headers
                    };
                } else {
                    // Handle HTTP errors
                    let errorData;
                    try {
                        errorData = await response.json();
                    } catch (e) {
                        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
                    }
                    
                    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                }
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ API Attempt ${attempt}/${this.retryAttempts} failed: ${url}`, error.message);
                
                // Don't retry on certain errors
                if (error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
                    break;
                }
                
                // Wait before retry (except on last attempt)
                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        
        console.error(`❌ API Failed after ${this.retryAttempts} attempts: ${url}`, lastError);
        
        return {
            success: false,
            error: lastError.message,
            status: null
        };
    },
    
    /**
     * Utility function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        let url = endpoint;
        
        // Add query parameters
        if (Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams(params);
            url += (url.includes('?') ? '&' : '?') + searchParams.toString();
        }
        
        return await this.request(url);
    },
    
    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * DELETE request
     */
    async delete(endpoint) {
        return await this.request(endpoint, {
            method: 'DELETE'
        });
    },
    
    /**
     * Upload file with FormData
     */
    async uploadFile(endpoint, formData) {
        return await this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
    },
    
    // ============================================================================
    // DASHBOARD API FUNCTIONS
    // ============================================================================
    
    async getDashboardStats() {
        return await this.get(NAD_CONFIG.ENDPOINTS.DASHBOARD_STATS);
    },
    
    async getSystemHealth() {
        return await this.get(NAD_CONFIG.ENDPOINTS.HEALTH);
    },
    
    // ============================================================================
    // TEST MANAGEMENT API FUNCTIONS
    // ============================================================================
    
    async getAllTests() {
        return await this.get(NAD_CONFIG.ENDPOINTS.TESTS);
    },
    
    async getTestById(testId) {
        const endpoint = NAD_CONFIG.ENDPOINTS.TEST_BY_ID.replace('{id}', testId);
        return await this.get(endpoint);
    },
    
    async activateTest(testId) {
        const endpoint = NAD_CONFIG.ENDPOINTS.TEST_ACTIVATE.replace('{id}', testId);
        return await this.post(endpoint);
    },
    
    async deactivateTest(testId) {
        const endpoint = NAD_CONFIG.ENDPOINTS.TEST_DEACTIVATE.replace('{id}', testId);
        return await this.post(endpoint);
    },
    
    async bulkActivateTests(testIds) {
        return await this.post(NAD_CONFIG.ENDPOINTS.TEST_BULK_ACTIVATE, {
            test_ids: testIds
        });
    },
    
    async bulkDeactivateTests(testIds) {
        return await this.post(NAD_CONFIG.ENDPOINTS.TEST_BULK_DEACTIVATE, {
            test_ids: testIds
        });
    },
    
    async verifyTest(testId, email) {
        return await this.post(NAD_CONFIG.ENDPOINTS.TEST_VERIFY, {
            test_id: testId,
            email: email
        });
    },
    
    async submitTestSupplements(testId, supplements, habitsNotes) {
        const endpoint = NAD_CONFIG.ENDPOINTS.TEST_SUPPLEMENTS.replace('{id}', testId);
        return await this.post(endpoint, {
            supplements: supplements,
            habits_notes: habitsNotes
        });
    },
    
    async getTestResults(testId) {
        const endpoint = NAD_CONFIG.ENDPOINTS.TEST_RESULTS.replace('{id}', testId);
        return await this.get(endpoint);
    },
    
    async submitTestScore(testId, score, technicianId, notes, imageFile = null) {
        const formData = new FormData();
        formData.append('test_id', testId);
        formData.append('score', score);
        formData.append('technician_id', technicianId);
        formData.append('notes', notes || '');
        
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        return await this.uploadFile(NAD_CONFIG.ENDPOINTS.TEST_SCORE, formData);
    },
    
    async exportTests() {
        return await this.get(NAD_CONFIG.ENDPOINTS.EXPORT_TESTS);
    },
    
    // ============================================================================
    // USER MANAGEMENT API FUNCTIONS
    // ============================================================================
    
    async getAllUsers() {
        return await this.get(NAD_CONFIG.ENDPOINTS.USERS);
    },
    
    async getUserById(customerId) {
        const endpoint = NAD_CONFIG.ENDPOINTS.USER_BY_ID.replace('{id}', customerId);
        return await this.get(endpoint);
    },
    
    async getUserStats() {
        return await this.get(NAD_CONFIG.ENDPOINTS.USER_STATS);
    },
    
    async createUser(customerId, role, permissions = {}) {
        return await this.post(NAD_CONFIG.ENDPOINTS.USERS, {
            customer_id: customerId,
            role: role,
            permissions: permissions
        });
    },
    
    async updateUser(customerId, role, permissions = {}) {
        const endpoint = NAD_CONFIG.ENDPOINTS.USER_BY_ID.replace('{id}', customerId);
        return await this.put(endpoint, {
            role: role,
            permissions: permissions
        });
    },
    
    async deleteUser(customerId) {
        const endpoint = NAD_CONFIG.ENDPOINTS.USER_BY_ID.replace('{id}', customerId);
        return await this.delete(endpoint);
    },
    
    async activateUserTests(customerId) {
        const endpoint = NAD_CONFIG.ENDPOINTS.USER_ACTIVATE_TESTS.replace('{id}', customerId);
        return await this.post(endpoint);
    },
    
    async getAvailableRoles() {
        return await this.get(NAD_CONFIG.ENDPOINTS.USER_ROLES);
    },
    
    // ============================================================================
    // SUPPLEMENT MANAGEMENT API FUNCTIONS
    // ============================================================================
    
    async getAllSupplements() {
        return await this.get(NAD_CONFIG.ENDPOINTS.SUPPLEMENTS);
    },
    
    async getSupplementById(supplementId) {
        const endpoint = NAD_CONFIG.ENDPOINTS.SUPPLEMENT_BY_ID.replace('{id}', supplementId);
        return await this.get(endpoint);
    },
    
    async createSupplement(supplementData) {
        return await this.post(NAD_CONFIG.ENDPOINTS.SUPPLEMENTS, supplementData);
    },
    
    async updateSupplement(supplementId, supplementData) {
        const endpoint = NAD_CONFIG.ENDPOINTS.SUPPLEMENT_BY_ID.replace('{id}', supplementId);
        return await this.put(endpoint, supplementData);
    },
    
    async deleteSupplement(supplementId) {
        const endpoint = NAD_CONFIG.ENDPOINTS.SUPPLEMENT_BY_ID.replace('{id}', supplementId);
        return await this.delete(endpoint);
    },
    
    // ============================================================================
    // LAB INTERFACE API FUNCTIONS
    // ============================================================================
    
    async getPendingTests() {
        return await this.get(NAD_CONFIG.ENDPOINTS.LAB_PENDING_TESTS);
    },
    
    async getLabStats() {
        return await this.get(NAD_CONFIG.ENDPOINTS.LAB_STATS);
    },
    
    // ============================================================================
    // ANALYTICS API FUNCTIONS
    // ============================================================================
    
    async getAnalyticsOverview(period = '30') {
        return await this.get(NAD_CONFIG.ENDPOINTS.ANALYTICS_OVERVIEW, { period });
    },
    
    async getAnalyticsPerformance(period = '30') {
        return await this.get(NAD_CONFIG.ENDPOINTS.ANALYTICS_PERFORMANCE, { period });
    },
    
    // ============================================================================
    // REPORTS AND EXPORT API FUNCTIONS
    // ============================================================================
    
    async getReportsSummary() {
        return await this.get(NAD_CONFIG.ENDPOINTS.REPORTS_SUMMARY);
    },
    
    async exportUsers() {
        return await this.get(NAD_CONFIG.ENDPOINTS.EXPORT_USERS);
    },
    
    async exportSupplements() {
        return await this.get(NAD_CONFIG.ENDPOINTS.EXPORT_SUPPLEMENTS);
    },
    
    // ============================================================================
    // NOTIFICATIONS API FUNCTIONS
    // ============================================================================
    
    async getNotifications() {
        return await this.get(NAD_CONFIG.ENDPOINTS.NOTIFICATIONS);
    },
    
    // ============================================================================
    // BATCH OPERATIONS API FUNCTIONS
    // ============================================================================
    
    async batchActivateTests(customerIds = [], testIds = []) {
        return await this.post(NAD_CONFIG.ENDPOINTS.BATCH_ACTIVATE, {
            customer_ids: customerIds,
            test_ids: testIds
        });
    },
    
    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    
    /**
     * Test API connectivity
     */
    async testConnection() {
        console.log('🔍 Testing API connectivity...');
        
        const endpoints = [
            { name: 'Health Check', endpoint: NAD_CONFIG.ENDPOINTS.HEALTH },
            { name: 'Dashboard Stats', endpoint: NAD_CONFIG.ENDPOINTS.DASHBOARD_STATS },
            { name: 'Users', endpoint: NAD_CONFIG.ENDPOINTS.USERS },
            { name: 'Supplements', endpoint: NAD_CONFIG.ENDPOINTS.SUPPLEMENTS }
        ];
        
        const results = {};
        
        for (const test of endpoints) {
            console.log(`🧪 Testing ${test.name}...`);
            const result = await this.get(test.endpoint);
            results[test.name] = {
                success: result.success,
                status: result.status,
                error: result.error
            };
            
            if (result.success) {
                console.log(`✅ ${test.name}: OK`);
            } else {
                console.log(`❌ ${test.name}: ${result.error}`);
            }
        }
        
        return results;
    },
    
    /**
     * Download file from API response
     */
    async downloadFile(endpoint, filename) {
        try {
            const response = await fetch(NAD_CONFIG.API_BASE + endpoint);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename || 'download.json';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                return { success: true };
            } else {
                throw new Error(`Download failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Download error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Make API functions globally available
if (typeof window !== 'undefined') {
    window.NAD_API = NAD_API;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NAD_API;
}

console.log('✅ NAD API Helper functions loaded successfully');
console.log('🔗 Available methods:', Object.keys(NAD_API).filter(key => typeof NAD_API[key] === 'function').length);
