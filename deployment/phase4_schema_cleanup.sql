-- ============================================================================
-- Phase 4: Database Schema Cleanup - Remove is_activated Column
-- ============================================================================
-- 
-- This script removes the is_activated column from nad_test_ids table
-- after successful migration to status field as single source of truth.
-- 
-- Prerequisites:
-- - Phase 1: Migration helper completed
-- - Phase 2: Backend endpoints migrated 
-- - Phase 3: Frontend code updated
-- - All tests have valid status values
-- 
-- IMPORTANT: Create database backup before running this script!
-- ============================================================================

-- Verify current state before cleanup
SELECT 'Current test distribution:' as info;
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM nad_test_ids), 2) as percentage
FROM nad_test_ids 
GROUP BY status
ORDER BY count DESC;

SELECT 'Tests with NULL status (should be 0):' as info;
SELECT COUNT(*) as null_status_count FROM nad_test_ids WHERE status IS NULL;

SELECT 'Consistency check - is_activated vs status:' as info;
SELECT 
    is_activated,
    status,
    COUNT(*) as count
FROM nad_test_ids 
GROUP BY is_activated, status
ORDER BY is_activated, status;

-- ============================================================================
-- SCHEMA CLEANUP
-- ============================================================================

-- Step 1: Remove is_activated column from nad_test_ids
ALTER TABLE nad_test_ids DROP COLUMN is_activated;

-- Step 2: Verify the column was removed
SELECT 'Columns after cleanup:' as info;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'nad_test_ids'
ORDER BY ORDINAL_POSITION;

-- Step 3: Verify status field is working correctly
SELECT 'Final test distribution after cleanup:' as info;
SELECT 
    status,
    COUNT(*) as count
FROM nad_test_ids 
GROUP BY status
ORDER BY count DESC;

-- Step 4: Show sample data to verify everything looks correct
SELECT 'Sample test data after cleanup:' as info;
SELECT test_id, status, activated_date, created_date
FROM nad_test_ids 
ORDER BY created_date DESC 
LIMIT 10;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- These queries can be run to verify the migration was successful:

-- 1. Check that no columns reference is_activated
SELECT 'Tables with is_activated columns (should be empty):' as info;
SELECT TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND COLUMN_NAME = 'is_activated';

-- 2. Verify all tests have valid status
SELECT 'Status validation:' as info;
SELECT 
    CASE 
        WHEN status IN ('pending', 'activated', 'completed') THEN 'Valid'
        ELSE 'Invalid'
    END as status_validity,
    COUNT(*) as count
FROM nad_test_ids 
GROUP BY status_validity;

-- 3. Check that status distribution makes sense
SELECT 'Status distribution summary:' as info;
SELECT 
    'Total tests' as metric, 
    COUNT(*) as value 
FROM nad_test_ids
UNION ALL
SELECT 
    'Pending tests' as metric, 
    COUNT(*) as value 
FROM nad_test_ids WHERE status = 'pending'
UNION ALL
SELECT 
    'Activated tests' as metric, 
    COUNT(*) as value 
FROM nad_test_ids WHERE status = 'activated'
UNION ALL
SELECT 
    'Completed tests' as metric, 
    COUNT(*) as value 
FROM nad_test_ids WHERE status = 'completed';