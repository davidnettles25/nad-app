<?php
/**
 * Dashboard Header Component
 * File: /opt/bitnami/apache/htdocs/nad-app/components/header.php
 */
?>
<div class="header">
    <h1>NAD Test Administration</h1>
    <p>Real-time management dashboard - Connected to https://mynadtest.info</p>
    <div class="header-actions">
        <button class="btn btn-secondary" onclick="refreshData()" id="refresh-btn">
            <span id="refresh-spinner"></span>🔄 Refresh Data
        </button>
        <button class="btn" onclick="testAPI()">
            🔍 Test API
        </button>
        <div class="connection-status" id="connection-status">
            <span class="status-indicator online" id="status-indicator"></span>
            <span id="status-text">Connected</span>
        </div>
    </div>
</div>

<style>
.header-actions {
    display: flex;
    gap: 15px;
    align-items: center;
    margin-top: 15px;
    flex-wrap: wrap;
}

.connection-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #666;
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #28a745;
    animation: pulse 2s infinite;
}

.status-indicator.offline {
    background: #dc3545;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

@media (max-width: 768px) {
    .header-actions {
        justify-content: center;
    }
    
    .header h1 {
        font-size: 1.8em;
    }
}
</style>
