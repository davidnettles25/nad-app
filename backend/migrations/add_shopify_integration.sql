-- ============================================================================
-- Shopify Integration Database Migration
-- Adds support for Shopify customers without breaking existing functionality
-- ============================================================================

-- Add Shopify columns to existing tables (non-breaking changes)
ALTER TABLE nad_test_ids 
ADD COLUMN shopify_customer_id BIGINT DEFAULT NULL COMMENT 'Shopify customer ID',
ADD COLUMN shopify_order_id BIGINT DEFAULT NULL COMMENT 'Shopify order ID',
ADD INDEX idx_shopify_customer (shopify_customer_id),
ADD INDEX idx_shopify_order (shopify_order_id);

-- Create table for Shopify customer data
CREATE TABLE IF NOT EXISTS nad_shopify_customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shopify_customer_id BIGINT UNIQUE NOT NULL COMMENT 'Shopify customer ID',
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    accepts_marketing BOOLEAN DEFAULT FALSE,
    currency VARCHAR(3) DEFAULT 'USD',
    tags TEXT COMMENT 'Comma-separated tags from Shopify',
    note TEXT COMMENT 'Customer notes from Shopify',
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    orders_count INT DEFAULT 0,
    verified_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    shopify_created_at TIMESTAMP NULL,
    shopify_updated_at TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for portal sessions
CREATE TABLE IF NOT EXISTS nad_portal_sessions (
    token VARCHAR(64) PRIMARY KEY,
    session_type ENUM('shopify', 'email') NOT NULL DEFAULT 'email',
    customer_id VARCHAR(255) COMMENT 'Email or Shopify customer ID',
    shopify_customer_id BIGINT DEFAULT NULL,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    test_kit_id VARCHAR(25) DEFAULT NULL,
    has_new_activation BOOLEAN DEFAULT FALSE,
    metadata JSON COMMENT 'Additional session data',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_expires (expires_at),
    INDEX idx_customer (customer_id),
    INDEX idx_shopify (shopify_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for webhook events (for debugging and replay)
CREATE TABLE IF NOT EXISTS nad_shopify_webhooks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webhook_id VARCHAR(100) UNIQUE COMMENT 'X-Shopify-Webhook-Id header',
    topic VARCHAR(100) NOT NULL COMMENT 'X-Shopify-Topic header',
    shop_domain VARCHAR(255) COMMENT 'X-Shopify-Shop-Domain header',
    api_version VARCHAR(20) COMMENT 'X-Shopify-API-Version header',
    payload JSON NOT NULL COMMENT 'Full webhook payload',
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP NULL,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_topic (topic),
    INDEX idx_processed (processed),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for Shopify metafield operations log
CREATE TABLE IF NOT EXISTS nad_shopify_metafields_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shopify_customer_id BIGINT NOT NULL,
    metafield_id BIGINT,
    namespace VARCHAR(100),
    key_name VARCHAR(100),
    value_type VARCHAR(50),
    value TEXT,
    operation ENUM('create', 'update', 'delete') NOT NULL,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customer (shopify_customer_id),
    INDEX idx_operation (operation),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add stored procedures for dual customer support
DELIMITER $$

-- Procedure to find customer by email or Shopify ID
CREATE PROCEDURE find_customer_tests(
    IN p_email VARCHAR(255),
    IN p_shopify_customer_id BIGINT
)
BEGIN
    SELECT 
        ti.*,
        ts.score,
        ts.score_date,
        COALESCE(sc.first_name, 'Unknown') as first_name,
        COALESCE(sc.last_name, 'Customer') as last_name
    FROM nad_test_ids ti
    LEFT JOIN nad_test_scores ts ON ti.test_id = ts.test_id
    LEFT JOIN nad_shopify_customers sc ON ti.shopify_customer_id = sc.shopify_customer_id
    WHERE (ti.customer_id = p_email OR ti.shopify_customer_id = p_shopify_customer_id)
    ORDER BY ti.created_date DESC;
END$$

-- Procedure to activate test for either customer type
CREATE PROCEDURE activate_test_dual(
    IN p_test_id VARCHAR(25),
    IN p_email VARCHAR(255),
    IN p_shopify_customer_id BIGINT,
    IN p_customer_name VARCHAR(255)
)
BEGIN
    DECLARE v_existing_activation INT DEFAULT 0;
    
    -- Check if test is already activated
    SELECT COUNT(*) INTO v_existing_activation
    FROM nad_test_ids
    WHERE test_id = p_test_id AND is_activated = 1;
    
    IF v_existing_activation = 0 THEN
        -- Activate the test
        UPDATE nad_test_ids 
        SET 
            is_activated = 1,
            activated_date = NOW(),
            customer_id = COALESCE(p_email, customer_id),
            shopify_customer_id = COALESCE(p_shopify_customer_id, shopify_customer_id),
            customer_name = COALESCE(p_customer_name, customer_name)
        WHERE test_id = p_test_id;
        
        -- Create score record
        INSERT INTO nad_test_scores (test_id, customer_id, activated_by, activation_date)
        VALUES (p_test_id, COALESCE(p_email, CONCAT('shopify_', p_shopify_customer_id)), 
                COALESCE(p_email, CONCAT('shopify_', p_shopify_customer_id)), NOW())
        ON DUPLICATE KEY UPDATE activation_date = NOW();
        
        SELECT 'success' as status, 'Test activated successfully' as message;
    ELSE
        SELECT 'error' as status, 'Test already activated' as message;
    END IF;
END$$

DELIMITER ;

-- Create indexes for performance
CREATE INDEX idx_test_dual_customer ON nad_test_ids(customer_id, shopify_customer_id);
CREATE INDEX idx_supplements_dual ON nad_user_supplements(customer_id);

-- Add comments for documentation
ALTER TABLE nad_test_ids COMMENT = 'Test kit records - supports both email and Shopify customers';
ALTER TABLE nad_shopify_customers COMMENT = 'Shopify customer data synchronized via webhooks';
ALTER TABLE nad_portal_sessions COMMENT = 'Portal authentication sessions for both customer types';
ALTER TABLE nad_shopify_webhooks COMMENT = 'Webhook event log for debugging and replay';
ALTER TABLE nad_shopify_metafields_log COMMENT = 'Metafield operations audit trail';