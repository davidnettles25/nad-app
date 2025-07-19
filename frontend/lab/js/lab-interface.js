// Main lab controller - Version 20250719-1
console.log('🔄 Loading NAD Lab Interface JS - Version 20250719-1');

window.NADLab = {
    init() {
        console.log('Initializing NAD Lab Interface');
        
        // Diagnostic: Check what containers exist in the DOM
        console.log('DOM Container Check:');
        console.log('- header-container:', !!document.getElementById('header-container'));
        console.log('- queue-container:', !!document.getElementById('queue-container'));
        console.log('- recent-container:', !!document.getElementById('recent-container'));
        console.log('- modal-container:', !!document.getElementById('modal-container'));
        
        // Also check the HTML structure
        const labContainer = document.querySelector('.lab-container');
        if (labContainer) {
            console.log('Lab container children:', labContainer.children.length);
            for (let i = 0; i < labContainer.children.length; i++) {
                console.log(`  Child ${i}:`, labContainer.children[i].id || labContainer.children[i].className);
            }
        }
        
        // Ensure modal container exists BEFORE loading components
        this.ensureModalContainer();
        
        this.loadComponents();
        this.loadStats();
        this.setupEventListeners();
    },

    ensureModalContainer() {
        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            console.warn('Modal container not found in HTML, creating it...');
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.querySelector('.lab-container').appendChild(modalContainer);
            console.log('Modal container created and added to DOM');
        } else {
            console.log('Modal container found in DOM');
        }
    },
    
    async loadComponents() {
        try {
            // Load header
            await this.loadComponent('header', '#header-container');
            
            // Load test queue
            await this.loadComponent('test-queue', '#queue-container');
            
            // Load recent tests
            await this.loadComponent('recent-tests', '#recent-container');
            
            // Load process modal (container should exist from ensureModalContainer)
            console.log('Loading process modal...');
            await this.loadComponent('process-test-modal', '#modal-container');
            console.log('Process modal loaded');
            
            // Load pending tests once all components are loaded
            setTimeout(() => {
                this.loadPendingTests();
                this.loadRecentTests();
                this.setupModalEventListeners();
            }, 500);
            
        } catch (error) {
            console.error('Error loading components:', error);
            this.showError('Failed to load lab interface components');
        }
    },
    
    async loadComponent(componentName, targetSelector) {
        try {
            console.log(`Loading component: ${componentName} into ${targetSelector}`);
            const response = await fetch(`lab/components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentName}`);
            }
            
            const html = await response.text();
            console.log(`Component HTML length: ${html.length}`);
            
            const target = document.querySelector(targetSelector);
            console.log(`Target element found: ${!!target}`);
            
            if (target) {
                target.innerHTML = html;
                console.log(`Component ${componentName} inserted into DOM`);
                
                // Special handling for modal component
                if (componentName === 'process-test-modal') {
                    setTimeout(() => {
                        const modal = document.getElementById('process-test-modal');
                        console.log(`Modal element check after insert: ${!!modal}`);
                    }, 100);
                }
            } else {
                console.error(`Target selector ${targetSelector} not found!`);
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

    async loadRecentTests() {
        try {
            const response = await fetch('/api/lab/recent-tests');
            const data = await response.json();
            
            if (data.success) {
                this.renderRecentTests(data.tests);
            } else {
                console.error('Failed to load recent tests:', data.message);
                const container = document.getElementById('recent-tests-list');
                if (container) {
                    container.innerHTML = '<p class="error-message">Failed to load recent tests</p>';
                }
            }
        } catch (error) {
            console.error('Error loading recent tests:', error);
            const container = document.getElementById('recent-tests-list');
            if (container) {
                container.innerHTML = '<p class="error-message">Error loading recent tests</p>';
            }
        }
    },

    renderRecentTests(tests) {
        const container = document.getElementById('recent-tests-list');
        if (!container) return;
        
        if (tests.length === 0) {
            container.innerHTML = '<p class="no-tests">No recent tests</p>';
            return;
        }
        
        const testsHtml = tests.map(test => {
            const batchShort = test.batch_id ? test.batch_id.split('-').pop() : 'N/A';
            
            return `
                <div class="test-item recent-test-item">
                    <div class="test-info">
                        <h3>${test.test_id}</h3>
                        <p>Batch: ${batchShort}</p>
                        <p>NAD+ Score: <strong>${test.nad_score || 'N/A'}</strong></p>
                        <p>Processed: ${new Date(test.processed_date).toLocaleDateString()}</p>
                        <p>Technician: ${test.technician_id || 'N/A'}</p>
                    </div>
                    <div class="test-status">
                        <span class="status-badge status-completed">✅ Completed</span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = testsHtml;
    },
    
    openProcessModal(testId) {
        console.log('Opening process modal for test:', testId);
        
        // First check if modal container exists
        const modalContainer = document.getElementById('modal-container');
        console.log('Modal container found:', !!modalContainer);
        if (modalContainer) {
            console.log('Modal container HTML:', modalContainer.innerHTML.substring(0, 100) + '...');
        }
        
        // Find the test data
        const testData = this.currentTests.find(test => test.test_id === testId);
        if (!testData) {
            alert('Test data not found. Please refresh and try again.');
            return;
        }
        
        // Store current test data
        this.currentProcessingTest = testData;
        
        // Get technician email from multipass or localStorage
        const technicianEmail = this.getTechnicianEmail();
        
        // Get modal elements
        const modalTestId = document.getElementById('modal-test-id');
        const modalBatchId = document.getElementById('modal-batch-id');
        const modalActivatedDate = document.getElementById('modal-activated-date');
        const technicianEmailField = document.getElementById('technician-email');
        const processForm = document.getElementById('process-test-form');
        const errorMessage = document.getElementById('modal-error-message');
        const modal = document.getElementById('process-test-modal');
        
        console.log('Modal elements found:', {
            modalTestId: !!modalTestId,
            modalBatchId: !!modalBatchId,
            modalActivatedDate: !!modalActivatedDate,
            technicianEmailField: !!technicianEmailField,
            processForm: !!processForm,
            modal: !!modal
        });
        
        if (!modal) {
            console.error('Modal not found! Attempting to reload modal component...');
            // Try to reload the modal component
            this.loadComponent('process-test-modal', '#modal-container').then(() => {
                setTimeout(() => {
                    const reloadedModal = document.getElementById('process-test-modal');
                    if (reloadedModal) {
                        console.log('Modal reloaded successfully');
                        this.openProcessModal(testId); // Retry
                    } else {
                        alert('Failed to load modal component. Please refresh the page.');
                    }
                }, 500);
            });
            return;
        }
        
        // Populate modal with test information
        if (modalTestId) modalTestId.textContent = testData.test_id;
        if (modalBatchId) modalBatchId.textContent = testData.batch_id ? 
            testData.batch_id.split('-').pop() : 'N/A';
        if (modalActivatedDate) modalActivatedDate.textContent = 
            new Date(testData.activated_date).toLocaleDateString();
        if (technicianEmailField) technicianEmailField.value = technicianEmail;
        
        // Reset form
        if (processForm) processForm.reset();
        if (errorMessage) errorMessage.style.display = 'none';
        
        // Re-populate technician email after form reset
        if (technicianEmailField) technicianEmailField.value = technicianEmail;
        
        // Show modal
        modal.style.display = 'block';
    },

    getTechnicianEmail() {
        console.log('Getting technician email...');
        
        // Try to get from multipass data first
        if (window.shopifyMultipass && window.shopifyMultipass.email) {
            console.log('Found email in multipass:', window.shopifyMultipass.email);
            return window.shopifyMultipass.email;
        }
        
        // Fallback to localStorage or URL params
        const urlParams = new URLSearchParams(window.location.search);
        const emailFromUrl = urlParams.get('email');
        if (emailFromUrl) {
            console.log('Found email in URL:', emailFromUrl);
            return emailFromUrl;
        }
        
        // Check localStorage for stored user data
        const storedUser = localStorage.getItem('nad_user_data');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData.email) {
                    console.log('Found email in localStorage:', userData.email);
                    return userData.email;
                }
            } catch (e) {
                console.warn('Failed to parse stored user data');
            }
        }
        
        // Default fallback
        console.log('Using default email fallback');
        return 'lab-tech@example.com';
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
                await this.loadRecentTests(); // Refresh recent tests
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
            this.loadRecentTests();
        }, 60000);
    },
    
    setupModalEventListeners() {
        console.log('Setting up modal event listeners...');
        
        const form = document.getElementById('process-test-form');
        if (form) {
            console.log('Modal form found, adding event listener');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProcessFormSubmit();
            });
        } else {
            console.error('Modal form not found!');
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('process-test-modal');
            if (e.target === modal) {
                this.closeProcessModal();
            }
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
        
        // Ensure technician email is included
        const technicianEmail = formData.get('technicianEmail') || this.getTechnicianEmail();
        if (technicianEmail && technicianEmail !== 'lab-tech@example.com') {
            formData.set('technicianEmail', technicianEmail);
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