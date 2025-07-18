// Main customer controller
window.NADCustomer = {
    currentStep: 1,
    testData: {},
    userData: {
        // Mock data - will be replaced by Shopify multipass data
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
    },
    
    init() {
        console.log('Initializing NAD Customer Portal');
        this.loadComponents();
        this.setupEventListeners();
        this.showStep(1);
    },
    
    async loadComponents() {
        try {
            // Load header
            await this.loadComponent('header', '#header-container');
            
            // Load initial content (verification step)
            await this.loadSection('verification', '#content-container');
            
            // Load footer if exists
            await this.loadComponent('footer', '#footer-container').catch(() => {
                console.log('No footer component found');
            });
            
        } catch (error) {
            console.error('Error loading components:', error);
            this.showError('Failed to load portal components');
        }
    },
    
    async loadComponent(componentName, targetSelector) {
        const response = await fetch(`customer/components/${componentName}.html`);
        if (!response.ok) throw new Error(`Failed to load ${componentName}`);
        
        const html = await response.text();
        const target = document.querySelector(targetSelector);
        if (target) {
            target.innerHTML = html;
        }
    },
    
    async loadSection(sectionName, targetSelector) {
        const response = await fetch(`customer/sections/${sectionName}.html`);
        if (!response.ok) throw new Error(`Failed to load section ${sectionName}`);
        
        const html = await response.text();
        const target = document.querySelector(targetSelector);
        if (target) {
            target.innerHTML = html;
            this.initializeSectionHandlers(sectionName);
        }
    },
    
    initializeSectionHandlers(sectionName) {
        switch(sectionName) {
            case 'verification':
                this.initVerificationHandlers();
                break;
            case 'supplements':
                this.initSupplementHandlers();
                break;
            case 'results':
                this.initResultsHandlers();
                break;
        }
    },
    
    initVerificationHandlers() {
        // Update user greeting
        const nameElement = document.getElementById('user-name');
        const emailElement = document.getElementById('user-email');
        if (nameElement) {
            nameElement.textContent = `${this.userData.firstName} ${this.userData.lastName}`;
        }
        if (emailElement) {
            emailElement.textContent = this.userData.email;
        }
        
        const form = document.getElementById('verification-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleVerification();
            });
        }
        
        // Handle help link
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="show-help"]')) {
                e.preventDefault();
                this.showHelp();
            }
        });
    },
    
    async handleVerification() {
        const testId = document.getElementById('test-id').value;
        
        // Validate format
        if (!NAD.utils.isValidTestId(testId)) {
            this.showMessage('Invalid Test ID format. Please check and try again.', 'error');
            return;
        }
        
        try {
            // Show loading state
            const button = document.querySelector('[data-action="verify-test"]');
            const originalText = button.textContent;
            button.textContent = 'Verifying...';
            button.disabled = true;
            
            // Make API call to verify test ID (not activate yet)
            const response = await NAD.api.verifyTest({
                testId: testId,
                email: this.userData.email,
                firstName: this.userData.firstName,
                lastName: this.userData.lastName
            });
            
            if (response.success) {
                // Store test data (not activated yet)
                this.testData = {
                    testId: testId,
                    email: this.userData.email,
                    activated: false,
                    verifiedAt: new Date().toISOString(),
                    ...response.data
                };
                
                // Move to supplement collection step
                this.showMessage('Test ID verified! Please provide supplement information.', 'success');
                setTimeout(() => {
                    this.nextStep();
                }, 1500);
            } else {
                throw new Error(response.message || 'Verification failed');
            }
            
        } catch (error) {
            console.error('Verification error:', error);
            let errorMessage = 'Unable to verify Test ID.';
            
            if (error.message.includes('not found')) {
                errorMessage = 'Test ID not found. Please check your Test ID and try again.';
            } else if (error.message.includes('already activated')) {
                errorMessage = 'This Test ID has already been activated. Please use a different test ID.';
            }
            
            this.showMessage(errorMessage, 'error');
            
            // Reset button
            const button = document.querySelector('[data-action="verify-test"]');
            button.textContent = 'Verify Test';
            button.disabled = false;
        }
    },
    
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // Insert message after form
        const form = document.getElementById('verification-form');
        if (form && form.parentNode) {
            const existing = form.parentNode.querySelector('.message');
            if (existing) existing.remove();
            form.parentNode.insertBefore(messageDiv, form.nextSibling);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => messageDiv.remove(), 5000);
    },
    
    showHelp() {
        // Could open a modal or navigate to help section
        this.loadSection('help', '#content-container');
    },
    
    initSupplementHandlers() {
        console.log('initSupplementHandlers called, testData:', this.testData);
        
        // Display test ID
        const testIdDisplay = document.getElementById('test-id-display');
        if (testIdDisplay) {
            const testId = this.testData.testId || this.testData.test_id;
            testIdDisplay.textContent = testId || 'Unknown';
            console.log('Setting test ID display:', testId);
        }
        
        // Update status display
        const statusDisplay = document.querySelector('.status-activated');
        if (statusDisplay) {
            if (!this.testData.activated) {
                statusDisplay.textContent = '✅ Verified (Pending Activation)';
                statusDisplay.className = 'status-verified';
            } else {
                statusDisplay.textContent = '✅ Activated';
                statusDisplay.className = 'status-activated';
            }
        }
        
        // Load supplements from API with fallback to mock data
        this.loadSupplements();
        
        // Handle form submission
        const form = document.getElementById('supplement-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSupplementSubmission();
            });
        }
        
        // Supplement selection is now handled by setupSupplementCheckboxes()
    },
    
    async handleSupplementSubmission() {
        try {
            // Show loading state
            const button = document.querySelector('[data-action="next-step"]');
            const originalText = button.textContent;
            button.textContent = 'Activating Test...';
            button.disabled = true;
            
            // Collect supplement data with amounts
            const selectedSupplements = Array.from(document.querySelectorAll('input[name="supplements"]:checked'))
                .map(input => {
                    const supplementItem = input.closest('.supplement-item');
                    const amountInput = supplementItem.querySelector('.amount-input');
                    const unitElement = supplementItem.querySelector('.amount-unit');
                    
                    return {
                        id: input.value,
                        name: supplementItem.querySelector('.supplement-name').textContent,
                        amount: parseFloat(amountInput.value) || 0,
                        unit: unitElement.textContent
                    };
                });
            
            const otherSupplements = document.getElementById('other-supplements').value;
            const healthConditions = document.getElementById('health-conditions').value;
            
            // Prepare activation data with supplements
            const activationData = {
                testId: this.testData.testId,
                email: this.userData.email,
                firstName: this.userData.firstName,
                lastName: this.userData.lastName,
                supplements: {
                    selected: selectedSupplements,
                    other: otherSupplements,
                    health_conditions: healthConditions,
                    submitted_at: new Date().toISOString()
                }
            };
            
            // Make API call to activate test with supplement data
            const response = await NAD.api.activateTest(activationData);
            
            if (response.success) {
                // Update test data
                this.testData.activated = true;
                this.testData.activatedAt = new Date().toISOString();
                this.testData.supplements = activationData.supplements;
                
                // Show success message and move to next step
                this.showMessage('Test activated successfully with supplement information!', 'success');
                setTimeout(() => {
                    this.nextStep();
                }, 1500);
            } else {
                throw new Error(response.message || 'Activation failed');
            }
            
        } catch (error) {
            console.error('Activation error:', error);
            this.showMessage('Failed to activate test. Please try again.', 'error');
            
            // Reset button
            const button = document.querySelector('[data-action="next-step"]');
            button.textContent = 'Continue to Results →';
            button.disabled = false;
        }
    },
    
    async loadSupplements() {
        try {
            const response = await fetch('https://mynadtest.info/api/supplements');
            const data = await response.json();
            
            if (data.success && data.supplements) {
                this.renderSupplements(data.supplements);
            } else {
                this.renderMockSupplements();
            }
        } catch (error) {
            console.error('Error loading supplements:', error);
            this.renderMockSupplements();
        }
    },
    
    renderSupplements(supplements) {
        console.log('renderSupplements called with:', supplements);
        const grid = document.getElementById('supplement-grid');
        console.log('Grid element:', grid);
        if (!grid) {
            console.error('supplement-grid element not found');
            return;
        }
        
        const supplementsHtml = supplements.map(supplement => `
            <div class="supplement-item" data-supplement-id="${supplement.id}">
                <label class="supplement-label">
                    <input type="checkbox" name="supplements" value="${supplement.id}" class="supplement-checkbox">
                    <div class="supplement-info">
                        <div class="supplement-name">${supplement.name}</div>
                        <div class="supplement-description">${supplement.description || 'Common supplement'}</div>
                    </div>
                </label>
                <div class="supplement-amount-section" style="display: none;">
                    <label class="amount-label">
                        Amount taken:
                        <div class="amount-input-group">
                            <input type="number" 
                                   name="supplement-amount-${supplement.id}" 
                                   class="amount-input" 
                                   value="${supplement.default_dose || 1}" 
                                   min="0" 
                                   step="0.1"
                                   placeholder="Amount">
                            <span class="amount-unit">${supplement.unit || 'mg'}</span>
                        </div>
                    </label>
                </div>
            </div>
        `).join('');
        
        console.log('Setting grid innerHTML to:', supplementsHtml);
        grid.innerHTML = supplementsHtml;
        
        // Add event listeners for checkbox changes
        this.setupSupplementCheckboxes();
    },
    
    renderMockSupplements() {
        console.log('renderMockSupplements called');
        const mockSupplements = [
            { id: 1, name: 'NAD+ Precursor', description: 'Nicotinamide Riboside or NMN', default_dose: 250, unit: 'mg' },
            { id: 2, name: 'Vitamin D3', description: 'Supports cellular energy production', default_dose: 2000, unit: 'IU' },
            { id: 3, name: 'Magnesium', description: 'Essential for NAD+ synthesis', default_dose: 400, unit: 'mg' },
            { id: 4, name: 'B-Complex', description: 'Supports energy metabolism', default_dose: 1, unit: 'capsule' },
            { id: 5, name: 'Resveratrol', description: 'Activates sirtuins', default_dose: 100, unit: 'mg' },
            { id: 6, name: 'Omega-3', description: 'Supports cellular health', default_dose: 1000, unit: 'mg' },
            { id: 7, name: 'Coenzyme Q10', description: 'Mitochondrial support', default_dose: 100, unit: 'mg' },
            { id: 8, name: 'Multivitamin', description: 'General nutritional support', default_dose: 1, unit: 'tablet' }
        ];
        
        console.log('Mock supplements:', mockSupplements);
        this.renderSupplements(mockSupplements);
    },
    
    setupSupplementCheckboxes() {
        // Remove old listeners
        document.removeEventListener('change', this.handleSupplementChange);
        
        // Add new listeners
        document.addEventListener('change', this.handleSupplementChange.bind(this));
    },
    
    handleSupplementChange(e) {
        if (e.target.type === 'checkbox' && e.target.name === 'supplements') {
            const supplementItem = e.target.closest('.supplement-item');
            const amountSection = supplementItem.querySelector('.supplement-amount-section');
            
            if (e.target.checked) {
                supplementItem.classList.add('selected');
                amountSection.style.display = 'block';
            } else {
                supplementItem.classList.remove('selected');
                amountSection.style.display = 'none';
            }
        }
    },
    
    initResultsHandlers() {
        console.log('initResultsHandlers called, testData:', this.testData);
        
        // Populate results data
        const testIdElement = document.getElementById('results-test-id');
        if (testIdElement) {
            testIdElement.textContent = this.testData.testId || this.testData.test_id || 'Unknown';
        }
        
        const activationDateElement = document.getElementById('results-activation-date');
        if (activationDateElement) {
            const date = this.testData.activatedAt || this.testData.activated_date || new Date().toISOString();
            activationDateElement.textContent = new Date(date).toLocaleDateString();
        }
        
        const supplementsCountElement = document.getElementById('results-supplements-count');
        if (supplementsCountElement) {
            const supplementsCount = this.testData.supplements ? 
                (this.testData.supplements.selected ? this.testData.supplements.selected.length : 0) : 0;
            supplementsCountElement.textContent = supplementsCount > 0 ? `${supplementsCount} supplements` : 'None recorded';
        }
        
        // Initialize any other results functionality
        if (window.NADResultsViewer) {
            window.NADResultsViewer.init();
        }
    },
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="next-step"]')) {
                this.nextStep();
            }
            if (e.target.matches('[data-action="prev-step"]')) {
                this.prevStep();
            }
        });
    },
    
    showStep(stepNumber) {
        this.currentStep = stepNumber;
        this.updateStepIndicator();
        
        const sections = ['verification', 'supplements', 'results'];
        const sectionName = sections[stepNumber - 1];
        
        if (sectionName) {
            this.loadSection(sectionName, '#content-container');
        }
    },
    
    updateStepIndicator() {
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index + 1 <= this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    },
    
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < 3) {
                this.showStep(this.currentStep + 1);
            }
        }
    },
    
    prevStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    },
    
    validateCurrentStep() {
        switch(this.currentStep) {
            case 1:
                return this.validateVerification();
            case 2:
                return this.validateSupplements();
            default:
                return true;
        }
    },
    
    validateVerification() {
        // Will be implemented with verification form
        return true;
    },
    
    validateSupplements() {
        // Will be implemented with supplement form
        return true;
    },
    
    showError(message) {
        const content = document.querySelector('#content-container');
        if (content) {
            content.innerHTML = `
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
    window.NADCustomer.init();
});
