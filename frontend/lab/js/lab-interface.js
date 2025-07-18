// Main lab controller
window.NADLab = {
    init() {
        console.log('Initializing NAD Lab Interface');
        this.loadComponents();
        this.loadStats();
        this.setupEventListeners();
    },
    
    async loadComponents() {
        try {
            // Load header
            await this.loadComponent('header', '#header-container');
            
            // Load test queue
            await this.loadComponent('test-queue', '#queue-container');
            
            // Load recent tests
            await this.loadComponent('recent-tests', '#recent-container');
            
            // Load process modal
            await this.loadComponent('process-test-modal', '#modal-container');
            
            // Load pending tests once all components are loaded
            setTimeout(() => {
                this.loadPendingTests();
            }, 500);
            
        } catch (error) {
            console.error('Error loading components:', error);
            this.showError('Failed to load lab interface components');
        }
    },
    
    async loadComponent(componentName, targetSelector) {
        try {
            const response = await fetch(`lab/components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentName}`);
            }
            
            const html = await response.text();
            const target = document.querySelector(targetSelector);
            if (target) {
                target.innerHTML = html;
            }
        } catch (error) {
            console.error(`Error loading ${componentName}:`, error);
            // Create basic fallback content
            const target = document.querySelector(targetSelector);
            if (target) {
                target.innerHTML = `<div class="error-message">Failed to load ${componentName}</div>`;
            }
        }
    },
    
    async loadStats() {
        try {
            const response = await fetch('/api/lab/stats');
            const data = await response.json();
            
            if (data.success) {
                this.updateStats(data.stats);
            } else {
                console.error('Failed to load stats:', data.message);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },
    
    updateStats(stats) {
        const pendingElement = document.getElementById('pending-count');
        const completedTodayElement = document.getElementById('completed-today');
        const totalProcessedElement = document.getElementById('total-processed');
        
        if (pendingElement) pendingElement.textContent = stats.pending || 0;
        if (completedTodayElement) completedTodayElement.textContent = stats.completed_today || 0;
        if (totalProcessedElement) totalProcessedElement.textContent = stats.total_processed || 0;
    },
    
    async loadPendingTests() {
        try {
            const response = await fetch('/api/lab/pending-tests');
            const data = await response.json();
            
            if (data.success) {
                this.renderPendingTests(data.tests);
            } else {
                console.error('Failed to load pending tests:', data.message);
            }
        } catch (error) {
            console.error('Error loading pending tests:', error);
        }
    },
    
    renderPendingTests(tests) {
        const container = document.getElementById('pending-tests-list');
        if (!container) return;
        
        // Store tests data for modal access
        this.currentTests = tests;
        
        if (tests.length === 0) {
            container.innerHTML = '<p class="no-tests">No pending tests</p>';
            return;
        }
        
        const testsHtml = tests.map(test => {
            // Extract just the random string part from batch_id (e.g., "pd36p7" from "BATCH-1752630044576-pd36p7")
            const batchShort = test.batch_id ? test.batch_id.split('-').pop() : 'N/A';
            
            return `
                <div class="test-item" data-test-id="${test.id}">
                    <div class="test-info">
                        <h3>${test.test_id}</h3>
                        <p>Batch: ${batchShort}</p>
                        <p>Activated: ${new Date(test.activated_date).toLocaleDateString()}</p>
                    </div>
                    <div class="test-actions">
                        <button class="btn btn-primary" onclick="NADLab.openProcessModal('${test.test_id}')">
                            Process Test
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = testsHtml;
    },
    
    openProcessModal(testId) {
        // Find the test data
        const testData = this.currentTests.find(test => test.test_id === testId);
        if (!testData) {
            alert('Test data not found. Please refresh and try again.');
            return;
        }
        
        // Store current test data
        this.currentProcessingTest = testData;
        
        // Populate modal with test information
        document.getElementById('modal-test-id').textContent = testData.test_id;
        document.getElementById('modal-batch-id').textContent = testData.batch_id ? 
            testData.batch_id.split('-').pop() : 'N/A';
        document.getElementById('modal-activated-date').textContent = 
            new Date(testData.activated_date).toLocaleDateString();
        
        // Reset form
        document.getElementById('process-test-form').reset();
        document.getElementById('modal-error-message').style.display = 'none';
        
        // Show modal
        document.getElementById('process-test-modal').style.display = 'block';
    },
    
    closeProcessModal() {
        document.getElementById('process-test-modal').style.display = 'none';
        this.currentProcessingTest = null;
    },
    
    async processTest(formData) {
        try {
            const response = await fetch(`/api/lab/process-test/${this.currentProcessingTest.test_id}`, {
                method: 'POST',
                body: formData  // Send as FormData for file upload support
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.closeProcessModal();
                await this.loadPendingTests(); // Refresh the list
                await this.loadStats(); // Refresh stats
                
                // Show success message
                this.showSuccessMessage('Test processed successfully!');
            } else {
                throw new Error(data.message || 'Processing failed');
            }
        } catch (error) {
            console.error('Error processing test:', error);
            this.showModalError(error.message || 'Error processing test. Please try again.');
        }
    },
    
    setupEventListeners() {
        // Auto-refresh stats every 30 seconds
        setInterval(() => {
            this.loadStats();
        }, 30000);
        
        // Auto-refresh pending tests every 60 seconds
        setInterval(() => {
            this.loadPendingTests();
        }, 60000);
        
        // Modal form submission handler
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                const form = document.getElementById('process-test-form');
                if (form) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.handleProcessFormSubmit();
                    });
                }
                
                // Close modal when clicking outside
                window.addEventListener('click', (e) => {
                    const modal = document.getElementById('process-test-modal');
                    if (e.target === modal) {
                        this.closeProcessModal();
                    }
                });
            }, 1000);
        });
    },
    
    handleProcessFormSubmit() {
        const form = document.getElementById('process-test-form');
        const formData = new FormData(form);
        
        // Validate required fields
        const nadScore = formData.get('nadScore');
        if (!nadScore || nadScore < 0 || nadScore > 100) {
            this.showModalError('Please enter a valid NAD+ score between 0 and 100.');
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('submit-process-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
        
        // Process the test
        this.processTest(formData).finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    },
    
    showModalError(message) {
        const errorDiv = document.getElementById('modal-error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    },
    
    showSuccessMessage(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            border-radius: 6px;
            padding: 15px;
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    },
    
    showError(message) {
        const container = document.querySelector('.lab-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()">Reload Page</button>
                </div>
            `;
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.NADLab.init();
});