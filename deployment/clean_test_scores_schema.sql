-- Migration to clean nad_test_scores table schema
-- Remove redundant columns that are now tracked in nad_test_ids

USE `mynadtes_mynadtest_nad_cycle`;

-- Drop redundant status and tracking columns from nad_test_scores
-- These are now managed in nad_test_ids as single source of truth

ALTER TABLE `nad_test_scores` 
DROP COLUMN IF EXISTS `status`,
DROP COLUMN IF EXISTS `is_activated`,
DROP COLUMN IF EXISTS `order_id`,
DROP COLUMN IF EXISTS `customer_id`,
DROP COLUMN IF EXISTS `activated_by`,
DROP COLUMN IF EXISTS `activated_date`,
DROP COLUMN IF EXISTS `label_received_date`;

-- Keep only score-related data:
-- id, technician_id, test_id, score, image, score_submission_date, created_date, updated_date, notes

-- Verify the clean schema
DESCRIBE `nad_test_scores`;