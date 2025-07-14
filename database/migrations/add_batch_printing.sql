-- Step 1: Database Schema Changes for Batch Printing
-- Run these SQL commands on your nad_cycle database

-- Add printing columns to existing nad_test_ids table
ALTER TABLE nad_test_ids 
ADD COLUMN is_printed BOOLEAN DEFAULT FALSE,
ADD COLUMN printed_date DATETIME NULL,
ADD COLUMN printed_by VARCHAR(100) NULL;

-- Create batch_print_history table for tracking print jobs
CREATE TABLE batch_print_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id VARCHAR(100) NOT NULL,
    print_format ENUM('individual_labels', 'batch_summary', 'shipping_list') NOT NULL,
    printed_by VARCHAR(100) NOT NULL,
    printed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    test_count INT NOT NULL,
    printer_name VARCHAR(100) NULL,
    print_job_id VARCHAR(100) NULL,
    notes TEXT NULL,
    
    INDEX idx_batch_id (batch_id),
    INDEX idx_printed_date (printed_date),
    INDEX idx_printed_by (printed_by)
);

-- Add some sample print history data (optional)
INSERT INTO batch_print_history (batch_id, print_format, printed_by, test_count, printer_name, notes) VALUES
('2025-07-001-batch', 'individual_labels', 'shipping_manager', 25, 'Zebra ZP450', 'Initial test batch printing'),
('2025-07-002-batch', 'batch_summary', 'admin', 50, 'Default Printer', 'Summary sheet for inventory');

-- Create view for easy batch print status queries
CREATE VIEW batch_print_status AS
SELECT 
    t.batch_id,
    COUNT(*) as total_tests,
    SUM(CASE WHEN t.is_printed = 1 THEN 1 ELSE 0 END) as printed_tests,
    MAX(t.printed_date) as last_printed_date,
    MAX(t.batch_size) as batch_size,
    MIN(t.created_date) as created_date,
    MAX(t.notes) as batch_notes,
    CASE 
        WHEN SUM(CASE WHEN t.is_printed = 1 THEN 1 ELSE 0 END) = 0 THEN 'not_printed'
        WHEN SUM(CASE WHEN t.is_printed = 1 THEN 1 ELSE 0 END) = COUNT(*) THEN 'fully_printed'
        ELSE 'partially_printed'
    END as print_status,
    ROUND((SUM(CASE WHEN t.is_printed = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as print_percentage
FROM nad_test_ids t 
WHERE t.batch_id IS NOT NULL 
GROUP BY t.batch_id;

-- Verify the changes
DESCRIBE nad_test_ids;
DESCRIBE batch_print_history;
SELECT * FROM batch_print_status LIMIT 5;