/**
 * Batch Printing Manager - Simple Implementation
 * Since the modular version isn't loading, let's create a working basic version
 */

console.log('🖨️ Loading Batch Printing functionality...');

// Simple batch printing functionality
let selectedBatch = null;
let printableBatches = [];

// Initialize batch printing
function initBatchPrinting() {
    console.log('🚀 Initializing Batch Printing...');
    
    // Auto-load batches when section is shown
    setTimeout(() => {
        loadPrintableBatches();
    }, 1000);
}

// Load printable batches from API
async function loadPrintableBatches() {
    console.log('🔄 Loading printable batches...');
    
    // First check if the batch-printing section is actually visible
    const batchSection = document.getElementById('batch-printing');
    if (batchSection) {
        const isVisible = batchSection.classList.contains('active');
        const computedStyle = window.getComputedStyle(batchSection);
        console.log('🔍 Batch section active class:', isVisible);
        console.log('🔍 Batch section display:', computedStyle.display);
        console.log('🔍 Batch section visibility:', computedStyle.visibility);
    }
    
    const container = document.getElementById('printable-batches');
    if (!container) {
        console.warn('⚠️ Printable batches container not found');
        return;
    }
    
    try {
        // Show loading
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p>Loading printable batches...</p>
            </div>
        `;
        
        const response = await fetch(`${API_BASE}/api/admin/printable-batches`);
        const result = await response.json();
        
        if (result.success) {
            printableBatches = result.data;
            renderBatchCards();
            console.log(`✅ Loaded ${printableBatches.length} printable batches`);
        } else {
            throw new Error(result.message || 'Failed to load batches');
        }
        
    } catch (error) {
        console.error('❌ Error loading printable batches:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #dc3545;">
                <h4>⚠️ Error Loading Batches</h4>
                <p>${error.message}</p>
                <button class="btn primary" onclick="loadPrintableBatches()" style="margin-top: 15px;">
                    🔄 Try Again
                </button>
            </div>
        `;
    }
}

// Render batch cards
function renderBatchCards() {
    console.log('🎨 renderBatchCards called with', printableBatches.length, 'batches');
    const container = document.getElementById('printable-batches');
    if (!container) {
        console.error('❌ Container printable-batches not found!');
        return;
    }
    
    console.log('📦 Container found:', container);
    console.log('📦 Container parent:', container.parentElement);
    
    const computedStyles = window.getComputedStyle(container);
    console.log('📦 Container display:', computedStyles.display);
    console.log('📦 Container width:', computedStyles.width);
    console.log('📦 Container height:', computedStyles.height);
    console.log('📦 Container visibility:', computedStyles.visibility);
    console.log('📦 Container opacity:', computedStyles.opacity);
    console.log('📦 Container position:', computedStyles.position);
    console.log('📦 Container overflow:', computedStyles.overflow);
    
    console.log('📦 Container offsetHeight:', container.offsetHeight);
    console.log('📦 Container offsetWidth:', container.offsetWidth);
    console.log('📦 Container visible:', container.offsetHeight > 0 && container.offsetWidth > 0);
    
    // Check parent styles too
    const parentStyles = window.getComputedStyle(container.parentElement);
    console.log('📦 Parent display:', parentStyles.display);
    console.log('📦 Parent height:', parentStyles.height);
    console.log('📦 Parent overflow:', parentStyles.overflow);
    
    if (printableBatches.length === 0) {
        console.log('📝 No batches to display');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h4>📦 No Printable Batches</h4>
                <p>Create test batches first to enable printing functionality.</p>
                <button class="btn primary" onclick="showSection('tests')" style="margin-top: 15px;">
                    📦 Create Batches
                </button>
            </div>
        `;
        return;
    }
    
    console.log('🔨 Creating HTML for', printableBatches.length, 'batches');
    
    const html = printableBatches.map(batch => createBatchCard(batch)).join('');
    console.log('📄 Generated HTML length:', html.length);
    
    // Set the actual batch cards HTML
    container.innerHTML = html;
    console.log('✅ HTML set to container');
    
    // Create a completely independent container that bypasses all CSS issues
    const workingContainer = document.createElement('div');
    workingContainer.id = 'working-batch-container';
    workingContainer.style.cssText = `
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
        gap: 20px !important;
        width: calc(100% - 40px) !important;
        min-height: 300px !important;
        margin: 20px !important;
        padding: 20px !important;
        background: white !important;
        border: 2px solid #007bff !important;
        border-radius: 8px !important;
        position: relative !important;
        z-index: 1000 !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
    `;
    workingContainer.innerHTML = html;
    
    // Find the batch-printing section and append our working container
    const batchSection = document.getElementById('batch-printing');
    if (batchSection) {
        // Clear any existing content and add our working container
        const existingWorking = document.getElementById('working-batch-container');
        if (existingWorking) {
            existingWorking.remove();
        }
        batchSection.appendChild(workingContainer);
        console.log('✅ Created working container and added to batch section');
    }
    
    // Force the parent and all ancestors to be visible (but preserve content-section behavior)
    let parent = container.parentElement;
    while (parent && parent !== document.body) {
        // Don't override content-section display behavior
        if (!parent.classList.contains('content-section')) {
            parent.style.display = 'block';
        }
        parent.style.height = 'auto';
        parent.style.minHeight = 'fit-content';
        parent.style.overflow = 'visible';
        console.log('🔧 Fixed parent:', parent.className || parent.tagName);
        parent = parent.parentElement;
    }
    
    // Success! Remove this test code in production
    
    // Only ensure batch-printing section follows normal content-section behavior
    const batchSection = document.getElementById('batch-printing');
    if (batchSection) {
        // Remove any forced display style to let CSS handle it
        batchSection.style.display = '';
        console.log('🎨 Reset batch-printing section display to follow CSS');
        
        // Add a simple test element to see if the section is visible
        const testElement = document.createElement('div');
        testElement.style.cssText = `
            background: orange !important;
            color: black !important;
            padding: 20px !important;
            margin: 20px 0 !important;
            border: 3px solid red !important;
            font-size: 16px !important;
            font-weight: bold !important;
            position: relative !important;
            z-index: 99999 !important;
        `;
        testElement.innerHTML = `
            <h3>🧪 BATCH SECTION TEST</h3>
            <p>If you see this, the batch-printing section is visible!</p>
            <p>Found ${printableBatches.length} batches in data.</p>
        `;
        batchSection.appendChild(testElement);
        console.log('🧪 Added test element to batch-printing section');
    }
    
    console.log('🎨 Forced container styles applied');
}

// Create batch card HTML
function createBatchCard(batch) {
    console.log('🏗️ Creating card for batch:', batch.batch_id);
    try {
        const batchShortId = batch.batch_id.split('-').pop();
        const printStatusText = getPrintStatusText(batch.print_status);
        const lastPrinted = batch.last_printed_date 
            ? new Date(batch.last_printed_date).toLocaleDateString()
            : 'Never';
    
    const progressBar = batch.print_status === 'partially_printed' ? `
        <div style="width: 100%; height: 6px; background: #e9ecef; border-radius: 3px; margin: 8px 0; overflow: hidden;">
            <div style="height: 100%; background: #ffc107; width: ${batch.print_percentage}%;"></div>
        </div>
        <small>Progress: ${batch.print_percentage}% (${batch.printed_tests}/${batch.total_tests})</small>
    ` : '';
    
    const printButtonText = batch.print_status === 'not_printed' ? 'Print' : 'Reprint';
    
    return `
        <div class="batch-card ${batch.print_status}" data-batch-id="${batch.batch_id}" 
             style="border: 2px solid #dee2e6; border-radius: 8px; padding: 15px; background: white; margin-bottom: 15px; cursor: pointer; border-left: 6px solid ${getBorderColor(batch.print_status)};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h5 style="margin: 0; font-size: 16px; font-weight: 600;">Batch #${batchShortId}</h5>
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ${getStatusBg(batch.print_status)}; color: ${getStatusColor(batch.print_status)};">
                    ${printStatusText}
                </span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
                    <span style="font-weight: 500; color: #666;">Tests:</span>
                    <span style="color: #495057; font-weight: 500;">${batch.total_tests}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
                    <span style="font-weight: 500; color: #666;">Created:</span>
                    <span style="color: #495057; font-weight: 500;">${new Date(batch.created_date).toLocaleDateString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
                    <span style="font-weight: 500; color: #666;">Last Printed:</span>
                    <span style="color: #495057; font-weight: 500;">${lastPrinted}</span>
                </div>
                ${progressBar}
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button class="btn primary" onclick="selectBatchForPrint('${batch.batch_id}')" style="flex: 1; padding: 6px 12px; font-size: 13px;">
                    🖨️ ${printButtonText}
                </button>
                <button class="btn secondary" onclick="viewBatchDetails('${batch.batch_id}')" style="flex: 1; padding: 6px 12px; font-size: 13px;">
                    👁️ Details
                </button>
            </div>
        </div>
    `;
    } catch (error) {
        console.error('❌ Error creating batch card:', error, batch);
        return `<div style="color: red; padding: 10px;">Error creating card for batch ${batch.batch_id}</div>`;
    }
}

// Helper functions
function getPrintStatusText(status) {
    switch (status) {
        case 'not_printed': return '🔴 Not Printed';
        case 'partially_printed': return '🟡 Partial';
        case 'fully_printed': return '🟢 Printed';
        default: return '❓ Unknown';
    }
}

function getBorderColor(status) {
    switch (status) {
        case 'not_printed': return '#dc3545';
        case 'partially_printed': return '#ffc107';
        case 'fully_printed': return '#28a745';
        default: return '#dee2e6';
    }
}

function getStatusBg(status) {
    switch (status) {
        case 'not_printed': return '#f8d7da';
        case 'partially_printed': return '#fff3cd';
        case 'fully_printed': return '#d4edda';
        default: return '#e9ecef';
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'not_printed': return '#721c24';
        case 'partially_printed': return '#856404';
        case 'fully_printed': return '#155724';
        default: return '#495057';
    }
}

// Select batch for printing
function selectBatchForPrint(batchId) {
    console.log(`🎯 Selected batch for printing: ${batchId}`);
    
    selectedBatch = batchId;
    const batch = printableBatches.find(b => b.batch_id === batchId);
    
    if (!batch) {
        if (typeof showAlert === 'function') {
            showAlert('Batch not found', 'error');
        }
        return;
    }
    
    // Highlight selected batch
    document.querySelectorAll('.batch-card').forEach(card => {
        card.style.boxShadow = 'none';
        card.style.borderColor = '#dee2e6';
    });
    
    const selectedCard = document.querySelector(`[data-batch-id="${batchId}"]`);
    if (selectedCard) {
        selectedCard.style.boxShadow = '0 4px 12px rgba(0,123,255,0.15)';
        selectedCard.style.borderColor = '#007bff';
    }
    
    // Update selected batch info
    updateSelectedBatchInfo(batch);
    
    // Show print options panel
    const printOptions = document.getElementById('print-options');
    if (printOptions) {
        printOptions.style.display = 'block';
        printOptions.scrollIntoView({ behavior: 'smooth' });
    }
    
    if (typeof showAlert === 'function') {
        showAlert(`Selected batch ${batchId.split('-').pop()} for printing`, 'info');
    }
}

// Update selected batch info
function updateSelectedBatchInfo(batch) {
    const batchInfo = document.getElementById('selected-batch-info');
    if (!batchInfo) return;
    
    batchInfo.innerHTML = `
        <h5>Selected: Batch #${batch.batch_id.split('-').pop()}</h5>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 500; color: #666;">Tests to print:</span>
            <span>${batch.total_tests}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 500; color: #666;">Current status:</span>
            <span>${getPrintStatusText(batch.print_status)}</span>
        </div>
        ${batch.print_status !== 'not_printed' ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-weight: 500; color: #666;">Last printed:</span>
                <span>${new Date(batch.last_printed_date).toLocaleDateString()}</span>
            </div>
        ` : ''}
    `;
}

// Print selected batch
async function printSelectedBatch() {
    if (!selectedBatch) {
        if (typeof showAlert === 'function') {
            showAlert('Please select a batch first', 'warning');
        }
        return;
    }
    
    const printFormat = document.querySelector('input[name="print_format"]:checked')?.value;
    const printerName = document.getElementById('printer-select')?.value;
    
    if (!printFormat) {
        if (typeof showAlert === 'function') {
            showAlert('Please select a print format', 'warning');
        }
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/print-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                batch_id: selectedBatch,
                print_format: printFormat,
                printer_name: printerName || 'default',
                notes: `Printed from admin portal - ${new Date().toISOString()}`
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (typeof showAlert === 'function') {
                showAlert(`✅ Batch queued for printing! Job ID: ${result.data.print_job_id}`, 'success');
            }
            
            // Open print window
            openPrintWindow(result.data);
            
            // Refresh batches
            setTimeout(() => {
                loadPrintableBatches();
            }, 2000);
            
            // Hide print options
            cancelPrintSelection();
            
        } else {
            throw new Error(result.message || 'Print job failed');
        }
    } catch (error) {
        console.error('❌ Print error:', error);
        if (typeof showAlert === 'function') {
            showAlert(`❌ Print failed: ${error.message}`, 'error');
        }
    }
}

// Open print window
function openPrintWindow(printData) {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    let content = '';
    
    if (printData.print_format === 'individual_labels') {
        content = `
            <h3>Individual Test Labels - Batch ${printData.batch_id.split('-').pop()}</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                ${printData.print_data.labels.map(label => `
                    <div style="border: 1px solid #000; padding: 10px; text-align: center;">
                        <div style="font-weight: bold; font-size: 14px;">${label.test_id}</div>
                        <div style="font-size: 10px;">Batch: ${label.batch_short_id}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (printData.print_format === 'batch_summary') {
        content = `
            <h3>${printData.print_data.summary_title}</h3>
            <p>Total Tests: ${printData.print_data.test_count}</p>
            <div style="columns: 3; column-gap: 20px;">
                ${printData.print_data.test_ids.map(id => `<div style="margin-bottom: 5px; font-family: monospace;">${id}</div>`).join('')}
            </div>
        `;
    } else if (printData.print_format === 'shipping_list') {
        content = `
            <h3>${printData.print_data.checklist_title}</h3>
            <p>Total Items: ${printData.print_data.total_items}</p>
            ${printData.print_data.items.map(item => `
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <input type="checkbox"> ${item.test_id}
                    <span style="margin-left: 20px;">_________________</span>
                </div>
            `).join('')}
        `;
    }
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print - ${printData.batch_id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            ${content}
            <script>
                window.onload = function() {
                    setTimeout(() => window.print(), 500);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Other functions
function viewBatchDetails(batchId) {
    console.log(`👁️ Viewing details for batch: ${batchId}`);
    if (typeof showAlert === 'function') {
        showAlert(`Viewing details for batch ${batchId.split('-').pop()}`, 'info');
    }
}

function previewPrint() {
    if (typeof showAlert === 'function') {
        showAlert('Print preview will open with the print dialog', 'info');
    }
}

function cancelPrintSelection() {
    selectedBatch = null;
    
    // Remove highlights
    document.querySelectorAll('.batch-card').forEach(card => {
        card.style.boxShadow = 'none';
        card.style.borderColor = '#dee2e6';
    });
    
    // Hide print options
    const printOptions = document.getElementById('print-options');
    if (printOptions) {
        printOptions.style.display = 'none';
    }
}

function refreshPrintableBatches() {
    loadPrintableBatches();
}

function showPrintHistory() {
    if (typeof showAlert === 'function') {
        showAlert('Print history feature coming soon', 'info');
    }
}

// Global functions
window.loadPrintableBatches = loadPrintableBatches;
window.selectBatchForPrint = selectBatchForPrint;
window.printSelectedBatch = printSelectedBatch;
window.viewBatchDetails = viewBatchDetails;
window.previewPrint = previewPrint;
window.cancelPrintSelection = cancelPrintSelection;
window.refreshPrintableBatches = refreshPrintableBatches;
window.showPrintHistory = showPrintHistory;
window.initBatchPrinting = initBatchPrinting;

console.log('✅ Batch Printing functionality loaded');

// Auto-initialize if we're on the batch printing section
if (document.getElementById('batch-printing')) {
    initBatchPrinting();
}
