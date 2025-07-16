// Main customer controller
window.NADCustomer = {
    currentStep: 1,
    testData: {},
    
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
        const email = document.getElementById('email').value;
        
        // Validate format
        if (!NAD.utils.isValidTestId(testId)) {
            this.showMessage('Invalid Test ID format. Please check and try again.', 'error');
            return;
        }
        
        if (!NAD.utils.isValidEmail(email)) {
            this.showMessage('Invalid email format. Please check and try again.', 'error');
            return;
        }
        
        try {
            // Show loading state
            const button = document.querySelector('[data-action="verify-test"]');
            const originalText = button.textContent;
            button.textContent = 'Verifying...';
            button.disabled = true;
            
            // Make API call to verify test
            const response = await NAD.api.verifyTest({
                testId: testId,
                email: email
            });
            
            if (response.success) {
                // Store test data
                this.testData = {
                    testId: testId,
                    email: email,
                    verified: true,
                    ...response.data
                };
                
                // Move to next step
                this.showMessage('Test ID verified successfully!', 'success');
                setTimeout(() => {
                    this.nextStep();
                }, 1500);
            } else {
                throw new Error(response.message || 'Verification failed');
            }
            
        } catch (error) {
            console.error('Verification error:', error);
            this.showMessage('Unable to verify Test ID. Please check your information and try again.', 'error');
            
            // Reset button
            const button = document.querySelector('[data-action="verify-test"]');
            button.textContent = 'Verify Test ID';
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
        if (window.NADSupplementHandler) {
            window.NADSupplementHandler.init();
        }
    },
    
    initResultsHandlers() {
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
