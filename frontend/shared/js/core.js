/**
 * NAD Test Cycle - Core JavaScript Utilities
 * File: shared/js/core.js
 * Purpose: Essential utilities and helper functions
 */

'use strict';

// NAD Namespace
window.NAD = window.NAD || {};

// Configuration
NAD.config = {
    apiBase: 'https://mynadtest.info',
    environment: 'production',
    version: '1.0.0',
    debug: window.location.hostname === 'localhost'
};

// Core utilities
NAD.utils = {
    // Generate unique ID
    generateId(prefix = 'nad') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Format date
    formatDate(date, format = 'short') {
        if (!date) return 'N/A';
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';
        
        const options = {
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            long: { year: 'numeric', month: 'long', day: 'numeric' }
        };
        
        return d.toLocaleDateString('en-US', options[format] || options.short);
    },
    
    // Validate email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validate test ID
    isValidTestId(testId) {
        const testIdRegex = /^\d{4}-\d{2}-\d{2}-\d{5}$/;
        return testIdRegex.test(testId);
    }
};

// DOM utilities
NAD.dom = {
    $(selector, context = document) {
        return context.querySelector(selector);
    },
    
    $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    },
    
    addClass(element, className) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) el.classList.add(className);
    },
    
    removeClass(element, className) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) el.classList.remove(className);
    }
};

// Event system
NAD.events = {
    _listeners: {},
    
    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
    },
    
    emit(event, ...args) {
        if (!this._listeners[event]) return;
        this._listeners[event].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                // Error in event listener
            }
        });
    }
};

// Environment-based logger
NAD.logger = (() => {
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('dev') ||
                         window.location.search.includes('debug=true');
    
    return {
        debug(...args) {
            if (isDevelopment) console.log('[NAD DEBUG]', ...args);
        },
        info(...args) {
            if (isDevelopment) console.info('[NAD INFO]', ...args);
        },
        warn(...args) {
            if (isDevelopment) console.warn('[NAD WARN]', ...args);
        },
        error(...args) {
            // Always show errors, even in production
            console.error('[NAD ERROR]', ...args);
        }
    };
})();

// Initialize
// NAD Core utilities loaded
