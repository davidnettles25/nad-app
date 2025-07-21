-- ============================================================================
-- Customer ID Migration - Emergency Rollback Procedures
-- ============================================================================
-- 
-- This script provides emergency rollback procedures for the customer_id 
-- migration from BIGINT(20) to VARCHAR(255) in case issues arise.
-- 
-- Migration: Customer ID Type Change (BIGINT → VARCHAR) 
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
-- PHASE 2 ROLLBACK: Backend Code Changes
-- ============================================================================

SELECT 'Phase 2 Rollback: Restore Backend Code' as phase;

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
   - Test customer_id handling

5. Verify rollback success:
   - curl https://mynadtest.info/api/admin/tests
   - Check response includes numeric customer_id handling
   - Test customer authentication flow
*/

-- Verify backend rollback success
SELECT 'Backend rollback verification queries:' as info;

-- These queries should work after backend rollback
/*
Test these API endpoints manually:

1. Admin tests: GET /api/admin/tests
   - Should handle customer_id as before

2. Lab tests: GET /api/lab/tests  
   - Should process customer_id correctly

3. Customer verification: POST /api/customer/verify-test
   - Should handle customer_id appropriately

4. Customer authentication flow
   - Should work with existing customer_id format
*/

-- ============================================================================
-- PHASE 3 ROLLBACK: Database Schema Restoration
-- ============================================================================

SELECT 'Phase 3 Rollback: Restore Database Schema' as phase;

-- Method 1: Restore from backup tables (Recommended)
SELECT 'Method 1: Restore from backup tables' as method;

-- Check if backup tables exist
SELECT 'Checking for backup tables...' as info;
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME LIKE '%backup_customer_migration';

-- Restore all tables from backup
/*
RESTORE ALL TABLES FROM BACKUP:

-- 1. Drop current tables (DANGEROUS - only in emergency)
DROP TABLE nad_test_ids;
DROP TABLE nad_test_scores;
DROP TABLE nad_user_roles;
DROP TABLE nad_user_supplements;

-- 2. Restore from backup
CREATE TABLE nad_test_ids AS 
SELECT * FROM nad_test_ids_backup_customer_migration;

CREATE TABLE nad_test_scores AS 
SELECT * FROM nad_test_scores_backup_customer_migration;

CREATE TABLE nad_user_roles AS 
SELECT * FROM nad_user_roles_backup_customer_migration;

CREATE TABLE nad_user_supplements AS 
SELECT * FROM nad_user_supplements_backup_customer_migration;

-- 3. Recreate primary keys and indexes for nad_test_ids
ALTER TABLE nad_test_ids ADD PRIMARY KEY (id);
ALTER TABLE nad_test_ids ADD UNIQUE KEY test_id (test_id);
ALTER TABLE nad_test_ids ADD KEY idx_test_id (test_id);
ALTER TABLE nad_test_ids ADD KEY idx_customer_id (customer_id);
ALTER TABLE nad_test_ids ADD KEY idx_batch_id (batch_id);
ALTER TABLE nad_test_ids ADD KEY idx_status (status);

-- 4. Recreate indexes for nad_test_scores
ALTER TABLE nad_test_scores ADD PRIMARY KEY (id);
ALTER TABLE nad_test_scores ADD UNIQUE KEY test_id (test_id);
ALTER TABLE nad_test_scores ADD KEY idx_test_id (test_id);
ALTER TABLE nad_test_scores ADD KEY idx_customer_id (customer_id);
ALTER TABLE nad_test_scores ADD KEY idx_status (status);

-- 5. Recreate indexes for nad_user_roles  
ALTER TABLE nad_user_roles ADD PRIMARY KEY (id);
ALTER TABLE nad_user_roles ADD UNIQUE KEY customer_id (customer_id);
ALTER TABLE nad_user_roles ADD KEY idx_customer_id (customer_id);
ALTER TABLE nad_user_roles ADD KEY idx_role (role);

-- 6. Recreate indexes for nad_user_supplements
ALTER TABLE nad_user_supplements ADD PRIMARY KEY (id);
ALTER TABLE nad_user_supplements ADD KEY idx_test_id (test_id);
ALTER TABLE nad_user_supplements ADD KEY idx_customer_id (customer_id);

-- 7. Verify restoration
DESCRIBE nad_test_ids;
DESCRIBE nad_test_scores;
DESCRIBE nad_user_roles;
DESCRIBE nad_user_supplements;

SELECT COUNT(*) FROM nad_test_ids;
SELECT COUNT(*) FROM nad_test_scores;
SELECT COUNT(*) FROM nad_user_roles;
SELECT COUNT(*) FROM nad_user_supplements;
*/

-- Method 2: Revert column types manually (If backup not available)
SELECT 'Method 2: Revert column types manually' as method;

/*
REVERT COLUMN TYPES TO BIGINT:

-- 1. Convert customer_id back to BIGINT in nad_test_ids
ALTER TABLE nad_test_ids 
MODIFY COLUMN customer_id BIGINT(20) DEFAULT NULL;

-- Recreate index
ALTER TABLE nad_test_ids DROP INDEX idx_customer_id;
ALTER TABLE nad_test_ids ADD KEY idx_customer_id (customer_id);

-- 2. Convert customer_id back to BIGINT in nad_test_scores
ALTER TABLE nad_test_scores 
MODIFY COLUMN customer_id BIGINT(20) NOT NULL;

-- Recreate index
ALTER TABLE nad_test_scores DROP INDEX idx_customer_id;
ALTER TABLE nad_test_scores ADD KEY idx_customer_id (customer_id);

-- 3. Convert customer_id back to BIGINT in nad_user_roles
ALTER TABLE nad_user_roles 
MODIFY COLUMN customer_id BIGINT(20) NOT NULL;

-- Recreate unique constraint
ALTER TABLE nad_user_roles DROP INDEX customer_id;
ALTER TABLE nad_user_roles ADD UNIQUE KEY customer_id (customer_id);

-- 4. Convert customer_id back to BIGINT in nad_user_supplements
ALTER TABLE nad_user_supplements 
MODIFY COLUMN customer_id BIGINT(20) NOT NULL;

-- Recreate index
ALTER TABLE nad_user_supplements DROP INDEX idx_customer_id;
ALTER TABLE nad_user_supplements ADD KEY idx_customer_id (customer_id);

-- 5. Convert email customer_ids back to numbers (if possible)
-- Note: This may cause data loss if emails were stored
UPDATE nad_test_ids SET customer_id = NULL WHERE customer_id REGEXP '^[a-zA-Z]';
UPDATE nad_test_scores SET customer_id = 0 WHERE customer_id REGEXP '^[a-zA-Z]';
UPDATE nad_user_roles SET customer_id = 0 WHERE customer_id REGEXP '^[a-zA-Z]';
UPDATE nad_user_supplements SET customer_id = 0 WHERE customer_id REGEXP '^[a-zA-Z]';

-- 6. Verify column types reverted
DESCRIBE nad_test_ids;
DESCRIBE nad_test_scores;
DESCRIBE nad_user_roles;
DESCRIBE nad_user_supplements;
*/

-- ============================================================================
-- PHASE 4 ROLLBACK: Frontend and Integration
-- ============================================================================

SELECT 'Phase 4 Rollback: Restore Frontend Code' as phase;

-- Rollback Method: Git revert frontend changes
/*
PHASE 4 ROLLBACK COMMANDS:

1. Revert frontend changes:
   git revert [PHASE_4_COMMIT_HASH]

2. Or restore specific files:
   git checkout [PREVIOUS_COMMIT] -- frontend/admin.html
   git checkout [PREVIOUS_COMMIT] -- frontend/sections/tests.php
   git checkout [PREVIOUS_COMMIT] -- frontend/admin/js/dropdown-fix.js

3. Deploy frontend changes:
   - Clear browser cache
   - Reload admin interface
   - Test customer_id display and search

4. Revert Multipass integration changes:
   - Restore original authentication flow
   - Remove email-based customer_id extraction
   - Test authentication with original customer_id format

5. Verify UI elements:
   - Customer ID display works correctly
   - Customer ID searchable in filters
   - Customer authentication flow functional
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
   - Customer ID handling works as before
   - Customer authentication functional
   - All customer_id fields show numeric values

6. TEST key functionality:
   - Customer authentication flow
   - Customer data display in admin
   - Search by customer ID
   - Test creation and assignment
   - Customer role management
*/

-- ============================================================================
-- ROLLBACK VERIFICATION QUERIES
-- ============================================================================

SELECT 'Rollback verification queries:' as info;

-- Verify table structures restored
/*
-- Should show BIGINT(20) customer_id columns
DESCRIBE nad_test_ids;
DESCRIBE nad_test_scores;
DESCRIBE nad_user_roles;
DESCRIBE nad_user_supplements;

-- Should show customer_id indexes
SHOW INDEX FROM nad_test_ids WHERE Column_name = 'customer_id';
SHOW INDEX FROM nad_test_scores WHERE Column_name = 'customer_id';
SHOW INDEX FROM nad_user_roles WHERE Column_name = 'customer_id';
SHOW INDEX FROM nad_user_supplements WHERE Column_name = 'customer_id';

-- Should have numeric customer_id data
SELECT customer_id, COUNT(*) as count
FROM nad_test_ids 
WHERE customer_id IS NOT NULL
GROUP BY customer_id
ORDER BY count DESC
LIMIT 10;

-- Verify cross-table relationships
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
LIMIT 5;

-- Check for any remaining VARCHAR customer_id columns
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND COLUMN_NAME = 'customer_id'
AND DATA_TYPE != 'bigint';
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
   ✓ Admin interface working with numeric customer_ids
   ✓ Customer authentication functional
   ✓ Customer search working
   ✓ Test management operational
   ✓ Customer role management working
   ✓ Data relationships intact

7. MONITOR for issues:
   - Customer_id data consistency
   - Authentication flow stability  
   - Performance impact from rollback
   - Any data corruption from failed migration

8. CLEAN UP (optional):
   - Archive backup tables for analysis
   - Document migration failure details
   - Update rollback procedures based on experience
*/

-- ============================================================================
-- DATA INTEGRITY VERIFICATION
-- ============================================================================

SELECT 'Data integrity verification after rollback:' as verification;

/*
Run these queries to verify data integrity after rollback:

-- 1. Check customer_id data types
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND COLUMN_NAME = 'customer_id';

-- 2. Verify record counts match backup
SELECT 'nad_test_ids' as table_name, COUNT(*) as count FROM nad_test_ids
UNION ALL
SELECT 'nad_test_scores', COUNT(*) FROM nad_test_scores  
UNION ALL
SELECT 'nad_user_roles', COUNT(*) FROM nad_user_roles
UNION ALL  
SELECT 'nad_user_supplements', COUNT(*) FROM nad_user_supplements;

-- 3. Check for data consistency
SELECT customer_id, COUNT(*) as records
FROM nad_test_ids 
WHERE customer_id IS NOT NULL
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY records DESC
LIMIT 10;

-- 4. Verify relationships intact
SELECT COUNT(*) as orphaned_scores
FROM nad_test_scores ts
LEFT JOIN nad_test_ids ti ON ts.customer_id = ti.customer_id
WHERE ti.customer_id IS NULL;

-- 5. Check authentication data
SELECT role, COUNT(*) as customer_count
FROM nad_user_roles
GROUP BY role;
*/

-- ============================================================================
-- ROLLBACK COMPLETION
-- ============================================================================

SELECT 'Rollback procedures documented' as status;
SELECT 'Choose appropriate rollback method based on migration phase' as guidance;
SELECT 'Always verify data integrity after rollback completion' as reminder;

-- Emergency contact information
SELECT 'For rollback assistance, check migration documentation' as support;
SELECT 'Monitor system carefully after rollback completion' as monitoring;