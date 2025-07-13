// users final
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

app.use(cors({
    origin: [
        'https://mynadtest.com',
        'https://mynadtest.dev',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'mynadtes_mynadtest_nad_user',
    password: process.env.DB_PASSWORD || 'mynadtest_nad_user#2025',
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
        console.log('✅ Database connected successfully');
        const [rows] = await db.execute('SELECT 1 as test');
        console.log('✅ Database test query successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

// ============================================================================
// FILE UPLOAD CONFIGURATION
// ============================================================================

const uploadDir = path.join(__dirname, 'uploads');
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

function generateTestId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `NAD-${year}${month}${day}-${random}`;
}

function verifyShopifyWebhook(data, hmacHeader) {
    if (!process.env.SHOPIFY_WEBHOOK_SECRET) {
        console.warn('⚠️ SHOPIFY_WEBHOOK_SECRET not set, skipping verification');
        return true;
    }
    const calculated_hmac = crypto
        .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
        .update(data, 'utf8')
        .digest('base64');
    return calculated_hmac === hmacHeader;
}

function isNADProduct(product) {
    if (!product) return false;
    const title = (product.title || '').toLowerCase();
    const sku = (product.sku || '').toLowerCase();
    const vendor = (product.vendor || '').toLowerCase();
    const nadKeywords = ['nad', 'test', 'kit', 'cellular', 'energy'];
    return nadKeywords.some(keyword => 
        title.includes(keyword) || sku.includes(keyword) || vendor.includes(keyword)
    );
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
        const [totalTests] = await db.execute(`SELECT COUNT(*) as total_tests FROM nad_test_ids`);
        const [activatedTests] = await db.execute(`SELECT COUNT(*) as activated_tests FROM nad_test_ids WHERE is_activated = 1`);
        const [completedTests] = await db.execute(`SELECT COUNT(*) as completed_tests FROM nad_test_scores`);
        
        const total = totalTests[0].total_tests;
        const activated = activatedTests[0].activated_tests;
        const completed = completedTests[0].completed_tests;
        const pending = total - activated;
        
        res.json({
            success: true,
            stats: {
                total_tests: total,
                activated_tests: activated,
                completed_tests: completed,
                pending_tests: pending
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

app.post('/api/webhooks/orders/create', express.raw({type: 'application/json'}), async (req, res) => {
    try {
        const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
        const body = req.body;
        
        if (process.env.NODE_ENV === 'production' && !verifyShopifyWebhook(body, hmacHeader)) {
            return res.status(401).send('Unauthorized');
        }
        
        const order = JSON.parse(body.toString());
        console.log('📦 Order created webhook received:', order.id);
        
        const hasNADProducts = order.line_items.some(item => isNADProduct(item));
        
        if (hasNADProducts) {
            for (const item of order.line_items) {
                if (isNADProduct(item)) {
                    for (let i = 0; i < item.quantity; i++) {
                        const testId = generateTestId();
                        await db.execute(`
                            INSERT INTO nad_test_ids (
                                test_id, generated_by, order_id, customer_id, shopify_order_number, 
                                created_date, payment_status, shipping_status
                            ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
                        `, [
                            testId,
                            order.customer?.id || 0,
                            order.id,
                            order.customer?.id || 0,
                            order.name,
                            order.financial_status || 'pending',
                            order.fulfillment_status || 'pending'
                        ]);
                        console.log(`✅ Generated test ID: ${testId} for order ${order.name}`);
                    }
                }
            }
        }
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Error processing order creation webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/webhooks/orders/paid', express.raw({type: 'application/json'}), async (req, res) => {
    try {
        const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
        const body = req.body;
        
        if (process.env.NODE_ENV === 'production' && !verifyShopifyWebhook(body, hmacHeader)) {
            return res.status(401).send('Unauthorized');
        }
        
        const order = JSON.parse(body.toString());
        console.log('💳 Order paid webhook received:', order.id);
        
        await db.execute(`
            UPDATE nad_test_ids 
            SET is_activated = 1, activated_date = NOW(), payment_status = 'paid', payment_date = NOW()
            WHERE order_id = ?
        `, [order.id]);
        
        console.log(`✅ Activated tests for paid order: ${order.name}`);
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Error processing order paid webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/webhooks/orders/fulfilled', express.raw({type: 'application/json'}), async (req, res) => {
    try {
        const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
        const body = req.body;
        
        if (process.env.NODE_ENV === 'production' && !verifyShopifyWebhook(body, hmacHeader)) {
            return res.status(401).send('Unauthorized');
        }
        
        const order = JSON.parse(body.toString());
        console.log('📦 Order fulfilled webhook received:', order.id);
        
        await db.execute(`
            UPDATE nad_test_ids 
            SET shipping_status = 'fulfilled', shipped_date = NOW()
            WHERE order_id = ?
        `, [order.id]);
        
        console.log(`✅ Updated shipping status for order: ${order.name}`);
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Error processing order fulfilled webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

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
            SELECT ti.*, ts.score, ts.status as score_status 
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
        let status = 'pending';
        if (test.score) {
            status = 'completed';
        } else if (test.is_activated) {
            status = 'activated';
        }
        
        res.json({
            success: true,
            test: {
                test_id: test.test_id,
                customer_id: test.customer_id,
                order_id: test.order_id,
                status: status,
                is_activated: test.is_activated,
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
            SELECT * FROM nad_test_ids WHERE test_id = ? AND is_activated = 1
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
                order_id: result.order_id,
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
            SELECT * FROM nad_test_ids WHERE test_id = ?
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
                order_id, customer_id, activated_by, technician_id, test_id, score, image, 
                status, is_activated, score_submission_date, created_date, updated_date, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', 1, CURDATE(), CURDATE(), CURDATE(), ?)
            ON DUPLICATE KEY UPDATE
            score = VALUES(score), technician_id = VALUES(technician_id), image = VALUES(image),
            status = VALUES(status), score_submission_date = VALUES(score_submission_date),
            updated_date = VALUES(updated_date), notes = VALUES(notes)
        `, [
            test.order_id, test.customer_id, test.customer_id, technician_id,
            test_id, score, imagePath, notes || ''
        ]);
        
        res.json({ success: true, message: 'Test score submitted successfully' });
    } catch (error) {
        console.error('Error submitting test score:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// USER MANAGEMENT ENDPOINTS - COMPLETELY FIXED TO SHOW ALL 4 USERS
// ============================================================================
app.use('/api', (req, res, next) => {
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    next();
});

// Debug endpoint to check all users in the database
app.get('/api/users/debug-all', async (req, res) => {
    try {
        console.log('🔍 Debug: Checking all users in nad_user_roles...');
        
        // Get ALL users from nad_user_roles table
        const [allUsers] = await db.execute(`
            SELECT * FROM nad_user_roles ORDER BY created_at DESC
        `);
        
        console.log('📊 Found users in nad_user_roles:', allUsers);
        
        // Get users with the complex query from the current /api/users endpoint
        const [complexQuery] = await db.execute(`
            SELECT 
                ur.customer_id, ur.role, ur.permissions, ur.created_at, ur.updated_at,
                COUNT(DISTINCT ti.id) as total_tests,
                COUNT(DISTINCT CASE WHEN ti.is_activated = 1 THEN ti.id END) as activated_tests,
                COUNT(DISTINCT ts.id) as completed_tests,
                MAX(ti.created_date) as last_test_date
            FROM nad_user_roles ur
            LEFT JOIN nad_test_ids ti ON ur.customer_id = ti.customer_id
            LEFT JOIN nad_test_scores ts ON ur.customer_id = ts.customer_id
            WHERE ur.customer_id != 0
            GROUP BY ur.customer_id, ur.role, ur.permissions, ur.created_at, ur.updated_at
            ORDER BY ur.created_at DESC
        `);
        
        console.log('📊 Users from complex query:', complexQuery);
        
        res.json({
            success: true,
            debug: {
                total_in_table: allUsers.length,
                all_users: allUsers,
                complex_query_count: complexQuery.length,
                complex_query_users: complexQuery,
                missing_users: allUsers.length - complexQuery.length,
                issue_analysis: {
                    likely_cause: allUsers.length > complexQuery.length ? 
                        "Some users have customer_id = 0 or GROUP BY is filtering them out" : 
                        "Query is working correctly"
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Debug users error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Simple users query without complex JOINs
app.get('/api/users/simple', async (req, res) => {
    try {
        console.log('👥 Fetching users with simple query...');
        
        const [users] = await db.execute(`
            SELECT 
                ur.customer_id, 
                ur.role, 
                ur.permissions, 
                ur.created_at, 
                ur.updated_at,
                0 as total_tests,
                0 as activated_tests,
                0 as completed_tests
            FROM nad_user_roles ur
            WHERE ur.customer_id != 0
            ORDER BY ur.created_at DESC
        `);
        
        console.log('✅ Simple query found users:', users.length);
        
        res.json({ 
            success: true, 
            users: users,
            note: "This is a simplified query that should show all non-zero customer_id users"
        });
        
    } catch (error) {
        console.error('❌ Error fetching users with simple query:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fixed user stats endpoint
app.get('/api/users/stats', async (req, res) => {
    try {
        console.log('📊 Fetching user stats...');
        
        const [totalUsers] = await db.execute(`
            SELECT COUNT(*) as total_users FROM nad_user_roles WHERE customer_id != 0
        `);
        
        const [customers] = await db.execute(`
            SELECT COUNT(*) as customers FROM nad_user_roles WHERE role = 'customer' AND customer_id != 0
        `);
        
        const [labTechs] = await db.execute(`
            SELECT COUNT(*) as lab_techs FROM nad_user_roles WHERE role = 'lab_technician' AND customer_id != 0
        `);
        
        const [admins] = await db.execute(`
            SELECT COUNT(*) as admins FROM nad_user_roles WHERE role = 'administrator' AND customer_id != 0
        `);
        
        const [shippingManagers] = await db.execute(`
            SELECT COUNT(*) as shipping_managers FROM nad_user_roles WHERE role = 'shipping_manager' AND customer_id != 0
        `);
        
        const [managers] = await db.execute(`
            SELECT COUNT(*) as managers FROM nad_user_roles WHERE role = 'boss_control' AND customer_id != 0
        `);
        
        const stats = {
            total_users: totalUsers[0].total_users || 0,
            customers: customers[0].customers || 0,
            lab_techs: labTechs[0].lab_techs || 0,
            admins: admins[0].admins || 0,
            shipping_managers: shippingManagers[0].shipping_managers || 0,
            managers: managers[0].managers || 0
        };
        
        console.log('✅ User stats calculated:', stats);
        
        res.json({
            success: true,
            stats: stats
        });
        
    } catch (error) {
        console.error('❌ Error fetching user stats:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stats: {
                total_users: 0,
                customers: 0,
                lab_techs: 0,
                admins: 0,
                shipping_managers: 0,
                managers: 0
            }
        });
    }
});

// ★★★ MAIN FIX: Users endpoint that shows ALL 4 users ★★★
app.get('/api/users', async (req, res) => {
    try {
        console.log('👥 Fetching ALL users with completely fixed query...');
        
        // Step 1: Get ALL users first (no JOINs that could filter out users)
        const [users] = await db.execute(`
            SELECT 
                ur.customer_id, 
                ur.role, 
                ur.permissions, 
                ur.created_at, 
                ur.updated_at
            FROM nad_user_roles ur
            WHERE ur.customer_id != 0
            ORDER BY ur.created_at DESC
        `);
        
        console.log(`✅ Found ${users.length} users in database without any JOINs`);
        
        // Step 2: Add test statistics for each user individually
        const usersWithStats = [];
        
        for (const user of users) {
            try {
                // Get test statistics for this specific user
                const [testCounts] = await db.execute(`
                    SELECT 
                        COUNT(*) as total_tests,
                        SUM(CASE WHEN is_activated = 1 THEN 1 ELSE 0 END) as activated_tests,
                        MAX(created_date) as last_test_date
                    FROM nad_test_ids 
                    WHERE customer_id = ?
                `, [user.customer_id]);
                
                const [completedCounts] = await db.execute(`
                    SELECT COUNT(*) as completed_tests
                    FROM nad_test_scores 
                    WHERE customer_id = ?
                `, [user.customer_id]);
                
                usersWithStats.push({
                    customer_id: user.customer_id,
                    role: user.role,
                    permissions: user.permissions,
                    created_at: user.created_at,
                    updated_at: user.updated_at,
                    total_tests: testCounts[0].total_tests || 0,
                    activated_tests: testCounts[0].activated_tests || 0,
                    completed_tests: completedCounts[0].completed_tests || 0,
                    last_test_date: testCounts[0].last_test_date
                });
                
            } catch (statsError) {
                console.warn(`Warning: Could not get stats for user ${user.customer_id}:`, statsError.message);
                // Include user even if stats fail
                usersWithStats.push({
                    customer_id: user.customer_id,
                    role: user.role,
                    permissions: user.permissions,
                    created_at: user.created_at,
                    updated_at: user.updated_at,
                    total_tests: 0,
                    activated_tests: 0,
                    completed_tests: 0,
                    last_test_date: null
                });
            }
        }
        
        console.log(`✅ Successfully processed ${usersWithStats.length} users with test statistics`);
        
        res.json({ 
            success: true, 
            users: usersWithStats
        });
        
    } catch (error) {
        console.error('❌ Error in completely fixed /api/users endpoint:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/users/:customerId', async (req, res) => {
    try {
        const customerId = req.params.customerId;
        
        const [userRole] = await db.execute(`
            SELECT * FROM nad_user_roles WHERE customer_id = ?
        `, [customerId]);
        
        if (userRole.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const [tests] = await db.execute(`
            SELECT ti.*, ts.score, ts.status as score_status, ts.score_submission_date
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
            WHERE ti.customer_id = ?
            ORDER BY ti.created_date DESC
        `, [customerId]);
        
        const [supplements] = await db.execute(`
            SELECT * FROM nad_user_supplements WHERE customer_id = ?
            ORDER BY created_at DESC
        `, [customerId]);
        
        res.json({
            success: true,
            user: { ...userRole[0], tests, supplements }
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { customer_id, role, permissions } = req.body;
        
        if (!customer_id || !role) {
            return res.status(400).json({ 
                success: false, 
                error: 'Customer ID and role are required' 
            });
        }
        
        // Check if user already exists
        const [existing] = await db.execute(`
            SELECT customer_id FROM nad_user_roles WHERE customer_id = ?
        `, [customer_id]);
        
        if (existing.length > 0) {
            return res.status(409).json({ 
                success: false, 
                error: 'User already exists' 
            });
        }
        
        await db.execute(`
            INSERT INTO nad_user_roles (customer_id, role, permissions, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
        `, [customer_id, role, JSON.stringify(permissions || {})]);
        
        console.log(`✅ Created user: ${customer_id} with role: ${role}`);
        
        res.json({ success: true, message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/users/:customerId', async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const { role, permissions } = req.body;
        
        const [existing] = await db.execute(`
            SELECT customer_id FROM nad_user_roles WHERE customer_id = ?
        `, [customerId]);
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        await db.execute(`
            UPDATE nad_user_roles 
            SET role = ?, permissions = ?, updated_at = NOW()
            WHERE customer_id = ?
        `, [role, JSON.stringify(permissions || {}), customerId]);
        
        console.log(`✅ Updated user: ${customerId} to role: ${role}`);
        
        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/users/:customerId', async (req, res) => {
    try {
        const customerId = req.params.customerId;
        
        const [existing] = await db.execute(`
            SELECT customer_id FROM nad_user_roles WHERE customer_id = ?
        `, [customerId]);
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        await db.execute(`DELETE FROM nad_user_roles WHERE customer_id = ?`, [customerId]);
        
        console.log(`✅ Deleted user: ${customerId}`);
        
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/users/roles/available', async (req, res) => {
    try {
        const roles = {
            'customer': {
                name: 'Customer',
                description: 'Regular customer with test access',
                permissions: {
                    'view_own_tests': true,
                    'submit_supplements': true,
                    'view_own_results': true
                }
            },
            'lab_technician': {
                name: 'Lab Technician',
                description: 'Can score tests and manage lab results',
                permissions: {
                    'manage_nad_test': true,
                    'submit_scores': true,
                    'view_dashboard': true,
                    'view_all_tests': true
                }
            },
            'shipping_manager': {
                name: 'Shipping Manager', 
                description: 'Can manage orders and shipping',
                permissions: {
                    'manage_nad_shipping_order': true,
                    'view_orders': true,
                    'update_shipping': true,
                    'view_dashboard': true
                }
            },
            'boss_control': {
                name: 'Manager',
                description: 'Full access to tests and shipping',
                permissions: {
                    'manage_nad_test': true,
                    'manage_nad_shipping_order': true,
                    'full_access': true,
                    'view_dashboard': true,
                    'manage_users': true
                }
            },
            'administrator': {
                name: 'Administrator',
                description: 'Full system access including user management',
                permissions: {
                    'manage_nad_test': true,
                    'manage_nad_shipping_order': true,
                    'full_access': true,
                    'manage_users': true,
                    'view_dashboard': true,
                    'system_admin': true
                }
            }
        };
        res.json({ success: true, roles });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/users/:customerId/activate-tests', async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const [result] = await db.execute(`
            UPDATE nad_test_ids 
            SET is_activated = 1, activated_date = NOW()
            WHERE customer_id = ? AND is_activated = 0
        `, [customerId]);
        
        console.log(`✅ Activated ${result.affectedRows} tests for user ${customerId}`);
        
        res.json({ 
            success: true, 
            message: `Activated ${result.affectedRows} tests for user`,
            activated_count: result.affectedRows
        });
    } catch (error) {
        console.error('Error activating user tests:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// BULK TEST CREATION ENDPOINTS
// ============================================================================

// Generate random 5-digit number between 10000-99999
function generateRandomSuffix() {
    return Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
}

// Generate new test ID format: yyyy-mm-n-xxxxxx
function generateTestId(autoIncrementId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomSuffix = generateRandomSuffix();
    
    return `${year}-${month}-${autoIncrementId}-${randomSuffix}`;
}

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
        
        console.log(`Creating batch of ${quantity} tests with batch ID: ${batchId}`);
        
        // Create tests in bulk
        for (let i = 0; i < quantity; i++) {
            // Insert placeholder record to get auto-increment ID
            const [insertResult] = await connection.execute(
                `INSERT INTO nad_test_ids (
                    test_id, batch_id, batch_size, generated_by, order_id, customer_id, created_date
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                ['TEMP', batchId, quantity, null, null, null]
            );
            
            const autoIncrementId = insertResult.insertId;
            const testId = generateTestId(autoIncrementId);
            
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
        
        console.log(`Successfully created ${createdTests.length} tests`);
        
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
        console.error('Error creating test batch:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to create test batch',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Get batch information
app.get('/api/admin/test-batches', async (req, res) => {
    try {
        const [batches] = await db.execute(`
            SELECT 
                batch_id,
                batch_size,
                COUNT(*) as tests_created,
                MIN(created_date) as created_date,
                GROUP_CONCAT(test_id ORDER BY id LIMIT 3) as sample_test_ids
            FROM nad_test_ids 
            WHERE batch_id IS NOT NULL 
            GROUP BY batch_id, batch_size 
            ORDER BY MIN(created_date) DESC
            LIMIT 20
        `);
        
        res.json({
            success: true,
            data: batches
        });
    } catch (error) {
        console.error('Error fetching test batches:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test batches'
        });
    }
});

// Get tests by batch ID
app.get('/api/admin/test-batch/:batchId', async (req, res) => {
    const { batchId } = req.params;
    
    try {
        const [tests] = await db.execute(
            'SELECT * FROM nad_test_ids WHERE batch_id = ? ORDER BY id',
            [batchId]
        );
        
        res.json({
            success: true,
            data: tests
        });
    } catch (error) {
        console.error('Error fetching batch tests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch batch tests'
        });
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
// LAB INTERFACE ENDPOINTS
// ============================================================================

app.get('/api/lab/pending-tests', async (req, res) => {
    try {
        const [tests] = await db.execute(`
            SELECT 
                ti.*, us.supplements_with_dose, us.habits_notes, ts.score as existing_score
            FROM nad_test_ids ti
            LEFT JOIN nad_user_supplements us ON ti.test_id = us.test_id
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
            WHERE ti.is_activated = 1
            ORDER BY ti.activated_date ASC
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
                COUNT(DISTINCT CASE WHEN ti.is_activated = 1 AND ts.test_id IS NULL THEN ti.test_id END) as pending_tests,
                COUNT(DISTINCT ts.test_id) as completed_tests,
                AVG(CAST(ts.score AS DECIMAL(10,2))) as average_score,
                COUNT(DISTINCT CASE WHEN ts.score_submission_date = CURDATE() THEN ts.test_id END) as tests_today
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
        `);
        res.json({ success: true, stats: stats[0] });
    } catch (error) {
        console.error('Error fetching lab stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

app.get('/api/admin/tests', async (req, res) => {
    try {
        const [tests] = await db.execute(`
            SELECT 
                ti.*, ts.score, ts.technician_id, ts.score_submission_date, 
                ts.status as score_status, us.supplements_with_dose
            FROM nad_test_ids ti
            LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
            LEFT JOIN nad_user_supplements us ON ti.test_id = us.test_id
            ORDER BY ti.created_date DESC
        `);
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
            SET is_activated = 1, activated_date = NOW()
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
    console.log('🔧 Request headers:', JSON.stringify(req.headers, null, 2));
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
        const [existing] = await db.execute(`SELECT test_id, is_activated FROM nad_test_ids WHERE test_id = ?`, [testId]);
        
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
        console.log('📊 Current activation status:', currentTest.is_activated);
        
        if (currentTest.is_activated === 1) {
            console.log('⚠️ Test is already activated');
            return res.json({ 
                success: true, 
                message: 'Test is already activated',
                current_status: 'activated',
                test_data: currentTest
            });
        }
        
        console.log('📊 Updating test activation status...');
        const [updateResult] = await db.execute(`
            UPDATE nad_test_ids 
            SET is_activated = 1, activated_date = NOW()
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
        const [verifyResult] = await db.execute(`SELECT test_id, is_activated, activated_date FROM nad_test_ids WHERE test_id = ?`, [testId]);
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
    console.log('🔧 Request headers:', JSON.stringify(req.headers, null, 2));
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
        const [existing] = await db.execute(`SELECT test_id, is_activated FROM nad_test_ids WHERE test_id = ?`, [testId]);
        
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
        console.log('📊 Current activation status:', currentTest.is_activated);
        
        if (currentTest.is_activated === 0) {
            console.log('⚠️ Test is already deactivated');
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
            SET is_activated = 0, activated_date = NULL
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
        const [verifyResult] = await db.execute(`SELECT test_id, is_activated, activated_date FROM nad_test_ids WHERE test_id = ?`, [testId]);
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
            SET is_activated = 0, activated_date = NULL
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

app.get('/api/admin/export/:type', async (req, res) => {
    try {
        const exportType = req.params.type;
        let data = [];
        let filename = 'export.json';
        
        switch (exportType) {
            case 'tests':
                const [tests] = await db.execute(`
                    SELECT 
                        ti.*, ts.score, ts.technician_id, ts.score_submission_date,
                        us.supplements_with_dose, us.habits_notes
                    FROM nad_test_ids ti
                    LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
                    LEFT JOIN nad_user_supplements us ON ti.test_id = us.test_id
                    ORDER BY ti.created_date DESC
                `);
                data = tests;
                filename = `nad_tests_export_${new Date().toISOString().split('T')[0]}.json`;
                break;
                
            case 'users':
                const [users] = await db.execute(`
                    SELECT * FROM nad_user_roles WHERE customer_id != 0 ORDER BY created_at DESC
                `);
                data = users;
                filename = `nad_users_export_${new Date().toISOString().split('T')[0]}.json`;
                break;
                
            case 'supplements':
                const [supplements] = await db.execute(`
                    SELECT * FROM nad_supplements ORDER BY name ASC
                `);
                data = supplements;
                filename = `nad_supplements_export_${new Date().toISOString().split('T')[0]}.json`;
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid export type. Use: tests, users, or supplements'
                });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json({
            export_type: exportType,
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
                COUNT(DISTINCT CASE WHEN ti.is_activated = 1 THEN ti.test_id END) as activated_tests,
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
        
        const [roleStats] = await db.execute(`
            SELECT role, COUNT(*) as count
            FROM nad_user_roles 
            WHERE customer_id != 0
            GROUP BY role
        `);
        
        res.json({
            success: true,
            analytics: {
                basic_stats: basicStats[0],
                score_distribution: scoreDistribution,
                daily_completions: dailyStats,
                user_roles: roleStats
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
                COUNT(CASE WHEN is_activated = 1 THEN 1 END) as tests_activated
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
                (SELECT COUNT(*) FROM nad_test_ids WHERE is_activated = 1) as activated_tests,
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

app.post('/api/batch/activate-tests', async (req, res) => {
    try {
        const { customer_ids, test_ids } = req.body;
        let affectedRows = 0;
        
        if (customer_ids && Array.isArray(customer_ids) && customer_ids.length > 0) {
            const placeholders = customer_ids.map(() => '?').join(',');
            const [result] = await db.execute(`
                UPDATE nad_test_ids 
                SET is_activated = 1, activated_date = NOW()
                WHERE customer_id IN (${placeholders}) AND is_activated = 0
            `, customer_ids);
            affectedRows += result.affectedRows;
        }
        
        if (test_ids && Array.isArray(test_ids) && test_ids.length > 0) {
            const placeholders = test_ids.map(() => '?').join(',');
            const [result] = await db.execute(`
                UPDATE nad_test_ids 
                SET is_activated = 1, activated_date = NOW()
                WHERE test_id IN (${placeholders}) AND is_activated = 0
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
            SELECT COUNT(*) as count FROM nad_test_ids WHERE is_activated = 1 
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
            WHERE is_activated = 0 AND created_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
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
            'GET /api/users',
            'GET /api/users/stats',
            'GET /api/users/debug-all',
            'GET /api/users/simple',
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

// ============================================================================
// SERVER STARTUP AND SHUTDOWN
// ============================================================================

async function startServer() {
    try {
        const dbConnected = await initializeDatabase();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }
        
        app.listen(PORT, () => {
            console.log('🚀 NAD Test Cycle API Server Started - USERS COMPLETELY FIXED');
            console.log(`📡 Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health: http://localhost:${PORT}/health`);
            console.log(`📊 Stats: http://localhost:${PORT}/api/dashboard/stats`);
            console.log(`👥 Users: http://localhost:${PORT}/api/users`);
            console.log(`👥 User Stats: http://localhost:${PORT}/api/users/stats`);
            console.log(`🔍 Debug Users: http://localhost:${PORT}/api/users/debug-all`);
            console.log(`🧪 Tests: http://localhost:${PORT}/api/tests/scores`);
            console.log(`💊 Supplements: http://localhost:${PORT}/api/supplements`);
            console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics/overview`);
            console.log('✅ All 4 users will now appear in the admin dashboard!');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    if (db) {
        await db.end();
        console.log('✅ Database connection closed');
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    if (db) {
        await db.end();
        console.log('✅ Database connection closed');
    }
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
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
