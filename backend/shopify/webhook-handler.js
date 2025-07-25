const crypto = require('crypto');
const logger = require('../logger');

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
    if (!db) {
        logger.error('Database connection not provided to logWebhookEvent');
        return;
    }
    const connection = await db.getConnection();
    try {
        await connection.execute(`
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
    } catch (err) {
        logger.error('Failed to log webhook event:', err);
    } finally {
        connection.release();
    }
}

async function processCustomerUpdate(customer, db = null) {
    if (!db) {
        logger.error('Database connection not provided to processCustomerUpdate');
        throw new Error('Database connection required');
    }
    const connection = await db.getConnection();
    
    try {
        // Find test_kit_activation metafield
        const activationMetafield = customer.metafields?.find(mf => 
            mf.namespace === 'customer' && mf.key === 'test_kit_activation'
        );
        
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
        // Validate test kit format
        const testKitPattern = new RegExp(process.env.TEST_KIT_ID_PATTERN || '^[0-9]{4}-[0-9]{2}-[0-9]+-[A-Z0-9]{6}$');
        if (!testKitPattern.test(testKitId)) {
            return { success: false, error: 'Invalid Test Kit ID format' };
        }
        
        // Check if test kit exists and is not already activated
        const [existingTest] = await connection.execute(`
            SELECT test_id, is_activated, customer_id, shopify_customer_id 
            FROM nad_test_ids 
            WHERE UPPER(test_id) = UPPER(?)
        `, [testKitId]);
        
        if (existingTest.length === 0) {
            return { success: false, error: 'Test Kit ID not found in system' };
        }
        
        const test = existingTest[0];
        
        if (test.is_activated) {
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
            await connection.execute(`
                UPDATE nad_test_ids 
                SET 
                    is_activated = 1,
                    activated_date = NOW(),
                    customer_id = ?,
                    shopify_customer_id = ?,
                    customer_name = ?
                WHERE UPPER(test_id) = UPPER(?)
            `, [
                customer.email,
                customer.id,
                `${customer.first_name} ${customer.last_name}`,
                testKitId
            ]);
            
            // Create score record
            await connection.execute(`
                INSERT INTO nad_test_scores 
                (test_id, customer_id, activated_by, activation_date)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                    activation_date = NOW()
            `, [
                testKitId,
                customer.email,
                `shopify_${customer.id}`
            ]);
            
            await connection.commit();
            
            logger.info(`Test Kit ${testKitId} activated successfully for ${customer.email}`);
            
            return { 
                success: true, 
                testKitId, 
                activationDate: new Date(),
                message: 'Test kit successfully activated'
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        }
        
    } catch (error) {
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
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    
    if (!hmac || !secret) {
        logger.error('Missing webhook signature or secret');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!verifyWebhookSignature(req.rawBody, hmac, secret)) {
        logger.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
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