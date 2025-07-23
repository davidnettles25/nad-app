// Log Management Interface Functions
// Removed console.log - using structured logging instead

let currentLogConfig = null;

/**
 * Load current log configuration from server
 */
async function loadLogConfig() {
    try {
        showAlert('🔄 Loading log configuration...', 'info', 'log-config-alert');
        
        const response = await fetch(`${API_BASE}/api/admin/log-config`);
        const data = await response.json();
        
        if (data.success) {
            currentLogConfig = data.config;
            populateLogConfigForm(data.config);
            showAlert('✅ Log configuration loaded successfully', 'success', 'log-config-alert');
        } else {
            throw new Error(data.error || 'Failed to load log configuration');
        }
    } catch (error) {
        // Error already shown in UI alert
        showAlert('❌ Failed to load log configuration: ' + error.message, 'error', 'log-config-alert');
    }
}

/**
 * Populate form with current configuration
 */
function populateLogConfigForm(config) {
    // Set log level
    document.getElementById('log-level').value = config.level || 'info';
    
    // Set checkboxes
    document.getElementById('console-logging').checked = config.console || false;
    document.getElementById('visual-debug').checked = config.debug?.enabled || false;
    
    // File logging checkboxes
    document.getElementById('file-app').checked = config.files?.app || false;
    document.getElementById('file-api').checked = config.files?.api || false;
    document.getElementById('file-error').checked = config.files?.error || false;
    document.getElementById('file-customer').checked = config.files?.customer || false;
    document.getElementById('file-admin').checked = config.files?.admin || false;
    
    // Debug areas
    const debugAreas = config.debug?.areas || [];
    document.getElementById('debug-analytics').checked = debugAreas.includes('analytics');
    document.getElementById('debug-supplements').checked = debugAreas.includes('supplements');
    document.getElementById('debug-batch-printing').checked = debugAreas.includes('batch-printing');
    document.getElementById('debug-exports').checked = debugAreas.includes('exports');
}

/**
 * Save log configuration to server
 */
async function saveLogConfig() {
    try {
        showAlert('💾 Saving log configuration...', 'info', 'log-config-alert');
        
        // Collect form data
        const config = {
            level: document.getElementById('log-level').value,
            console: document.getElementById('console-logging').checked,
            files: {
                enabled: true,
                app: document.getElementById('file-app').checked,
                api: document.getElementById('file-api').checked,
                error: document.getElementById('file-error').checked,
                customer: document.getElementById('file-customer').checked,
                admin: document.getElementById('file-admin').checked
            },
            debug: {
                enabled: document.getElementById('visual-debug').checked,
                areas: []
            }
        };
        
        // Collect debug areas
        if (document.getElementById('debug-analytics').checked) config.debug.areas.push('analytics');
        if (document.getElementById('debug-supplements').checked) config.debug.areas.push('supplements');
        if (document.getElementById('debug-batch-printing').checked) config.debug.areas.push('batch-printing');
        if (document.getElementById('debug-exports').checked) config.debug.areas.push('exports');
        
        const response = await fetch(`${API_BASE}/api/admin/log-config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentLogConfig = data.config;
            showAlert('✅ Log configuration saved successfully', 'success', 'log-config-alert');
        } else {
            throw new Error(data.error || 'Failed to save log configuration');
        }
    } catch (error) {
        // Error already shown in UI alert
        showAlert('❌ Failed to save log configuration: ' + error.message, 'error', 'log-config-alert');
    }
}

/**
 * Reset log configuration to defaults
 */
function resetLogConfig() {
    if (confirm('Reset log configuration to defaults? This will lose current settings.')) {
        // Set default values
        document.getElementById('log-level').value = 'info';
        document.getElementById('console-logging').checked = true;
        document.getElementById('visual-debug').checked = true;
        
        // Enable all file logging by default
        document.getElementById('file-app').checked = true;
        document.getElementById('file-api').checked = true;
        document.getElementById('file-error').checked = true;
        document.getElementById('file-customer').checked = true;
        document.getElementById('file-admin').checked = true;
        
        // Enable all debug areas by default
        document.getElementById('debug-analytics').checked = true;
        document.getElementById('debug-supplements').checked = true;
        document.getElementById('debug-batch-printing').checked = true;
        document.getElementById('debug-exports').checked = true;
        
        showAlert('🔧 Configuration reset to defaults. Click "Save Configuration" to apply.', 'info', 'log-config-alert');
    }
}

/**
 * Load and display available log files
 */
async function refreshLogFiles() {
    try {
        showAlert('🔄 Loading log files...', 'info', 'log-files-alert');
        
        const response = await fetch(`${API_BASE}/api/admin/log-files`);
        const data = await response.json();
        
        if (data.success) {
            displayLogFiles(data.files);
            showAlert('✅ Log files loaded successfully', 'success', 'log-files-alert');
        } else {
            throw new Error(data.error || 'Failed to load log files');
        }
    } catch (error) {
        // Error already shown in UI alert
        showAlert('❌ Failed to load log files: ' + error.message, 'error', 'log-files-alert');
    }
}

/**
 * Get description for a log file based on its name
 */
function getLogFileDescription(filename) {
    const descriptions = {
        'app.log': 'General application logs including system events, startup, and operational messages',
        'api.log': 'HTTP API request/response logs with performance metrics and endpoint activity',
        'error.log': 'Error messages, exceptions, and critical system failures',
        'customer.log': 'Customer portal activity, authentication, and user interactions',
        'admin.log': 'Admin dashboard activity, administrative actions, and configuration changes',
        'debug.log': 'Detailed debugging information when debug mode is enabled',
        'access.log': 'HTTP access logs with request details and response status codes',
        'performance.log': 'Performance metrics, slow queries, and system resource usage',
        'security.log': 'Security events, authentication attempts, and access control logs',
        'database.log': 'Database queries, connections, and database-related operations',
        'nad-error.log': 'NAD application error logs and system exceptions',
        'nad-out.log': 'NAD application output logs and general messages',
        'combined.log': 'Combined logs from all application modules and components',
        'exceptions.log': 'Detailed exception traces and stack dumps'
    };
    
    // Try exact match first
    if (descriptions[filename]) {
        return descriptions[filename];
    }
    
    // Try pattern matching for date-stamped files
    if (filename.match(/^app\.\d{4}-\d{2}-\d{2}\.log$/)) {
        return 'Archived general application logs from ' + filename.match(/\d{4}-\d{2}-\d{2}/)[0];
    }
    if (filename.match(/^api\.\d{4}-\d{2}-\d{2}\.log$/)) {
        return 'Archived API request/response logs from ' + filename.match(/\d{4}-\d{2}-\d{2}/)[0];
    }
    if (filename.match(/^error\.\d{4}-\d{2}-\d{2}\.log$/)) {
        return 'Archived error logs from ' + filename.match(/\d{4}-\d{2}-\d{2}/)[0];
    }
    if (filename.match(/^customer\.\d{4}-\d{2}-\d{2}\.log$/)) {
        return 'Archived customer activity logs from ' + filename.match(/\d{4}-\d{2}-\d{2}/)[0];
    }
    if (filename.match(/^admin\.\d{4}-\d{2}-\d{2}\.log$/)) {
        return 'Archived admin activity logs from ' + filename.match(/\d{4}-\d{2}-\d{2}/)[0];
    }
    
    // Default description for unknown files
    return 'Log file containing system or application messages';
}

/**
 * Display log files in the interface
 */
function displayLogFiles(files) {
    const container = document.getElementById('log-files-list');
    
    if (files.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No log files found</div>';
        return;
    }
    
    const html = files.map(file => {
        const sizeKB = Math.round(file.size / 1024);
        const modifiedDate = new Date(file.modified).toLocaleString();
        const description = getLogFileDescription(file.name);
        
        return `
            <div class="log-file-item" style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 10px; background: #f9f9f9;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1; margin-right: 15px;">
                        <strong>${file.name}</strong>
                        <div style="font-size: 13px; color: #555; margin: 4px 0; line-height: 1.3;">
                            ${description}
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            ${sizeKB} KB • Modified: ${modifiedDate}
                        </div>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="viewLogFile('${file.name.replace(/'/g, "\\'")}')" data-filename="${file.name}">
                        👁️ View
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

/**
 * View contents of a specific log file
 */
async function viewLogFile(filename) {
    try {
        // Loading log file (shown in UI alert)
        
        // Check if required elements exist
        const logViewer = document.getElementById('log-viewer');
        const currentLogFile = document.getElementById('current-log-file');
        const logContent = document.getElementById('log-content');
        const logLines = document.getElementById('log-lines');
        
        if (!logViewer || !currentLogFile || !logContent) {
            // Log viewer elements not found - error shown in UI
            showAlert('❌ Log viewer elements not found in DOM', 'error', 'log-files-alert');
            return;
        }
        
        showAlert(`📖 Loading ${filename}...`, 'info', 'log-files-alert');
        
        const lines = logLines ? logLines.value : 100;
        const url = `${API_BASE}/api/admin/log-files/${encodeURIComponent(filename)}?lines=${lines}`;
        // Fetching log file content
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (data.success) {
            // Update header with formatting info
            const formatInfo = data.formatted ? ' (formatted)' : '';
            currentLogFile.textContent = filename + formatInfo;
            
            // Set log content with better formatting
            const logText = data.lines.join('\n') || '(Empty log file)';
            logContent.textContent = logText;
            
            // Apply monospace font and better styling for formatted logs
            if (data.formatted) {
                // Use setProperty with !important to override any CSS conflicts
                logContent.style.setProperty('font-family', 'Monaco, Consolas, "Courier New", monospace', 'important');
                logContent.style.setProperty('font-size', '12px', 'important');
                logContent.style.setProperty('line-height', '1.4', 'important');
                logContent.style.setProperty('background-color', '#f8f9fa', 'important');
                logContent.style.setProperty('border', '1px solid #e9ecef', 'important');
                logContent.style.setProperty('border-radius', '4px', 'important');
                logContent.style.setProperty('padding', '12px', 'important');
                logContent.style.setProperty('color', '#333', 'important');
                logContent.style.setProperty('opacity', '1', 'important');
                
                // Also remove any classes that might be causing grey styling
                logContent.className = '';
            } else {
                // Reset styles for non-formatted logs
                logContent.style.fontFamily = 'monospace';
                logContent.style.fontSize = '11px';
                logContent.style.lineHeight = '1.3';
                logContent.style.backgroundColor = '#f8f9fa';
                logContent.style.border = '1px solid #e9ecef';
                logContent.style.borderRadius = '4px';
                logContent.style.padding = '10px';
            }
            
            logViewer.style.display = 'block';
            
            // Store current filename for refresh
            logViewer.dataset.filename = filename;
            
            // Show success message with format info
            let successMsg = '✅ Log file loaded successfully';
            if (data.formatted && data.formattedCount > 0) {
                successMsg = `✅ Log file loaded and formatted successfully (${data.formattedCount}/${data.originalCount} lines formatted)`;
            } else if (data.formattedCount === 0) {
                successMsg = '✅ Log file loaded (no Pino JSON logs detected for formatting)';
            }
            
            // Always show debug info prominently
            if (data.debug) {
                successMsg += `<br><small><strong>Debug:</strong> ${data.debug.processingDetails}</small>`;
                if (data.debug.sampleLine) {
                    successMsg += `<br><small><strong>Sample:</strong> ${data.debug.sampleLine.substring(0, 100)}...</small>`;
                }
                if (data.debug.firstLineFormatted) {
                    successMsg += `<br><small><strong>Formatted:</strong> ${data.debug.firstLineFormatted.substring(0, 100)}...</small>`;
                }
            }
            
            showAlert(successMsg, 'success', 'log-files-alert');
        } else {
            throw new Error(data.error || 'Failed to load log file');
        }
    } catch (error) {
        // Error already shown in UI alert
        showAlert('❌ Failed to load log file: ' + error.message, 'error', 'log-files-alert');
        
        // Re-render the log files list in case it was corrupted
        refreshLogFiles();
    }
}

/**
 * Refresh current log file content
 */
function refreshLogContent() {
    const filename = document.getElementById('log-viewer').dataset.filename;
    if (filename) {
        viewLogFile(filename);
    }
}

/**
 * Close log viewer
 */
function closeLogViewer() {
    const logViewer = document.getElementById('log-viewer');
    if (logViewer) {
        logViewer.style.display = 'none';
        delete logViewer.dataset.filename;
    }
    // Make sure the file list is still visible
    const filesList = document.getElementById('log-files-list');
    if (filesList && filesList.style.display === 'none') {
        filesList.style.display = 'block';
    }
}

/**
 * Test the logging system by making some test API calls
 */
async function testLogSystem() {
    try {
        showAlert('🧪 Testing logging system...', 'info', 'log-config-alert');
        
        // Make a test API call to generate some logs
        const response = await fetch(`${API_BASE}/api/admin/log-config`);
        const data = await response.json();
        
        if (data.success) {
            showAlert('✅ Logging system test successful! Check log files for entries.', 'success', 'log-config-alert');
        } else {
            showAlert('⚠️ Logging system test completed with warnings.', 'warning', 'log-config-alert');
        }
        
        // Refresh log files to show new entries
        setTimeout(() => {
            refreshLogFiles();
        }, 1000);
        
    } catch (error) {
        // Error already shown in UI alert
        showAlert('❌ Error testing logging system: ' + error.message, 'error', 'log-config-alert');
    }
}

/**
 * Initialize log management when section is loaded
 */
function initLogManagement() {
    // Initialize log management interface
    
    // Load initial configuration
    loadLogConfig();
    
    // Load log files
    refreshLogFiles();
}

// Make functions globally accessible
window.loadLogConfig = loadLogConfig;
window.saveLogConfig = saveLogConfig;
window.resetLogConfig = resetLogConfig;
window.refreshLogFiles = refreshLogFiles;
window.viewLogFile = viewLogFile;
window.refreshLogContent = refreshLogContent;
window.closeLogViewer = closeLogViewer;
window.testLogSystem = testLogSystem;
window.initLogManagement = initLogManagement;

// Log Management functionality loaded