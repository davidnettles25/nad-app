// Fallback logger that works without Pino dependencies
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Simple fallback configuration
let logConfig = {
    level: process.env.LOG_LEVEL || 'info',
    console: process.env.NODE_ENV !== 'production',
    files: {
        enabled: false, // Disabled until Pino is properly installed
        app: false,
        api: false,
        error: false,
        customer: false,
        admin: false
    },
    debug: {
        enabled: process.env.NODE_ENV !== 'production',
        areas: ['analytics', 'supplements', 'batch-printing', 'exports']
    }
};

/**
 * Simple logger class for fallback
 */
class FallbackLogger {
    constructor(context = {}) {
        this.context = context;
    }

    child(additionalContext = {}) {
        return new FallbackLogger({
            ...this.context,
            ...additionalContext
        });
    }

    _log(level, message, data = {}) {
        if (logConfig.console) {
            const timestamp = new Date().toISOString();
            const logData = { ...this.context, ...data, timestamp };
            console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, logData);
        }
    }

    fatal(message, data) { this._log('fatal', message, data); }
    error(message, data) { this._log('error', message, data); }
    warn(message, data) { this._log('warn', message, data); }
    info(message, data) { this._log('info', message, data); }
    debug(message, data) { this._log('debug', message, data); }
    trace(message, data) { this._log('trace', message, data); }

    api(method, path, statusCode, duration = null, data = {}) {
        this._log('info', `${method} ${path} ${statusCode}`, {
            type: 'api',
            method,
            path,
            statusCode,
            duration: duration ? `${duration}ms` : undefined,
            ...data
        });
    }

    customer(action, customerId, testId = null, data = {}) {
        this._log('info', `Customer ${action}`, {
            type: 'customer',
            action,
            customerId,
            testId,
            ...data
        });
    }

    admin(action, adminId, data = {}) {
        this._log('info', `Admin ${action}`, {
            type: 'admin',
            action,
            adminId,
            ...data
        });
    }

    debugArea(area, message, data = {}) {
        if (logConfig.debug.enabled && logConfig.debug.areas.includes(area)) {
            this._log('debug', `[${area.toUpperCase()}] ${message}`, {
                debugArea: area,
                ...data
            });
        }
    }
}

function createLogger(context = {}) {
    return new FallbackLogger(context);
}

function generateRequestId() {
    return uuidv4();
}

function updateLogConfig(newConfig) {
    logConfig = { ...logConfig, ...newConfig };
    return logConfig;
}

function getLogConfig() {
    return { ...logConfig };
}

// Simple request logging middleware
function requestLoggingMiddleware(req, res, next) {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    req.requestId = requestId;
    req.logger = createLogger({ 
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    req.logger.api(req.method, req.path, 'START');

    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;
        req.logger.api(req.method, req.path, res.statusCode, duration);
        return originalJson.call(this, data);
    };

    res.setHeader('X-Request-ID', requestId);
    next();
}

module.exports = {
    createLogger,
    generateRequestId,
    requestLoggingMiddleware,
    updateLogConfig,
    getLogConfig,
    Logger: FallbackLogger
};