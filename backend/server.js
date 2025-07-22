// users final
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// Initialize Pino logger
const { createLogger, requestLoggingMiddleware } = require('./logger');

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

// Request logging middleware (replaces the manual logging)
app.use(requestLoggingMiddleware);

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
        
        // Run customer_id migration to VARCHAR
        await migrateCustomerIdToVarchar();
        
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
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
        
        // First, get current state statistics
        const [beforeStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_tests,
                COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'activated' THEN 1 END) as activated,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN is_activated = 1 AND status != 'activated' AND status != 'completed' THEN 1 END) as mismatched
            FROM nad_test_ids
        `);
        
        console.log('📊 Before migration:', beforeStats[0]);
        
        // Step 1: Set status for NULL values based on is_activated
        const [nullUpdate] = await db.execute(`
            UPDATE nad_test_ids 
            SET status = CASE 
                WHEN is_activated = 1 THEN 'activated'
                ELSE 'pending'
            END
            WHERE status IS NULL
        `);
        console.log(`✅ Updated ${nullUpdate.affectedRows} NULL status values`);
        
        // Step 2: Fix completed tests (those with scores)
        const [completedUpdate] = await db.execute(`
            UPDATE nad_test_ids ti
            INNER JOIN nad_test_scores ts ON ti.test_id = ts.test_id
            SET ti.status = 'completed'
            WHERE ts.score IS NOT NULL 
            AND ti.status != 'completed'
        `);
        console.log(`✅ Updated ${completedUpdate.affectedRows} tests to completed status`);
        
        // Step 3: Fix activated tests (is_activated=1 but no score)
        const [activatedUpdate] = await db.execute(`
            UPDATE nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
            SET ti.status = 'activated'
            WHERE ti.is_activated = 1 
            AND ts.score IS NULL
            AND ti.status != 'activated'
        `);
        console.log(`✅ Updated ${activatedUpdate.affectedRows} tests to activated status`);
        
        // Step 4: Fix pending tests
        const [pendingUpdate] = await db.execute(`
            UPDATE nad_test_ids 
            SET status = 'pending'
            WHERE is_activated = 0 
            AND status != 'pending'
        `);
        console.log(`✅ Updated ${pendingUpdate.affectedRows} tests to pending status`);
        
        // Get final statistics
        const [afterStats] = await db.execute(`
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
        `);
        
        console.log('📊 After migration:', afterStats[0]);
        
        if (afterStats[0].still_mismatched > 0) {
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
        
        // Step 4: Validate migration
        console.log('🔧 Phase 3.4: Validating data integrity...');
        const validation = await validateCustomerIdMigration();
        
        if (validation.success) {
            console.log('✅ Customer ID migration to VARCHAR completed successfully!');
            return { success: true, validation };
        } else {
            throw new Error('Migration validation failed: ' + validation.error);
        }
        
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
        
        // Step 1: Verify column types
        const [columnTypes] = await db.execute(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND COLUMN_NAME = 'customer_id'
            ORDER BY TABLE_NAME
        `);
        
        console.log('🔍 Column types after migration:');
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
    try {
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
        
        res.json({
            success: true,
            stats: {
                total_tests: testStats[0].total_tests,
                activated_tests: testStats[0].activated_tests,
                pending_tests: testStats[0].pending_tests,
                completed_tests: completedTests[0].completed_tests
                // REMOVED: active_users: userStats[0].active_users
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// SHOPIFY WEBHOOK ENDPOINTS
// ============================================================================


// ============================================================================
// TEST MANAGEMENT ENDPOINTS
// ============================================================================

app.post('/api/tests/verify', async (req, res) => {
    try {
        const { test_id, email } = req.body;
        
        if (!test_id || !email) {
            return res.status(400).json({
                success: false,
                error: 'Test ID and email are required'
            });
        }
        
        const [testRows] = await db.execute(`
            SELECT ti.*, ts.score
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
            WHERE ti.test_id = ?
        `, [test_id]);
        
        if (testRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Test ID not found'
            });
        }
        
        const test = testRows[0];
        // Use the status field directly from the database
        const status = test.status || 'pending';
        
        res.json({
            success: true,
            test: {
                test_id: test.test_id,
                customer_id: test.customer_id,
                status: status,
                created_date: test.created_date,
                activated_date: test.activated_date,
                score: test.score
            }
        });
    } catch (error) {
        console.error('Error verifying test:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/tests/:testId/supplements', async (req, res) => {
    try {
        const testId = req.params.testId;
        const { supplements, habits_notes } = req.body;
        
        const [testRows] = await db.execute(`
            SELECT test_id, status, customer_id, batch_id, created_date, activated_date 
            FROM nad_test_ids WHERE test_id = ? AND status IN ('activated', 'completed')
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
            FROM nad_test_ids WHERE test_id = ?
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
    try {
        console.log('📡 GET /api/supplements - Loading all supplements');
        
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
        
        console.log(`✅ Found ${supplements.length} supplements`);
        
        res.json({
            success: true,
            supplements: supplements,
            count: supplements.length
        });
        
    } catch (error) {
        console.error('❌ Error loading supplements:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load supplements',
            message: error.message
        });
    }
});

// Create new supplement
app.post('/api/supplements', async (req, res) => {
    try {
        console.log('📡 POST /api/supplements - Creating supplement');
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

console.log('✅ Supplements API endpoints loaded');
console.log('✅ Supplement CRUD endpoints loaded (GET, POST, PUT, DELETE)');

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
            SELECT id, test_id, batch_id, activated_date 
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
                ti.activated_date
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
                SELECT score FROM nad_test_scores WHERE test_id = ?
            `, [testId]);
            
            const originalScore = original.length > 0 ? original[0].score : null;
            
            // Update the score in nad_test_scores
            await connection.execute(`
                UPDATE nad_test_scores 
                SET score = ?, 
                    technician_id = ?,
                    updated_date = NOW()
                WHERE test_id = ?
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
                WHERE test_id = ?
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

// Single test activation with enhanced logging
app.post('/api/admin/tests/:testId/activate', async (req, res) => {
    const startTime = Date.now();
    const testId = req.params.testId;
    
    console.log('🔧 ====================================');
    console.log('🔧 ACTIVATE ENDPOINT CALLED');
    console.log('🔧 ====================================');
    console.log('🔧 Timestamp:', new Date().toISOString());
    console.log('🔧 Test ID from params:', testId);
    console.log('🔧 Test ID type:', typeof testId);
    console.log('🔧 Test ID length:', testId ? testId.length : 'undefined');
    console.log('🔧 Request method:', req.method);
    safeLog('🔧 Request received for test activation');
    console.log('🔧 Request body:', req.body);
    console.log('🔧 Request query:', req.query);
    console.log('🔧 Request params:', req.params);
    
    try {
        if (!testId || testId.trim() === '') {
            console.log('❌ Test ID is empty or undefined');
            return res.status(400).json({ 
                success: false, 
                error: 'Test ID is required',
                received_testId: testId,
                testId_type: typeof testId
            });
        }
        
        console.log('📊 Checking if test exists in database...');
        const [existing] = await db.execute(`SELECT test_id, status FROM nad_test_ids WHERE test_id = ?`, [testId]);
        
        console.log('📊 Database query result:', existing);
        console.log('📊 Found tests:', existing.length);
        
        if (existing.length === 0) {
            console.log('❌ Test not found in database');
            return res.status(404).json({ 
                success: false, 
                error: 'Test not found',
                searched_testId: testId,
                query_result: existing
            });
        }
        
        const currentTest = existing[0];
        console.log('📊 Current test data:', currentTest);
        console.log('📊 Current status:', currentTest.status);
        
        if (currentTest.status !== 'pending') {
            console.log(`⚠️ Test is already ${currentTest.status}`);
            return res.json({ 
                success: true, 
                message: `Test is already ${currentTest.status}`,
                current_status: currentTest.status,
                test_data: currentTest
            });
        }
        
        console.log('📊 Updating test activation status...');
        const [updateResult] = await db.execute(`
            UPDATE nad_test_ids 
            SET status = 'activated', activated_date = NOW()
            WHERE test_id = ?
        `, [testId]);
        
        console.log('📊 Update result:', updateResult);
        console.log('📊 Affected rows:', updateResult.affectedRows);
        console.log('📊 Changed rows:', updateResult.changedRows);
        
        if (updateResult.affectedRows === 0) {
            console.log('❌ No rows were updated');
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to update test - no rows affected',
                update_result: updateResult
            });
        }
        
        // Verify the update
        console.log('📊 Verifying update...');
        const [verifyResult] = await db.execute(`SELECT test_id, status, activated_date FROM nad_test_ids WHERE test_id = ?`, [testId]);
        console.log('📊 Verification result:', verifyResult);
        
        const processingTime = Date.now() - startTime;
        console.log(`✅ Test ${testId} activated successfully in ${processingTime}ms`);
        
        res.json({ 
            success: true, 
            message: 'Test activated successfully',
            test_id: testId,
            processing_time_ms: processingTime,
            updated_test: verifyResult[0]
        });
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.log('❌ ====================================');
        console.log('❌ ACTIVATION ERROR');
        console.log('❌ ====================================');
        console.error('❌ Error activating test:', error);
        console.log('❌ Error name:', error.name);
        console.log('❌ Error message:', error.message);
        console.log('❌ Error stack:', error.stack);
        console.log('❌ Processing time:', processingTime + 'ms');
        
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

// Single test deactivation with enhanced logging
app.post('/api/admin/tests/:testId/deactivate', async (req, res) => {
    const startTime = Date.now();
    const testId = req.params.testId;
    
    console.log('🔧 ====================================');
    console.log('🔧 DEACTIVATE ENDPOINT CALLED');
    console.log('🔧 ====================================');
    console.log('🔧 Timestamp:', new Date().toISOString());
    console.log('🔧 Test ID from params:', testId);
    console.log('🔧 Test ID type:', typeof testId);
    console.log('🔧 Test ID length:', testId ? testId.length : 'undefined');
    console.log('🔧 Request method:', req.method);
    safeLog('🔧 Request received for test activation');
    console.log('🔧 Request body:', req.body);
    console.log('🔧 Request query:', req.query);
    console.log('🔧 Request params:', req.params);
    
    try {
        if (!testId || testId.trim() === '') {
            console.log('❌ Test ID is empty or undefined');
            return res.status(400).json({ 
                success: false, 
                error: 'Test ID is required',
                received_testId: testId,
                testId_type: typeof testId
            });
        }
        
        console.log('📊 Checking if test exists in database...');
        const [existing] = await db.execute(`SELECT test_id, status FROM nad_test_ids WHERE test_id = ?`, [testId]);
        
        console.log('📊 Database query result:', existing);
        console.log('📊 Found tests:', existing.length);
        
        if (existing.length === 0) {
            console.log('❌ Test not found in database');
            return res.status(404).json({ 
                success: false, 
                error: 'Test not found',
                searched_testId: testId,
                query_result: existing
            });
        }
        
        const currentTest = existing[0];
        console.log('📊 Current test data:', currentTest);
        console.log('📊 Current status:', currentTest.status);
        
        if (currentTest.status === 'pending') {
            console.log('⚠️ Test is already pending');
            return res.json({ 
                success: true, 
                message: 'Test is already deactivated',
                current_status: 'deactivated',
                test_data: currentTest
            });
        }
        
        console.log('📊 Updating test deactivation status...');
        const [updateResult] = await db.execute(`
            UPDATE nad_test_ids 
            SET status = 'pending', activated_date = NULL
            WHERE test_id = ?
        `, [testId]);
        
        console.log('📊 Update result:', updateResult);
        console.log('📊 Affected rows:', updateResult.affectedRows);
        console.log('📊 Changed rows:', updateResult.changedRows);
        
        if (updateResult.affectedRows === 0) {
            console.log('❌ No rows were updated');
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to update test - no rows affected',
                update_result: updateResult
            });
        }
        
        // Verify the update
        console.log('📊 Verifying update...');
        const [verifyResult] = await db.execute(`SELECT test_id, status, activated_date FROM nad_test_ids WHERE test_id = ?`, [testId]);
        console.log('📊 Verification result:', verifyResult);
        
        const processingTime = Date.now() - startTime;
        console.log(`✅ Test ${testId} deactivated successfully in ${processingTime}ms`);
        
        res.json({ 
            success: true, 
            message: 'Test deactivated successfully',
            test_id: testId,
            processing_time_ms: processingTime,
            updated_test: verifyResult[0]
        });
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.log('❌ ====================================');
        console.log('❌ DEACTIVATION ERROR');
        console.log('❌ ====================================');
        console.error('❌ Error deactivating test:', error);
        console.log('❌ Error name:', error.name);
        console.log('❌ Error message:', error.message);
        console.log('❌ Error stack:', error.stack);
        console.log('❌ Processing time:', processingTime + 'ms');
        
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
    try {
        const [basicStats] = await db.execute(`
            SELECT 
                COUNT(DISTINCT ti.test_id) as total_tests,
                COUNT(DISTINCT CASE WHEN ti.status = 'activated' THEN ti.test_id END) as activated_tests,
                COUNT(DISTINCT ts.test_id) as completed_tests,
                AVG(CAST(ts.score AS DECIMAL(10,2))) as average_score
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
        `);
        
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
        
        const [dailyStats] = await db.execute(`
            SELECT 
                DATE(score_submission_date) as date,
                COUNT(*) as completions
            FROM nad_test_scores 
            WHERE score_submission_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(score_submission_date)
            ORDER BY date ASC
        `);
        
        // REMOVED: User role statistics
        // const [roleStats] = await db.execute(`
        //     SELECT role, COUNT(*) as count
        //     FROM nad_user_roles 
        //     WHERE customer_id != 0
        //     GROUP BY role
        // `);
        
        res.json({
            success: true,
            analytics: {
                basic_stats: basicStats[0],
                score_distribution: scoreDistribution,
                daily_completions: dailyStats
                // REMOVED: user_roles: roleStats
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, error: error.message });
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
            const printedCount = batch.printed_count || 0;
            const totalTests = batch.test_count;
            
            // Determine print status
            let printStatus = 'not_printed';
            if (printedCount > 0) {
                printStatus = printedCount === totalTests ? 'fully_printed' : 'partially_printed';
            }
            
            return {
                batch_id: batch.batch_id,
                batch_size: batch.test_count,
                total_tests: totalTests,
                printed_tests: printedCount,
                print_status: printStatus,
                print_percentage: totalTests > 0 ? Math.round((printedCount / totalTests) * 100) : 0,
                sample_test_ids: testIds.slice(0, 3).join(', '),
                batch_notes: `${batch.test_count} tests - ${batch.activated_count} activated, ${batch.printed_count} printed`,
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
            SELECT test_id, created_date, status, is_printed
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
                    batch_notes: `${totalTests} tests - ${activatedTests} activated, ${printedTests} printed`
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
        
        // Return success response
        res.json({
            success: true,
            message: 'Print job created successfully',
            data: {
                print_job_id: printJobId,
                batch_id: batch_id,
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
            WHERE test_id = ?
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
            WHERE test_id = ?
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
        
        updateQuery += ` WHERE test_id = ?`;
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
                    WHERE test_id = ? AND customer_id = ?
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
            WHERE ti.test_id = ? AND ti.customer_id = ?
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
            'GET /api/analytics/overview'
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
            WHERE test_id = ?
        `, [testId]);
        
        // Check nad_test_ids table
        const [testRows] = await db.execute(`
            SELECT test_id, customer_id, status, created_date, activated_date
            FROM nad_test_ids 
            WHERE test_id = ?
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

// Get current log configuration
app.get('/api/admin/log-config', (req, res) => {
    try {
        const { getLogConfig } = require('./logger');
        const config = getLogConfig();
        
        res.json({
            success: true,
            config: config
        });
    } catch (error) {
        console.error('Error getting log configuration:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get log configuration: ' + error.message 
        });
    }
});

// Update log configuration
app.post('/api/admin/log-config', (req, res) => {
    try {
        const { updateLogConfig } = require('./logger');
        const newConfig = req.body;
        
        // Validate configuration
        if (newConfig.level && !['fatal', 'error', 'warn', 'info', 'debug', 'trace'].includes(newConfig.level)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid log level. Use: fatal, error, warn, info, debug, trace'
            });
        }
        
        const updatedConfig = updateLogConfig(newConfig);
        
        console.log('📋 Log configuration updated:', updatedConfig);
        
        res.json({
            success: true,
            config: updatedConfig,
            message: 'Log configuration updated successfully'
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
                files: []
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

// Read log file contents (with pagination)
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
        const allLines = content.split('\n');
        const startIndex = Math.max(0, allLines.length - parseInt(lines) - parseInt(offset));
        const endIndex = allLines.length - parseInt(offset);
        const logLines = allLines.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            filename: filename,
            lines: logLines,
            totalLines: allLines.length
        });
    } catch (error) {
        console.error('Error reading log file:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to read log file: ' + error.message 
        });
    }
});

// ============================================================================

async function startServer() {
    try {
        const dbConnected = await initializeDatabase();
        if (!dbConnected) {
            appLogger.fatal('Failed to connect to database. Exiting...');
            process.exit(1);
        }
        
        app.listen(PORT, () => {
            appLogger.info('NAD Test Cycle API Server Started - USER MANAGEMENT REMOVED', {
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
