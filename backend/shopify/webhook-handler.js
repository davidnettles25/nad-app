const crypto = require('crypto');

// Initialize logger with fallback
let logger;
try {
    const { createLogger } = require('../logger');
    logger = createLogger({ module: 'shopify-webhook' });
} catch (error) {
    // Fallback logger if main logger isn't ready
    logger = {
        info: (...args) => console.log('[SHOPIFY-WEBHOOK]', ...args),
        error: (...args) => console.error('[SHOPIFY-WEBHOOK ERROR]', ...args),
        warn: (...args) => console.warn('[SHOPIFY-WEBHOOK WARN]', ...args),
        debug: (...args) => console.log('[SHOPIFY-WEBHOOK DEBUG]', ...args)
    };
}

// ============================================================================
// Webhook Signature Verification
// ============================================================================

function verifyWebhookSignature(rawBody, signature, secret) {
    const hash = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('base64');
    
    return hash === signature;
}

// ============================================================================
// Webhook Processing Functions
// ============================================================================

async function logWebhookEvent(headers, body, processed = false, error = null, db = null) {
    console.log('[WEBHOOK DEBUG] logWebhookEvent called with:', {
        hasDb: !!db,
        processed,
        error,
        topic: headers['x-shopify-topic']
    });
    
    if (!db) {
        logger.error('Database connection not provided to logWebhookEvent');
        return;
    }
    
    let connection;
    try {
        connection = await db.getConnection();
        console.log('[WEBHOOK DEBUG] Got database connection');
        
        const result = await connection.execute(`
            INSERT INTO nad_shopify_webhooks 
            (webhook_id, topic, shop_domain, api_version, payload, processed, processed_at, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            headers['x-shopify-webhook-id'] || null,
            headers['x-shopify-topic'] || 'unknown',
            headers['x-shopify-shop-domain'] || null,
            headers['x-shopify-api-version'] || null,
            JSON.stringify(body),
            processed,
            processed ? new Date() : null,
            error
        ]);
        
        console.log('[WEBHOOK DEBUG] Webhook logged successfully, insertId:', result[0].insertId);
        
    } catch (err) {
        console.log('[WEBHOOK DEBUG] Failed to log webhook event:', err);
        logger.error('Failed to log webhook event:', err);
    } finally {
        if (connection) {
            connection.release();
            console.log('[WEBHOOK DEBUG] Database connection released');
        }
    }
}

async function processCustomerUpdate(customer, db = null) {
    if (!db) {
        logger.error('Database connection not provided to processCustomerUpdate');
        throw new Error('Database connection required');
    }
    const connection = await db.getConnection();
    
    try {
        // Fetch customer metafields if not included in webhook
        let activationMetafield = customer.metafields?.find(mf => 
            (mf.namespace === 'customer' || mf.namespace === 'custom') && mf.key === 'test_kit_activation'
        );
        
        if (!activationMetafield && customer.id) {
            console.log(`[WEBHOOK DEBUG] Metafields not in payload, fetching from Shopify API for customer ID: ${customer.id}...`);
            activationMetafield = await fetchCustomerActivationMetafield(customer.id);
        }
        
        if (!activationMetafield) {
            logger.info(`No activation metafield found for customer ${customer.email}`);
            return { success: true, message: 'No activation request found' };
        }
        
        logger.info(`Found activation metafield for ${customer.email}:`, activationMetafield.value);
        
        // Parse activation data
        let activationData;
        try {
            activationData = JSON.parse(activationMetafield.value);
        } catch (error) {
            logger.error('Invalid activation metafield JSON:', error);
            await deleteMetafield(activationMetafield.id);
            return { success: false, error: 'Invalid activation data format' };
        }
        
        const { testKitId, timestamp, sessionId, requestType } = activationData;
        
        // Validate timestamp (5-minute window)
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        
        if (timestamp < fiveMinutesAgo) {
            logger.warn('Activation request expired', { testKitId, timestamp });
            await deleteMetafield(activationMetafield.id);
            return { success: false, error: 'Activation request expired' };
        }
        
        // Store/update Shopify customer data
        await upsertShopifyCustomer(connection, customer);
        
        // Process based on request type
        let result;
        if (testKitId && requestType === 'activation') {
            result = await processTestKitActivation(connection, testKitId, customer);
            
            if (result.success) {
                // Log successful activation
                await logMetafieldOperation(connection, customer.id, activationMetafield.id, 
                    'customer', 'test_kit_activation', 'delete', true);
                
                // Create test kit log metafield
                await createTestKitLogMetafield(customer.id, {
                    action: 'activation',
                    testKitId: testKitId,
                    timestamp: Date.now(),
                    status: 'success',
                    message: 'Test kit successfully activated',
                    activationDate: result.activationDate
                });
            }
        } else if (requestType === 'portal_only') {
            result = { 
                success: true, 
                message: 'Portal access granted',
                portalOnly: true
            };
        } else {
            result = { 
                success: false, 
                error: 'Invalid request parameters' 
            };
        }
        
        // Store session for polling if sessionId provided
        if (sessionId && result.success) {
            await createPollingSession(connection, sessionId, customer, testKitId, result);
        }
        
        // Always delete the activation metafield
        await deleteMetafield(activationMetafield.id);
        
        return result;
        
    } catch (error) {
        logger.error('Customer update processing error:', error);
        throw error;
    } finally {
        connection.release();
    }
}

async function upsertShopifyCustomer(connection, customer) {
    await connection.execute(`
        INSERT INTO nad_shopify_customers 
        (shopify_customer_id, email, first_name, last_name, phone, 
         accepts_marketing, currency, tags, note, total_spent, 
         orders_count, verified_email, shopify_created_at, shopify_updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            email = VALUES(email),
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            phone = VALUES(phone),
            accepts_marketing = VALUES(accepts_marketing),
            currency = VALUES(currency),
            tags = VALUES(tags),
            note = VALUES(note),
            total_spent = VALUES(total_spent),
            orders_count = VALUES(orders_count),
            verified_email = VALUES(verified_email),
            shopify_updated_at = VALUES(shopify_updated_at),
            updated_at = NOW()
    `, [
        customer.id,
        customer.email,
        customer.first_name,
        customer.last_name,
        customer.phone || null,
        customer.accepts_marketing || false,
        customer.currency || 'USD',
        customer.tags || null,
        customer.note || null,
        customer.total_spent || 0,
        customer.orders_count || 0,
        customer.verified_email || false,
        customer.created_at ? new Date(customer.created_at) : null,
        customer.updated_at ? new Date(customer.updated_at) : null
    ]);
}

async function processTestKitActivation(connection, testKitId, customer) {
    try {
        console.log(`[WEBHOOK DEBUG] Processing test kit activation for: ${testKitId}`);
        
        // Validate test kit format (case-insensitive to match database behavior)
        const testKitPattern = new RegExp(process.env.TEST_KIT_ID_PATTERN || '^[0-9]{4}-[0-9]{2}-[0-9]+-[A-Za-z0-9]{6}$', 'i');
        console.log(`[WEBHOOK DEBUG] Test kit pattern: ${testKitPattern.source}`);
        console.log(`[WEBHOOK DEBUG] Pattern test result: ${testKitPattern.test(testKitId)}`);
        
        if (!testKitPattern.test(testKitId)) {
            return { success: false, error: 'Invalid Test Kit ID format' };
        }
        
        // Check if test kit exists and is not already activated
        console.log(`[WEBHOOK DEBUG] Checking database for test ID: ${testKitId}`);
        const [existingTest] = await connection.execute(`
            SELECT test_id, status, customer_id, shopify_customer_id 
            FROM nad_test_ids 
            WHERE UPPER(test_id) = UPPER(?)
        `, [testKitId]);
        
        console.log(`[WEBHOOK DEBUG] Database query result:`, existingTest);
        
        if (existingTest.length === 0) {
            return { success: false, error: 'Test Kit ID not found in system' };
        }
        
        const test = existingTest[0];
        console.log(`[WEBHOOK DEBUG] Test record:`, test);
        
        if (test.status === 'activated') {
            // Check if activated by same customer
            if (test.shopify_customer_id === customer.id || test.customer_id === customer.email) {
                return { success: false, error: 'This test kit is already activated by you' };
            } else {
                return { success: false, error: 'This test kit has already been activated' };
            }
        }
        
        // Validate test kit age
        const testYear = parseInt(testKitId.substring(0, 4));
        const currentYear = new Date().getFullYear();
        const maxAge = parseInt(process.env.TEST_KIT_MAX_AGE_YEARS || '2');
        
        if (testYear > currentYear) {
            return { success: false, error: 'Test Kit ID appears to be from the future' };
        }
        
        if (testYear < currentYear - maxAge) {
            return { success: false, error: `Test Kit ID has expired (older than ${maxAge} years)` };
        }
        
        // Activate the test kit
        await connection.beginTransaction();
        
        try {
            // Update test_ids table
            console.log(`[WEBHOOK DEBUG] Updating test_ids table for: ${testKitId}`);
            await connection.execute(`
                UPDATE nad_test_ids 
                SET 
                    status = 'activated',
                    activated_date = NOW(),
                    customer_id = ?,
                    shopify_customer_id = ?
                WHERE UPPER(test_id) = UPPER(?)
            `, [
                customer.email,
                customer.id,
                testKitId
            ]);
            
            // Create score record
            console.log(`[WEBHOOK DEBUG] Creating score record for: ${testKitId}`);
            await connection.execute(`
                INSERT INTO nad_test_scores 
                (test_id, technician_id, score, created_date, updated_date)
                VALUES (?, '', 0, CURDATE(), CURDATE())
                ON DUPLICATE KEY UPDATE 
                    test_id = VALUES(test_id)
            `, [
                testKitId
            ]);
            
            console.log(`[WEBHOOK DEBUG] Committing transaction`);
            await connection.commit();
            console.log(`[WEBHOOK DEBUG] Transaction committed successfully`);
            
            logger.info(`Test Kit ${testKitId} activated successfully for ${customer.email}`);
            
            return { 
                success: true, 
                testKitId, 
                activationDate: new Date(),
                message: 'Test kit successfully activated'
            };
            
        } catch (error) {
            console.log(`[WEBHOOK DEBUG] Transaction error:`, error);
            await connection.rollback();
            throw error;
        }
        
    } catch (error) {
        console.log(`[WEBHOOK DEBUG] Test kit activation error:`, error);
        logger.error('Test kit activation error:', error);
        return { success: false, error: 'Failed to activate test kit' };
    }
}

async function createPollingSession(connection, sessionId, customer, testKitId, result) {
    // Generate portal token
    const portalToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    // Store portal session
    await connection.execute(`
        INSERT INTO nad_portal_sessions 
        (token, session_type, customer_id, shopify_customer_id, email, 
         first_name, last_name, test_kit_id, has_new_activation, 
         metadata, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        portalToken,
        'shopify',
        customer.email,
        customer.id,
        customer.email,
        customer.first_name,
        customer.last_name,
        testKitId || null,
        !!(testKitId && !result.portalOnly),
        JSON.stringify({ sessionId, result }),
        expiresAt
    ]);
    
    // Store polling response (in Redis in production)
    global.pollingSessions = global.pollingSessions || new Map();
    global.pollingSessions.set(sessionId, {
        status: 'ready',
        portalToken: portalToken,
        portalUrl: `${process.env.FRONTEND_URL || 'https://mynadtest.info'}/portal?t=${portalToken}`
    });
    
    return portalToken;
}

async function fetchCustomerActivationMetafield(customerId) {
    try {
        const shopifyUrl = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/${process.env.SHOPIFY_API_VERSION || '2024-01'}/customers/${customerId}/metafields.json`;
        
        const response = await fetch(shopifyUrl, {
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            logger.error('Failed to fetch customer metafields:', response.status, errorText);
            return null;
        }
        
        const result = await response.json();
        console.log('[WEBHOOK DEBUG] All metafields returned:', JSON.stringify(result.metafields, null, 2));
        
        const activationMetafield = result.metafields?.find(mf => 
            (mf.namespace === 'customer' || mf.namespace === 'custom') && mf.key === 'test_kit_activation'
        );
        
        if (activationMetafield) {
            console.log('[WEBHOOK DEBUG] Found activation metafield via API:', activationMetafield);
        } else {
            console.log('[WEBHOOK DEBUG] No activation metafield found. Looking for namespace=customer/custom, key=test_kit_activation');
        }
        
        return activationMetafield;
        
    } catch (error) {
        logger.error('Error fetching customer metafields:', error);
        return null;
    }
}

async function deleteMetafield(metafieldId) {
    if (!metafieldId) return;
    
    try {
        const shopifyUrl = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/${process.env.SHOPIFY_API_VERSION || '2024-01'}/metafields/${metafieldId}.json`;
        
        const response = await fetch(shopifyUrl, {
            method: 'DELETE',
            headers: {
                'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            logger.info(`Deleted metafield ${metafieldId}`);
        } else {
            const errorText = await response.text();
            logger.error('Failed to delete metafield:', response.status, errorText);
        }
    } catch (error) {
        logger.error('Error deleting metafield:', error);
    }
}

async function createTestKitLogMetafield(customerId, logData) {
    if (!customerId) {
        console.log('[WEBHOOK DEBUG] No customerId provided to createTestKitLogMetafield');
        return;
    }
    
    try {
        console.log(`[WEBHOOK DEBUG] Creating test kit log metafield for customer: ${customerId}`);
        console.log(`[WEBHOOK DEBUG] SHOPIFY_STORE_URL: ${process.env.SHOPIFY_STORE_URL}`);
        console.log(`[WEBHOOK DEBUG] SHOPIFY_ACCESS_TOKEN exists: ${!!process.env.SHOPIFY_ACCESS_TOKEN}`);
        
        // First, check if a test_kit_log metafield already exists
        const getUrl = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/${process.env.SHOPIFY_API_VERSION || '2024-01'}/customers/${customerId}/metafields.json`;
        const getResponse = await fetch(getUrl, {
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        let existingMetafield = null;
        if (getResponse.ok) {
            const metafields = await getResponse.json();
            existingMetafield = metafields.metafields?.find(mf => 
                mf.namespace === 'custom' && mf.key === 'test_kit_log'
            );
            console.log(`[WEBHOOK DEBUG] Existing test_kit_log metafield:`, existingMetafield?.id || 'none');
        }
        
        const logEntry = {
            action: logData.action,
            testKitId: logData.testKitId,
            timestamp: logData.timestamp,
            status: logData.status,
            message: logData.message,
            activationDate: logData.activationDate ? logData.activationDate.toISOString() : null
        };
        
        let finalValue;
        if (existingMetafield) {
            // Update existing metafield by appending to log array
            try {
                const existingValue = JSON.parse(existingMetafield.value);
                const logArray = Array.isArray(existingValue) ? existingValue : [existingValue];
                logArray.push(logEntry);
                finalValue = JSON.stringify(logArray);
                console.log(`[WEBHOOK DEBUG] Appending to existing log array, new length: ${logArray.length}`);
            } catch (error) {
                // If existing value isn't valid JSON, start fresh
                finalValue = JSON.stringify([logEntry]);
                console.log(`[WEBHOOK DEBUG] Existing value invalid, starting fresh array`);
            }
            
            // Update existing metafield
            const updateUrl = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/${process.env.SHOPIFY_API_VERSION || '2024-01'}/metafields/${existingMetafield.id}.json`;
            const updateData = {
                metafield: {
                    id: existingMetafield.id,
                    type: 'multi_line_text_field',
                    value: finalValue,
                    description: 'Test kit activation history log'
                }
            };
            
            console.log(`[WEBHOOK DEBUG] Updating metafield ${existingMetafield.id}`);
            const response = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            console.log(`[WEBHOOK DEBUG] Update response status: ${response.status}`);
            
            if (response.ok) {
                const result = await response.json();
                logger.info(`Updated test kit log metafield for customer ${customerId}:`, logData.testKitId);
                console.log(`[WEBHOOK DEBUG] Updated metafield successfully`);
                console.log(`[WEBHOOK DEBUG] Update result:`, JSON.stringify(result, null, 2));
                
                // Verify the update by fetching the metafield again
                const verifyResponse = await fetch(getUrl, {
                    method: 'GET',
                    headers: {
                        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (verifyResponse.ok) {
                    const verifyData = await verifyResponse.json();
                    const updatedMetafield = verifyData.metafields?.find(mf => 
                        mf.namespace === 'customer' && mf.key === 'test_kit_log'
                    );
                    console.log(`[WEBHOOK DEBUG] Verification: metafield exists after update:`, !!updatedMetafield);
                    if (updatedMetafield) {
                        console.log(`[WEBHOOK DEBUG] Verification: metafield value length:`, updatedMetafield.value.length);
                        console.log(`[WEBHOOK DEBUG] Verification: metafield updated_at:`, updatedMetafield.updated_at);
                    }
                }
            } else {
                const errorText = await response.text();
                console.log(`[WEBHOOK DEBUG] Update error response:`, errorText);
                logger.error('Failed to update test kit log metafield:', response.status, errorText);
            }
        } else {
            // Create new metafield with array containing single log entry
            finalValue = JSON.stringify([logEntry]);
            
            const shopifyUrl = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/${process.env.SHOPIFY_API_VERSION || '2024-01'}/customers/${customerId}/metafields.json`;
            const metafieldData = {
                metafield: {
                    namespace: 'custom',
                    key: 'test_kit_log',
                    type: 'multi_line_text_field',
                    value: finalValue,
                    description: 'Test kit activation history log'
                }
            };
            
            console.log(`[WEBHOOK DEBUG] Creating new metafield`);
            console.log(`[WEBHOOK DEBUG] Metafield data:`, JSON.stringify(metafieldData, null, 2));
            
            const response = await fetch(shopifyUrl, {
                method: 'POST',
                headers: {
                    'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metafieldData)
            });
            
            console.log(`[WEBHOOK DEBUG] Create response status: ${response.status}`);
            
            if (response.ok) {
                const result = await response.json();
                logger.info(`Created test kit log metafield for customer ${customerId}:`, logData.testKitId);
                console.log(`[WEBHOOK DEBUG] Created test kit log metafield: ${result.metafield.id}`);
            } else {
                const errorText = await response.text();
                console.log(`[WEBHOOK DEBUG] Create error response:`, errorText);
                logger.error('Failed to create test kit log metafield:', response.status, errorText);
            }
        }
    } catch (error) {
        console.log(`[WEBHOOK DEBUG] Exception in createTestKitLogMetafield:`, error);
        logger.error('Error creating test kit log metafield:', error);
    }
}

async function logMetafieldOperation(connection, customerId, metafieldId, namespace, key, operation, success, error = null) {
    try {
        await connection.execute(`
            INSERT INTO nad_shopify_metafields_log 
            (shopify_customer_id, metafield_id, namespace, key_name, operation, success, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [customerId, metafieldId, namespace, key, operation, success, error]);
    } catch (err) {
        logger.error('Failed to log metafield operation:', err);
    }
}

// ============================================================================
// Express Middleware
// ============================================================================

function webhookMiddleware(req, res, next) {
    // Store raw body for signature verification
    let rawBody = '';
    req.on('data', chunk => {
        rawBody += chunk.toString('utf8');
    });
    
    req.on('end', () => {
        req.rawBody = rawBody;
        
        try {
            req.body = JSON.parse(rawBody);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid JSON' });
        }
        
        next();
    });
}

function verifyWebhook(req, res, next) {
    // HMAC verification enabled for security
    console.log('[WEBHOOK DEBUG] HMAC verification starting');
    console.log('[WEBHOOK DEBUG] Headers received:', Object.keys(req.headers));
    
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    
    console.log('[WEBHOOK DEBUG] HMAC header exists:', !!hmac);
    console.log('[WEBHOOK DEBUG] Webhook secret exists:', !!secret);
    console.log('[WEBHOOK DEBUG] Raw body length:', req.rawBody?.length || 0);
    
    if (!hmac || !secret) {
        console.log('[WEBHOOK DEBUG] Missing HMAC or secret - rejecting');
        logger.error('Missing webhook signature or secret');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const isValid = verifyWebhookSignature(req.rawBody, hmac, secret);
    console.log('[WEBHOOK DEBUG] HMAC verification result:', isValid);
    
    if (!isValid) {
        console.log('[WEBHOOK DEBUG] Invalid signature - rejecting');
        logger.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    console.log('[WEBHOOK DEBUG] HMAC verification passed');
    logger.info('Valid Shopify webhook signature');
    next();
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
    webhookMiddleware,
    verifyWebhook,
    processCustomerUpdate,
    logWebhookEvent,
    verifyWebhookSignature
};