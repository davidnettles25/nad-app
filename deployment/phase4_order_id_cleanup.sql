-- ============================================================================
-- Phase 4: Order ID Column Removal - Database Schema Cleanup
-- ============================================================================
-- 
-- This script removes the order_id column from nad_test_ids table
-- after successful migration away from order-based tracking.
-- 
-- Prerequisites:
-- - Phase 1: Migration audit completed
-- - Phase 2: Backend endpoints migrated 
-- - Phase 3: Frontend code updated
-- - All code references to order_id removed
-- 
-- IMPORTANT: Create database backup before running this script!
-- ============================================================================

-- Verify current state before cleanup
SELECT 'Current nad_test_ids structure:' as info;
DESCRIBE nad_test_ids;

-- Check order_id column exists
SELECT 'Checking for order_id column:' as info;
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'nad_test_ids' 
AND COLUMN_NAME = 'order_id';

-- Show order_id usage distribution
SELECT 'Order ID usage distribution:' as info;
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

-- Sample order_id values (for reference)
SELECT 'Sample order_id values:' as info;
SELECT test_id, order_id, customer_id, status, created_date
FROM nad_test_ids 
WHERE order_id IS NOT NULL
ORDER BY created_date DESC 
LIMIT 10;

-- Total test count (should remain same after cleanup)
SELECT 'Total test count before cleanup:' as info;
SELECT COUNT(*) as total_tests FROM nad_test_ids;

-- ============================================================================
-- SCHEMA CLEANUP
-- ============================================================================

-- Step 1: Remove order_id index (if exists)
SELECT 'Removing idx_order_id index...' as info;
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'nad_test_ids' 
     AND INDEX_NAME = 'idx_order_id') > 0,
    'ALTER TABLE nad_test_ids DROP INDEX idx_order_id',
    'SELECT "Index idx_order_id does not exist" as info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Remove order_id column from nad_test_ids
SELECT 'Removing order_id column from nad_test_ids...' as info;
ALTER TABLE nad_test_ids DROP COLUMN order_id;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify column was removed
SELECT 'Verifying order_id column removal:' as info;
SELECT COUNT(*) as order_id_columns_remaining
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'nad_test_ids' 
AND COLUMN_NAME = 'order_id';

-- Show final table structure
SELECT 'Final nad_test_ids structure:' as info;
DESCRIBE nad_test_ids;

-- Verify data integrity (test count should be same)
SELECT 'Data integrity check:' as info;
SELECT COUNT(*) as total_tests_after_cleanup FROM nad_test_ids;

-- Show test distribution by status (should be unchanged)
SELECT 'Test status distribution after cleanup:' as info;
SELECT status, COUNT(*) as count
FROM nad_test_ids 
GROUP BY status
ORDER BY count DESC;

-- Sample test data after cleanup
SELECT 'Sample test data after cleanup:' as info;
SELECT test_id, status, customer_id, batch_id, created_date
FROM nad_test_ids 
ORDER BY created_date DESC 
LIMIT 10;

-- ============================================================================
-- NAD_TEST_SCORES ORDER_ID CHECK
-- ============================================================================

-- Check if nad_test_scores still has order_id column
SELECT 'Checking nad_test_scores for order_id column:' as info;
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'nad_test_scores' 
AND COLUMN_NAME = 'order_id';

-- If nad_test_scores.order_id exists, show usage
SELECT 'nad_test_scores order_id usage (if column exists):' as info;
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'nad_test_scores' 
            AND COLUMN_NAME = 'order_id'
        ) THEN 'order_id column does not exist in nad_test_scores'
        ELSE CONCAT('Found ', 
            (SELECT COUNT(*) FROM nad_test_scores WHERE order_id IS NOT NULL), 
            ' records with order_id in nad_test_scores')
    END as nad_test_scores_status;

-- ============================================================================
-- CLEANUP COMPLETION
-- ============================================================================

SELECT 'Order ID column cleanup completed!' as status;
SELECT NOW() as completion_time;
SELECT 'nad_test_ids.order_id column successfully removed' as result;

-- ============================================================================
-- MANUAL VERIFICATION QUERIES
-- ============================================================================

/*
Run these queries to manually verify cleanup success:

1. Verify order_id column removed:
   DESCRIBE nad_test_ids;

2. Check no order_id references remain:
   SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND COLUMN_NAME = 'order_id';

3. Verify data integrity:
   SELECT COUNT(*) FROM nad_test_ids;
   SELECT status, COUNT(*) FROM nad_test_ids GROUP BY status;

4. Test basic functionality:
   SELECT * FROM nad_test_ids LIMIT 5;
   
5. Verify indexes:
   SHOW INDEX FROM nad_test_ids;
*/

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (Emergency use only)
-- ============================================================================

/*
TO ROLLBACK THIS CLEANUP (Emergency only):

1. Add order_id column back:
   ALTER TABLE nad_test_ids 
   ADD COLUMN order_id BIGINT(20) DEFAULT NULL 
   AFTER customer_id;

2. Recreate index:
   ALTER TABLE nad_test_ids 
   ADD KEY idx_order_id (order_id);

3. Restore order_id data from backup:
   -- Use backup tables created in phase1_backup.sql
   UPDATE nad_test_ids ti 
   SET order_id = (
       SELECT order_id 
       FROM nad_test_ids_backup_order_migration b 
       WHERE b.test_id = ti.test_id 
       LIMIT 1
   );

4. Verify restoration:
   DESCRIBE nad_test_ids;
   SELECT COUNT(*), COUNT(order_id) FROM nad_test_ids;
*/