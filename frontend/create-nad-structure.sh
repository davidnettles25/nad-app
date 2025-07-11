#!/bin/bash

# NAD Test Cycle - Directory Structure Creation Script
# File: create-nad-structure.sh
# 
# This script creates the complete modular directory structure for the NAD Test Cycle application
# Run with: bash create-nad-structure.sh
# Or make executable: chmod +x create-nad-structure.sh && ./create-nad-structure.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_DIR="/opt/bitnami/apache/htdocs/nad-app"
BACKUP_DIR="/opt/bitnami/apache/htdocs/nad-app-backup-$(date +%Y%m%d_%H%M%S)"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${CYAN}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

# Function to create directory with logging
create_dir() {
    local dir_path="$1"
    if [ ! -d "$dir_path" ]; then
        mkdir -p "$dir_path"
        print_status "Created directory: $dir_path"
    else
        print_warning "Directory already exists: $dir_path"
    fi
}

# Function to create file with basic content
create_file() {
    local file_path="$1"
    local content="$2"
    
    if [ ! -f "$file_path" ]; then
        echo "$content" > "$file_path"
        print_status "Created file: $file_path"
    else
        print_warning "File already exists: $file_path"
    fi
}

# Function to backup existing directory
backup_existing() {
    if [ -d "$BASE_DIR" ]; then
        print_warning "Existing directory found at $BASE_DIR"
        read -p "Do you want to create a backup? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Creating backup at $BACKUP_DIR"
            cp -r "$BASE_DIR" "$BACKUP_DIR"
            print_success "✅ Backup created successfully!"
        fi
    fi
}

# Function to set permissions
set_permissions() {
    local dir_path="$1"
    
    # Set directory permissions (755 - owner: rwx, group: rx, others: rx)
    find "$dir_path" -type d -exec chmod 755 {} \;
    
    # Set file permissions (644 - owner: rw, group: r, others: r)
    find "$dir_path" -type f -exec chmod 644 {} \;
    
    # Make shell scripts executable
    find "$dir_path" -name "*.sh" -exec chmod +x {} \;
    
    print_status "Set appropriate permissions for $dir_path"
}

# Main function to create directory structure
create_structure() {
    print_header "🏗️  Creating NAD Test Cycle Modular Directory Structure"
    echo "Target directory: $BASE_DIR"
    echo

    # Create base directory
    create_dir "$BASE_DIR"
    cd "$BASE_DIR"

    print_header "📁 Creating main container files..."
    
    # Main HTML files will be created as placeholders
    create_file "index.html" "<!-- NAD Test Cycle - Landing Page -->"
    create_file "admin-dashboard.html" "<!-- NAD Test Cycle - Admin Dashboard -->"
    create_file "customer-portal.html" "<!-- NAD Test Cycle - Customer Portal -->"
    create_file "lab-interface.html" "<!-- NAD Test Cycle - Lab Interface -->"
    create_file "test-interface.html" "<!-- NAD Test Cycle - Test Interface -->"

    print_header "📦 Creating shared infrastructure..."
    
    # Shared components
    create_dir "shared/components"
    create_file "shared/components/header.html" "<!-- Shared Header Component -->"
    create_file "shared/components/footer.html" "<!-- Shared Footer Component -->"
    create_file "shared/components/loading-spinner.html" "<!-- Loading Spinner Component -->"
    create_file "shared/components/alert-system.html" "<!-- Alert System Component -->"
    create_file "shared/components/modal-dialogs.html" "<!-- Modal Dialogs Component -->"
    create_file "shared/components/status-indicators.html" "<!-- Status Indicators Component -->"

    # Shared CSS
    create_dir "shared/css"
    create_file "shared/css/variables.css" "/* CSS Custom Properties and Variables */"
    create_file "shared/css/base.css" "/* Base styles, reset, typography */"
    create_file "shared/css/components.css" "/* Shared component styles */"
    create_file "shared/css/themes.css" "/* Color themes and dark mode */"
    create_file "shared/css/responsive.css" "/* Responsive utilities */"

    # Shared JavaScript
    create_dir "shared/js"
    create_file "shared/js/core.js" "// Core utilities and helpers"
    create_file "shared/js/auth.js" "// Authentication helpers"
    create_file "shared/js/components.js" "// Component loading system"
    create_file "shared/js/api-client.js" "// Centralized API client"
    create_file "shared/js/utils.js" "// Utility functions"
    create_file "shared/js/error-handler.js" "// Global error handling"

    print_header "👨‍💼 Creating admin dashboard structure..."
    
    # Admin components
    create_dir "admin/components"
    create_file "admin/components/sidebar.html" "<!-- Admin Navigation Sidebar -->"
    create_file "admin/components/header.html" "<!-- Admin Header -->"
    create_file "admin/components/stats-cards.html" "<!-- Dashboard Stats Cards -->"
    create_file "admin/components/data-table.html" "<!-- Reusable Data Table -->"
    create_file "admin/components/bulk-actions.html" "<!-- Bulk Action Controls -->"
    create_file "admin/components/user-form.html" "<!-- User Creation/Edit Form -->"
    create_file "admin/components/filter-controls.html" "<!-- Data Filtering Controls -->"

    # Admin sections
    create_dir "admin/sections"
    create_file "admin/sections/overview.html" "<!-- Dashboard Overview Section -->"
    create_file "admin/sections/tests.html" "<!-- Test Management Section -->"
    create_file "admin/sections/users.html" "<!-- User Management Section -->"
    create_file "admin/sections/supplements.html" "<!-- Supplement Management Section -->"
    create_file "admin/sections/analytics.html" "<!-- Analytics & Reports Section -->"
    create_file "admin/sections/system.html" "<!-- System Health Section -->"

    # Admin CSS
    create_dir "admin/css"
    create_file "admin/css/admin-dashboard.css" "/* Admin-specific styles */"
    create_file "admin/css/sections.css" "/* Section-specific styles */"
    create_file "admin/css/tables.css" "/* Data table styles */"
    create_file "admin/css/forms.css" "/* Admin form styles */"

    # Admin JavaScript
    create_dir "admin/js"
    create_file "admin/js/admin-dashboard.js" "// Main admin controller"
    create_file "admin/js/navigation.js" "// Section navigation"
    create_file "admin/js/data-management.js" "// CRUD operations"

    # Admin section JavaScript
    create_dir "admin/js/sections"
    create_file "admin/js/sections/tests.js" "// Test management logic"
    create_file "admin/js/sections/users.js" "// User management logic"
    create_file "admin/js/sections/supplements.js" "// Supplement management logic"
    create_file "admin/js/sections/analytics.js" "// Analytics logic"
    create_file "admin/js/sections/system.js" "// System monitoring logic"

    print_header "👤 Creating customer portal structure..."
    
    # Customer components
    create_dir "customer/components"
    create_file "customer/components/header.html" "<!-- Customer Portal Header -->"
    create_file "customer/components/step-indicator.html" "<!-- Multi-step Process Indicator -->"
    create_file "customer/components/test-verification.html" "<!-- Test ID Verification Form -->"
    create_file "customer/components/supplement-form.html" "<!-- Supplement Input Form -->"
    create_file "customer/components/results-display.html" "<!-- Test Results Display -->"
    create_file "customer/components/progress-tracker.html" "<!-- Test Progress Tracking -->"
    create_file "customer/components/help-panel.html" "<!-- Help and Support Panel -->"

    # Customer sections
    create_dir "customer/sections"
    create_file "customer/sections/verification.html" "<!-- Test ID Verification Step -->"
    create_file "customer/sections/supplements.html" "<!-- Supplement Information Step -->"
    create_file "customer/sections/results.html" "<!-- Results Viewing Step -->"
    create_file "customer/sections/help.html" "<!-- Help and FAQ Section -->"

    # Customer CSS
    create_dir "customer/css"
    create_file "customer/css/customer-portal.css" "/* Customer-specific styles */"
    create_file "customer/css/forms.css" "/* Form styling */"
    create_file "customer/css/results.css" "/* Results display styling */"
    create_file "customer/css/wizard.css" "/* Multi-step wizard styling */"

    # Customer JavaScript
    create_dir "customer/js"
    create_file "customer/js/customer-portal.js" "// Main customer controller"
    create_file "customer/js/form-validation.js" "// Form validation logic"
    create_file "customer/js/test-verification.js" "// Test verification logic"
    create_file "customer/js/supplement-handler.js" "// Supplement form handling"
    create_file "customer/js/results-viewer.js" "// Results display logic"
    create_file "customer/js/wizard-navigation.js" "// Step-by-step navigation"

    print_header "🔬 Creating lab interface structure..."
    
    # Lab components
    create_dir "lab/components"
    create_file "lab/components/header.html" "<!-- Lab Interface Header -->"
    create_file "lab/components/stats-dashboard.html" "<!-- Lab Statistics Dashboard -->"
    create_file "lab/components/test-queue.html" "<!-- Pending Tests Queue -->"
    create_file "lab/components/score-form.html" "<!-- Score Submission Form -->"
    create_file "lab/components/file-upload.html" "<!-- Image Upload Component -->"
    create_file "lab/components/recent-submissions.html" "<!-- Recent Test Submissions -->"
    create_file "lab/components/technician-panel.html" "<!-- Technician Info Panel -->"

    # Lab sections
    create_dir "lab/sections"
    create_file "lab/sections/dashboard.html" "<!-- Lab Dashboard Overview -->"
    create_file "lab/sections/test-processing.html" "<!-- Test Processing Interface -->"
    create_file "lab/sections/score-submission.html" "<!-- Score Submission Section -->"
    create_file "lab/sections/history.html" "<!-- Processing History -->"
    create_file "lab/sections/settings.html" "<!-- Lab Settings -->"

    # Lab CSS
    create_dir "lab/css"
    create_file "lab/css/lab-interface.css" "/* Lab-specific styles */"
    create_file "lab/css/dashboard.css" "/* Dashboard styling */"
    create_file "lab/css/forms.css" "/* Lab form styling */"
    create_file "lab/css/queue.css" "/* Test queue styling */"

    # Lab JavaScript
    create_dir "lab/js"
    create_file "lab/js/lab-interface.js" "// Main lab controller"
    create_file "lab/js/test-queue.js" "// Test queue management"
    create_file "lab/js/score-submission.js" "// Score submission logic"
    create_file "lab/js/file-upload.js" "// File upload handling"
    create_file "lab/js/real-time-updates.js" "// Real-time lab updates"
    create_file "lab/js/technician-manager.js" "// Technician session management"

    print_header "🧪 Creating test interface structure..."
    
    # Test components
    create_dir "test/components"
    create_file "test/components/header.html" "<!-- Test Interface Header -->"
    create_file "test/components/status-panel.html" "<!-- Environment Status Panel -->"
    create_file "test/components/api-tester.html" "<!-- API Endpoint Testing -->"
    create_file "test/components/test-controls.html" "<!-- Test Control Buttons -->"
    create_file "test/components/results-viewer.html" "<!-- Test Results Display -->"
    create_file "test/components/debug-console.html" "<!-- Debug Information Console -->"
    create_file "test/components/endpoint-list.html" "<!-- Available Endpoints List -->"

    # Test sections
    create_dir "test/sections"
    create_file "test/sections/overview.html" "<!-- Test Environment Overview -->"
    create_file "test/sections/api-testing.html" "<!-- API Endpoint Testing -->"
    create_file "test/sections/database-testing.html" "<!-- Database Connection Testing -->"
    create_file "test/sections/webhook-testing.html" "<!-- Webhook Testing -->"
    create_file "test/sections/performance.html" "<!-- Performance Testing -->"
    create_file "test/sections/mock-data.html" "<!-- Mock Data Generation -->"
    create_file "test/sections/debugging.html" "<!-- Debug Tools and Logs -->"

    # Test CSS
    create_dir "test/css"
    create_file "test/css/test-interface.css" "/* Test interface styles */"
    create_file "test/css/debug.css" "/* Debug console styling */"
    create_file "test/css/testing-tools.css" "/* Testing tool styles */"
    create_file "test/css/performance.css" "/* Performance display styles */"

    # Test JavaScript
    create_dir "test/js"
    create_file "test/js/test-interface.js" "// Main test controller"
    create_file "test/js/api-tester.js" "// API testing logic"
    create_file "test/js/database-tester.js" "// Database testing"
    create_file "test/js/webhook-tester.js" "// Webhook testing"
    create_file "test/js/performance-monitor.js" "// Performance monitoring"
    create_file "test/js/mock-data-generator.js" "// Mock data creation"
    create_file "test/js/debug-tools.js" "// Debug utilities"

    print_header "📁 Creating assets and data directories..."
    
    # Assets
    create_dir "assets/images/logos"
    create_dir "assets/images/icons"
    create_dir "assets/images/backgrounds"
    create_dir "assets/images/test-images"
    create_dir "assets/fonts"
    
    # Data directories
    create_dir "assets/data"
    create_file "assets/data/mock-tests.json" '{"mock": "test data"}'
    create_file "assets/data/sample-users.json" '{"mock": "user data"}'
    create_file "assets/data/test-supplements.json" '{"mock": "supplement data"}'
    
    # Uploads directory
    create_dir "uploads"
    
    # Create README files for documentation
    print_header "📚 Creating documentation..."
    
    create_file "README.md" "# NAD Test Cycle - Modular Application Structure

## Overview
This directory contains the modular structure for the NAD Test Cycle application.

## Interfaces
- **admin-dashboard.html**: Admin management interface
- **customer-portal.html**: Customer test submission portal
- **lab-interface.html**: Lab technician interface
- **test-interface.html**: Development and testing interface

## Structure
- **shared/**: Common components, CSS, and JavaScript
- **admin/**: Admin-specific components and logic
- **customer/**: Customer portal components
- **lab/**: Lab interface components
- **test/**: Development testing interface
- **assets/**: Static assets (images, fonts, data)

## Usage
Each interface loads components dynamically using the shared component system.
"

    create_file "shared/README.md" "# Shared Infrastructure

This directory contains components, styles, and scripts shared across all interfaces.

## Components
- **header.html**: Generic header template
- **footer.html**: Generic footer template
- **loading-spinner.html**: Loading indicators
- **alert-system.html**: Notification system
- **modal-dialogs.html**: Modal templates

## CSS
- **variables.css**: CSS custom properties
- **base.css**: Reset and base styles
- **components.css**: Shared component styles
- **themes.css**: Color themes
- **responsive.css**: Responsive utilities

## JavaScript
- **core.js**: Core utilities
- **api-client.js**: API communication
- **components.js**: Component loading system
- **utils.js**: Utility functions
"

    create_file "admin/README.md" "# Admin Dashboard

Complete administration interface for the NAD Test Cycle system.

## Sections
- **overview.html**: Dashboard overview
- **tests.html**: Test management
- **users.html**: User management
- **supplements.html**: Supplement management
- **analytics.html**: Analytics and reports
- **system.html**: System health monitoring

## Features
- User management with role-based access
- Test activation and deactivation
- Bulk operations
- Analytics and reporting
- System health monitoring
"

    create_file "customer/README.md" "# Customer Portal

Customer-facing interface for test submission and results viewing.

## Flow
1. **verification.html**: Test ID verification
2. **supplements.html**: Supplement information input
3. **results.html**: Test results viewing

## Features
- Multi-step wizard interface
- Form validation
- Progress tracking
- Results visualization
"

    create_file "lab/README.md" "# Lab Interface

Laboratory technician interface for test processing.

## Features
- Test queue management
- Score submission
- File upload for test images
- Real-time updates
- Processing history
"

    create_file "test/README.md" "# Test Interface

Development and testing interface for API and system testing.

## Features
- API endpoint testing
- Database connection testing
- Webhook testing
- Performance monitoring
- Mock data generation
- Debug tools
"

    # Create .gitignore
    create_file ".gitignore" "# Dependencies
node_modules/

# Logs
*.log
logs/

# Environment files
.env
.env.local

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp
*.swo

# Temporary files
*.tmp
*.temp

# Upload files
uploads/*.jpg
uploads/*.png
uploads/*.gif
uploads/*.pdf
!uploads/.gitkeep

# Cache
.cache/
"

    # Create .gitkeep files for empty directories
    create_file "uploads/.gitkeep" ""
    create_file "assets/images/logos/.gitkeep" ""
    create_file "assets/images/icons/.gitkeep" ""
    create_file "assets/images/backgrounds/.gitkeep" ""
    create_file "assets/images/test-images/.gitkeep" ""
    create_file "assets/fonts/.gitkeep" ""

    print_header "🔧 Setting permissions..."
    set_permissions "$BASE_DIR"

    print_header "📊 Structure Summary"
    echo "Directory structure created successfully!"
    echo
    echo "📁 Total directories created: $(find "$BASE_DIR" -type d | wc -l)"
    echo "📄 Total files created: $(find "$BASE_DIR" -type f | wc -l)"
    echo
    echo "🎯 Main interfaces:"
    echo "  - $BASE_DIR/index.html (Landing page)"
    echo "  - $BASE_DIR/admin-dashboard.html (Admin interface)"
    echo "  - $BASE_DIR/customer-portal.html (Customer portal)"
    echo "  - $BASE_DIR/lab-interface.html (Lab interface)"
    echo "  - $BASE_DIR/test-interface.html (Test interface)"
    echo
    echo "📦 Key directories:"
    echo "  - $BASE_DIR/shared/ (Shared infrastructure)"
    echo "  - $BASE_DIR/admin/ (Admin components)"
    echo "  - $BASE_DIR/customer/ (Customer components)"
    echo "  - $BASE_DIR/lab/ (Lab components)"
    echo "  - $BASE_DIR/test/ (Test components)"
    echo "  - $BASE_DIR/assets/ (Static assets)"
    echo
    
    print_success "✅ NAD Test Cycle modular structure created successfully!"
    print_success "🚀 Ready for development!"
}

# Function to display help
show_help() {
    echo "NAD Test Cycle - Directory Structure Creation Script"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "OPTIONS:"
    echo "  -h, --help     Show this help message"
    echo "  -d, --dir      Specify custom base directory (default: $BASE_DIR)"
    echo "  -b, --backup   Force backup creation"
    echo "  -n, --no-backup   Skip backup creation"
    echo
    echo "Examples:"
    echo "  $0                                    # Create structure in default location"
    echo "  $0 -d /var/www/html/nad-app          # Create in custom location"
    echo "  $0 -b                                # Force backup creation"
    echo "  $0 -n                                # Skip backup"
    echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dir)
            BASE_DIR="$2"
            BACKUP_DIR="${BASE_DIR}-backup-$(date +%Y%m%d_%H%M%S)"
            shift 2
            ;;
        -b|--backup)
            FORCE_BACKUP=true
            shift
            ;;
        -n|--no-backup)
            NO_BACKUP=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_header "🧬 NAD Test Cycle - Directory Structure Generator"
    echo "=================================================="
    echo
    
    # Check if running as root or with sudo (recommended for /opt/bitnami)
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root - be careful with permissions!"
    elif [[ "$BASE_DIR" == /opt/* ]] && [[ $EUID -ne 0 ]]; then
        print_error "Creating directories in /opt/ requires root privileges"
        echo "Please run with sudo: sudo $0"
        exit 1
    fi
    
    # Handle backup logic
    if [[ "$FORCE_BACKUP" == true ]]; then
        backup_existing
    elif [[ "$NO_BACKUP" != true ]]; then
        backup_existing
    fi
    
    # Create the structure
    create_structure
    
    print_header "🎉 Setup Complete!"
    echo "Next steps:"
    echo "1. Navigate to: cd $BASE_DIR"
    echo "2. Start with the landing page: vi index.html"
    echo "3. Set up your web server to serve from this directory"
    echo "4. Begin developing your modular components"
    echo
    echo "Happy coding! 🚀"
}

# Run main function
main "$@"
