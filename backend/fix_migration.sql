-- SQL script to fix the migration issue by dropping backup tables
-- These tables are causing validation failures and preventing server startup

USE nad_test_cycle;

-- Drop backup tables that are causing validation failures
DROP TABLE IF EXISTS nad_test_ids_backup_customer_varchar;
DROP TABLE IF EXISTS nad_test_scores_backup_customer_varchar;
DROP TABLE IF EXISTS nad_user_roles_backup_customer_varchar;
DROP TABLE IF EXISTS nad_user_supplements_backup_customer_varchar;

-- Show remaining tables to verify cleanup
SHOW TABLES LIKE '%backup%';

-- Verify the main tables have the correct customer_id column type
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'nad_test_cycle' 
AND COLUMN_NAME = 'customer_id' 
AND TABLE_NAME NOT LIKE '%backup%'
ORDER BY TABLE_NAME;