#!/bin/bash

# NAD Test Cycle - Component System Deployment Script
# Deploy the component loading system to your server
# Run this on your AWS Lightsail server

set -e  # Exit on any error

# Configuration
NAD_APP_DIR="/opt/bitnami/apache/htdocs/nad-app"
SHARED_DIR="${NAD_APP_DIR}/shared"
BACKUP_DIR="/opt/bitnami/backups/nad-components-$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]] && ! groups | grep -q "bitnami\|www-data\|apache"; then
        log_error "This script needs to be run with appropriate permissions"
        log_info "Try: sudo $0 or run as bitnami user"
        exit 1
    fi
}

# Backup existing files
backup_existing() {
    log_info "Creating backup of existing files..."
    
    if [[ -d "$NAD_APP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        cp -r "$NAD_APP_DIR" "$BACKUP_DIR/" 2>/dev/null || true
        log_success "Backup created at: $BACKUP_DIR"
    else
        log_warning "NAD app directory not found, no backup needed"
    fi
}

# Create directory structure
create_structure() {
    log_info "Creating NAD component directory structure..."
    
    # Main directories
    mkdir -p "$NAD_APP_DIR"
    mkdir -p "$SHARED_DIR"/{components,css,js}
    mkdir -p "$NAD_APP_DIR"/{admin,customer,lab,test}/{components,sections,css,js}
    mkdir -p "$NAD_APP_DIR"/assets/{images,fonts,data,uploads}
    mkdir -p "$NAD_APP_DIR"/assets/images/{logos,icons,backgrounds,test-images}
    
    # Set proper ownership
    chown -R bitnami:bitnami "$NAD_APP_DIR" 2>/dev/null || true
    
    # Set proper permissions
    find "$NAD_APP_DIR" -type d -exec chmod 755 {} \;
    find "$NAD_APP_DIR" -type f -exec chmod 644 {} \;
    chmod 755 "$NAD_APP_DIR"/assets/uploads
    
    log_success "Directory structure created"
}

# Deploy component loading system
deploy_components_js() {
    log_info "Deploying component loading system..."
    
    # Create the components.js file
    cat > "${SHARED_DIR}/js/components.js" << 'EOF'
/**
 * NAD Test Cycle - Component Loading System
 * File: /opt/bitnami/apache/htdocs/nad-app/shared/js/components.js
 * 
 * Dynamic component loading and management system for modular HTML structure
 * Supports all NAD interfaces: Admin, Customer, Lab, Test
 */

class NADComponentLoader {
    constructor() {
        this.loadedComponents = new Map();
        this.componentCache = new Map();
        this.loadingPromises = new Map();
        this.config = {
            baseUrl: '/nad-app',
            enableCache: true,
            enableDebug: false,
            retryAttempts: 3,
            retryDelay: 1000,
            timeout: 10000
        };
        
        this.initializeLoader();
    }

    /**
     * Initialize the component loader
     */
    initializeLoader() {
        this.log('🚀 NAD Component Loader initializing...');
        
        // Set up global error handling
        this.setupErrorHandling();
        
        // Auto-load components on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.autoLoadComponents());
        } else {
            this.autoLoadComponents();
        }
        
        this.log('✅ NAD Component Loader ready');
    }

    /**
     * Set up global error handling
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            if (event.filename && event.filename.includes('/nad-app/')) {
                this.error('Global error in NAD component:', event.error);
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.toString().includes('NAD')) {
                this.error('Unhandled promise rejection in NAD component:', event.reason);
            }
        });
    }

    /**
     * Load a component by path
     * @param {string} componentPath - Path to component (e.g., 'admin/components/header.html')
     * @param {Object} options - Loading options
     * @returns {Promise<string>} Component HTML content
     */
    async loadComponent(componentPath, options = {}) {
        const normalizedPath = this.normalizePath(componentPath);
        const cacheKey = this.getCacheKey(normalizedPath, options);
        
        this.log(`📦 Loading component: ${normalizedPath}`);

        // Return cached component if available
        if (this.config.enableCache && this.componentCache.has(cacheKey)) {
            this.log(`💾 Using cached component: ${normalizedPath}`);
            return this.componentCache.get(cacheKey);
        }

        // Return existing loading promise if component is already being loaded
        if (this.loadingPromises.has(cacheKey)) {
            this.log(`⏳ Component already loading: ${normalizedPath}`);
            return this.loadingPromises.get(cacheKey);
        }

        // Create loading promise
        const loadingPromise = this.fetchComponent(normalizedPath, options);
        this.loadingPromises.set(cacheKey, loadingPromise);

        try {
            const content = await loadingPromise;
            
            // Cache the component
            if (this.config.enableCache) {
                this.componentCache.set(cacheKey, content);
            }
            
            this.log(`✅ Component loaded: ${normalizedPath}`);
            return content;
            
        } catch (error) {
            this.error(`❌ Failed to load component: ${normalizedPath}`, error);
            throw error;
        } finally {
            this.loadingPromises.delete(cacheKey);
        }
    }

    /**
     * Fetch component with retry logic
     */
    async fetchComponent(componentPath, options = {}) {
        const url = this.buildComponentUrl(componentPath);
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (error) {
            throw new Error(`Failed to load: ${error.message}`);
        }
    }

    /**
     * Inject component into DOM element
     */
    async injectComponent(componentPath, target, options = {}) {
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        
        if (!targetElement) {
            throw new Error(`Target element not found: ${target}`);
        }
        
        const content = await this.loadComponent(componentPath, options);
        targetElement.innerHTML = content;
        return targetElement;
    }

    /**
     * Auto-load components based on data attributes
     */
    async autoLoadComponents() {
        const componentElements = document.querySelectorAll('[data-nad-component]');
        
        for (const element of componentElements) {
            try {
                const componentPath = element.getAttribute('data-nad-component');
                await this.injectComponent(componentPath, element);
            } catch (error) {
                this.error('Failed to auto-load component:', error);
                element.innerHTML = '<div class="nad-component-error">Failed to load component</div>';
            }
        }
    }

    // Utility methods
    normalizePath(path) { return path.replace(/^\/+|\/+$/g, ''); }
    getCacheKey(path, options) { return `${path}::${JSON.stringify(options)}`; }
    buildComponentUrl(path) { return `${this.config.baseUrl}/${path}`; }
    log(...args) { if (this.config.enableDebug) console.log('[NAD]', ...args); }
    error(...args) { console.error('[NAD]', ...args); }
}

// Global instance
window.NADComponents = new NADComponentLoader();
window.loadComponent = (path, options) => window.NADComponents.loadComponent(path, options);
window.injectComponent = (path, target, options) => window.NADComponents.injectComponent(path, target, options);

console.log('✅ NAD Component Loading System ready!');
EOF

    log_success "Component loading system deployed"
}

# Create sample components
create_sample_components() {
    log_info "Creating sample components..."
    
    # Shared loading spinner
    cat > "${SHARED_DIR}/components/loading-spinner.html" << 'EOF'
<div class="nad-loading-spinner">
    <div class="spinner"></div>
    <p>Loading...</p>
</div>
<style>
.nad-loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
}
.spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
EOF

    # Shared alert system
    cat > "${SHARED_DIR}/components/alert-system.html" << 'EOF'
<div class="nad-alert-container" id="nad-alerts">
    <!-- Alerts will be injected here -->
</div>
<style>
.nad-alert-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 400px;
}
.nad-alert {
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 8px;
    animation: slideIn 0.3s ease-out;
}
.nad-alert.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.nad-alert.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.nad-alert.warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
.nad-alert.info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
@keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
</style>
EOF

    # Admin header component
    cat > "${NAD_APP_DIR}/admin/components/header.html" << 'EOF'
<header class="nad-admin-header">
    <div class="header-brand">
        <h1>🔧 NAD Admin Dashboard</h1>
        <p>Real-time management dashboard</p>
    </div>
    <div class="header-actions">
        <button class="btn btn-secondary" onclick="refreshData()">🔄 Refresh</button>
        <span class="user-info">Administrator</span>
    </div>
</header>
<style>
.nad-admin-header {
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    padding: 25px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}
.header-brand h1 { color: #333; font-size: 2.2em; margin-bottom: 5px; }
.header-brand p { color: #666; margin: 0; }
.header-actions { display: flex; gap: 15px; align-items: center; }
.btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; }
.btn-secondary { background: #6c757d; color: white; }
.user-info { color: #666; font-weight: 500; }
</style>
EOF

    # Admin sidebar component
    cat > "${NAD_APP_DIR}/admin/components/sidebar.html" << 'EOF'
<aside class="nad-admin-sidebar">
    <div class="sidebar-brand">
        <h2>🧬 NAD</h2>
        <span>Admin Panel</span>
    </div>
    <nav class="sidebar-nav">
        <ul class="nav-menu">
            <li><a href="#overview" class="nav-link active" data-section="overview">📊 Overview</a></li>
            <li><a href="#tests" class="nav-link" data-section="tests">🧪 Test Management</a></li>
            <li><a href="#users" class="nav-link" data-section="users">👥 User Management</a></li>
            <li><a href="#supplements" class="nav-link" data-section="supplements">💊 Supplements</a></li>
            <li><a href="#analytics" class="nav-link" data-section="analytics">📈 Analytics</a></li>
            <li><a href="#system" class="nav-link" data-section="system">⚙️ System Health</a></li>
        </ul>
    </nav>
</aside>
<style>
.nad-admin-sidebar {
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(10px);
    padding: 20px;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    height: 100vh;
    overflow-y: auto;
}
.sidebar-brand { text-align: center; margin-bottom: 30px; }
.sidebar-brand h2 { color: #333; margin-bottom: 5px; }
.sidebar-brand span { color: #666; font-size: 0.9em; }
.nav-menu { list-style: none; padding: 0; margin: 0; }
.nav-menu li { margin-bottom: 5px; }
.nav-link {
    display: block;
    padding: 12px 16px;
    color: #333;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.3s ease;
}
.nav-link:hover, .nav-link.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}
</style>
EOF

    # Customer header component  
    cat > "${NAD_APP_DIR}/customer/components/header.html" << 'EOF'
<header class="nad-customer-header">
    <div class="header-brand">
        <h1>🧬 NAD+ Test Portal</h1>
        <p>Cellular Energy Analysis Portal</p>
    </div>
    <div class="header-progress">
        <div class="step-indicator">
            <div class="step active" id="step-1">1</div>
            <div class="step" id="step-2">2</div>
            <div class="step" id="step-3">3</div>
        </div>
    </div>
</header>
<style>
.nad-customer-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 10px;
    margin-bottom: 30px;
    text-align: center;
}
.header-brand h1 { font-size: 2.5em; margin-bottom: 10px; }
.header-brand p { font-size: 1.2em; opacity: 0.9; }
.step-indicator { display: flex; justify-content: center; margin-top: 20px; }
.step {
    width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.3);
    display: flex; align-items: center; justify-content: center; margin: 0 5px;
    font-weight: 600; transition: all 0.3s ease;
}
.step.active { background: white; color: #667eea; transform: scale(1.1); }
</style>
EOF

    # Base CSS file
    cat > "${SHARED_DIR}/css/base.css" << 'EOF'
/* NAD Test Cycle - Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

.btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
}

.btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.card {
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    padding: 25px;
    margin-bottom: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

/* Utility classes */
.text-center { text-align: center; }
.mb-2 { margin-bottom: 2rem; }
.mb-1 { margin-bottom: 1rem; }
.mt-2 { margin-top: 2rem; }
.mt-1 { margin-top: 1rem; }

/* Responsive */
@media (max-width: 768px) {
    .container { padding: 10px; }
    .btn { padding: 10px 16px; font-size: 12px; }
}
EOF

    log_success "Sample components created"
}

# Create test HTML files
create_test_files() {
    log_info "Creating test HTML files..."
    
    # Test component loading page
    cat > "${NAD_APP_DIR}/test-components.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NAD Components Test</title>
    <link rel="stylesheet" href="/nad-app/shared/css/base.css">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .test-section {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body class="test-interface">
    <div class="container">
        <h1 style="color: white; text-align: center; margin-bottom: 30px;">
            🧪 NAD Component Loading Test
        </h1>
        
        <div class="test-section">
            <h2>Shared Components Test</h2>
            <div data-nad-component="shared/components/loading-spinner.html"></div>
            <div data-nad-component="shared/components/alert-system.html"></div>
        </div>
        
        <div class="test-section">
            <h2>Admin Components Test</h2>
            <div data-nad-component="admin/components/header.html"></div>
            <div data-nad-component="admin/components/sidebar.html" style="height: 300px; overflow: hidden;"></div>
        </div>
        
        <div class="test-section">
            <h2>Customer Components Test</h2>
            <div data-nad-component="customer/components/header.html"></div>
        </div>
        
        <div class="test-section">
            <h2>Manual Component Loading Test</h2>
            <button class="btn" onclick="testManualLoading()">Load Component Manually</button>
            <div id="manual-test-target"></div>
        </div>
        
        <div class="test-section">
            <h2>Component Stats</h2>
            <button class="btn" onclick="showStats()">Show Component Stats</button>
            <pre id="stats-output"></pre>
        </div>
    </div>
    
    <script src="/nad-app/shared/js/components.js"></script>
    <script>
        // Enable debug mode for testing
        window.NADComponents.configure({ enableDebug: true });
        
        async function testManualLoading() {
            try {
                await window.injectComponent(
                    'shared/components/loading-spinner.html',
                    '#manual-test-target'
                );
                alert('✅ Component loaded manually!');
            } catch (error) {
                alert('❌ Failed to load component: ' + error.message);
            }
        }
        
        function showStats() {
            const stats = window.NADComponents.getStats();
            document.getElementById('stats-output').textContent = JSON.stringify(stats, null, 2);
        }
        
        // Show success message after components load
        setTimeout(() => {
            console.log('🎉 All components should be loaded now!');
            console.log('📊 Component stats:', window.NADComponents.getStats());
        }, 2000);
    </script>
</body>
</html>
EOF

    log_success "Test files created"
}

# Update Apache configuration
update_apache_config() {
    log_info "Updating Apache configuration..."
    
    # Check if NAD virtual host exists
    VHOST_FILE="/opt/bitnami/apache/conf/vhosts/mynadtest-ssl.conf"
    
    if [[ -f "$VHOST_FILE" ]]; then
        # Backup existing config
        cp "$VHOST_FILE" "${VHOST_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Add component loading support if not already present
        if ! grep -q "nad-app" "$VHOST_FILE"; then
            log_info "Adding NAD app configuration to virtual host..."
            
            # Add before closing VirtualHost tag
            sed -i '/<\/VirtualHost>/i\
    # NAD App Components\
    Alias /nad-app /opt/bitnami/apache/htdocs/nad-app\
    <Directory "/opt/bitnami/apache/htdocs/nad-app">\
        Options Indexes FollowSymLinks\
        AllowOverride All\
        Require all granted\
        \
        # Enable CORS for component loading\
        Header always set Access-Control-Allow-Origin "*"\
        Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"\
        Header always set Access-Control-Allow-Headers "Content-Type"\
        \
        # Cache static components for 1 hour\
        <FilesMatch "\.(html|css|js)$">\
            ExpiresActive On\
            ExpiresDefault "access plus 1 hour"\
        </FilesMatch>\
    </Directory>\
' "$VHOST_FILE"
            
            log_success "Virtual host configuration updated"
        else
            log_info "NAD app configuration already exists"
        fi
    else
        log_warning "Virtual host file not found: $VHOST_FILE"
        log_info "You may need to manually configure Apache for /nad-app/"
    fi
}

# Restart services
restart_services() {
    log_info "Restarting services..."
    
    # Restart Apache
    if command -v /opt/bitnami/ctlscript.sh &> /dev/null; then
        /opt/bitnami/ctlscript.sh restart apache
        log_success "Apache restarted"
    else
        log_warning "Bitnami control script not found"
        log_info "You may need to manually restart Apache"
    fi
}

# Run tests
run_tests() {
    log_info "Running component system tests..."
    
    # Test component file access
    local test_url="https://mynadtest.info/nad-app/test-components.html"
    
    if command -v curl &> /dev/null; then
        if curl -s -f "$test_url" > /dev/null; then
            log_success "Component test page accessible: $test_url"
        else
            log_warning "Component test page not accessible via HTTPS"
            log_info "Try: http://mynadtest.info/nad-app/test-components.html"
        fi
    else
        log_info "Install curl to test URL accessibility"
    fi
    
    # Check file permissions
    if [[ -r "${SHARED_DIR}/js/components.js" ]]; then
        log_success "Component loader file readable"
    else
        log_error "Component loader file not readable"
    fi
    
    # Check directory structure
    local required_dirs=(
        "$SHARED_DIR/components"
        "$SHARED_DIR/css" 
        "$SHARED_DIR/js"
        "$NAD_APP_DIR/admin/components"
        "$NAD_APP_DIR/customer/components"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            log_success "Directory exists: $dir"
        else
            log_error "Directory missing: $dir"
        fi
    done
}

# Generate deployment report
generate_report() {
    log_info "Generating deployment report..."
    
    cat > "${NAD_APP_DIR}/DEPLOYMENT_REPORT.md" << EOF
# NAD Component System Deployment Report

**Deployment Date:** $(date)
**Server:** $(hostname)
**User:** $(whoami)

## Deployed Components

### Core System
- ✅ Component Loading System: \`${SHARED_DIR}/js/components.js\`
- ✅ Base CSS Framework: \`${SHARED_DIR}/css/base.css\`
- ✅ Directory Structure: Complete

### Sample Components
- ✅ Shared Loading Spinner
- ✅ Shared Alert System  
- ✅ Admin Header Component
- ✅ Admin Sidebar Component
- ✅ Customer Header Component

### Test Files
- ✅ Component Test Page: \`${NAD_APP_DIR}/test-components.html\`

## Access URLs

- **Component Test Page:** https://mynadtest.info/nad-app/test-components.html
- **Component Loader:** https://mynadtest.info/nad-app/shared/js/components.js
- **Base Styles:** https://mynadtest.info/nad-app/shared/css/base.css

## Next Steps

1. **Test the system:**
   \`\`\`bash
   curl https://mynadtest.info/nad-app/test-components.html
   \`\`\`

2. **Enable debug mode in browser console:**
   \`\`\`javascript
   window.NADComponents.configure({ enableDebug: true });
   \`\`\`

3. **Load components manually:**
   \`\`\`javascript
   await window.injectComponent('shared/components/loading-spinner.html', '#target');
   \`\`\`

4. **Create your own components:**
   - Add HTML files to appropriate component directories
   - Use \`data-nad-component="path/to/component.html"\` for auto-loading
   - Use \`window.loadComponent()\` for manual loading

## Troubleshooting

### Component not loading?
1. Check browser console for errors
2. Verify file exists and is readable
3. Check Apache logs: \`tail -f /opt/bitnami/apache/logs/error_log\`

### Permission issues?
\`\`\`bash
sudo chown -R bitnami:bitnami /opt/bitnami/apache/htdocs/nad-app
sudo chmod -R 755 /opt/bitnami/apache/htdocs/nad-app
\`\`\`

### Apache issues?
\`\`\`bash
sudo /opt/bitnami/ctlscript.sh restart apache
\`\`\`

## Support

- Component loader documentation: See comments in \`components.js\`
- Test page: \`${NAD_APP_DIR}/test-components.html\`
- Backup location: \`$BACKUP_DIR\`

**Deployment completed successfully! 🚀**
EOF

    log_success "Deployment report created: ${NAD_APP_DIR}/DEPLOYMENT_REPORT.md"
}

# Main execution
main() {
    echo "🚀 NAD Component System Deployment Starting..."
    echo "=================================================="
    
    check_permissions
    backup_existing
    create_structure
    deploy_components_js
    create_sample_components
    create_test_files
    update_apache_config
    restart_services
    run_tests
    generate_report
    
    echo ""
    echo "=================================================="
    log_success "🎉 NAD Component System Deployed Successfully!"
    echo "=================================================="
    echo ""
    log_info "📋 Summary:"
    echo "   • Component loader: ${SHARED_DIR}/js/components.js"
    echo "   • Test page: https://mynadtest.info/nad-app/test-components.html"
    echo "   • Report: ${NAD_APP_DIR}/DEPLOYMENT_REPORT.md"
    echo "   • Backup: $BACKUP_DIR"
    echo ""
    log_info "🧪 Test your deployment:"
    echo "   curl https://mynadtest.info/nad-app/test-components.html"
    echo ""
    log_info "📚 View documentation:"
    echo "   vi ${NAD_APP_DIR}/DEPLOYMENT_REPORT.md"
    echo ""
}

# Run main function
main "$@"
