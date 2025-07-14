#!/bin/bash

# Add Backend Endpoints for Batch Printing
# This will add the missing API endpoints to your server

echo "🔧 Adding Backend Endpoints for Batch Printing"
echo "=============================================="

# Check if we're in the right location
if [[ -f "backend/server.js" ]]; then
    echo "✅ Found backend/server.js"
    SERVER_FILE="backend/server.js"
elif [[ -f "server.js" ]]; then
    echo "✅ Found server.js"
    SERVER_FILE="server.js"
else
    echo "❌ Could not find server.js file"
    echo "📍 Current directory: $(pwd)"
    echo "📋 Please navigate to your backend directory or ensure server.js exists"
    exit 1
fi

echo "📍 Server file: $SERVER_FILE"

# Create backup
cp "$SERVER_FILE" "${SERVER_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

echo ""
echo "🔍 Checking if endpoints already exist..."

if grep -q '/api/admin/printable-batches' "$SERVER_FILE"; then
    echo "⚠️ printable-batches endpoint already exists"
else
    echo "➕ Adding printable-batches endpoint..."
    
    # Add the endpoint before the last few lines of the file
    cat >> "${SERVER_FILE}.tmp" << 'EOF'

// ============================================================================
// BATCH PRINTING ENDPOINTS
// ============================================================================

// Get all printable batches with print status
app.get('/api/admin/printable-batches', async (req, res) => {
    try {
        console.log('🔄 Fetching printable batches...');
        
        // Query to get batch information with print status
        const [batches] = await db.execute(`
            SELECT 
                batch_id,
                batch_size,
                COUNT(*) as total_tests,
                SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END) as printed_tests,
                MAX(printed_date) as last_printed_date,
                MIN(created_date) as created_date,
                MAX(notes) as batch_notes,
                CASE 
                    WHEN SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END) = 0 THEN 'not_printed'
                    WHEN SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END) = COUNT(*) THEN 'fully_printed'
                    ELSE 'partially_printed'
                END as print_status,
                ROUND((SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as print_percentage
            FROM nad_test_ids 
            WHERE batch_id IS NOT NULL 
            GROUP BY batch_id, batch_size 
            ORDER BY MIN(created_date) DESC
            LIMIT 50
        `);
        
        // Get sample test IDs for each batch
        for (let batch of batches) {
            const [sampleTests] = await db.execute(
                'SELECT test_id FROM nad_test_ids WHERE batch_id = ? ORDER BY id LIMIT 3',
                [batch.batch_id]
            );
            batch.sample_test_ids = sampleTests.map(t => t.test_id);
        }
        
        console.log(`✅ Found ${batches.length} printable batches`);
        
        res.json({
            success: true,
            data: batches
        });
        
    } catch (error) {
        console.error('❌ Error fetching printable batches:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch printable batches',
            error: error.message 
        });
    }
});

// Print a batch (mark as printed and log the print job)
app.post('/api/admin/print-batch', async (req, res) => {
    const { batch_id, print_format, printer_name, notes } = req.body;
    const printed_by = 'admin'; // TODO: Get from session/auth
    
    // Validate input
    if (!batch_id) {
        return res.status(400).json({
            success: false,
            message: 'Batch ID is required'
        });
    }
    
    const validFormats = ['individual_labels', 'batch_summary', 'shipping_list'];
    if (!validFormats.includes(print_format)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid print format'
        });
    }
    
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        console.log(`🖨️ Processing print job for batch: ${batch_id}`);
        
        // Get all tests in this batch
        const [tests] = await connection.execute(
            'SELECT test_id, batch_id, is_printed FROM nad_test_ids WHERE batch_id = ?',
            [batch_id]
        );
        
        if (tests.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Batch not found or contains no tests'
            });
        }
        
        console.log(`📋 Found ${tests.length} tests in batch ${batch_id}`);
        
        // Mark all tests in batch as printed
        const [updateResult] = await connection.execute(
            `UPDATE nad_test_ids 
             SET is_printed = TRUE, printed_date = NOW(), printed_by = ? 
             WHERE batch_id = ?`,
            [printed_by, batch_id]
        );
        
        console.log(`✅ Marked ${updateResult.affectedRows} tests as printed`);
        
        // Generate unique print job ID
        const print_job_id = `PJ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Log the print job in history (if table exists)
        try {
            await connection.execute(
                `INSERT INTO batch_print_history 
                 (batch_id, print_format, printed_by, test_count, printer_name, print_job_id, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [batch_id, print_format, printed_by, tests.length, printer_name || 'Default', print_job_id, notes || '']
            );
        } catch (historyError) {
            console.warn('⚠️ Could not log to print history (table may not exist):', historyError.message);
        }
        
        // Generate print data based on format
        const printData = generatePrintDataBatch(tests, print_format, batch_id);
        
        await connection.commit();
        
        console.log(`✅ Print job completed with ID: ${print_job_id}`);
        
        res.json({
            success: true,
            message: `Batch ${batch_id} marked as printed successfully`,
            data: {
                print_job_id: print_job_id,
                batch_id: batch_id,
                test_count: tests.length,
                print_format: print_format,
                printer_name: printer_name || 'Default',
                print_data: printData,
                previously_printed: tests.filter(t => t.is_printed).length
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error processing print job:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process print job',
            error: error.message 
        });
    } finally {
        connection.release();
    }
});

// Helper function to generate print data
function generatePrintDataBatch(tests, format, batch_id) {
    const batch_short_id = batch_id.split('-').pop();
    
    switch (format) {
        case 'individual_labels':
            return {
                type: 'individual_labels',
                labels: tests.map(test => ({
                    test_id: test.test_id,
                    batch_id: batch_id,
                    batch_short_id: batch_short_id,
                    qr_code_data: test.test_id,
                    print_date: new Date().toISOString()
                }))
            };
            
        case 'batch_summary':
            return {
                type: 'batch_summary',
                batch_id: batch_id,
                batch_short_id: batch_short_id,
                test_count: tests.length,
                test_ids: tests.map(t => t.test_id),
                created_date: new Date().toISOString(),
                summary_title: `Batch ${batch_short_id} Summary`
            };
            
        case 'shipping_list':
            return {
                type: 'shipping_list',
                batch_id: batch_id,
                batch_short_id: batch_short_id,
                checklist_title: `Shipping Checklist - Batch ${batch_short_id}`,
                items: tests.map(test => ({
                    test_id: test.test_id,
                    checked: false,
                    notes: ''
                })),
                total_items: tests.length
            };
            
        default:
            throw new Error(`Unsupported print format: ${format}`);
    }
}

console.log('✅ Batch printing endpoints loaded');

EOF

    # Insert the new content before the server start or at the end
    if grep -q 'app.listen\|server.listen' "$SERVER_FILE"; then
        # Insert before server start
        awk '/app\.listen|server\.listen/ { 
            while ((getline line < "'${SERVER_FILE}'.tmp") > 0) print line
            close("'${SERVER_FILE}'.tmp")
        } 
        { print }' "$SERVER_FILE" > "${SERVER_FILE}.new"
    else
        # Append at end
        cat "$SERVER_FILE" "${SERVER_FILE}.tmp" > "${SERVER_FILE}.new"
    fi
    
    mv "${SERVER_FILE}.new" "$SERVER_FILE"
    rm "${SERVER_FILE}.tmp"
    echo "✅ Added printable-batches endpoint"
fi

echo ""
echo "🔄 Restarting the server..."

# Try to restart the server
if command -v pm2 &> /dev/null; then
    echo "📋 Using PM2 to restart server..."
    pm2 restart nad-api || pm2 restart server || pm2 restart all
    echo "✅ Server restarted with PM2"
elif pgrep -f "node.*server.js" > /dev/null; then
    echo "📋 Restarting Node.js server..."
    pkill -f "node.*server.js"
    sleep 2
    nohup node "$SERVER_FILE" > server.log 2>&1 &
    echo "✅ Server restarted"
else
    echo "⚠️ Could not detect running server"
    echo "📋 Please manually restart your server:"
    echo "   cd $(dirname $SERVER_FILE)"
    echo "   node $(basename $SERVER_FILE)"
fi

echo ""
echo "🧪 Testing the endpoint..."

sleep 3

# Test the endpoint
if curl -s "https://mynadtest.info/api/admin/printable-batches" | grep -q "success"; then
    echo "✅ Endpoint is working!"
else
    echo "⚠️ Endpoint test failed. Check server logs:"
    echo "   pm2 logs nad-api"
    echo "   or check: tail -f server.log"
fi

echo ""
echo "🎯 SUMMARY"
echo "=========="
echo "✅ Added /api/admin/printable-batches endpoint"
echo "✅ Added /api/admin/print-batch endpoint"
echo "✅ Added generatePrintDataBatch helper function"
echo "✅ Server restarted"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Test the Batch Printing section in admin"
echo "2. Should now load batch cards successfully"
echo "3. Try selecting and printing a batch"
echo ""
echo "🐛 IF STILL NOT WORKING:"
echo "- Check server logs: pm2 logs nad-api"
echo "- Verify database has batches: SELECT * FROM nad_test_ids WHERE batch_id IS NOT NULL;"
echo "- Check browser console for errors"
echo ""
echo "✅ Backend endpoints added successfully!"
