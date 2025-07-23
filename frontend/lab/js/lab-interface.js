// Main lab controller - Version 20250719-1

window.NADLab = {
    init() {
        // Initialize NAD Lab Interface
        
        // Check DOM containers exist
        const labContainer = document.querySelector('.lab-container');
        
        // Ensure modal container exists BEFORE loading components
        this.ensureModalContainer();
        
        this.loadComponents();
        this.loadStats();
        this.setupEventListeners();
    },

    ensureModalContainer() {
        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            // Create modal container if missing
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.querySelector('.lab-container').appendChild(modalContainer);
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
            
            // Load process modal
            await this.loadComponent('process-test-modal', '#modal-container');
            
            // Load edit modal
            await this.loadComponent('edit-test-modal', '#modal-container');
            
            // Load pending tests once all components are loaded
            setTimeout(() => {
                this.loadPendingTests();
                this.loadRecentTests();
                this.setupModalEventListeners();
            }, 500);
            
        } catch (error) {
            this.showError('Failed to load lab interface components');
        }
    },
    
    async loadComponent(componentName, targetSelector) {
        try {
            // Load component HTML
            const response = await fetch(`lab/components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentName}`);
            }
            
            const html = await response.text();
            const target = document.querySelector(targetSelector);
            
            if (target) {
                // For modal container, append instead of replace to allow multiple modals
                if (targetSelector === '#modal-container') {
                    target.insertAdjacentHTML('beforeend', html);
                } else {
                    target.innerHTML = html;
                }
            }
        } catch (error) {
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
            }
        } catch (error) {
            // Stats loading failed
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
            }
        } catch (error) {
            // Pending tests loading failed
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
                        <h3>${test.test_id} ${test.customer_id ? `(${test.customer_id})` : ''}</h3>
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
                const container = document.getElementById('recent-tests-list');
                if (container) {
                    container.innerHTML = '<p class="error-message">Failed to load recent tests</p>';
                }
            }
        } catch (error) {
            const container = document.getElementById('recent-tests-list');
            if (container) {
                container.innerHTML = '<p class="error-message">Error loading recent tests</p>';
            }
        }
    },

    renderRecentTests(tests) {
        const container = document.getElementById('recent-tests-list');
        if (!container) return;
        
        // Store recent tests for edit functionality
        this.recentTests = tests;
        
        if (tests.length === 0) {
            container.innerHTML = '<p class="no-tests">No recent tests</p>';
            return;
        }
        
        const testsHtml = tests.map(test => {
            const batchShort = test.batch_id ? test.batch_id.split('-').pop() : 'N/A';
            
            return `
                <div class="test-item recent-test-item">
                    <div class="test-info">
                        <h3>${test.test_id} ${test.customer_id ? `(${test.customer_id})` : ''}</h3>
                        <p>Batch: ${batchShort}</p>
                        <p>NAD+ Score: <strong>${test.nad_score || 'N/A'}</strong></p>
                        <p>Processed: ${new Date(test.processed_date).toLocaleDateString()}</p>
                        <p>Technician: ${test.technician_id || 'N/A'}</p>
                    </div>
                    <div class="test-actions">
                        <span class="status-badge status-completed">✅ Completed</span>
                        <button class="btn btn-secondary btn-sm" onclick="NADLab.openEditModal('${test.test_id}')">
                            ✏️ Edit
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = testsHtml;
    },
    
    openProcessModal(testId) {
        // Open process modal for test
        const modalContainer = document.getElementById('modal-container');
        
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
        
        if (!modal) {
            // Try to reload the modal component
            this.loadComponent('process-test-modal', '#modal-container').then(() => {
                setTimeout(() => {
                    const reloadedModal = document.getElementById('process-test-modal');
                    if (reloadedModal) {
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
        // Get technician email from various sources
        
        // Try to get from multipass data first
        if (window.shopifyMultipass && window.shopifyMultipass.email) {
            return window.shopifyMultipass.email;
        }
        
        // Fallback to localStorage or URL params
        const urlParams = new URLSearchParams(window.location.search);
        const emailFromUrl = urlParams.get('email');
        if (emailFromUrl) {
            return emailFromUrl;
        }
        
        // Check localStorage for stored user data
        const storedUser = localStorage.getItem('nad_user_data');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData.email) {
                    return userData.email;
                }
            } catch (e) {
                // Failed to parse stored user data
            }
        }
        
        // Default fallback
        return 'lab-tech@example.com';
    },
    
    closeProcessModal() {
        document.getElementById('process-test-modal').style.display = 'none';
        this.currentProcessingTest = null;
    },

    openEditModal(testId) {
        // Open edit modal for test
        
        // Get the test data from recent tests
        const testData = this.recentTests?.find(test => test.test_id === testId);
        if (!testData) {
            alert('Test data not found. Please refresh and try again.');
            return;
        }
        
        // Store current test data
        this.currentEditingTest = testData;
        
        // Get technician email
        const technicianEmail = this.getTechnicianEmail();
        
        // Get modal elements
        const modalTestId = document.getElementById('edit-modal-test-id');
        const modalBatchId = document.getElementById('edit-modal-batch-id');
        const modalOriginalScore = document.getElementById('edit-modal-original-score');
        const modalProcessedDate = document.getElementById('edit-modal-processed-date');
        const editScoreField = document.getElementById('edit-nad-score');
        const technicianEmailField = document.getElementById('edit-technician-email');
        const editForm = document.getElementById('edit-test-form');
        const errorMessage = document.getElementById('edit-modal-error-message');
        const modal = document.getElementById('edit-test-modal');
        
        if (!modal) {
            alert('Edit modal not loaded. Please refresh the page.');
            return;
        }
        
        // Populate modal with test information
        if (modalTestId) modalTestId.textContent = testData.test_id;
        if (modalBatchId) modalBatchId.textContent = testData.batch_id ? 
            testData.batch_id.split('-').pop() : 'N/A';
        if (modalOriginalScore) modalOriginalScore.textContent = testData.nad_score || 'N/A';
        if (modalProcessedDate) modalProcessedDate.textContent = 
            new Date(testData.processed_date).toLocaleDateString();
        
        // Set current score as default
        if (editScoreField) editScoreField.value = testData.nad_score || '';
        
        // Reset form
        if (editForm) editForm.reset();
        if (errorMessage) errorMessage.style.display = 'none';
        
        // Re-populate fields after reset
        if (editScoreField) editScoreField.value = testData.nad_score || '';
        if (technicianEmailField) technicianEmailField.value = technicianEmail;
        
        // Show modal
        modal.style.display = 'block';
    },

    closeEditModal() {
        document.getElementById('edit-test-modal').style.display = 'none';
        this.currentEditingTest = null;
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
        // Set up modal event listeners
        
        // Add a small delay to ensure modals are fully loaded
        setTimeout(() => {
            const processForm = document.getElementById('process-test-form');
            if (processForm) {
                processForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleProcessFormSubmit();
                });
            }
            
            const editForm = document.getElementById('edit-test-form');
            if (editForm) {
                editForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleEditFormSubmit();
                });
            }
        }, 100);
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const processModal = document.getElementById('process-test-modal');
            const editModal = document.getElementById('edit-test-modal');
            if (e.target === processModal) {
                this.closeProcessModal();
            } else if (e.target === editModal) {
                this.closeEditModal();
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

    handleEditFormSubmit() {
        const form = document.getElementById('edit-test-form');
        const formData = new FormData(form);
        
        // Validate required fields
        const nadScore = formData.get('nadScore');
        const editReason = formData.get('editReason');
        const editNotes = formData.get('editNotes');
        
        if (!nadScore || nadScore < 0 || nadScore > 100) {
            this.showEditModalError('Please enter a valid NAD+ score between 0 and 100.');
            return;
        }
        
        if (!editReason) {
            this.showEditModalError('Please select a reason for the edit.');
            return;
        }
        
        if (!editNotes || editNotes.trim().length < 10) {
            this.showEditModalError('Please provide a detailed explanation (at least 10 characters).');
            return;
        }
        
        // Ensure technician email is included
        const technicianEmail = formData.get('technicianEmail') || this.getTechnicianEmail();
        if (technicianEmail && technicianEmail !== 'lab-tech@example.com') {
            formData.set('technicianEmail', technicianEmail);
        }
        
        // Show loading state
        const submitBtn = document.getElementById('submit-edit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;
        
        // Update the test
        this.updateTest(this.currentEditingTest.test_id, formData).finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    },

    async updateTest(testId, formData) {
        try {
            const response = await fetch(`/api/lab/update-test/${testId}`, {
                method: 'PUT',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.closeEditModal();
                await this.loadRecentTests(); // Refresh the list
                
                // Show success message
                this.showSuccessMessage('Test updated successfully!');
            } else {
                throw new Error(data.message || 'Update failed');
            }
        } catch (error) {
            this.showEditModalError(error.message || 'Error updating test. Please try again.');
        }
    },

    showEditModalError(message) {
        const errorDiv = document.getElementById('edit-modal-error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
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