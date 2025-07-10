#!/bin/bash
# NAD Test Cycle - Phase 1 Foundation Deployment Script
# Creates foundation files and validates deployment
# Target: /opt/bitnami/apache/htdocs/nad-app/

set -e

echo "🚀 NAD Test Cycle - Phase 1 Foundation Deployment"
echo "=================================================="
echo "📅 Date: $(date)"
echo "🎯 Target: AWS Lightsail with Bitnami LAMP Stack"
echo "🌐 Domain: mynadtest.info"
echo ""

# Configuration
BASE_DIR="/opt/bitnami/apache/htdocs/nad-app"
BACKUP_DIR="/home/bitnami/nad-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check if running as appropriate user
check_permissions() {
    log_info "Checking permissions..."
    
    if [ "$EUID" -eq 0 ]; then
        log_warning "Running as root. Consider using bitnami user."
    fi
    
    if [ ! -d "/opt/bitnami" ]; then
        log_error "Bitnami directory not found. Are you on the correct server?"
        exit 1
    fi
    
    log_success "Permissions check passed"
}

# Create backup of existing files
create_backup() {
    log_info "Creating backup of existing files..."
    
    sudo mkdir -p "$BACKUP_DIR"
    
    if [ -d "$BASE_DIR" ]; then
        sudo tar -czf "$BACKUP_DIR/nad-app-backup-$TIMESTAMP.tar.gz" -C "$(dirname "$BASE_DIR")" "$(basename "$BASE_DIR")"
        log_success "Backup created: $BACKUP_DIR/nad-app-backup-$TIMESTAMP.tar.gz"
    else
        log_info "No existing installation found, skipping backup"
    fi
}

# Create directory structure
create_directories() {
    log_info "Creating directory structure..."
    
    # Create main directory
    sudo mkdir -p "$BASE_DIR"
    
    # Create shared infrastructure
    sudo mkdir -p "$BASE_DIR/shared/"{components,css,js}
    
    # Create module directories
    sudo mkdir -p "$BASE_DIR/admin/"{components,sections,css,js/sections}
    sudo mkdir -p "$BASE_DIR/customer/"{components,sections,css,js}
    sudo mkdir -p "$BASE_DIR/lab/"{components,sections,css,js}
    sudo mkdir -p "$BASE_DIR/test/"{components,sections,css,js}
    
    # Create assets directories
    sudo mkdir -p "$BASE_DIR/assets/"{images/{logos,icons,backgrounds,test-images},fonts,data,uploads}
    
    # Set proper permissions
    sudo chown -R bitnami:bitnami "$BASE_DIR"
    sudo chmod -R 755 "$BASE_DIR"
    sudo chmod -R 777 "$BASE_DIR/assets/uploads"
    
    log_success "Directory structure created"
}

# Deploy foundation files
deploy_foundation_files() {
    log_info "Deploying Phase 1 foundation files..."
    
    # Create CSS files
    log_info "Creating CSS foundation files..."
    
    # CSS Variables (variables.css)
    sudo tee "$BASE_DIR/shared/css/variables.css" > /dev/null << 'EOF'
/* NAD Test Cycle - Design System Variables
 * File: shared/css/variables.css
 * Purpose: CSS custom properties for consistent design system
 */

:root {
  /* Primary Brand Colors */
  --nad-primary: #667eea;
  --nad-primary-dark: #5a67d8;
  --nad-primary-light: #7c3aed;
  --nad-secondary: #764ba2;
  --nad-accent: #f093fb;
  
  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Neutral Colors */
  --color-white: #ffffff;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  
  /* Typography */
  --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  
  /* Layout */
  --container-7xl: 80rem;
  --radius-lg: 0.5rem;
  --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-base: all 300ms ease-out;
}
EOF

    # CSS Base (base.css)
    sudo tee "$BASE_DIR/shared/css/base.css" > /dev/null << 'EOF'
/* NAD Test Cycle - Base Styles
 * File: shared/css/base.css
 * Purpose: Reset, base typography, and utility classes
 */

@import url('./variables.css');

/* Modern CSS Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-primary);
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-gray-900);
  background-color: var(--color-white);
  min-height: 100vh;
}

/* Utility Classes */
.container {
  width: 100%;
  max-width: var(--container-7xl);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.flex { display: flex; }
.grid { display: grid; }
.hidden { display: none; }
.block { display: block; }

.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }

.bg-primary { background: linear-gradient(135deg, var(--nad-primary) 0%, var(--nad-secondary) 100%); }
.bg-white { background-color: var(--color-white); }

.text-white { color: var(--color-white); }
.text-gray-600 { color: var(--color-gray-600); }

.rounded-lg { border-radius: var(--radius-lg); }
.shadow-lg { box-shadow: var(--shadow-lg); }

.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.mb-4 { margin-bottom: var(--space-4); }
.mb-6 { margin-bottom: var(--space-6); }

.transition-all { transition: var(--transition-base); }
EOF

    # Create JavaScript files
    log_info "Creating JavaScript foundation files..."
    
    # Core utilities (core.js) - simplified version
    sudo tee "$BASE_DIR/shared/js/core.js" > /dev/null << 'EOF'
/**
 * NAD Test Cycle - Core JavaScript Utilities
 * File: shared/js/core.js
 * Purpose: Essential utilities and helper functions
 */

'use strict';

// NAD Namespace
window.NAD = window.NAD || {};

// Configuration
NAD.config = {
    apiBase: 'https://mynadtest.info',
    environment: 'production',
    version: '1.0.0',
    debug: window.location.hostname === 'localhost'
};

// Core utilities
NAD.utils = {
    // Generate unique ID
    generateId(prefix = 'nad') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Format date
    formatDate(date, format = 'short') {
        if (!date) return 'N/A';
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';
        
        const options = {
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            long: { year: 'numeric', month: 'long', day: 'numeric' }
        };
        
        return d.toLocaleDateString('en-US', options[format] || options.short);
    },
    
    // Validate email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validate test ID
    isValidTestId(testId) {
        const testIdRegex = /^NAD-\d{8}-\d{4}$/;
        return testIdRegex.test(testId);
    }
};

// DOM utilities
NAD.dom = {
    $(selector, context = document) {
        return context.querySelector(selector);
    },
    
    $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    },
    
    addClass(element, className) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) el.classList.add(className);
    },
    
    removeClass(element, className) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) el.classList.remove(className);
    }
};

// Event system
NAD.events = {
    _listeners: {},
    
    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
    },
    
    emit(event, ...args) {
        if (!this._listeners[event]) return;
        this._listeners[event].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event listener for '${event}':`, error);
            }
        });
    }
};

// Logger
NAD.logger = {
    debug(...args) {
        if (NAD.config.debug) console.log('[NAD DEBUG]', ...args);
    },
    info(...args) {
        console.info('[NAD INFO]', ...args);
    },
    warn(...args) {
        console.warn('[NAD WARN]', ...args);
    },
    error(...args) {
        console.error('[NAD ERROR]', ...args);
    }
};

// Initialize
NAD.logger.info('NAD Core utilities loaded');
EOF

    # Components system (components.js) - simplified version
    sudo tee "$BASE_DIR/shared/js/components.js" > /dev/null << 'EOF'
/**
 * NAD Test Cycle - Component Loading System
 * File: shared/js/components.js
 * Purpose: Dynamic component loading and management
 */

'use strict';

window.NAD = window.NAD || {};

// Component system
NAD.Components = {
    _registered: new Map(),
    _cache: new Map(),
    
    // Register component
    register(name, componentClass, options = {}) {
        this._registered.set(name, {
            class: componentClass,
            options: options
        });
        NAD.logger.debug(`Component registered: ${name}`);
    },
    
    // Render component
    async render(name, container, props = {}) {
        const element = typeof container === 'string' ? 
            NAD.dom.$(container) : container;
            
        if (!element) {
            throw new Error(`Container not found: ${container}`);
        }
        
        const registration = this._registered.get(name);
        if (!registration) {
            throw new Error(`Component not registered: ${name}`);
        }
        
        const { class: ComponentClass } = registration;
        const instance = new ComponentClass(props);
        
        if (typeof instance.render === 'function') {
            await instance.render(element, props);
            element._nadComponent = instance;
            return instance;
        }
        
        throw new Error(`Component ${name} does not have a render method`);
    },
    
    // Get registered components
    getRegistered() {
        return Array.from(this._registered.keys());
    }
};

// Base component class
NAD.BaseComponent = class {
    constructor(options = {}) {
        this.options = options;
        this.element = null;
        this.props = {};
    }
    
    async render(container, props = {}) {
        this.element = container;
        this.props = props;
        container.innerHTML = '<div>Base Component</div>';
    }
    
    $(selector) {
        return this.element ? NAD.dom.$(selector, this.element) : null;
    }
    
    $$(selector) {
        return this.element ? NAD.dom.$$(selector, this.element) : [];
    }
};

NAD.logger.debug('Component system loaded');
EOF

    # API client (api-client.js) - simplified version
    sudo tee "$BASE_DIR/shared/js/api-client.js" > /dev/null << 'EOF'
/**
 * NAD Test Cycle - API Client
 * File: shared/js/api-client.js
 * Purpose: Centralized API communication
 */

'use strict';

window.NAD = window.NAD || {};

// API client
NAD.API = {
    config: {
        baseURL: 'https://mynadtest.info',
        timeout: 30000
    },
    
    // Make request
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            data = null,
            headers = {},
            ...fetchOptions
        } = options;
        
        const url = endpoint.startsWith('http') ? 
            endpoint : 
            this.config.baseURL + endpoint;
        
        const fetchConfig = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            ...fetchOptions
        };
        
        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            fetchConfig.body = JSON.stringify(data);
        }
        
        try {
            NAD.logger.debug(`API Request: ${method} ${url}`);
            
            const response = await fetch(url, fetchConfig);
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.error || `HTTP ${response.status}`);
            }
            
            return responseData;
            
        } catch (error) {
            NAD.logger.error(`API Error: ${method} ${url}`, error);
            throw error;
        }
    },
    
    // HTTP method shortcuts
    async get(endpoint, params = {}) {
        const url = new URL(endpoint, this.config.baseURL);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, value);
            }
        });
        return this.request(url.toString());
    },
    
    async post(endpoint, data = {}) {
        return this.request(endpoint, { method: 'POST', data });
    },
    
    async put(endpoint, data = {}) {
        return this.request(endpoint, { method: 'PUT', data });
    },
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    // API methods
    async checkHealth() {
        return this.get('/health');
    },
    
    async getDashboardStats() {
        return this.get('/api/dashboard/stats');
    },
    
    async getTests() {
        return this.get('/api/admin/tests');
    },
    
    async getUsers() {
        return this.get('/api/users');
    },
    
    async getSupplements() {
        return this.get('/api/supplements');
    }
};

NAD.logger.debug('API client loaded');
EOF

    log_success "Foundation JavaScript files created"
    
    # Create sample data files
    log_info "Creating sample data files..."
    
    sudo tee "$BASE_DIR/assets/data/mock-tests.json" > /dev/null << 'EOF'
{
  "tests": [
    {
      "test_id": "NAD-20241215-0001",
      "customer_id": 1001,
      "order_id": 12345,
      "status": "completed",
      "score": 85,
      "created_date": "2024-12-15",
      "activated_date": "2024-12-15"
    },
    {
      "test_id": "NAD-20241215-0002", 
      "customer_id": 1002,
      "order_id": 12346,
      "status": "pending",
      "created_date": "2024-12-15"
    }
  ]
}
EOF

    sudo tee "$BASE_DIR/assets/data/sample-users.json" > /dev/null << 'EOF'
{
  "users": [
    {
      "customer_id": 1001,
      "role": "customer",
      "created_at": "2024-12-01"
    },
    {
      "customer_id": 2001,
      "role": "lab_technician", 
      "created_at": "2024-12-01"
    },
    {
      "customer_id": 3001,
      "role": "administrator",
      "created_at": "2024-12-01"
    }
  ]
}
EOF

    sudo tee "$BASE_DIR/assets/data/test-supplements.json" > /dev/null << 'EOF'
{
  "supplements": [
    {
      "id": 1,
      "name": "NAD+ Precursor",
      "default_dose": "300",
      "unit": "mg",
      "is_active": true
    },
    {
      "id": 2,
      "name": "Vitamin B3",
      "default_dose": "100", 
      "unit": "mg",
      "is_active": true
    },
    {
      "id": 3,
      "name": "Resveratrol",
      "default_dose": "250",
      "unit": "mg", 
      "is_active": true
    }
  ]
}
EOF

    # Create main README
    sudo tee "$BASE_DIR/README.md" > /dev/null << 'EOF'
# NAD Test Cycle - Web Application

## Phase 1 Foundation - COMPLETED ✅

### Architecture
Complete modular web application for NAD+ cellular energy testing workflow.

### Current Status
- ✅ **Phase 1**: Foundation infrastructure complete
- 🔄 **Phase 2**: Admin interface (next)
- ⏳ **Phase 3**: Customer & Lab interfaces
- ⏳ **Phase 4**: Test interface

### Foundation Components
- **Shared CSS**: Design system variables and base styles
- **Core JavaScript**: Utilities, event system, logging
- **Component System**: Dynamic loading and management  
- **API Client**: Centralized communication with caching
- **Sample Data**: Mock data for development

### Directory Structure
```
nad-app/
├── shared/              # Foundation infrastructure ✅
│   ├── css/            # Design system & base styles
│   └── js/             # Core utilities & systems
├── admin/              # Admin dashboard (Phase 2)
├── customer/           # Customer portal (Phase 3)
├── lab/                # Lab interface (Phase 3)
├── test/               # Test/dev interface (Phase 4)
└── assets/             # Static resources & data
```

### Deployment
- **Server**: AWS Lightsail with Bitnami LAMP
- **Domain**: mynadtest.info (SSL enabled)
- **Database**: MariaDB (nad_cycle)
- **API**: Node.js (nad-api service)

### Next Steps
1. Deploy Phase 2: Admin Dashboard Components
2. Build admin interface sections
3. Implement customer and lab interfaces
4. Add test/development tools

### Development
Foundation provides:
- Consistent design system
- Modular architecture
- Component-based development
- Centralized API communication
- Error handling and logging
- Performance optimization

Ready for Phase 2 development! 🚀
EOF

    # Create .gitignore
    sudo tee "$BASE_DIR/.gitignore" > /dev/null << 'EOF'
# Dependencies
node_modules/
npm-debug.log*

# Logs
*.log
logs/

# Runtime data
pids/
*.pid
*.seed

# Directory for instrumented libs
lib-cov/

# Coverage directory used by tools like istanbul
coverage/

# Environment variables
.env
.env.local
.env.production

# Build outputs
dist/
build/

# Temporary files
tmp/
temp/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Cache
.cache/
.npm/

# Uploads (keep directory, ignore files)
assets/uploads/*
!assets/uploads/.gitkeep

# Backups
*.backup
*.bak
EOF

    # Create .gitkeep files
    sudo touch "$BASE_DIR/assets/images/logos/.gitkeep"
    sudo touch "$BASE_DIR/assets/images/icons/.gitkeep"
    sudo touch "$BASE_DIR/assets/images/backgrounds/.gitkeep"
    sudo touch "$BASE_DIR/assets/images/test-images/.gitkeep"
    sudo touch "$BASE_DIR/assets/fonts/.gitkeep"
    sudo touch "$BASE_DIR/assets/uploads/.gitkeep"

    # Set proper permissions
    sudo chown -R bitnami:bitnami "$BASE_DIR"
    sudo chmod -R 755 "$BASE_DIR"
    sudo chmod -R 777 "$BASE_DIR/assets/uploads"

    log_success "Phase 1 foundation files deployed successfully"
}

# Create index.html for testing
create_index_page() {
    log_info "Creating test index page..."
    
    sudo tee "$BASE_DIR/index.html" > /dev/null << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NAD Test Cycle - Foundation</title>
    <link rel="stylesheet" href="./shared/css/variables.css">
    <link rel="stylesheet" href="./shared/css/base.css">
    <style>
        .hero {
            min-height: 100vh;
            background: var(--bg-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .hero-content {
            max-width: 600px;
            padding: var(--space-8);
        }
        .hero h1 {
            font-size: 3rem;
            margin-bottom: var(--space-6);
            background: linear-gradient(135deg, var(--nad-primary), var(--nad-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: var(--space-4);
            margin-top: var(--space-8);
        }
        .status-card {
            background: var(--color-white);
            padding: var(--space-6);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            transition: var(--transition-base);
        }
        .status-card:hover {
            transform: translateY(-4px);
        }
        .status-icon {
            font-size: 2rem;
            margin-bottom: var(--space-4);
        }
        .btn {
            display: inline-block;
            background: var(--bg-primary);
            color: white;
            padding: var(--space-3) var(--space-6);
            border-radius: var(--radius-lg);
            text-decoration: none;
            font-weight: 600;
            transition: var(--transition-base);
            margin: var(--space-2);
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
    </style>
</head>
<body>
    <div class="hero">
        <div class="hero-content">
            <h1>🧬 NAD Test Cycle</h1>
            <p class="text-gray-600 mb-6">Phase 1 Foundation - Successfully Deployed!</p>
            
            <div class="status-grid">
                <div class="status-card">
                    <div class="status-icon">✅</div>
                    <h3>Foundation</h3>
                    <p>CSS & JS infrastructure ready</p>
                </div>
                
                <div class="status-card">
                    <div class="status-icon">🔄</div>
                    <h3>Phase 2</h3>
                    <p>Admin interface - next step</p>
                </div>
                
                <div class="status-card">
                    <div class="status-icon">⏳</div>
                    <h3>Phase 3</h3>
                    <p>Customer & Lab interfaces</p>
                </div>
                
                <div class="status-card">
                    <div class="status-icon">🎯</div>
                    <h3>Phase 4</h3>
                    <p>Test & development tools</p>
                </div>
            </div>
            
            <div style="margin-top: var(--space-8);">
                <a href="./admin-dashboard.html" class="btn">🔧 Admin Dashboard</a>
                <a href="./customer-portal.html" class="btn">👤 Customer Portal</a>
                <a href="./lab-interface.html" class="btn">🔬 Lab Interface</a>
                <a href="./test.html" class="btn">🧪 Test Interface</a>
            </div>
            
            <div style="margin-top: var(--space-6);">
                <small class="text-gray-600">
                    Foundation deployed: <span id="timestamp"></span><br>
                    Ready for Phase 2 development
                </small>
            </div>
        </div>
    </div>

    <script src="./shared/js/core.js"></script>
    <script src="./shared/js/components.js"></script>
    <script src="./shared/js/api-client.js"></script>
    <script>
        // Display current timestamp
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
        
        // Test foundation functionality
        NAD.logger.info('NAD Test Cycle Foundation loaded successfully!');
        NAD.logger.info('Phase 1 deployment complete');
        
        // Test API connection
        NAD.API.checkHealth()
            .then(response => {
                NAD.logger.info('API connection successful:', response);
            })
            .catch(error => {
                NAD.logger.warn('API connection test:', error.message);
            });
    </script>
</body>
</html>
EOF

    log_success "Test index page created"
}

# Validate deployment
validate_deployment() {
    log_info "Validating Phase 1 deployment..."
    
    local errors=0
    
    # Check directory structure
    if [ ! -d "$BASE_DIR/shared/css" ]; then
        log_error "Missing: shared/css directory"
        ((errors++))
    fi
    
    if [ ! -d "$BASE_DIR/shared/js" ]; then
        log_error "Missing: shared/js directory"
        ((errors++))
    fi
    
    # Check foundation files
    local required_files=(
        "shared/css/variables.css"
        "shared/css/base.css"
        "shared/js/core.js"
        "shared/js/components.js"
        "shared/js/api-client.js"
        "README.md"
        "index.html"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$BASE_DIR/$file" ]; then
            log_error "Missing file: $file"
            ((errors++))
        fi
    done
    
    # Check permissions
    if [ ! -w "$BASE_DIR/assets/uploads" ]; then
        log_error "Uploads directory not writable"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "Validation passed - Phase 1 deployment is complete!"
    else
        log_error "$errors validation errors found"
        return 1
    fi
}

# Configure Apache virtual host
configure_apache() {
    log_info "Configuring Apache virtual host..."
    
    # Create virtual host configuration
    sudo tee "/opt/bitnami/apache/conf/vhosts/nad-app.conf" > /dev/null << 'EOF'
<VirtualHost *:80>
    ServerName mynadtest.info
    ServerAlias www.mynadtest.info
    DocumentRoot /opt/bitnami/apache/htdocs/nad-app
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName mynadtest.info
    ServerAlias www.mynadtest.info
    DocumentRoot /opt/bitnami/apache/htdocs/nad-app
    
    # SSL Configuration (managed by Let's Encrypt)
    SSLEngine on
    
    # NAD App Directory
    <Directory "/opt/bitnami/apache/htdocs/nad-app">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        DirectoryIndex index.html index.php
    </Directory>
    
    # Security Headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    
    # Cache Control for Assets
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 month"
        Header append Cache-Control "public"
    </LocationMatch>
    
    # Logs
    ErrorLog /opt/bitnami/apache/logs/nad-error.log
    CustomLog /opt/bitnami/apache/logs/nad-access.log combined
</VirtualHost>
EOF

    # Test Apache configuration
    if sudo /opt/bitnami/apache/bin/httpd -t; then
        log_success "Apache configuration is valid"
        
        # Restart Apache
        sudo /opt/bitnami/ctlscript.sh restart apache
        log_success "Apache restarted successfully"
    else
        log_error "Apache configuration test failed"
        return 1
    fi
}

# Show deployment summary
show_summary() {
    echo ""
    echo "🎉 NAD Test Cycle - Phase 1 Foundation Deployment Complete!"
    echo "============================================================"
    echo ""
    echo "📁 Installation Directory: $BASE_DIR"
    echo "🌐 Website URL: https://mynadtest.info"
    echo "📊 Test URL: https://mynadtest.info/index.html"
    echo ""
    echo "✅ Phase 1 Components Deployed:"
    echo "   • CSS Design System (variables.css, base.css)"
    echo "   • Core JavaScript Utilities (core.js)"
    echo "   • Component Loading System (components.js)"
    echo "   • API Client with Caching (api-client.js)"
    echo "   • Sample Data Files (JSON)"
    echo "   • Test Interface (index.html)"
    echo ""
    echo "📈 Development Progress:"
    echo "   ✅ Phase 1: Foundation (COMPLETE)"
    echo "   🔄 Phase 2: Admin Interface (NEXT)"
    echo "   ⏳ Phase 3: Customer & Lab Interfaces"
    echo "   ⏳ Phase 4: Test & Development Tools"
    echo ""
    echo "🛠️  Next Steps:"
    echo "   1. Test the foundation at: https://mynadtest.info"
    echo "   2. Begin Phase 2: Admin Dashboard development"
    echo "   3. Build admin components and sections"
    echo "   4. Continue with customer and lab interfaces"
    echo ""
    echo "📋 Files Created: $(find "$BASE_DIR" -type f | wc -l) files"
    echo "💾 Backup Location: $BACKUP_DIR"
    echo "⏰ Deployment Time: $(date)"
    echo ""
    log_success "Phase 1 Foundation deployment successful! 🚀"
}

# Main execution
main() {
    echo "Starting NAD Test Cycle Phase 1 Foundation deployment..."
    echo ""
    
    check_permissions
    create_backup
    create_directories
    deploy_foundation_files
    create_index_page
    validate_deployment
    configure_apache
    show_summary
    
    echo ""
    echo "🎯 Foundation is ready for Phase 2 development!"
    echo "Visit https://mynadtest.info to test the deployment"
}

# Execute main function
main "$@"
