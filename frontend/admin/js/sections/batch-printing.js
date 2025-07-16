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
    
    // Find the container in the batch-printing section
    const container = document.getElementById('printable-batches');
    
    if (!container) {
        console.error('❌ Container printable-batches not found!');
        return;
    }
    
    console.log('📦 Found container:', container);
    
    if (printableBatches.length === 0) {
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
    
    // Use the existing container and apply proper grid styling
    container.style.cssText = `
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
        gap: 20px !important;
        padding: 20px !important;
        background: white !important;
        border-radius: 8px !important;
        margin: 20px 0 !important;
    `;
    
    // Create simplified batch cards
    const batchCards = printableBatches.map(batch => `
        <div style="background: white; border: 2px solid #007bff; padding: 15px; border-radius: 8px; min-height: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4 style="color: #007bff; margin: 0 0 10px 0;">Batch #${batch.batch_id.split('-').pop()}</h4>
            <p style="margin: 5px 0;"><strong>Tests:</strong> ${batch.total_tests}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${batch.print_status}</p>
            <p style="margin: 5px 0;"><strong>Created:</strong> ${new Date(batch.created_date).toLocaleDateString()}</p>
            ${batch.batch_notes ? `<p style="margin: 5px 0; color: #666; font-style: italic;"><strong>Note:</strong> ${batch.batch_notes}</p>` : ''}
            <div style="margin-top: 15px;">
                <button onclick="selectBatchForPrint('${batch.batch_id}')" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                    🖨️ Print
                </button>
                <button onclick="viewBatchDetails('${batch.batch_id}')" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    👁️ Details
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = batchCards;
    console.log('✅ Rendered batch cards in proper container');
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
                ${batch.batch_notes ? `
                <div style="margin-bottom: 6px; font-size: 14px;">
                    <div style="font-weight: 500; color: #666; margin-bottom: 2px;">Note:</div>
                    <div style="color: #495057; font-style: italic; font-size: 13px; padding: 4px 8px; background: #f8f9fa; border-radius: 3px;">${batch.batch_notes}</div>
                </div>
                ` : ''}
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
        ${batch.batch_notes ? `
            <div style="margin-bottom: 6px;">
                <div style="font-weight: 500; color: #666; margin-bottom: 2px;">Note:</div>
                <div style="color: #495057; font-style: italic; font-size: 13px; padding: 4px 8px; background: #f8f9fa; border-radius: 3px;">${batch.batch_notes}</div>
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
