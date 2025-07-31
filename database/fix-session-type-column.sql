-- Fix session_type column size in nad_portal_sessions table
-- This ensures the column can store 'customer', 'admin', and 'lab' values

USE nad_cycle;

-- Check current column definition
DESCRIBE nad_portal_sessions;

-- Alter the session_type column to be large enough
ALTER TABLE nad_portal_sessions 
MODIFY COLUMN session_type VARCHAR(20) NOT NULL DEFAULT 'customer';

-- Verify the change
DESCRIBE nad_portal_sessions;