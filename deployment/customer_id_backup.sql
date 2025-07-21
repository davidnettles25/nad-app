-- ============================================================================
-- Customer ID Migration - Database Backup Script
-- ============================================================================
-- 
-- This script creates a backup of the current database state before
-- migrating customer_id from BIGINT(20) to VARCHAR(255) for Shopify Multipass.
-- 
-- Migration: Customer ID Type Change (BIGINT → VARCHAR)
-- Date: July 20, 2025
-- Purpose: Backup before changing customer_id to support email addresses
-- 
-- IMPORTANT: Run this script BEFORE starting the customer_id migration!
-- ============================================================================

-- Create backup timestamp
SELECT 'Customer ID Migration Backup' as backup_info;
SELECT NOW() as backup_timestamp;

-- ============================================================================
-- SCHEMA BACKUP - Current table structures
-- ============================================================================

-- Backup nad_test_ids schema
SELECT 'nad_test_ids table structure:' as info;
DESCRIBE nad_test_ids;

-- Backup nad_test_scores schema
SELECT 'nad_test_scores table structure:' as info;
DESCRIBE nad_test_scores;

-- Backup nad_user_roles schema  
SELECT 'nad_user_roles table structure:' as info;
DESCRIBE nad_user_roles;

-- Backup nad_user_supplements schema
SELECT 'nad_user_supplements table structure:' as info;
DESCRIBE nad_user_supplements;

-- Show current indexes on customer_id fields
SELECT 'Current indexes on customer_id fields:' as info;
SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND COLUMN_NAME = 'customer_id'
ORDER BY TABLE_NAME, INDEX_NAME;

-- Show column types for all customer_id fields
SELECT 'Current customer_id column types:' as info;
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND COLUMN_NAME = 'customer_id'
ORDER BY TABLE_NAME;

-- ============================================================================
-- DATA BACKUP - Current customer_id usage patterns
-- ============================================================================

-- Customer_id distribution in nad_test_ids
SELECT 'Customer ID distribution in nad_test_ids:' as info;
SELECT 
    CASE 
        WHEN customer_id IS NULL THEN 'NULL customer_id'
        ELSE 'Has customer_id'
    END as customer_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM nad_test_ids), 2) as percentage
FROM nad_test_ids 
GROUP BY (customer_id IS NULL)
ORDER BY count DESC;

-- Top customer IDs by test count
SELECT 'Top customers by test count:' as info;
SELECT customer_id, COUNT(*) as test_count
FROM nad_test_ids 
WHERE customer_id IS NOT NULL
GROUP BY customer_id 
ORDER BY test_count DESC 
LIMIT 10;

-- Customer_id distribution in nad_test_scores
SELECT 'Customer ID distribution in nad_test_scores:' as info;
SELECT 
    CASE 
        WHEN customer_id IS NULL THEN 'NULL customer_id'
        ELSE 'Has customer_id'
    END as customer_status,
    COUNT(*) as count
FROM nad_test_scores 
GROUP BY (customer_id IS NULL)
ORDER BY count DESC;

-- Customer_id distribution in nad_user_roles
SELECT 'Customer ID distribution in nad_user_roles:' as info;
SELECT role, COUNT(*) as customer_count
FROM nad_user_roles 
GROUP BY role
ORDER BY customer_count DESC;

-- Customer_id distribution in nad_user_supplements  
SELECT 'Customer ID distribution in nad_user_supplements:' as info;
SELECT 
    COUNT(DISTINCT customer_id) as unique_customers,
    COUNT(*) as total_supplement_records,
    ROUND(COUNT(*) / COUNT(DISTINCT customer_id), 2) as avg_records_per_customer
FROM nad_user_supplements;

-- Cross-table customer_id consistency check
SELECT 'Cross-table customer_id consistency:' as info;
SELECT 
    'nad_test_ids' as table_name,
    COUNT(DISTINCT customer_id) as unique_customers,
    COUNT(*) as total_records
FROM nad_test_ids WHERE customer_id IS NOT NULL
UNION ALL
SELECT 
    'nad_test_scores',
    COUNT(DISTINCT customer_id),
    COUNT(*)
FROM nad_test_scores WHERE customer_id IS NOT NULL
UNION ALL
SELECT 
    'nad_user_roles',
    COUNT(DISTINCT customer_id),
    COUNT(*)
FROM nad_user_roles WHERE customer_id IS NOT NULL
UNION ALL
SELECT 
    'nad_user_supplements',
    COUNT(DISTINCT customer_id),
    COUNT(*)
FROM nad_user_supplements WHERE customer_id IS NOT NULL;

-- Sample customer data for validation
SELECT 'Sample customer data from nad_test_ids:' as info;
SELECT test_id, customer_id, status, created_date
FROM nad_test_ids 
WHERE customer_id IS NOT NULL
ORDER BY created_date DESC 
LIMIT 10;

-- ============================================================================
-- VALIDATION QUERIES - For post-migration verification
-- ============================================================================

-- Total record counts (should remain same after migration)
SELECT 'Record counts before migration:' as info;
SELECT 
    'nad_test_ids' as table_name,
    COUNT(*) as total_records
FROM nad_test_ids
UNION ALL
SELECT 
    'nad_test_scores',
    COUNT(*)
FROM nad_test_scores
UNION ALL
SELECT 
    'nad_user_roles',
    COUNT(*)
FROM nad_user_roles
UNION ALL
SELECT 
    'nad_user_supplements',
    COUNT(*)
FROM nad_user_supplements;

-- Customer relationships before migration
SELECT 'Customer relationships before migration:' as info;
SELECT 
    ti.customer_id,
    COUNT(DISTINCT ti.test_id) as tests,
    COUNT(DISTINCT ts.id) as scores,
    COUNT(DISTINCT ur.id) as roles,
    COUNT(DISTINCT us.id) as supplements
FROM nad_test_ids ti
LEFT JOIN nad_test_scores ts ON ti.customer_id = ts.customer_id
LEFT JOIN nad_user_roles ur ON ti.customer_id = ur.customer_id  
LEFT JOIN nad_user_supplements us ON ti.customer_id = us.customer_id
WHERE ti.customer_id IS NOT NULL
GROUP BY ti.customer_id
ORDER BY tests DESC
LIMIT 5;

-- ============================================================================
-- FULL TABLE BACKUP (Create backup tables)
-- ============================================================================

-- Create backup table for nad_test_ids
SELECT 'Creating nad_test_ids backup table...' as info;
DROP TABLE IF EXISTS nad_test_ids_backup_customer_migration;
CREATE TABLE nad_test_ids_backup_customer_migration AS 
SELECT * FROM nad_test_ids;

-- Verify backup table
SELECT 'nad_test_ids backup verification:' as info;
SELECT COUNT(*) as backup_count FROM nad_test_ids_backup_customer_migration;
SELECT COUNT(*) as original_count FROM nad_test_ids;

-- Create backup table for nad_test_scores
SELECT 'Creating nad_test_scores backup table...' as info;
DROP TABLE IF EXISTS nad_test_scores_backup_customer_migration;
CREATE TABLE nad_test_scores_backup_customer_migration AS 
SELECT * FROM nad_test_scores;

-- Verify backup table
SELECT 'nad_test_scores backup verification:' as info;
SELECT COUNT(*) as backup_count FROM nad_test_scores_backup_customer_migration;
SELECT COUNT(*) as original_count FROM nad_test_scores;

-- Create backup table for nad_user_roles
SELECT 'Creating nad_user_roles backup table...' as info;
DROP TABLE IF EXISTS nad_user_roles_backup_customer_migration;
CREATE TABLE nad_user_roles_backup_customer_migration AS 
SELECT * FROM nad_user_roles;

-- Verify backup table
SELECT 'nad_user_roles backup verification:' as info;
SELECT COUNT(*) as backup_count FROM nad_user_roles_backup_customer_migration;
SELECT COUNT(*) as original_count FROM nad_user_roles;

-- Create backup table for nad_user_supplements
SELECT 'Creating nad_user_supplements backup table...' as info;
DROP TABLE IF EXISTS nad_user_supplements_backup_customer_migration;
CREATE TABLE nad_user_supplements_backup_customer_migration AS 
SELECT * FROM nad_user_supplements;

-- Verify backup table  
SELECT 'nad_user_supplements backup verification:' as info;
SELECT COUNT(*) as backup_count FROM nad_user_supplements_backup_customer_migration;
SELECT COUNT(*) as original_count FROM nad_user_supplements;

-- ============================================================================
-- CONSTRAINTS AND INDEXES BACKUP
-- ============================================================================

-- Document current constraints
SELECT 'Current foreign key constraints:' as info;
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND COLUMN_NAME = 'customer_id'
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Document current indexes
SELECT 'Current customer_id indexes:' as info;
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE,
    INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND COLUMN_NAME = 'customer_id'
ORDER BY TABLE_NAME, INDEX_NAME;

-- ============================================================================
-- BACKUP COMPLETION
-- ============================================================================

SELECT 'Customer ID migration backup completed successfully!' as status;
SELECT NOW() as completion_time;
SELECT 'Ready to proceed with customer_id BIGINT → VARCHAR migration' as next_step;

-- ============================================================================
-- RESTORE INSTRUCTIONS (For emergency rollback)
-- ============================================================================

/*
TO RESTORE FROM THIS BACKUP:

1. Drop current tables:
   DROP TABLE nad_test_ids;
   DROP TABLE nad_test_scores; 
   DROP TABLE nad_user_roles;
   DROP TABLE nad_user_supplements;

2. Restore from backup:
   CREATE TABLE nad_test_ids AS SELECT * FROM nad_test_ids_backup_customer_migration;
   CREATE TABLE nad_test_scores AS SELECT * FROM nad_test_scores_backup_customer_migration;
   CREATE TABLE nad_user_roles AS SELECT * FROM nad_user_roles_backup_customer_migration;
   CREATE TABLE nad_user_supplements AS SELECT * FROM nad_user_supplements_backup_customer_migration;

3. Recreate primary keys and indexes:
   -- nad_test_ids
   ALTER TABLE nad_test_ids ADD PRIMARY KEY (id);
   ALTER TABLE nad_test_ids ADD UNIQUE KEY test_id (test_id);
   ALTER TABLE nad_test_ids ADD KEY idx_customer_id (customer_id);
   ALTER TABLE nad_test_ids ADD KEY idx_batch_id (batch_id);
   ALTER TABLE nad_test_ids ADD KEY idx_status (status);
   
   -- nad_test_scores
   ALTER TABLE nad_test_scores ADD PRIMARY KEY (id);
   ALTER TABLE nad_test_scores ADD UNIQUE KEY test_id (test_id);
   ALTER TABLE nad_test_scores ADD KEY idx_customer_id (customer_id);
   ALTER TABLE nad_test_scores ADD KEY idx_status (status);
   
   -- nad_user_roles
   ALTER TABLE nad_user_roles ADD PRIMARY KEY (id);
   ALTER TABLE nad_user_roles ADD UNIQUE KEY customer_id (customer_id);
   ALTER TABLE nad_user_roles ADD KEY idx_role (role);
   
   -- nad_user_supplements
   ALTER TABLE nad_user_supplements ADD PRIMARY KEY (id);
   ALTER TABLE nad_user_supplements ADD KEY idx_test_id (test_id);
   ALTER TABLE nad_user_supplements ADD KEY idx_customer_id (customer_id);

4. Verify restoration:
   DESCRIBE nad_test_ids;
   DESCRIBE nad_test_scores;
   DESCRIBE nad_user_roles;
   DESCRIBE nad_user_supplements;
   
   SELECT COUNT(*) FROM nad_test_ids;
   SELECT COUNT(*) FROM nad_test_scores;
   SELECT COUNT(*) FROM nad_user_roles;
   SELECT COUNT(*) FROM nad_user_supplements;
*/

-- ============================================================================
-- CLEANUP BACKUP TABLES (Run after successful migration)
-- ============================================================================

/*
AFTER SUCCESSFUL MIGRATION, CLEANUP WITH:

DROP TABLE IF EXISTS nad_test_ids_backup_customer_migration;
DROP TABLE IF EXISTS nad_test_scores_backup_customer_migration;
DROP TABLE IF EXISTS nad_user_roles_backup_customer_migration;
DROP TABLE IF EXISTS nad_user_supplements_backup_customer_migration;
*/