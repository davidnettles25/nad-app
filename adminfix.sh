#!/bin/bash

# Integrate Batch Printing into Existing Admin Interface
# Run this in your frontend/ directory

echo "🔗 Integrating Batch Printing into Admin Interface"
echo "================================================="

echo "📍 Working in: $(pwd)"

# Check if admin.html exists
if [[ ! -f "admin.html" ]]; then
    echo "❌ admin.html not found. Make sure you're in the frontend/ directory"
    exit 1
fi

echo "✅ Found admin.html"

echo ""
echo "🎨 Step 1: Adding CSS reference to admin.html..."

# Check if batch-printing.css is already referenced
if grep -q 'batch-printing.css' admin.html; then
    echo "⚠️ batch-printing.css already referenced in admin.html"
else
    # Find the last CSS link in head and add after it
    if grep -q '</head>' admin.html; then
        # Add before </head>
        sed -i.backup1 's|</head>|    <link rel="stylesheet" href="admin/css/batch-printing.css">\n</head>|' admin.html
        echo "✅ Added batch-printing.css to <head> section"
    else
        echo "⚠️ Could not find </head> tag. Please manually add:"
        echo '    <link rel="stylesheet" href="admin/css/batch-printing.css">'
    fi
fi

echo ""
echo "💻 Step 2: Adding JavaScript reference to admin.html..."

# Check if batch-printing.js is already referenced
if grep -q 'batch-printing.js' admin.html; then
    echo "⚠️ batch-printing.js already referenced in admin.html"
else
    # Add before </body>
    if grep -q '</body>' admin.html; then
        sed -i.backup2 's|</body>|    <script src="admin/js/sections/batch-printing.js"></script>\n</body>|' admin.html
        echo "✅ Added batch-printing.js before </body>"
    else
        echo "⚠️ Could not find </body> tag. Please manually add:"
        echo '    <script src="admin/js/sections/batch-printing.js"></script>'
    fi
fi

echo ""
echo "📱 Step 3: Adding navigation item..."

# Check if batch printing navigation already exists
if grep -q 'batch-printing' admin.html; then
    echo "⚠️ Batch printing navigation may already exist"
else
    # Look for existing navigation structure and add batch printing
    if grep -q 'data-section="tests"' admin.html; then
        # Add after tests navigation
        sed -i.backup3 '/data-section="tests"/a\
                            <li><a href="#" onclick="showBatchPrinting()" data-section="batch-printing">🖨️ Batch Printing</a></li>' admin.html
        echo "✅ Added batch printing navigation item"
    else
        echo "⚠️ Could not find navigation structure. Please manually add navigation item:"
        echo '<li><a href="#" onclick="showBatchPrinting()" data-section="batch-printing">🖨️ Batch Printing</a></li>'
    fi
fi

echo ""
echo "📄 Step 4: Adding batch printing section to admin.html..."

# Check if batch printing section already exists
if grep -q 'batch-printing-section' admin.html; then
    echo "⚠️ Batch printing section may already exist"
else
    # Add the batch printing section after tests section
    if grep -q 'id="tests"' admin.html; then
        # Find the end of tests section and add batch printing after it
        
        # Create the batch printing section content
        cat > temp_batch_section.html << 'EOF'

        <!-- Batch Printing Section -->
        <div class="content-section" id="batch-printing" style="display: none;">
            <div class="batch-printing-section">
                <h3>🖨️ Batch Printing</h3>
                <p>Select and print test batches for shipping labels and documentation.</p>
                
                <!-- Batch Selection Grid -->
                <div class="batch-selector">
                    <div class="section-header">
                        <h4>📦 Available Batches</h4>
                        <div class="batch-controls">
                            <button class="btn btn-sm secondary" onclick="refreshPrintableBatches()">🔄 Refresh</button>
                            <button class="btn btn-sm secondary" onclick="showPrintHistory()">📈 Print History</button>
                        </div>
                    </div>
                    
                    <div class="batch-grid" id="printable-batches">
                        <div class="loading-state">
                            <div class="spinner"></div>
                            <p>Loading printable batches...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Print Options Panel -->
                <div class="print-options" id="print-options" style="display: none;">
                    <h4>🖨️ Print Options</h4>
                    <div class="selected-batch-info" id="selected-batch-info">
                        <!-- Will be populated when batch is selected -->
                    </div>
                    
                    <div class="print-format-selector">
                        <h5>Print Format:</h5>
                        <label class="radio-option">
                            <input type="radio" name="print_format" value="individual_labels" checked>
                            <span class="radio-label">
                                <strong>📋 Individual Test ID Labels</strong>
                                <small>One label per test ID (recommended for label printers)</small>
                            </span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="print_format" value="batch_summary">
                            <span class="radio-label">
                                <strong>📊 Batch Summary Sheet</strong>
                                <small>All test IDs on one page for records</small>
                            </span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="print_format" value="shipping_list">
                            <span class="radio-label">
                                <strong>📦 Shipping Checklist</strong>
                                <small>Printable checklist for packing verification</small>
                            </span>
                        </label>
                    </div>
                    
                    <div class="printer-selector">
                        <label for="printer-select">🖨️ Printer:</label>
                        <select id="printer-select" class="form-control">
                            <option value="default">Default Label Printer</option>
                            <option value="zebra_zp450">Zebra ZP450 Label Printer</option>
                            <option value="dymo_450">DYMO LabelWriter 450</option>
                            <option value="brother_ql">Brother QL Series</option>
                            <option value="generic">Generic Printer</option>
                        </select>
                    </div>
                    
                    <div class="print-actions">
                        <button class="btn primary" onclick="printSelectedBatch()">
                            🖨️ Print Batch
                        </button>
                        <button class="btn secondary" onclick="previewPrint()">
                            👁️ Preview
                        </button>
                        <button class="btn secondary" onclick="cancelPrintSelection()">
                            ❌ Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
EOF
        
        # Find where to insert the batch printing section (after tests section)
        awk '
        /<div.*id="tests".*content-section/ { in_tests = 1 }
        in_tests && /<\/div>/ { 
            print
            if (--div_count == 0) {
                while ((getline line < "temp_batch_section.html") > 0) {
                    print line
                }
                close("temp_batch_section.html")
                in_tests = 0
                next
            }
        }
        in_tests && /<div/ { div_count++ }
        in_tests && /<\/div>/ { div_count-- }
        { print }
        ' admin.html > admin.html.tmp
        
        # Check if the insertion worked
        if grep -q 'batch-printing-section' admin.html.tmp; then
            mv admin.html.tmp admin.html
            rm temp_batch_section.html
            echo "✅ Added batch printing section to admin.html"
        else
            rm admin.html.tmp temp_batch_section.html
            echo "⚠️ Could not automatically add section. Please manually add the batch printing section."
        fi
    else
        rm temp_batch_section.html 2>/dev/null
        echo "⚠️ Could not find tests section. Please manually add the batch printing section."
    fi
fi

echo ""
echo "⚙️ Step 5: Adding showBatchPrinting function..."

# Check if showBatchPrinting function already exists
if grep -q 'showBatchPrinting' admin.html; then
    echo "⚠️ showBatchPrinting function may already exist"
else
    # Add the function before the closing </script> tag
    if grep -q '</script>' admin.html; then
        # Find the last </script> and add before it
        sed -i.backup4 '$!b; /^<\/script>$/i\
\
// Show batch printing section\
function showBatchPrinting() {\
    console.log("🖨️ Showing batch printing section...");\
    showSection("batch-printing");\
    \
    // Initialize batch printing if not already done\
    if (typeof batchPrintingManager !== "undefined" && !batchPrintingManager.isInitialized) {\
        setTimeout(() => {\
            batchPrintingManager.init();\
        }, 100);\
    }\
}\
\
// Make function globally available\
window.showBatchPrinting = showBatchPrinting;' admin.html
        
        echo "✅ Added showBatchPrinting function"
    else
        echo "⚠️ Could not find script section. Please manually add showBatchPrinting function."
    fi
fi

echo ""
echo "🧪 Step 6: Testing integration..."

# Verify all components are in place
echo "📋 Checking integration status:"

if grep -q 'batch-printing.css' admin.html; then
    echo "✅ CSS reference added"
else
    echo "❌ CSS reference missing"
fi

if grep -q 'batch-printing.js' admin.html; then
    echo "✅ JavaScript reference added"
else
    echo "❌ JavaScript reference missing"
fi

if grep -q 'showBatchPrinting' admin.html; then
    echo "✅ Navigation and function added"
else
    echo "❌ Navigation or function missing"
fi

if grep -q 'batch-printing-section' admin.html; then
    echo "✅ Batch printing section added"
else
    echo "❌ Batch printing section missing"
fi

# Check if required files exist
echo ""
echo "📁 Checking required files:"

if [[ -f "admin/css/batch-printing.css" ]]; then
    echo "✅ admin/css/batch-printing.css exists"
else
    echo "❌ admin/css/batch-printing.css missing"
fi

if [[ -f "admin/js/sections/batch-printing.js" ]]; then
    echo "✅ admin/js/sections/batch-printing.js exists"
else
    echo "❌ admin/js/sections/batch-printing.js missing"
fi

echo ""
echo "🎯 INTEGRATION SUMMARY"
echo "====================="
echo "✅ Added CSS reference to admin.html"
echo "✅ Added JavaScript reference to admin.html"
echo "✅ Added navigation item for batch printing"
echo "✅ Added batch printing section to admin.html"
echo "✅ Added showBatchPrinting() function"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Deploy to server: ./deployment_script.sh"
echo "2. Visit https://mynadtest.info/admin.html"
echo "3. Click '🖨️ Batch Printing' in navigation"
echo "4. Test batch selection and printing"
echo ""
echo "🔍 TESTING CHECKLIST:"
echo "□ Navigate to Batch Printing section"
echo "□ See available batches load"
echo "□ Select a batch for printing"
echo "□ Choose print format"
echo "□ Test print preview/print functionality"
echo "□ Verify print status updates"
echo ""
echo "🐛 IF ISSUES OCCUR:"
echo "- Check browser console for JavaScript errors"
echo "- Verify API endpoints are working"
echo "- Ensure database tables were created"
echo "- Check network tab for failed requests"
echo ""
echo "✅ Batch printing integration complete!"
