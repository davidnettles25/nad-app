-- Shopify Integration Database Migration
-- Creates tables for Shopify webhook handling, customer tracking, and portal sessions

-- Table to log all Shopify webhooks
CREATE TABLE IF NOT EXISTS nad_shopify_webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    webhook_id VARCHAR(255),
    topic VARCHAR(100) NOT NULL,
    shop_domain VARCHAR(255),
    api_version VARCHAR(20),
    payload JSON NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_webhook_id (webhook_id),
    INDEX idx_topic (topic),
    INDEX idx_created (created_at)
);

-- Table to store Shopify customer data
CREATE TABLE IF NOT EXISTS nad_shopify_customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shopify_customer_id BIGINT UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    accepts_marketing BOOLEAN DEFAULT FALSE,
    currency VARCHAR(10) DEFAULT 'USD',
    tags TEXT,
    note TEXT,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    orders_count INT DEFAULT 0,
    verified_email BOOLEAN DEFAULT FALSE,
    shopify_created_at TIMESTAMP NULL,
    shopify_updated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_shopify_id (shopify_customer_id)
);

-- Table to log metafield operations
CREATE TABLE IF NOT EXISTS nad_shopify_metafields_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shopify_customer_id BIGINT NOT NULL,
    metafield_id BIGINT,
    namespace VARCHAR(100),
    key_name VARCHAR(100),
    operation ENUM('create', 'update', 'delete') NOT NULL,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customer (shopify_customer_id),
    INDEX idx_operation (operation),
    INDEX idx_created (created_at)
);

-- Table for portal session management
CREATE TABLE IF NOT EXISTS nad_portal_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    session_type ENUM('shopify', 'email') NOT NULL,
    customer_id VARCHAR(255), -- Can be email or shopify ID
    shopify_customer_id BIGINT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    test_kit_id VARCHAR(50) NULL,
    has_new_activation BOOLEAN DEFAULT FALSE,
    metadata JSON NULL,
    expires_at TIMESTAMP NOT NULL,
    accessed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_email (email),
    INDEX idx_expires (expires_at)
);

-- Add Shopify-related columns to nad_test_ids if they don't exist
ALTER TABLE nad_test_ids 
ADD COLUMN IF NOT EXISTS shopify_customer_id BIGINT NULL,
ADD INDEX IF NOT EXISTS idx_shopify_customer (shopify_customer_id);

-- Add composite index for faster lookups
ALTER TABLE nad_test_ids
ADD INDEX IF NOT EXISTS idx_customer_shopify (customer_id, shopify_customer_id);