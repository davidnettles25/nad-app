// users final
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// Initialize logger
let logger;
let createLogger;
let requestLoggingMiddleware;
let updateLogConfig;
let getLogConfig;

try {
    logger = require('./logger');
    ({ createLogger, requestLoggingMiddleware, updateLogConfig, getLogConfig } = logger);
    // Use a temporary logger for startup until request logger is available
    const startupLogger = createLogger({ module: 'startup' });
    startupLogger.info('Pino logger loaded successfully');
} catch (error) {
    logger = require('./logger-fallback');
    ({ createLogger, requestLoggingMiddleware, updateLogConfig, getLogConfig } = logger);
    const startupLogger = createLogger({ module: 'startup' });
    startupLogger.warn('Pino logger failed to load, using fallback', { error: error.message });
}

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

app.use(cors({
    origin: [
        'https://mynadtest.com',
        'https://mynadtest.info',
        'https://mynadtest.dev',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Note: In production, uploads are served directly by the web server from htdocs/nad-app/uploads
// This static middleware is only used in development
if (process.env.NODE_ENV !== 'production') {
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Create application logger
const appLogger = createLogger({ module: 'app' });

// Enhanced request logging middleware with performance monitoring
app.use((req, res, next) => {
    const startTime = Date.now();
    const requestId = req.requestId || Date.now().toString();
    
    // Create request-specific logger
    req.logger = createLogger({ 
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        path: req.path
    });

    // Log request start
    req.logger.api(req.method, req.path, 'START', null, {
        query: req.query,
        bodySize: req.get('Content-Length') || 0,
        referer: req.get('Referer'),
        host: req.get('Host')
    });

    // Override res.json to capture response details
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;
        const responseSize = JSON.stringify(data).length;
        
        // Log response details
        req.logger.api(req.method, req.path, res.statusCode, duration, {
            responseSize,
            success: data?.success !== false,
            errorType: data?.error ? 'application_error' : null
        });

        // Performance monitoring - flag slow requests
        if (duration > 1000) {
            req.logger.warn('Slow request detected', {
                endpoint: `${req.method} ${req.path}`,
                duration: `${duration}ms`,
                threshold: '1000ms'
            });
        }

        // Set response headers
        res.setHeader('X-Request-ID', requestId);
        res.setHeader('X-Response-Time', `${duration}ms`);
        
        return originalJson.call(this, data);
    };

    // Handle response end for non-JSON responses
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // Only log if we haven't already logged via json override
        if (!res.headersSent || !res.getHeader('X-Response-Time')) {
            req.logger.api(req.method, req.path, res.statusCode, duration, {
                responseType: 'non-json',
                contentType: res.getHeader('Content-Type')
            });
        }
    });

    next();
});

// Request logging middleware (now enhanced above)
// app.use(requestLoggingMiddleware);

// ============================================================================
// BACKDOOR AUTHENTICATION MIDDLEWARE
// ============================================================================

function createBackdoorSession(urlPath) {
    // Determine role based on URL path
    let userRole = 'customer'; // default
    let context = 'portal';
    
    if (urlPath.startsWith('/admin')) {
        userRole = 'admin';
        context = 'admin';
    } else if (urlPath.startsWith('/lab')) {
        userRole = 'technician';
        context = 'lab';
    } else if (urlPath.startsWith('/portal') || urlPath.startsWith('/customer')) {
        userRole = 'customer';
        context = 'portal';
    }
    
    // Create session structure matching multipass format
    return {
        token: 'backdoor-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        role: userRole,
        customer_id: 'john.doe@example.com',
        user: {
            email: 'john.doe@example.com',
            first_name: 'John',
            last_name: 'Doe',
            id: 'john.doe@example.com'
        },
        authenticated: true,
        context: context,
        backdoor: true,
        timestamp: new Date().toISOString()
    };
}

function backdoorAuthMiddleware(req, res, next) {
    const bypassParam = req.query.bypass;
    const multipassOverride = process.env.MULTIPASS_OVERRIDE;
    
    // If no bypass parameter, continue normally
    if (!bypassParam) {
        return next();
    }
    
    // Get client info for logging
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    const userAgent = req.get('User-Agent') || 'Unknown';
    const endpoint = `${req.method} ${req.path}`;
    const timestamp = new Date().toISOString();
    
    // Check if bypass parameter matches the secret
    if (bypassParam === multipassOverride && multipassOverride) {
        // Valid backdoor attempt
        const session = createBackdoorSession(req.path);
        
        // Set headers to mimic multipass authentication
        req.headers['x-shopify-token'] = session.token;
        req.headers['x-shopify-role'] = session.role;
        req.headers['x-shopify-customer-id'] = session.customer_id;
        
        // Add session data to request
        req.shopifyAuth = session;
        req.backdoorAuth = true;
        
        // Log successful backdoor access
        req.logger.admin('backdoor_access_granted', 'system', {
            clientIP,
            userAgent,
            endpoint,
            context: session.context,
            role: session.role,
            timestamp,
            success: true
        });
        
        return next();
    } else {
        // Invalid backdoor attempt
        req.logger.warn('backdoor_access_denied', {
            clientIP,
            userAgent,
            endpoint,
            attemptedBypass: bypassParam ? '[REDACTED]' : 'empty',
            hasOverrideConfigured: !!multipassOverride,
            timestamp,
            success: false
        });
        
        // Redirect to mynadtest.com with permanent redirect (301) and prevent caching
        console.log(`🚫 Invalid bypass key attempt from ${clientIP}, redirecting to mynadtest.com`);
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        return res.status(301).redirect('http://mynadtest.com');
    }
}

// Apply backdoor middleware before all authentication
app.use(backdoorAuthMiddleware);

// Bypass validation endpoint for client-side check
app.get('/api/admin/validate-bypass', (req, res) => {
    const bypassParam = req.query.bypass;
    const multipassOverride = process.env.MULTIPASS_OVERRIDE;
    
    if (bypassParam === multipassOverride && multipassOverride) {
        // Valid bypass
        res.json({ valid: true });
    } else {
        // Invalid bypass - return error
        res.status(401).json({ valid: false, error: 'Invalid bypass key' });
    }
});

// Serve protected HTML files through Node.js to ensure bypass middleware runs
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.get('/customer-portal.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/customer-portal.html'));
});

// Also handle root paths
app.get('/admin', (req, res) => {
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect('/admin.html' + queryString);
});

app.get('/customer', (req, res) => {
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect('/customer-portal.html' + queryString);
});

// Note: Static files are served by web server (nginx/Apache), not Node.js

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'mynadtes_mynadtest_nad_user',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'mynadtes_mynadtest_nad_cycle',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: 'utf8mb4'
};

let db;

async function initializeDatabase() {
    try {
        db = await mysql.createPool(dbConfig);
        appLogger.info('Database connected successfully');
        const [rows] = await db.execute('SELECT 1 as test');
        appLogger.info('Database test query successful');
        
        // Run schema cleanup migration if needed
        await cleanupTestScoresSchema();
        
        // Run status migration to ensure data integrity
        await migrateTestStatusValues();
        
        // Run Phase 4 cleanup to remove is_activated column
        await cleanupIsActivatedColumn();
        
        // Run order_id cleanup to remove order_id column
        await cleanupOrderIdColumn();
        
        // Run customer_id migration to VARCHAR - DISABLED to fix startup issues
        // await migrateCustomerIdToVarchar();
        console.log('🚀 SERVER STARTED WITH MIGRATION DISABLED - VERSION 2025-07-23-14:30');
        
        return true;
    } catch (error) {
        appLogger.error('Database connection failed', { 
            error: error.message, 
            stack: error.stack,
            module: 'database'
        });
        return false;
    }
}

async function cleanupTestScoresSchema() {
    try {
        console.log('🔧 Checking nad_test_scores schema...');
        
        // Check if redundant columns still exist
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'nad_test_scores' 
            AND COLUMN_NAME IN ('status', 'is_activated', 'customer_id', 'activated_by', 'activated_date')
        `);
        
        if (columns.length > 0) {
            console.log('🔧 Found redundant columns in nad_test_scores, cleaning up...');
            console.log('Columns to remove:', columns.map(c => c.COLUMN_NAME));
            
            // Remove redundant columns one by one (safer than all at once)
            const columnsToRemove = ['status', 'is_activated', 'customer_id', 'activated_by', 'activated_date', 'label_received_date'];
            
            for (const column of columnsToRemove) {
                try {
                    await db.execute(`ALTER TABLE nad_test_scores DROP COLUMN IF EXISTS \`${column}\``);
                    console.log(`✅ Removed column: ${column}`);
                } catch (dropError) {
                    console.log(`ℹ️  Column ${column} already removed or doesn't exist`);
                }
            }
            
            console.log('✅ nad_test_scores schema cleanup complete');
        } else {
            console.log('✅ nad_test_scores schema already clean');
        }
    } catch (error) {
        console.warn('⚠️  Schema cleanup error (non-critical):', error.message);
    }
}

// Phase 1 - Migration helper to ensure all tests have proper status values
async function migrateTestStatusValues() {
    try {
        console.log('🔄 Starting status migration check...');
        
        // Check if is_activated column still exists
        const [isActivatedExists] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'nad_test_ids' 
            AND COLUMN_NAME = 'is_activated'
        `);
        
        const hasIsActivated = isActivatedExists.length > 0;
        console.log('📊 is_activated column exists:', hasIsActivated);
        
        // First, get current state statistics (without referencing is_activated if it doesn't exist)
        let beforeStatsQuery = `
            SELECT 
                COUNT(*) as total_tests,
                COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'activated' THEN 1 END) as activated,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
            FROM nad_test_ids
        `;
        
        if (hasIsActivated) {
            beforeStatsQuery = `
                SELECT 
                    COUNT(*) as total_tests,
                    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'activated' THEN 1 END) as activated,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN is_activated = 1 AND status != 'activated' AND status != 'completed' THEN 1 END) as mismatched
                FROM nad_test_ids
            `;
        }
        
        const [beforeStats] = await db.execute(beforeStatsQuery);
        console.log('📊 Before migration:', beforeStats[0]);
        
        // Step 1: Set status for NULL values (only if is_activated column exists)
        if (hasIsActivated) {
            const [nullUpdate] = await db.execute(`
                UPDATE nad_test_ids 
                SET status = CASE 
                    WHEN is_activated = 1 THEN 'activated'
                    ELSE 'pending'
                END
                WHERE status IS NULL
            `);
            console.log(`✅ Updated ${nullUpdate.affectedRows} NULL status values based on is_activated`);
        } else {
            // If is_activated doesn't exist, set NULL statuses to pending by default
            const [nullUpdate] = await db.execute(`
                UPDATE nad_test_ids 
                SET status = 'pending'
                WHERE status IS NULL
            `);
            console.log(`✅ Updated ${nullUpdate.affectedRows} NULL status values to pending (default)`);
        }
        
        // Step 2: Fix completed tests (those with scores)
        const [completedUpdate] = await db.execute(`
            UPDATE nad_test_ids ti
            INNER JOIN nad_test_scores ts ON ti.test_id = ts.test_id
            SET ti.status = 'completed'
            WHERE ts.score IS NOT NULL 
            AND ti.status != 'completed'
        `);
        console.log(`✅ Updated ${completedUpdate.affectedRows} tests to completed status`);
        
        // Step 3: Fix activated tests (only if is_activated column exists)
        if (hasIsActivated) {
            const [activatedUpdate] = await db.execute(`
                UPDATE nad_test_ids ti
                LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
                SET ti.status = 'activated'
                WHERE ti.is_activated = 1 
                AND ts.score IS NULL
                AND ti.status != 'activated'
            `);
            console.log(`✅ Updated ${activatedUpdate.affectedRows} tests to activated status`);
        }
        
        // Step 4: Fix pending tests (only if is_activated column exists)
        if (hasIsActivated) {
            const [pendingUpdate] = await db.execute(`
                UPDATE nad_test_ids 
                SET status = 'pending'
                WHERE is_activated = 0 
                AND status != 'pending'
            `);
            console.log(`✅ Updated ${pendingUpdate.affectedRows} tests to pending status`);
        }
        
        // Get final statistics (conditional based on is_activated column existence)
        let afterStatsQuery = `
            SELECT 
                COUNT(*) as total_tests,
                COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'activated' THEN 1 END) as activated,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
            FROM nad_test_ids
        `;
        
        if (hasIsActivated) {
            afterStatsQuery = `
                SELECT 
                    COUNT(*) as total_tests,
                    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'activated' THEN 1 END) as activated,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN 
                        (is_activated = 0 AND status != 'pending') OR
                        (is_activated = 1 AND status = 'pending')
                    THEN 1 END) as still_mismatched
                FROM nad_test_ids
            `;
        }
        
        const [afterStats] = await db.execute(afterStatsQuery);
        console.log('📊 After migration:', afterStats[0]);
        
        if (hasIsActivated && afterStats[0].still_mismatched && afterStats[0].still_mismatched > 0) {
            console.warn('⚠️  Some tests still have mismatched status values');
        }
        
        return {
            success: true,
            before: beforeStats[0],
            after: afterStats[0]
        };
        
    } catch (error) {
        console.error('❌ Status migration error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Phase 4 - Database schema cleanup (remove is_activated column)
async function cleanupIsActivatedColumn() {
    try {
        console.log('🔄 Phase 4: Checking if is_activated column cleanup is needed...');
        
        // Check if is_activated column still exists
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'nad_test_ids' 
            AND COLUMN_NAME = 'is_activated'
        `);
        
        if (columns.length === 0) {
            console.log('✅ is_activated column already removed, skipping cleanup');
            return { success: true, action: 'already_removed' };
        }
        
        // Verify all tests have valid status before cleanup
        const [statusCheck] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
                COUNT(CASE WHEN status NOT IN ('pending', 'activated', 'completed') THEN 1 END) as invalid_status
            FROM nad_test_ids
        `);
        
        console.log('📊 Pre-cleanup validation:', statusCheck[0]);
        
        if (statusCheck[0].null_status > 0 || statusCheck[0].invalid_status > 0) {
            console.warn('⚠️  Found tests with NULL or invalid status, skipping cleanup');
            return { 
                success: false, 
                error: 'Data validation failed - some tests have invalid status values',
                details: statusCheck[0]
            };
        }
        
        // Get current distribution for logging
        const [distribution] = await db.execute(`
            SELECT status, COUNT(*) as count
            FROM nad_test_ids 
            GROUP BY status
            ORDER BY count DESC
        `);
        console.log('📊 Status distribution before cleanup:', distribution);
        
        // Remove the is_activated column
        console.log('🗑️  Removing is_activated column from nad_test_ids...');
        await db.execute(`ALTER TABLE nad_test_ids DROP COLUMN is_activated`);
        
        // Add index on status column for better performance
        console.log('🔧 Adding index on status column for better query performance...');
        try {
            await db.execute(`ALTER TABLE nad_test_ids ADD INDEX idx_status (status)`);
            console.log('✅ Status index added successfully');
        } catch (indexError) {
            // Index might already exist, check for specific error
            if (indexError.message.includes('Duplicate key name')) {
                console.log('✅ Status index already exists');
            } else {
                console.warn('⚠️  Could not add status index:', indexError.message);
            }
        }
        
        // Verify removal
        const [afterColumns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'nad_test_ids' 
            AND COLUMN_NAME = 'is_activated'
        `);
        
        if (afterColumns.length === 0) {
            console.log('✅ Phase 4 complete: is_activated column successfully removed');
            return { 
                success: true, 
                action: 'removed',
                distribution: distribution
            };
        } else {
            throw new Error('Column removal verification failed');
        }
        
    } catch (error) {
        console.error('❌ Phase 4 cleanup error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================================================
// ORDER ID CLEANUP FUNCTION (Phase 4: Order ID Removal Migration)
// ============================================================================

async function cleanupOrderIdColumn() {
    try {
        console.log('🧹 Starting order_id column removal cleanup...');
        
        // Step 1: Verify all data integrity before cleanup
        console.log('✅ Validating data integrity before order_id removal...');
        
        // Check if order_id column exists
        const [orderIdColumn] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'nad_test_ids' 
            AND COLUMN_NAME = 'order_id'
        `);
        
        if (orderIdColumn.length === 0) {
            console.log('ℹ️  order_id column already removed from nad_test_ids');
            return { 
                success: true, 
                action: 'already_removed',
                message: 'order_id column does not exist in nad_test_ids'
            };
        }
        
        console.log('🔍 Found order_id column, proceeding with removal...');
        
        // Get current test count for validation
        const [testCount] = await db.execute(`SELECT COUNT(*) as total FROM nad_test_ids`);
        const totalTests = testCount[0].total;
        console.log(`📊 Total tests before cleanup: ${totalTests}`);
        
        // Check order_id usage distribution
        const [orderIdStats] = await db.execute(`
            SELECT 
                COUNT(CASE WHEN order_id IS NULL THEN 1 END) as null_order_id,
                COUNT(CASE WHEN order_id IS NOT NULL THEN 1 END) as has_order_id,
                COUNT(*) as total
            FROM nad_test_ids
        `);
        console.log('📊 Order ID distribution:', orderIdStats[0]);
        
        // Step 2: Remove order_id index first (if exists)
        console.log('🔧 Removing idx_order_id index...');
        try {
            await db.execute(`ALTER TABLE nad_test_ids DROP INDEX idx_order_id`);
            console.log('✅ Removed idx_order_id index');
        } catch (error) {
            if (error.message.includes("check that column/key exists")) {
                console.log('ℹ️  idx_order_id index does not exist, skipping...');
            } else {
                throw error;
            }
        }
        
        // Step 3: Remove order_id column from nad_test_ids
        console.log('🗑️  Removing order_id column from nad_test_ids...');
        await db.execute(`ALTER TABLE nad_test_ids DROP COLUMN order_id`);
        console.log('✅ Successfully removed order_id column from nad_test_ids');
        
        // Step 4: Verify removal
        const [afterColumns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'nad_test_ids' 
            AND COLUMN_NAME = 'order_id'
        `);
        
        // Step 5: Verify data integrity after cleanup
        const [afterTestCount] = await db.execute(`SELECT COUNT(*) as total FROM nad_test_ids`);
        const afterTotal = afterTestCount[0].total;
        
        if (afterTotal !== totalTests) {
            throw new Error(`Data loss detected: ${totalTests} tests before, ${afterTotal} tests after`);
        }
        
        console.log(`✅ Data integrity verified: ${afterTotal} tests preserved`);
        
        // Step 6: Check nad_test_scores table for order_id
        console.log('🔍 Checking nad_test_scores table for order_id column...');
        const [scoresOrderIdColumn] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'nad_test_scores' 
            AND COLUMN_NAME = 'order_id'
        `);
        
        let scoresAction = 'not_found';
        if (scoresOrderIdColumn.length > 0) {
            console.log('⚠️  Found order_id column in nad_test_scores table');
            console.log('ℹ️  Keeping nad_test_scores.order_id for now (can be removed separately if needed)');
            scoresAction = 'kept';
        } else {
            console.log('ℹ️  nad_test_scores.order_id column does not exist');
        }
        
        if (afterColumns.length === 0) {
            console.log('✅ Order ID cleanup complete: order_id column successfully removed from nad_test_ids');
            return { 
                success: true, 
                action: 'removed',
                nad_test_ids: 'removed',
                nad_test_scores: scoresAction,
                tests_preserved: afterTotal,
                message: 'order_id column successfully removed from nad_test_ids'
            };
        } else {
            throw new Error('Column removal verification failed');
        }
        
    } catch (error) {
        console.error('❌ Order ID cleanup error:', error);
        return {
            success: false,
            error: error.message,
            action: 'failed'
        };
    }
}

// ============================================================================
// CUSTOMER ID MIGRATION FUNCTIONS
// ============================================================================

async function migrateCustomerIdToVarchar() {
    try {
        console.log('🔧 Checking customer_id migration status...');
        
        // First, clean up any existing backup tables that might be causing issues
        console.log('🧹 Cleaning up any existing backup tables...');
        await cleanupCustomerIdBackupTables();
        
        // Check if migration has already been completed
        const [columnCheck] = await db.execute(`
            SELECT TABLE_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'nad_test_ids'
            AND COLUMN_NAME = 'customer_id'
        `);
        
        if (columnCheck.length > 0 && columnCheck[0].DATA_TYPE === 'varchar' && columnCheck[0].CHARACTER_MAXIMUM_LENGTH === 255) {
            console.log('✅ Customer ID migration already completed - customer_id is already VARCHAR(255)');
            return { success: true, status: 'already_completed' };
        }
        
        console.log('🔧 Starting customer_id migration from BIGINT to VARCHAR...');
        
        // Step 1: Create backup tables
        console.log('🔧 Phase 3.1: Creating backup tables...');
        await createCustomerIdBackupTables();
        
        // Step 2: Update schema for all tables
        console.log('🔧 Phase 3.2: Updating database schema...');
        await updateCustomerIdSchemas();
        
        // Step 3: Recreate indexes
        console.log('🔧 Phase 3.3: Recreating indexes for VARCHAR performance...');
        await recreateCustomerIdIndexes();
        
        console.log('✅ Customer ID migration to VARCHAR completed successfully!');
        return { success: true, status: 'completed' };
        
    } catch (error) {
        console.error('❌ Customer ID migration error:', error);
        console.log('🚨 Consider running rollback procedures if needed');
        return {
            success: false,
            error: error.message,
            action: 'failed'
        };
    }
}

async function cleanupCustomerIdBackupTables() {
    try {
        const tables = ['nad_test_ids', 'nad_test_scores', 'nad_user_roles', 'nad_user_supplements'];
        
        for (const table of tables) {
            const backupTableName = `${table}_backup_customer_varchar`;
            
            try {
                await db.execute(`DROP TABLE IF EXISTS ${backupTableName}`);
                console.log(`🗑️  Dropped backup table: ${backupTableName}`);
            } catch (dropError) {
                console.log(`ℹ️  Backup table ${backupTableName} didn't exist or couldn't be dropped:`, dropError.message);
            }
        }
        
        console.log('✅ Backup table cleanup completed');
    } catch (error) {
        console.log('⚠️  Error during backup table cleanup:', error.message);
        // Don't throw here - this is just cleanup
    }
}

async function createCustomerIdBackupTables() {
    try {
        const tables = ['nad_test_ids', 'nad_test_scores', 'nad_user_roles', 'nad_user_supplements'];
        
        for (const table of tables) {
            // Check if backup table already exists
            const [existing] = await db.execute(`
                SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = '${table}_backup_customer_varchar'
            `);
            
            if (existing[0].count > 0) {
                console.log(`ℹ️  Backup table ${table}_backup_customer_varchar already exists`);
                continue;
            }
            
            // Create backup table
            console.log(`🔧 Creating backup for ${table}...`);
            await db.execute(`
                CREATE TABLE ${table}_backup_customer_varchar AS 
                SELECT * FROM ${table}
            `);
            
            // Verify backup
            const [originalCount] = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
            const [backupCount] = await db.execute(`SELECT COUNT(*) as count FROM ${table}_backup_customer_varchar`);
            
            if (originalCount[0].count !== backupCount[0].count) {
                throw new Error(`Backup verification failed for ${table}: original=${originalCount[0].count}, backup=${backupCount[0].count}`);
            }
            
            console.log(`✅ ${table} backup created successfully (${originalCount[0].count} records)`);
        }
        
        console.log('✅ All backup tables created successfully');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Backup creation failed:', error);
        throw error;
    }
}

async function updateCustomerIdSchemas() {
    try {
        const tableUpdates = [
            {
                table: 'nad_test_ids',
                nullable: true,
                constraint: 'DEFAULT NULL'
            },
            {
                table: 'nad_test_scores', 
                nullable: false,
                constraint: 'NOT NULL'
            },
            {
                table: 'nad_user_roles',
                nullable: false, 
                constraint: 'NOT NULL'
            },
            {
                table: 'nad_user_supplements',
                nullable: false,
                constraint: 'NOT NULL'
            }
        ];
        
        for (const update of tableUpdates) {
            console.log(`🔧 Updating ${update.table}.customer_id to VARCHAR(255)...`);
            
            // Check current column type
            const [columnInfo] = await db.execute(`
                SELECT DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = '${update.table}' 
                AND COLUMN_NAME = 'customer_id'
            `);
            
            if (columnInfo.length === 0) {
                console.log(`ℹ️  ${update.table}.customer_id column does not exist, skipping...`);
                continue;
            }
            
            if (columnInfo[0].DATA_TYPE === 'varchar') {
                console.log(`ℹ️  ${update.table}.customer_id is already VARCHAR, skipping...`);
                continue;
            }
            
            // Perform the schema update
            await db.execute(`
                ALTER TABLE ${update.table} 
                MODIFY COLUMN customer_id VARCHAR(255) ${update.constraint}
            `);
            
            // Verify the change
            const [updatedColumnInfo] = await db.execute(`
                SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = '${update.table}' 
                AND COLUMN_NAME = 'customer_id'
            `);
            
            if (updatedColumnInfo[0].DATA_TYPE !== 'varchar' || updatedColumnInfo[0].CHARACTER_MAXIMUM_LENGTH !== 255) {
                throw new Error(`Schema update verification failed for ${update.table}.customer_id`);
            }
            
            console.log(`✅ ${update.table}.customer_id updated to VARCHAR(255) successfully`);
        }
        
        console.log('✅ All customer_id columns updated to VARCHAR(255)');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Schema update failed:', error);
        throw error;
    }
}

async function recreateCustomerIdIndexes() {
    try {
        const indexUpdates = [
            {
                table: 'nad_test_ids',
                indexName: 'idx_customer_id',
                unique: false
            },
            {
                table: 'nad_test_scores',
                indexName: 'idx_customer_id', 
                unique: false
            },
            {
                table: 'nad_user_roles',
                indexName: 'customer_id',
                unique: true
            },
            {
                table: 'nad_user_supplements',
                indexName: 'idx_customer_id',
                unique: false
            }
        ];
        
        for (const update of indexUpdates) {
            console.log(`🔧 Recreating ${update.indexName} index on ${update.table}...`);
            
            // Check if customer_id column exists in this table
            const [columnExists] = await db.execute(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = '${update.table}' 
                AND COLUMN_NAME = 'customer_id'
            `);
            
            if (columnExists.length === 0) {
                console.log(`ℹ️  ${update.table}.customer_id column does not exist, skipping index creation...`);
                continue;
            }
            
            // Drop existing index if it exists
            try {
                await db.execute(`ALTER TABLE ${update.table} DROP INDEX ${update.indexName}`);
                console.log(`🗑️  Dropped existing ${update.indexName} index`);
            } catch (dropError) {
                console.log(`ℹ️  Index ${update.indexName} does not exist or already dropped`);
            }
            
            // Create new index optimized for VARCHAR
            const indexType = update.unique ? 'UNIQUE KEY' : 'KEY';
            await db.execute(`
                ALTER TABLE ${update.table} 
                ADD ${indexType} ${update.indexName} (customer_id)
            `);
            
            console.log(`✅ ${update.indexName} index recreated for VARCHAR on ${update.table}`);
        }
        
        console.log('✅ All customer_id indexes recreated for VARCHAR performance');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Index recreation failed:', error);
        throw error;
    }
}

async function validateCustomerIdMigration() {
    try {
        console.log('🔍 Validating customer_id migration...');
        
        // Step 1: Verify column types (excluding backup tables)
        const [columnTypes] = await db.execute(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND COLUMN_NAME = 'customer_id'
            AND TABLE_NAME NOT LIKE '%_backup_%'
            ORDER BY TABLE_NAME
        `);
        
        console.log('🔍 Column types after migration (excluding backup tables):');
        for (const col of columnTypes) {
            console.log(`  ${col.TABLE_NAME}.customer_id: ${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
            
            if (col.DATA_TYPE !== 'varchar' || col.CHARACTER_MAXIMUM_LENGTH !== 255) {
                throw new Error(`Invalid column type for ${col.TABLE_NAME}.customer_id: expected varchar(255), got ${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})`);
            }
        }
        
        // Step 2: Verify record counts match backups
        const tables = ['nad_test_ids', 'nad_test_scores', 'nad_user_roles', 'nad_user_supplements'];
        const recordCounts = {};
        
        for (const table of tables) {
            const [originalCount] = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
            const [backupCount] = await db.execute(`SELECT COUNT(*) as count FROM ${table}_backup_customer_varchar`);
            
            recordCounts[table] = {
                original: originalCount[0].count,
                backup: backupCount[0].count,
                match: originalCount[0].count === backupCount[0].count
            };
            
            if (!recordCounts[table].match) {
                throw new Error(`Record count mismatch for ${table}: original=${originalCount[0].count}, backup=${backupCount[0].count}`);
            }
        }
        
        console.log('✅ Record counts verified against backups');
        
        // Step 3: Verify indexes exist
        const [indexes] = await db.execute(`
            SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, NON_UNIQUE
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND COLUMN_NAME = 'customer_id'
            ORDER BY TABLE_NAME, INDEX_NAME
        `);
        
        console.log('🔍 Customer_id indexes after migration:');
        for (const idx of indexes) {
            const indexType = idx.NON_UNIQUE === 0 ? 'UNIQUE' : 'INDEX';
            console.log(`  ${idx.TABLE_NAME}.${idx.INDEX_NAME}: ${indexType}`);
        }
        
        // Step 4: Test sample queries
        console.log('🔍 Testing sample queries with VARCHAR customer_id...');
        
        // Test string-based query
        const [testQuery] = await db.execute(`
            SELECT COUNT(*) as count FROM nad_test_ids 
            WHERE customer_id IS NOT NULL 
            LIMIT 1
        `);
        
        console.log(`✅ Sample query successful: found ${testQuery[0].count} tests with customer_id`);
        
        return {
            success: true,
            columnTypes,
            recordCounts,
            indexCount: indexes.length,
            message: 'Customer ID migration validation passed'
        };
        
    } catch (error) {
        console.error('❌ Migration validation failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================================================
// FILE UPLOAD CONFIGURATION
// ============================================================================

// In production, save to htdocs directory where files are web-accessible
// Otherwise use local backend uploads directory for development
const uploadDir = process.env.NODE_ENV === 'production'
    ? '/home/bitnami/htdocs/nad-app/uploads'
    : path.join(__dirname, 'uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Validate email format for customer_id
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Normalize customer_id (handle both legacy numeric and new email format)
function normalizeCustomerId(customerId) {
    if (!customerId) return null;
    
    // If it's a number or numeric string, keep as-is for backward compatibility
    if (typeof customerId === 'number' || /^\d+$/.test(customerId)) {
        return customerId.toString();
    }
    
    // If it's an email, normalize to lowercase
    if (isValidEmail(customerId)) {
        return customerId.toLowerCase();
    }
    
    // Otherwise return as-is
    return customerId;
}

function generateTestId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `NAD-${year}${month}${day}-${random}`;
}

function generateRandomSuffix() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateTestIdWithAutoIncrement(autoIncrementId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomSuffix = generateRandomSuffix();
    
    return `${year}-${month}-${autoIncrementId}-${randomSuffix}`;
}


// ============================================================================
// SHOPIFY AUTHENTICATION MIDDLEWARE
// ============================================================================

function validateShopifyAuth(req, res, next) {
    // Shopify Multipass authentication validation
    // Extracts email from Multipass token to use as customer_id
    
    const shopifyToken = req.headers['x-shopify-token'] || req.query.token;
    const userRole = req.headers['x-shopify-role'] || req.query.role;
    
    if (!shopifyToken) {
        return res.status(401).json({ 
            success: false, 
            error: 'Authentication required',
            redirect: 'https://mynadtest.myshopify.com/account/login'
        });
    }
    
    // TODO: Implement actual Multipass token decryption
    // For now, extract email from token payload (placeholder)
    let customerEmail = null;
    
    // In production, this would decrypt the Multipass token and extract email
    // Example: const decodedToken = decryptMultipassToken(shopifyToken);
    // customerEmail = decodedToken.email;
    
    // For development/testing, accept email from headers
    if (req.headers['x-customer-email']) {
        customerEmail = req.headers['x-customer-email'].toLowerCase();
    }
    
    // Set user context with email as customer_id
    req.user = {
        customer_id: customerEmail, // Email will be the customer_id
        email: customerEmail,
        role: userRole || 'customer',
        shopifyToken: shopifyToken,
        authenticated: true
    };
    
    next();
}

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

app.get('/health', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT 1 as test');
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '1.0.0'
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});

// ============================================================================
// DASHBOARD STATISTICS ENDPOINTS
// ============================================================================

app.get('/api/dashboard/stats', async (req, res) => {
    const startTime = Date.now();
    
    try {
        req.logger.info('Dashboard stats request started', {
            endpoint: '/api/dashboard/stats',
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });

        const [testStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_tests,
                COUNT(CASE WHEN status = 'activated' THEN 1 END) as activated_tests,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tests
            FROM nad_test_ids
        `);
        
        const [completedTests] = await db.execute(`
            SELECT COUNT(DISTINCT test_id) as completed_tests
            FROM nad_test_scores 
            WHERE score IS NOT NULL AND score != ''
        `);
        
        // REMOVED: User statistics
        // const [userStats] = await db.execute(`
        //     SELECT COUNT(*) as active_users FROM nad_user_roles
        // `);

        const stats = {
            total_tests: testStats[0].total_tests,
            activated_tests: testStats[0].activated_tests,
            pending_tests: testStats[0].pending_tests,
            completed_tests: completedTests[0].completed_tests
            // REMOVED: active_users: userStats[0].active_users
        };
        
        const duration = Date.now() - startTime;
        req.logger.info('Dashboard stats request completed', {
            endpoint: '/api/dashboard/stats',
            duration: `${duration}ms`,
            stats: stats
        });
        
        res.json({
            success: true,
            stats: stats,
            requestId: req.requestId // Include request ID in response
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        req.logger.error('Dashboard stats request failed', {
            endpoint: '/api/dashboard/stats',
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            success: false, 
            error: error.message,
            requestId: req.requestId
        });
    }
});

// ============================================================================
// SHOPIFY WEBHOOK ENDPOINTS
// ============================================================================


// ============================================================================
// TEST MANAGEMENT ENDPOINTS
// ============================================================================

app.post('/api/tests/verify', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { test_id, email } = req.body;
        
        // Create customer-specific logger with email as customer ID
        const customerLogger = req.logger.child({
            customerId: email,
            testId: test_id
        });
        
        customerLogger.info('Test verification request started', {
            endpoint: '/api/tests/verify',
            testId: test_id,
            email: email // Note: In production, consider hashing emails for privacy
        });
        
        if (!test_id || !email) {
            customerLogger.warn('Test verification failed: missing required fields', {
                hasTestId: !!test_id,
                hasEmail: !!email
            });
            return res.status(400).json({
                success: false,
                error: 'Test ID and email are required',
                requestId: req.requestId
            });
        }
        
        const [testRows] = await db.execute(`
            SELECT ti.*, ts.score
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
            WHERE UPPER(ti.test_id) = UPPER(?)
        `, [test_id]);
        
        if (testRows.length === 0) {
            customerLogger.warn('Test verification failed: test not found', {
                testId: test_id,
                queryResultCount: testRows.length
            });
            return res.status(404).json({
                success: false,
                error: 'Test ID not found',
                requestId: req.requestId
            });
        }
        
        const test = testRows[0];
        const status = test.status || 'pending';
        
        // Log customer activity
        customerLogger.customer('test_verification', email, test_id, {
            status: status,
            hasScore: !!test.score,
            customerId: test.customer_id
        });
        
        const duration = Date.now() - startTime;
        customerLogger.info('Test verification completed successfully', {
            endpoint: '/api/tests/verify',
            duration: `${duration}ms`,
            testStatus: status,
            hasExistingScore: !!test.score
        });
        
        res.json({
            success: true,
            test: {
                test_id: test.test_id,
                customer_id: test.customer_id,
                status: status,
                created_date: test.created_date,
                activated_date: test.activated_date,
                score: test.score
            },
            requestId: req.requestId
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        const customerLogger = req.logger.child({
            customerId: req.body?.email,
            testId: req.body?.test_id
        });
        
        customerLogger.error('Test verification request failed', {
            endpoint: '/api/tests/verify',
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            requestId: req.requestId
        });
    }
});

app.post('/api/tests/:testId/supplements', async (req, res) => {
    try {
        const testId = req.params.testId;
        const { supplements, habits_notes } = req.body;
        
        const [testRows] = await db.execute(`
            SELECT test_id, status, customer_id, batch_id, created_date, activated_date 
            FROM nad_test_ids WHERE UPPER(test_id) = UPPER(?) AND status IN ('activated', 'completed')
        `, [testId]);
        
        if (testRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Test not found or not activated'
            });
        }
        
        const test = testRows[0];
        const supplementsData = supplements.map(s => `${s.name}: ${s.dose} ${s.unit}`).join('; ');
        
        await db.execute(`
            INSERT INTO nad_user_supplements (test_id, customer_id, supplements_with_dose, habits_notes, created_at)
            VALUES (?, ?, ?, ?, CURDATE())
            ON DUPLICATE KEY UPDATE
            supplements_with_dose = VALUES(supplements_with_dose),
            habits_notes = VALUES(habits_notes)
        `, [testId, test.customer_id, supplementsData, habits_notes || '']);
        
        res.json({
            success: true,
            message: 'Supplement information saved successfully'
        });
    } catch (error) {
        console.error('Error saving supplement information:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/tests/:testId/results', async (req, res) => {
    try {
        const testId = req.params.testId;
        
        const [results] = await db.execute(`
            SELECT ts.*, us.supplements_with_dose, us.habits_notes
            FROM nad_test_scores ts
            LEFT JOIN nad_user_supplements us ON ts.test_id = us.test_id
            WHERE ts.test_id = ?
        `, [testId]);
        
        if (results.length === 0) {
            return res.json({
                success: true,
                results: {
                    status: 'pending',
                    message: 'Test results are being processed'
                }
            });
        }
        
        const result = results[0];
        res.json({
            success: true,
            results: {
                test_id: result.test_id,
                score: result.score,
                status: 'completed',
                technician_id: result.technician_id,
                score_submission_date: result.score_submission_date,
                customer_id: result.customer_id,
                notes: result.notes,
                supplements_info: result.supplements_with_dose,
                habits_notes: result.habits_notes
            }
        });
    } catch (error) {
        console.error('Error fetching test results:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/tests/scores', async (req, res) => {
    try {
        const [scores] = await db.execute(`
            SELECT * FROM nad_test_scores ORDER BY score_submission_date DESC
        `);
        res.json({ success: true, scores: scores });
    } catch (error) {
        console.error('Error fetching test scores:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/tests/score', upload.single('image'), async (req, res) => {
    try {
        const { test_id, score, technician_id, notes } = req.body;
        
        if (!test_id || !score || !technician_id) {
            return res.status(400).json({
                success: false,
                error: 'Test ID, score, and technician ID are required'
            });
        }
        
        const [testRows] = await db.execute(`
            SELECT test_id, status, customer_id, batch_id, created_date, activated_date 
            FROM nad_test_ids WHERE UPPER(test_id) = UPPER(?)
        `, [test_id]);
        
        if (testRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Test ID not found'
            });
        }
        
        const test = testRows[0];
        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }
        
        await db.execute(`
            INSERT INTO nad_test_scores (
                customer_id, activated_by, technician_id, test_id, score, image, 
                status, score_submission_date, created_date, updated_date, notes
            ) VALUES (?, ?, ?, ?, ?, ?, 'completed', 1, CURDATE(), CURDATE(), CURDATE(), ?)
            ON DUPLICATE KEY UPDATE
            score = VALUES(score), technician_id = VALUES(technician_id), image = VALUES(image),
            status = VALUES(status), score_submission_date = VALUES(score_submission_date),
            updated_date = VALUES(updated_date), notes = VALUES(notes)
        `, [
            test.customer_id, test.customer_id, technician_id,
            test_id, score, imagePath, notes || ''
        ]);
        
        res.json({ success: true, message: 'Test score submitted successfully' });
    } catch (error) {
        console.error('Error submitting test score:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// ============================================================================
// SUPPLEMENT MANAGEMENT ENDPOINTS
// ============================================================================

// ==================================================
// Server-side API endpoint for supplements
// Add this to your Node.js server.js file
// ==================================================

// Supplements API endpoints
app.get('/api/supplements', async (req, res) => {
    const startTime = Date.now();
    
    try {
        req.logger.info('Supplements list request started', {
            endpoint: '/api/supplements'
        });

        req.logger.debugArea('supplements', 'Loading supplements from database', {
            query: 'SELECT all supplements with ordering by name'
        });
        
        const query = `
            SELECT 
                id,
                name,
                category,
                description,
                default_dose,
                unit,
                min_dose,
                max_dose,
                notes,
                is_active,
                is_featured,
                created_at,
                updated_at
            FROM nad_supplements 
            ORDER BY name ASC
        `;
        
        const [supplements] = await db.execute(query);
        
        req.logger.debugArea('supplements', 'Supplements query completed', {
            supplementCount: supplements.length,
            activeCount: supplements.filter(s => s.is_active).length,
            featuredCount: supplements.filter(s => s.is_featured).length,
            categories: [...new Set(supplements.map(s => s.category))]
        });

        const duration = Date.now() - startTime;
        req.logger.info('Supplements list request completed', {
            endpoint: '/api/supplements',
            duration: `${duration}ms`,
            supplementCount: supplements.length
        });
        
        res.json({
            success: true,
            supplements: supplements,
            count: supplements.length,
            requestId: req.requestId
        });
        
    } catch (error) {
        const duration = Date.now() - startTime;
        req.logger.error('Supplements list request failed', {
            endpoint: '/api/supplements',
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack
        });

        req.logger.debugArea('supplements', 'Supplements loading failed', {
            error: error.message,
            duration: `${duration}ms`
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to load supplements',
            message: error.message,
            requestId: req.requestId
        });
    }
});

// Create new supplement
app.post('/api/supplements', async (req, res) => {
    try {
        req.logger.admin('supplement_create', 'admin', { action: 'create_supplement' });
        
        const {
            name,
            category,
            description = '',
            default_dose = null,
            unit = 'mg',
            min_dose = null,
            max_dose = null,
            notes = '',
            is_active = 1,
            is_featured = 0
        } = req.body;
        
        // Validation
        if (!name || !category) {
            return res.status(400).json({
                success: false,
                error: 'Name and category are required'
            });
        }
        
        // Check if supplement name already exists
        const [existing] = await db.execute(
            'SELECT id FROM nad_supplements WHERE name = ?',
            [name]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'A supplement with this name already exists'
            });
        }
        
        // Insert new supplement
        const query = `
            INSERT INTO nad_supplements (
                name, category, description, default_dose, unit,
                min_dose, max_dose, notes, is_active, is_featured,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        const [result] = await db.execute(query, [
            name,
            category,
            description,
            default_dose,
            unit,
            min_dose,
            max_dose,
            notes,
            is_active ? 1 : 0,
            is_featured ? 1 : 0
        ]);
        
        const supplementId = result.insertId;
        
        console.log(`✅ Created supplement with ID: ${supplementId}`);
        
        // Return the created supplement
        const [newSupplement] = await db.execute(
            'SELECT * FROM nad_supplements WHERE id = ?',
            [supplementId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Supplement created successfully',
            supplement: newSupplement[0],
            id: supplementId
        });
        
    } catch (error) {
        console.error('❌ Error creating supplement:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create supplement',
            message: error.message
        });
    }
});

// Update supplement
app.put('/api/supplements/:id', async (req, res) => {
    try {
        const supplementId = req.params.id;
        console.log(`📡 PUT /api/supplements/${supplementId} - Updating supplement`);
        console.log('📝 Request body:', req.body);
        
        const {
            name,
            category,
            description = '',
            default_dose = null,
            unit = 'mg',
            min_dose = null,
            max_dose = null,
            notes = '',
            is_active = 1,
            is_featured = 0
        } = req.body;
        
        // Validation
        if (!name || !category) {
            return res.status(400).json({
                success: false,
                error: 'Name and category are required'
            });
        }
        
        // Check if supplement exists
        const [existing] = await db.execute(
            'SELECT id FROM nad_supplements WHERE id = ?',
            [supplementId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Supplement not found'
            });
        }
        
        // Check if name conflicts with another supplement
        const [nameConflict] = await db.execute(
            'SELECT id FROM nad_supplements WHERE name = ? AND id != ?',
            [name, supplementId]
        );
        
        if (nameConflict.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'A supplement with this name already exists'
            });
        }
        
        // Update supplement
        const query = `
            UPDATE nad_supplements SET
                name = ?,
                category = ?,
                description = ?,
                default_dose = ?,
                unit = ?,
                min_dose = ?,
                max_dose = ?,
                notes = ?,
                is_active = ?,
                is_featured = ?,
                updated_at = NOW()
            WHERE id = ?
        `;
        
        await db.execute(query, [
            name,
            category,
            description,
            default_dose,
            unit,
            min_dose,
            max_dose,
            notes,
            is_active ? 1 : 0,
            is_featured ? 1 : 0,
            supplementId
        ]);
        
        console.log(`✅ Updated supplement ID: ${supplementId}`);
        
        // Return the updated supplement
        const [updatedSupplement] = await db.execute(
            'SELECT * FROM nad_supplements WHERE id = ?',
            [supplementId]
        );
        
        res.json({
            success: true,
            message: 'Supplement updated successfully',
            supplement: updatedSupplement[0]
        });
        
    } catch (error) {
        console.error('❌ Error updating supplement:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update supplement',
            message: error.message
        });
    }
});

// Delete supplement
app.delete('/api/supplements/:id', async (req, res) => {
    try {
        const supplementId = req.params.id;
        console.log(`📡 DELETE /api/supplements/${supplementId} - Deleting supplement`);
        
        // Check if supplement exists
        const [existing] = await db.execute(
            'SELECT name FROM nad_supplements WHERE id = ?',
            [supplementId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Supplement not found'
            });
        }
        
        const supplementName = existing[0].name;
        
        // Delete supplement
        await db.execute('DELETE FROM nad_supplements WHERE id = ?', [supplementId]);
        
        console.log(`✅ Deleted supplement: ${supplementName}`);
        
        res.json({
            success: true,
            message: `Supplement "${supplementName}" deleted successfully`
        });
        
    } catch (error) {
        console.error('❌ Error deleting supplement:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete supplement',
            message: error.message
        });
    }
});

// Get supplement usage statistics
app.get('/api/supplements/:id/usage', async (req, res) => {
    try {
        const supplementId = req.params.id;
        console.log(`📡 GET /api/supplements/${supplementId}/usage - Getting usage stats`);
        
        // Get usage statistics from nad_user_supplements table
        const [usage] = await db.execute(`
            SELECT 
                COUNT(*) as total_uses,
                COUNT(DISTINCT customer_id) as active_users,
                AVG(dose) as average_dose,
                MAX(created_at) as last_used
            FROM nad_user_supplements 
            WHERE supplement_name = (
                SELECT name FROM nad_supplements WHERE id = ?
            )
        `, [supplementId]);
        
        res.json({
            success: true,
            usage: usage[0] || {
                total_uses: 0,
                active_users: 0,
                average_dose: null,
                last_used: null
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting supplement usage:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get supplement usage',
            message: error.message
        });
    }
});

// GET /api/supplements/:id - Get single supplement
app.get('/api/supplements/:id', async (req, res) => {
    try {
        const supplementId = req.params.id;
        console.log(`📡 GET /api/supplements/${supplementId} - Getting single supplement`);
        
        const [supplement] = await db.execute(
            'SELECT * FROM nad_supplements WHERE id = ?',
            [supplementId]
        );
        
        if (supplement.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Supplement not found'
            });
        }
        
        res.json({
            success: true,
            supplement: supplement[0]
        });
        
    } catch (error) {
        console.error('❌ Error getting supplement:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get supplement',
            message: error.message
        });
    }
});

// Supplements API endpoints loaded with structured logging

// ============================================================================
// APPLY AUTHENTICATION TO PROTECTED ROUTES
// ============================================================================

// Apply authentication to protected routes
// TODO: Re-enable when Shopify authentication is properly configured
// app.use('/api/admin/*', validateShopifyAuth);
// app.use('/api/lab/*', validateShopifyAuth);

// ============================================================================
// LAB INTERFACE ENDPOINTS
// ============================================================================

app.get('/api/lab/pending-tests', async (req, res) => {
    try {
        // Add status column if it doesn't exist
        try {
            await db.execute(`
                ALTER TABLE nad_test_ids 
                ADD COLUMN status VARCHAR(50) DEFAULT 'pending',
                ADD INDEX idx_status (status)
            `);
            console.log('Added status column to nad_test_ids');
            
            // Migrate existing data to use status field
            await db.execute(`
                UPDATE nad_test_ids 
                SET status = CASE 
                    WHEN is_activated = 0 THEN 'pending'
                    WHEN is_activated = 1 THEN 'activated'
                    ELSE 'pending'
                END
                WHERE status = 'pending'
            `);
        } catch (alterError) {
            // Column probably already exists, ignore
        }
        
        // Get tests with activated status
        const [tests] = await db.execute(`
            SELECT id, test_id, batch_id, activated_date, customer_id 
            FROM nad_test_ids 
            WHERE status = 'activated'
            ORDER BY activated_date ASC
        `);
        
        res.json({ success: true, tests: tests });
    } catch (error) {
        console.error('Error fetching pending tests:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/lab/stats', async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                COUNT(DISTINCT CASE WHEN ti.status = 'activated' THEN ti.test_id END) as pending_tests,
                COUNT(DISTINCT CASE WHEN ti.status = 'completed' THEN ti.test_id END) as completed_tests,
                AVG(CAST(ts.score AS DECIMAL(10,2))) as average_score,
                COUNT(DISTINCT CASE WHEN ti.status = 'completed' AND ti.processed_date = CURDATE() THEN ti.test_id END) as tests_today
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
        `);
        
        const result = stats[0];
        // Rename for clarity
        result.pending = result.pending_tests;
        result.completed_today = result.tests_today;
        result.total_processed = result.completed_tests;
        
        res.json({ success: true, stats: result });
    } catch (error) {
        console.error('Error fetching lab stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/lab/recent-tests', async (req, res) => {
    try {
        const [tests] = await db.execute(`
            SELECT 
                ti.test_id, 
                ts.score as nad_score,
                ti.processed_date,
                ts.technician_id,
                ti.batch_id,
                ti.activated_date,
                ti.customer_id
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
            WHERE ti.status = 'completed'
            ORDER BY ti.processed_date DESC
            LIMIT 20
        `);
        res.json({ success: true, tests: tests });
    } catch (error) {
        console.error('Error fetching recent tests:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/lab/update-test/:testId', upload.none(), async (req, res) => {
    try {
        const { testId } = req.params;
        const { nadScore, technicianEmail, editReason, editNotes } = req.body;
        
        if (!testId) {
            return res.status(400).json({ success: false, message: 'Test ID is required' });
        }
        
        if (!nadScore || nadScore < 0 || nadScore > 100) {
            return res.status(400).json({ success: false, message: 'Valid NAD+ score (0-100) is required' });
        }
        
        if (!editReason || !editNotes) {
            return res.status(400).json({ success: false, message: 'Edit reason and notes are required' });
        }
        
        console.log('Updating test:', testId, 'with new score:', nadScore, 'by technician:', technicianEmail);
        
        // Start a transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Get the original score for audit
            const [original] = await connection.execute(`
                SELECT score FROM nad_test_scores WHERE UPPER(test_id) = UPPER(?)
            `, [testId]);
            
            const originalScore = original.length > 0 ? original[0].score : null;
            
            // Update the score in nad_test_scores
            await connection.execute(`
                UPDATE nad_test_scores 
                SET score = ?, 
                    technician_id = ?,
                    updated_date = NOW()
                WHERE UPPER(test_id) = UPPER(?)
            `, [parseFloat(nadScore), technicianEmail || 'lab-tech@example.com', testId]);
            
            // Create audit log entry
            await connection.execute(`
                INSERT INTO nad_test_score_edits (
                    test_id, original_score, new_score, edit_reason, 
                    edit_notes, edited_by, edited_date
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [testId, originalScore, parseFloat(nadScore), editReason, editNotes, technicianEmail || 'lab-tech@example.com']);
            
            await connection.commit();
            res.json({ 
                success: true, 
                message: 'Test updated successfully',
                data: {
                    testId,
                    newScore: nadScore,
                    originalScore,
                    editedBy: technicianEmail
                }
            });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error updating test:', error);
        
        // If the audit table doesn't exist, create it
        if (error.message.includes('nad_test_score_edits')) {
            try {
                await db.execute(`
                    CREATE TABLE IF NOT EXISTS nad_test_score_edits (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        test_id VARCHAR(255) NOT NULL,
                        original_score DECIMAL(5,2),
                        new_score DECIMAL(5,2) NOT NULL,
                        edit_reason VARCHAR(100) NOT NULL,
                        edit_notes TEXT NOT NULL,
                        edited_by VARCHAR(255) NOT NULL,
                        edited_date DATETIME NOT NULL,
                        INDEX idx_test_id (test_id),
                        INDEX idx_edited_date (edited_date)
                    )
                `);
                console.log('Created nad_test_score_edits table');
                
                // Retry the request
                return res.status(503).json({ 
                    success: false, 
                    message: 'Database table created. Please try again.',
                    retry: true 
                });
            } catch (createError) {
                console.error('Error creating audit table:', createError);
            }
        }
        
        res.status(500).json({ success: false, message: 'Error updating test', error: error.message });
    }
});

app.post('/api/lab/submit-results', async (req, res) => {
    try {
        const { testId, nadScore, notes } = req.body;
        
        if (!testId || !nadScore) {
            return res.status(400).json({ success: false, message: 'Test ID and NAD+ score are required' });
        }
        
        // Insert or update the test score
        await db.execute(`
            INSERT INTO nad_test_scores (test_id, score, technician_id, score_submission_date, notes)
            VALUES (?, ?, 'lab-tech', NOW(), ?)
            ON DUPLICATE KEY UPDATE
            score = VALUES(score),
            score_submission_date = VALUES(score_submission_date),
            notes = VALUES(notes)
        `, [testId, nadScore, notes || null]);
        
        res.json({ success: true, message: 'Test results submitted successfully' });
    } catch (error) {
        console.error('Error submitting test results:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/lab/process-test/:testId', upload.single('resultFile'), async (req, res) => {
    try {
        const { testId } = req.params;
        const { nadScore, technicianEmail, labNotes } = req.body;
        
        if (!testId) {
            return res.status(400).json({ success: false, message: 'Test ID is required' });
        }
        
        if (!nadScore || nadScore < 0 || nadScore > 100) {
            return res.status(400).json({ success: false, message: 'Valid NAD+ score (0-100) is required' });
        }
        
        console.log('Processing test:', testId, 'with score:', nadScore, 'by technician:', technicianEmail);
        
        // Start a transaction to update both tables
        // Architecture: nad_test_ids = single source of truth for status
        //              nad_test_scores = score data only
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Add processed_date column if it doesn't exist
            try {
                await connection.execute(`
                    ALTER TABLE nad_test_ids 
                    ADD COLUMN processed_date DATETIME DEFAULT NULL
                `);
            } catch (alterError) {
                // Column probably already exists, ignore
            }
            
            // Update status in nad_test_ids to 'completed'
            await connection.execute(`
                UPDATE nad_test_ids 
                SET status = 'completed', 
                    processed_date = NOW()
                WHERE UPPER(test_id) = UPPER(?)
            `, [testId]);
            
            // Prepare file path if file was uploaded
            const filePath = req.file ? `/uploads/${req.file.filename}` : null;
            
            // Insert/update score data in nad_test_scores (data only, status tracked in nad_test_ids)
            await connection.execute(`
                INSERT INTO nad_test_scores (
                    test_id, score, technician_id, score_submission_date, 
                    notes, image, created_date, updated_date
                )
                VALUES (?, ?, ?, NOW(), ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    score = VALUES(score),
                    technician_id = VALUES(technician_id),
                    score_submission_date = VALUES(score_submission_date),
                    notes = VALUES(notes),
                    image = VALUES(image),
                    updated_date = VALUES(updated_date)
            `, [testId, parseFloat(nadScore), technicianEmail || 'lab-tech@example.com', labNotes || null, filePath]);
            
            await connection.commit();
            res.json({ 
                success: true, 
                message: 'Test processed successfully',
                data: {
                    testId,
                    score: nadScore,
                    technician: technicianEmail,
                    filePath
                }
            });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error processing test:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to process test' });
    }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

app.get('/api/admin/tests', async (req, res) => {
    try {
        // Status field is now the single source of truth
        // No migration needed as Phase 4 schema cleanup completed
        
        const [tests] = await db.execute(`
            SELECT 
                ti.id,
                ti.test_id, 
                ti.batch_id, 
                ti.batch_size, 
                ti.generated_by, 
                ti.customer_id, 
                ti.created_date, 
                ti.status,
                ti.activated_date, 
                ti.shipping_status, 
                ti.shipped_date, 
                ti.notes, 
                ti.is_printed, 
                ti.printed_date, 
                ti.printed_by,
                ts.score, 
                ts.technician_id, 
                ts.score_submission_date,
                us.supplements_with_dose
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
            LEFT JOIN nad_user_supplements us ON ti.test_id = us.test_id
            ORDER BY ti.created_date DESC
        `);
        
        // Log sample data for debugging
        if (tests.length > 0) {
            console.log('Sample test data:', {
                total: tests.length,
                statuses: tests.slice(0, 5).map(t => ({ id: t.test_id, status: t.status }))
            });
        }
        
        res.json({ success: true, tests: tests });
    } catch (error) {
        console.error('Error fetching all tests:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================================
// BULK TEST CREATION ENDPOINTS
// =====================================================

// Bulk test creation endpoint
app.post('/api/admin/create-test-batch', async (req, res) => {
    const { quantity, notes } = req.body;
    
    // Validation
    if (!quantity || quantity < 1 || quantity > 1000) {
        return res.status(400).json({
            success: false,
            message: 'Quantity must be between 1 and 1000'
        });
    }

    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Generate batch ID for tracking
        const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const createdTests = [];
        
        req.logger.info('Creating test batch', { 
            quantity, 
            batchId, 
            notes: notes || 'No notes provided' 
        });
        
        // Create tests in bulk
        for (let i = 0; i < quantity; i++) {
            // Insert placeholder record to get auto-increment ID
            const [insertResult] = await connection.execute(
                `INSERT INTO nad_test_ids (
                    test_id, batch_id, batch_size, notes, created_date
                ) VALUES (?, ?, ?, ?, NOW())`,
                ['TEMP', batchId, quantity, notes || null]
            );
            
            const autoIncrementId = insertResult.insertId;
            const testId = generateTestIdWithAutoIncrement(autoIncrementId);
            
            // Update with the actual test_id
            await connection.execute(
                'UPDATE nad_test_ids SET test_id = ? WHERE id = ?',
                [testId, autoIncrementId]
            );
            
            createdTests.push({
                id: autoIncrementId,
                test_id: testId,
                batch_id: batchId
            });
        }
        
        await connection.commit();
        
        req.logger.info('Test batch created successfully', { 
            batchId, 
            testsCreated: createdTests.length 
        });
        
        res.json({
            success: true,
            message: `Successfully created ${quantity} tests`,
            data: {
                batch_id: batchId,
                quantity: quantity,
                tests_created: createdTests.length,
                sample_test_ids: createdTests.slice(0, 5).map(t => t.test_id),
                notes: notes || ''
            }
        });
        
    } catch (error) {
        await connection.rollback();
        req.logger.error('Error creating test batch', { error: error.message });
        
        res.status(500).json({
            success: false,
            message: 'Failed to create test batch',
            error: error.message
        });
    } finally {
        connection.release();
    }
});



app.post('/api/admin/tests/bulk-activate', async (req, res) => {
    try {
        const { test_ids } = req.body;
        
        if (!test_ids || !Array.isArray(test_ids) || test_ids.length === 0) {
            return res.status(400).json({ success: false, error: 'Test IDs array is required' });
        }
        
        const placeholders = test_ids.map(() => '?').join(',');
        const [result] = await db.execute(`
            UPDATE nad_test_ids 
            SET status = 'activated', activated_date = NOW()
            WHERE test_id IN (${placeholders})
        `, test_ids);
        
        res.json({
            success: true,
            message: `Activated ${result.affectedRows} tests`,
            activated_count: result.affectedRows
        });
    } catch (error) {
        console.error('Error bulk activating tests:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Replace your existing individual test activation/deactivation endpoints with these enhanced versions:

// Single test activation with structured logging
app.post('/api/admin/tests/:testId/activate', async (req, res) => {
    const startTime = Date.now();
    const testId = req.params.testId;
    
    req.logger.admin('test_activation_request', 'admin', { testId });
    
    try {
        if (!testId || testId.trim() === '') {
            req.logger.warn('Test activation failed: missing test ID', { testId });
            return res.status(400).json({ 
                success: false, 
                error: 'Test ID is required',
                received_testId: testId,
                testId_type: typeof testId
            });
        }
        
        req.logger.debugArea('analytics', 'Checking test existence', { testId });
        const [existing] = await db.execute(`SELECT test_id, status FROM nad_test_ids WHERE UPPER(test_id) = UPPER(?)`, [testId]);
        
        if (existing.length === 0) {
            req.logger.warn('Test activation failed: test not found', { testId });
            return res.status(404).json({ 
                success: false, 
                error: 'Test not found',
                searched_testId: testId,
                query_result: existing
            });
        }
        
        const currentTest = existing[0];
        
        if (currentTest.status !== 'pending') {
            req.logger.info('Test activation skipped: already activated', {
                testId,
                currentStatus: currentTest.status
            });
            return res.json({ 
                success: true, 
                message: `Test is already ${currentTest.status}`,
                current_status: currentTest.status,
                test_data: currentTest
            });
        }
        
        const [updateResult] = await db.execute(`
            UPDATE nad_test_ids 
            SET status = 'activated', activated_date = NOW()
            WHERE UPPER(test_id) = UPPER(?)
        `, [testId]);
        
        if (updateResult.affectedRows === 0) {
            req.logger.error('Test activation failed: no rows updated', {
                testId,
                affectedRows: updateResult.affectedRows
            });
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to update test - no rows affected',
                update_result: updateResult
            });
        }
        
        // Verify the update
        const [verifyResult] = await db.execute(`SELECT test_id, status, activated_date FROM nad_test_ids WHERE UPPER(test_id) = UPPER(?)`, [testId]);
        
        const processingTime = Date.now() - startTime;
        req.logger.info('Test activated successfully', {
            testId,
            processingTime: `${processingTime}ms`,
            newStatus: verifyResult[0]?.status
        });
        
        res.json({ 
            success: true, 
            message: 'Test activated successfully',
            test_id: testId,
            processing_time_ms: processingTime,
            updated_test: verifyResult[0]
        });
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        req.logger.error('Test activation failed', {
            testId,
            processingTime: `${processingTime}ms`,
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            error_name: error.name,
            test_id: testId,
            processing_time_ms: processingTime,
            timestamp: new Date().toISOString()
        });
    }
});

// Single test deactivation with structured logging
app.post('/api/admin/tests/:testId/deactivate', async (req, res) => {
    const startTime = Date.now();
    const testId = req.params.testId;
    
    req.logger.admin('test_deactivation_request', 'admin', { testId });
    
    try {
        if (!testId || testId.trim() === '') {
            req.logger.warn('Test deactivation failed: missing test ID', { testId });
            return res.status(400).json({ 
                success: false, 
                error: 'Test ID is required',
                received_testId: testId,
                testId_type: typeof testId
            });
        }
        
        req.logger.debugArea('analytics', 'Checking test existence for deactivation', { testId });
        const [existing] = await db.execute(`SELECT test_id, status FROM nad_test_ids WHERE UPPER(test_id) = UPPER(?)`, [testId]);
        
        if (existing.length === 0) {
            req.logger.warn('Test deactivation failed: test not found', { testId });
            return res.status(404).json({ 
                success: false, 
                error: 'Test not found',
                searched_testId: testId,
                query_result: existing
            });
        }
        
        const currentTest = existing[0];
        
        if (currentTest.status === 'pending') {
            req.logger.info('Test deactivation skipped: already deactivated', {
                testId,
                currentStatus: currentTest.status
            });
            return res.json({ 
                success: true, 
                message: 'Test is already deactivated',
                current_status: 'deactivated',
                test_data: currentTest
            });
        }
        
        const [updateResult] = await db.execute(`
            UPDATE nad_test_ids 
            SET status = 'pending', activated_date = NULL
            WHERE UPPER(test_id) = UPPER(?)
        `, [testId]);
        
        if (updateResult.affectedRows === 0) {
            req.logger.error('Test deactivation failed: no rows updated', {
                testId,
                affectedRows: updateResult.affectedRows
            });
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to update test - no rows affected',
                update_result: updateResult
            });
        }
        
        // Verify the update
        const [verifyResult] = await db.execute(`SELECT test_id, status, activated_date FROM nad_test_ids WHERE UPPER(test_id) = UPPER(?)`, [testId]);
        
        const processingTime = Date.now() - startTime;
        req.logger.info('Test deactivated successfully', {
            testId,
            processingTime: `${processingTime}ms`,
            newStatus: verifyResult[0]?.status
        });
        
        res.json({ 
            success: true, 
            message: 'Test deactivated successfully',
            test_id: testId,
            processing_time_ms: processingTime,
            updated_test: verifyResult[0]
        });
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        req.logger.error('Test deactivation failed', {
            testId,
            processingTime: `${processingTime}ms`,
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            error_name: error.name,
            test_id: testId,
            processing_time_ms: processingTime,
            timestamp: new Date().toISOString()
        });
    }
});


// Bulk test deactivation
app.post('/api/admin/tests/bulk-deactivate', async (req, res) => {
    try {
        const { test_ids } = req.body;
        
        if (!test_ids || !Array.isArray(test_ids) || test_ids.length === 0) {
            return res.status(400).json({ success: false, error: 'Test IDs array is required' });
        }
        
        const placeholders = test_ids.map(() => '?').join(',');
        const [result] = await db.execute(`
            UPDATE nad_test_ids 
            SET status = 'pending', activated_date = NULL
            WHERE test_id IN (${placeholders})
        `, test_ids);
        
        res.json({
            success: true,
            message: `Deactivated ${result.affectedRows} tests`,
            deactivated_count: result.affectedRows
        });
    } catch (error) {
        console.error('Error bulk deactivating tests:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Export Test Details with Date Filtering (for CSV export) 
// NOTE: This MUST come BEFORE the generic /api/admin/export/:type route
app.get('/api/admin/export/test-details', async (req, res) => {
    try {
        const { period } = req.query;
        
        // Build query and parameters based on period
        let query = `
            SELECT 
                ti.test_id,
                ti.customer_id,
                ti.created_date,
                ti.activated_date,
                ti.status,
                ts.score,
                ts.score_submission_date,
                ts.technician_id,
                ts.notes as technician_notes,
                us.supplements_with_dose,
                us.habits_notes,
                us.created_at as supplements_recorded_date
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
            LEFT JOIN nad_user_supplements us ON ti.test_id = us.test_id
        `;
        
        let queryParams = [];
        
        if (period && period !== 'all') {
            const days = parseInt(period);
            if (!isNaN(days) && days > 0) {
                query += ` WHERE ti.created_date >= DATE_SUB(NOW(), INTERVAL ? DAY)`;
                queryParams.push(days);
            }
        }
        
        query += ` ORDER BY ti.created_date DESC`;
        
        console.log('Executing test details export query:', query);
        console.log('Query parameters:', queryParams);
        
        const [testData] = await db.execute(query, queryParams);
        
        res.json({
            success: true,
            data: testData,
            total_records: testData.length,
            export_period: period || 'all',
            export_date: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error exporting test details:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to export test details: ' + error.message 
        });
    }
});

app.get('/api/admin/export/:type', async (req, res) => {
    try {
        const { type } = req.params;
        let data = [];
        let filename = '';
        
        switch(type) {
            case 'tests':
                [data] = await db.execute(`
                    SELECT ti.*, ts.score, ts.score_submission_date, ts.technician_id
                    FROM nad_test_ids ti
                    LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
                    ORDER BY ti.created_date DESC
                `);
                filename = `nad_tests_export_${new Date().toISOString().split('T')[0]}.json`;
                break;
                
            case 'supplements':
                [data] = await db.execute(`
                    SELECT * FROM nad_user_supplements ORDER BY created_at DESC
                `);
                filename = `nad_supplements_export_${new Date().toISOString().split('T')[0]}.json`;
                break;
                
            // REMOVED: users export case
            // case 'users':
            //     [data] = await db.execute(`
            //         SELECT * FROM nad_user_roles ORDER BY customer_id
            //     `);
            //     filename = `nad_users_export_${new Date().toISOString().split('T')[0]}.json`;
            //     break;
                
            default:
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid export type. Use: tests or supplements'
                });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json({
            export_type: type,
            export_date: new Date().toISOString(),
            total_records: data.length,
            data: data
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

app.get('/api/analytics/overview', async (req, res) => {
    const startTime = Date.now();
    
    try {
        req.logger.info('Analytics overview request started', {
            endpoint: '/api/analytics/overview'
        });

        // Debug logging for analytics module
        req.logger.debugArea('analytics', 'Starting analytics data collection', {
            queries: ['basic_stats', 'score_distribution', 'daily_stats']
        });

        const [basicStats] = await db.execute(`
            SELECT 
                COUNT(DISTINCT ti.test_id) as total_tests,
                COUNT(DISTINCT CASE WHEN ti.status = 'activated' THEN ti.test_id END) as activated_tests,
                COUNT(DISTINCT ts.test_id) as completed_tests,
                AVG(CAST(ts.score AS DECIMAL(10,2))) as average_score
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
        `);
        
        req.logger.debugArea('analytics', 'Basic stats query completed', {
            totalTests: basicStats[0].total_tests,
            activatedTests: basicStats[0].activated_tests,
            completedTests: basicStats[0].completed_tests,
            averageScore: basicStats[0].average_score
        });
        
        const [scoreDistribution] = await db.execute(`
            SELECT 
                CASE 
                    WHEN CAST(score AS DECIMAL) >= 80 THEN 'Excellent (80+)'
                    WHEN CAST(score AS DECIMAL) >= 60 THEN 'Good (60-79)'
                    WHEN CAST(score AS DECIMAL) >= 40 THEN 'Fair (40-59)'
                    ELSE 'Poor (<40)'
                END as score_range,
                COUNT(*) as count
            FROM nad_test_scores 
            WHERE score IS NOT NULL AND score != ''
            GROUP BY score_range
        `);
        
        req.logger.debugArea('analytics', 'Score distribution query completed', {
            distributionCount: scoreDistribution.length,
            ranges: scoreDistribution.map(d => ({ range: d.score_range, count: d.count }))
        });
        
        const [dailyStats] = await db.execute(`
            SELECT 
                DATE(score_submission_date) as date,
                COUNT(*) as completions
            FROM nad_test_scores 
            WHERE score_submission_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(score_submission_date)
            ORDER BY date ASC
        `);
        
        req.logger.debugArea('analytics', 'Daily stats query completed', {
            daysWithData: dailyStats.length,
            totalCompletions: dailyStats.reduce((sum, day) => sum + day.completions, 0),
            dateRange: dailyStats.length > 0 ? {
                from: dailyStats[0].date,
                to: dailyStats[dailyStats.length - 1].date
            } : null
        });
        
        // REMOVED: User role statistics
        // const [roleStats] = await db.execute(`
        //     SELECT role, COUNT(*) as count
        //     FROM nad_user_roles 
        //     WHERE customer_id != 0
        //     GROUP BY role
        // `);

        const analytics = {
            basic_stats: basicStats[0],
            score_distribution: scoreDistribution,
            daily_completions: dailyStats
            // REMOVED: user_roles: roleStats
        };
        
        const duration = Date.now() - startTime;
        req.logger.info('Analytics overview request completed', {
            endpoint: '/api/analytics/overview',
            duration: `${duration}ms`,
            dataPoints: {
                basicStats: 1,
                scoreDistribution: scoreDistribution.length,
                dailyCompletions: dailyStats.length
            }
        });
        
        res.json({
            success: true,
            analytics: analytics,
            requestId: req.requestId
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        req.logger.error('Analytics overview request failed', {
            endpoint: '/api/analytics/overview',
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack
        });
        
        req.logger.debugArea('analytics', 'Analytics data collection failed', {
            error: error.message,
            duration: `${duration}ms`
        });
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            requestId: req.requestId
        });
    }
});

app.get('/api/analytics/performance', async (req, res) => {
    try {
        const [monthlyStats] = await db.execute(`
            SELECT 
                DATE_FORMAT(created_date, '%Y-%m') as month,
                COUNT(*) as tests_created,
                COUNT(CASE WHEN status = 'activated' THEN 1 END) as tests_activated
            FROM nad_test_ids 
            WHERE created_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_date, '%Y-%m')
            ORDER BY month ASC
        `);
        
        const [completionStats] = await db.execute(`
            SELECT 
                DATE_FORMAT(score_submission_date, '%Y-%m') as month,
                COUNT(*) as tests_completed,
                AVG(CAST(score AS DECIMAL(10,2))) as avg_score
            FROM nad_test_scores 
            WHERE score_submission_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(score_submission_date, '%Y-%m')
            ORDER BY month ASC
        `);
        
        res.json({
            success: true,
            performance: {
                monthly_creation: monthlyStats,
                monthly_completion: completionStats
            }
        });
    } catch (error) {
        console.error('Error fetching performance analytics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// REPORTS ENDPOINTS
// ============================================================================

app.get('/api/reports/summary', async (req, res) => {
    try {
        const [summary] = await db.execute(`
            SELECT 
                (SELECT COUNT(*) FROM nad_test_ids) as total_tests,
                (SELECT COUNT(*) FROM nad_test_ids WHERE status = 'activated') as activated_tests,
                (SELECT COUNT(*) FROM nad_test_scores) as completed_tests,
                (SELECT COUNT(*) FROM nad_user_roles WHERE customer_id != 0) as total_users,
                (SELECT COUNT(*) FROM nad_supplements WHERE is_active = 1) as active_supplements,
                (SELECT AVG(CAST(score AS DECIMAL(10,2))) FROM nad_test_scores) as average_score,
                (SELECT COUNT(*) FROM nad_test_scores WHERE score_submission_date = CURDATE()) as tests_today,
                (SELECT COUNT(*) FROM nad_test_ids WHERE created_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as tests_this_week
        `);
        
        const [recentActivity] = await db.execute(`
            SELECT 'test_created' as activity_type, test_id as reference, created_date as activity_date
            FROM nad_test_ids 
            WHERE created_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            UNION ALL
            SELECT 'test_scored' as activity_type, test_id as reference, score_submission_date as activity_date
            FROM nad_test_scores 
            WHERE score_submission_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            ORDER BY activity_date DESC
            LIMIT 20
        `);
        
        res.json({
            success: true,
            report: {
                summary: summary[0],
                recent_activity: recentActivity,
                generated_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error generating summary report:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// BATCH OPERATIONS ENDPOINTS
// ============================================================================

app.get('/api/admin/printable-batches', async (req, res) => {
    try {
        // Group tests by their actual batch_id
        const [batches] = await db.execute(`
            SELECT 
                batch_id,
                COUNT(*) as test_count,
                MIN(created_date) as created_date,
                MAX(notes) as batch_notes,
                GROUP_CONCAT(test_id ORDER BY test_id SEPARATOR ', ') as all_test_ids,
                SUM(CASE WHEN status = 'activated' THEN 1 ELSE 0 END) as activated_count,
                SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END) as printed_count
            FROM nad_test_ids
            WHERE batch_id IS NOT NULL
            GROUP BY batch_id
            ORDER BY MIN(created_date) DESC
        `);
        
        // Format the batches
        const formattedBatches = batches.map(batch => {
            const testIds = batch.all_test_ids.split(', ');
            const printedCount = parseInt(batch.printed_count) || 0;  // Convert to number
            const totalTests = parseInt(batch.test_count);            // Convert to number
            
            // Determine print status
            let printStatus = 'not_printed';
            if (printedCount > 0) {
                printStatus = printedCount === totalTests ? 'fully_printed' : 'partially_printed';
            }
            
            // Debug log for batches that should be fully printed but aren't
            if (printedCount > 0 && printedCount !== totalTests) {
                console.log(`⚠️ Batch ${batch.batch_id}: ${printedCount}/${totalTests} printed (should be ${totalTests}/${totalTests})`);
            }
            
            return {
                batch_id: batch.batch_id,
                batch_size: batch.test_count,
                total_tests: totalTests,
                printed_tests: printedCount,
                print_status: printStatus,
                print_percentage: totalTests > 0 ? Math.round((printedCount / totalTests) * 100) : 0,
                sample_test_ids: testIds.slice(0, 3).join(', '),
                batch_notes: batch.batch_notes,
                created_date: batch.created_date,
                test_ids: testIds,
                activated_count: batch.activated_count,
                printed_count: batch.printed_count,
                last_printed_date: null // Will be null for now, can be enhanced later
            };
        });
        
        res.json({
            success: true,
            data: formattedBatches
        });
    } catch (error) {
        console.error('Error fetching printable batches:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch printable batches',
            details: error.message 
        });
    }
});

app.get('/api/admin/batch-details/:batchId', async (req, res) => {
    try {
        const { batchId } = req.params;
        
        // Get all tests for this batch
        const [tests] = await db.execute(`
            SELECT test_id, created_date, status, is_printed, notes
            FROM nad_test_ids
            WHERE batch_id = ?
            ORDER BY test_id
        `, [batchId]);
        
        // Calculate batch statistics
        const totalTests = tests.length;
        const printedTests = tests.filter(t => t.is_printed).length;
        const activatedTests = tests.filter(t => t.status === 'activated').length;
        const printPercentage = totalTests > 0 ? Math.round((printedTests / totalTests) * 100) : 0;
        
        // Determine print status
        let printStatus = 'not_printed';
        if (printedTests > 0) {
            printStatus = printedTests === totalTests ? 'fully_printed' : 'partially_printed';
        }

        res.json({
            success: true,
            data: {
                batch_info: {
                    batch_id: batchId,
                    total_tests: totalTests,
                    printed_tests: printedTests,
                    activated_tests: activatedTests,
                    print_status: printStatus,
                    print_percentage: printPercentage,
                    batch_size: totalTests,
                    created_date: tests.length > 0 ? tests[0].created_date : null,
                    last_printed_date: null, // Will be null for now
                    batch_notes: tests.length > 0 ? tests[0].notes : null
                },
                test_ids: tests.map(test => ({
                    test_id: test.test_id,
                    is_printed: test.is_printed,
                    is_activated: test.is_activated,
                    created_date: test.created_date
                })),
                print_history: [] // Empty for now
            }
        });
    } catch (error) {
        console.error('Error fetching batch details:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch batch details' 
        });
    }
});

app.get('/api/admin/print-history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        
        // Query for batches that have been printed
        const [printHistory] = await db.execute(`
            SELECT DISTINCT
                batch_id,
                MIN(printed_date) as first_printed_date,
                MAX(printed_date) as last_printed_date,
                COUNT(*) as test_count,
                SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END) as printed_count
            FROM nad_test_ids 
            WHERE is_printed = 1 AND printed_date IS NOT NULL
            GROUP BY batch_id
            ORDER BY MAX(printed_date) DESC
            LIMIT ?
        `, [limit]);
        
        // Format the history data
        const formattedHistory = printHistory.map(entry => {
            const batchShortId = entry.batch_id.split('-').pop();
            return {
                batch_id: entry.batch_id,
                batch_short_id: batchShortId,
                printed_date: entry.last_printed_date,
                first_printed_date: entry.first_printed_date,
                test_count: entry.test_count,
                printed_count: entry.printed_count,
                print_format: 'individual_labels', // Default format for now
                printer_name: 'Generic Printer',
                print_job_id: `PJ-${entry.batch_id}-${Date.now()}`,
                notes: `Batch ${batchShortId} - ${entry.printed_count} tests printed`,
                printed_by: 'Admin'
            };
        });
        
        res.json({
            success: true,
            data: formattedHistory,
            total: formattedHistory.length,
            message: formattedHistory.length > 0 ? 
                `Found ${formattedHistory.length} print history entries` : 
                'No print history found'
        });
        
    } catch (error) {
        console.error('Error fetching print history:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch print history',
            details: error.message
        });
    }
});

app.post('/api/admin/print-batch', async (req, res) => {
    try {
        const { batch_id, print_format, printer_name, notes } = req.body;
        
        if (!batch_id) {
            return res.status(400).json({
                success: false,
                error: 'Batch ID is required'
            });
        }
        
        if (!print_format) {
            return res.status(400).json({
                success: false,
                error: 'Print format is required'
            });
        }
        
        // Get all tests for this batch
        const [tests] = await db.execute(`
            SELECT test_id, is_printed
            FROM nad_test_ids
            WHERE batch_id = ?
            ORDER BY test_id
        `, [batch_id]);
        
        if (tests.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Batch not found or has no tests'
            });
        }
        
        // Generate print job ID
        const printJobId = `PJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create print data based on format
        let printData = {};
        const batchShortId = batch_id.split('-').pop();
        
        switch (print_format) {
            case 'individual_labels':
                printData = {
                    print_format: 'individual_labels',
                    batch_id: batch_id,
                    labels: tests.map(test => ({
                        test_id: test.test_id,
                        batch_short_id: batchShortId
                    }))
                };
                break;
                
            case 'batch_summary':
                printData = {
                    print_format: 'batch_summary',
                    batch_id: batch_id,
                    summary_title: `Batch Summary - ${batchShortId}`,
                    test_count: tests.length,
                    test_ids: tests.map(t => t.test_id)
                };
                break;
                
            case 'shipping_list':
                printData = {
                    print_format: 'shipping_list',
                    batch_id: batch_id,
                    checklist_title: `Shipping Checklist - ${batchShortId}`,
                    total_items: tests.length,
                    items: tests.map(test => ({
                        test_id: test.test_id,
                        is_printed: test.is_printed
                    }))
                };
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid print format'
                });
        }
        
        // Mark tests as printed (simulate printing)
        await db.execute(`
            UPDATE nad_test_ids 
            SET is_printed = 1, printed_date = NOW()
            WHERE batch_id = ?
        `, [batch_id]);
        
        // Debug: Check final print status after update
        const [finalCheck] = await db.execute(`
            SELECT 
                batch_id,
                COUNT(*) as total_tests,
                SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END) as printed_tests,
                COUNT(*) - SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END) as unprinted_tests
            FROM nad_test_ids 
            WHERE batch_id = ?
        `, [batch_id]);
        
        console.log(`🖨️ Batch ${batch_id} print status:`, finalCheck[0]);
        
        // Return success response
        res.json({
            success: true,
            message: 'Print job created successfully',
            data: {
                print_job_id: printJobId,
                batch_id: batch_id,
                debug: finalCheck[0],
                print_format: print_format,
                printer_name: printer_name || 'default',
                test_count: tests.length,
                notes: notes,
                print_data: printData,
                created_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error creating print job:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create print job',
            details: error.message
        });
    }
});

// Debug endpoint to check batch print status
app.get('/api/admin/debug-batch/:batchId', async (req, res) => {
    try {
        const { batchId } = req.params;
        
        // Get detailed batch info
        const [batchInfo] = await db.execute(`
            SELECT 
                test_id,
                batch_id,
                status,
                is_printed,
                printed_date,
                created_date
            FROM nad_test_ids 
            WHERE batch_id = ?
            ORDER BY test_id
        `, [batchId]);
        
        let batchListData = null;
        let allBatchIds = [];
        
        try {
            // Also check what the batch list query shows
            const [batchListResult] = await db.execute(`
                SELECT 
                    batch_id,
                    COUNT(*) as test_count,
                    MIN(created_date) as created_date,
                    MAX(notes) as batch_notes,
                    GROUP_CONCAT(test_id ORDER BY test_id SEPARATOR ', ') as all_test_ids,
                    SUM(CASE WHEN status = 'activated' THEN 1 ELSE 0 END) as activated_count,
                    SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END) as printed_count
                FROM nad_test_ids
                WHERE batch_id = ?
                GROUP BY batch_id
            `, [batchId]);
            batchListData = batchListResult[0] || null;
            
            // Check if batch exists with any case variations
            const [similarResult] = await db.execute(`
                SELECT DISTINCT batch_id, COUNT(*) as count
                FROM nad_test_ids 
                WHERE batch_id LIKE ?
                GROUP BY batch_id
            `, [`%${batchId}%`]);
            allBatchIds = similarResult;
        } catch (queryError) {
            console.error('Error in debug queries:', queryError);
        }
        
        const totalTests = batchInfo.length;
        const printedTests = batchInfo.filter(t => t.is_printed === 1).length;
        const unprintedTests = batchInfo.filter(t => t.is_printed === 0).length;
        
        res.json({
            success: true,
            batch_id: batchId,
            summary: {
                total_tests: totalTests,
                printed_tests: printedTests,
                unprinted_tests: unprintedTests,
                status: printedTests === 0 ? 'not_printed' : 
                       printedTests === totalTests ? 'fully_printed' : 'partially_printed'
            },
            batch_list_data: batchListData,
            similar_batch_ids: allBatchIds,
            tests: batchInfo
        });
        
    } catch (error) {
        console.error('Error debugging batch:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to debug batch',
            details: error.message
        });
    }
});

// ============================================================================
// CUSTOMER PORTAL ENDPOINTS  
// ============================================================================

app.post('/api/customer/verify-test', async (req, res) => {
    try {
        const { testId, email, firstName, lastName } = req.body;
        
        if (!testId) {
            return res.status(400).json({
                success: false,
                error: 'Test ID is required'
            });
        }
        
        console.log(`🔍 Customer verification attempt for test ID: ${testId}`);
        
        // Check if test exists
        const [testRows] = await db.execute(`
            SELECT test_id, status, activated_date, customer_id, batch_id
            FROM nad_test_ids 
            WHERE UPPER(test_id) = UPPER(?)
        `, [testId]);
        
        if (testRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Test ID not found. Please verify the test ID is correct.'
            });
        }
        
        const test = testRows[0];
        
        if (test.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `This test has already been ${test.status}.`,
                activatedDate: test.activated_date
            });
        }
        
        console.log(`✅ Test ${testId} verified successfully`);
        
        // Return success with test data (but don't activate yet)
        res.json({
            success: true,
            message: 'Test verified successfully!',
            data: {
                test_id: testId,
                customer_id: test.customer_id,
                batch_id: test.batch_id,
                verified_date: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error verifying test:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again.',
            details: error.message
        });
    }
});

app.post('/api/customer/activate-test', async (req, res) => {
    try {
        const { testId, email, firstName, lastName, supplements } = req.body;
        
        if (!testId) {
            return res.status(400).json({
                success: false,
                error: 'Test ID is required'
            });
        }
        
        // Normalize customer_id (use email from request or authentication)
        let customerId = null;
        if (email) {
            customerId = normalizeCustomerId(email);
        } else if (req.user && req.user.customer_id) {
            customerId = req.user.customer_id; // From Multipass authentication
        }
        
        console.log(`🔍 Customer activation attempt for test ID: ${testId}`);
        
        // Check if test exists and is not already activated
        const [testRows] = await db.execute(`
            SELECT test_id, status, activated_date, customer_id, batch_id
            FROM nad_test_ids 
            WHERE UPPER(test_id) = UPPER(?)
        `, [testId]);
        
        if (testRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Test ID not found. Please verify the test ID is correct.'
            });
        }
        
        const test = testRows[0];
        
        if (test.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `This test has already been ${test.status}.`,
                activatedDate: test.activated_date
            });
        }
        
        // Activate the test and update customer_id if provided
        let updateQuery = `
            UPDATE nad_test_ids 
            SET status = 'activated', activated_date = NOW()`;
        let updateParams = [];
        
        if (customerId) {
            updateQuery += `, customer_id = ?`;
            updateParams.push(customerId);
        }
        
        updateQuery += ` WHERE UPPER(test_id) = UPPER(?)`;
        updateParams.push(testId);
        
        const [result] = await db.execute(updateQuery, updateParams);
        
        if (result.affectedRows === 0) {
            return res.status(500).json({
                success: false,
                error: 'Failed to activate test. Please try again.'
            });
        }
        
        // Store supplement data if provided
        if (supplements) {
            try {
                const supplementsJson = JSON.stringify(supplements);
                const customerIdToUse = customerId || test.customer_id;
                
                console.log(`💾 Storing supplement data for ${testId}:`, {
                    testId,
                    customerId: customerIdToUse,
                    supplementsJson: supplementsJson.substring(0, 200), // First 200 chars
                    supplementsLength: supplementsJson.length
                });
                
                await db.execute(`
                    INSERT INTO nad_user_supplements (
                        test_id, customer_id, supplements_with_dose, habits_notes, created_at
                    ) VALUES (?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE
                    supplements_with_dose = VALUES(supplements_with_dose)
                `, [testId, customerIdToUse, supplementsJson, '']);
                
                console.log(`✅ Supplement data stored successfully for test ${testId}`);
                
                // Verify the data was stored
                const [verifyRows] = await db.execute(`
                    SELECT test_id, customer_id, supplements_with_dose 
                    FROM nad_user_supplements 
                    WHERE UPPER(test_id) = UPPER(?) AND customer_id = ?
                `, [testId, customerIdToUse]);
                
                console.log(`🔍 Verification query result for ${testId}:`, {
                    rowCount: verifyRows.length,
                    data: verifyRows[0] ? {
                        test_id: verifyRows[0].test_id,
                        customer_id: verifyRows[0].customer_id,
                        supplements_length: verifyRows[0].supplements_with_dose?.length || 0
                    } : null
                });
                
            } catch (supplementError) {
                console.error(`❌ Error storing supplement data for ${testId}:`, supplementError);
                // Don't fail the activation if supplement storage fails
            }
        }
        
        console.log(`✅ Test ${testId} activated successfully`);
        
        // Return success with test data
        res.json({
            success: true,
            message: 'Test activated successfully with supplement information!',
            data: {
                test_id: testId,
                customer_id: customerId || test.customer_id,
                batch_id: test.batch_id,
                activated_date: new Date().toISOString(),
                supplements_recorded: supplements ? true : false
            }
        });
        
    } catch (error) {
        console.error('Error activating test:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again.',
            details: error.message
        });
    }
});

// ============================================================================
// CUSTOMER PORTAL ENDPOINTS  
// ============================================================================

app.get('/api/customer/test-history', async (req, res) => {
    try {
        // Extract customer_id from Multipass authentication or request
        let customerId = null;
        if (req.user && req.user.customer_id) {
            customerId = req.user.customer_id; // From Multipass authentication
        } else if (req.query.customer_id) {
            customerId = normalizeCustomerId(req.query.customer_id);
        } else {
            return res.status(400).json({
                success: false,
                error: 'Customer authentication required'
            });
        }

        console.log(`🔍 Loading test history for customer: ${customerId}`);

        // Get all tests for this customer with related data
        const [tests] = await db.execute(`
            SELECT 
                ti.test_id,
                ti.status,
                ti.batch_id,
                ti.created_date,
                ti.activated_date,
                ti.customer_id,
                ts.score,
                ts.score_submission_date as score_date,
                ts.technician_id,
                us.supplements_with_dose,
                (ts.score IS NOT NULL) as has_score,
                (us.supplements_with_dose IS NOT NULL) as has_supplements
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id  
            LEFT JOIN nad_user_supplements us ON ti.test_id = us.test_id
            WHERE ti.customer_id = ? 
            ORDER BY ti.created_date DESC
        `, [customerId]);

        // Parse supplement data and create response
        const testsWithSupplements = tests.map(test => {
            let supplements = [];
            if (test.supplements_with_dose) {
                try {
                    // Handle both JSON format and string format
                    if (test.supplements_with_dose.startsWith('{')) {
                        // JSON format from new customer portal
                        const supplementData = JSON.parse(test.supplements_with_dose);
                        if (supplementData.selected && Array.isArray(supplementData.selected)) {
                            supplements = supplementData.selected.map(s => ({
                                name: s.name,
                                amount: s.amount,
                                unit: s.unit
                            }));
                        }
                    } else {
                        // String format from existing system (e.g., "NAD+ Precursor: 250 mg; Vitamin D3: 2000 IU")
                        const supplementEntries = test.supplements_with_dose.split(';').map(s => s.trim());
                        supplements = supplementEntries.map(entry => {
                            const parts = entry.split(':').map(p => p.trim());
                            if (parts.length === 2) {
                                const name = parts[0];
                                const amountParts = parts[1].split(' ');
                                const amount = parseFloat(amountParts[0]) || 0;
                                const unit = amountParts.slice(1).join(' ') || 'unit';
                                return { name, amount, unit };
                            }
                            return { name: entry, amount: 0, unit: 'unit' };
                        });
                    }
                } catch (e) {
                    console.warn('Error parsing supplement data for test', test.test_id, e);
                }
            }

            return {
                test_id: test.test_id,
                status: test.status,
                batch_id: test.batch_id,
                created_date: test.created_date,
                activated_date: test.activated_date,
                score: test.score,
                score_date: test.score_date,
                supplements: supplements,
                has_score: Boolean(test.has_score),
                has_supplements: Boolean(test.has_supplements)
            };
        });

        // Calculate summary statistics
        const summary = {
            total_tests: tests.length,
            completed_tests: tests.filter(t => t.status === 'completed').length,
            activated_tests: tests.filter(t => t.status === 'activated').length,
            pending_tests: tests.filter(t => t.status === 'pending').length
        };

        // Extract customer name from email (simple approach)
        const customerName = customerId.includes('@') 
            ? customerId.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            : 'Customer';

        console.log(`✅ Found ${tests.length} tests for customer ${customerId}`);

        res.json({
            success: true,
            customer_id: customerId,
            customer_name: customerName,
            tests: testsWithSupplements,
            summary: summary
        });

    } catch (error) {
        console.error('Error fetching customer test history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load test history',
            details: error.message
        });
    }
});

// Create sample test data for john.doe@example.com (for chart testing)
app.post('/api/customer/create-sample-data', async (req, res) => {
    try {
        const customerId = 'john.doe@example.com';
        
        // Check if sample data already exists
        const [existing] = await db.execute(
            'SELECT COUNT(*) as count FROM nad_test_ids WHERE customer_id = ?',
            [customerId]
        );
        
        if (existing[0].count > 0) {
            return res.json({
                success: false,
                message: 'Sample data already exists for john.doe@example.com'
            });
        }
        
        // Create sample test data
        const sampleTests = [
            {
                test_id: '2024-01-15-12345',
                status: 'completed',
                batch_id: 'BATCH001',
                score: 7.2,
                score_date: '2024-01-20 10:30:00'
            },
            {
                test_id: '2024-03-22-12346',
                status: 'completed', 
                batch_id: 'BATCH002',
                score: 8.1,
                score_date: '2024-03-25 14:15:00'
            },
            {
                test_id: '2024-06-10-12347',
                status: 'completed',
                batch_id: 'BATCH003', 
                score: 8.7,
                score_date: '2024-06-15 09:45:00'
            },
            {
                test_id: '2024-09-01-12348',
                status: 'completed',
                batch_id: 'BATCH004',
                score: 9.3,
                score_date: '2024-09-05 16:20:00'
            }
        ];
        
        // Insert test records
        for (const test of sampleTests) {
            await db.execute(
                `INSERT INTO nad_test_ids (test_id, customer_id, status, batch_id, created_date, activated_date)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [test.test_id, customerId, test.status, test.batch_id, test.score_date, test.score_date]
            );
            
            // Insert score records
            await db.execute(
                `INSERT INTO nad_test_scores (test_id, score, score_submission_date, technician_id)
                 VALUES (?, ?, ?, ?)`,
                [test.test_id, test.score, test.score_date, 'system']
            );
        }
        
        res.json({
            success: true,
            message: `Created ${sampleTests.length} sample tests for ${customerId}`,
            tests_created: sampleTests.length
        });
        
    } catch (error) {
        console.error('Error creating sample data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create sample data',
            details: error.message
        });
    }
});

app.get('/api/customer/test-detail/:testId', async (req, res) => {
    try {
        const { testId } = req.params;
        
        // Extract customer_id from Multipass authentication
        let customerId = null;
        if (req.user && req.user.customer_id) {
            customerId = req.user.customer_id;
        } else if (req.query.customer_id) {
            customerId = normalizeCustomerId(req.query.customer_id);
        } else {
            return res.status(400).json({
                success: false,
                error: 'Customer authentication required'
            });
        }

        console.log(`🔍 Loading test detail for ${testId}, customer: ${customerId}`);
        
        // Debug: Log database query parameters
        console.log('📊 Query params:', { testId, customerId });

        // Get detailed test information
        const [testRows] = await db.execute(`
            SELECT 
                ti.test_id,
                ti.customer_id,
                ti.status,
                ti.batch_id,
                ti.batch_size,
                ti.created_date,
                ti.activated_date,
                ti.shipping_status,
                ti.shipped_date,
                ti.notes as test_notes,
                ts.score,
                ts.score_submission_date,
                ts.technician_id,
                ts.notes as technician_notes,
                ts.image,
                us.supplements_with_dose,
                us.habits_notes
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
            LEFT JOIN nad_user_supplements us ON ti.test_id = us.test_id  
            WHERE UPPER(ti.test_id) = UPPER(?) AND ti.customer_id = ?
        `, [testId, customerId]);

        if (testRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Test not found or access denied'
            });
        }

        const test = testRows[0];
        
        // Debug: Log what we retrieved from database
        console.log(`📋 Raw database result for ${testId}:`, {
            supplements_with_dose: test.supplements_with_dose,
            supplements_type: typeof test.supplements_with_dose,
            supplements_length: test.supplements_with_dose?.length || 0,
            habits_notes: test.habits_notes,
            status: test.status,
            all_fields: Object.keys(test)
        });

        // Parse supplement data - return complete structure
        let supplementsData = {
            selected: [],
            other: '',
            health_conditions: ''
        };
        
        console.log(`🔍 Checking supplements_with_dose for ${testId}:`, {
            is_null: test.supplements_with_dose === null,
            is_empty_string: test.supplements_with_dose === '',
            is_undefined: test.supplements_with_dose === undefined,
            actual_value: test.supplements_with_dose
        });
        
        if (test.supplements_with_dose) {
            console.log(`✅ Found supplement data for ${testId}, processing...`);
            try {
                // Handle both JSON format and string format
                if (test.supplements_with_dose.startsWith('{')) {
                    // JSON format from new customer portal
                    const supplementData = JSON.parse(test.supplements_with_dose);
                    console.log(`📋 Parsed supplement data for ${testId}:`, supplementData);
                    
                    supplementsData = {
                        selected: supplementData.selected || [],
                        other: supplementData.other || '',
                        health_conditions: supplementData.health_conditions || ''
                    };
                } else {
                    // String format from existing system (e.g., "NAD+ Precursor: 250 mg; Vitamin D3: 2000 IU")
                    const supplementEntries = test.supplements_with_dose.split(';').map(s => s.trim());
                    supplementsData.selected = supplementEntries.map(entry => {
                        const parts = entry.split(':').map(p => p.trim());
                        if (parts.length === 2) {
                            const name = parts[0];
                            const amountParts = parts[1].split(' ');
                            const amount = parseFloat(amountParts[0]) || 0;
                            const unit = amountParts.slice(1).join(' ') || 'unit';
                            return { name, amount, unit };
                        }
                        return { name: entry, amount: 0, unit: 'unit' };
                    });
                }
            } catch (e) {
                console.warn('Error parsing supplement data for test', testId, e);
            }
        } else {
            console.log(`❌ No supplement data found for ${testId} - supplements_with_dose is null/empty`);
        }

        // Create timeline events
        const timeline = [];
        if (test.created_date) {
            timeline.push({ event: 'Test Created', date: test.created_date });
        }
        if (test.activated_date) {
            timeline.push({ event: 'Test Activated', date: test.activated_date });
        }
        if (test.shipped_date) {
            timeline.push({ event: 'Test Shipped', date: test.shipped_date });
        }
        if (test.score_submission_date) {
            timeline.push({ event: 'Lab Processing', date: test.score_submission_date });
            timeline.push({ event: 'Results Available', date: test.score_submission_date });
        }

        // Sort timeline by date
        timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

        const detailedTest = {
            test_id: test.test_id,
            customer_id: test.customer_id,
            status: test.status,
            batch_id: test.batch_id,
            batch_size: test.batch_size,
            created_date: test.created_date,
            activated_date: test.activated_date,
            score: test.score,
            score_date: test.score_submission_date,
            technician_id: test.technician_id,
            technician_notes: test.technician_notes,
            test_notes: test.test_notes,
            image: test.image,
            supplements: supplementsData, // Return complete supplement structure
            health_conditions: supplementsData.health_conditions, // Keep for backward compatibility
            habits_notes: test.habits_notes,
            shipping_status: test.shipping_status,
            shipped_date: test.shipped_date,
            timeline: timeline
        };
        
        console.log(`✅ Returning test detail for ${testId} with supplements:`, {
            selected: supplementsData.selected?.length || 0,
            other: supplementsData.other || 'none',
            health_conditions: supplementsData.health_conditions || 'none'
        });

        console.log(`✅ Test detail loaded for ${testId}`);
        
        // Debug: Log what we're sending in the response
        console.log(`📤 API Response for ${testId}:`, {
            supplements_structure: typeof detailedTest.supplements,
            supplements_content: detailedTest.supplements
        });

        res.json({
            success: true,
            test: detailedTest
        });

    } catch (error) {
        console.error('Error fetching test detail:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load test details',
            details: error.message
        });
    }
});

app.post('/api/batch/activate-tests', async (req, res) => {
    try {
        const { customer_ids, test_ids } = req.body;
        let affectedRows = 0;
        
        if (customer_ids && Array.isArray(customer_ids) && customer_ids.length > 0) {
            const placeholders = customer_ids.map(() => '?').join(',');
            const [result] = await db.execute(`
                UPDATE nad_test_ids 
                SET status = 'activated', activated_date = NOW()
                WHERE customer_id IN (${placeholders}) AND status = 'pending'
            `, customer_ids);
            affectedRows += result.affectedRows;
        }
        
        if (test_ids && Array.isArray(test_ids) && test_ids.length > 0) {
            const placeholders = test_ids.map(() => '?').join(',');
            const [result] = await db.execute(`
                UPDATE nad_test_ids 
                SET status = 'activated', activated_date = NOW()
                WHERE test_id IN (${placeholders}) AND status = 'pending'
            `, test_ids);
            affectedRows += result.affectedRows;
        }
        
        res.json({
            success: true,
            message: `Activated ${affectedRows} tests`,
            activated_count: affectedRows
        });
    } catch (error) {
        console.error('Error in batch activation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// NOTIFICATION ENDPOINTS
// ============================================================================

app.get('/api/notifications', async (req, res) => {
    try {
        const notifications = [];
        
        // Check for pending tests
        const [pendingTests] = await db.execute(`
            SELECT COUNT(*) as count FROM nad_test_ids WHERE status = 'activated' 
            AND test_id NOT IN (SELECT test_id FROM nad_test_scores)
        `);
        
        if (pendingTests[0].count > 0) {
            notifications.push({
                type: 'info',
                title: 'Pending Tests',
                message: `${pendingTests[0].count} tests are waiting for lab processing`,
                count: pendingTests[0].count
            });
        }
        
        // Check for tests created today
        const [todayTests] = await db.execute(`
            SELECT COUNT(*) as count FROM nad_test_ids WHERE DATE(created_date) = CURDATE()
        `);
        
        if (todayTests[0].count > 0) {
            notifications.push({
                type: 'success',
                title: 'New Tests Today',
                message: `${todayTests[0].count} new tests were created today`,
                count: todayTests[0].count
            });
        }
        
        // Check for unactivated tests older than 7 days
        const [oldTests] = await db.execute(`
            SELECT COUNT(*) as count FROM nad_test_ids 
            WHERE status = 'pending' AND created_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        `);
        
        if (oldTests[0].count > 0) {
            notifications.push({
                type: 'warning',
                title: 'Old Unactivated Tests',
                message: `${oldTests[0].count} tests have been unactivated for over 7 days`,
                count: oldTests[0].count
            });
        }
        
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// LOG CONFIGURATION ENDPOINTS (must be before 404 handler)
// ============================================================================

// DEPLOYMENT TEST - This should appear if new code is deployed
app.get('/api/deployment-test', (req, res) => {
    res.json({
        success: true,
        message: 'NEW CODE DEPLOYED SUCCESSFULLY!',
        timestamp: new Date().toISOString(),
        commit: '70eacea-fixed',
        nodeVersion: process.version,
        uptime: process.uptime(),
        pid: process.pid
    });
});

app.get('/api/deployment-info', async (req, res) => {
    try {
        const { execSync } = require('child_process');
        const path = require('path');
        
        // Get current deployed commit hash
        let deployedCommit = 'unknown';
        let deployedDate = 'unknown';
        let deployedBranch = 'unknown';
        let gitError = null;
        let workingDirectory = process.cwd();
        
        try {
            const fs = require('fs');
            
            // First try to read deployment info from a file created during deployment
            const possibleDeploymentFiles = [
                '/opt/nad-app/deployment-info.json',
                path.join(process.cwd(), 'deployment-info.json'),
                '/opt/bitnami/apache/htdocs/deployment-info.json'
            ];
            
            let deploymentFileFound = false;
            for (const filePath of possibleDeploymentFiles) {
                try {
                    if (fs.existsSync(filePath)) {
                        const deploymentInfo = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        deployedCommit = deploymentInfo.commit || 'unknown';
                        deployedDate = deploymentInfo.date || 'unknown';
                        deployedBranch = deploymentInfo.branch || 'unknown';
                        workingDirectory = path.dirname(filePath);
                        deploymentFileFound = true;
                        break;
                    }
                } catch (fileError) {
                    // Continue to next file
                }
            }
            
            if (!deploymentFileFound) {
                // Fallback: try git commands in case server has git repos
                const possibleDirs = [
                    process.cwd(),
                    path.join(process.cwd(), '..'),
                    '/opt/nad-app',
                    '/opt/bitnami/apache/htdocs'
                ];
                
                let gitWorked = false;
                let dirErrors = [];
                
                for (const dir of possibleDirs) {
                    try {
                        if (!fs.existsSync(dir)) {
                            dirErrors.push(`${dir}: Directory does not exist`);
                            continue;
                        }
                        
                        if (!fs.existsSync(path.join(dir, '.git'))) {
                            dirErrors.push(`${dir}: Not a git repository (.git not found)`);
                            continue;
                        }
                        
                        // Try git commands
                        deployedCommit = execSync('git rev-parse HEAD', { 
                            encoding: 'utf8', 
                            cwd: dir 
                        }).trim().substring(0, 7);
                        deployedDate = execSync('git log -1 --format=%ci', { 
                            encoding: 'utf8', 
                            cwd: dir 
                        }).trim();
                        deployedBranch = execSync('git rev-parse --abbrev-ref HEAD', { 
                            encoding: 'utf8', 
                            cwd: dir 
                        }).trim();
                        workingDirectory = dir;
                        gitWorked = true;
                        break;
                    } catch (dirError) {
                        dirErrors.push(`${dir}: ${dirError.message}`);
                        continue;
                    }
                }
                
                if (!gitWorked) {
                    gitError = `No deployment-info.json file found and git commands failed. Deploy directories are not git repositories - this is expected. Add deployment-info.json creation to deploy.sh script.`;
                }
            }
        } catch (error) {
            gitError = error.message;
            req.logger?.warn('Git commands failed in deployment-info', { 
                error: error.message,
                workingDir: workingDirectory 
            });
        }
        
        res.json({
            success: true,
            deployment: {
                commit: deployedCommit,
                date: deployedDate,
                branch: deployedBranch,
                serverTime: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                workingDirectory: workingDirectory,
                gitError: gitError
            }
        });
    } catch (error) {
        req.logger?.error('Deployment info request failed', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get deployment information'
        });
    }
});

// ERROR LOGGING TEST - This should force an error for testing
app.get('/api/test-error-logging', (req, res) => {
    try {
        req.logger.info('Testing error logging endpoint');
        
        // Force an error
        throw new Error('This is a test error for logging verification');
        
    } catch (error) {
        req.logger.error('Test error logged successfully', {
            endpoint: '/api/test-error-logging',
            error: error.message,
            stack: error.stack,
            testingPhase: 'error-logging-verification'
        });
        
        res.status(500).json({
            success: false,
            error: 'Test error created successfully',
            message: 'Check error.log for this entry',
            requestId: req.requestId
        });
    }
});

// Simple test endpoint to verify new code is deployed
app.get('/api/admin/test-logging', (req, res) => {
    res.json({
        success: true,
        message: 'Log management endpoints are active',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get current log configuration
app.get('/api/admin/log-config', (req, res) => {
    try {
        const config = getLogConfig();
        
        res.json({
            success: true,
            config: config,
            message: 'Current log configuration',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        req.logger.error('Error getting log configuration', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get log configuration: ' + error.message 
        });
    }
});

// Update log configuration
app.post('/api/admin/log-config', (req, res) => {
    try {
        const newConfig = req.body;
        req.logger.info('Log configuration update received', { config: newConfig });
        
        // Validate configuration
        if (newConfig.level && !['fatal', 'error', 'warn', 'info', 'debug', 'trace'].includes(newConfig.level)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid log level. Use: fatal, error, warn, info, debug, trace'
            });
        }
        
        // Update the configuration
        const updatedConfig = updateLogConfig(newConfig);
        
        res.json({
            success: true,
            config: updatedConfig,
            message: 'Log configuration updated successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        req.logger.error('Error updating log configuration', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update log configuration: ' + error.message 
        });
    }
});

// Get available log files
app.get('/api/admin/log-files', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const logsDir = path.join(__dirname, 'logs');
        
        if (!fs.existsSync(logsDir)) {
            return res.json({
                success: true,
                files: [],
                message: 'Log directory does not exist. File logging may be disabled.'
            });
        }
        
        const files = fs.readdirSync(logsDir)
            .filter(file => file.endsWith('.log'))
            .map(file => {
                const filePath = path.join(logsDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime.toISOString()
                };
            })
            .sort((a, b) => new Date(b.modified) - new Date(a.modified));
        
        res.json({
            success: true,
            files: files,
            count: files.length
        });
        
    } catch (error) {
        console.error('Error getting log files:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get log files: ' + error.message 
        });
    }
});

// Read log file contents (with pagination) - DISABLED: Duplicate of formatted version below
/*
app.get('/api/admin/log-files/:filename', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const { filename } = req.params;
        const { lines = 100, offset = 0 } = req.query;
        
        // Security: only allow .log files
        if (!filename.endsWith('.log') || filename.includes('..')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid filename. Only .log files are allowed.'
            });
        }
        
        const filePath = path.join(__dirname, 'logs', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Log file not found'
            });
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const allLines = content.split('\n');
        const startIndex = parseInt(offset) || 0;
        const endIndex = startIndex + (parseInt(lines) || 100);
        const requestedLines = allLines.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            filename: filename,
            lines: requestedLines,
            totalLines: allLines.length,
            startIndex: startIndex,
            endIndex: Math.min(endIndex, allLines.length)
        });
        
    } catch (error) {
        console.error('Error reading log file:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to read log file: ' + error.message 
        });
    }
});
*/

// Read log file contents (with pagination and pino-pretty formatting)
app.get('/api/admin/log-files/:filename', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const { Transform } = require('stream');
        const { filename } = req.params;
        const { lines = 100, offset = 0 } = req.query;
        
        // Security: only allow .log files
        if (!filename.endsWith('.log') || filename.includes('..')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid filename'
            });
        }
        
        const filePath = path.join(__dirname, 'logs', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Log file not found'
            });
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const allLines = content.split('\n').filter(line => line.trim());
        const startIndex = Math.max(0, allLines.length - parseInt(lines) - parseInt(offset));
        const endIndex = allLines.length - parseInt(offset);
        const logLines = allLines.slice(startIndex, endIndex);
        
        // Try to format Pino logs with pino-pretty
        let formattedCount = 0;
        const formattedLines = logLines.map(line => {
            if (!line.trim()) return line;
            
            try {
                // Check if line looks like JSON (Pino format)
                if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
                    const logObj = JSON.parse(line);
                    
                    // Verify this is actually a Pino log (has time and level)
                    if (!logObj.time || logObj.level === undefined) {
                        return line; // Not a Pino log, return as-is
                    }
                    
                    formattedCount++;
                    
                    // Create a readable format similar to pino-pretty
                    const timestamp = new Date(logObj.time).toLocaleString();
                    const level = getLevelName(logObj.level);
                    const msg = logObj.msg || logObj.message || '';
                    
                    // Build formatted line with color-like indicators
                    let formatted = `[${timestamp}] ${level.padEnd(5)}`;
                    
                    // Add context information
                    if (logObj.module) formatted += ` (${logObj.module})`;
                    if (logObj.method && logObj.path) {
                        formatted += ` ${logObj.method} ${logObj.path}`;
                    }
                    if (logObj.requestId) formatted += ` [${logObj.requestId}]`;
                    
                    // Add main message
                    if (msg) formatted += `: ${msg}`;
                    
                    // Add additional context fields
                    const excludeFields = ['time', 'level', 'msg', 'message', 'module', 'method', 'path', 'requestId', 'hostname', 'pid', 'name'];
                    const additionalFields = [];
                    
                    for (const [key, value] of Object.entries(logObj)) {
                        if (!excludeFields.includes(key)) {
                            if (typeof value === 'object') {
                                additionalFields.push(`${key}=${JSON.stringify(value)}`);
                            } else {
                                additionalFields.push(`${key}=${value}`);
                            }
                        }
                    }
                    
                    if (additionalFields.length > 0) {
                        formatted += ` (${additionalFields.join(', ')})`;
                    }
                    
                    return formatted;
                } else {
                    // Return non-JSON lines as-is (already formatted logs)
                    return line;
                }
            } catch (e) {
                // If JSON parsing fails, return original line
                return line;
            }
        });
        
        // Add debug information using proper logger
        req.logger.info('Log file processing debug', {
            filename,
            linesRead: logLines.length,
            formattedCount,
            sampleLine: logLines.length > 0 ? logLines[0].substring(0, 100) : null
        });
        
        res.json({
            success: true,
            filename: filename,
            lines: formattedLines,
            totalLines: allLines.length,
            formatted: formattedCount > 0,
            formattedCount: formattedCount,
            originalCount: logLines.length,
            debug: {
                sampleLine: logLines.length > 0 ? logLines[0].substring(0, 200) : null,
                isJson: logLines.length > 0 ? logLines[0].trim().startsWith('{') : false,
                firstLineFormatted: formattedCount > 0 ? formattedLines[0] : null,
                processingDetails: `Processed ${logLines.length} lines, formatted ${formattedCount} lines`
            }
        });
    } catch (error) {
        console.error('Error reading log file:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to read log file: ' + error.message 
        });
    }
});

// Helper function to convert Pino log levels to readable names
function getLevelName(level) {
    const levels = {
        10: 'TRACE',
        20: 'DEBUG', 
        30: 'INFO',
        40: 'WARN',
        50: 'ERROR',
        60: 'FATAL'
    };
    return levels[level] || 'UNKNOWN';
}

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
        available_endpoints: [
            'GET /health',
            'GET /api/dashboard/stats',
            'GET /api/supplements',
            'GET /api/tests/scores',
            'GET /api/analytics/overview',
            'GET /api/deployment-test',
            'GET /api/admin/log-config',
            'POST /api/admin/log-config',
            'GET /api/admin/log-files',
            'GET /api/admin/log-files/:filename'
        ]
    });
});

app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 10MB.'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint to check supplement data in database
app.get('/api/debug/supplements/:testId', async (req, res) => {
    try {
        const { testId } = req.params;
        
        console.log(`🔍 Debug: Checking supplement data for test ${testId}`);
        
        // Check nad_user_supplements table
        const [supplementRows] = await db.execute(`
            SELECT test_id, customer_id, supplements_with_dose, habits_notes, created_at, updated_at
            FROM nad_user_supplements 
            WHERE UPPER(test_id) = UPPER(?)
        `, [testId]);
        
        // Check nad_test_ids table
        const [testRows] = await db.execute(`
            SELECT test_id, customer_id, status, created_date, activated_date
            FROM nad_test_ids 
            WHERE UPPER(test_id) = UPPER(?)
        `, [testId]);
        
        console.log(`📊 Debug results for ${testId}:`, {
            supplement_records: supplementRows.length,
            test_records: testRows.length
        });
        
        res.json({
            success: true,
            testId: testId,
            supplement_records: supplementRows,
            test_records: testRows,
            debug_info: {
                supplement_count: supplementRows.length,
                test_count: testRows.length,
                has_supplement_data: supplementRows.length > 0 && supplementRows[0]?.supplements_with_dose !== null
            }
        });
    } catch (error) {
        console.error('Debug supplements error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================================================
// SERVER STARTUP AND SHUTDOWN
// ============================================================================
// LOG CONFIGURATION ENDPOINTS  
// ============================================================================

// Simple test endpoint to verify new code is deployed
app.get('/api/admin/test-logging', (req, res) => {
    res.json({
        success: true,
        message: 'Log management endpoints are active',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Basic log config endpoint without dependencies
app.get('/api/admin/log-config-simple', (req, res) => {
    try {
        res.json({
            success: true,
            config: {
                level: process.env.LOG_LEVEL || 'info',
                console: process.env.NODE_ENV !== 'production',
                files: { enabled: false },
                debug: { enabled: true, areas: ['analytics', 'supplements'] }
            },
            message: 'Basic log configuration (no dependencies)',
            usingFallback: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get current log configuration (simplified for debugging)
app.get('/api/admin/log-config', (req, res) => {
    try {
        // Simplified config without logger dependencies
        const config = {
            level: process.env.LOG_LEVEL || 'info',
            console: process.env.NODE_ENV !== 'production',
            files: { enabled: false, app: false, api: false, error: false, customer: false, admin: false },
            debug: { enabled: true, areas: ['analytics', 'supplements', 'batch-printing', 'exports'] }
        };
        
        res.json({
            success: true,
            config: config,
            message: 'Simplified logging (debugging mode)',
            usingFallback: true
        });
    } catch (error) {
        console.error('Error getting log configuration:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get log configuration: ' + error.message 
        });
    }
});

// Update log configuration (simplified)
app.post('/api/admin/log-config', (req, res) => {
    try {
        const newConfig = req.body;
        console.log('Log configuration update received:', newConfig);
        
        // Validate configuration
        if (newConfig.level && !['fatal', 'error', 'warn', 'info', 'debug', 'trace'].includes(newConfig.level)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid log level. Use: fatal, error, warn, info, debug, trace'
            });
        }
        
        // For now, just acknowledge the update without actually applying it
        res.json({
            success: true,
            config: newConfig,
            message: 'Log configuration received (debugging mode - not applied)'
        });
    } catch (error) {
        console.error('Error updating log configuration:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update log configuration: ' + error.message 
        });
    }
});

// Get available log files
app.get('/api/admin/log-files', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const logsDir = path.join(__dirname, 'logs');
        
        if (!fs.existsSync(logsDir)) {
            return res.json({
                success: true,
                files: [],
                message: 'Log directory does not exist. File logging may be disabled.'
            });
        }
        
        const files = fs.readdirSync(logsDir)
            .filter(file => file.endsWith('.log'))
            .map(file => {
                const filePath = path.join(logsDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime.toISOString()
                };
            })
            .sort((a, b) => new Date(b.modified) - new Date(a.modified));
            
        res.json({
            success: true,
            files: files
        });
    } catch (error) {
        console.error('Error getting log files:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get log files: ' + error.message 
        });
    }
});

// REMOVED: Duplicate endpoint moved above error handler

// Server status endpoint to verify restart
app.get('/api/admin/server-status', (req, res) => {
    // Test the formatting function directly
    const testLogLine = '{"level":30,"time":1705123456789,"pid":12345,"hostname":"server","msg":"Test message","module":"api","method":"GET","path":"/test","requestId":"req-123"}';
    let formattingWorks = false;
    let formattedSample = '';
    
    try {
        const logObj = JSON.parse(testLogLine);
        if (logObj.time && logObj.level !== undefined) {
            const timestamp = new Date(logObj.time).toLocaleString();
            const level = getLevelName(logObj.level);
            formattedSample = `[${timestamp}] ${level.padEnd(5)} (${logObj.module}) ${logObj.method} ${logObj.path} [${logObj.requestId}]: ${logObj.msg}`;
            formattingWorks = true;
        }
    } catch (e) {
        formattingWorks = false;
    }
    
    res.json({
        success: true,
        serverStartTime: new Date().toISOString(),
        pinoFormattingEnabled: true,
        version: 'v2.0-pino-formatting',
        formattingWorks: formattingWorks,
        formattedSample: formattedSample,
        message: 'Server has pino-pretty formatting enabled'
    });
});

// Test endpoint for pino formatting
app.get('/api/admin/test-pino-format', (req, res) => {
    const testLog = '{"level":30,"time":1705123456789,"pid":12345,"hostname":"server","msg":"Test message","module":"api","method":"GET","path":"/test","requestId":"req-123"}';
    
    try {
        const logObj = JSON.parse(testLog);
        const timestamp = new Date(logObj.time).toLocaleString();
        const level = getLevelName(logObj.level);
        const msg = logObj.msg || logObj.message || '';
        
        let formatted = `[${timestamp}] ${level.padEnd(5)}`;
        if (logObj.module) formatted += ` (${logObj.module})`;
        if (logObj.method && logObj.path) {
            formatted += ` ${logObj.method} ${logObj.path}`;
        }
        if (logObj.requestId) formatted += ` [${logObj.requestId}]`;
        if (msg) formatted += `: ${msg}`;
        
        res.json({
            success: true,
            original: testLog,
            formatted: formatted,
            timestamp: timestamp,
            level: level
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            original: testLog
        });
    }
});

// ============================================================================

async function startServer() {
    try {
        // Use process.stdout.write to ensure startup messages are visible
        process.stdout.write('🚀 Starting NAD server with pino-pretty formatting enabled...\n');
        process.stdout.write(`📅 Server start time: ${new Date().toISOString()}\n`);
        
        const dbConnected = await initializeDatabase();
        if (!dbConnected) {
            appLogger.fatal('Failed to connect to database. Exiting...');
            process.exit(1);
        }
        
        app.listen(PORT, () => {
            process.stdout.write('✅ NAD Server started successfully with pino-pretty formatting!\n');
            appLogger.info('NAD Test Cycle API Server Started - USER MANAGEMENT REMOVED - PINO-PRETTY ENABLED', {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                endpoints: {
                    health: `http://localhost:${PORT}/health`,
                    stats: `http://localhost:${PORT}/api/dashboard/stats`,
                    tests: `http://localhost:${PORT}/api/tests/scores`,
                    supplements: `http://localhost:${PORT}/api/supplements`,
                    analytics: `http://localhost:${PORT}/api/analytics/overview`
                },
                features: [
                    'User Management removed from backend',
                    'Shopify authentication middleware added',
                    'Analytics updated to remove user statistics',
                    'Export functionality updated to remove users'
                ]
            });
        });
        
    } catch (error) {
        appLogger.fatal('Failed to start server', { error: error.message, stack: error.stack });
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    appLogger.info('SIGTERM received, shutting down gracefully...');
    if (db) {
        await db.end();
        appLogger.info('Database connection closed');
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    appLogger.info('SIGINT received, shutting down gracefully...');
    if (db) {
        await db.end();
        appLogger.info('Database connection closed');
    }
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    appLogger.fatal('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    appLogger.fatal('Unhandled Rejection', { reason, promise });
    process.exit(1);
});

startServer();

// PUT endpoint for updating supplements
app.put('/api/supplements/:id', (req, res) => {
    console.log('✏️ Updating supplement:', req.params.id, req.body);
    
    const updatedSupplement = {
        id: parseInt(req.params.id),
        name: req.body.name,
        category: req.body.category,
        description: req.body.description,
        default_dose: req.body.default_dose,
        unit: req.body.unit || 'mg',
        is_active: req.body.is_active !== false,
        updated_at: new Date().toISOString()
    };
    
    res.json({
        success: true,
        message: 'Supplement updated successfully',
        data: updatedSupplement
    });
});
