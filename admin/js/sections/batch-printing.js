/**
 * Batch Printing Manager
 * Handles batch selection, print options, and print job processing
 */

console.log('🖨️ Loading Batch Printing Module...');

class BatchPrintingManager {
    constructor() {
        this.selectedBatch = null;
        this.printableBatches = [];
        this.batchCardTemplate = null;
        this.isInitialized = false;
        
        this.printableFormats = {
            'individual_labels': 'Individual Test ID Labels',
            'batch_summary': 'Batch Summary Sheet',
            'shipping_list': 'Shipping Checklist'
        };
    }
    
    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing Batch Printing Manager...');
        
        try {
            // Load batch card template
            await this.loadBatchCardTemplate();
            
            // Load printable batches
            await this.loadPrintableBatches();
            
            this.isInitialized = true;
            console.log('✅ Batch Printing Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Batch Printing Manager:', error);
        }
    }
    
    async loadBatchCardTemplate() {
        try {
            const response = await fetch('admin/components/batch-card.html');
            if (response.ok) {
                this.batchCardTemplate = await response.text();
                console.log('✅ Batch card template loaded');
            } else {
                throw new Error('Failed to load batch card template');
            }
        } catch (error) {
            console.warn('⚠️ Could not load batch card template, using fallback');
            this.batchCardTemplate = this.getFallbackCardTemplate();
        }
    }
    
    getFallbackCardTemplate() {
        return `
            <div class="batch-card {print_status}" data-batch-id="{batch_id}">
                <div class="batch-header">
                    <h5>Batch #{batch_short_id}</h5>
                    <div class="batch-status">
                        <span class="print-status print-status-{print_status}">{print_status_text}</span>
                    </div>
                </div>
                <div class="batch-details">
                    <div class="detail-row">
                        <span class="label">Tests:</span>
                        <span class="value">{total_tests}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Created:</span>
                        <span class="value">{created_date}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Last Printed:</span>
                        <span class="value">{last_printed}</span>
                    </div>
                    {progress_bar}
                </div>
                <div class="batch-actions">
                    <button class="btn btn-sm primary" onclick="batchPrintingManager.selectBatchForPrint('{batch_id}')">
                        🖨️ {print_button_text}
                    </button>
                    <button class="btn btn-sm secondary" onclick="batchPrintingManager.viewBatchDetails('{batch_id}')">
                        👁️ Details
                    </button>
                </div>
            </div>
        `;
    }
    
    async loadPrintableBatches() {
        console.log('🔄 Loading printable batches...');
        
        const container = document.getElementById('printable-batches');
        if (!container) {
            console.warn('⚠️ Printable batches container not found');
            return;
        }
        
        try {
            // Show loading state
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading printable batches...</p>
                </div>
            `;
            
            const response = await fetch(`${API_BASE}/api/admin/printable-batches`);
            const result = await response.json();
            
            if (result.success) {
                this.printableBatches = result.data;
                this.renderBatchCards();
                console.log(`✅ Loaded ${this.printableBatches.length} printable batches`);
            } else {
                throw new Error(result.message || 'Failed to load batches');
            }
            
        } catch (error) {
            console.error('❌ Error loading printable batches:', error);
            this.showBatchesError(error.message);
        }
    }
    
    renderBatchCards() {
        const container = document.getElementById('printable-batches');
        if (!container) return;
        
        if (this.printableBatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h4>📦 No Printable Batches</h4>
                    <p>Create test batches first to enable printing functionality.</p>
                    <button class="btn primary" onclick="showSection('tests')">📦 Create Batches</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.printableBatches.map(batch => this.createBatchCard(batch)).join('');
    }
    
    createBatchCard(batch) {
        if (!this.batchCardTemplate) {
            return this.createFallbackCard(batch);
        }
        
        const batchShortId = batch.batch_id.split('-').pop();
        const printStatusText = this.getPrintStatusText(batch.print_status);
        const lastPrinted = batch.last_printed_date 
            ? new Date(batch.last_printed_date).toLocaleDateString()
            : 'Never';
        
        const progressBar = batch.print_status === 'partially_printed' ? `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${batch.print_percentage}%"></div>
            </div>
            <small>Progress: ${batch.print_percentage}% (${batch.printed_tests}/${batch.total_tests})</small>
        ` : '';
        
        const printButtonText = batch.print_status === 'not_printed' ? 'Print' : 'Reprint';
        
        return this.batchCardTemplate
            .replace(/{batch_id}/g, batch.batch_id)
            .replace(/{batch_short_id}/g, batchShortId)
            .replace(/{print_status}/g, batch.print_status)
            .replace(/{print_status_text}/g, printStatusText)
            .replace(/{total_tests}/g, batch.total_tests)
            .replace(/{created_date}/g, new Date(batch.created_date).toLocaleDateString())
            .replace(/{last_printed}/g, lastPrinted)
            .replace(/{progress_bar}/g, progressBar)
            .replace(/{print_button_text}/g, printButtonText);
    }
    
    createFallbackCard(batch) {
        const batchShortId = batch.batch_id.split('-').pop();
        const printStatusText = this.getPrintStatusText(batch.print_status);
        
        return `
            <div class="batch-card ${batch.print_status}" data-batch-id="${batch.batch_id}">
                <div class="batch-header">
                    <h5>Batch #${batchShortId}</h5>
                    <span class="print-status print-status-${batch.print_status}">${printStatusText}</span>
                </div>
                <div class="batch-details">
                    <div>Tests: ${batch.total_tests}</div>
                    <div>Created: ${new Date(batch.created_date).toLocaleDateString()}</div>
                </div>
                <div class="batch-actions">
                    <button class="btn btn-sm primary" onclick="batchPrintingManager.selectBatchForPrint('${batch.batch_id}')">
                        🖨️ Print
                    </button>
                </div>
            </div>
        `;
    }
    
    getPrintStatusText(status) {
        switch (status) {
            case 'not_printed': return '🔴 Not Printed';
            case 'partially_printed': return '🟡 Partial';
            case 'fully_printed': return '🟢 Printed';
            default: return '❓ Unknown';
        }
    }
    
    showBatchesError(message) {
        const container = document.getElementById('printable-batches');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <h4>⚠️ Error Loading Batches</h4>
                    <p>${message}</p>
                    <button class="btn primary" onclick="batchPrintingManager.loadPrintableBatches()">🔄 Try Again</button>
                </div>
            `;
        }
    }
    
    selectBatchForPrint(batchId) {
        console.log(`🎯 Selected batch for printing: ${batchId}`);
        
        this.selectedBatch = batchId;
        const batch = this.printableBatches.find(b => b.batch_id === batchId);
        
        if (!batch) {
            if (typeof showAlert === 'function') {
                showAlert('Batch not found', 'error');
            }
            return;
        }
        
        // Highlight selected batch
        document.querySelectorAll('.batch-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-batch-id="${batchId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        // Update selected batch info
        this.updateSelectedBatchInfo(batch);
        
        // Show print options panel
        const printOptions = document.getElementById('print-options');
        if (printOptions) {
            printOptions.style.display = 'block';
            
            // Scroll to print options
            printOptions.scrollIntoView({ behavior: 'smooth' });
        }
        
        if (typeof showAlert === 'function') {
            showAlert(`Selected batch ${batchId.split('-').pop()} for printing`, 'info');
        }
    }
    
    updateSelectedBatchInfo(batch) {
        const batchInfo = document.getElementById('selected-batch-info');
        if (!batchInfo) return;
        
        batchInfo.innerHTML = `
            <h5>Selected: Batch #${batch.batch_id.split('-').pop()}</h5>
            <div class="detail-row">
                <span class="label">Tests to print:</span>
                <span class="value">${batch.total_tests}</span>
            </div>
            <div class="detail-row">
                <span class="label">Current status:</span>
                <span class="value">${this.getPrintStatusText(batch.print_status)}</span>
            </div>
            ${batch.print_status !== 'not_printed' ? `
                <div class="detail-row">
                    <span class="label">Last printed:</span>
                    <span class="value">${new Date(batch.last_printed_date).toLocaleDateString()}</span>
                </div>
            ` : ''}
        `;
    }
    
    async printSelectedBatch() {
        if (!this.selectedBatch) {
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
                    batch_id: this.selectedBatch,
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
                
                // Process print data
                this.processPrintJob(result.data);
                
                // Refresh batches to show updated status
                await this.loadPrintableBatches();
                
                // Hide print options
                this.cancelPrintSelection();
                
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
    
    processPrintJob(printData) {
        console.log('🖨️ Processing print job:', printData);
        
        // Open print window based on format
        switch (printData.print_format) {
            case 'individual_labels':
                this.printIndividualLabels(printData.print_data);
                break;
            case 'batch_summary':
                this.printBatchSummary(printData.print_data);
                break;
            case 'shipping_list':
                this.printShippingList(printData.print_data);
                break;
            default:
                console.warn('Unknown print format:', printData.print_format);
        }
    }
    
    printIndividualLabels(data) {
        console.log('🏷️ Printing individual labels...');
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        const labelsHtml = data.labels.map(label => `
            <div class="label">
                <div class="test-id">${label.test_id}</div>
                <div class="batch">Batch: ${label.batch_short_id}</div>
                <div class="print-date">${new Date(label.print_date).toLocaleDateString()}</div>
            </div>
        `).join('');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Test ID Labels - Batch ${data.labels[0]?.batch_short_id}</title>
                <style>
                    @media print {
                        body { margin: 0; font-family: Arial, sans-serif; }
                        .label { 
                            width: 2.25in; 
                            height: 1.25in; 
                            border: 1px solid #000;
                            padding: 5px;
                            display: inline-block;
                            margin: 2px;
                            font-size: 10pt;
                            page-break-inside: avoid;
                            box-sizing: border-box;
                        }
                        .test-id { 
                            font-weight: bold; 
                            font-size: 12pt; 
                            margin-bottom: 5px;
                        }
                        .batch { 
                            font-size: 8pt; 
                            color: #666;
                        }
                        .print-date {
                            font-size: 7pt;
                            color: #999;
                            margin-top: 5px;
                        }
                    }
                    @media screen {
                        body { padding: 20px; }
                        .label { 
                            border: 1px solid #ccc;
                            padding: 10px;
                            margin: 5px;
                            display: inline-block;
                            width: 200px;
                            height: 100px;
                        }
                    }
                </style>
            </head>
            <body>
                <h3 style="text-align: center; margin-bottom: 20px;">
                    Test ID Labels - Batch ${data.labels[0]?.batch_short_id}
                </h3>
                ${labelsHtml}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }
    
    printBatchSummary(data) {
        console.log('📊 Printing batch summary...');
        // Implementation for batch summary printing
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${data.summary_title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .test-list { columns: 3; column-gap: 20px; }
                    .test-id { margin-bottom: 5px; font-family: monospace; }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${data.summary_title}</h2>
                    <p>Total Tests: ${data.test_count} | Generated: ${new Date(data.created_date).toLocaleString()}</p>
                </div>
                <div class="test-list">
                    ${data.test_ids.map(id => `<div class="test-id">${id}</div>`).join('')}
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    printShippingList(data) {
        console.log('📦 Printing shipping list...');
        // Implementation for shipping checklist printing
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        const checklistHtml = data.items.map(item => `
            <div class="checklist-item">
                <input type="checkbox" id="${item.test_id}">
                <label for="${item.test_id}">${item.test_id}</label>
                <div class="notes-space">_________________</div>
            </div>
        `).join('');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${data.checklist_title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { margin-bottom: 30px; }
                    .checklist-item { 
                        display: flex; 
                        align-items: center; 
                        margin-bottom: 10px; 
                        padding: 5px;
                    }
                    .checklist-item input { margin-right: 10px; }
                    .checklist-item label { 
                        font-family: monospace; 
                        min-width: 150px;
                    }
                    .notes-space { 
                        margin-left: 20px; 
                        color: #ccc;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${data.checklist_title}</h2>
                    <p>Total Items: ${data.total_items} | Date: ${new Date().toLocaleDateString()}</p>
                    <p><strong>Instructions:</strong> Check each item as it's packed and note any issues.</p>
                </div>
                <div class="checklist">
                    ${checklistHtml}
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    previewPrint() {
        console.log('👁️ Print preview requested');
        if (typeof showAlert === 'function') {
            showAlert('Print preview will open the print dialog first for review', 'info');
        }
    }
    
    cancelPrintSelection() {
        console.log('❌ Cancelling print selection');
        
        this.selectedBatch = null;
        
        // Remove selection highlight
        document.querySelectorAll('.batch-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Hide print options
        const printOptions = document.getElementById('print-options');
        if (printOptions) {
            printOptions.style.display = 'none';
        }
        
        if (typeof showAlert === 'function') {
            showAlert('Print selection cancelled', 'info');
        }
    }
    
    viewBatchDetails(batchId) {
        console.log(`👁️ Viewing details for batch: ${batchId}`);
        // Implementation for viewing batch details
        if (typeof showAlert === 'function') {
            showAlert(`Viewing details for batch ${batchId.split('-').pop()}`, 'info');
        }
    }
    
    showPrintHistory() {
        console.log('📈 Showing print history');
        if (typeof showAlert === 'function') {
            showAlert('Print history feature coming soon', 'info');
        }
    }
}

// Create global instance
const batchPrintingManager = new BatchPrintingManager();

// Global functions for onclick handlers
window.batchPrintingManager = batchPrintingManager;
window.refreshPrintableBatches = () => batchPrintingManager.loadPrintableBatches();
window.printSelectedBatch = () => batchPrintingManager.printSelectedBatch();
window.previewPrint = () => batchPrintingManager.previewPrint();
window.cancelPrintSelection = () => batchPrintingManager.cancelPrintSelection();
window.showPrintHistory = () => batchPrintingManager.showPrintHistory();

console.log('✅ Batch Printing Module loaded');
