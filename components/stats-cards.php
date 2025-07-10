<?php
/**
 * Dashboard Sidebar Component
 * File: /opt/bitnami/apache/htdocs/nad-app/components/sidebar.php
 */

$current_section = $_GET['section'] ?? 'overview';
$navigation_items = [
    'overview' => ['icon' => '📊', 'label' => 'Overview', 'badge' => null],
    'tests' => ['icon' => '🧪', 'label' => 'Test Management', 'badge' => 'tests-count'],
    'users' => ['icon' => '👥', 'label' => 'User Management', 'badge' => 'users-count'],
    'supplements' => ['icon' => '💊', 'label' => 'Supplements', 'badge' => null],
    'analytics' => ['icon' => '📈', 'label' => 'Analytics', 'badge' => null],
    'system' => ['icon' => '⚙️', 'label' => 'System Health', 'badge' => 'alerts-count']
];
?>

<div class="sidebar">
    <div class="sidebar-header">
        <h2>🔧 Admin Panel</h2>
        <div class="admin-info">
            <div class="admin-avatar">👤</div>
            <div class="admin-details">
                <div class="admin-name">Administrator</div>
                <div class="admin-role">System Admin</div>
            </div>
        </div>
    </div>
    
    <nav class="sidebar-nav">
        <ul class="nav-menu">
            <?php foreach ($navigation_items as $section => $item): ?>
                <li class="nav-item">
                    <a href="?section=<?= $section ?>" 
                       class="nav-link <?= $current_section === $section ? 'active' : '' ?>"
                       data-section="<?= $section ?>">
                        <span class="nav-icon"><?= $item['icon'] ?></span>
                        <span class="nav-label"><?= $item['label'] ?></span>
                        <?php if ($item['badge']): ?>
                            <span class="nav-badge" id="<?= $item['badge'] ?>">0</span>
                        <?php endif; ?>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    </nav>
    
    <div class="sidebar-footer">
        <div class="system-info">
            <div class="info-item">
                <span class="info-label">Version:</span>
                <span class="info-value">v2.0</span>
            </div>
            <div class="info-item">
                <span class="info-label">Uptime:</span>
                <span class="info-value" id="system-uptime">Loading...</span>
            </div>
            <div class="info-item">
                <span class="info-label">API:</span>
                <span class="info-value status-online" id="api-status">Online</span>
            </div>
        </div>
    </div>
</div>

<style>
.sidebar {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.sidebar-header {
    padding: 20px;
    border-bottom: 1px solid rgba(0,0,0,0.1);
}

.sidebar-header h2 {
    margin: 0 0 15px 0;
    text-align: center;
}

.admin-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 8px;
}

.admin-avatar {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
}

.admin-details {
    flex: 1;
}

.admin-name {
    font-weight: 600;
    font-size: 14px;
    color: #333;
}

.admin-role {
    font-size: 12px;
    color: #666;
}

.sidebar-nav {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.nav-menu {
    list-style: none;
    margin: 0;
    padding: 0;
}

.nav-item {
    margin-bottom: 5px;
}

.nav-link {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    color: #333;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
}

.nav-link:hover, .nav-link.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    transform: translateX(4px);
}

.nav-icon {
    font-size: 18px;
    margin-right: 12px;
    min-width: 24px;
    text-align: center;
}

.nav-label {
    flex: 1;
    font-weight: 500;
}

.nav-badge {
    background: #dc3545;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
    line-height: 1.2;
}

.nav-link.active .nav-badge {
    background: rgba(255,255,255,0.3);
}

.sidebar-footer {
    padding: 20px;
    border-top: 1px solid rgba(0,0,0,0.1);
    background: rgba(0,0,0,0.02);
}

.system-info {
    font-size: 12px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
}

.info-label {
    color: #666;
}

.info-value {
    color: #333;
    font-weight: 500;
}

.status-online {
    color: #28a745;
}

.status-offline {
    color: #dc3545;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .sidebar {
        position: fixed;
        top: 0;
        left: -250px;
        width: 250px;
        z-index: 1000;
        background: rgba(255,255,255,0.98);
        backdrop-filter: blur(10px);
        transition: left 0.3s ease;
        box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    }
    
    .sidebar.open {
        left: 0;
    }
    
    .nav-label {
        font-size: 14px;
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Update system uptime
    function updateUptime() {
        const startTime = new Date('2025-01-01'); // Adjust to your deployment date
        const now = new Date();
        const diff = Math.floor((now - startTime) / (1000 * 60 * 60 * 24));
        document.getElementById('system-uptime').textContent = `${diff}d`;
    }
    
    updateUptime();
    setInterval(updateUptime, 60000); // Update every minute
    
    // Update badges with real data
    async function updateNavigationBadges() {
        try {
            const response = await fetch('<?= API_BASE_URL ?>/api/dashboard/stats');
            const data = await response.json();
            
            if (data.success) {
                const testsCount = document.getElementById('tests-count');
                const usersCount = document.getElementById('users-count');
                const alertsCount = document.getElementById('alerts-count');
                
                if (testsCount) testsCount.textContent = data.stats.pending_tests || 0;
                if (usersCount) usersCount.textContent = data.stats.total_users || 0;
                if (alertsCount) alertsCount.textContent = data.stats.alerts || 0;
            }
        } catch (error) {
            console.warn('Failed to update navigation badges:', error);
        }
    }
    
    updateNavigationBadges();
    setInterval(updateNavigationBadges, 30000); // Update every 30 seconds
});
</script>
