/**
 * NAD+ Customer Dashboard Controller
 * Handles all dashboard functionality, API integration, and user interactions
 */

window.NADDashboard = {
    // Dashboard state
    user: null,
    tests: [],
    currentSection: 'dashboard',
    charts: {},
    
    // Configuration
    config: {
        apiBase: 'https://mynadtest.info',
        refreshInterval: 30000, // 30 seconds
        chartColors: {
            primary: '#3498db',
            success: '#27ae60',
            warning: '#f39c12',
            danger: '#e74c3c'
        }
    },

    /**
     * Initialize the dashboard
     */
    async init() {
        try {
            NAD.logger.info('Initializing NAD Customer Dashboard...');
            
            // Show loading screen
            this.showLoading();
            
            // Check authentication
            const authResult = await this.checkAuthentication();
            if (!authResult.success) {
                this.showAuthError();
                return;
            }
            
            // Load user data
            await this.loadUserData();
            
            // Load dashboard data
            await this.loadDashboardData();
            
            // Setup UI
            this.setupEventListeners();
            this.initializeCharts();
            
            // Show dashboard
            this.showDashboard();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            NAD.logger.info('Dashboard initialized successfully');
            
        } catch (error) {
            NAD.logger.error('Dashboard initialization failed:', error);
            this.showError('Failed to initialize dashboard. Please refresh the page.');
        }
    },

    /**
     * Check user authentication from Shopify or session
     */
    async checkAuthentication() {
        try {
            // Check for Shopify portal token in URL
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('t');
            
            if (token) {
                NAD.logger.debug('Portal token found, validating...');
                const response = await NAD.API.request('/shopify/portal', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.success) {
                    // Store authentication
                    sessionStorage.setItem('nad_auth_token', token);
                    sessionStorage.setItem('nad_user_data', JSON.stringify(response.data));
                    return { success: true, user: response.data };
                }
            }
            
            // Check existing session
            const storedToken = sessionStorage.getItem('nad_auth_token');
            const storedUser = sessionStorage.getItem('nad_user_data');
            
            if (storedToken && storedUser) {
                NAD.logger.debug('Existing session found');
                return { 
                    success: true, 
                    user: JSON.parse(storedUser),
                    token: storedToken 
                };
            }
            
            // Check for email-based authentication (legacy)
            const email = sessionStorage.getItem('nad_customer_email');
            if (email) {
                NAD.logger.debug('Legacy email authentication found');
                return { 
                    success: true, 
                    user: { email: email, type: 'email' } 
                };
            }
            
            return { success: false, error: 'No authentication found' };
            
        } catch (error) {
            NAD.logger.error('Authentication check failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Load user data and populate UI
     */
    async loadUserData() {
        try {
            const authData = JSON.parse(sessionStorage.getItem('nad_user_data') || '{}');
            
            this.user = {
                firstName: authData.firstName || 'Customer',
                lastName: authData.lastName || '',
                email: authData.email || 'customer@example.com',
                customerId: authData.customerId || null,
                type: authData.type || 'shopify'
            };
            
            // Update UI
            this.updateUserDisplay();
            
        } catch (error) {
            NAD.logger.error('Failed to load user data:', error);
            throw error;
        }
    },

    /**
     * Load all dashboard data
     */
    async loadDashboardData() {
        try {
            // Load tests first, then stats and activity that depend on tests
            await this.loadCustomerTests();
            
            // Now load stats and activity in parallel
            await Promise.all([
                this.loadCustomerStats(),
                this.loadRecentActivity()
            ]);
            
        } catch (error) {
            NAD.logger.error('Failed to load dashboard data:', error);
            throw error;
        }
    },

    /**
     * Load customer's tests
     */
    async loadCustomerTests() {
        NAD.logger.debug('Loading customer tests for:', this.user);
        
        try {
            const customerIdentifier = this.user.customerId || this.user.email;
            
            const response = await NAD.API.request('/api/customer/tests', {
                method: 'POST',
                data: {
                    email: this.user.email,
                    customerId: this.user.customerId
                }
            });
            
            if (response.success && response.data.tests && response.data.tests.length > 0) {
                NAD.logger.info('API response:', response);
                this.tests = response.data.tests;
                NAD.logger.info('Tests loaded from API:', this.tests.length, 'tests');
                this.updateTestsDisplay();
                return;
            } else {
                NAD.logger.warn('No tests found for customer, will use fallback if available');
                this.tests = [];
            }
            
        } catch (error) {
            NAD.logger.error('Failed to load customer tests:', error);
            this.tests = [];
        }
        
        // Only use mock data if we have no real data
        if (this.tests.length === 0 && this.user && this.user.email === 'john.doe@example.com') {
            NAD.logger.info('🎭 No real data available, using mock data for John Doe');
            this.tests = [
                {
                    test_id: '2025-07-108-66LPBA',
                    status: 'completed',
                    score: 85,
                    created_date: '2025-07-20',
                    activated_date: '2025-07-21',
                    score_date: '2025-07-25'
                },
                {
                    test_id: '2025-07-095-4A7B2C',
                    status: 'activated',
                    created_date: '2025-07-15',
                    activated_date: '2025-07-16'
                }
            ];
            NAD.logger.info('📊 Mock data loaded: ', this.tests.length, 'tests');
            this.updateTestsDisplay();
        }
    },

    /**
     * Load customer statistics
     */
    async loadCustomerStats() {
        try {
            const stats = this.calculateStats();
            this.updateStatsDisplay(stats);
            
        } catch (error) {
            NAD.logger.error('Failed to load customer stats:', error);
        }
    },

    /**
     * Calculate statistics from test data
     */
    calculateStats() {
        const totalTests = this.tests.length;
        const completedTests = this.tests.filter(test => test.status === 'completed').length;
        const activatedTests = this.tests.filter(test => test.status === 'activated').length;
        
        // Calculate average score
        const completedWithScores = this.tests.filter(test => 
            test.status === 'completed' && test.score && test.score > 0
        );
        
        // Debug log to see what scores we're working with
        if (completedWithScores.length > 0) {
            NAD.logger.debug('Completed test scores:', completedWithScores.map(t => ({ id: t.test_id, score: t.score })));
        }
        
        // Calculate average, treating scores as numbers and validating range
        const avgScore = completedWithScores.length > 0 
            ? Math.round(completedWithScores.reduce((sum, test) => {
                const score = Number(test.score);
                // Validate score is in reasonable range (0-100)
                if (score >= 0 && score <= 100) {
                    return sum + score;
                } else {
                    NAD.logger.warn(`Invalid score ${score} for test ${test.test_id}`);
                    return sum;
                }
            }, 0) / completedWithScores.filter(test => {
                const score = Number(test.score);
                return score >= 0 && score <= 100;
            }).length)
            : 0;
        
        return {
            totalTests,
            completedTests,
            activatedTests,
            avgScore
        };
    },

    /**
     * Load recent activity
     */
    async loadRecentActivity() {
        try {
            // Get most recent 3 tests
            const recentTests = this.tests
                .sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date))
                .slice(0, 3);
            
            this.updateRecentTestsDisplay(recentTests);
            
        } catch (error) {
            NAD.logger.error('Failed to load recent activity:', error);
        }
    },

    /**
     * Update user display in header
     */
    updateUserDisplay() {
        const nameElement = document.getElementById('user-name');
        const emailElement = document.getElementById('user-email');
        const lastLoginElement = document.getElementById('last-login-time');
        
        if (nameElement) {
            nameElement.textContent = `${this.user.firstName} ${this.user.lastName}`.trim();
        }
        
        if (emailElement) {
            emailElement.textContent = this.user.email;
        }
        
        if (lastLoginElement) {
            lastLoginElement.textContent = new Date().toLocaleDateString();
        }
    },

    /**
     * Update stats display
     */
    updateStatsDisplay(stats) {
        const elements = {
            'total-tests': stats.totalTests,
            'completed-tests': stats.completedTests,
            'activated-tests': stats.activatedTests,
            'avg-score': (stats.avgScore > 0 && stats.avgScore <= 100) ? stats.avgScore : '-'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    },

    /**
     * Update tests display
     */
    updateTestsDisplay() {
        NAD.logger.debug('updateTestsDisplay called with', this.tests.length, 'tests');
        const testsList = document.getElementById('tests-list');
        if (!testsList) {
            NAD.logger.warn('tests-list element not found');
            return;
        }
        
        if (this.tests.length === 0) {
            NAD.logger.info('No tests to display, showing empty state');
            testsList.innerHTML = this.getEmptyTestsHTML();
            return;
        }
        
        NAD.logger.info('Rendering', this.tests.length, 'tests');
        const testsHTML = this.tests.map(test => this.getTestItemHTML(test)).join('');
        testsList.innerHTML = testsHTML;
    },

    /**
     * Update recent tests display
     */
    updateRecentTestsDisplay(recentTests) {
        const recentTestsList = document.getElementById('recent-tests-list');
        if (!recentTestsList) return;
        
        if (recentTests.length === 0) {
            recentTestsList.innerHTML = '<p class="text-center" style="color: var(--text-secondary);">No tests yet</p>';
            return;
        }
        
        const testsHTML = recentTests.map(test => this.getRecentTestItemHTML(test)).join('');
        recentTestsList.innerHTML = testsHTML;
    },

    /**
     * Get HTML for test item
     */
    getTestItemHTML(test) {
        const statusClass = `status-${test.status}`;
        
        // Show relevant dates based on status
        let dateInfo = '';
        if (test.activated_date) {
            dateInfo += `<p>Activated: ${new Date(test.activated_date).toLocaleDateString()}</p>`;
        }
        if (test.status === 'completed' && (test.score_date || test.updated_date)) {
            const completedDate = test.score_date || test.updated_date;
            dateInfo += `<p>Completed: ${new Date(completedDate).toLocaleDateString()}</p>`;
        }
        
        // If no relevant dates, show created as fallback
        if (!dateInfo) {
            dateInfo = `<p>Created: ${new Date(test.created_date).toLocaleDateString()}</p>`;
        }
        
        return `
            <div class="test-item">
                <div class="test-details">
                    <h4>${test.test_id}</h4>
                    ${dateInfo}
                </div>
                <div class="test-actions">
                    <span class="test-status ${statusClass}">${test.status === 'activated' ? 'In Lab' : test.status}</span>
                    ${this.getTestActionButtons(test)}
                </div>
            </div>
        `;
    },

    /**
     * Get HTML for recent test item
     */
    getRecentTestItemHTML(test) {
        const statusClass = `status-${test.status}`;
        const date = new Date(test.created_date).toLocaleDateString();
        
        return `
            <div class="recent-test-item">
                <div class="test-info">
                    <h4>${test.test_id}</h4>
                    <p>${date}</p>
                </div>
                <span class="test-status ${statusClass}">${test.status}</span>
            </div>
        `;
    },

    /**
     * Get action buttons for test
     */
    getTestActionButtons(test) {
        let buttons = '';
        
        switch (test.status) {
            case 'activated':
                buttons = `<button class="btn-secondary" onclick="NADDashboard.viewTestDetails('${test.test_id}')">
                    <i class="fas fa-eye"></i> View
                </button>`;
                break;
            case 'completed':
                buttons = `
                    <button class="btn-secondary" onclick="NADDashboard.viewResults('${test.test_id}')">
                        <i class="fas fa-chart-line"></i> Results
                    </button>
                    <button class="btn-link" onclick="NADDashboard.downloadResults('${test.test_id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                `;
                break;
        }
        
        return buttons;
    },

    /**
     * Get empty tests HTML
     */
    getEmptyTestsHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-vial"></i>
                <h3>No Tests Yet</h3>
                <p>To activate your test kits, please visit your account at <strong>mynadtest.com</strong> where you can enter your test kit ID.</p>
                <p><small>Once activated, your tests will appear here for viewing and downloading results.</small></p>
            </div>
        `;
    },

    /**
     * Initialize charts
     */
    initializeCharts() {
        try {
            this.initTrendChart();
        } catch (error) {
            NAD.logger.error('Failed to initialize charts:', error);
        }
    },

    /**
     * Initialize trend chart
     */
    initTrendChart() {
        const canvas = document.getElementById('trend-chart');
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.charts.trend) {
            this.charts.trend.destroy();
            this.charts.trend = null;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Sample data - replace with real data
        const data = this.getTrendChartData();
        
        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#3498db',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: (context) => {
                                const testIndex = context[0].dataIndex;
                                const completedTests = this.tests.filter(test => test.status === 'completed' && test.score);
                                const test = completedTests[testIndex];
                                return test ? test.test_id : 'Test';
                            },
                            label: (context) => {
                                return `NAD+ Level: ${context.parsed.y.toFixed(1)}`;
                            },
                            afterLabel: (context) => {
                                const testIndex = context.dataIndex;
                                const completedTests = this.tests.filter(test => test.status === 'completed' && test.score);
                                const test = completedTests[testIndex];
                                if (!test) return [];
                                
                                const lines = [];
                                
                                // Add activation date
                                if (test.activated_date) {
                                    const activationDate = new Date(test.activated_date);
                                    lines.push(`Activation Date: ${activationDate.toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })}`);
                                }
                                
                                // Add completion date
                                if (test.score_date || test.created_date) {
                                    const scoreDate = new Date(test.score_date || test.created_date);
                                    lines.push(`Score Date: ${scoreDate.toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })}`);
                                }
                                
                                // Add supplements if available
                                if (test.supplements) {
                                    lines.push(''); // Empty line for spacing
                                    lines.push('Supplements:');
                                    
                                    if (typeof test.supplements === 'object' && test.supplements.selected) {
                                        if (test.supplements.selected && test.supplements.selected.length > 0) {
                                            test.supplements.selected.forEach(supplement => {
                                                const dose = supplement.amount || supplement.dose || '';
                                                const unit = supplement.unit || 'mg';
                                                const doseText = dose ? ` (${dose} ${unit})` : '';
                                                lines.push(`• ${supplement.name}${doseText}`);
                                            });
                                        }
                                        
                                        if (test.supplements.other) {
                                            lines.push(`• Other: ${test.supplements.other}`);
                                        }
                                    } else if (Array.isArray(test.supplements)) {
                                        test.supplements.forEach(supplement => {
                                            lines.push(`• ${supplement}`);
                                        });
                                    }
                                }
                                
                                return lines;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    },

    /**
     * Get trend chart data
     */
    getTrendChartData() {
        // Generate sample data based on completed tests
        const completedTests = this.tests.filter(test => test.status === 'completed' && test.score);
        
        if (completedTests.length === 0) {
            return {
                labels: ['No Data'],
                datasets: [{
                    label: 'NAD+ Score',
                    data: [0],
                    borderColor: this.config.chartColors.primary,
                    backgroundColor: this.config.chartColors.primary + '20',
                    tension: 0.4
                }]
            };
        }
        
        const labels = completedTests.map(test => 
            new Date(test.updated_date || test.created_date).toLocaleDateString()
        );
        const scores = completedTests.map(test => test.score);
        
        return {
            labels: labels,
            datasets: [{
                label: 'NAD+ Score',
                data: scores,
                borderColor: this.config.chartColors.primary,
                backgroundColor: this.config.chartColors.primary + '20',
                tension: 0.4,
                fill: true
            }]
        };
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close user menu when clicking outside
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('user-menu-dropdown');
            const menuBtn = document.querySelector('.menu-btn');
            
            if (userMenu && !menuBtn.contains(e.target)) {
                userMenu.classList.remove('show');
            }
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const section = e.state?.section || 'dashboard';
            this.showSection(section, false);
        });
    },

    /**
     * Start auto-refresh timer
     */
    startAutoRefresh() {
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.refreshDashboardData();
            }
        }, this.config.refreshInterval);
    },

    /**
     * Refresh dashboard data
     */
    async refreshDashboardData() {
        try {
            NAD.logger.debug('Refreshing dashboard data...');
            // Only reload if we're on the dashboard section
            if (this.currentSection === 'dashboard') {
                await this.loadCustomerTests();
                await this.loadCustomerStats();
                await this.loadRecentActivity();
                this.updateTrendChart();
            }
        } catch (error) {
            NAD.logger.error('Failed to refresh dashboard data:', error);
        }
    },

    /**
     * Show/hide sections
     */
    showSection(sectionName, updateHistory = true) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active from nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(`section-${sectionName}`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update nav
        const navItem = document.querySelector(`[href="#${sectionName}"]`)?.parentElement;
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Update history
        if (updateHistory) {
            history.pushState({ section: sectionName }, '', `#${sectionName}`);
        }
        
        this.currentSection = sectionName;
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    },

    /**
     * Load section-specific data
     */
    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'tests':
                await this.loadAllTests();
                break;
            case 'results':
                await this.loadResultsData();
                break;
        }
    },

    /**
     * Load all tests for tests section
     */
    async loadAllTests() {
        // Tests already loaded in loadCustomerTests()
        this.updateTestsDisplay();
    },

    /**
     * Load results data
     */
    async loadResultsData() {
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent) return;
        
        // If a specific test was selected, show its details/results
        if (this.selectedTestId) {
            const selectedTest = this.tests.find(t => t.test_id === this.selectedTestId);
            if (selectedTest) {
                if (selectedTest.status === 'completed') {
                    this.showTestResults(this.selectedTestId);
                } else if (selectedTest.status === 'activated') {
                    this.showActivatedTestDetails(this.selectedTestId);
                }
            }
            return;
        }
        
        const completedTests = this.tests.filter(test => test.status === 'completed');
        
        if (completedTests.length === 0) {
            resultsContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <h3>No Results Yet</h3>
                    <p>Complete a test to see your NAD+ results here.</p>
                </div>
            `;
            return;
        }
        
        // Create results display
        resultsContent.innerHTML = `
            <div class="results-header">
                <h3>All Test Results</h3>
                <button class="btn-link" onclick="NADDashboard.clearSelectedTest()">
                    <i class="fas fa-list"></i> View All Results
                </button>
            </div>
            <div class="results-grid">
                ${completedTests.map(test => `
                    <div class="result-card">
                        <h4>${test.test_id}</h4>
                        <p>Score: ${test.score || 'N/A'}</p>
                        <p>Completed: ${new Date(test.score_date || test.created_date).toLocaleDateString()}</p>
                        <button class="btn-primary" onclick="NADDashboard.showTestResults('${test.test_id}')">
                            View Details
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    /**
     * Show detailed results for a specific test
     */
    showTestResults(testId) {
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent) return;
        
        const test = this.tests.find(t => t.test_id === testId);
        if (!test) {
            resultsContent.innerHTML = '<p>Test not found</p>';
            return;
        }
        
        resultsContent.innerHTML = `
            <div class="results-header">
                <button class="btn-link" onclick="NADDashboard.clearSelectedTest()">
                    <i class="fas fa-arrow-left"></i> Back to All Results
                </button>
            </div>
            <div class="test-result-detail">
                <div class="result-header">
                    <h2>Test Results: ${test.test_id}</h2>
                    <div class="result-status status-${test.status}">${test.status}</div>
                </div>
                
                <div class="result-main">
                    <div class="score-display">
                        <div class="score-circle">
                            <span class="score-value">${test.score || 'N/A'}</span>
                            <span class="score-label">NAD+ Level</span>
                        </div>
                    </div>
                    
                    <div class="result-info">
                        <div class="info-row">
                            <span class="info-label">Test ID:</span>
                            <span class="info-value">${test.test_id}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Created:</span>
                            <span class="info-value">${new Date(test.created_date).toLocaleDateString()}</span>
                        </div>
                        ${test.activated_date ? `
                        <div class="info-row">
                            <span class="info-label">Activated:</span>
                            <span class="info-value">${new Date(test.activated_date).toLocaleDateString()}</span>
                        </div>
                        ` : ''}
                        ${test.score_date ? `
                        <div class="info-row">
                            <span class="info-label">Completed:</span>
                            <span class="info-value">${new Date(test.score_date).toLocaleDateString()}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                ${this.renderSupplementsSection(test)}
                
                <div class="result-actions">
                    <button class="btn-primary" onclick="NADDashboard.downloadResults('${test.test_id}')">
                        <i class="fas fa-download"></i> Download Report
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Show detailed view for an activated test
     */
    showActivatedTestDetails(testId) {
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent) return;
        
        const test = this.tests.find(t => t.test_id === testId);
        if (!test) {
            resultsContent.innerHTML = '<p>Test not found</p>';
            return;
        }
        
        resultsContent.innerHTML = `
            <div class="results-header">
                <button class="btn-link" onclick="NADDashboard.clearSelectedTest()">
                    <i class="fas fa-arrow-left"></i> Back to All Tests
                </button>
            </div>
            <div class="test-result-detail">
                <div class="result-header">
                    <h2>Test Details: ${test.test_id}</h2>
                    <div class="result-status status-${test.status}">In Lab</div>
                </div>
                
                <div class="result-main">
                    <div class="score-display">
                        <div class="score-circle" style="background: linear-gradient(135deg, var(--warning-color), #e67e22);">
                            <i class="fas fa-flask" style="font-size: 2rem;"></i>
                            <span class="score-label">Processing</span>
                        </div>
                    </div>
                    
                    <div class="result-info">
                        <div class="info-row">
                            <span class="info-label">Test ID:</span>
                            <span class="info-value">${test.test_id}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Status:</span>
                            <span class="info-value">In Lab Processing</span>
                        </div>
                        ${test.activated_date ? `
                        <div class="info-row">
                            <span class="info-label">Activated:</span>
                            <span class="info-value">${new Date(test.activated_date).toLocaleDateString()}</span>
                        </div>
                        ` : ''}
                        <div class="info-row">
                            <span class="info-label">Expected Results:</span>
                            <span class="info-value">3-5 business days</span>
                        </div>
                        ${test.notes ? `
                        <div class="info-row">
                            <span class="info-label">Notes:</span>
                            <span class="info-value">${test.notes}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                ${this.renderSupplementsSection(test)}
                
                <div class="result-actions">
                    <button class="btn-secondary" onclick="NADDashboard.showSection('tests')">
                        <i class="fas fa-list"></i> Back to My Tests
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Render supplements section for a test
     */
    renderSupplementsSection(test) {
        // Check if supplements data exists
        if (!test.supplements && !test.supplement_data) {
            return '';
        }
        
        // Handle different data structures
        let supplementsData = test.supplements || test.supplement_data;
        
        // If it's a JSON string, parse it
        if (typeof supplementsData === 'string') {
            try {
                supplementsData = JSON.parse(supplementsData);
            } catch (e) {
                NAD.logger.warn('Failed to parse supplements data:', e);
                return '';
            }
        }
        
        let supplementsHTML = `
            <div class="supplements-section">
                <h3><i class="fas fa-pills"></i> Supplements at Time of Test</h3>
                <div class="supplements-content">
        `;
        
        // Handle object structure with selected array
        if (supplementsData.selected && Array.isArray(supplementsData.selected)) {
            if (supplementsData.selected.length > 0) {
                supplementsHTML += '<div class="supplement-list">';
                supplementsData.selected.forEach(supplement => {
                    const name = supplement.name || supplement;
                    const dose = supplement.amount || supplement.dose || '';
                    const unit = supplement.unit || 'mg';
                    const frequency = supplement.frequency || '';
                    
                    supplementsHTML += `
                        <div class="supplement-item">
                            <span class="supplement-name">${name}</span>
                            ${dose ? `<span class="supplement-dose">${dose} ${unit}</span>` : ''}
                            ${frequency ? `<span class="supplement-frequency">${frequency}</span>` : ''}
                        </div>
                    `;
                });
                supplementsHTML += '</div>';
            }
            
            // Add other supplements if specified
            if (supplementsData.other) {
                supplementsHTML += `
                    <div class="supplement-other">
                        <strong>Other Supplements:</strong> ${supplementsData.other}
                    </div>
                `;
            }
            
            // Add health conditions if specified
            if (supplementsData.health_conditions) {
                supplementsHTML += `
                    <div class="supplement-conditions">
                        <strong>Health Conditions:</strong> ${supplementsData.health_conditions}
                    </div>
                `;
            }
        } 
        // Handle simple array of supplements
        else if (Array.isArray(supplementsData)) {
            supplementsHTML += '<div class="supplement-list">';
            supplementsData.forEach(supplement => {
                supplementsHTML += `
                    <div class="supplement-item">
                        <span class="supplement-name">${supplement}</span>
                    </div>
                `;
            });
            supplementsHTML += '</div>';
        }
        // Handle simple string
        else if (typeof supplementsData === 'string') {
            supplementsHTML += `<p>${supplementsData}</p>`;
        }
        // No recognizable data
        else {
            return '';
        }
        
        supplementsHTML += `
                </div>
            </div>
        `;
        
        return supplementsHTML;
    },
    
    /**
     * Clear selected test and show all results
     */
    clearSelectedTest() {
        this.selectedTestId = null;
        this.loadResultsData();
    },


    /**
     * UI Actions
     */
    toggleUserMenu() {
        const dropdown = document.getElementById('user-menu-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    },

    showLoading() {
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('dashboard-container').style.display = 'none';
        document.getElementById('auth-error').style.display = 'none';
    },

    showDashboard() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('dashboard-container').style.display = 'flex';
        document.getElementById('auth-error').style.display = 'none';
    },

    showAuthError() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('dashboard-container').style.display = 'none';
        document.getElementById('auth-error').style.display = 'flex';
    },

    showError(message) {
        alert('Error: ' + message);
    },

    /**
     * Action handlers
     */

    viewAllTests() {
        this.showSection('tests');
    },

    viewTestDetails(testId) {
        // Store the selected test ID and show in results section
        this.selectedTestId = testId;
        this.showSection('results');
        // Show detailed view for this activated test
        this.showActivatedTestDetails(testId);
    },

    viewResults(testId) {
        // Store the selected test ID
        this.selectedTestId = testId;
        this.showSection('results');
        // Show detailed results for this specific test
        this.showTestResults(testId);
    },

    viewDetailedResults(testId) {
        alert(`View detailed results for test: ${testId}`);
    },

    async downloadResults(testId) {
        try {
            if (testId) {
                // Download single test report
                const test = this.tests.find(t => t.test_id === testId);
                if (!test) {
                    alert('Test not found');
                    return;
                }
                await this.generatePDFReport(test);
            } else {
                // Download all tests report
                await this.generateAllTestsReport();
            }
        } catch (error) {
            NAD.logger.error('Failed to generate report:', error);
            alert('Failed to generate report. Please try again.');
        }
    },
    
    /**
     * Generate PDF report for a test
     */
    async generatePDFReport(test) {
        // Create a printable HTML document
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>NAD+ Test Report - ${test.test_id}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        line-height: 1.6; 
                        color: #333;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 20px;
                    }
                    .logo { 
                        max-height: 60px; 
                        margin-bottom: 10px;
                    }
                    h1 { 
                        color: #2c3e50; 
                        margin: 10px 0;
                    }
                    .report-info {
                        background: #f5f5f5;
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                    }
                    .score-section {
                        text-align: center;
                        margin: 30px 0;
                    }
                    .score-circle {
                        display: inline-block;
                        width: 150px;
                        height: 150px;
                        border-radius: 50%;
                        background: #3498db;
                        color: white;
                        line-height: 150px;
                        font-size: 48px;
                        font-weight: bold;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .info-label {
                        font-weight: bold;
                        color: #666;
                    }
                    .supplements-section {
                        margin-top: 30px;
                        padding: 20px;
                        background: #f9f9f9;
                        border-radius: 5px;
                    }
                    .supplement-item {
                        padding: 5px 0;
                        margin-left: 20px;
                    }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                    }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/shared/assets/logo.png" alt="NAD+ Test" class="logo">
                    <h1>NAD+ Test Report</h1>
                </div>
                
                <div class="report-info">
                    <div class="info-row">
                        <span class="info-label">Test ID:</span>
                        <span>${test.test_id}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Patient:</span>
                        <span>${this.user.firstName} ${this.user.lastName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span>${this.user.email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Report Date:</span>
                        <span>${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                
                ${test.status === 'completed' && test.score ? `
                <div class="score-section">
                    <h2>NAD+ Level</h2>
                    <div class="score-circle">${test.score}</div>
                    <p>Your NAD+ level score is ${test.score} out of 100</p>
                </div>
                ` : ''}
                
                <div class="test-details">
                    <h3>Test Details</h3>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span>${test.status.charAt(0).toUpperCase() + test.status.slice(1)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Created:</span>
                        <span>${new Date(test.created_date).toLocaleDateString()}</span>
                    </div>
                    ${test.activated_date ? `
                    <div class="info-row">
                        <span class="info-label">Activated:</span>
                        <span>${new Date(test.activated_date).toLocaleDateString()}</span>
                    </div>
                    ` : ''}
                    ${test.score_date ? `
                    <div class="info-row">
                        <span class="info-label">Completed:</span>
                        <span>${new Date(test.score_date).toLocaleDateString()}</span>
                    </div>
                    ` : ''}
                </div>
                
                ${this.renderSupplementsForReport(test)}
                
                <div class="footer">
                    <p>This report was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                    <p>NAD+ Test &copy; ${new Date().getFullYear()} - All rights reserved</p>
                </div>
            </body>
            </html>
        `;
        
        // Open in new window and trigger print dialog
        const printWindow = window.open('', '_blank');
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = function() {
            printWindow.print();
            
            // Optionally close the window after printing
            // printWindow.onafterprint = function() {
            //     printWindow.close();
            // };
        };
    },
    
    /**
     * Generate comprehensive report for all tests
     */
    async generateAllTestsReport() {
        const stats = this.calculateStats();
        const completedTests = this.tests.filter(test => test.status === 'completed');
        const activatedTests = this.tests.filter(test => test.status === 'activated');
        
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>NAD+ Complete Test Report - ${this.user.firstName} ${this.user.lastName}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        line-height: 1.6; 
                        color: #333;
                        max-width: 900px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 20px;
                    }
                    .logo { 
                        max-height: 60px; 
                        margin-bottom: 10px;
                    }
                    h1 { 
                        color: #2c3e50; 
                        margin: 10px 0;
                    }
                    .patient-info {
                        background: #f5f5f5;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                    }
                    .stats-summary {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .stat-box {
                        text-align: center;
                        padding: 15px;
                        background: #f9f9f9;
                        border-radius: 8px;
                        border: 1px solid #ddd;
                    }
                    .stat-number {
                        font-size: 2rem;
                        font-weight: bold;
                        color: #3498db;
                    }
                    .stat-label {
                        color: #666;
                        font-size: 0.9rem;
                    }
                    .section-title {
                        color: #2c3e50;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 10px;
                        margin: 30px 0 20px 0;
                    }
                    .test-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    .test-table th,
                    .test-table td {
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    .test-table th {
                        background: #f5f5f5;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    .status-completed { color: #27ae60; font-weight: bold; }
                    .status-activated { color: #f39c12; font-weight: bold; }
                    .status-pending { color: #e74c3c; font-weight: bold; }
                    .score-highlight {
                        background: #3498db;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                        border-top: 1px solid #ddd;
                        padding-top: 20px;
                    }
                    @media print {
                        body { padding: 0; }
                        .stats-summary { grid-template-columns: repeat(2, 1fr); }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/shared/assets/logo.png" alt="NAD+ Test" class="logo">
                    <h1>Complete NAD+ Test Report</h1>
                </div>
                
                <div class="patient-info">
                    <h3>Patient Information</h3>
                    <p><strong>Name:</strong> ${this.user.firstName} ${this.user.lastName}</p>
                    <p><strong>Email:</strong> ${this.user.email}</p>
                    <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                    <p><strong>Total Tests:</strong> ${this.tests.length}</p>
                </div>
                
                <div class="stats-summary">
                    <div class="stat-box">
                        <div class="stat-number">${stats.totalTests}</div>
                        <div class="stat-label">Total Tests</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${stats.completedTests}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${stats.activatedTests}</div>
                        <div class="stat-label">In Lab</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${stats.avgScore > 0 ? stats.avgScore : '-'}</div>
                        <div class="stat-label">Avg Score</div>
                    </div>
                </div>
                
                ${completedTests.length > 0 ? `
                <h2 class="section-title">Completed Tests (${completedTests.length})</h2>
                <table class="test-table">
                    <thead>
                        <tr>
                            <th>Test ID</th>
                            <th>Score</th>
                            <th>Created</th>
                            <th>Activated</th>
                            <th>Completed</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${completedTests.map(test => `
                            <tr>
                                <td>${test.test_id}</td>
                                <td>${test.score ? `<span class="score-highlight">${test.score}</span>` : 'N/A'}</td>
                                <td>${new Date(test.created_date).toLocaleDateString()}</td>
                                <td>${test.activated_date ? new Date(test.activated_date).toLocaleDateString() : '-'}</td>
                                <td>${test.score_date ? new Date(test.score_date).toLocaleDateString() : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}
                
                ${activatedTests.length > 0 ? `
                <h2 class="section-title">Tests in Lab Processing (${activatedTests.length})</h2>
                <table class="test-table">
                    <thead>
                        <tr>
                            <th>Test ID</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Activated</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activatedTests.map(test => `
                            <tr>
                                <td>${test.test_id}</td>
                                <td><span class="status-activated">In Lab</span></td>
                                <td>${new Date(test.created_date).toLocaleDateString()}</td>
                                <td>${test.activated_date ? new Date(test.activated_date).toLocaleDateString() : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}
                
                <div class="footer">
                    <p>This comprehensive report includes all NAD+ tests for ${this.user.firstName} ${this.user.lastName}</p>
                    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                    <p>NAD+ Test &copy; ${new Date().getFullYear()} - All rights reserved</p>
                </div>
            </body>
            </html>
        `;
        
        // Open in new window and trigger print dialog
        const printWindow = window.open('', '_blank');
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = function() {
            printWindow.print();
        };
    },
    
    /**
     * Render supplements for PDF report
     */
    renderSupplementsForReport(test) {
        if (!test.supplement_data) {
            return '';
        }
        
        let supplementsData = test.supplement_data;
        
        // Parse if string
        if (typeof supplementsData === 'string') {
            try {
                supplementsData = JSON.parse(supplementsData);
            } catch (e) {
                return '';
            }
        }
        
        let html = '<div class="supplements-section"><h3>Supplements at Time of Test</h3>';
        
        if (supplementsData.selected && Array.isArray(supplementsData.selected)) {
            supplementsData.selected.forEach(supplement => {
                const name = supplement.name || supplement;
                const dose = supplement.amount || supplement.dose || '';
                const unit = supplement.unit || 'mg';
                html += `<div class="supplement-item">• ${name} ${dose ? `(${dose} ${unit})` : ''}</div>`;
            });
            
            if (supplementsData.other) {
                html += `<div class="supplement-item"><strong>Other:</strong> ${supplementsData.other}</div>`;
            }
        }
        
        html += '</div>';
        return html;
    },
    

    exportAllResults() {
        alert('Export all results functionality coming soon!');
    },

    filterTests() {
        const statusFilter = document.getElementById('test-status-filter')?.value || '';
        const searchFilter = document.getElementById('test-search')?.value.toLowerCase() || '';
        
        let filteredTests = this.tests;
        
        if (statusFilter) {
            filteredTests = filteredTests.filter(test => test.status === statusFilter);
        }
        
        if (searchFilter) {
            filteredTests = filteredTests.filter(test => 
                test.test_id.toLowerCase().includes(searchFilter)
            );
        }
        
        // Update display with filtered tests
        const testsList = document.getElementById('tests-list');
        if (testsList) {
            const testsHTML = filteredTests.map(test => this.getTestItemHTML(test)).join('');
            testsList.innerHTML = testsHTML || this.getEmptyTestsHTML();
        }
    },

    updateTrendChart() {
        if (this.charts.trend) {
            const newData = this.getTrendChartData();
            this.charts.trend.data = newData;
            this.charts.trend.update();
        }
    },

    viewProfile() {
        alert('Profile management coming soon!');
    },

    viewSettings() {
        alert('Settings panel coming soon!');
    },

    logout() {
        sessionStorage.clear();
        window.location.href = '/customer-portal.html';
    },

    /**
     * Show User Guide modal
     */
    async showUserGuide() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        // Show loading first
        modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-body" style="text-align: center; padding: 50px;">
                        <div class="loading-spinner"></div>
                        <p>Loading User Guide...</p>
                    </div>
                </div>
            </div>
        `;
        modalContainer.style.display = 'block';

        try {
            const guideContent = await this.loadMarkdownContent('customer/help/user-guide.md');
            
            const userGuideHTML = `
                <div class="modal-overlay" onclick="NADDashboard.closeModal()">
                    <div class="modal-content user-guide-modal" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h2><i class="fas fa-book"></i> NAD+ Dashboard User Guide</h2>
                            <button class="modal-close" onclick="NADDashboard.closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${guideContent}
                        </div>
                        <div class="modal-footer">
                            <button class="btn-secondary" onclick="NADDashboard.closeModal()">Close</button>
                        </div>
                    </div>
                </div>
            `;

            modalContainer.innerHTML = userGuideHTML;
            document.body.style.overflow = 'hidden';
        } catch (error) {
            NAD.logger.error('Failed to load User Guide:', error);
            modalContainer.innerHTML = `
                <div class="modal-overlay" onclick="NADDashboard.closeModal()">
                    <div class="modal-content" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h2>Error</h2>
                            <button class="modal-close" onclick="NADDashboard.closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p>Failed to load User Guide content. Please try again later.</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-secondary" onclick="NADDashboard.closeModal()">Close</button>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    /**
     * Close modal
     */
    closeModal() {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.innerHTML = '';
            modalContainer.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    },

    /**
     * Load and parse markdown content
     */
    async loadMarkdownContent(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load ${filePath}: ${response.status}`);
            }
            
            const markdownText = await response.text();
            
            // Configure marked options for better rendering
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: true,
                mangle: false
            });
            
            // Convert markdown to HTML
            let html = marked.parse(markdownText);
            
            // Post-process the HTML to add our custom classes
            html = this.processMarkdownHTML(html);
            
            return html;
        } catch (error) {
            NAD.logger.error('Error loading markdown content:', error);
            throw error;
        }
    },

    /**
     * Process the converted HTML to add custom classes and structure
     */
    processMarkdownHTML(html) {
        // Create a temporary div to manipulate the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Add classes to different elements for FAQ and Guide styling
        
        // Convert h2 elements to section headers
        const h2Elements = tempDiv.querySelectorAll('h2');
        h2Elements.forEach(h2 => {
            const section = document.createElement('div');
            section.className = 'faq-section';
            
            // Create section header
            const header = document.createElement('h3');
            header.innerHTML = h2.innerHTML;
            section.appendChild(header);
            
            // Move all following elements until next h2 into this section
            let nextElement = h2.nextElementSibling;
            while (nextElement && nextElement.tagName !== 'H2') {
                const elementToMove = nextElement;
                nextElement = nextElement.nextElementSibling;
                section.appendChild(elementToMove);
            }
            
            h2.parentNode.replaceChild(section, h2);
        });
        
        // Convert h3 elements to FAQ items
        const h3Elements = tempDiv.querySelectorAll('h3');
        h3Elements.forEach(h3 => {
            // Skip if it's already in a faq-section header (from h2 conversion)
            if (h3.parentElement && h3.parentElement.classList.contains('faq-section')) {
                return;
            }
            
            const faqItem = document.createElement('div');
            faqItem.className = 'faq-item';
            
            // Create question
            const question = document.createElement('div');
            question.className = 'faq-question';
            question.innerHTML = `
                <h4>${h3.innerHTML}</h4>
                <i class="fas fa-chevron-down"></i>
            `;
            
            // Create answer container
            const answer = document.createElement('div');
            answer.className = 'faq-answer';
            
            // Move all following elements until next h3 into the answer
            let nextElement = h3.nextElementSibling;
            while (nextElement && nextElement.tagName !== 'H3' && nextElement.tagName !== 'H2') {
                const elementToMove = nextElement;
                nextElement = nextElement.nextElementSibling;
                answer.appendChild(elementToMove);
            }
            
            faqItem.appendChild(question);
            faqItem.appendChild(answer);
            
            h3.parentNode.replaceChild(faqItem, h3);
        });
        
        // Style blockquotes as callouts
        const blockquotes = tempDiv.querySelectorAll('blockquote');
        blockquotes.forEach(blockquote => {
            blockquote.className = 'faq-callout';
            // Add info icon
            const icon = document.createElement('i');
            icon.className = 'fas fa-info-circle';
            blockquote.insertBefore(icon, blockquote.firstChild);
            
            // Wrap content in div
            const content = document.createElement('div');
            Array.from(blockquote.childNodes).slice(1).forEach(node => {
                content.appendChild(node);
            });
            blockquote.appendChild(content);
        });
        
        return tempDiv.innerHTML;
    },

    /**
     * Show FAQ modal
     */
    async showFAQ() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        // Show loading first
        modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-body" style="text-align: center; padding: 50px;">
                        <div class="loading-spinner"></div>
                        <p>Loading FAQ...</p>
                    </div>
                </div>
            </div>
        `;
        modalContainer.style.display = 'block';

        try {
            const faqContent = await this.loadMarkdownContent('customer/help/faq.md');
            
            const faqHTML = `
                <div class="modal-overlay" onclick="NADDashboard.closeModal()">
                    <div class="modal-content faq-modal" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h2><i class="fas fa-question-circle"></i> Frequently Asked Questions</h2>
                            <button class="modal-close" onclick="NADDashboard.closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${faqContent}
                        </div>
                        <div class="modal-footer">
                            <button class="btn-secondary" onclick="NADDashboard.closeModal()">Close</button>
                        </div>
                    </div>
                </div>
            `;

            modalContainer.innerHTML = faqHTML;
            document.body.style.overflow = 'hidden';
            
            // Add click handlers for FAQ items
            this.setupFAQHandlers();
        } catch (error) {
            NAD.logger.error('Failed to load FAQ:', error);
            modalContainer.innerHTML = `
                <div class="modal-overlay" onclick="NADDashboard.closeModal()">
                    <div class="modal-content" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h2>Error</h2>
                            <button class="modal-close" onclick="NADDashboard.closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p>Failed to load FAQ content. Please try again later.</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-secondary" onclick="NADDashboard.closeModal()">Close</button>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    /**
     * Setup FAQ expand/collapse handlers
     */
    setupFAQHandlers() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.parentElement;
                const isActive = faqItem.classList.contains('active');
                
                // Close all other FAQ items
                document.querySelectorAll('.faq-item.active').forEach(item => {
                    if (item !== faqItem) {
                        item.classList.remove('active');
                    }
                });
                
                // Toggle current item
                faqItem.classList.toggle('active');
            });
        });
    }
};

// Initialize when DOM is loaded (prevent double initialization)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.nadDashboardInitialized) {
            window.nadDashboardInitialized = true;
            NADDashboard.init();
        }
    });
} else {
    if (!window.nadDashboardInitialized) {
        window.nadDashboardInitialized = true;
        NADDashboard.init();
    }
}