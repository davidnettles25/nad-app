<?php
/**
 * Overview Section
 * File: /opt/bitnami/apache/htdocs/nad-app/sections/overview.php
 */
?>

<div id="overview" class="content-section active">
    <!-- Stats Cards Component -->
    <?php 
    $visible_stats = ['total_tests', 'completed_tests', 'pending_tests', 'activated_tests'];
    include __DIR__ . '/../components/stats-cards.php'; 
    ?>

    <!-- Quick Actions Grid -->
    <div class="quick-actions">
        <div class="action-card" onclick="refreshData()">
            <div class="action-icon">🔄</div>
            <h4>Refresh Data</h4>
            <p>Update from live API</p>
            <div class="action-badge" id="last-refresh">Just now</div>
        </div>
        <div class="action-card" onclick="showSection('tests')">
            <div class="action-icon">🧪</div>
            <h4>Manage Tests</h4>
            <p>View all tests</p>
            <div class="action-badge" id="pending-tests-badge">0 pending</div>
        </div>
        <div class="action-card" onclick="activateAllTests()">
            <div class="action-icon">⚡</div>
            <h4>Activate Tests</h4>
            <p>Activate pending tests</p>
            <div class="action-badge" id="activation-available">Ready</div>
        </div>
        <div class="action-card" onclick="showSection('analytics')">
            <div class="action-icon">📈</div>
            <h4>View Analytics</h4>
            <p>Performance insights</p>
            <div class="action-badge success">Trending</div>
        </div>
        <div class="action-card" onclick="showSection('users')">
            <div class="action-icon">👥</div>
            <h4>User Management</h4>
            <p>Manage user roles</p>
            <div class="action-badge" id="users-count-badge">0 users</div>
        </div>
        <div class="action-card" onclick="showSection('system')">
            <div class="action-icon">⚙️</div>
            <h4>System Status</h4>
            <p>API health check</p>
            <div class="action-badge" id="system-health">Healthy</div>
        </div>
    </div>

    <!-- Current Status Card -->
    <div class="card">
        <h3>📈 Current Status</h3>
        <div class="status-grid">
            <div class="status-item success">
                <div class="status-icon">✅</div>
                <div class="status-content">
                    <h4>System Status: All Good</h4>
                    <p><strong>Your NAD Test system is running perfectly!</strong></p>
                    <div class="status-details" id="overview-stats">
                        Loading system statistics...
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Recent Activity -->
    <div class="card">
        <h3>🕒 Recent Activity</h3>
        <div class="activity-feed" id="recent-activity">
            <div class="activity-item">
                <div class="activity-icon">🧪</div>
                <div class="activity-content">
                    <div class="activity-title">Loading recent activities...</div>
                    <div class="activity-time">Just now</div>
                </div>
            </div>
        </div>
        <div class="activity-actions">
            <button class="btn btn-secondary" onclick="loadRecentActivity()">
                🔄 Refresh Activity
            </button>
            <button class="btn" onclick="showSection('analytics')">
                📊 View Full Log
            </button>
        </div>
    </div>

    <!-- Alerts and Notifications -->
    <div class="card" id="alerts-card" style="display: none;">
        <h3>🚨 Alerts & Notifications</h3>
        <div class="alerts-container" id="alerts-container">
            <!-- Alerts will be populated here -->
        </div>
    </div>
</div>

<style>
.quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.action-card {
    background: rgba(255,255,255,0.95);
    padding: 25px;
    border-radius: 15px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
}

.action-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

.action-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.action-icon {
    font-size: 2.5em;
    margin-bottom: 15px;
    opacity: 0.8;
}

.action-card h4 {
    color: #333;
    margin-bottom: 8px;
    font-size: 1.1em;
}

.action-card p {
    color: #666;
    font-size: 0.9em;
    margin-bottom: 15px;
}

.action-badge {
    background: #e9ecef;
    color: #495057;
    font-size: 0.8em;
    padding: 4px 12px;
    border-radius: 20px;
    display: inline-block;
    font-weight: 500;
}

.action-badge.success {
    background: #d4edda;
    color: #155724;
}

.action-badge.warning {
    background: #fff3cd;
    color: #856404;
}

.action-badge.danger {
    background: #f8d7da;
    color: #721c24;
}

.status-grid {
    display: grid;
    gap: 20px;
}

.status-item {
    padding: 20px;
    border-radius: 12px;
    display: flex;
    align-items: flex-start;
    gap: 15px;
}

.status-item.success {
    background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
    border: 2px solid #2196f3;
}

.status-icon {
    font-size: 2em;
    flex-shrink: 0;
}

.status-content {
    flex: 1;
}

.status-content h4 {
    color: #1976d2;
    margin-bottom: 8px;
    font-size: 1.2em;
}

.status-content p {
    margin-bottom: 10px;
    color: #333;
}

.status-details {
    font-size: 14px;
    color: #666;
    background: rgba(255,255,255,0.7);
    padding: 10px;
    border-radius: 6px;
    border-left: 3px solid #2196f3;
}

.activity-feed {
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 20px;
}

.activity-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border-bottom: 1px solid #e9ecef;
    transition: background 0.3s ease;
}

.activity-item:hover {
    background: #f8f9fa;
}

.activity-item:last-child {
    border-bottom: none;
}

.activity-icon {
    font-size: 1.5em;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    background: #f8f9fa;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.activity-content {
    flex: 1;
}

.activity-title {
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
}

.activity-time {
    font-size: 0.85em;
    color: #666;
}

.activity-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
}

.alerts-container {
    display: grid;
    gap: 15px;
}

.alert-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid;
}

.alert-item.warning {
    background: #fff3cd;
    border-left-color: #ffc107;
    color: #856404;
}

.alert-item.danger {
    background: #f8d7da;
    border-left-color: #dc3545;
    color: #721c24;
}

.alert-item.info {
    background: #d1ecf1;
    border-left-color: #17a2b8;
    color: #0c5460;
}

@media (max-width: 768px) {
    .quick-actions {
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
    }
    
    .action-card {
        padding: 20px;
    }
    
    .action-icon {
        font-size: 2em;
    }
    
    .status-item {
        flex-direction: column;
        text-align: center;
    }
    
    .activity-actions {
        flex-direction: column;
    }
}
</style>

<script>
class OverviewManager {
    constructor() {
        this.refreshInterval = null;
        this.lastRefresh = new Date();
        this.init();
    }
    
    init() {
        this.loadOverviewData();
        this.startAutoRefresh();
        this.updateLastRefreshTime();
    }
    
    async loadOverviewData() {
        try {
            // Load system stats
            await this.loadSystemStats();
            
            // Load recent activity
            await this.loadRecentActivity();
            
            // Load alerts
            await this.loadAlerts();
            
            // Update action badges
            this.updateActionBadges();
            
        } catch (error) {
            console.error('Error loading overview data:', error);
            this.showError('Failed to load overview data');
        }
    }
    
    async loadSystemStats() {
        try {
            const response = await fetch('<?= API_BASE_URL ?>/api/dashboard/stats');
            const data = await response.json();
            
            if (data.success) {
                this.updateSystemStatus(data.stats);
            }
        } catch (error) {
            console.error('Error loading system stats:', error);
        }
    }
    
    updateSystemStatus(stats) {
        const overviewStats = document.getElementById('overview-stats');
        if (overviewStats) {
            const total = stats.total_tests || 0;
            const activated = stats.activated_tests || 0;
            const completed = stats.completed_tests || 0;
            const pending = total - activated;
            
            const activationRate = total > 0 ? ((activated / total) * 100).toFixed(1) : 0;
            const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
            
            overviewStats.innerHTML = `
                📊 <strong>${total} tests created</strong> • 
                🎯 <strong>${activated} activated (${activationRate}%)</strong> • 
                ⏳ <strong>${pending} pending</strong> • 
                🏁 <strong>${completed} completed (${completionRate}%)</strong>
            `;
        }
    }
    
    async loadRecentActivity() {
        try {
            // Mock recent activity data - replace with real API call
            const activities = [
                { icon: '🧪', title: 'New test generated: NAD-20250109-1234', time: '2 minutes ago' },
                { icon: '⚡', title: 'Test NAD-20250109-1233 activated', time: '5 minutes ago' },
                { icon: '📊', title: 'Test results submitted by Lab Tech 001', time: '8 minutes ago' },
                { icon: '👥', title: 'New user registered: Customer 1005', time: '12 minutes ago' },
                { icon: '✅', title: 'Test NAD-20250109-1232 completed', time: '15 minutes ago' }
            ];
            
            this.renderRecentActivity(activities);
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }
    
    renderRecentActivity(activities) {
        const activityFeed = document.getElementById('recent-activity');
        if (activityFeed) {
            activityFeed.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">${activity.icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    async loadAlerts() {
        try {
            // Mock alerts data - replace with real API call
            const alerts = [
                // { type: 'warning', message: '15 tests pending activation for more than 24 hours', time: '1 hour ago' },
                // { type: 'info', message: 'System backup completed successfully', time: '3 hours ago' }
            ];
            
            if (alerts.length > 0) {
                this.renderAlerts(alerts);
                document.getElementById('alerts-card').style.display = 'block';
            } else {
                document.getElementById('alerts-card').style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }
    
    renderAlerts(alerts) {
        const alertsContainer = document.getElementById('alerts-container');
        if (alertsContainer) {
            alertsContainer.innerHTML = alerts.map(alert => `
                <div class="alert-item ${alert.type}">
                    <div class="alert-icon">
                        ${alert.type === 'warning' ? '⚠️' : alert.type === 'danger' ? '🚨' : 'ℹ️'}
                    </div>
                    <div class="alert-content">
                        <div class="alert-message">${alert.message}</div>
                        <div class="alert-time">${alert.time}</div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    updateActionBadges() {
        // Update pending tests badge
        if (window.statsCards && window.statsCards.stats) {
            const stats = window.statsCards.stats;
            
            const pendingBadge = document.getElementById('pending-tests-badge');
            if (pendingBadge) {
                const pending = (stats.total_tests || 0) - (stats.activated_tests || 0);
                pendingBadge.textContent = `${pending} pending`;
                pendingBadge.className = `action-badge ${pending > 0 ? 'warning' : 'success'}`;
            }
            
            const usersBadge = document.getElementById('users-count-badge');
            if (usersBadge) {
                // This would come from a users stats API call
                usersBadge.textContent = '4 users'; // placeholder
            }
            
            const systemHealth = document.getElementById('system-health');
            if (systemHealth) {
                systemHealth.textContent = 'Healthy';
                systemHealth.className = 'action-badge success';
            }
        }
    }
    
    updateLastRefreshTime() {
        const refreshBadge = document.getElementById('last-refresh');
        if (refreshBadge) {
            const now = new Date();
            const diff = Math.floor((now - this.lastRefresh) / 1000);
            
            if (diff < 60) {
                refreshBadge.textContent = `${diff}s ago`;
            } else if (diff < 3600) {
                refreshBadge.textContent = `${Math.floor(diff / 60)}m ago`;
            } else {
                refreshBadge.textContent = `${Math.floor(diff / 3600)}h ago`;
            }
        }
    }
    
    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadOverviewData();
        }, 30000);
        
        // Update refresh time every 10 seconds
        setInterval(() => {
            this.updateLastRefreshTime();
        }, 10000);
    }
    
    refresh() {
        this.lastRefresh = new Date();
        this.loadOverviewData();
        
        const refreshBadge = document.getElementById('last-refresh');
        if (refreshBadge) {
            refreshBadge.textContent = 'Just now';
            refreshBadge.className = 'action-badge success';
            setTimeout(() => {
                refreshBadge.className = 'action-badge';
            }, 2000);
        }
    }
    
    showError(message) {
        if (window.showAlert) {
            window.showAlert(`⚠️ ${message}`, 'error');
        }
    }
}

// Global functions
function loadRecentActivity() {
    if (window.overviewManager) {
        window.overviewManager.loadRecentActivity();
    }
}

function activateAllTests() {
    if (confirm('Activate all pending tests?')) {
        if (window.activateAllPendingTests) {
            window.activateAllPendingTests();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('overview')) {
        window.overviewManager = new OverviewManager();
    }
});

// Export for global access
window.OverviewManager = OverviewManager;
window.loadRecentActivity = loadRecentActivity;
window.activateAllTests = activateAllTests;
</script>
