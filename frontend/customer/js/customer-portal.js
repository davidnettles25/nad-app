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
        
        // Check for stored test data from previous session
        const storedData = sessionStorage.getItem('nadTestData');
        if (storedData) {
            try {
                this.testData = JSON.parse(storedData);
            } catch (e) {
                console.error('Failed to parse stored test data');
            }
        }
        
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
        
        // Load test history below the form
        this.loadTestHistorySection();
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
            console.log('📋 Form submission handler attached to:', form);
            form.addEventListener('submit', (e) => {
                console.log('📋 Form submit event triggered');
                e.preventDefault();
                this.handleSupplementSubmission();
            });
        } else {
            console.log('❌ No supplement form found with ID "supplement-form"');
        }
        
        // Supplement selection is now handled by setupSupplementCheckboxes()
    },
    
    async handleSupplementSubmission() {
        console.log('🚀 handleSupplementSubmission called');
        try {
            // Show loading state
            const button = document.querySelector('[data-action="next-step"]');
            const originalText = button.textContent;
            console.log('🔄 Setting button to loading state');
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
            console.log('Sending activation data:', activationData);
            const response = await NAD.api.activateTest(activationData);
            console.log('Activation API response:', response);
            
            if (response.success) {
                console.log('✅ Activation successful');
                // Update test data
                this.testData.activated = true;
                this.testData.activatedAt = new Date().toISOString();
                this.testData.supplements = activationData.supplements;
                
                // Store in sessionStorage to persist between page transitions
                sessionStorage.setItem('nadTestData', JSON.stringify(this.testData));
                console.log('💾 Stored test data:', this.testData);
                
                // Show success message and move to next step
                this.showMessage('Test activated successfully with supplement information!', 'success');
                setTimeout(() => {
                    this.nextStep();
                }, 1500);
            } else {
                console.log('❌ Activation failed:', response);
                throw new Error(response.message || response.error || 'Activation failed');
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
        // Restore test data from sessionStorage if not already loaded
        if (!this.testData || !this.testData.supplements) {
            const storedData = sessionStorage.getItem('nadTestData');
            if (storedData) {
                try {
                    this.testData = JSON.parse(storedData);
                } catch (e) {
                    console.error('Failed to parse stored test data');
                }
            }
        }
        
        console.log('initResultsHandlers called, testData:', this.testData);
        console.log('Supplement data check:', this.testData?.supplements);
        
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
            console.log('Processing supplements for display:', this.testData?.supplements);
            
            // Check if we have supplement data
            if (this.testData && this.testData.supplements) {
                const selectedCount = this.testData.supplements.selected ? this.testData.supplements.selected.length : 0;
                const hasOther = this.testData.supplements.other && this.testData.supplements.other.trim() !== '';
                const totalCount = selectedCount + (hasOther ? 1 : 0);
                
                console.log('Supplement counts - Selected:', selectedCount, 'HasOther:', hasOther, 'Total:', totalCount);
                
                if (totalCount > 0) {
                    // Build a more detailed display
                    const supplementNames = [];
                    if (this.testData.supplements.selected && this.testData.supplements.selected.length > 0) {
                        supplementNames.push(...this.testData.supplements.selected.map(s => s.name));
                    }
                    if (hasOther) {
                        supplementNames.push('Other supplements');
                    }
                    const displayText = `${totalCount} recorded (${supplementNames.slice(0, 3).join(', ')}${supplementNames.length > 3 ? '...' : ''})`;
                    console.log('Setting supplement display text to:', displayText);
                    supplementsCountElement.textContent = displayText;
                } else {
                    console.log('No supplements found, showing None recorded');
                    supplementsCountElement.textContent = 'None recorded';
                }
            } else {
                console.log('No supplement data in testData, showing None recorded');
                supplementsCountElement.textContent = 'None recorded';
            }
        }
        
        // Populate detailed supplements section
        this.populateDetailedSupplements();
        
        // Initialize any other results functionality
        if (window.NADResultsViewer) {
            window.NADResultsViewer.init();
        }
    },
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="next-step"]')) {
                // Check if we're on the supplements step
                if (this.currentStep === 2) {
                    console.log('🎯 Next-step clicked on supplements page, calling handleSupplementSubmission');
                    e.preventDefault();
                    this.handleSupplementSubmission();
                } else {
                    console.log('🎯 Next-step clicked on step', this.currentStep, 'calling nextStep');
                    this.nextStep();
                }
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
    },

    // ============================================================================
    // CUSTOMER PORTAL NEW FEATURES
    // ============================================================================

    // Dashboard functionality
    async loadDashboard() {
        try {
            await this.loadSection('dashboard', '#content-container');
            // Ensure DOM elements are available before loading data
            await new Promise(resolve => {
                // Check if key elements are loaded
                const checkElements = () => {
                    const statsElements = document.getElementById('total-tests') && document.getElementById('customer-name');
                    const sectionElements = document.getElementById('recent-tests-section') && document.getElementById('no-tests-section');
                    
                    if (statsElements && sectionElements) {
                        resolve();
                    } else {
                        setTimeout(checkElements, 50);
                    }
                };
                checkElements();
            });
            
            await this.loadCustomerStats();
            await this.loadRecentTests();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Failed to load dashboard');
        }
    },

    async loadCustomerStats() {
        try {
            // Use customer email from user data
            // In production, this would come from Multipass authentication
            const customerId = this.userData.email;
            const response = await fetch(`/api/customer/test-history?customer_id=${customerId}`);
            const data = await response.json();
            
            if (data.success) {
                // Check if elements exist before setting content
                const totalTestsEl = document.getElementById('total-tests');
                const completedTestsEl = document.getElementById('completed-tests');
                const pendingTestsEl = document.getElementById('pending-tests');
                const activatedTestsEl = document.getElementById('activated-tests');
                const customerNameEl = document.getElementById('customer-name');
                const customerEmailEl = document.getElementById('customer-email');

                if (totalTestsEl) totalTestsEl.textContent = data.summary.total_tests;
                if (completedTestsEl) completedTestsEl.textContent = data.summary.completed_tests;
                if (pendingTestsEl) pendingTestsEl.textContent = data.summary.pending_tests;
                if (activatedTestsEl) activatedTestsEl.textContent = data.summary.activated_tests;
                if (customerNameEl) customerNameEl.textContent = data.customer_name || 'Customer';
                if (customerEmailEl) customerEmailEl.textContent = data.customer_id;

                // Store customer data
                this.customerData = data;
            }
        } catch (error) {
            console.error('Error loading customer stats:', error);
            // Set default values safely
            ['total-tests', 'completed-tests', 'pending-tests', 'activated-tests'].forEach(id => {
                const element = document.getElementById(id);
                if (element) element.textContent = '0';
            });
        }
    },

    async loadRecentTests() {
        try {
            if (!this.customerData || !this.customerData.tests) return;

            const recentTests = this.customerData.tests.slice(0, 3);
            const recentSection = document.getElementById('recent-tests-section');
            const noTestsSection = document.getElementById('no-tests-section');
            const recentTestsList = document.getElementById('recent-tests-list');

            // Check if elements exist before manipulating them
            if (!recentSection || !noTestsSection) {
                console.warn('Recent tests sections not found in DOM');
                return;
            }

            if (recentTests.length === 0) {
                recentSection.style.display = 'none';
                noTestsSection.style.display = 'block';
                return;
            }

            recentSection.style.display = 'block';
            noTestsSection.style.display = 'none';

            if (recentTestsList) {
                recentTestsList.innerHTML = recentTests.map(test => this.createRecentTestItem(test)).join('');
            }

        } catch (error) {
            console.error('Error loading recent tests:', error);
        }
    },

    createRecentTestItem(test) {
        const statusDisplay = {
            'pending': 'Pending',
            'activated': 'Activated', 
            'completed': 'Completed'
        }[test.status] || test.status;

        return `
            <div class="recent-test-item" onclick="NADCustomer.viewTestDetails('${test.test_id}')">
                <div class="test-info">
                    <h4>${test.test_id}</h4>
                    <p>Created: ${new Date(test.created_date).toLocaleDateString()}</p>
                </div>
                <div class="test-status status-${test.status}">${statusDisplay}</div>
            </div>
        `;
    },

    // Test History functionality
    async loadTestHistory() {
        try {
            await this.loadSection('test-history', '#content-container');
            await this.loadAllTests();
        } catch (error) {
            console.error('Error loading test history:', error);
            this.showError('Failed to load test history');
        }
    },

    async loadAllTests() {
        try {
            const loadingMessage = document.getElementById('loading-message');
            const testsGrid = document.getElementById('tests-grid');
            const noTestsMessage = document.getElementById('no-tests-message');

            // Show loading
            if (loadingMessage) loadingMessage.style.display = 'block';
            if (testsGrid) testsGrid.style.display = 'none';
            if (noTestsMessage) noTestsMessage.style.display = 'none';

            // Use customer email from user data
            const customerId = this.userData.email;
            const response = await fetch(`/api/customer/test-history?customer_id=${customerId}`);
            const data = await response.json();
            
            if (data.success) {
                this.allTests = data.tests;
                this.filteredTests = data.tests;
                this.renderTestCards(data.tests);
            } else {
                throw new Error(data.error || 'Failed to load tests');
            }
        } catch (error) {
            console.error('Error loading all tests:', error);
            this.showNoTestsMessage();
        } finally {
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) loadingMessage.style.display = 'none';
        }
    },

    renderTestCards(tests) {
        const container = document.getElementById('tests-grid');
        const noTestsMessage = document.getElementById('no-tests-message');
        
        if (!container) return;

        if (tests.length === 0) {
            container.style.display = 'none';
            if (noTestsMessage) noTestsMessage.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        if (noTestsMessage) noTestsMessage.style.display = 'none';
        
        const cardsHtml = tests.map(test => this.createTestCard(test)).join('');
        container.innerHTML = cardsHtml;
    },

    createTestCard(test) {
        const statusDisplay = {
            'pending': 'Pending',
            'activated': 'Activated', 
            'completed': 'Completed'
        }[test.status] || test.status;

        // Get border color based on status
        const borderColor = this.getStatusBorderColor(test.status);

        return `
            <div class="test-card" data-test-id="${test.test_id}" data-status="${test.status}" style="border-left: 6px solid ${borderColor};">
                <div class="test-card-header">
                    <div class="test-id-section">
                        <div class="test-id">${test.test_id}</div>
                    </div>
                    <div class="test-status status-${test.status}">${statusDisplay}</div>
                </div>
                
                <div class="test-card-body">
                    <div class="test-timeline">
                        <div class="timeline-item">
                            <span class="timeline-label">Created:</span>
                            <span class="timeline-date">${new Date(test.created_date).toLocaleDateString()}</span>
                        </div>
                        ${test.activated_date ? `
                            <div class="timeline-item">
                                <span class="timeline-label">Activated:</span>
                                <span class="timeline-date">${new Date(test.activated_date).toLocaleDateString()}</span>
                            </div>
                        ` : ''}
                        ${test.score_date ? `
                            <div class="timeline-item">
                                <span class="timeline-label">Results:</span>
                                <span class="timeline-date">${new Date(test.score_date).toLocaleDateString()}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="test-summary">
                        ${test.has_score ? `
                            <div class="score-display">
                                <div class="score-value">${test.score}</div>
                                <div class="score-label">NAD+ Score</div>
                            </div>
                        ` : ''}
                        
                        ${test.supplements && Array.isArray(test.supplements) && test.supplements.length > 0 ? `
                            <div class="supplements-summary">
                                ${test.supplements.length} supplement${test.supplements.length !== 1 ? 's' : ''} recorded
                            </div>
                        ` : test.has_supplements ? `
                            <div class="supplements-summary">
                                Supplements recorded
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="test-card-actions">
                    <button class="btn-outline" onclick="NADCustomer.viewTestDetails('${test.test_id}')">
                        View Details
                    </button>
                </div>
            </div>
        `;
    },

    showNoTestsMessage() {
        const container = document.getElementById('tests-grid');
        const noTestsMessage = document.getElementById('no-tests-message');
        
        if (container) container.style.display = 'none';
        if (noTestsMessage) noTestsMessage.style.display = 'block';
    },

    // Filter and search functionality
    filterTests() {
        const statusFilter = document.getElementById('status-filter');
        const searchInput = document.getElementById('test-search');
        
        if (!this.allTests) return;

        let filtered = [...this.allTests];

        // Apply status filter
        if (statusFilter && statusFilter.value !== 'all') {
            filtered = filtered.filter(test => test.status === statusFilter.value);
        }

        // Apply search filter
        if (searchInput && searchInput.value.trim()) {
            const searchTerm = searchInput.value.trim().toLowerCase();
            filtered = filtered.filter(test => 
                test.test_id.toLowerCase().includes(searchTerm)
            );
        }

        this.filteredTests = filtered;
        this.renderTestCards(filtered);
    },

    searchTests() {
        this.filterTests();
    },

    getStatusBorderColor(status) {
        switch (status) {
            case 'pending': return '#ffc107';      // Yellow
            case 'activated': return '#007bff';    // Blue  
            case 'completed': return '#28a745';    // Green
            default: return '#dee2e6';             // Light gray
        }
    },

    // Test detail modal functionality
    async viewTestDetails(testId) {
        try {
            console.log('Loading test details for:', testId);
            
            // Load modal component
            await this.loadTestDetailModal();
            
            // Use customer email from user data
            const customerId = this.userData.email;
            const response = await fetch(`/api/customer/test-detail/${testId}?customer_id=${customerId}`);
            const data = await response.json();
            
            if (data.success) {
                this.populateTestModal(data.test);
                this.showTestModal();
            } else {
                throw new Error(data.error || 'Failed to load test details');
            }
        } catch (error) {
            console.error('Error loading test details:', error);
            alert('Failed to load test details. Please try again.');
        }
    },

    async loadTestDetailModal() {
        try {
            const response = await fetch('customer/components/test-detail-modal.html');
            if (!response.ok) throw new Error('Failed to load modal');
            
            const html = await response.text();
            
            // Remove existing modal if present
            const existingModal = document.getElementById('test-detail-modal');
            if (existingModal) existingModal.remove();
            
            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', html);
        } catch (error) {
            console.error('Error loading modal:', error);
            throw error;
        }
    },

    populateTestModal(test) {
        // Basic test info
        const testIdEl = document.getElementById('modal-test-id');
        const statusEl = document.getElementById('modal-status');
        
        if (testIdEl) testIdEl.textContent = test.test_id;
        if (statusEl) {
            statusEl.textContent = test.status.charAt(0).toUpperCase() + test.status.slice(1);
            statusEl.className = `value status-badge status-${test.status}`;
        }

        // Score section
        const scoreSection = document.getElementById('score-section');
        const scoreEl = document.getElementById('modal-score');
        const scoreDateEl = document.getElementById('modal-score-date');
        
        if (test.score) {
            if (scoreSection) scoreSection.style.display = 'block';
            if (scoreEl) scoreEl.textContent = test.score;
            if (scoreDateEl) scoreDateEl.textContent = test.score_date ? new Date(test.score_date).toLocaleDateString() : 'N/A';
        } else {
            if (scoreSection) scoreSection.style.display = 'none';
        }

        // Attachments
        this.populateAttachments(test.image);

        // Timeline
        this.populateTimeline(test.timeline || []);

        // Supplements
        this.populateSupplements(test.supplements || [], test.health_conditions);

        // Notes
        this.populateNotes(test.technician_notes);
    },

    populateTimeline(timeline) {
        const container = document.getElementById('modal-timeline');
        if (!container) return;

        if (timeline.length === 0) {
            container.innerHTML = '<p>No timeline events available.</p>';
            return;
        }

        container.innerHTML = timeline.map(event => `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-event">${event.event}</div>
                    <div class="timeline-date">${new Date(event.date).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');
    },

    populateSupplements(supplements, healthConditions) {
        const section = document.getElementById('supplements-section');
        const container = document.getElementById('modal-supplements');
        const healthSection = document.getElementById('health-conditions');
        const healthText = document.getElementById('health-conditions-text');


        if (!supplements || supplements.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        if (section) section.style.display = 'block';
        
        if (container) {
            container.innerHTML = supplements.map(supplement => {
                // Handle both 'amount' and 'dose' field names
                const dose = supplement.amount || supplement.dose || 0;
                return `
                    <div class="supplement-item">
                        <div class="supplement-name">${supplement.name}</div>
                        <div class="supplement-amount">${dose} ${supplement.unit || ''}</div>
                    </div>
                `;
            }).join('');
        }

        // Health conditions
        if (healthConditions && healthConditions.trim() && healthSection && healthText) {
            healthSection.style.display = 'block';
            healthText.textContent = healthConditions;
        } else if (healthSection) {
            healthSection.style.display = 'none';
        }
    },

    populateNotes(technicianNotes) {
        const notesSection = document.getElementById('notes-section');
        const techNotesDiv = document.getElementById('technician-notes');
        const techNotesText = document.getElementById('technician-notes-text');

        // Technician notes
        if (technicianNotes && technicianNotes.trim() && techNotesDiv && techNotesText) {
            techNotesDiv.style.display = 'block';
            techNotesText.textContent = technicianNotes;
            if (notesSection) notesSection.style.display = 'block';
        } else {
            if (techNotesDiv) techNotesDiv.style.display = 'none';
            if (notesSection) notesSection.style.display = 'none';
        }
    },

    populateAttachments(imagePath) {
        const attachmentsSection = document.getElementById('attachments-section');
        const attachmentName = document.getElementById('attachment-name');
        const attachmentMeta = document.getElementById('attachment-meta');
        
        if (imagePath && imagePath.trim()) {
            // Show attachments section
            if (attachmentsSection) attachmentsSection.style.display = 'block';
            
            // Store the image path for viewing
            this.currentAttachmentPath = imagePath;
            
            // Extract filename from path
            const filename = imagePath.split('/').pop() || 'Lab Result File';
            const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
            
            // Update display
            if (attachmentName) {
                // Show a user-friendly name based on file type
                const displayName = this.getAttachmentDisplayName(fileExtension);
                attachmentName.textContent = displayName;
            }
            
            if (attachmentMeta) {
                attachmentMeta.textContent = `Uploaded by lab technician • ${fileExtension.toUpperCase()} file`;
            }
            
        } else {
            // Hide attachments section if no attachment
            if (attachmentsSection) attachmentsSection.style.display = 'none';
        }
    },

    getAttachmentDisplayName(fileExtension) {
        const typeMap = {
            'pdf': 'Lab Report (PDF)',
            'jpg': 'Test Result Image',
            'jpeg': 'Test Result Image', 
            'png': 'Test Result Image',
            'doc': 'Lab Document',
            'docx': 'Lab Document'
        };
        return typeMap[fileExtension] || 'Lab Result File';
    },

    viewAttachment() {
        if (this.currentAttachmentPath) {
            // Open attachment in new window/tab
            // In production, add /nad-app prefix if not already present
            let attachmentUrl = this.currentAttachmentPath;
            
            // If path starts with /uploads, prepend the app path in production
            if (attachmentUrl.startsWith('/uploads/') && window.location.pathname.includes('/nad-app')) {
                attachmentUrl = '/nad-app' + attachmentUrl;
            }
            
            // Create full URL
            attachmentUrl = `${window.location.origin}${attachmentUrl}`;
            window.open(attachmentUrl, '_blank');
        }
    },

    populateDetailedSupplements() {
        console.log('🔍 populateDetailedSupplements called');
        console.log('🧬 Current testData:', this.testData);
        
        const detailsSection = document.getElementById('supplements-details-section');
        const supplementsList = document.getElementById('detailed-supplements-list');
        const otherSection = document.getElementById('other-supplements-section');
        const otherText = document.getElementById('other-supplements-text');
        const healthSection = document.getElementById('health-conditions-section');
        const healthText = document.getElementById('health-conditions-text');
        
        console.log('🔍 DOM elements found:', {
            detailsSection: !!detailsSection,
            supplementsList: !!supplementsList,
            otherSection: !!otherSection,
            otherText: !!otherText,
            healthSection: !!healthSection,
            healthText: !!healthText
        });
        
        if (!this.testData || !this.testData.supplements) {
            console.log('❌ No supplement data found');
            if (detailsSection) detailsSection.style.display = 'none';
            return;
        }
        
        const supplementData = this.testData.supplements;
        console.log('🔬 Processing supplement data:', supplementData);
        console.log('🔬 Supplement data keys:', Object.keys(supplementData));
        console.log('🔬 Full supplement data structure:', JSON.stringify(supplementData, null, 2));
        
        // Show the section
        if (detailsSection) detailsSection.style.display = 'block';
        
        // Populate selected supplements
        if (supplementData.selected && supplementData.selected.length > 0) {
            console.log('✅ Found selected supplements:', supplementData.selected);
            
            if (supplementsList) {
                supplementsList.innerHTML = supplementData.selected.map(supplement => `
                    <div class="supplement-card">
                        <div class="supplement-name">${supplement.name}</div>
                        <div class="supplement-dose">${supplement.dose || supplement.amount || 0}</div>
                        <div class="supplement-unit">${supplement.unit || 'units'}</div>
                    </div>
                `).join('');
            }
        } else {
            console.log('❌ No selected supplements found');
            if (supplementsList) {
                supplementsList.innerHTML = '<p>No specific supplements recorded</p>';
            }
        }
        
        // Populate other supplements text
        if (supplementData.other && supplementData.other.trim()) {
            console.log('✅ Found other supplements text:', supplementData.other);
            if (otherSection) otherSection.style.display = 'block';
            if (otherText) otherText.textContent = supplementData.other;
        } else {
            console.log('❌ No other supplements text found');
            if (otherSection) otherSection.style.display = 'none';
        }
        
        // Populate health conditions (try multiple field names)
        const healthConditions = supplementData.healthConditions || supplementData.health_conditions || supplementData.conditions;
        if (healthConditions && healthConditions.trim()) {
            console.log('✅ Found health conditions:', healthConditions);
            if (healthSection) healthSection.style.display = 'block';
            if (healthText) healthText.textContent = healthConditions;
        } else {
            console.log('❌ No health conditions found. Checked fields:', {
                healthConditions: supplementData.healthConditions,
                health_conditions: supplementData.health_conditions,
                conditions: supplementData.conditions
            });
            if (healthSection) healthSection.style.display = 'none';
        }
    },

    showTestModal() {
        const modal = document.getElementById('test-detail-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    },

    closeTestModal() {
        const modal = document.getElementById('test-detail-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    },

    // Navigation methods
    startNewTest() {
        this.currentStep = 1;
        this.showStep(1); // Go to existing test verification flow
    },

    viewAllTests() {
        this.loadTestHistory();
    },

    // Test history section loading
    async loadTestHistorySection() {
        try {
            const testHistorySection = document.getElementById('test-history-section');
            const loadingMessage = document.getElementById('loading-tests');
            
            if (!testHistorySection) return;
            
            // Show loading
            if (loadingMessage) loadingMessage.style.display = 'block';
            
            // Load customer test history
            const customerId = this.userData.email;
            const response = await fetch(`/api/customer/test-history?customer_id=${customerId}`);
            const data = await response.json();
            
            if (data.success && data.tests.length > 0) {
                // Show the test history section
                testHistorySection.style.display = 'block';
                
                // Update stats
                const totalTestsEl = document.getElementById('total-tests');
                const activatedTestsEl = document.getElementById('activated-tests');
                const completedTestsEl = document.getElementById('completed-tests');
                
                if (totalTestsEl) totalTestsEl.textContent = data.summary.total_tests;
                if (activatedTestsEl) activatedTestsEl.textContent = data.summary.activated_tests;
                if (completedTestsEl) completedTestsEl.textContent = data.summary.completed_tests;
                
                // Render test cards
                this.renderVerificationTestCards(data.tests);
                
                // Hide no tests message
                const noTestsMessage = document.getElementById('no-tests-message');
                if (noTestsMessage) noTestsMessage.style.display = 'none';
                
            } else {
                // Show no tests message but keep section hidden
                const noTestsMessage = document.getElementById('no-tests-message');
                if (noTestsMessage) noTestsMessage.style.display = 'block';
            }
            
        } catch (error) {
            console.error('Error loading test history section:', error);
        } finally {
            // Hide loading
            const loadingMessage = document.getElementById('loading-tests');
            if (loadingMessage) loadingMessage.style.display = 'none';
        }
    },

    renderVerificationTestCards(tests) {
        const container = document.getElementById('test-cards-container');
        if (!container) return;
        
        const cardsHtml = tests.map(test => this.createVerificationTestCard(test)).join('');
        container.innerHTML = cardsHtml;
    },

    createVerificationTestCard(test) {
        const statusDisplay = {
            'pending': 'Pending',
            'activated': 'Activated', 
            'completed': 'Completed'
        }[test.status] || test.status;

        // Get border color based on status
        const borderColor = this.getStatusBorderColor(test.status);

        return `
            <div class="test-card" onclick="NADCustomer.viewTestDetails('${test.test_id}')" style="border-left: 6px solid ${borderColor};">
                <div class="test-card-header">
                    <div class="test-info">
                        <div class="test-id">${test.test_id}</div>
                    </div>
                    <div class="test-status status-${test.status}">${statusDisplay}</div>
                </div>
                
                <div class="test-timeline">
                    <div class="timeline-item">
                        <span class="timeline-label">Created:</span>
                        <span class="timeline-date">${new Date(test.created_date).toLocaleDateString()}</span>
                    </div>
                    ${test.activated_date ? `
                        <div class="timeline-item">
                            <span class="timeline-label">Activated:</span>
                            <span class="timeline-date">${new Date(test.activated_date).toLocaleDateString()}</span>
                        </div>
                    ` : ''}
                    ${test.score_date ? `
                        <div class="timeline-item">
                            <span class="timeline-label">Results:</span>
                            <span class="timeline-date">${new Date(test.score_date).toLocaleDateString()}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // Revert to original init method
    init() {
        console.log('Initializing NAD Customer Portal');
        this.loadComponents();
        this.setupEventListeners();
        // Show verification step (original behavior)
        this.showStep(1);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.NADCustomer.init();
});
