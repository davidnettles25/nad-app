const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const rfs = require('pino-rotating-file-stream');

// Default log configuration - runtime configurable via admin interface
let logConfig = {
    level: process.env.LOG_LEVEL || 'info',
    console: process.env.NODE_ENV !== 'production',
    files: {
        enabled: true,
        app: true,
        api: true,
        error: true,
        customer: true,
        admin: true
    },
    debug: {
        enabled: process.env.NODE_ENV !== 'production',
        areas: ['analytics', 'supplements', 'batch-printing', 'exports']
    }
};

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create rotating file streams for different log types
const streams = [];

// Console stream (pretty in development)
if (logConfig.console) {
    streams.push({
        level: logConfig.level,
        stream: process.env.NODE_ENV === 'production' ? process.stdout : pino.destination(1)
    });
}

// File streams with rotation (daily + 10MB size limit)
const createFileStream = (filename) => {
    return rfs.createWriteStream(path.join(logsDir, filename), {
        size: '10M',
        interval: '1d',
        compress: 'gzip'
    });
};

if (logConfig.files.enabled) {
    if (logConfig.files.app) {
        streams.push({
            level: 'debug',
            stream: createFileStream('app.log')
        });
    }
    
    if (logConfig.files.api) {
        streams.push({
            level: 'debug', 
            stream: createFileStream('api.log')
        });
    }
    
    if (logConfig.files.error) {
        streams.push({
            level: 'error',
            stream: createFileStream('error.log')
        });
    }
    
    if (logConfig.files.customer) {
        streams.push({
            level: 'info',
            stream: createFileStream('customer.log')
        });
    }
    
    if (logConfig.files.admin) {
        streams.push({
            level: 'info',
            stream: createFileStream('admin.log')
        });
    }
}

// Create main logger instance
let logger = pino({
    level: logConfig.level,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        }
    },
    redact: {
        paths: ['password', 'token', 'secret', 'key'],
        censor: '[REDACTED]'
    }
}, pino.multistream(streams));

/**
 * Logger factory with context injection
 */
class Logger {
    constructor(context = {}) {
        this.context = context;
        this.requestId = context.requestId || null;
        this.customerId = context.customerId || null;
    }

    /**
     * Create child logger with additional context
     */
    child(additionalContext = {}) {
        return new Logger({
            ...this.context,
            ...additionalContext
        });
    }

    /**
     * Log with automatic context injection
     */
    _log(level, message, data = {}) {
        const logData = {
            ...this.context,
            ...data,
            timestamp: new Date().toISOString()
        };

        if (this.requestId) {
            logData.requestId = this.requestId;
        }

        if (this.customerId) {
            logData.customerId = this.customerId;
        }

        logger[level](logData, message);
    }

    /**
     * Logging methods
     */
    fatal(message, data) { this._log('fatal', message, data); }
    error(message, data) { this._log('error', message, data); }
    warn(message, data) { this._log('warn', message, data); }
    info(message, data) { this._log('info', message, data); }
    debug(message, data) { this._log('debug', message, data); }
    trace(message, data) { this._log('trace', message, data); }

    /**
     * Specialized logging methods
     */
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

    db(query, duration, data = {}) {
        this._log('debug', 'Database query executed', {
            type: 'database',
            query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
            duration: duration ? `${duration}ms` : undefined,
            ...data
        });
    }

    /**
     * Debug logging with area filtering
     */
    debugArea(area, message, data = {}) {
        if (logConfig.debug.enabled && logConfig.debug.areas.includes(area)) {
            this._log('debug', `[${area.toUpperCase()}] ${message}`, {
                debugArea: area,
                ...data
            });
        }
    }
}

/**
 * Create logger instance with context
 */
function createLogger(context = {}) {
    return new Logger(context);
}

/**
 * Generate request ID
 */
function generateRequestId() {
    return uuidv4();
}

/**
 * Update log configuration at runtime
 */
function updateLogConfig(newConfig) {
    logConfig = { ...logConfig, ...newConfig };
    
    // Note: In production, you might want to recreate the logger instance
    // with new configuration, but for now we'll update the level
    logger.level = logConfig.level;
    
    return logConfig;
}

/**
 * Get current log configuration
 */
function getLogConfig() {
    return { ...logConfig };
}

/**
 * Express middleware for request logging
 */
function requestLoggingMiddleware(req, res, next) {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    // Add request ID to request object
    req.requestId = requestId;
    
    // Create logger for this request
    req.logger = createLogger({ 
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Log request start
    req.logger.api(req.method, req.path, 'START', null, {
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
    });

    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;
        req.logger.api(req.method, req.path, res.statusCode, duration);
        return originalJson.call(this, data);
    };

    // Set response header with request ID
    res.setHeader('X-Request-ID', requestId);
    
    next();
}

module.exports = {
    createLogger,
    generateRequestId,
    requestLoggingMiddleware,
    updateLogConfig,
    getLogConfig,
    Logger
};