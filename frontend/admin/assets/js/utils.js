/**
 * NAD Test Cycle - Utility Functions
 * For mynadtest.info on AWS Lightsail Bitnami LAMP Stack
 * Depends on: config.js
 */

const NAD_UTILS = {
    
    // ============================================================================
    // DATE AND TIME UTILITIES
    // ============================================================================
    
    /**
     * Format date for display
     */
    formatDate(dateString, options = {}) {
        if (!dateString) return 'N/A';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        try {
            return new Date(dateString).toLocaleDateString('en-US', formatOptions);
        } catch (error) {
            console.warn('Invalid date:', dateString);
            return 'Invalid Date';
        }
    },
    
    /**
     * Format datetime for display
     */
    formatDateTime(dateString, options = {}) {
        if (!dateString) return 'N/A';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        try {
            return new Date(dateString).toLocaleString('en-US', formatOptions);
        } catch (error) {
            console.warn('Invalid datetime:', dateString);
            return 'Invalid Date';
        }
    },
    
    /**
     * Get relative time (e.g., "2 hours ago")
     */
    getRelativeTime(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffMinutes < 1) return 'Just now';
            if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            
            return this.formatDate(dateString);
        } catch (error) {
            return 'Unknown';
        }
    },
    
    // ============================================================================
    // NUMBER AND FORMATTING UTILITIES
    // ============================================================================
    
    /**
     * Format numbers with commas
     */
    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return parseInt(num).toLocaleString();
    },
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    },
    
    /**
     * Format percentage
     */
    formatPercentage(value, total, decimals = 1) {
        if (!total || total === 0) return '0%';
        const percentage = (value / total) * 100;
        return percentage.toFixed(decimals) + '%';
    },
    
    /**
     * Calculate percentage
     */
    calculatePercentage(value, total) {
        if (!total || total === 0) return 0;
        return Math.round((value / total) * 100 * 10) / 10; // Round to 1 decimal
    },
    
    // ============================================================================
    // STRING UTILITIES
    // ============================================================================
    
    /**
     * Truncate text with ellipsis
     */
    truncateText(text, maxLength = 50) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength) + '...';
    },
    
    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    /**
     * Format role name for display
     */
    formatRole(role) {
        if (!role) return 'Unknown';
        
        const roleNames = {
            'customer': 'Customer',
            'lab_technician': 'Lab Technician',
            'shipping_manager': 'Shipping Manager',
            'boss_control': 'Manager',
            'administrator': 'Administrator'
        };
        
        return roleNames[role] || this.capitalize(role.replace(/_/g, ' '));
    },
    
    /**
     * Format test status
     */
    formatTestStatus(test) {
        if (!test) return 'Unknown';
        
        // Use status field directly from backend
        if (test.status) {
            return test.status.charAt(0).toUpperCase() + test.status.slice(1);
        }
        return 'Unknown';
    },
    
    // ============================================================================
    // VALIDATION UTILITIES
    // ============================================================================
    
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * Validate test ID format
     */
    isValidTestId(testId) {
        return NAD_CONFIG.utils.isValidTestId(testId);
    },
    
    /**
     * Validate score range
     */
    isValidScore(score) {
        const numScore = parseFloat(score);
        return !isNaN(numScore) && numScore >= 0 && numScore <= 100;
    },
    
    /**
     * Validate customer ID
     */
    isValidCustomerId(customerId) {
        const numId = parseInt(customerId);
        return !isNaN(numId) && numId > 0;
    },
    
    // ============================================================================
    // UI UTILITIES
    // ============================================================================
    
    /**
     * Show loading state
     */
    showLoading(element, spinnerHtml = '<span class="spinner"></span>') {
        if (!element) return;
        
        element.disabled = true;
        element.classList.add('loading');
        
        // Add spinner to button or element
        const spinner = element.querySelector('.loading-spinner');
        if (spinner) {
            spinner.innerHTML = spinnerHtml;
        } else {
            // Create spinner element
            const spinnerEl = document.createElement('span');
            spinnerEl.className = 'loading-spinner';
            spinnerEl.innerHTML = spinnerHtml;
            element.insertBefore(spinnerEl, element.firstChild);
        }
    },
    
    /**
     * Hide loading state
     */
    hideLoading(element) {
        if (!element) return;
        
        element.disabled = false;
        element.classList.remove('loading');
        
        const spinner = element.querySelector('.loading-spinner');
        if (spinner) {
            spinner.innerHTML = '';
        }
    },
    
    /**
     * Show alert message
     */
    showAlert(message, type = 'info', containerId = null) {
        // Find alert container
        let container;
        if (containerId) {
            container = document.getElementById(containerId);
        } else {
            // Try to find alert container in active section
            const activeSection = document.querySelector('.content-section.active');
            if (activeSection) {
                container = activeSection.querySelector('[id$="-alert"]');
            }
        }
        
        if (!container) {
            console.warn('Alert container not found, using console');
            console.log(`${type.toUpperCase()}: ${message}`);
            return;
        }
        
        const alertHtml = `<div class="alert alert-${type}">${message}</div>`;
        container.innerHTML = alertHtml;
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                container.innerHTML = '';
            }, NAD_CONFIG.UI.SUCCESS_MESSAGE_DURATION);
        }
    },
    
    /**
     * Clear alerts
     */
    clearAlerts(containerId = null) {
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = '';
        } else {
            // Clear all alert containers
            document.querySelectorAll('[id$="-alert"]').forEach(container => {
                container.innerHTML = '';
            });
        }
    },
    
    /**
     * Create loading skeleton
     */
    createLoadingSkeleton(rows = 5) {
        let skeleton = '<div class="loading-skeleton">';
        for (let i = 0; i < rows; i++) {
            skeleton += '<div class="skeleton-row"></div>';
        }
        skeleton += '</div>';
        return skeleton;
    },
    
    // ============================================================================
    // DATA PROCESSING UTILITIES
    // ============================================================================
    
    /**
     * Group array by property
     */
    groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    },
    
    /**
     * Sort array by property
     */
    sortBy(array, property, direction = 'asc') {
        return array.sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];
            
            if (direction === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
    },
    
    /**
     * Filter array by search term
     */
    filterBySearch(array, searchTerm, searchFields = []) {
        if (!searchTerm) return array;
        
        const term = searchTerm.toLowerCase();
        
        return array.filter(item => {
            // If specific fields provided, search only those
            if (searchFields.length > 0) {
                return searchFields.some(field => {
                    const value = item[field];
                    return value && value.toString().toLowerCase().includes(term);
                });
            }
            
            // Otherwise search all string properties
            return Object.values(item).some(value => {
                return value && value.toString().toLowerCase().includes(term);
            });
        });
    },
    
    /**
     * Calculate statistics from array
     */
    calculateStats(array, property) {
        if (!array || array.length === 0) {
            return { count: 0, sum: 0, average: 0, min: 0, max: 0 };
        }
        
        const values = array.map(item => parseFloat(item[property])).filter(val => !isNaN(val));
        
        if (values.length === 0) {
            return { count: 0, sum: 0, average: 0, min: 0, max: 0 };
        }
        
        const sum = values.reduce((a, b) => a + b, 0);
        const average = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        return {
            count: values.length,
            sum: Math.round(sum * 100) / 100,
            average: Math.round(average * 100) / 100,
            min: min,
            max: max
        };
    },
    
    // ============================================================================
    // SCORE AND STATUS UTILITIES
    // ============================================================================
    
    /**
     * Get score range info
     */
    getScoreRange(score) {
        return NAD_CONFIG.utils.getScoreRange(score);
    },
    
    /**
     * Get status badge class
     */
    getStatusBadgeClass(status) {
        const statusClasses = {
            'completed': 'status-completed',
            'activated': 'status-activated', 
            'pending': 'status-pending',
            'not_activated': 'status-not-activated',
            'not activated': 'status-not-activated'
        };
        
        return statusClasses[status.toLowerCase()] || 'status-pending';
    },
    
    /**
     * Get role badge class
     */
    getRoleBadgeClass(role) {
        const roleClasses = {
            'administrator': 'status-completed',
            'boss_control': 'status-activated',
            'lab_technician': 'status-pending',
            'shipping_manager': 'status-pending',
            'customer': 'status-pending'
        };
        
        return roleClasses[role] || 'status-pending';
    },
    
    // ============================================================================
    // EXPORT AND DOWNLOAD UTILITIES
    // ============================================================================
    
    /**
     * Export data as JSON
     */
    exportAsJSON(data, filename) {
        const exportData = {
            exported_at: new Date().toISOString(),
            source: 'NAD Test Cycle Admin Dashboard',
            data: data
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        this.downloadBlob(blob, filename || `nad_export_${Date.now()}.json`);
    },
    
    /**
     * Export data as CSV
     */
    exportAsCSV(data, filename, headers = null) {
        if (!data || data.length === 0) {
            console.warn('No data to export');
            return;
        }
        
        // Use provided headers or extract from first object
        const csvHeaders = headers || Object.keys(data[0]);
        
        // Create CSV content
        let csvContent = csvHeaders.join(',') + '\n';
        
        data.forEach(row => {
            const values = csvHeaders.map(header => {
                const value = row[header] || '';
                // Escape commas and quotes
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvContent += values.join(',') + '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadBlob(blob, filename || `nad_export_${Date.now()}.csv`);
    },
    
    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },
    
    // ============================================================================
    // LOCAL STORAGE UTILITIES
    // ============================================================================
    
    /**
     * Save to localStorage with error handling
     */
    saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
            return false;
        }
    },
    
    /**
     * Load from localStorage with error handling
     */
    loadFromStorage(key, defaultValue = null) {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
            return defaultValue;
        }
    },
    
    /**
     * Remove from localStorage
     */
    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
            return false;
        }
    },
    
    // ============================================================================
    // URL AND QUERY UTILITIES
    // ============================================================================
    
    /**
     * Get URL parameter
     */
    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },
    
    /**
     * Set URL parameter without page reload
     */
    setUrlParameter(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.replaceState({}, '', url);
    },
    
    /**
     * Remove URL parameter
     */
    removeUrlParameter(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        window.history.replaceState({}, '', url);
    },
    
    // ============================================================================
    // FORM UTILITIES
    // ============================================================================
    
    /**
     * Get form data as object
     */
    getFormData(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            // Handle multiple values for same key (checkboxes, etc.)
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    },
    
    /**
     * Validate form fields
     */
    validateForm(formElement, rules = {}) {
        const errors = {};
        const data = this.getFormData(formElement);
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            
            // Required field check
            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = `${field} is required`;
                continue;
            }
            
            // Skip other validations if field is empty and not required
            if (!value) continue;
            
            // Email validation
            if (rule.email && !this.isValidEmail(value)) {
                errors[field] = 'Please enter a valid email address';
            }
            
            // Number validation
            if (rule.number) {
                const num = parseFloat(value);
                if (isNaN(num)) {
                    errors[field] = 'Please enter a valid number';
                } else {
                    if (rule.min !== undefined && num < rule.min) {
                        errors[field] = `Value must be at least ${rule.min}`;
                    }
                    if (rule.max !== undefined && num > rule.max) {
                        errors[field] = `Value must not exceed ${rule.max}`;
                    }
                }
            }
            
            // Length validation
            if (rule.minLength && value.length < rule.minLength) {
                errors[field] = `Must be at least ${rule.minLength} characters`;
            }
            if (rule.maxLength && value.length > rule.maxLength) {
                errors[field] = `Must not exceed ${rule.maxLength} characters`;
            }
            
            // Custom validation function
            if (rule.custom && typeof rule.custom === 'function') {
                const customResult = rule.custom(value);
                if (customResult !== true) {
                    errors[field] = customResult || 'Invalid value';
                }
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors,
            data: data
        };
    },
    
    /**
     * Show form validation errors
     */
    showFormErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('.form-error').forEach(el => el.remove());
        document.querySelectorAll('.input-error').forEach(el => {
            el.classList.remove('input-error');
        });
        
        // Show new errors
        for (const [field, message] of Object.entries(errors)) {
            const input = document.querySelector(`[name="${field}"], #${field}`);
            if (input) {
                input.classList.add('input-error');
                
                // Create error message element
                const errorEl = document.createElement('div');
                errorEl.className = 'form-error';
                errorEl.textContent = message;
                errorEl.style.color = NAD_CONFIG.UI.COLORS.DANGER;
                errorEl.style.fontSize = '12px';
                errorEl.style.marginTop = '5px';
                
                // Insert after input
                input.parentNode.insertBefore(errorEl, input.nextSibling);
            }
        }
    },
    
    // ============================================================================
    // PERFORMANCE UTILITIES
    // ============================================================================
    
    /**
     * Debounce function
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Measure performance
     */
    measurePerformance(operation, startTime) {
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        console.log(`⏱️ ${operation} completed in ${duration}ms`);
        return duration;
    },
    
    // ============================================================================
    // BROWSER AND DEVICE UTILITIES
    // ============================================================================
    
    /**
     * Check if mobile device
     */
    isMobile() {
        return window.innerWidth <= 768;
    },
    
    /**
     * Check if tablet device
     */
    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    },
    
    /**
     * Check if desktop device
     */
    isDesktop() {
        return window.innerWidth > 1024;
    },
    
    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.warn('Clipboard API failed, using fallback');
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    },
    
    // ============================================================================
    // ERROR HANDLING UTILITIES
    // ============================================================================
    
    /**
     * Handle API errors consistently
     */
    handleApiError(error, context = '') {
        console.error(`❌ API Error ${context}:`, error);
        
        let message = NAD_CONFIG.ERROR_MESSAGES.API_ERROR;
        
        if (typeof error === 'string') {
            if (error.includes('401') || error.includes('403')) {
                message = NAD_CONFIG.ERROR_MESSAGES.PERMISSION_ERROR;
            } else if (error.includes('404')) {
                message = NAD_CONFIG.ERROR_MESSAGES.NOT_FOUND;
            } else if (error.includes('timeout') || error.includes('network')) {
                message = NAD_CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
            }
        }
        
        this.showAlert(message, 'error');
        return message;
    },
    
    /**
     * Handle validation errors
     */
    handleValidationError(errors) {
        if (typeof errors === 'object') {
            this.showFormErrors(errors);
        } else {
            this.showAlert(errors || NAD_CONFIG.ERROR_MESSAGES.VALIDATION_ERROR, 'error');
        }
    },
    
    // ============================================================================
    // ANALYTICS UTILITIES
    // ============================================================================
    
    /**
     * Generate analytics insights
     */
    generateInsights(data) {
        const insights = [];
        
        if (data.total_tests) {
            const activationRate = (data.activated_tests / data.total_tests) * 100;
            const completionRate = (data.completed_tests / data.total_tests) * 100;
            
            if (activationRate > 80) {
                insights.push({
                    type: 'success',
                    title: 'Excellent Activation Rate',
                    message: `${activationRate.toFixed(1)}% of tests are being activated`
                });
            } else if (activationRate < 50) {
                insights.push({
                    type: 'warning',
                    title: 'Low Activation Rate',
                    message: `Only ${activationRate.toFixed(1)}% of tests are activated. Consider improving the activation process.`
                });
            }
            
            if (completionRate > 70) {
                insights.push({
                    type: 'success',
                    title: 'High Completion Rate',
                    message: `${completionRate.toFixed(1)}% of tests are being completed`
                });
            } else if (completionRate < 30) {
                insights.push({
                    type: 'error',
                    title: 'Low Completion Rate',
                    message: `Only ${completionRate.toFixed(1)}% of tests are completed. Review the testing workflow.`
                });
            }
        }
        
        return insights;
    },
    
    // ============================================================================
    // INITIALIZATION AND CLEANUP
    // ============================================================================
    
    /**
     * Initialize utilities
     */
    init() {
        console.log('🔧 Initializing NAD utilities...');
        
        // Set up global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
        
        // Set up responsive event listeners
        window.addEventListener('resize', this.throttle(() => {
            // Trigger responsive updates
            document.dispatchEvent(new CustomEvent('screenSizeChanged', {
                detail: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    isMobile: this.isMobile(),
                    isTablet: this.isTablet(),
                    isDesktop: this.isDesktop()
                }
            }));
        }, 250));
        
        console.log('✅ NAD utilities initialized successfully');
    }
};

// Make utilities globally available
if (typeof window !== 'undefined') {
    window.NAD_UTILS = NAD_UTILS;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => NAD_UTILS.init());
    } else {
        NAD_UTILS.init();
    }
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NAD_UTILS;
}

console.log('✅ NAD Utility functions loaded successfully');
console.log('🛠️ Available utilities:', Object.keys(NAD_UTILS).filter(key => typeof NAD_UTILS[key] === 'function').length);
