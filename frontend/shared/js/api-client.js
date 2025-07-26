/**
 * NAD Test Cycle - API Client
 * File: shared/js/api-client.js
 * Purpose: Centralized API communication
 */

'use strict';

window.NAD = window.NAD || {};

// API client
NAD.API = {
    config: {
        baseURL: 'https://mynadtest.info',
        timeout: 30000
    },
    
    // Make request
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            data = null,
            headers = {},
            ...fetchOptions
        } = options;
        
        const url = endpoint.startsWith('http') ? 
            endpoint : 
            this.config.baseURL + endpoint;
        
        const fetchConfig = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            ...fetchOptions
        };
        
        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            fetchConfig.body = JSON.stringify(data);
        }
        
        try {
            NAD.logger.debug(`API Request: ${method} ${url}`);
            
            const response = await fetch(url, fetchConfig);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            let responseData;
            
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                // Non-JSON response (likely HTML error page)
                const textData = await response.text();
                responseData = { 
                    success: false, 
                    error: `Server returned non-JSON response: ${response.status} ${response.statusText}`,
                    responseText: textData.substring(0, 100) + '...' // First 100 chars for debugging
                };
            }
            
            if (!response.ok) {
                throw new Error(responseData.error || `HTTP ${response.status} ${response.statusText}`);
            }
            
            return responseData;
            
        } catch (error) {
            NAD.logger.error(`API Error: ${method} ${url}`, error);
            throw error;
        }
    },
    
    // HTTP method shortcuts
    async get(endpoint, params = {}) {
        const url = new URL(endpoint, this.config.baseURL);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, value);
            }
        });
        return this.request(url.toString());
    },
    
    async post(endpoint, data = {}) {
        return this.request(endpoint, { method: 'POST', data });
    },
    
    async put(endpoint, data = {}) {
        return this.request(endpoint, { method: 'PUT', data });
    },
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    // API methods
    async checkHealth() {
        return this.get('/health');
    },
    
    async getDashboardStats() {
        return this.get('/api/dashboard/stats');
    },
    
    async getTests() {
        return this.get('/api/admin/tests');
    },
    
    async getUsers() {
        return this.get('/api/users');
    },
    
    async getSupplements() {
        return this.get('/api/supplements');
    },
    
    // Customer portal methods
    async activateTest(data) {
        return this.post('/api/customer/activate-test', data);
    },
    
    async verifyTest(data) {
        return this.post('/api/customer/verify-test', data);
    }
};

// Create shorthand reference
NAD.api = NAD.API;

NAD.logger.debug('API client loaded');
