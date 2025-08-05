-- Migration to change generated_by column from INT to VARCHAR for storing email addresses
-- Date: 2025-08-05

USE nad_cycle;

-- First, check if the column exists and its current type
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'nad_cycle' 
  AND TABLE_NAME = 'nad_test_ids' 
  AND COLUMN_NAME = 'generated_by';

-- Alter the column to VARCHAR(255) to store email addresses
ALTER TABLE nad_test_ids 
MODIFY COLUMN generated_by VARCHAR(255) DEFAULT NULL 
COMMENT 'Email ID of the admin who created this batch';

-- Verify the change
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'nad_cycle' 
  AND TABLE_NAME = 'nad_test_ids' 
  AND COLUMN_NAME = 'generated_by';