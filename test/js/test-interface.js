class TestInterface {
    constructor() {
        this.currentSection = 'overview';
        this.apiResults = new Map();
        this.testHistory = [];
        
        this.init();
    }
    
    async init() {
        await this.loadComponents();
        await this.setupNavigation();
        await this.runInitialHealthCheck();
        
        console.log('🧪 Test Interface initialized');
    }
    
    async loadComponents() {
        // Load header
        await ComponentLoader.loadComponent(
            'test/components/header.html',
            document.getElementById('header-container')
        );
        
        // Load status panel
        await ComponentLoader.loadComponent(
            'test/components/status-panel.html',
            document.getElementById('status-bar-container')
        );
        
        // Load initial section
        await this.loadSection('overview');
    }
    
    async loadSection(sectionName) {
        this.currentSection = sectionName;
        
        await ComponentLoader.loadSection(
            `test/sections/${sectionName}.html`,
            document.getElementById('content-container')
        );
        
        // Initialize section-specific functionality
        this.initializeSection(sectionName);
    }
    
    initializeSection(sectionName) {
        switch(sectionName) {
            case 'overview':
                this.initOverview();
                break;
            case 'api-testing':
                this.initApiTesting();
                break;
            case 'database-testing':
                this.initDatabaseTesting();
                break;
            // Add other sections...
        }
    }
    
    // Section initialization methods
    initOverview() {
        this.runEnvironmentCheck();
    }
    
    initApiTesting() {
        this.loadEndpointList();
        this.setupApiTestForm();
    }
    
    // Testing methods
    async runHealthCheck() {
        console.log('🔍 Running full health check...');
        
        const tests = [
            this.testApiHealth(),
            this.testDatabaseConnection(),
            this.testWebhookEndpoints(),
            this.testAuthentication()
        ];
        
        const results = await Promise.allSettled(tests);
        this.displayHealthCheckResults(results);
    }
    
    async testApiHealth() {
        try {
            const response = await ApiClient.get('/health');
            return { test: 'API Health', status: 'pass', data: response };
        } catch (error) {
            return { test: 'API Health', status: 'fail', error: error.message };
        }
    }
    
    // Additional test methods...
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.testInterface = new TestInterface();
});
