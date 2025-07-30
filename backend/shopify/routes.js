const express = require('express');
const router = express.Router();
const { webhookMiddleware, verifyWebhook, processCustomerUpdate, logWebhookEvent } = require('./webhook-handler');
const { SessionManager } = require('./session-manager');

// Initialize logger with fallback
let logger;
try {
    const { createLogger } = require('../logger');
    logger = createLogger({ module: 'shopify-routes' });
} catch (error) {
    // Fallback logger if main logger isn't ready
    logger = {
        info: (...args) => console.log('[SHOPIFY-ROUTES]', ...args),
        error: (...args) => console.error('[SHOPIFY-ROUTES ERROR]', ...args),
        warn: (...args) => console.warn('[SHOPIFY-ROUTES WARN]', ...args),
        debug: (...args) => console.log('[SHOPIFY-ROUTES DEBUG]', ...args)
    };
}

// ============================================================================
// Webhook Routes
// ============================================================================

// Customer update webhook (handles metafield activation requests)
router.post('/webhooks/customer-update', 
    webhookMiddleware, // Captures raw body for HMAC verification
    verifyWebhook,     // Verifies HMAC signature
    async (req, res) => {
        const headers = req.headers;
        const customer = req.body;
        
        try {
            logger.info(`Customer update webhook received for: ${customer.email || 'unknown'}`);
            
            const db = req.app.locals.db;
            
            // Log webhook event
            await logWebhookEvent(headers, customer, false, null, db);
            
            // Process customer update
            const result = await processCustomerUpdate(customer, db);
            
            // Update webhook log
            await logWebhookEvent(headers, customer, true, result.error || null, db);
            
            // Always return 200 to Shopify
            res.status(200).json({ 
                received: true,
                message: result.message || 'Webhook processed'
            });
            
        } catch (error) {
            logger.error('Webhook processing error:', error);
            
            // Log error
            await logWebhookEvent(headers, customer, false, error.message, req.app.locals.db);
            
            // Still return 200 to prevent retries
            res.status(200).json({ 
                received: true,
                error: 'Processing failed'
            });
        }
    }
);

// Order creation webhook (for linking test kits to orders)
router.post('/webhooks/order-create',
    webhookMiddleware,
    verifyWebhook,
    async (req, res) => {
        const order = req.body;
        
        try {
            logger.info(`Order creation webhook received: ${order.name}`);
            
            // Log webhook event
            await logWebhookEvent(req.headers, order, true, null, req.app.locals.db);
            
            // TODO: Process order to link test kits
            // This would check line items for test kit products
            // and pre-create test IDs linked to the order
            
            res.status(200).json({ received: true });
            
        } catch (error) {
            logger.error('Order webhook error:', error);
            res.status(200).json({ received: true });
        }
    }
);

// ============================================================================
// Polling API (for Shopify theme integration)
// ============================================================================

router.get('/check-portal-access', (req, res) => {
    const { session, setup, customerId, email, testKitId } = req.query;
    const sessionManager = req.app.locals.sessionManager;
    
    logger.debug(`Checking portal access for session: ${session}`);
    
    if (!session) {
        return res.json({ 
            ready: false, 
            error: 'No session provided' 
        });
    }
    
    // Handle session setup for direct API calls
    if (setup === 'true' && customerId && email && testKitId) {
        logger.info(`Setting up direct activation session: ${session}`);
        logger.info(`Customer: ${email} (${customerId}), Test Kit: ${testKitId}`);
        
        try {
            // Create a polling session that simulates webhook processing
            const pollingData = {
                status: 'processing',
                customerId: customerId,
                email: email,
                testKitId: testKitId,
                requestType: 'activation',
                timestamp: Date.now()
            };
            
            // Store in session manager (simulate webhook trigger)
            sessionManager.createPollingSession(session, pollingData);
            
            logger.info(`Direct activation session created: ${session}`);
            
            // Process the test kit activation directly
            setTimeout(async () => {
                try {
                    const { processTestKitActivation } = require('./webhook-handler');
                    logger.info(`Processing direct test kit activation: ${testKitId} for ${email}`);
                    
                    // Get database connection from pool
                    const db = req.app.locals.db;
                    const connection = await db.getConnection();
                    
                    try {
                        let result;
                        
                        // Handle portal_only requests (no test kit activation)
                        if (!testKitId || testKitId.trim() === '') {
                            logger.info(`Portal-only access request for ${email}`);
                            result = { 
                                success: true, 
                                message: 'Portal access granted',
                                portalOnly: true
                            };
                        } else {
                            // Handle test kit activation
                            result = await processTestKitActivation(connection, testKitId, {
                                id: customerId,
                                email: email,
                                first_name: '',
                                last_name: ''
                            });
                        }
                        
                        logger.info(`Direct activation result: ${result.success ? 'Success' : 'Failed'}`);
                        
                        if (result.success) {
                            // Create portal session for authentication
                            const { createPollingSession } = require('./webhook-handler');
                            const portalToken = await createPollingSession(connection, session, {
                                id: customerId,
                                email: email,
                                first_name: '',
                                last_name: ''
                            }, result.portalOnly ? null : result.testKitId, result);
                            
                            // Generate portal URL with portal token
                            const portalUrl = `https://mynadtest.info/customer-dashboard.html?t=${portalToken}`;
                            
                            // Update session with success
                            const sessionData = {
                                status: 'ready',
                                ready: true,
                                portalUrl: portalUrl,
                                portalToken: portalToken
                            };
                            
                            // Add test kit data only for activation requests
                            if (!result.portalOnly && result.testKitId) {
                                sessionData.testKitData = {
                                    test_id: result.testKitId,
                                    activationDate: result.activationDate
                                };
                            }
                            
                            sessionManager.updatePollingSession(session, sessionData);
                        } else {
                            // Update session with specific error
                            sessionManager.updatePollingSession(session, {
                                status: 'error',
                                error: result.error || 'Test kit activation failed'
                            });
                        }
                    } finally {
                        // Always release connection back to pool
                        connection.release();
                    }
                } catch (error) {
                    logger.error('Direct activation processing failed:', error.message || error);
                    logger.error('Error stack:', error.stack || error);
                    // Update session with error
                    sessionManager.updatePollingSession(session, {
                        status: 'error',
                        error: 'Test kit activation failed'
                    });
                }
            }, 1000); // Process after 1 second
            
            return res.json({
                ready: false,
                processing: true,
                message: 'Activation session created, processing...'
            });
            
        } catch (error) {
            logger.error('Failed to create direct activation session:', error);
            return res.json({
                ready: false,
                error: 'Failed to create activation session'
            });
        }
    }
    
    const sessionData = sessionManager.getPollingSession(session);
    
    if (!sessionData) {
        return res.json({ 
            ready: false, 
            error: 'Invalid session' 
        });
    }
    
    // Check session age
    const sessionAge = Date.now() - sessionData.createdAt;
    if (sessionAge > 5 * 60 * 1000) { // 5 minutes
        sessionManager.deletePollingSession(session);
        return res.json({ 
            ready: false, 
            error: 'Session expired' 
        });
    }
    
    // Return status based on session state
    if (sessionData.status === 'ready') {
        // Clean up polling session (one-time use)
        sessionManager.deletePollingSession(session);
        
        return res.json({ 
            ready: true, 
            portalUrl: sessionData.portalUrl 
        });
        
    } else if (sessionData.status === 'error') {
        sessionManager.deletePollingSession(session);
        
        return res.json({ 
            ready: false, 
            error: sessionData.error 
        });
        
    } else {
        // Still processing
        return res.json({ 
            ready: false, 
            processing: true 
        });
    }
});

// ============================================================================
// Portal Entry Routes
// ============================================================================

// API endpoint for portal token validation
router.get('/portal/validate', async (req, res) => {
    const token = req.query.t;
    const sessionManager = req.app.locals.sessionManager;
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'No token provided' 
        });
    }
    
    try {
        // Validate token
        const sessionData = await sessionManager.validatePortalSession(token);
        
        if (!sessionData) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid token' 
            });
        }
        
        logger.info(`Portal token validated for ${sessionData.email}`);
        
        // Return customer data
        return res.json({
            success: true,
            data: {
                email: sessionData.email,
                firstName: sessionData.first_name,
                lastName: sessionData.last_name,
                customerId: sessionData.customer_id,
                shopifyCustomerId: sessionData.shopify_customer_id,
                hasNewActivation: sessionData.has_new_activation,
                testKitId: sessionData.test_kit_id
            }
        });
        
    } catch (error) {
        logger.error('Portal validation error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Validation failed' 
        });
    }
});

// Portal entry point with token validation (browser redirect)
router.get('/portal', async (req, res) => {
    const token = req.query.t;
    const sessionManager = req.app.locals.sessionManager;
    
    if (!token) {
        logger.warn('Portal access attempted without token');
        return res.redirect(process.env.SHOPIFY_STORE_URL || '/');
    }
    
    try {
        // Validate and consume token
        const sessionData = await sessionManager.validatePortalSession(token);
        
        if (!sessionData) {
            logger.warn('Invalid or expired portal token');
            return res.redirect(process.env.SHOPIFY_STORE_URL || '/');
        }
        
        // Create express session
        req.session.customer = {
            ...sessionData,
            authenticated: true,
            authenticatedAt: Date.now()
        };
        
        logger.info(`Portal session created for ${sessionData.email}`);
        
        // Redirect to customer portal
        res.redirect('/customer-portal.html');
        
    } catch (error) {
        logger.error('Portal entry error:', error);
        res.redirect(process.env.SHOPIFY_STORE_URL || '/');
    }
});

// ============================================================================
// Utility Routes
// ============================================================================

// Health check for Shopify integration
router.get('/health', (req, res) => {
    const sessionManager = req.app.locals.sessionManager;
    
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        shopify: {
            webhooksConfigured: true,
            storeUrl: process.env.SHOPIFY_STORE_URL,
            apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01'
        },
        sessions: {
            polling: sessionManager.pollingSessions.size
        }
    });
});

// Webhook verification endpoint (for Shopify webhook configuration)
router.get('/webhooks/verify', (req, res) => {
    res.send('Shopify webhook endpoint active');
});

// ============================================================================
// Admin Routes (for testing/debugging)
// ============================================================================

if (process.env.NODE_ENV !== 'production') {
    // Test webhook replay (development only)
    router.post('/admin/replay-webhook/:webhookId', async (req, res) => {
        try {
            const db = req.app.locals.db;
            const connection = await db.getConnection();
            
            const [webhooks] = await connection.execute(`
                SELECT * FROM nad_shopify_webhooks 
                WHERE id = ?
            `, [req.params.webhookId]);
            
            connection.release();
            
            if (webhooks.length === 0) {
                return res.status(404).json({ error: 'Webhook not found' });
            }
            
            const webhook = webhooks[0];
            const payload = JSON.parse(webhook.payload);
            
            // Reprocess webhook
            const result = await processCustomerUpdate(payload);
            
            res.json({ 
                success: true, 
                result,
                webhook: {
                    id: webhook.id,
                    topic: webhook.topic,
                    created_at: webhook.created_at
                }
            });
            
        } catch (error) {
            logger.error('Webhook replay error:', error);
            res.status(500).json({ error: error.message });
        }
    });
    
    // View recent webhooks (development only)
    router.get('/admin/webhooks', async (req, res) => {
        try {
            const db = req.app.locals.db;
            const connection = await db.getConnection();
            
            const [webhooks] = await connection.execute(`
                SELECT id, webhook_id, topic, shop_domain, processed, 
                       error_message, created_at 
                FROM nad_shopify_webhooks 
                ORDER BY created_at DESC 
                LIMIT 50
            `);
            
            connection.release();
            
            res.json({ 
                success: true, 
                count: webhooks.length,
                webhooks 
            });
            
        } catch (error) {
            logger.error('Webhook list error:', error);
            res.status(500).json({ error: error.message });
        }
    });
}

module.exports = router;