const crypto = require('crypto');

// Initialize logger with fallback
let logger;
try {
    const { createLogger } = require('../logger');
    logger = createLogger({ module: 'shopify-session' });
} catch (error) {
    // Fallback logger if main logger isn't ready
    logger = {
        info: (...args) => console.log('[SHOPIFY-SESSION]', ...args),
        error: (...args) => console.error('[SHOPIFY-SESSION ERROR]', ...args),
        warn: (...args) => console.warn('[SHOPIFY-SESSION WARN]', ...args),
        debug: (...args) => console.log('[SHOPIFY-SESSION DEBUG]', ...args)
    };
}

// ============================================================================
// Session Management for Shopify Integration
// ============================================================================

class SessionManager {
    constructor(db) {
        this.db = db;
        // In production, use Redis instead of Map
        this.pollingSessions = new Map();
        
        // Cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions();
        }, 5 * 60 * 1000); // Every 5 minutes
    }
    
    // ============================================================================
    // Polling Session Management (for webhook -> frontend communication)
    // ============================================================================
    
    createPollingSession(sessionId, customerData) {
        this.pollingSessions.set(sessionId, {
            customerId: customerData.id,
            email: customerData.email,
            firstName: customerData.first_name,
            lastName: customerData.last_name,
            status: 'processing',
            createdAt: Date.now()
        });
        
        logger.info(`Created polling session: ${sessionId}`);
    }
    
    updatePollingSession(sessionId, updates) {
        const session = this.pollingSessions.get(sessionId);
        if (session) {
            this.pollingSessions.set(sessionId, { ...session, ...updates });
            logger.info(`Updated polling session: ${sessionId}`, updates);
        }
    }
    
    getPollingSession(sessionId) {
        return this.pollingSessions.get(sessionId);
    }
    
    deletePollingSession(sessionId) {
        this.pollingSessions.delete(sessionId);
        logger.info(`Deleted polling session: ${sessionId}`);
    }
    
    // ============================================================================
    // Portal Session Management (for authenticated portal access)
    // ============================================================================
    
    async createPortalSession(customerData, testKitId = null, hasNewActivation = false) {
        const connection = await this.db.getConnection();
        
        try {
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            
            await connection.execute(`
                INSERT INTO nad_portal_sessions 
                (token, session_type, customer_id, shopify_customer_id, email, 
                 first_name, last_name, test_kit_id, has_new_activation, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                token,
                customerData.shopify_customer_id ? 'shopify' : 'email',
                customerData.email,
                customerData.shopify_customer_id || null,
                customerData.email,
                customerData.first_name || customerData.firstName,
                customerData.last_name || customerData.lastName,
                testKitId,
                hasNewActivation,
                expiresAt
            ]);
            
            logger.info(`Created portal session for ${customerData.email}`);
            
            return {
                token,
                portalUrl: `${process.env.FRONTEND_URL || 'https://mynadtest.info'}/portal?t=${token}`,
                expiresAt
            };
            
        } finally {
            connection.release();
        }
    }
    
    async validatePortalSession(token) {
        const connection = await this.db.getConnection();
        
        try {
            // Get session and update accessed_at
            const [sessions] = await connection.execute(`
                UPDATE nad_portal_sessions 
                SET accessed_at = NOW()
                WHERE token = ? AND expires_at > NOW()
                LIMIT 1
            `, [token]);
            
            if (sessions.affectedRows === 0) {
                return null;
            }
            
            // Fetch session data
            const [sessionData] = await connection.execute(`
                SELECT * FROM nad_portal_sessions 
                WHERE token = ?
            `, [token]);
            
            if (sessionData.length === 0) {
                return null;
            }
            
            const session = sessionData[0];
            
            // Delete one-time use token
            await connection.execute(`
                DELETE FROM nad_portal_sessions 
                WHERE token = ?
            `, [token]);
            
            logger.info(`Validated and consumed portal session for ${session.email}`);
            
            return {
                customerId: session.shopify_customer_id || session.customer_id,
                email: session.email,
                firstName: session.first_name,
                lastName: session.last_name,
                testKitId: session.test_kit_id,
                hasNewActivation: session.has_new_activation,
                sessionType: session.session_type
            };
            
        } finally {
            connection.release();
        }
    }
    
    // ============================================================================
    // Authentication Helpers
    // ============================================================================
    
    async authenticateCustomer(req) {
        // Check for Shopify session
        if (req.session?.shopify_customer) {
            return {
                type: 'shopify',
                customerId: req.session.shopify_customer.id,
                email: req.session.shopify_customer.email,
                firstName: req.session.shopify_customer.firstName,
                lastName: req.session.shopify_customer.lastName,
                authenticated: true
            };
        }
        
        // Check for portal session
        if (req.session?.customer?.authenticated) {
            return {
                type: req.session.customer.sessionType || 'email',
                customerId: req.session.customer.customerId,
                email: req.session.customer.email,
                firstName: req.session.customer.firstName,
                lastName: req.session.customer.lastName,
                authenticated: true
            };
        }
        
        // Check for email-based authentication (legacy)
        if (req.body?.email) {
            return {
                type: 'email',
                customerId: null,
                email: req.body.email,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                authenticated: false // Not truly authenticated, just identified
            };
        }
        
        return null;
    }
    
    // ============================================================================
    // Cleanup
    // ============================================================================
    
    cleanupExpiredSessions() {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        // Cleanup polling sessions
        for (const [key, session] of this.pollingSessions) {
            if (now - session.createdAt > fiveMinutes) {
                this.pollingSessions.delete(key);
                logger.debug(`Cleaned up expired polling session: ${key}`);
            }
        }
    }
    
    async cleanupExpiredPortalSessions() {
        const connection = await this.db.getConnection();
        
        try {
            const [result] = await connection.execute(`
                DELETE FROM nad_portal_sessions 
                WHERE expires_at < NOW()
            `);
            
            if (result.affectedRows > 0) {
                logger.info(`Cleaned up ${result.affectedRows} expired portal sessions`);
            }
        } catch (error) {
            logger.error('Failed to cleanup expired portal sessions:', error);
        } finally {
            connection.release();
        }
    }
    
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

// ============================================================================
// Express Session Configuration
// ============================================================================

function getSessionConfig() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
        secret: process.env.SESSION_SECRET || 'dev-secret-change-this',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: isProduction, // HTTPS only in production
            httpOnly: true,
            maxAge: 30 * 60 * 1000, // 30 minutes
            sameSite: isProduction ? 'strict' : 'lax'
        },
        name: 'nad_session' // Custom session name
    };
}

// ============================================================================
// Middleware
// ============================================================================

function requireAuthentication(req, res, next) {
    const sessionManager = req.app.locals.sessionManager;
    
    sessionManager.authenticateCustomer(req).then(customer => {
        if (!customer || !customer.authenticated) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        
        req.customer = customer;
        next();
    }).catch(error => {
        logger.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    });
}

function optionalAuthentication(req, res, next) {
    const sessionManager = req.app.locals.sessionManager;
    
    sessionManager.authenticateCustomer(req).then(customer => {
        req.customer = customer; // May be null
        next();
    }).catch(error => {
        logger.error('Authentication error:', error);
        req.customer = null;
        next();
    });
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
    SessionManager,
    getSessionConfig,
    requireAuthentication,
    optionalAuthentication
};