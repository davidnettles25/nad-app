-- ============================================================================
-- Order ID Field Removal - Emergency Rollback Procedures
-- ============================================================================
-- 
-- This script provides emergency rollback procedures for the order_id 
-- removal migration in case issues arise during implementation.
-- 
-- Migration: Order ID Field Removal
-- Date: July 20, 2025
-- Purpose: Rollback procedures for each migration phase
-- 
-- IMPORTANT: Use these procedures only if migration fails!
-- ============================================================================

-- ============================================================================
-- PHASE 1 ROLLBACK: Audit & Backup
-- ============================================================================

-- Phase 1 creates documentation and backups only - no rollback needed
SELECT 'Phase 1 (Audit & Backup) - No rollback required' as rollback_info;
SELECT 'Documentation and backup files can be safely kept' as note;

-- ============================================================================
-- PHASE 2 ROLLBACK: Backend API Changes
-- ============================================================================

SELECT 'Phase 2 Rollback: Restore Backend APIs' as phase;

-- Rollback Method: Git revert to commit before Phase 2
/*
PHASE 2 ROLLBACK COMMANDS:

1. Check current commit:
   git log --oneline -5

2. Revert to commit before Phase 2:
   git revert [PHASE_2_COMMIT_HASH]

3. Or reset to previous commit (more aggressive):
   git reset --hard [COMMIT_BEFORE_PHASE_2]

4. Deploy reverted backend:
   - Restart backend service
   - Verify API endpoints working
   - Test Shopify webhook processing

5. Verify rollback success:
   - curl https://mynadtest.info/api/admin/tests
   - Check response includes order_id fields
   - Test search functionality
*/

-- Verify backend rollback success
SELECT 'Backend rollback verification queries:' as info;

-- These queries should work after backend rollback
/*
Test these API endpoints manually:

1. Admin tests: GET /api/admin/tests
   - Should include order_id in response

2. Lab tests: GET /api/lab/tests  
   - Should include order_id in response

3. Customer verification: POST /api/customer/verify-test
   - Should include order_id in response

4. Shopify webhook processing
   - Should continue linking order_id
*/

-- ============================================================================
-- PHASE 3 ROLLBACK: Frontend Changes
-- ============================================================================

SELECT 'Phase 3 Rollback: Restore Frontend UI' as phase;

-- Rollback Method: Git revert frontend changes
/*
PHASE 3 ROLLBACK COMMANDS:

1. Revert frontend changes:
   git revert [PHASE_3_COMMIT_HASH]

2. Or restore specific files:
   git checkout [PREVIOUS_COMMIT] -- frontend/admin.html
   git checkout [PREVIOUS_COMMIT] -- frontend/sections/tests.php
   git checkout [PREVIOUS_COMMIT] -- frontend/admin/js/dropdown-fix.js

3. Deploy frontend changes:
   - Clear browser cache
   - Reload admin interface
   - Test search functionality

4. Verify UI elements:
   - Order ID column visible in test table
   - Order ID searchable in filters
   - Order ID displayed in test details
*/

-- ============================================================================
-- PHASE 4 ROLLBACK: Database Schema Restoration
-- ============================================================================

SELECT 'Phase 4 Rollback: Restore Database Schema' as phase;

-- Method 1: Restore from backup tables (Recommended)
SELECT 'Method 1: Restore from backup tables' as method;

-- Check if backup tables exist
SELECT 'Checking for backup tables...' as info;
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME LIKE '%backup_order_migration';

-- Restore nad_test_ids from backup
/*
RESTORE nad_test_ids FROM BACKUP:

-- 1. Drop current table
DROP TABLE nad_test_ids;

-- 2. Restore from backup
CREATE TABLE nad_test_ids AS 
SELECT * FROM nad_test_ids_backup_order_migration;

-- 3. Recreate primary key and indexes
ALTER TABLE nad_test_ids ADD PRIMARY KEY (id);
ALTER TABLE nad_test_ids ADD UNIQUE KEY test_id (test_id);
ALTER TABLE nad_test_ids ADD KEY idx_test_id (test_id);
ALTER TABLE nad_test_ids ADD KEY idx_order_id (order_id);
ALTER TABLE nad_test_ids ADD KEY idx_customer_id (customer_id);
ALTER TABLE nad_test_ids ADD KEY idx_batch_id (batch_id);

-- 4. Verify restoration
DESCRIBE nad_test_ids;
SELECT COUNT(*) FROM nad_test_ids;
*/

-- Method 2: Recreate order_id column (If backup not available)
SELECT 'Method 2: Recreate order_id column manually' as method;

/*
RECREATE order_id COLUMN:

-- 1. Add order_id column back
ALTER TABLE nad_test_ids 
ADD COLUMN order_id BIGINT(20) DEFAULT NULL 
AFTER customer_id;

-- 2. Recreate index
ALTER TABLE nad_test_ids 
ADD KEY idx_order_id (order_id);

-- 3. Restore order_id data from nad_test_scores (if available)
UPDATE nad_test_ids ti 
SET order_id = (
    SELECT ts.order_id 
    FROM nad_test_scores ts 
    WHERE ts.test_id = ti.test_id 
    LIMIT 1
) 
WHERE ti.order_id IS NULL;

-- 4. Verify column recreation
DESCRIBE nad_test_ids;
SELECT COUNT(*), COUNT(order_id) FROM nad_test_ids;
*/

-- ============================================================================
-- FULL SYSTEM ROLLBACK: Complete Restoration
-- ============================================================================

SELECT 'Full System Rollback: Complete restoration procedure' as procedure;

/*
COMPLETE SYSTEM ROLLBACK (Emergency):

1. STOP all services:
   - Backend API server
   - Frontend web server

2. RESTORE database:
   -- Execute Method 1 (backup restore) above
   
3. RESTORE code:
   git reset --hard [COMMIT_BEFORE_MIGRATION]
   
4. RESTART services:
   - Backend API server
   - Frontend web server
   
5. VERIFY restoration:
   - Admin interface loads correctly
   - Order ID visible in test listings
   - Search by order ID works
   - Shopify webhook processing works
   - All API endpoints return order_id

6. TEST key functionality:
   - Create new test (should get order_id if from Shopify)
   - Search tests by order ID
   - View test details (should show order)
   - Process Shopify webhook
*/

-- ============================================================================
-- ROLLBACK VERIFICATION QUERIES
-- ============================================================================

SELECT 'Rollback verification queries:' as info;

-- Verify nad_test_ids structure
/*
-- Should show order_id column
DESCRIBE nad_test_ids;

-- Should show order_id index
SHOW INDEX FROM nad_test_ids WHERE Column_name = 'order_id';

-- Should have order_id data
SELECT 
    'Total tests' as metric,
    COUNT(*) as count 
FROM nad_test_ids
UNION ALL
SELECT 
    'Tests with order_id' as metric,
    COUNT(*) as count 
FROM nad_test_ids 
WHERE order_id IS NOT NULL;

-- Sample data verification
SELECT test_id, order_id, customer_id, status 
FROM nad_test_ids 
WHERE order_id IS NOT NULL 
LIMIT 5;
*/

-- ============================================================================
-- POST-ROLLBACK ACTIONS
-- ============================================================================

SELECT 'Post-rollback actions required:' as actions;

/*
AFTER SUCCESSFUL ROLLBACK:

1. NOTIFY team of rollback completion
2. INVESTIGATE root cause of migration failure
3. UPDATE migration plan based on lessons learned
4. SCHEDULE new migration attempt with fixes
5. DOCUMENT rollback process and lessons learned

6. VERIFY all functionality:
   ✓ Admin interface working
   ✓ Order search functional  
   ✓ Test management complete
   ✓ Shopify integration operational
   ✓ Lab interface functional
   ✓ Customer interface working

7. CLEAN UP (optional):
   - Keep backup tables for future migration attempt
   - Archive rollback logs
   - Update documentation
*/

-- ============================================================================
-- ROLLBACK COMPLETION
-- ============================================================================

SELECT 'Rollback procedures documented' as status;
SELECT 'Choose appropriate rollback method based on migration phase' as guidance;
SELECT 'Test all functionality after rollback completion' as reminder;

-- Contact information for rollback support
SELECT 'For rollback assistance, check migration documentation' as support;