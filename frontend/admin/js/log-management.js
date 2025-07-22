// Log Management Interface Functions
console.log('📋 Loading Log Management functionality...');

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
        console.error('Error loading log configuration:', error);
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
        console.error('Error saving log configuration:', error);
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
        console.error('Error loading log files:', error);
        showAlert('❌ Failed to load log files: ' + error.message, 'error', 'log-files-alert');
    }
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
        
        return `
            <div class="log-file-item" style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 10px; background: #f9f9f9;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${file.name}</strong>
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
        console.log(`📖 Attempting to load log file: ${filename}`);
        
        // Check if required elements exist
        const logViewer = document.getElementById('log-viewer');
        const currentLogFile = document.getElementById('current-log-file');
        const logContent = document.getElementById('log-content');
        const logLines = document.getElementById('log-lines');
        
        if (!logViewer || !currentLogFile || !logContent) {
            console.error('Required log viewer elements not found:', {
                logViewer: !!logViewer,
                currentLogFile: !!currentLogFile,
                logContent: !!logContent
            });
            showAlert('❌ Log viewer elements not found in DOM', 'error', 'log-files-alert');
            return;
        }
        
        showAlert(`📖 Loading ${filename}...`, 'info', 'log-files-alert');
        
        const lines = logLines ? logLines.value : 100;
        const url = `${API_BASE}/api/admin/log-files/${encodeURIComponent(filename)}?lines=${lines}`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (data.success) {
            currentLogFile.textContent = filename;
            logContent.textContent = data.lines.join('\n') || '(Empty log file)';
            logViewer.style.display = 'block';
            
            // Store current filename for refresh
            logViewer.dataset.filename = filename;
            
            // Don't scroll - let the viewer appear in place
            // logViewer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            showAlert('✅ Log file loaded successfully', 'success', 'log-files-alert');
            console.log(`✅ Successfully loaded ${data.lines.length} lines from ${filename}`);
        } else {
            throw new Error(data.error || 'Failed to load log file');
        }
    } catch (error) {
        console.error('Error loading log file:', error);
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
    document.getElementById('log-viewer').style.display = 'none';
    delete document.getElementById('log-viewer').dataset.filename;
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
        console.error('Error testing logging system:', error);
        showAlert('❌ Error testing logging system: ' + error.message, 'error', 'log-config-alert');
    }
}

/**
 * Initialize log management when section is loaded
 */
function initLogManagement() {
    console.log('🔧 Initializing log management...');
    
    // Load initial configuration
    loadLogConfig();
    
    // Load log files
    refreshLogFiles();
    
    console.log('✅ Log management initialized');
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

console.log('✅ Log Management functionality loaded');