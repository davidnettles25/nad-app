-- ============================================================================
-- Order ID Field Removal - Database Backup Script
-- ============================================================================
-- 
-- This script creates a backup of the current database state before
-- removing order_id fields from the NAD+ application.
-- 
-- Migration: Order ID Field Removal
-- Date: July 20, 2025
-- Purpose: Backup before removing order_id column from nad_test_ids
-- 
-- IMPORTANT: Run this script BEFORE starting the migration!
-- ============================================================================

-- Create backup timestamp
SELECT 'Order ID Removal Migration Backup' as backup_info;
SELECT NOW() as backup_timestamp;

-- ============================================================================
-- SCHEMA BACKUP - Current table structures
-- ============================================================================

-- Backup current nad_test_ids schema
SELECT 'nad_test_ids table structure:' as info;
DESCRIBE nad_test_ids;

-- Backup current nad_test_scores schema (also has order_id)
SELECT 'nad_test_scores table structure:' as info;
DESCRIBE nad_test_scores;

-- Show current indexes on order_id
SELECT 'Current indexes on order_id fields:' as info;
SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND COLUMN_NAME = 'order_id'
ORDER BY TABLE_NAME, INDEX_NAME;

-- ============================================================================
-- DATA BACKUP - Current order_id usage patterns
-- ============================================================================

-- Count tests with order_id values
SELECT 'Tests with order_id distribution:' as info;
SELECT 
    CASE 
        WHEN order_id IS NULL THEN 'NULL order_id'
        ELSE 'Has order_id'
    END as order_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM nad_test_ids), 2) as percentage
FROM nad_test_ids 
GROUP BY (order_id IS NULL)
ORDER BY count DESC;

-- Show sample order_id values (for validation)
SELECT 'Sample order_id values from nad_test_ids:' as info;
SELECT test_id, order_id, customer_id, status, created_date
FROM nad_test_ids 
WHERE order_id IS NOT NULL
ORDER BY created_date DESC 
LIMIT 10;

-- Check nad_test_scores order_id usage
SELECT 'nad_test_scores order_id usage:' as info;
SELECT 
    CASE 
        WHEN order_id IS NULL THEN 'NULL order_id'
        ELSE 'Has order_id'
    END as order_status,
    COUNT(*) as count
FROM nad_test_scores 
GROUP BY (order_id IS NULL)
ORDER BY count DESC;

-- Sample nad_test_scores data
SELECT 'Sample nad_test_scores with order_id:' as info;
SELECT test_id, order_id, customer_id, status, created_date
FROM nad_test_scores 
WHERE order_id IS NOT NULL
ORDER BY created_date DESC 
LIMIT 5;

-- ============================================================================
-- VALIDATION QUERIES - For post-migration verification
-- ============================================================================

-- Total test count (should remain same after migration)
SELECT 'Total test count before migration:' as info;
SELECT COUNT(*) as total_tests FROM nad_test_ids;

-- Test status distribution (should remain same)
SELECT 'Test status distribution before migration:' as info;
SELECT status, COUNT(*) as count
FROM nad_test_ids 
GROUP BY status
ORDER BY count DESC;

-- Tests by batch (should remain same)
SELECT 'Tests by batch before migration:' as info;
SELECT 
    CASE 
        WHEN batch_id IS NULL THEN 'Individual tests'
        ELSE 'Batch tests'
    END as batch_type,
    COUNT(*) as count
FROM nad_test_ids 
GROUP BY (batch_id IS NULL)
ORDER BY count DESC;

-- Customer distribution (should remain same)
SELECT 'Customer distribution before migration:' as info;
SELECT 
    CASE 
        WHEN customer_id IS NULL THEN 'No customer'
        ELSE 'Has customer'
    END as customer_status,
    COUNT(*) as count
FROM nad_test_ids 
GROUP BY (customer_id IS NULL)
ORDER BY count DESC;

-- ============================================================================
-- FULL TABLE BACKUP (Create backup tables)
-- ============================================================================

-- Create backup table for nad_test_ids
SELECT 'Creating nad_test_ids backup table...' as info;
DROP TABLE IF EXISTS nad_test_ids_backup_order_migration;
CREATE TABLE nad_test_ids_backup_order_migration AS 
SELECT * FROM nad_test_ids;

-- Verify backup table
SELECT 'nad_test_ids backup verification:' as info;
SELECT COUNT(*) as backup_count FROM nad_test_ids_backup_order_migration;
SELECT COUNT(*) as original_count FROM nad_test_ids;

-- Create backup table for nad_test_scores (if needed)
SELECT 'Creating nad_test_scores backup table...' as info;
DROP TABLE IF EXISTS nad_test_scores_backup_order_migration;
CREATE TABLE nad_test_scores_backup_order_migration AS 
SELECT * FROM nad_test_scores;

-- Verify backup table
SELECT 'nad_test_scores backup verification:' as info;
SELECT COUNT(*) as backup_count FROM nad_test_scores_backup_order_migration;
SELECT COUNT(*) as original_count FROM nad_test_scores;

-- ============================================================================
-- BACKUP COMPLETION
-- ============================================================================

SELECT 'Backup completed successfully!' as status;
SELECT NOW() as completion_time;
SELECT 'Ready to proceed with order_id removal migration' as next_step;

-- ============================================================================
-- RESTORE INSTRUCTIONS (For emergency rollback)
-- ============================================================================

/*
TO RESTORE FROM THIS BACKUP:

1. Drop current tables:
   DROP TABLE nad_test_ids;
   DROP TABLE nad_test_scores;

2. Restore from backup:
   CREATE TABLE nad_test_ids AS SELECT * FROM nad_test_ids_backup_order_migration;
   CREATE TABLE nad_test_scores AS SELECT * FROM nad_test_scores_backup_order_migration;

3. Recreate indexes:
   ALTER TABLE nad_test_ids ADD PRIMARY KEY (id);
   ALTER TABLE nad_test_ids ADD UNIQUE KEY test_id (test_id);
   ALTER TABLE nad_test_ids ADD KEY idx_test_id (test_id);
   ALTER TABLE nad_test_ids ADD KEY idx_order_id (order_id);
   ALTER TABLE nad_test_ids ADD KEY idx_customer_id (customer_id);
   ALTER TABLE nad_test_ids ADD KEY idx_batch_id (batch_id);

4. Verify restoration:
   SELECT COUNT(*) FROM nad_test_ids;
   DESCRIBE nad_test_ids;
*/

-- ============================================================================
-- CLEANUP BACKUP TABLES (Run after successful migration)
-- ============================================================================

/*
AFTER SUCCESSFUL MIGRATION, CLEANUP WITH:

DROP TABLE IF EXISTS nad_test_ids_backup_order_migration;
DROP TABLE IF EXISTS nad_test_scores_backup_order_migration;
*/