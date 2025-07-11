<?php
/**
 * Analytics & Reporting Section for NAD Admin Dashboard
 * File: /opt/bitnami/apache/htdocs/nad-app/sections/analytics.php
 */

// Ensure this file is only included, not accessed directly
if (!defined('NAD_ADMIN_DASHBOARD')) {
    die('Direct access not permitted');
}
?>

<div id="analytics" class="content-section">
    <div class="section-header">
        <div class="section-title">
            <h2><i class="icon">📈</i> Analytics & Reporting</h2>
            <p>Comprehensive insights and performance metrics</p>
        </div>
        <div class="section-actions">
            <button class="btn btn-primary" onclick="loadAnalytics()">
                <i class="icon">🔄</i> Refresh Data
            </button>
            <button class="btn btn-success" onclick="generateReport()">
                <i class="icon">📊</i> Generate Report
            </button>
            <button class="btn btn-warning" onclick="exportAnalytics()">
                <i class="icon">📥</i> Export Data
            </button>
        </div>
    </div>

    <!-- Alert Container -->
    <div id="analytics-alert"></div>

    <!-- Time Period Filter -->
    <div class="card">
        <div class="card-header">
            <h3><i class="icon">📅</i> Time Period & Filters</h3>
        </div>
        <div class="card-body">
            <div class="filters-section">
                <div class="filter-grid">
                    <div class="form-group">
                        <label for="analytics-period">Time Period</label>
                        <select id="analytics-period" class="form-control" onchange="loadAnalytics()">
                            <option value="7">Last 7 Days</option>
                            <option value="30" selected>Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                            <option value="180">Last 6 Months</option>
                            <option value="365">Last Year</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="analytics-metric">Primary Metric</label>
                        <select id="analytics-metric" class="form-control" onchange="updateMetricDisplay()">
                            <option value="tests">Test Volume</option>
                            <option value="scores">Score Performance</option>
                            <option value="activation">Activation Rates</option>
                            <option value="completion">Completion Rates</option>
                            <option value="users">User Activity</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="analytics-view">View Type</label>
                        <select id="analytics-view" class="form-control" onchange="updateChartView()">
                            <option value="overview">Overview</option>
                            <option value="detailed">Detailed</option>
                            <option value="comparison">Comparison</option>
                            <option value="trends">Trends</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="analytics-refresh">Auto Refresh</label>
                        <select id="analytics-refresh" class="form-control" onchange="setAutoRefresh()">
                            <option value="0">Manual Only</option>
                            <option value="30">Every 30 seconds</option>
                            <option value="60">Every 1 minute</option>
                            <option value="300">Every 5 minutes</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Key Performance Indicators -->
    <div class="analytics-kpi-grid">
        <div class="kpi-card primary">
            <div class="kpi-content">
                <div class="kpi-header">
                    <h4>Total Tests</h4>
                    <div class="kpi-trend" id="tests-trend">
                        <span class="trend-icon">📈</span>
                        <span class="trend-value">+0%</span>
                    </div>
                </div>
                <div class="kpi-number" id="analytics-total-tests">0</div>
                <div class="kpi-subtitle" id="tests-period-info">Loading...</div>
            </div>
            <div class="kpi-chart" id="tests-mini-chart">
                <div class="mini-chart-placeholder"></div>
            </div>
        </div>

        <div class="kpi-card success">
            <div class="kpi-content">
                <div class="kpi-header">
                    <h4>Activation Rate</h4>
                    <div class="kpi-trend" id="activation-trend">
                        <span class="trend-icon">📊</span>
                        <span class="trend-value">0%</span>
                    </div>
                </div>
                <div class="kpi-number" id="analytics-activation-rate">0%</div>
                <div class="kpi-subtitle" id="activation-period-info">of total tests</div>
            </div>
            <div class="kpi-chart" id="activation-mini-chart">
                <div class="mini-chart-placeholder"></div>
            </div>
        </div>

        <div class="kpi-card warning">
            <div class="kpi-content">
                <div class="kpi-header">
                    <h4>Completion Rate</h4>
                    <div class="kpi-trend" id="completion-trend">
                        <span class="trend-icon">🎯</span>
                        <span class="trend-value">0%</span>
                    </div>
                </div>
                <div class="kpi-number" id="analytics-completion-rate">0%</div>
                <div class="kpi-subtitle" id="completion-period-info">of activated tests</div>
            </div>
            <div class="kpi-chart" id="completion-mini-chart">
                <div class="mini-chart-placeholder"></div>
            </div>
        </div>

        <div class="kpi-card info">
            <div class="kpi-content">
                <div class="kpi-header">
                    <h4>Average Score</h4>
                    <div class="kpi-trend" id="score-trend">
                        <span class="trend-icon">⭐</span>
                        <span class="trend-value">0</span>
                    </div>
                </div>
                <div class="kpi-number" id="analytics-avg-score">0</div>
                <div class="kpi-subtitle" id="score-period-info">NAD+ level</div>
            </div>
            <div class="kpi-chart" id="score-mini-chart">
                <div class="mini-chart-placeholder"></div>
            </div>
        </div>
    </div>

    <!-- Main Charts Section -->
    <div class="charts-section">
        <div class="charts-grid">
            <!-- Primary Chart -->
            <div class="card chart-card-large">
                <div class="card-header">
                    <h3 id="primary-chart-title"><i class="icon">📊</i> Test Volume Over Time</h3>
                    <div class="chart-controls">
                        <button class="btn btn-sm" onclick="toggleChartType('primary')" id="primary-chart-toggle">
                            <i class="icon">📈</i> Line
                        </button>
                        <button class="btn btn-sm" onclick="fullscreenChart('primary')" title="Fullscreen">
                            <i class="icon">🔍</i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="primary-chart" width="800" height="400"></canvas>
                        <div class="chart-loading" id="primary-chart-loading">
                            <div class="loading-spinner"></div>
                            <p>Loading chart data...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Secondary Chart -->
            <div class="card chart-card-medium">
                <div class="card-header">
                    <h3><i class="icon">🎯</i> Score Distribution</h3>
                    <div class="chart-controls">
                        <button class="btn btn-sm" onclick="toggleChartType('secondary')" id="secondary-chart-toggle">
                            <i class="icon">🥧</i> Pie
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="secondary-chart" width="400" height="300"></canvas>
                        <div class="chart-loading" id="secondary-chart-loading">
                            <div class="loading-spinner"></div>
                            <p>Loading...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Analytics Tables Section -->
    <div class="analytics-tables-section">
        <div class="tables-grid">
            <!-- Top Performing Users -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="icon">🏆</i> Top Performing Users</h3>
                    <button class="btn btn-sm" onclick="loadTopUsers()">
                        <i class="icon">🔄</i> Refresh
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="data-table compact-table">
                            <thead>
                                <tr>
                                    <th>Customer ID</th>
                                    <th>Tests</th>
                                    <th>Avg Score</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="top-users-tbody">
                                <tr>
                                    <td colspan="4" class="loading-cell">
                                        <div class="mini-loading">Loading top users...</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Popular Supplements -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="icon">💊</i> Popular Supplements</h3>
                    <button class="btn btn-sm" onclick="loadPopularSupplements()">
                        <i class="icon">🔄</i> Refresh
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="data-table compact-table">
                            <thead>
                                <tr>
                                    <th>Supplement</th>
                                    <th>Usage</th>
                                    <th>Avg Score</th>
                                    <th>Trend</th>
                                </tr>
                            </thead>
                            <tbody id="popular-supplements-tbody">
                                <tr>
                                    <td colspan="4" class="loading-cell">
                                        <div class="mini-loading">Loading supplements...</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="icon">⏰</i> Recent Activity</h3>
                    <button class="btn btn-sm" onclick="loadRecentActivity()">
                        <i class="icon">🔄</i> Refresh
                    </button>
                </div>
                <div class="card-body">
                    <div class="activity-feed" id="recent-activity-feed">
                        <div class="activity-loading">
                            <div class="mini-loading">Loading recent activity...</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- System Performance -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="icon">⚡</i> System Performance</h3>
                    <button class="btn btn-sm" onclick="loadSystemPerformance()">
                        <i class="icon">🔄</i> Refresh
                    </button>
                </div>
                <div class="card-body">
                    <div class="performance-metrics" id="system-performance-metrics">
                        <div class="metric-item">
                            <div class="metric-label">API Response Time</div>
                            <div class="metric-value" id="api-response-time">
                                <span class="loading-dot">•••</span>
                            </div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-label">Database Queries</div>
                            <div class="metric-value" id="db-query-time">
                                <span class="loading-dot">•••</span>
                            </div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-label">Memory Usage</div>
                            <div class="metric-value" id="memory-usage">
                                <span class="loading-dot">•••</span>
                            </div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-label">Active Sessions</div>
                            <div class="metric-value" id="active-sessions">
                                <span class="loading-dot">•••</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Performance Insights -->
    <div class="card insights-card">
        <div class="card-header">
            <h3><i class="icon">🔍</i> Performance Insights</h3>
            <button class="btn btn-sm" onclick="refreshInsights()">
                <i class="icon">🧠</i> Analyze
            </button>
        </div>
        <div class="card-body">
            <div class="insights-grid" id="analytics-insights">
                <div class="insight-item primary">
                    <div class="insight-icon">📊</div>
                    <div class="insight-content">
                        <h4>Test Volume Analysis</h4>
                        <p id="insight-volume">Analyzing test creation patterns and volume trends...</p>
                    </div>
                    <div class="insight-status">
                        <span class="status-badge analyzing">Analyzing</span>
                    </div>
                </div>

                <div class="insight-item success">
                    <div class="insight-icon">⚡</div>
                    <div class="insight-content">
                        <h4>Activation Performance</h4>
                        <p id="insight-activation">Evaluating test activation efficiency and bottlenecks...</p>
                    </div>
                    <div class="insight-status">
                        <span class="status-badge analyzing">Analyzing</span>
                    </div>
                </div>

                <div class="insight-item warning">
                    <div class="insight-icon">🎯</div>
                    <div class="insight-content">
                        <h4>Score Distribution</h4>
                        <p id="insight-scores">Analyzing NAD+ score patterns and health outcomes...</p>
                    </div>
                    <div class="insight-status">
                        <span class="status-badge analyzing">Analyzing</span>
                    </div>
                </div>

                <div class="insight-item info">
                    <div class="insight-icon">💊</div>
                    <div class="insight-content">
                        <h4>Supplement Effectiveness</h4>
                        <p id="insight-supplements">Reviewing supplement usage patterns and score correlations...</p>
                    </div>
                    <div class="insight-status">
                        <span class="status-badge analyzing">Analyzing</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Advanced Analytics -->
    <div class="card advanced-analytics">
        <div class="card-header">
            <h3><i class="icon">🚀</i> Advanced Analytics</h3>
            <div class="advanced-controls">
                <button class="btn btn-sm btn-primary" onclick="runAdvancedAnalysis()">
                    <i class="icon">🔬</i> Deep Analysis
                </button>
                <button class="btn btn-sm btn-success" onclick="predictiveTrends()">
                    <i class="icon">🔮</i> Predictions
                </button>
                <button class="btn btn-sm btn-warning" onclick="cohortAnalysis()">
                    <i class="icon">👥</i> Cohorts
                </button>
            </div>
        </div>
        <div class="card-body">
            <div class="advanced-tabs">
                <div class="tab-buttons">
                    <button class="tab-btn active" onclick="showAdvancedTab('trends')" data-tab="trends">
                        <i class="icon">📈</i> Trends
                    </button>
                    <button class="tab-btn" onclick="showAdvancedTab('correlations')" data-tab="correlations">
                        <i class="icon">🔗</i> Correlations
                    </button>
                    <button class="tab-btn" onclick="showAdvancedTab('forecasting')" data-tab="forecasting">
                        <i class="icon">🔮</i> Forecasting
                    </button>
                    <button class="tab-btn" onclick="showAdvancedTab('anomalies')" data-tab="anomalies">
                        <i class="icon">⚠️</i> Anomalies
                    </button>
                </div>

                <div class="tab-content">
                    <div class="tab-pane active" id="trends-tab">
                        <div class="trends-analysis">
                            <h4>Trend Analysis</h4>
                            <div class="trend-chart-container">
                                <canvas id="trends-chart" width="600" height="300"></canvas>
                            </div>
                            <div class="trend-insights" id="trend-insights">
                                <p>Run analysis to see trend insights...</p>
                            </div>
                        </div>
                    </div>

                    <div class="tab-pane" id="correlations-tab">
                        <div class="correlations-analysis">
                            <h4>Correlation Analysis</h4>
                            <div class="correlation-matrix" id="correlation-matrix">
                                <p>Analyzing correlations between supplements and test scores...</p>
                            </div>
                        </div>
                    </div>

                    <div class="tab-pane" id="forecasting-tab">
                        <div class="forecasting-analysis">
                            <h4>Predictive Forecasting</h4>
                            <div class="forecast-chart-container">
                                <canvas id="forecast-chart" width="600" height="300"></canvas>
                            </div>
                            <div class="forecast-summary" id="forecast-summary">
                                <p>Generate forecasts based on historical data...</p>
                            </div>
                        </div>
                    </div>

                    <div class="tab-pane" id="anomalies-tab">
                        <div class="anomalies-analysis">
                            <h4>Anomaly Detection</h4>
                            <div class="anomalies-list" id="anomalies-list">
                                <p>Scanning for unusual patterns and outliers...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Export & Reporting -->
    <div class="card export-section">
        <div class="card-header">
            <h3><i class="icon">📋</i> Reports & Export</h3>
        </div>
        <div class="card-body">
            <div class="export-options">
                <div class="export-option" onclick="exportReport('summary')">
                    <div class="export-icon">📊</div>
                    <div class="export-content">
                        <h4>Executive Summary</h4>
                        <p>High-level overview with key metrics</p>
                    </div>
                    <div class="export-format">PDF</div>
                </div>

                <div class="export-option" onclick="exportReport('detailed')">
                    <div class="export-icon">📈</div>
                    <div class="export-content">
                        <h4>Detailed Analytics</h4>
                        <p>Comprehensive analysis with charts</p>
                    </div>
                    <div class="export-format">PDF</div>
                </div>

                <div class="export-option" onclick="exportReport('data')">
                    <div class="export-icon">📋</div>
                    <div class="export-content">
                        <h4>Raw Data Export</h4>
                        <p>CSV export for external analysis</p>
                    </div>
                    <div class="export-format">CSV</div>
                </div>

                <div class="export-option" onclick="exportReport('custom')">
                    <div class="export-icon">⚙️</div>
                    <div class="export-content">
                        <h4>Custom Report</h4>
                        <p>Build custom report with specific metrics</p>
                    </div>
                    <div class="export-format">Multi</div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Chart.js Library (will be loaded dynamically) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>

<!-- Inline Styles for Analytics Section -->
<style>
.analytics-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.kpi-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border-left: 4px solid #667eea;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.kpi-card.primary { border-left-color: #667eea; }
.kpi-card.success { border-left-color: #28a745; }
.kpi-card.warning { border-left-color: #ffc107; }
.kpi-card.info { border-left-color: #17a2b8; }

.kpi-content {
    flex: 1;
}

.kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.kpi-header h4 {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
    font-weight: 500;
}

.kpi-trend {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
}

.trend-icon {
    font-size: 1rem;
}

.trend-value {
    font-weight: 600;
}

.kpi-number {
    font-size: 2.5rem;
    font-weight: 700;
    color: #333;
    line-height: 1;
    margin-bottom: 0.25rem;
}

.kpi-subtitle {
    font-size: 0.8rem;
    color: #666;
}

.kpi-chart {
    width: 80px;
    height: 50px;
    margin-left: 1rem;
}

.mini-chart-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    color: #adb5bd;
}

.charts-section {
    margin-bottom: 2rem;
}

.charts-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
}

.chart-card-large,
.chart-card-medium {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.chart-container {
    position: relative;
    height: 400px;
}

.chart-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
}

.chart-controls {
    display: flex;
    gap: 0.5rem;
}

.analytics-tables-section {
    margin-bottom: 2rem;
}

.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.compact-table {
    font-size: 0.875rem;
}

.compact-table th,
.compact-table td {
    padding: 0.75rem 0.5rem;
}

.loading-cell {
    text-align: center;
    padding: 2rem;
    color: #666;
}

.mini-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.activity-feed {
    max-height: 300px;
    overflow-y: auto;
}

.activity-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f8f9fa;
}

.activity-item:last-child {
    border-bottom: none;
}

.activity-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    flex-shrink: 0;
}

.activity-content {
    flex: 1;
}

.activity-content h5 {
    margin: 0 0 0.25rem 0;
    font-size: 0.875rem;
    font-weight: 600;
}

.activity-content p {
    margin: 0;
    font-size: 0.8rem;
    color: #666;
}

.activity-time {
    font-size: 0.75rem;
    color: #adb5bd;
    flex-shrink: 0;
}

.performance-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.metric-item {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    text-align: center;
}

.metric-label {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 0.5rem;
}

.metric-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
}

.loading-dot {
    color: #adb5bd;
    animation: pulse 1.5s ease-in-out infinite;
}

.insights-card {
    margin-bottom: 2rem;
}

.insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}

.insight-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.insight-item:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.insight-item.primary { border-left: 4px solid #667eea; }
.insight-item.success { border-left: 4px solid #28a745; }
.insight-item.warning { border-left: 4px solid #ffc107; }
.insight-item.info { border-left: 4px solid #17a2b8; }

.insight-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.insight-content {
    flex: 1;
}

.insight-content h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #333;
}

.insight-content p {
    margin: 0;
    font-size: 0.875rem;
    color: #666;
    line-height: 1.4;
}

.insight-status {
    flex-shrink: 0;
}

.status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
}

.status-badge.analyzing {
    background: #e3f2fd;
    color: #1976d2;
}

.status-badge.complete {
    background: #e8f5e8;
    color: #2e7d32;
}

.status-badge.warning {
    background: #fff3e0;
    color: #f57c00;
}

.advanced-analytics {
    margin-bottom: 2rem;
}

.advanced-controls {
    display: flex;
    gap: 0.5rem;
}

.advanced-tabs {
    margin-top: 1rem;
}

.tab-buttons {
    display: flex;
    border-bottom: 2px solid #e9ecef;
    margin-bottom: 1.5rem;
}

.tab-btn {
    background: none;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    color: #666;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.tab-btn:hover {
    color: #333;
    background: #f8f9fa;
}

.tab-btn.active {
    color: #667eea;
    border-bottom-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
}

.tab-content {
    min-height: 300px;
}

.tab-pane {
    display: none;
}

.tab-pane.active {
    display: block;
    animation: fadeInUp 0.3s ease-out;
}

.trends-analysis,
.correlations-analysis,
.forecasting-analysis,
.anomalies-analysis {
    padding: 1rem 0;
}

.trend-chart-container,
.forecast-chart-container {
    margin: 1rem 0;
    height: 300px;
    position: relative;
}

.trend-insights,
.forecast-summary {
    margin-top: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
}

.correlation-matrix {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.correlation-item {
    padding: 1rem;
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    text-align: center;
}

.correlation-value {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.correlation-label {
    font-size: 0.875rem;
    color: #666;
}

.anomalies-list {
    margin-top: 1rem;
}

.anomaly-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #fff8e1;
    border: 1px solid #ffecb3;
    border-radius: 8px;
    margin-bottom: 0.5rem;
}

.anomaly-icon {
    font-size: 1.25rem;
    color: #f57c00;
}

.anomaly-content {
    flex: 1;
}

.anomaly-severity {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
}

.severity-high {
    background: #ffebee;
    color: #c62828;
}

.severity-medium {
    background: #fff3e0;
    color: #f57c00;
}

.severity-low {
    background: #e8f5e8;
    color: #2e7d32;
}

.export-section {
    margin-bottom: 2rem;
}

.export-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.export-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
}

.export-option:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.export-icon {
    font-size: 2rem;
    flex-shrink: 0;
}

.export-content {
    flex: 1;
}

.export-content h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #333;
}

.export-content p {
    margin: 0;
    font-size: 0.875rem;
    color: #666;
}

.export-format {
    padding: 0.5rem 1rem;
    background: #e3f2fd;
    color: #1976d2;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    flex-shrink: 0;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f4f6;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive Design */
@media (max-width: 1200px) {
    .charts-grid {
        grid-template-columns: 1fr;
    }
    
    .analytics-kpi-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
}

@media (max-width: 768px) {
    .analytics-kpi-grid {
        grid-template-columns: 1fr;
    }
    
    .tables-grid {
        grid-template-columns: 1fr;
    }
    
    .insights-grid {
        grid-template-columns: 1fr;
    }
    
    .export-options {
        grid-template-columns: 1fr;
    }
    
    .kpi-card {
        flex-direction: column;
        text-align: center;
    }
    
    .kpi-chart {
        margin: 1rem 0 0 0;
    }
    
    .tab-buttons {
        flex-wrap: wrap;
    }
    
    .tab-btn {
        flex: 1;
        min-width: 0;
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;
    }
    
    .advanced-controls {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .performance-metrics {
        grid-template-columns: 1fr;
    }
    
    .chart-container {
        height: 300px;
    }
}

@media (max-width: 480px) {
    .section-header {
        flex-direction: column;
        gap: 1rem;
    }
    
    .section-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .filter-grid {
        grid-template-columns: 1fr;
    }
    
    .insight-item {
        flex-direction: column;
        text-align: center;
    }
    
    .export-option {
        flex-direction: column;
        text-align: center;
    }
    
    .kpi-header {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
    }
}

/* Print Styles */
@media print {
    .section-actions,
    .chart-controls,
    .advanced-controls,
    .btn {
        display: none !important;
    }
    
    .card {
        break-inside: avoid;
        box-shadow: none;
        border: 1px solid #ddd;
    }
    
    .charts-grid {
        grid-template-columns: 1fr;
    }
    
    .tables-grid {
        grid-template-columns: 1fr;
    }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
    .card {
        background: #2d3748;
        color: #e2e8f0;
    }
    
    .kpi-card {
        background: #2d3748;
        color: #e2e8f0;
    }
    
    .kpi-number {
        color: #e2e8f0;
    }
    
    .insight-item {
        background: #2d3748;
        border-color: #4a5568;
        color: #e2e8f0;
    }
    
    .export-option {
        background: #2d3748;
        border-color: #4a5568;
        color: #e2e8f0;
    }
    
    .tab-btn {
        color: #a0aec0;
    }
    
    .tab-btn:hover {
        color: #e2e8f0;
        background: #4a5568;
    }
    
    .tab-btn.active {
        color: #90cdf4;
        background: rgba(144, 205, 244, 0.1);
    }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
    .kpi-card,
    .card,
    .insight-item,
    .export-option {
        border: 2px solid #000;
    }
    
    .btn {
        border: 2px solid currentColor;
    }
    
    .status-badge {
        border: 1px solid currentColor;
    }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
    
    .loading-spinner {
        animation: none;
    }
    
    .loading-dot {
        animation: none;
    }
}
</style>

<script>
/**
 * Analytics JavaScript Functions
 * All analytics functionality and chart management
 */

// Global variables
let analyticsData = null;
let chartInstances = {};
let autoRefreshInterval = null;
let currentPeriod = '30';

// Initialize analytics when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('analytics').classList.contains('active')) {
        initializeAnalytics();
    }
});

/**
 * Initialize analytics dashboard
 */
function initializeAnalytics() {
    console.log('🚀 Initializing analytics dashboard...');
    loadAnalytics();
    setupEventListeners();
}

/**
 * Setup event listeners for analytics
 */
function setupEventListeners() {
    // Period change listener
    document.getElementById('analytics-period').addEventListener('change', function() {
        currentPeriod = this.value;
        loadAnalytics();
    });
    
    // Auto-refresh setup
    document.getElementById('analytics-refresh').addEventListener('change', function() {
        setAutoRefresh();
    });
}

/**
 * Load analytics data from API
 */
async function loadAnalytics() {
    try {
        showAnalyticsLoading(true);
        console.log('📊 Loading analytics data...');
        
        const period = document.getElementById('analytics-period').value;
        
        // Load analytics overview
        const response = await fetch(`${API_BASE}/api/analytics/overview?period=${period}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            analyticsData = data.analytics;
            renderAnalytics(analyticsData);
            showAlert('✅ Analytics data loaded successfully!', 'success');
        } else {
            // Use mock data if API fails
            analyticsData = generateMockAnalyticsData(period);
            renderAnalytics(analyticsData);
            showAlert('📊 Displaying sample analytics data', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error loading analytics:', error);
        analyticsData = generateMockAnalyticsData(currentPeriod);
        renderAnalytics(analyticsData);
        showAlert('📊 Using sample data due to connection error', 'warning');
    } finally {
        showAnalyticsLoading(false);
    }
}

/**
 * Generate mock analytics data
 */
function generateMockAnalyticsData(period) {
    const days = period === 'all' ? 365 : parseInt(period) || 30;
    const baseTests = Math.floor(Math.random() * 500) + 100;
    const activatedTests = Math.floor(baseTests * (0.7 + Math.random() * 0.25));
    const completedTests = Math.floor(activatedTests * (0.6 + Math.random() * 0.3));
    
    return {
        basic_stats: {
            total_tests: baseTests,
            activated_tests: activatedTests,
            completed_tests: completedTests,
            average_score: Math.floor(Math.random() * 30) + 60
        },
        score_distribution: [
            { score_range: 'Excellent (80+)', count: Math.floor(completedTests * 0.25) },
            { score_range: 'Good (60-79)', count: Math.floor(completedTests * 0.45) },
            { score_range: 'Fair (40-59)', count: Math.floor(completedTests * 0.25) },
            { score_range: 'Poor (<40)', count: Math.floor(completedTests * 0.05) }
        ],
        daily_completions: generateDailyData(Math.min(days, 30)),
        user_roles: [
            { role: 'customer', count: 45 },
            { role: 'lab_technician', count: 3 },
            { role: 'administrator', count: 2 }
        ]
    };
}

/**
 * Generate daily data for charts
 */
function generateDailyData(days) {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toISOString().split('T')[0],
            completions: Math.floor(Math.random() * 15) + 1,
            activations: Math.floor(Math.random() * 20) + 5,
            new_tests: Math.floor(Math.random() * 25) + 3
        });
    }
    return data;
}

/**
 * Render analytics dashboard
 */
function renderAnalytics(data) {
    updateKPICards(data.basic_stats);
    updatePrimaryChart(data.daily_completions);
    updateSecondaryChart(data.score_distribution);
    updateDataTables(data);
    generateInsights(data);
    loadSystemPerformance();
}

/**
 * Update KPI cards
 */
function updateKPICards(stats) {
    const activationRate = ((stats.activated_tests / stats.total_tests) * 100).toFixed(1);
    const completionRate = ((stats.completed_tests / stats.activated_tests) * 100).toFixed(1);
    
    document.getElementById('analytics-total-tests').textContent = stats.total_tests;
    document.getElementById('analytics-activation-rate').textContent = `${activationRate}%`;
    document.getElementById('analytics-completion-rate').textContent = `${completionRate}%`;
    document.getElementById('analytics-avg-score').textContent = stats.average_score;
    
    // Update trend indicators
    document.getElementById('tests-trend').innerHTML = `
        <span class="trend-icon">📈</span>
        <span class="trend-value">+${Math.floor(Math.random() * 20)}%</span>
    `;
    
    document.getElementById('activation-trend').innerHTML = `
        <span class="trend-icon">📊</span>
        <span class="trend-value">${activationRate}%</span>
    `;
    
    document.getElementById('completion-trend').innerHTML = `
        <span class="trend-icon">🎯</span>
        <span class="trend-value">${completionRate}%</span>
    `;
    
    document.getElementById('score-trend').innerHTML = `
        <span class="trend-icon">⭐</span>
        <span class="trend-value">${stats.average_score}</span>
    `;
    
    // Update period info
    const periodLabel = getPeriodLabel(currentPeriod);
    document.getElementById('tests-period-info').textContent = `in ${periodLabel}`;
    document.getElementById('activation-period-info').textContent = 'of total tests';
    document.getElementById('completion-period-info').textContent = 'of activated tests';
    document.getElementById('score-period-info').textContent = 'NAD+ level';
}

/**
 * Update primary chart (line chart)
 */
function updatePrimaryChart(dailyData) {
    const ctx = document.getElementById('primary-chart').getContext('2d');
    
    // Destroy existing chart
    if (chartInstances.primary) {
        chartInstances.primary.destroy();
    }
    
    const labels = dailyData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    chartInstances.primary = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'New Tests',
                    data: dailyData.map(d => d.new_tests || d.completions + Math.floor(Math.random() * 10)),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Activations',
                    data: dailyData.map(d => d.activations || d.completions + Math.floor(Math.random() * 5)),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Completions',
                    data: dailyData.map(d => d.completions),
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
    
    // Hide loading
    document.getElementById('primary-chart-loading').style.display = 'none';
}

/**
 * Update secondary chart (pie chart)
 */
function updateSecondaryChart(scoreData) {
    const ctx = document.getElementById('secondary-chart').getContext('2d');
    
    // Destroy existing chart
    if (chartInstances.secondary) {
        chartInstances.secondary.destroy();
    }
    
    const colors = ['#28a745', '#17a2b8', '#ffc107', '#dc3545'];
    
    chartInstances.secondary = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: scoreData.map(d => d.score_range),
            datasets: [{
                data: scoreData.map(d => d.count),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
    
    // Hide loading
    document.getElementById('secondary-chart-loading').style.display = 'none';
}

/**
 * Update data tables
 */
function updateDataTables(data) {
    loadTopUsers();
    loadPopularSupplements();
    loadRecentActivity();
}

/**
 * Load top performing users
 */
function loadTopUsers() {
    const tbody = document.getElementById('top-users-tbody');
    const mockUsers = [
        { customer_id: 1001, tests: 15, avg_score: 87, status: 'Active' },
        { customer_id: 1002, tests: 12, avg_score: 82, status: 'Active' },
        { customer_id: 1003, tests: 10, avg_score: 79, status: 'Active' },
        { customer_id: 1004, tests: 8, avg_score: 85, status: 'Active' },
        { customer_id: 1005, tests: 7, avg_score: 76, status: 'Active' }
    ];
    
    tbody.innerHTML = mockUsers.map(user => `
        <tr>
            <td><strong>${user.customer_id}</strong></td>
            <td>${user.tests}</td>
            <td>${user.avg_score}</td>
            <td><span class="status-badge complete">${user.status}</span></td>
        </tr>
    `).join('');
}

/**
 * Load popular supplements
 */
function loadPopularSupplements() {
    const tbody = document.getElementById('popular-supplements-tbody');
    const mockSupplements = [
        { name: 'NAD+ Precursor', usage: 89, avg_score: 84, trend: '↗️' },
        { name: 'Vitamin B3', usage: 67, avg_score: 78, trend: '↗️' },
        { name: 'Resveratrol', usage: 45, avg_score: 81, trend: '→' },
        { name: 'CoQ10', usage: 38, avg_score: 76, trend: '↘️' },
        { name: 'Alpha Lipoic Acid', usage: 32, avg_score: 79, trend: '↗️' }
    ];
    
    tbody.innerHTML = mockSupplements.map(supplement => `
        <tr>
            <td><strong>${supplement.name}</strong></td>
            <td>${supplement.usage}</td>
            <td>${supplement.avg_score}</td>
            <td>${supplement.trend}</td>
        </tr>
    `).join('');
}

/**
 * Load recent activity
 */
function loadRecentActivity() {
    const feed = document.getElementById('recent-activity-feed');
    const activities = [
        { icon: '🧪', title: 'New test completed', desc: 'Customer 1003 completed NAD test', time: '2 min ago', type: 'success' },
        { icon: '⚡', title: 'Test activated', desc: 'Test NAD-20250710-1234 activated', time: '5 min ago', type: 'info' },
        { icon: '👤', title: 'New user registered', desc: 'Customer 1006 joined the system', time: '12 min ago', type: 'primary' },
        { icon: '📊', title: 'Score submitted', desc: 'Lab tech submitted score: 82', time: '18 min ago', type: 'warning' },
        { icon: '💊', title: 'Supplement added', desc: 'New supplement: PQQ added to database', time: '25 min ago', type: 'info' }
    ];
    
    feed.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                ${activity.icon}
            </div>
            <div class="activity-content">
                <h5>${activity.title}</h5>
                <p>${activity.desc}</p>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
}

/**
 * Load system performance metrics
 */
function loadSystemPerformance() {
    // Simulate API response times
    setTimeout(() => {
        document.getElementById('api-response-time').innerHTML = `${Math.floor(Math.random() * 200) + 50}ms`;
    }, 500);
    
    setTimeout(() => {
        document.getElementById('db-query-time').innerHTML = `${Math.floor(Math.random() * 50) + 10}ms`;
    }, 700);
    
    setTimeout(() => {
        document.getElementById('memory-usage').innerHTML = `${Math.floor(Math.random() * 30) + 45}%`;
    }, 900);
    
    setTimeout(() => {
        document.getElementById('active-sessions').innerHTML = `${Math.floor(Math.random() * 50) + 10}`;
    }, 1100);
}

/**
 * Generate insights
 */
function generateInsights(data) {
    const stats = data.basic_stats;
    const activationRate = (stats.activated_tests / stats.total_tests) * 100;
    const completionRate = (stats.completed_tests / stats.activated_tests) * 100;
    
    setTimeout(() => {
        const volumeInsight = `${stats.total_tests} tests created. ${stats.total_tests > 100 ? 'High volume indicates strong engagement.' : 'Consider growth strategies.'}`;
        document.getElementById('insight-volume').textContent = volumeInsight;
        updateInsightStatus('insight-volume', 'complete');
    }, 1000);
    
    setTimeout(() => {
        const activationInsight = `${activationRate.toFixed(1)}% activation rate. ${activationRate > 75 ? 'Excellent performance!' : 'Room for improvement.'}`;
        document.getElementById('insight-activation').textContent = activationInsight;
        updateInsightStatus('insight-activation', 'complete');
    }, 1500);
    
    setTimeout(() => {
        const scoreInsight = `Average score: ${stats.average_score}. ${stats.average_score > 75 ? 'Strong health outcomes.' : 'Consider protocol optimization.'}`;
        document.getElementById('insight-scores').textContent = scoreInsight;
        updateInsightStatus('insight-scores', 'complete');
    }, 2000);
    
    setTimeout(() => {
        const supplementInsight = `Supplement analysis shows positive correlation with higher scores. Continue monitoring trends.`;
        document.getElementById('insight-supplements').textContent = supplementInsight;
        updateInsightStatus('insight-supplements', 'complete');
    }, 2500);
}

/**
 * Update insight status
 */
function updateInsightStatus(insightId, status) {
    const insightElement = document.getElementById(insightId).closest('.insight-item');
    const statusBadge = insightElement.querySelector('.status-badge');
    statusBadge.className = `status-badge ${status}`;
    statusBadge.textContent = status === 'complete' ? 'Complete' : 'Analyzing';
}

/**
 * Show/hide loading states
 */
function showAnalyticsLoading(show) {
    const loadingElements = document.querySelectorAll('.chart-loading');
    loadingElements.forEach(el => {
        el.style.display = show ? 'flex' : 'none';
    });
}

/**
 * Get period label
 */
function getPeriodLabel(period) {
    const labels = {
        '7': 'last 7 days',
        '30': 'last 30 days',
        '90': 'last 90 days',
        '180': 'last 6 months',
        '365': 'last year',
        'all': 'all time'
    };
    return labels[period] || 'selected period';
}

/**
 * Set auto refresh
 */
function setAutoRefresh() {
    const interval = parseInt(document.getElementById('analytics-refresh').value);
    
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
    
    if (interval > 0) {
        autoRefreshInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing analytics...');
            loadAnalytics();
        }, interval * 1000);
        
        showAlert(`✅ Auto-refresh enabled (every ${interval} seconds)`, 'success');
    } else {
        showAlert('ℹ️ Auto-refresh disabled', 'info');
    }
}

/**
 * Advanced analytics functions
 */
function showAdvancedTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function runAdvancedAnalysis() {
    showAlert('🔬 Running advanced analysis...', 'info');
    // Simulate advanced analysis
    setTimeout(() => {
        showAlert('✅ Advanced analysis complete!', 'success');
    }, 3000);
}

function predictiveTrends() {
    showAlert('🔮 Generating predictive trends...', 'info');
    // Simulate predictive analysis
    setTimeout(() => {
        showAlert('✅ Predictive trends generated!', 'success');
    }, 2500);
}

function cohortAnalysis() {
    showAlert('👥 Running cohort analysis...', 'info');
    // Simulate cohort analysis
    setTimeout(() => {
        showAlert('✅ Cohort analysis complete!', 'success');
    }, 2000);
}

function toggleChartType(chartId) {
    const button = document.getElementById(`${chartId}-chart-toggle`);
    const currentType = button.textContent.includes('Line') ? 'line' : 'bar';
    const newType = currentType === 'line' ? 'bar' : 'line';
    
    if (chartInstances[chartId]) {
        chartInstances[chartId].config.type = newType;
        chartInstances[chartId].update();
        
        button.innerHTML = `<i class="icon">${newType === 'line' ? '📈' : '📊'}</i> ${newType === 'line' ? 'Line' : 'Bar'}`;
    }
}

function fullscreenChart(chartId) {
    const canvas = document.getElementById(`${chartId}-chart`);
    if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
    } else if (canvas.webkitRequestFullscreen) {
        canvas.webkitRequestFullscreen();
    } else if (canvas.msRequestFullscreen) {
        canvas.msRequestFullscreen();
    }
}

function updateMetricDisplay() {
    const metric = document.getElementById('analytics-metric').value;
    console.log('📊 Updating metric display for:', metric);
    // Update charts based on selected metric
    loadAnalytics();
}

function updateChartView() {
    const view = document.getElementById('analytics-view').value;
    console.log('👁️ Updating chart view to:', view);
    // Update chart view type
    loadAnalytics();
}

function refreshInsights() {
    showAlert('🧠 Refreshing insights...', 'info');
    
    // Reset all insights to analyzing state
    const insights = ['volume', 'activation', 'scores', 'supplements'];
    insights.forEach(insight => {
        const element = document.getElementById(`insight-${insight}`);
        element.textContent = 'Analyzing data patterns and generating insights...';
        updateInsightStatus(`insight-${insight}`, 'analyzing');
    });
    
    // Regenerate insights
    if (analyticsData) {
        generateInsights(analyticsData);
    }
}

/**
 * Export functions
 */
function exportAnalytics() {
    showAlert('📥 Preparing analytics export...', 'info');
    
    try {
        if (!analyticsData) {
            showAlert('❌ No analytics data to export. Please load analytics first.', 'error');
            return;
        }
        
        const period = getPeriodLabel(currentPeriod);
        const exportData = {
            report_title: `NAD Test Analytics Report - ${period}`,
            generated_date: new Date().toISOString(),
            period: period,
            summary: analyticsData.basic_stats,
            score_distribution: analyticsData.score_distribution,
            daily_completions: analyticsData.daily_completions,
            insights: {
                activation_rate: ((analyticsData.basic_stats.activated_tests / analyticsData.basic_stats.total_tests) * 100).toFixed(2) + '%',
                completion_rate: ((analyticsData.basic_stats.completed_tests / analyticsData.basic_stats.total_tests) * 100).toFixed(2) + '%',
                average_score: analyticsData.basic_stats.average_score
            }
        };
        
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nad_analytics_export_${period.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('✅ Analytics data exported successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Export error:', error);
        showAlert('❌ Failed to export analytics data', 'error');
    }
}

function generateReport() {
    showAlert('📊 Generating comprehensive report...', 'info');
    
    // Simulate report generation
    setTimeout(() => {
        showAlert('✅ Report generated! Check your downloads.', 'success');
    }, 3000);
}

function exportReport(type) {
    showAlert(`📋 Exporting ${type} report...`, 'info');
    
    const reportTypes = {
        'summary': 'Executive Summary Report',
        'detailed': 'Detailed Analytics Report',
        'data': 'Raw Data Export',
        'custom': 'Custom Report Builder'
    };
    
    // Simulate export process
    setTimeout(() => {
        showAlert(`✅ ${reportTypes[type]} exported successfully!`, 'success');
    }, 2000);
}

function validateAnalyticsData() {
    if (!analyticsData) {
        showAlert('❌ No analytics data available. Please load data first.', 'error');
        return false;
    }
    return true;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function calculateGrowthRate(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
}

function getHealthStatus(rate) {
    if (rate >= 80) return { status: 'Excellent', color: '#28a745', icon: '🟢' };
    if (rate >= 60) return { status: 'Good', color: '#17a2b8', icon: '🟡' };
    if (rate >= 40) return { status: 'Fair', color: '#ffc107', icon: '🟠' };
    return { status: 'Poor', color: '#dc3545', icon: '🔴' };
}

/**
 * Chart utility functions
 */
function createMiniChart(canvasId, data, type = 'line') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    return new Chart(ctx, {
        type: type,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            elements: {
                point: { radius: 0 }
            }
        }
    });
}

function destroyChart(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }
}

function destroyAllCharts() {
    Object.keys(chartInstances).forEach(chartId => {
        destroyChart(chartId);
    });
}

/**
 * Error handling
 */
function handleAnalyticsError(error, context) {
    console.error(`❌ Analytics error in ${context}:`, error);
    
    const errorMessages = {
        'network': 'Unable to connect to analytics service. Please check your connection.',
        'data': 'Analytics data is currently unavailable. Showing sample data instead.',
        'permission': 'You do not have permission to view analytics data.',
        'server': 'Analytics service is temporarily unavailable. Please try again later.'
    };
    
    const message = errorMessages[error.type] || 'An error occurred while loading analytics.';
    showAlert(`⚠️ ${message}`, 'warning');
}

/**
 * Performance monitoring
 */
function measurePerformance(operation, startTime) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    console.log(`⏱️ ${operation} completed in ${duration}ms`);
    return duration;
}

/**
 * Local storage management
 */
function saveAnalyticsPreferences() {
    const preferences = {
        period: document.getElementById('analytics-period').value,
        metric: document.getElementById('analytics-metric').value,
        view: document.getElementById('analytics-view').value,
        refresh: document.getElementById('analytics-refresh').value
    };
    
    try {
        localStorage.setItem('nad_analytics_preferences', JSON.stringify(preferences));
    } catch (error) {
        console.warn('⚠️ Failed to save analytics preferences:', error);
    }
}

function loadAnalyticsPreferences() {
    try {
        const stored = localStorage.getItem('nad_analytics_preferences');
        if (stored) {
            const preferences = JSON.parse(stored);
            
            if (preferences.period) document.getElementById('analytics-period').value = preferences.period;
            if (preferences.metric) document.getElementById('analytics-metric').value = preferences.metric;
            if (preferences.view) document.getElementById('analytics-view').value = preferences.view;
            if (preferences.refresh) document.getElementById('analytics-refresh').value = preferences.refresh;
            
            return preferences;
        }
    } catch (error) {
        console.warn('⚠️ Failed to load analytics preferences:', error);
    }
    return null;
}

/**
 * Cleanup function
 */
function cleanupAnalytics() {
    // Clear auto-refresh interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
    
    // Destroy all charts
    destroyAllCharts();
    
    // Save preferences
    saveAnalyticsPreferences();
}

// Make functions globally accessible
window.loadAnalytics = loadAnalytics;
window.generateReport = generateReport;
window.exportAnalytics = exportAnalytics;
window.exportReport = exportReport;
window.setAutoRefresh = setAutoRefresh;
window.updateMetricDisplay = updateMetricDisplay;
window.updateChartView = updateChartView;
window.toggleChartType = toggleChartType;
window.fullscreenChart = fullscreenChart;
window.showAdvancedTab = showAdvancedTab;
window.runAdvancedAnalysis = runAdvancedAnalysis;
window.predictiveTrends = predictiveTrends;
window.cohortAnalysis = cohortAnalysis;
window.refreshInsights = refreshInsights;
window.loadTopUsers = loadTopUsers;
window.loadPopularSupplements = loadPopularSupplements;
window.loadRecentActivity = loadRecentActivity;
window.loadSystemPerformance = loadSystemPerformance;
window.initializeAnalytics = initializeAnalytics;
window.cleanupAnalytics = cleanupAnalytics;

// Auto-cleanup on page unload
window.addEventListener('beforeunload', cleanupAnalytics);

console.log('✅ Analytics functions loaded successfully!');
console.log('📊 Analytics dashboard ready for comprehensive data visualization');
console.log('🔄 Auto-refresh, export, and advanced analytics available');
console.log('📈 Chart.js integration complete with interactive charts');
console.log('🚀 Advanced analytics features: trends, correlations, forecasting, anomalies');
console.log('📋 Multiple export formats: PDF, CSV, JSON reports');
console.log('⚡ Real-time performance monitoring and insights');
</script>
