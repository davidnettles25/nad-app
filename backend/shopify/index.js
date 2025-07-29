const { SessionManager } = require('./session-manager');
const shopifyRoutes = require('./routes');

// Initialize logger with fallback
let logger;
try {
    const { createLogger } = require('../logger');
    logger = createLogger({ module: 'shopify' });
} catch (error) {
    // Fallback logger if main logger isn't ready
    logger = {
        info: (...args) => console.log('[SHOPIFY]', ...args),
        error: (...args) => console.error('[SHOPIFY ERROR]', ...args),
        warn: (...args) => console.warn('[SHOPIFY WARN]', ...args),
        debug: (...args) => console.log('[SHOPIFY DEBUG]', ...args)
    };
}

// ============================================================================
// Shopify Integration Module
// Main entry point for Shopify functionality
// ============================================================================

class ShopifyIntegration {
    constructor(app, db) {
        this.app = app;
        this.db = db;
        this.sessionManager = new SessionManager(db);
        
        // Store session manager and db in app locals for access in routes
        this.app.locals.sessionManager = this.sessionManager;
        this.app.locals.db = this.db;
        
        // Store global reference for webhook handlers
        global.pollingSessions = this.sessionManager.pollingSessions;
    }
    
    initialize() {
        // Check if Shopify integration is enabled
        if (process.env.ENABLE_SHOPIFY_INTEGRATION !== 'true') {
            logger.info('Shopify integration is disabled');
            return;
        }
        
        // Validate required environment variables
        const requiredVars = [
            'SHOPIFY_STORE_URL',
            'SHOPIFY_ACCESS_TOKEN',
            'SHOPIFY_WEBHOOK_SECRET'
        ];
        
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            logger.error('Missing required Shopify environment variables:', missingVars);
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
        
        // Mount Shopify routes
        console.log('[SHOPIFY] 🔍 DEBUG: About to mount routes, shopifyRoutes =', typeof shopifyRoutes, shopifyRoutes.constructor.name);
        console.log('[SHOPIFY] 🔍 DEBUG: shopifyRoutes.stack length =', shopifyRoutes.stack ? shopifyRoutes.stack.length : 'no stack');
        this.app.use('/shopify', shopifyRoutes);
        console.log('[SHOPIFY] 🔍 DEBUG: Routes mounted to app');
        
        // Schedule cleanup tasks
        this.scheduleCleanupTasks();
        
        console.log('[SHOPIFY] 🔍 DEBUG: Shopify integration completed successfully');
        logger.info('Shopify integration initialized successfully');
        logger.info(`Webhook endpoint: ${process.env.API_BASE_URL || 'http://localhost:3000'}/shopify/webhooks/customer-update`);
        logger.info(`Polling endpoint: ${process.env.API_BASE_URL || 'http://localhost:3000'}/shopify/check-portal-access`);
    }
    
    scheduleCleanupTasks() {
        // Cleanup expired portal sessions every hour
        setInterval(async () => {
            try {
                await this.sessionManager.cleanupExpiredPortalSessions();
            } catch (error) {
                logger.error('Portal session cleanup error:', error);
            }
        }, 60 * 60 * 1000); // 1 hour
        
        // Cleanup old webhook records daily
        setInterval(async () => {
            try {
                await this.cleanupOldWebhooks();
            } catch (error) {
                logger.error('Webhook cleanup error:', error);
            }
        }, 24 * 60 * 60 * 1000); // Daily cleanup
        
        // Log session statistics every 30 minutes
        if (process.env.NODE_ENV !== 'production') {
            setInterval(() => {
                logger.info('Session statistics:', {
                    pollingSessions: this.sessionManager.pollingSessions.size
                });
            }, 30 * 60 * 1000); // 30 minutes
        }
    }
    
    // Utility method to create test kit activation metafield in Shopify
    async createActivationMetafield(customerId, testKitId, sessionId) {
        const shopifyUrl = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/${process.env.SHOPIFY_API_VERSION || '2024-01'}/customers/${customerId}/metafields.json`;
        
        const metafieldData = {
            metafield: {
                namespace: 'customer',
                key: 'test_kit_activation',
                type: 'json',
                value: JSON.stringify({
                    testKitId,
                    timestamp: Date.now(),
                    sessionId,
                    requestType: 'activation'
                })
            }
        };
        
        try {
            const response = await fetch(shopifyUrl, {
                method: 'POST',
                headers: {
                    'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metafieldData)
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Shopify API error: ${response.status} - ${error}`);
            }
            
            const result = await response.json();
            logger.info(`Created activation metafield for customer ${customerId}`);
            
            return result.metafield;
            
        } catch (error) {
            logger.error('Failed to create activation metafield:', error);
            throw error;
        }
    }
    
    // Utility method to fetch customer data from Shopify
    async getCustomer(customerId) {
        const shopifyUrl = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/${process.env.SHOPIFY_API_VERSION || '2024-01'}/customers/${customerId}.json`;
        
        try {
            const response = await fetch(shopifyUrl, {
                method: 'GET',
                headers: {
                    'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Shopify API error: ${response.status} - ${error}`);
            }
            
            const result = await response.json();
            return result.customer;
            
        } catch (error) {
            logger.error('Failed to fetch customer:', error);
            throw error;
        }
    }
    
    // Cleanup old webhook records to prevent table bloat
    async cleanupOldWebhooks() {
        const retentionDays = parseInt(process.env.SHOPIFY_WEBHOOK_RETENTION_DAYS || '90');
        
        try {
            const query = `
                DELETE FROM nad_shopify_webhooks 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            `;
            
            const result = await this.db.execute(query, [retentionDays]);
            const deletedCount = result.affectedRows || 0;
            
            if (deletedCount > 0) {
                logger.info(`Webhook cleanup: Removed ${deletedCount} webhook records older than ${retentionDays} days`);
            } else {
                logger.debug(`Webhook cleanup: No webhook records older than ${retentionDays} days found`);
            }
            
            // Log current table size for monitoring
            const countQuery = 'SELECT COUNT(*) as total FROM nad_shopify_webhooks';
            const countResult = await this.db.execute(countQuery);
            const currentCount = countResult[0]?.total || 0;
            
            logger.info(`Webhook table status: ${currentCount} total records after cleanup`);
            
        } catch (error) {
            logger.error('Failed to cleanup old webhook records:', error);
            throw error;
        }
    }
    
    // Clean shutdown
    shutdown() {
        logger.info('Shutting down Shopify integration');
        this.sessionManager.destroy();
    }
}

// ============================================================================
// Factory function to create and initialize Shopify integration
// ============================================================================

function initializeShopifyIntegration(app, db) {
    const integration = new ShopifyIntegration(app, db);
    integration.initialize();
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        integration.shutdown();
    });
    
    return integration;
}

module.exports = {
    ShopifyIntegration,
    initializeShopifyIntegration,
    SessionManager
};