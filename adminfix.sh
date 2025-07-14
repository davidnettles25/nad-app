#!/bin/bash

# Code-Only Endpoint Fix
# Just add the missing endpoint code to server.js

echo "🔧 Code-Only Endpoint Fix"
echo "========================="

echo "📍 Looking for server.js..."

# Find the server file
if [[ -f "server.js" ]]; then
    SERVER_FILE="server.js"
elif [[ -f "backend/server.js" ]]; then
    SERVER_FILE="backend/server.js"
elif [[ -f "../server.js" ]]; then
    SERVER_FILE="../server.js"
else
    echo "❌ Cannot find server.js"
    echo "📋 Please navigate to the directory containing server.js"
    echo "Current directory: $(pwd)"
    echo ""
    echo "📋 Try these commands to find server.js:"
    echo "   find . -name 'server.js' -type f"
    echo "   ls -la"
    exit 1
fi

echo "✅ Found: $SERVER_FILE"

echo ""
echo "🔍 Checking current endpoints..."
echo "📋 Existing endpoints in server file:"
grep -n "app\.\(get\|post\)" "$SERVER_FILE" | head -5

echo ""
echo "🔍 Checking if printable-batches endpoint exists..."
if grep -q "/api/admin/printable-batches" "$SERVER_FILE"; then
    echo "⚠️ Endpoint already exists in server file!"
    echo "📋 The issue might be that your local server needs to be restarted manually."
    echo ""
    echo "📋 Endpoint location in file:"
    grep -n "/api/admin/printable-batches" "$SERVER_FILE"
    echo ""
    echo "🔄 Please restart your local development server manually"
    exit 0
else
    echo "❌ Endpoint missing - adding it now..."
fi

echo ""
echo "💾 Creating backup..."
cp "$SERVER_FILE" "${SERVER_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created: ${SERVER_FILE}.backup.*"

echo ""
echo "📝 Adding endpoint code..."

# Create the endpoint code
cat > temp_endpoint.js << 'EOF'

// =============================================================================
// BATCH PRINTING ENDPOINTS - Added for Admin Interface
// =============================================================================

// Get printable batches with print status
app.get('/api/admin/printable-batches', async (req, res) => {
    try {
        console.log('🔄 API: Loading printable batches...');
        
        // Query to get batches with basic print status
        const [batches] = await db.execute(`
            SELECT 
                batch_id,
                batch_size,
                COUNT(*) as total_tests,
                COALESCE(SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END), 0) as printed_tests,
                MAX(printed_date) as last_printed_date,
                MIN(created_date) as created_date,
                MAX(notes) as batch_notes,
                CASE 
                    WHEN COALESCE(SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END), 0) = 0 THEN 'not_printed'
                    WHEN COALESCE(SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END), 0) = COUNT(*) THEN 'fully_printed'
                    ELSE 'partially_printed'
                END as print_status,
                ROUND((COALESCE(SUM(CASE WHEN is_printed = 1 THEN 1 ELSE 0 END), 0) / COUNT(*)) * 100, 1) as print_percentage
            FROM nad_test_ids 
            WHERE batch_id IS NOT NULL 
            GROUP BY batch_id, batch_size 
            ORDER BY MIN(created_date) DESC
            LIMIT 50
        `);
        
        // Add sample test IDs for each batch
        for (let batch of batches) {
            try {
                const [sampleTests] = await db.execute(
                    'SELECT test_id FROM nad_test_ids WHERE batch_id = ? ORDER BY id LIMIT 3',
                    [batch.batch_id]
                );
                batch.sample_test_ids = sampleTests.map(t => t.test_id);
            } catch (error) {
                batch.sample_test_ids = [];
            }
        }
        
        console.log(`✅ API: Found ${batches.length} printable batches`);
        
        res.json({
            success: true,
            data: batches
        });
        
    } catch (error) {
        console.error('❌ API Error loading printable batches:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to load printable batches',
            error: error.message 
        });
    }
});

// Print a batch
app.post('/api/admin/print-batch', async (req, res) => {
    const { batch_id, print_format, printer_name, notes } = req.body;
    const printed_by = 'local_admin';
    
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
            message: 'Invalid print format. Valid formats: ' + validFormats.join(', ')
        });
    }
    
    try {
        console.log(`🖨️ API: Processing print job for batch: ${batch_id}`);
        
        // Get all tests in this batch
        const [tests] = await db.execute(
            'SELECT test_id, batch_id, COALESCE(is_printed, 0) as is_printed FROM nad_test_ids WHERE batch_id = ?',
            [batch_id]
        );
        
        if (tests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found or contains no tests'
            });
        }
        
        console.log(`📋 API: Found ${tests.length} tests in batch ${batch_id}`);
        
        // Mark tests as printed (if column exists)
        try {
            await db.execute(
                `UPDATE nad_test_ids 
                 SET is_printed = TRUE, printed_date = NOW(), printed_by = ? 
                 WHERE batch_id = ?`,
                [printed_by, batch_id]
            );
            console.log(`✅ API: Marked tests as printed`);
        } catch (updateError) {
            console.warn('⚠️ API: Could not update print status (column may not exist):', updateError.message);
        }
        
        // Generate print job ID
        const print_job_id = `PJ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Generate print data based on format
        const printData = generatePrintDataForBatch(tests, print_format, batch_id);
        
        console.log(`✅ API: Print job created with ID: ${print_job_id}`);
        
        res.json({
            success: true,
            message: `Batch ${batch_id} queued for printing successfully`,
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
        console.error('❌ API Error processing print job:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process print job',
            error: error.message 
        });
    }
});

// Helper function to generate print data
function generatePrintDataForBatch(tests, format, batch_id) {
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

# Find the best place to insert the code
echo "📋 Finding insertion point..."

if grep -n "app\.listen\|server\.listen" "$SERVER_FILE" > /dev/null; then
    # Insert before app.listen
    LISTEN_LINE=$(grep -n "app\.listen\|server\.listen" "$SERVER_FILE" | head -1 | cut -d: -f1)
    echo "📋 Inserting before server listen at line $LISTEN_LINE"
    
    # Split file and insert our code
    head -n $((LISTEN_LINE - 1)) "$SERVER_FILE" > "${SERVER_FILE}.new"
    cat temp_endpoint.js >> "${SERVER_FILE}.new"
    echo "" >> "${SERVER_FILE}.new"  # Add blank line
    tail -n +$LISTEN_LINE "$SERVER_FILE" >> "${SERVER_FILE}.new"
    
    mv "${SERVER_FILE}.new" "$SERVER_FILE"
    
elif grep -n "module\.exports\|exports\." "$SERVER_FILE" > /dev/null; then
    # Insert before module.exports
    EXPORTS_LINE=$(grep -n "module\.exports\|exports\." "$SERVER_FILE" | head -1 | cut -d: -f1)
    echo "📋 Inserting before module.exports at line $EXPORTS_LINE"
    
    head -n $((EXPORTS_LINE - 1)) "$SERVER_FILE" > "${SERVER_FILE}.new"
    cat temp_endpoint.js >> "${SERVER_FILE}.new"
    echo "" >> "${SERVER_FILE}.new"
    tail -n +$EXPORTS_LINE "$SERVER_FILE" >> "${SERVER_FILE}.new"
    
    mv "${SERVER_FILE}.new" "$SERVER_FILE"
    
else
    # Append at the end
    echo "📋 Appending to end of file"
    cat temp_endpoint.js >> "$SERVER_FILE"
fi

# Cleanup
rm temp_endpoint.js

echo "✅ Endpoint code added to $SERVER_FILE"

echo ""
echo "🔍 Verification..."

# Verify the endpoint was added
if grep -q "/api/admin/printable-batches" "$SERVER_FILE"; then
    echo "✅ printable-batches endpoint added"
else
    echo "❌ Failed to add printable-batches endpoint"
fi

if grep -q "/api/admin/print-batch" "$SERVER_FILE"; then
    echo "✅ print-batch endpoint added"
else
    echo "❌ Failed to add print-batch endpoint"
fi

echo ""
echo "📋 Lines added to server file:"
wc -l < "$SERVER_FILE"

echo ""
echo "🎯 NEXT STEPS"
echo "============="
echo "✅ Code has been added to: $SERVER_FILE"
echo ""
echo "🔄 Now you need to restart your local development server:"
echo ""
echo "1. Stop your current server (Ctrl+C if running in terminal)"
echo "2. Restart with: node $SERVER_FILE"
echo "3. Test the admin interface again"
echo ""
echo "📋 The endpoint should now be available at:"
echo "   http://localhost:3000/api/admin/printable-batches"
echo "   (or whatever port your server runs on)"
echo ""
echo "✅ Code-only fix complete!"
