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
            await Promise.all([
                this.loadCustomerTests(),
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
            
            if (response.success) {
                this.tests = response.data.tests || [];
                this.updateTestsDisplay();
                return;
            } else {
                NAD.logger.warn('No tests found for customer');
                this.tests = [];
            }
            
        } catch (error) {
            NAD.logger.error('Failed to load customer tests:', error);
        }
        
        // Always check for mock data fallback when API fails or returns no data
        NAD.logger.debug('Checking for mock data fallback. User email:', this.user?.email);
        if (this.user && this.user.email === 'john.doe@example.com') {
            NAD.logger.info('🎭 Using mock data for John Doe');
            this.tests = [
                {
                    test_id: '2025-07-108-66LPBA',
                    status: 'completed',
                    score: 85,
                    created_date: '2025-07-20',
                    activated_date: '2025-07-21',
                    updated_date: '2025-07-25'
                },
                {
                    test_id: '2025-07-095-4A7B2C',
                    status: 'activated',
                    created_date: '2025-07-15',
                    activated_date: '2025-07-16'
                },
                {
                    test_id: '2025-07-082-9X8Y7Z',
                    status: 'pending',
                    created_date: '2025-07-10'
                }
            ];
            NAD.logger.info('📊 Mock data loaded: ', this.tests.length, 'tests');
            this.updateTestsDisplay();
        } else {
            NAD.logger.warn('❌ No mock data available for user:', this.user?.email || 'unknown');
            this.tests = this.tests || [];
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
        const pendingTests = this.tests.filter(test => test.status === 'pending').length;
        const activatedTests = this.tests.filter(test => test.status === 'activated').length;
        
        // Calculate average score
        const completedWithScores = this.tests.filter(test => 
            test.status === 'completed' && test.score && test.score > 0
        );
        const avgScore = completedWithScores.length > 0 
            ? Math.round(completedWithScores.reduce((sum, test) => sum + test.score, 0) / completedWithScores.length)
            : 0;
        
        return {
            totalTests,
            completedTests,
            pendingTests,
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
            'pending-tests': stats.pendingTests,
            'avg-score': stats.avgScore > 0 ? stats.avgScore : '-'
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
        const testsList = document.getElementById('tests-list');
        if (!testsList) return;
        
        if (this.tests.length === 0) {
            testsList.innerHTML = this.getEmptyTestsHTML();
            return;
        }
        
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
        const date = new Date(test.created_date).toLocaleDateString();
        
        return `
            <div class="test-item">
                <div class="test-details">
                    <h4>${test.test_id}</h4>
                    <p>Created: ${date}</p>
                    ${test.activated_date ? `<p>Activated: ${new Date(test.activated_date).toLocaleDateString()}</p>` : ''}
                </div>
                <div class="test-actions">
                    <span class="test-status ${statusClass}">${test.status}</span>
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
            case 'pending':
                buttons = `<button class="btn-primary" onclick="NADDashboard.activateTest('${test.test_id}')">
                    <i class="fas fa-play"></i> Activate
                </button>`;
                break;
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
                <p>Get started by activating your first NAD+ test kit.</p>
                <button class="btn-primary" onclick="NADDashboard.activateNewTest()">
                    <i class="fas fa-plus"></i> Activate Test Kit
                </button>
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
                plugins: {
                    legend: {
                        display: false
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
            await this.loadCustomerTests();
            await this.loadCustomerStats();
            this.updateTrendChart();
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
            case 'supplements':
                await this.loadSupplementsData();
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
        resultsContent.innerHTML = completedTests.map(test => `
            <div class="result-card">
                <h4>${test.test_id}</h4>
                <p>Score: ${test.score || 'N/A'}</p>
                <p>Completed: ${new Date(test.updated_date).toLocaleDateString()}</p>
                <button class="btn-primary" onclick="NADDashboard.viewDetailedResults('${test.test_id}')">
                    View Details
                </button>
            </div>
        `).join('');
    },

    /**
     * Load supplements data
     */
    async loadSupplementsData() {
        const supplementsContent = document.getElementById('supplements-content');
        if (!supplementsContent) return;
        
        supplementsContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-pills"></i>
                <h3>Supplement Recommendations</h3>
                <p>Complete a test to receive personalized supplement recommendations.</p>
            </div>
        `;
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
    async activateNewTest() {
        const testId = prompt('Enter your test kit ID:');
        if (testId) {
            await this.activateTest(testId);
        }
    },

    async activateTest(testId) {
        try {
            const response = await NAD.API.request('/api/customer/activate', {
                method: 'POST',
                data: {
                    testId: testId,
                    email: this.user.email,
                    customerId: this.user.customerId
                }
            });
            
            if (response.success) {
                alert('Test activated successfully!');
                await this.refreshDashboardData();
            } else {
                alert('Failed to activate test: ' + (response.error || 'Unknown error'));
            }
        } catch (error) {
            NAD.logger.error('Test activation failed:', error);
            alert('Failed to activate test. Please try again.');
        }
    },

    viewAllTests() {
        this.showSection('tests');
    },

    viewTestDetails(testId) {
        alert(`View details for test: ${testId}`);
    },

    viewResults(testId) {
        this.showSection('results');
    },

    viewDetailedResults(testId) {
        alert(`View detailed results for test: ${testId}`);
    },

    downloadResults(testId) {
        alert(`Download results for test: ${testId || 'all tests'}`);
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