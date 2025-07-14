#!/bin/bash

# Manual Server Endpoint Addition
# Let's find and directly edit the server file

echo "🔧 Manual Server Endpoint Addition"
echo "=================================="

echo "📍 Current directory: $(pwd)"

# Find server file
SERVER_FILE=""
if [[ -f "backend/server.js" ]]; then
    SERVER_FILE="backend/server.js"
elif [[ -f "server.js" ]]; then
    SERVER_FILE="server.js"
elif [[ -f "../server.js" ]]; then
    SERVER_FILE="../server.js"
elif [[ -f "../backend/server.js" ]]; then
    SERVER_FILE="../backend/server.js"
else
    echo "❌ Cannot find server.js file"
    echo "📋 Please check these locations:"
    find . -name "server.js" -type f 2>/dev/null | head -5
    exit 1
fi

echo "✅ Found server file: $SERVER_FILE"

# Check if endpoint already exists
if grep -q "/api/admin/printable-batches" "$SERVER_FILE"; then
    echo "⚠️ Endpoint already exists in server file"
    echo "📋 Let's check if server is running the updated code..."
else
    echo "➕ Adding endpoint to server file..."
    
    # Create backup
    cp "$SERVER_FILE" "${SERVER_FILE}.backup.manual"
    echo "✅ Backup created: ${SERVER_FILE}.backup.manual"
    
    # Add the endpoint at the end of the file, before any server.listen or app.listen
    cat > temp_endpoint.js << 'EOF'

// Batch Printing API Endpoints
app.get('/api/admin/printable-batches', async (req, res) => {
    try {
        console.log('🔄 Fetching printable batches...');
        
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

app.post('/api/admin/print-batch', async (req, res) => {
    const { batch_id, print_format, printer_name, notes } = req.body;
    const printed_by = 'admin';
    
    if (!batch_id) {
        return res.status(400).json({ success: false, message: 'Batch ID is required' });
    }
    
    const validFormats = ['individual_labels', 'batch_summary', 'shipping_list'];
    if (!validFormats.includes(print_format)) {
        return res.status(400).json({ success: false, message: 'Invalid print format' });
    }
    
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const [tests] = await connection.execute(
            'SELECT test_id, batch_id, is_printed FROM nad_test_ids WHERE batch_id = ?',
            [batch_id]
        );
        
        if (tests.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }
        
        await connection.execute(
            'UPDATE nad_test_ids SET is_printed = TRUE, printed_date = NOW(), printed_by = ? WHERE batch_id = ?',
            [printed_by, batch_id]
        );
        
        const print_job_id = `PJ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        const printData = {
            type: print_format,
            batch_id: batch_id,
            batch_short_id: batch_id.split('-').pop(),
            test_count: tests.length,
            test_ids: tests.map(t => t.test_id),
            labels: tests.map(test => ({
                test_id: test.test_id,
                batch_id: batch_id,
                batch_short_id: batch_id.split('-').pop(),
                print_date: new Date().toISOString()
            })),
            items: tests.map(test => ({
                test_id: test.test_id,
                checked: false,
                notes: ''
            })),
            summary_title: `Batch ${batch_id.split('-').pop()} Summary`,
            checklist_title: `Shipping Checklist - Batch ${batch_id.split('-').pop()}`,
            total_items: tests.length,
            created_date: new Date().toISOString()
        };
        
        await connection.commit();
        
        res.json({
            success: true,
            message: `Batch ${batch_id} marked as printed successfully`,
            data: {
                print_job_id: print_job_id,
                batch_id: batch_id,
                test_count: tests.length,
                print_format: print_format,
                printer_name: printer_name || 'Default',
                print_data: printData
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error processing print job:', error);
        res.status(500).json({ success: false, message: 'Failed to process print job', error: error.message });
    } finally {
        connection.release();
    }
});

EOF

    # Insert before app.listen or at the end
    if grep -n "app\.listen\|server\.listen" "$SERVER_FILE" | head -1; then
        LISTEN_LINE=$(grep -n "app\.listen\|server\.listen" "$SERVER_FILE" | head -1 | cut -d: -f1)
        echo "📋 Found server listen at line $LISTEN_LINE"
        
        # Insert before the listen line
        head -n $((LISTEN_LINE - 1)) "$SERVER_FILE" > "${SERVER_FILE}.new"
        cat temp_endpoint.js >> "${SERVER_FILE}.new"
        tail -n +$LISTEN_LINE "$SERVER_FILE" >> "${SERVER_FILE}.new"
        
        mv "${SERVER_FILE}.new" "$SERVER_FILE"
    else
        # Append at end
        cat temp_endpoint.js >> "$SERVER_FILE"
    fi
    
    rm temp_endpoint.js
    echo "✅ Endpoint added to server file"
fi

echo ""
echo "🔍 Checking current server status..."

# Check if server is running
if pgrep -f "server.js\|nad-api" > /dev/null; then
    echo "✅ Server process found"
    
    if command -v pm2 &> /dev/null; then
        echo "📋 Restarting with PM2..."
        pm2 list
        pm2 restart all
        sleep 3
        pm2 list
    else
        echo "📋 Server is running but not with PM2"
        echo "⚠️ You may need to manually restart the server"
    fi
else
    echo "❌ No server process found"
    echo "📋 Starting server..."
    
    if command -v pm2 &> /dev/null; then
        cd "$(dirname "$SERVER_FILE")"
        pm2 start "$(basename "$SERVER_FILE")" --name nad-api
    else
        echo "⚠️ Please manually start your server:"
        echo "   cd $(dirname "$SERVER_FILE")"
        echo "   node $(basename "$SERVER_FILE")"
    fi
fi

echo ""
echo "🧪 Testing the endpoint..."

sleep 5

# Test the endpoint
echo "📋 Testing: https://mynadtest.info/api/admin/printable-batches"

if curl -s -f "https://mynadtest.info/api/admin/printable-batches" > /dev/null; then
    echo "✅ Endpoint responds (200 OK)"
    
    # Check response content
    RESPONSE=$(curl -s "https://mynadtest.info/api/admin/printable-batches")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "✅ Endpoint returns success"
        
        # Count batches
        BATCH_COUNT=$(echo "$RESPONSE" | grep -o '"batch_id"' | wc -l)
        echo "📊 Found $BATCH_COUNT batches"
        
        if [[ $BATCH_COUNT -gt 0 ]]; then
            echo "🎉 Great! You have batches ready for printing"
        else
            echo "📦 No batches found - create some test batches first"
        fi
    else
        echo "⚠️ Endpoint returns error:"
        echo "$RESPONSE" | head -3
    fi
else
    echo "❌ Endpoint still not responding"
    echo ""
    echo "🔍 Debugging steps:"
    echo "1. Check server logs:"
    echo "   pm2 logs nad-api"
    echo ""
    echo "2. Check if server is running:"
    echo "   pm2 list"
    echo ""
    echo "3. Try manual restart:"
    echo "   pm2 restart nad-api"
    echo ""
    echo "4. Check server file syntax:"
    echo "   node -c $SERVER_FILE"
fi

echo ""
echo "🎯 SUMMARY"
echo "=========="
echo "✅ Server file location: $SERVER_FILE"
echo "✅ Endpoint code added"
echo "✅ Server restart attempted"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Check if endpoint test passed above"
echo "2. If yes: Test Batch Printing in admin interface"
echo "3. If no: Check server logs and restart manually"
echo ""
echo "🔧 Manual check commands:"
echo "   pm2 logs nad-api --lines 20"
echo "   curl https://mynadtest.info/api/admin/printable-batches"
echo ""
echo "✅ Manual endpoint addition complete!"
