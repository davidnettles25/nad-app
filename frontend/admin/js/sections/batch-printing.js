/**
 * Batch Printing Manager - Simple Implementation
 * Since the modular version isn't loading, let's create a working basic version
 */

// Loading Batch Printing functionality...

// Simple batch printing functionality
let selectedBatch = null;
let printableBatches = [];

// Initialize batch printing
function initBatchPrinting() {
    // Initializing Batch Printing...
    
    // Auto-load batches when section is shown
    setTimeout(() => {
        loadPrintableBatches();
    }, 1000);
}

// Load printable batches from API
async function loadPrintableBatches() {
    // Loading printable batches...
    
    const container = document.getElementById('printable-batches');
    if (!container) {
        // Printable batches container not found
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
            // Loaded printable batches
        } else {
            throw new Error(result.message || 'Failed to load batches');
        }
        
    } catch (error) {
        // Error loading printable batches
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
    // renderBatchCards called with batches
    
    // Find the container in the batch-printing section
    const container = document.getElementById('printable-batches');
    
    if (!container) {
        // Container printable-batches not found!
        return;
    }
    
    // Found container
    
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
                <button onclick="viewBatchDetails('${batch.batch_id}')" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                    👁️ Details
                </button>
                <button onclick="downloadBatchXLSX('${batch.batch_id}')" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    📊 XLSX
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = batchCards;
    // Rendered batch cards in proper container
}

// Create batch card HTML
function createBatchCard(batch) {
    // Creating card for batch
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
                <button class="btn success" onclick="downloadBatchXLSX('${batch.batch_id}')" style="flex: 1; padding: 6px 12px; font-size: 13px; background: #28a745; color: white; border: none; border-radius: 4px;">
                    📊 XLSX
                </button>
            </div>
        </div>
    `;
    } catch (error) {
        // Error creating batch card
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
    // Selected batch for printing
    
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
            // Show debug info if available
            let debugInfo = '';
            if (result.data.debug) {
                const d = result.data.debug;
                debugInfo = ` | Debug: ${d.printed_tests}/${d.total_tests} tests printed`;
                if (d.unprinted_tests > 0) {
                    debugInfo += ` (${d.unprinted_tests} NOT printed!)`;
                }
            }
            
            if (typeof showAlert === 'function') {
                showAlert(`✅ Batch queued for printing! Job ID: ${result.data.print_job_id}${debugInfo}`, 'success');
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
        // Print error
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
async function viewBatchDetails(batchId) {
    // Viewing details for batch
    
    try {
        // Create and show modal
        const modal = createBatchDetailsModal();
        document.body.appendChild(modal);
        
        // Show loading state
        const detailsContainer = modal.querySelector('#batch-details-container');
        detailsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p>Loading batch details...</p>
            </div>
        `;
        
        // Fetch batch details from API
        const response = await fetch(`${API_BASE}/api/admin/batch-details/${batchId}`);
        const result = await response.json();
        
        if (result.success) {
            renderBatchDetails(result.data, detailsContainer);
        } else {
            detailsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <h4>⚠️ Error Loading Details</h4>
                    <p>${result.message || 'Failed to load batch details'}</p>
                </div>
            `;
        }
        
    } catch (error) {
        // Error loading batch details
        if (typeof showAlert === 'function') {
            showAlert('Failed to load batch details', 'error');
        }
    }
}

function createBatchDetailsModal() {
    const modal = document.createElement('div');
    modal.id = 'batch-details-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
        <div style="background: white; border-radius: 12px; padding: 0; width: 95%; max-width: 900px; max-height: 85vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 18px;">👁️ Batch Details</h3>
                <button onclick="closeBatchDetailsModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
            </div>
            <div id="batch-details-container" style="max-height: calc(85vh - 80px); overflow-y: auto; padding: 20px;">
                <!-- Details content will be loaded here -->
            </div>
        </div>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeBatchDetailsModal();
        }
    });
    
    return modal;
}

function renderBatchDetails(data, container) {
    const batchShortId = data.batch_info.batch_id.split('-').pop();
    const printStatus = getPrintStatusText(data.batch_info.print_status);
    
    const detailsHTML = `
        <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #333; display: flex; align-items: center; gap: 10px;">
                <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 12px; border-radius: 6px; font-size: 16px;">
                    Batch #${batchShortId}
                </span>
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; background: ${getStatusBg(data.batch_info.print_status)}; color: ${getStatusColor(data.batch_info.print_status)};">
                    ${printStatus}
                </span>
            </h4>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <h5 style="margin: 0 0 10px 0; color: #495057;">📊 Batch Summary</h5>
                <div style="display: grid; gap: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500; color: #666;">Total Tests:</span>
                        <span style="font-weight: 600; color: #007bff;">${data.batch_info.total_tests}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500; color: #666;">Printed Tests:</span>
                        <span style="font-weight: 600; color: #28a745;">${data.batch_info.printed_tests}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500; color: #666;">Remaining:</span>
                        <span style="font-weight: 600; color: #ffc107;">${data.batch_info.total_tests - data.batch_info.printed_tests}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500; color: #666;">Progress:</span>
                        <span style="font-weight: 600;">${data.batch_info.print_percentage}%</span>
                    </div>
                </div>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <h5 style="margin: 0 0 10px 0; color: #495057;">📅 Dates & Info</h5>
                <div style="display: grid; gap: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500; color: #666;">Created:</span>
                        <span>${new Date(data.batch_info.created_date).toLocaleString()}</span>
                    </div>
                    ${data.batch_info.last_printed_date ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500; color: #666;">Last Printed:</span>
                        <span>${new Date(data.batch_info.last_printed_date).toLocaleString()}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500; color: #666;">Batch Size:</span>
                        <span>${data.batch_info.batch_size}</span>
                    </div>
                </div>
            </div>
        </div>

        ${data.batch_info.batch_notes ? `
        <div style="background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
            <h6 style="margin: 0 0 8px 0; color: #007bff;">📝 Notes</h6>
            <p style="margin: 0; color: #495057; font-style: italic;">${data.batch_info.batch_notes}</p>
        </div>
        ` : ''}

        ${data.batch_info.print_status === 'partially_printed' ? `
        <div style="margin-bottom: 20px;">
            <h6 style="margin: 0 0 10px 0; color: #495057;">📈 Print Progress</h6>
            <div style="width: 100%; height: 12px; background: #e9ecef; border-radius: 6px; overflow: hidden;">
                <div style="height: 100%; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); width: ${data.batch_info.print_percentage}%; transition: width 0.3s ease;"></div>
            </div>
            <div style="text-align: center; margin-top: 5px; font-size: 12px; color: #666;">
                ${data.batch_info.printed_tests} of ${data.batch_info.total_tests} tests printed (${data.batch_info.print_percentage}%)
            </div>
        </div>
        ` : ''}

        ${data.print_history && data.print_history.length > 0 ? `
        <div style="margin-bottom: 20px;">
            <h6 style="margin: 0 0 15px 0; color: #495057;">🖨️ Print History</h6>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 8px;">
                ${data.print_history.map(entry => `
                    <div style="padding: 12px; border-bottom: 1px solid #f8f9fa; last-child:border-bottom: none;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <span style="font-weight: 500; color: #007bff;">${entry.print_format.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            <span style="font-size: 12px; color: #666;">${new Date(entry.printed_date).toLocaleString()}</span>
                        </div>
                        <div style="font-size: 13px; color: #666;">
                            ${entry.test_count} tests • ${entry.printer_name || 'Default printer'} • Job: ${entry.print_job_id}
                        </div>
                        ${entry.notes ? `<div style="font-size: 12px; color: #999; margin-top: 3px; font-style: italic;">${entry.notes}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div>
            <h6 style="margin: 0 0 15px 0; color: #495057;">🔢 Test IDs (showing first 20)</h6>
            <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; max-height: 200px; overflow-y: auto;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; font-family: monospace; font-size: 11px;">
                    ${data.test_ids.slice(0, 20).map(test => `
                        <div style="padding: 4px 6px; background: white; border: 1px solid #dee2e6; border-radius: 4px; ${test.is_printed ? 'border-left: 3px solid #28a745; background: #f8fff8;' : 'border-left: 3px solid #ffc107; background: #fffdf8;'}">
                            <div style="font-weight: 500;">${test.test_id}</div>
                            <div style="font-size: 9px; color: #666;">${test.is_printed ? 'Printed' : 'Pending'}</div>
                        </div>
                    `).join('')}
                </div>
                ${data.test_ids.length > 20 ? `
                    <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #666;">
                        ... and ${data.test_ids.length - 20} more test IDs
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    container.innerHTML = detailsHTML;
}

function closeBatchDetailsModal() {
    const modal = document.getElementById('batch-details-modal');
    if (modal) {
        modal.remove();
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

async function showPrintHistory() {
    // Loading print history...
    
    try {
        // Create and show modal
        const modal = createPrintHistoryModal();
        document.body.appendChild(modal);
        
        // Show loading state
        const historyContainer = modal.querySelector('#print-history-container');
        historyContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p>Loading print history...</p>
            </div>
        `;
        
        // Fetch print history from API
        const response = await fetch(`${API_BASE}/api/admin/print-history?limit=100`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            renderPrintHistory(result.data, historyContainer);
        } else {
            historyContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <h4>📋 No Print History</h4>
                    <p>No batches have been printed yet.</p>
                </div>
            `;
        }
        
    } catch (error) {
        // Error loading print history
        if (typeof showAlert === 'function') {
            showAlert('Failed to load print history', 'error');
        }
    }
}

function createPrintHistoryModal() {
    const modal = document.createElement('div');
    modal.id = 'print-history-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
        <div style="background: white; border-radius: 12px; padding: 0; width: 90%; max-width: 800px; max-height: 80vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 18px;">📈 Print History</h3>
                <button onclick="closePrintHistoryModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
            </div>
            <div id="print-history-container" style="max-height: calc(80vh - 80px); overflow-y: auto; padding: 20px;">
                <!-- History content will be loaded here -->
            </div>
        </div>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closePrintHistoryModal();
        }
    });
    
    return modal;
}

function renderPrintHistory(history, container) {
    const historyHTML = history.map(entry => `
        <div style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: white;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h5 style="margin: 0; color: #007bff;">Batch #${entry.batch_short_id}</h5>
                <span style="font-size: 12px; color: #666;">${new Date(entry.printed_date).toLocaleString()}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; font-size: 14px;">
                <div><strong>Format:</strong> ${entry.print_format.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                <div><strong>Tests:</strong> ${entry.test_count}</div>
                <div><strong>Printer:</strong> ${entry.printer_name || 'Default'}</div>
                <div><strong>Job ID:</strong> ${entry.print_job_id}</div>
                ${entry.printed_by ? `<div><strong>Printed by:</strong> ${entry.printed_by}</div>` : ''}
            </div>
            ${entry.notes ? `
                <div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 13px; color: #666;">
                    <strong>Notes:</strong> ${entry.notes}
                </div>
            ` : ''}
        </div>
    `).join('');
    
    container.innerHTML = `
        <div style="margin-bottom: 15px;">
            <h4 style="margin: 0; color: #333;">Recent Print Jobs (${history.length})</h4>
        </div>
        ${historyHTML}
    `;
}

function closePrintHistoryModal() {
    const modal = document.getElementById('print-history-modal');
    if (modal) {
        modal.remove();
    }
}

// CSV Download functionality
async function downloadBatchXLSX(batchId) {
    try {
        // Show loading alert
        if (typeof showAlert === 'function') {
            showAlert('📊 Generating XLSX file...', 'info');
        }
        
        // Fetch batch details from API
        const response = await fetch(`${API_BASE}/api/admin/batch-details/${batchId}`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to fetch batch details');
        }
        
        const batchData = result.data;
        
        // Generate XLSX content
        const xlsxBuffer = generateBatchXLSX(batchData);
        
        // Create and download XLSX file
        const blob = new Blob([xlsxBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with batch ID and current date
        const currentDate = new Date().toISOString().split('T')[0];
        const batchShortId = batchId.split('-').pop();
        a.download = `NAD_Batch_${batchShortId}_${currentDate}.xlsx`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Mark batch as fully printed after successful XLSX download
        await markBatchAsFullyPrinted(batchId, 'xlsx_export');
        
        if (typeof showAlert === 'function') {
            showAlert('✅ XLSX file downloaded and batch marked as fully printed!', 'success');
        }
        
    } catch (error) {
        if (typeof showAlert === 'function') {
            showAlert(`❌ Failed to download XLSX: ${error.message}`, 'error');
        }
    }
}

function generateBatchXLSX(batchData) {
    // Create worksheet data with headers
    const worksheetData = [
        ['Test ID'], // Header row
        ...batchData.test_ids.map(test => [test.test_id]) // Data rows
    ];
    
    // Create worksheet from array of arrays
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column width for better readability
    worksheet['!cols'] = [{ width: 20 }];
    
    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Test IDs");
    
    // Generate XLSX buffer
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

async function markBatchAsFullyPrinted(batchId, exportFormat = 'xlsx_export') {
    try {
        // Use the existing print-batch endpoint to mark the batch as printed
        const response = await fetch(`${API_BASE}/api/admin/print-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                batch_id: batchId,
                print_format: exportFormat,
                printer_name: 'XLSX Export',
                notes: 'Batch exported to XLSX file'
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to mark batch as printed');
        }
        
        // Refresh the batch display to show updated status
        if (typeof loadPrintableBatches === 'function') {
            loadPrintableBatches();
        }
        
    } catch (error) {
        console.error('Failed to mark batch as fully printed:', error);
        if (typeof showAlert === 'function') {
            showAlert(`⚠️ XLSX downloaded but failed to update batch status: ${error.message}`, 'warning');
        }
    }
}

// Download batch data as CSV
function downloadBatchCSV(batchId) {
    if (!batchId) {
        if (typeof showAlert === 'function') {
            showAlert('❌ No batch ID provided for CSV download', 'error');
        }
        return;
    }
    
    // Find the batch data
    const batch = window.currentBatches?.find(b => b.id === batchId);
    if (!batch) {
        if (typeof showAlert === 'function') {
            showAlert('❌ Batch not found for CSV download', 'error');
        }
        return;
    }
    
    try {
        // Create CSV content
        const csvHeaders = ['Test ID', 'Customer ID', 'Activated Date', 'Status'];
        const csvRows = [csvHeaders.join(',')];
        
        if (batch.tests && batch.tests.length > 0) {
            batch.tests.forEach(test => {
                const row = [
                    `"${test.test_id || ''}"`,
                    `"${test.customer_id || ''}"`,
                    `"${test.activated_date ? new Date(test.activated_date).toLocaleDateString() : ''}"`,
                    `"${test.status || 'activated'}"`
                ];
                csvRows.push(row.join(','));
            });
        }
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `batch-${batchId}-tests.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showAlert === 'function') {
            showAlert('✅ CSV file downloaded successfully', 'success');
        }
        
    } catch (error) {
        console.error('Failed to download CSV:', error);
        if (typeof showAlert === 'function') {
            showAlert(`❌ Failed to download CSV: ${error.message}`, 'error');
        }
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
window.closePrintHistoryModal = closePrintHistoryModal;
window.closeBatchDetailsModal = closeBatchDetailsModal;
window.initBatchPrinting = initBatchPrinting;
window.downloadBatchCSV = downloadBatchCSV;

// Batch Printing functionality loaded

// Auto-initialize if we're on the batch printing section
if (document.getElementById('batch-printing')) {
    initBatchPrinting();
}
