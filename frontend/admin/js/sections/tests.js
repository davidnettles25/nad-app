// Enhanced Test Management with Bulk Creation
class TestManagement {
    constructor() {
        this.tests = [];
        this.batches = [];
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        console.log('🚀 Initializing TestManagement...');
        await this.waitForElements();
        this.setupEventListeners();
        this.startTestIdPreview();
        await this.loadInitialData();
        this.initialized = true;
        console.log('✅ TestManagement ready');
    }

    async waitForElements() {
        let attempts = 0;
        while (attempts < 20) {
            const form = document.getElementById('bulk-creation-form');
            const button = document.getElementById('create-test-btn');
            const testsSection = document.getElementById('tests');
            
            if (form && button && testsSection && testsSection.classList.contains('active')) {
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 250));
            attempts++;
        }
    }

    setupEventListeners() {
        const form = document.getElementById('bulk-creation-form');
        if (!form) return;
        
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        const finalForm = document.getElementById('bulk-creation-form');
        finalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleBulkCreation(e);
        });
    }

    async handleBulkCreation(e) {
        try {
            const quantity = parseInt(document.getElementById('test-quantity').value);
            const notes = document.getElementById('batch-notes').value || '';
            
            if (quantity < 1 || quantity > 1000) {
                alert('Quantity must be between 1 and 1000');
                return;
            }

            this.setLoading(true);

            const response = await fetch('/api/admin/create-test-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity, notes })
            });

            const result = await response.json();

            if (result.success) {
                const totalCreated = result.data.quantity;
                const samplesShown = result.data.sample_test_ids.length;
                
                let message = `✅ SUCCESS! Created ${totalCreated} tests\n\nBatch ID: ${result.data.batch_id}\n\n`;
                
                if (totalCreated <= 5) {
                    message += `All Test IDs:\n${result.data.sample_test_ids.join('\n')}`;
                } else {
                    message += `Sample Test IDs (showing first ${samplesShown} of ${totalCreated} total):\n`;
                    message += `${result.data.sample_test_ids.join('\n')}\n\n`;
                    message += `✨ ${totalCreated - samplesShown} additional tests were also created in this batch\n\n`;
                    message += `All ${totalCreated} tests are ready for shipping and use!`;
                }
                
                alert(message);
                
                document.getElementById('bulk-creation-form').reset();
                document.getElementById('test-quantity').value = 10;
                
                await this.loadInitialData();
            } else {
                alert('Error: ' + result.message);
            }

        } catch (error) {
            console.error('Error creating test batch:', error);
            alert('Network error: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }

    startTestIdPreview() {
        this.updateTestIdPreview();
        this.previewInterval = setInterval(() => this.updateTestIdPreview(), 3000);
    }

    updateTestIdPreview() {
        const previewElement = document.getElementById('test-id-preview');
        if (!previewElement) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const randomId = Math.floor(Math.random() * 1000) + 100;
        const randomSuffix = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
        
        previewElement.textContent = `${year}-${month}-${randomId}-${randomSuffix}`;
    }

    async loadInitialData() {
        try {
            const [testsResponse, batchesResponse] = await Promise.all([
                fetch('/api/tests'),
                fetch('/api/admin/test-batches')
            ]);
            
            if (testsResponse.ok) {
                const testsResult = await testsResponse.json();
                if (testsResult.success) {
                    this.tests = testsResult.data;
                }
            }
            
            if (batchesResponse.ok) {
                const batchesResult = await batchesResponse.json();
                if (batchesResult.success) {
                    this.batches = batchesResult.data;
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    setLoading(loading) {
        const button = document.getElementById('create-test-btn');
        
        if (loading) {
            if (button) {
                button.disabled = true;
                button.textContent = '⏳ Creating...';
            }
        } else {
            if (button) {
                button.disabled = false;
                button.textContent = '📦 Create Tests';
            }
        }
    }
}

// Global initialization
let testManager;

function initTestManagement() {
    if (!testManager) {
        testManager = new TestManagement();
    }
    testManager.init();
}

// Make available globally
window.initTestManagement = initTestManagement;
window.testManager = testManager;
