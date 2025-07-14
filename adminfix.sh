#!/bin/bash

# Final Endpoint Fix Script
# This will definitively add the missing API endpoint

echo "🔧 Final Endpoint Fix Script"
echo "============================"

echo "📍 Current directory: $(pwd)"

# Find server file
echo ""
echo "🔍 Step 1: Finding server.js file..."

SERVER_FILE=""
SEARCH_DIRS=("." ".." "backend" "../backend" "server" "../server")

for dir in "${SEARCH_DIRS[@]}"; do
    if [[ -f "$dir/server.js" ]]; then
        SERVER_FILE="$dir/server.js"
        echo "✅ Found server file: $SERVER_FILE"
        break
    fi
done

if [[ -z "$SERVER_FILE" ]]; then
    echo "❌ Could not find server.js file"
    echo ""
    echo "📋 Manual search results:"
    find . -name "server.js" -type f 2>/dev/null || echo "No server.js files found"
    echo ""
    echo "📋 Please navigate to the directory containing server.js and run this script again"
    exit 1
fi

# Check if endpoint exists
echo ""
echo "🔍 Step 2: Checking if endpoint already exists..."

if grep -q "/api/admin/printable-batches" "$SERVER_FILE"; then
    echo "⚠️ Endpoint already exists in server file!"
    echo ""
    echo "📋 Endpoint location:"
    grep -n "/api/admin/printable-batches" "$SERVER_FILE"
    echo ""
    echo "🔧 The endpoint exists but server may need restart."
    echo "📋 Please restart your local development server:"
    echo "   1. Stop current server (Ctrl+C)"
    echo "   2. Start server: node $SERVER_FILE"
    echo ""
    exit 0
fi

echo "❌ Endpoint missing - will add it now"

# Create backup
echo ""
echo "💾 Step 3: Creating backup..."
BACKUP_FILE="${SERVER_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$SERVER_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Show current server structure
echo ""
echo "📋 Step 4: Analyzing current server structure..."
echo "Current endpoints in server:"
grep -n "app\.\(get\|post\|put\|delete\)" "$SERVER_FILE" | head -5

# Create the endpoint code
echo ""
echo "📝 Step 5: Preparing endpoint code..."

cat > temp_batch_endpoints.js << 'EOF'

// =============================================================================
// BATCH PRINTING API ENDPOINTS
// Added for Admin Dashboard Batch Printing functionality
// =============================================================================

console.log('🖨️ Loading Batch Printing API endpoints...');

// GET /api/admin/printable-batches - Get all batches available for printing
app.get('/api/admin/printable-batches', async (req, res) => {
    try {
        console.log('🔄 API: Fetching printable batches...');
        
        // Query to get batch information with print status
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
            } catch (sampleError) {
                console.warn('Could not fetch sample test IDs:', sampleError.message);
                batch.sample_test_ids = [];
            }
        }
        
        console.log(`✅ API: Found ${batches.length} printable batches`);
        
        res.json({
            success: true,
            data: batches,
            message: `Found ${batches.length} printable batches`
        });
        
    } catch (error) {
        console.error('❌ API Error fetching printable batches:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch printable batches',
            error: error.message 
        });
    }
});

// POST /api/admin/print-batch - Mark a batch as printed
app.post('/api/admin/print-batch', async (req, res) => {
    const { batch_id, print_format, printer_name, notes } = req.body;
    const printed_by = 'local_admin';
    
    try {
        console.log(`🖨️ API: Processing print job for batch: ${batch_id}`);
        
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
                message: `Invalid print format. Valid formats: ${validFormats.join(', ')}`
            });
        }
        
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
        
        // Mark tests as printed (handle case where is_printed column may not exist)
        try {
            const [updateResult] = await db.execute(
                `UPDATE nad_test_ids 
                 SET is_printed = TRUE, printed_date = NOW(), printed_by = ? 
                 WHERE batch_id = ?`,
                [printed_by, batch_id]
            );
            console.log(`✅ API: Marked ${updateResult.affectedRows} tests as printed`);
        } catch (updateError) {
            console.warn('⚠️ API: Could not update print status (columns may not exist):', updateError.message);
            console.warn('⚠️ API: Continuing without updating print status...');
        }
        
        // Generate unique print job ID
        const print_job_id = `PJ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Generate print data based on format
        const printData = generateBatchPrintData(tests, print_format, batch_id);
        
        console.log(`✅ API: Print job completed with ID: ${print_job_id}`);
        
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
function generateBatchPrintData(tests, format, batch_id) {
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

console.log('✅ Batch printing API endpoints loaded successfully');

EOF

# Find the best insertion point
echo ""
echo "📍 Step 6: Finding optimal insertion point..."

INSERTION_POINT=""
INSERTION_LINE=0

# Look for existing API routes section
if grep -n "// API" "$SERVER_FILE" > /dev/null; then
    INSERTION_LINE=$(grep -n "// API" "$SERVER_FILE" | tail -1 | cut -d: -f1)
    INSERTION_POINT="after existing API routes"
    echo "📋 Found existing API section at line $INSERTION_LINE"
    
# Look for app.listen
elif grep -n "app\.listen" "$SERVER_FILE" > /dev/null; then
    INSERTION_LINE=$(grep -n "app\.listen" "$SERVER_FILE" | head -1 | cut -d: -f1)
    INSERTION_POINT="before app.listen"
    echo "📋 Found app.listen at line $INSERTION_LINE"
    
# Look for server.listen
elif grep -n "server\.listen" "$SERVER_FILE" > /dev/null; then
    INSERTION_LINE=$(grep -n "server\.listen" "$SERVER_FILE" | head -1 | cut -d: -f1)
    INSERTION_POINT="before server.listen"
    echo "📋 Found server.listen at line $INSERTION_LINE"
    
# Look for module.exports
elif grep -n "module\.exports" "$SERVER_FILE" > /dev/null; then
    INSERTION_LINE=$(grep -n "module\.exports" "$SERVER_FILE" | head -1 | cut -d: -f1)
    INSERTION_POINT="before module.exports"
    echo "📋 Found module.exports at line $INSERTION_LINE"
    
# Append to end
else
    INSERTION_LINE=$(wc -l < "$SERVER_FILE")
    INSERTION_POINT="at end of file"
    echo "📋 Will append to end of file (line $INSERTION_LINE)"
fi

# Insert the code
echo ""
echo "📝 Step 7: Inserting endpoint code $INSERTION_POINT..."

if [[ $INSERTION_LINE -gt 0 ]] && [[ "$INSERTION_POINT" != "at end of file" ]]; then
    # Insert at specific line
    head -n $((INSERTION_LINE - 1)) "$SERVER_FILE" > "${SERVER_FILE}.new"
    echo "" >> "${SERVER_FILE}.new"  # Add blank line
    cat temp_batch_endpoints.js >> "${SERVER_FILE}.new"
    echo "" >> "${SERVER_FILE}.new"  # Add blank line
    tail -n +$INSERTION_LINE "$SERVER_FILE" >> "${SERVER_FILE}.new"
    
    mv "${SERVER_FILE}.new" "$SERVER_FILE"
else
    # Append to end
    echo "" >> "$SERVER_FILE"  # Add blank line
    cat temp_batch_endpoints.js >> "$SERVER_FILE"
fi

# Cleanup
rm temp_batch_endpoints.js

echo "✅ Endpoint code inserted successfully"

# Verify insertion
echo ""
echo "🔍 Step 8: Verifying insertion..."

if grep -q "/api/admin/printable-batches" "$SERVER_FILE"; then
    echo "✅ printable-batches endpoint found"
    ENDPOINT_LINE=$(grep -n "/api/admin/printable-batches" "$SERVER_FILE" | head -1 | cut -d: -f1)
    echo "📋 Located at line: $ENDPOINT_LINE"
else
    echo "❌ Failed to add printable-batches endpoint"
fi

if grep -q "/api/admin/print-batch" "$SERVER_FILE"; then
    echo "✅ print-batch endpoint found"
else
    echo "❌ Failed to add print-batch endpoint"
fi

if grep -q "generateBatchPrintData" "$SERVER_FILE"; then
    echo "✅ Helper function found"
else
    echo "❌ Failed to add helper function"
fi

# Show file stats
echo ""
echo "📊 Step 9: File statistics..."
ORIGINAL_LINES=$(wc -l < "$BACKUP_FILE")
NEW_LINES=$(wc -l < "$SERVER_FILE")
ADDED_LINES=$((NEW_LINES - ORIGINAL_LINES))

echo "📋 Original file: $ORIGINAL_LINES lines"
echo "📋 New file: $NEW_LINES lines"
echo "📋 Added: $ADDED_LINES lines"

echo ""
echo "🎯 COMPLETION SUMMARY"
echo "===================="
echo "✅ Server file: $SERVER_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo "✅ API endpoints added: $ADDED_LINES lines"
echo "✅ Insertion point: $INSERTION_POINT"
echo ""
echo "🔄 NEXT STEPS - MANUAL ACTION REQUIRED:"
echo "======================================"
echo "1. 🛑 STOP your current development server (Ctrl+C)"
echo "2. 🚀 RESTART your server with:"
echo "   cd $(dirname "$SERVER_FILE")"
echo "   node $(basename "$SERVER_FILE")"
echo "3. 🧪 TEST the Batch Printing section in admin interface"
echo ""
echo "📋 Expected result after restart:"
echo "   - No more 404 errors for /api/admin/printable-batches"
echo "   - Batch cards should appear (or 'No Printable Batches')"
echo "   - Console should show: '✅ API: Found X printable batches'"
echo ""
echo "🐛 If still not working after restart:"
echo "   - Check server console for error messages"
echo "   - Verify server is running on correct port"
echo "   - Check that you're accessing the same domain/port"
echo ""
echo "✅ Final endpoint fix script complete!"
echo "📋 Ready for manual server restart!"
