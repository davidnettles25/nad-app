const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
// Note: Using pino.destination() instead of rotating file streams for stability

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
    },
    rotation: {
        enabled: false, // Start simple, can enable later
        maxSize: '100MB',
        maxFiles: 10,
        datePattern: 'YYYY-MM-DD'
    },
    retention: {
        days: 30, // Keep logs for 30 days
        maxTotalSize: '1GB' // Total size limit across all log files
    }
};

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
try {
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
} catch (error) {
    console.error('Warning: Could not create logs directory:', error.message);
    // Continue without file logging if directory creation fails
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

// File streams (basic file destinations - rotation can be added later)
const createFileStream = (filename) => {
    try {
        return pino.destination(path.join(logsDir, filename));
    } catch (error) {
        console.error(`Warning: Could not create log stream for ${filename}:`, error.message);
        return null;
    }
};

if (logConfig.files.enabled && fs.existsSync(logsDir)) {
    const logFiles = [
        { key: 'app', file: 'app.log', level: 'debug' },
        { key: 'api', file: 'api.log', level: 'debug' },
        { key: 'error', file: 'error.log', level: 'error' },
        { key: 'customer', file: 'customer.log', level: 'info' },
        { key: 'admin', file: 'admin.log', level: 'info' }
    ];

    logFiles.forEach(({ key, file, level }) => {
        if (logConfig.files[key]) {
            const stream = createFileStream(file);
            if (stream) {
                streams.push({ level, stream });
            }
        }
    });
}

// Ensure we have at least one stream (fallback to stdout if no streams created)
if (streams.length === 0) {
    console.warn('Warning: No log streams available, falling back to stdout');
    streams.push({
        level: logConfig.level,
        stream: process.stdout
    });
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
}, streams.length > 1 ? pino.multistream(streams) : streams[0].stream);

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
    
    // Schedule log cleanup if retention is configured
    if (logConfig.retention && logConfig.retention.days) {
        scheduleLogCleanup();
    }
    
    return logConfig;
}

// Log cleanup utility
function cleanupOldLogs() {
    const fs = require('fs');
    const path = require('path');
    
    try {
        if (!logConfig.retention || !logConfig.retention.days) {
            return; // No retention policy
        }
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - logConfig.retention.days);
        
        const logFiles = fs.readdirSync(logsDir)
            .filter(file => file.endsWith('.log'))
            .map(file => {
                const filePath = path.join(logsDir, file);
                const stats = fs.statSync(filePath);
                return { file, filePath, mtime: stats.mtime };
            })
            .filter(logFile => logFile.mtime < cutoffDate);
            
        if (logFiles.length > 0) {
            console.log(`Cleaning up ${logFiles.length} old log files older than ${logConfig.retention.days} days`);
            logFiles.forEach(logFile => {
                fs.unlinkSync(logFile.filePath);
                console.log(`Deleted old log file: ${logFile.file}`);
            });
        }
    } catch (error) {
        console.error('Error during log cleanup:', error.message);
    }
}

// Schedule periodic log cleanup (daily)
let cleanupInterval = null;
function scheduleLogCleanup() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
    }
    
    // Run cleanup daily at 2 AM (or immediately if in development)
    const interval = process.env.NODE_ENV === 'production' ? 24 * 60 * 60 * 1000 : 60000; // 24 hours or 1 minute
    cleanupInterval = setInterval(cleanupOldLogs, interval);
    
    // Run initial cleanup
    setTimeout(cleanupOldLogs, 5000); // After 5 seconds
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