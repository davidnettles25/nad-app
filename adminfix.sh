#!/bin/bash

# Manual Admin Fixes - Step by Step
# Let's fix each issue individually

echo "🔧 Manual Admin Fixes - Step by Step"
echo "===================================="

echo "📍 Working in: $(pwd)"

if [[ ! -f "admin.html" ]]; then
    echo "❌ admin.html not found"
    exit 1
fi

# Create backup
cp admin.html admin.html.backup.manual.$(date +%Y%m%d_%H%M%S)
echo "✅ Created backup"

echo ""
echo "🔍 Step 1: Finding the exact navigation structure..."

echo "📋 Looking for sidebar navigation:"
grep -n -A 5 -B 5 'Overview\|Test Management\|Supplements' admin.html | head -20

echo ""
echo "📋 Looking for navigation pattern:"
# Find the exact navigation structure
nav_line=$(grep -n 'Overview.*data-section' admin.html | head -1 | cut -d: -f1)
if [[ -n "$nav_line" ]]; then
    echo "Found navigation around line $nav_line"
    sed -n "${nav_line},$((nav_line+10))p" admin.html
else
    echo "Could not find navigation pattern, looking for different pattern..."
    grep -n -A 3 -B 3 'Overview\|Test Management' admin.html | head -15
fi

echo ""
echo "🖨️ Step 2: Adding Batch Printing navigation manually..."

# Find the Test Management line and add Batch Printing after it
test_mgmt_line=$(grep -n 'Test Management' admin.html | head -1 | cut -d: -f1)

if [[ -n "$test_mgmt_line" ]]; then
    echo "Found Test Management at line $test_mgmt_line"
    
    # Get the exact format of the existing navigation
    nav_format=$(sed -n "${test_mgmt_line}p" admin.html)
    echo "Navigation format: $nav_format"
    
    # Create batch printing navigation line with same format
    if [[ "$nav_format" == *"<li>"* ]]; then
        batch_nav='                    <li><a href="#" onclick="showBatchPrinting()" data-section="batch-printing">🖨️ Batch Printing</a></li>'
    elif [[ "$nav_format" == *"<a"* ]]; then
        batch_nav='            <a href="#" onclick="showBatchPrinting()" data-section="batch-printing">🖨️ Batch Printing</a>'
    else
        # Use a generic format
        batch_nav='            <li><a href="#" onclick="showBatchPrinting()" data-section="batch-printing">🖨️ Batch Printing</a></li>'
    fi
    
    # Insert after Test Management line
    sed -i "${test_mgmt_line}a\\
$batch_nav" admin.html
    
    echo "✅ Added Batch Printing navigation after Test Management"
else
    echo "❌ Could not find Test Management navigation line"
fi

echo ""
echo "🧹 Step 3: Fixing section content bleeding..."

echo "📋 Looking for section boundaries:"
grep -n 'content-section\|id="overview"\|id="tests"' admin.html

# Find the overview section and see what's in it
overview_start=$(grep -n 'id="overview"' admin.html | head -1 | cut -d: -f1)
tests_start=$(grep -n 'id="tests"' admin.html | head -1 | cut -d: -f1)

if [[ -n "$overview_start" && -n "$tests_start" ]]; then
    echo "Overview starts at line $overview_start"
    echo "Tests starts at line $tests_start"
    
    echo "📋 Content between Overview and Tests sections:"
    sed -n "${overview_start},$((tests_start-1))p" admin.html | grep -n 'Create Test\|test-quantity\|bulk-creation'
    
    # Check if test creation form is in overview section
    if sed -n "${overview_start},$((tests_start-1))p" admin.html | grep -q 'Create Test Block'; then
        echo "⚠️ Found test creation content in Overview section - needs manual cleanup"
        
        # Find the line with "Create Test Block" in overview section
        create_test_line=$(sed -n "${overview_start},$((tests_start-1))p" admin.html | grep -n 'Create Test Block' | head -1 | cut -d: -f1)
        if [[ -n "$create_test_line" ]]; then
            actual_line=$((overview_start + create_test_line - 1))
            echo "Test creation form starts around line $actual_line"
        fi
    fi
fi

echo ""
echo "📊 Step 4: Fixing Test Statistics position..."

# Find test statistics in tests section
if [[ -n "$tests_start" ]]; then
    echo "📋 Looking for Test Statistics in Tests section:"
    
    # Look for statistics after tests_start
    stats_line=$(tail -n +$tests_start admin.html | grep -n 'Test Statistics\|test-stats' | head -1 | cut -d: -f1)
    
    if [[ -n "$stats_line" ]]; then
        actual_stats_line=$((tests_start + stats_line - 1))
        echo "Found Test Statistics at line $actual_stats_line"
        
        # Check if it's near the bottom (should be near the top)
        section_length=$((tests_start + 50)) # Rough estimate
        if [[ $actual_stats_line -gt $section_length ]]; then
            echo "⚠️ Test Statistics appears to be at the bottom of the section"
            echo "   Manual reordering needed"
        fi
    fi
fi

echo ""
echo "📄 Step 5: Adding Batch Printing section content..."

# Add batch printing section at the end
cat >> admin.html << 'EOF'

        <!-- Batch Printing Section -->
        <div class="content-section" id="batch-printing" style="display: none;">
            <div class="section-header">
                <h2>🖨️ Batch Printing</h2>
                <p>Select and print test batches for shipping labels and documentation</p>
            </div>

            <div class="batch-printing-section">
                <!-- Batch Selection Grid -->
                <div class="batch-selector">
                    <div class="section-controls">
                        <h4>📦 Available Batches</h4>
                        <div class="batch-controls">
                            <button class="btn btn-sm secondary" onclick="refreshPrintableBatches()">🔄 Refresh</button>
                            <button class="btn btn-sm secondary" onclick="showPrintHistory()">📈 Print History</button>
                        </div>
                    </div>
                    
                    <div class="batch-grid" id="printable-batches">
                        <div class="loading-state" style="text-align: center; padding: 40px;">
                            <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                            <p>Click Refresh to load printable batches...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Print Options Panel -->
                <div class="print-options" id="print-options" style="display: none; background: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h4>🖨️ Print Options</h4>
                    <div class="selected-batch-info" id="selected-batch-info" style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                        <!-- Will be populated when batch is selected -->
                    </div>
                    
                    <div class="print-format-selector" style="margin-bottom: 20px;">
                        <h5>Print Format:</h5>
                        <label style="display: block; margin-bottom: 10px; cursor: pointer; padding: 10px; border: 1px solid #dee2e6; border-radius: 6px; background: white;">
                            <input type="radio" name="print_format" value="individual_labels" checked style="margin-right: 10px;">
                            <span>
                                <strong>📋 Individual Test ID Labels</strong><br>
                                <small style="color: #6c757d;">One label per test ID (recommended for label printers)</small>
                            </span>
                        </label>
                        
                        <label style="display: block; margin-bottom: 10px; cursor: pointer; padding: 10px; border: 1px solid #dee2e6; border-radius: 6px; background: white;">
                            <input type="radio" name="print_format" value="batch_summary" style="margin-right: 10px;">
                            <span>
                                <strong>📊 Batch Summary Sheet</strong><br>
                                <small style="color: #6c757d;">All test IDs on one page for records</small>
                            </span>
                        </label>
                        
                        <label style="display: block; margin-bottom: 10px; cursor: pointer; padding: 10px; border: 1px solid #dee2e6; border-radius: 6px; background: white;">
                            <input type="radio" name="print_format" value="shipping_list" style="margin-right: 10px;">
                            <span>
                                <strong>📦 Shipping Checklist</strong><br>
                                <small style="color: #6c757d;">Printable checklist for packing verification</small>
                            </span>
                        </label>
                    </div>
                    
                    <div class="printer-selector" style="margin-bottom: 20px;">
                        <label for="printer-select" style="display: block; margin-bottom: 8px; font-weight: 500;">🖨️ Printer:</label>
                        <select id="printer-select" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                            <option value="default">Default Label Printer</option>
                            <option value="zebra_zp450">Zebra ZP450 Label Printer</option>
                            <option value="dymo_450">DYMO LabelWriter 450</option>
                            <option value="brother_ql">Brother QL Series</option>
                            <option value="generic">Generic Printer</option>
                        </select>
                    </div>
                    
                    <div class="print-actions" style="display: flex; gap: 12px; justify-content: center;">
                        <button class="btn primary" onclick="printSelectedBatch()" style="min-width: 120px;">
                            🖨️ Print Batch
                        </button>
                        <button class="btn secondary" onclick="previewPrint()" style="min-width: 120px;">
                            👁️ Preview
                        </button>
                        <button class="btn secondary" onclick="cancelPrintSelection()" style="min-width: 120px;">
                            ❌ Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
EOF

echo "✅ Added Batch Printing section with inline styles"

echo ""
echo "⚙️ Step 6: Adding showBatchPrinting function..."

# Find where to add the function (look for existing functions)
if grep -q 'function showSection' admin.html; then
    # Add after showSection function
    show_section_line=$(grep -n 'function showSection' admin.html | head -1 | cut -d: -f1)
    
    # Find the end of the showSection function
    end_line=$(tail -n +$show_section_line admin.html | grep -n '^[[:space:]]*}' | head -1 | cut -d: -f1)
    actual_end_line=$((show_section_line + end_line - 1))
    
    # Add showBatchPrinting function after showSection
    sed -i "${actual_end_line}a\\
\\
        // Show batch printing section\\
        function showBatchPrinting() {\\
            console.log('🖨️ Showing batch printing section...');\\
            showSection('batch-printing');\\
            \\
            // Initialize batch printing if available\\
            setTimeout(() => {\\
                if (typeof batchPrintingManager !== 'undefined' && !batchPrintingManager.isInitialized) {\\
                    console.log('🚀 Initializing batch printing manager...');\\
                    batchPrintingManager.init();\\
                } else if (typeof batchPrintingManager === 'undefined') {\\
                    console.warn('⚠️ Batch printing manager not loaded yet');\\
                } else {\\
                    console.log('✅ Batch printing manager already initialized');\\
                }\\
            }, 500);\\
        }\\
\\
        // Make function globally available\\
        window.showBatchPrinting = showBatchPrinting;" admin.html
    
    echo "✅ Added showBatchPrinting function after showSection"
else
    echo "⚠️ Could not find showSection function - adding at end of script"
    
    # Add before closing script tag
    script_end=$(grep -n '</script>' admin.html | tail -1 | cut -d: -f1)
    if [[ -n "$script_end" ]]; then
        sed -i "${script_end}i\\
\\
// Show batch printing section\\
function showBatchPrinting() {\\
    console.log('🖨️ Showing batch printing section...');\\
    showSection('batch-printing');\\
    \\
    setTimeout(() => {\\
        if (typeof batchPrintingManager !== 'undefined') {\\
            batchPrintingManager.init();\\
        }\\
    }, 500);\\
}\\
\\
window.showBatchPrinting = showBatchPrinting;" admin.html
        
        echo "✅ Added showBatchPrinting function before </script>"
    fi
fi

echo ""
echo "🔗 Step 7: Adding CSS and JS references..."

# Add CSS reference in head
if ! grep -q 'batch-printing.css' admin.html; then
    head_end=$(grep -n '</head>' admin.html | head -1 | cut -d: -f1)
    if [[ -n "$head_end" ]]; then
        sed -i "${head_end}i\\
    <link rel=\"stylesheet\" href=\"admin/css/batch-printing.css\">" admin.html
        echo "✅ Added batch-printing.css to head"
    fi
fi

# Add JS reference before body end
if ! grep -q 'batch-printing.js' admin.html; then
    body_end=$(grep -n '</body>' admin.html | tail -1 | cut -d: -f1)
    if [[ -n "$body_end" ]]; then
        sed -i "${body_end}i\\
    <script src=\"admin/js/sections/batch-printing.js\"></script>" admin.html
        echo "✅ Added batch-printing.js before </body>"
    fi
fi

echo ""
echo "🧪 Step 8: Verification..."

echo "📋 Checking if fixes were applied:"

if grep -q 'Batch Printing' admin.html; then
    echo "✅ Batch Printing navigation added"
else
    echo "❌ Batch Printing navigation not found"
fi

if grep -q 'id="batch-printing"' admin.html; then
    echo "✅ Batch Printing section added"
else
    echo "❌ Batch Printing section not found"
fi

if grep -q 'showBatchPrinting' admin.html; then
    echo "✅ showBatchPrinting function added"
else
    echo "❌ showBatchPrinting function not found"
fi

if grep -q 'batch-printing.css' admin.html; then
    echo "✅ CSS reference added"
else
    echo "❌ CSS reference not found"
fi

if grep -q 'batch-printing.js' admin.html; then
    echo "✅ JS reference added"
else
    echo "❌ JS reference not found"
fi

echo ""
echo "🎯 MANUAL CLEANUP STILL NEEDED"
echo "=============================="
echo ""
echo "⚠️ 1. SECTION CONTENT BLEEDING:"
echo "   - Edit admin.html manually"
echo "   - Move 'Create Test Block' from Overview to Tests section"
echo "   - Ensure proper <div> closing tags"
echo ""
echo "⚠️ 2. TEST STATISTICS POSITION:"
echo "   - Move Test Statistics to top of Tests section"
echo "   - Should appear before 'Create Test Block'"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Edit admin.html manually to fix content bleeding"
echo "2. Deploy: ./deployment_script.sh"
echo "3. Test: Visit admin page and check navigation"
echo "4. Debug: Check browser console for errors"
echo ""
echo "✅ Automatic fixes applied - manual cleanup needed!"
