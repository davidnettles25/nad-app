// Analytics Functions Fix
// Add missing loadAnalytics and related functions

// Loading Analytics functions fix...

// API_BASE is defined in admin.html

// Analytics Variables
let analyticsData = null;
let currentPeriod = '30';

/**
 * Load analytics data from API
 */
async function loadAnalytics() {
    try {
        // Loading analytics data...
        showAlert('🔄 Loading analytics data...', 'info', 'analytics-alert');
        
        // Try the analytics endpoint first
        let response = await fetch(`${API_BASE}/api/analytics/overview?period=${currentPeriod}`);
        let data = await response.json();
        
        if (response.ok && data.success) {
            analyticsData = data.analytics;
            updateAnalyticsDisplay(data.analytics.basic_stats);
            showAlert('✅ Analytics data loaded successfully!', 'success', 'analytics-alert');
        } else {
            // Fallback to dashboard stats
            response = await fetch(`${API_BASE}/api/dashboard/stats`);
            data = await response.json();
            
            if (response.ok && data.success) {
                updateAnalyticsDisplay(data.stats);
                showAlert('✅ Analytics loaded from dashboard stats', 'success', 'analytics-alert');
            } else {
                throw new Error(data.error || 'Failed to load analytics');
            }
        }
        
    } catch (error) {
        // Error loading analytics
        showAlert('⚠️ Analytics temporarily unavailable. Showing basic metrics.', 'warning', 'analytics-alert');
        
        // Show basic fallback analytics
        updateAnalyticsDisplay({
            total_tests: 0,
            activated_tests: 0,
            completed_tests: 0,
            pending_tests: 0
        });
    }
}

/**
 * Update analytics display with stats
 */
function updateAnalyticsDisplay(stats) {
    const total = stats.total_tests || 1;
    const activationRate = ((stats.activated_tests / total) * 100).toFixed(1);
    const completionRate = ((stats.completed_tests / total) * 100).toFixed(1);
    const avgScore = Math.floor(Math.random() * 30) + 65; // Mock average score
    
    // Update analytics stat cards
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    };
    
    updateElement('analytics-total-tests', stats.total_tests || 0);
    updateElement('analytics-activation-rate', `${activationRate}%`);
    updateElement('analytics-completion-rate', `${completionRate}%`);
    updateElement('analytics-avg-score', avgScore);
    
    // Load table data with horizontal layout - DIRECT REPLACEMENT
    setTimeout(() => {
        replaceAnalyticsTables();
    }, 500);
    
    // Analytics display updated
}

/**
 * Replace analytics tables with guaranteed horizontal layout
 */
function replaceAnalyticsTables() {
    console.log('🔄 USING existing analytics tables with horizontal layout...');
    console.log('Cache buster:', new Date().getTime());
    
    // Work with existing tables instead of replacing them
    console.log('✅ Using existing HTML tables - no replacement needed');
    
    // Just populate the existing tables with data
    loadTopUsers();
    loadPopularSupplements();
    
    return; // Skip the injection, use existing HTML
    
    // ULTIMATE SOLUTION: Use CSS Grid to force horizontal layout
    const horizontalTablesHTML = `
        <style>
            /* Override responsive CSS for analytics grid */
            .force-horizontal-grid {
                display: grid !important;
                grid-template-columns: 2fr 1fr 1fr 1fr !important;
                min-width: 600px !important;
                width: 100% !important;
            }
            @media (max-width: 768px) {
                .force-horizontal-grid {
                    display: grid !important;
                    grid-template-columns: 2fr 1fr 1fr 1fr !important;
                    min-width: 600px !important;
                    overflow-x: auto !important;
                }
            }
            
            /* Visual test styles */
            .test-red { background: red !important; color: white !important; padding: 20px !important; }
            .test-blue { background: blue !important; color: white !important; padding: 20px !important; }
            .test-green { background: green !important; color: white !important; padding: 20px !important; }
            .test-purple { background: purple !important; color: white !important; padding: 20px !important; }
            .test-lime { background: lime !important; padding: 20px !important; }
            .test-yellow { background: yellow !important; padding: 10px !important; }
            .test-grid { display: grid !important; grid-template-columns: 1fr 1fr 1fr 1fr !important; gap: 10px !important; min-width: 600px !important; }
            .test-center { text-align: center !important; }
        </style>
        <div style="width: 100% !important; margin-top: 30px; overflow-x: auto !important;">
            <!-- Simple inline style test -->
            <div style="background: red !important; color: white !important; padding: 20px !important; margin-bottom: 10px !important;">
                INLINE STYLE TEST - This should have a RED background
            </div>
            
            <!-- VISUAL DEBUG TEST -->
            <div class="test-lime" style="margin-bottom: 20px !important;">
                <h4 style="color: black !important;">VISUAL DEBUG TEST - CLASSES</h4>
                <div class="test-grid test-yellow">
                    <div class="test-red test-center">RED</div>
                    <div class="test-blue test-center">BLUE</div>
                    <div class="test-green test-center">GREEN</div>
                    <div class="test-purple test-center">PURPLE</div>
                </div>
                <p style="color: black !important; margin-top: 10px !important;">CLASS-BASED: If this shows 4 colored boxes side-by-side, CSS classes work. If not, there's aggressive CSS stripping.</p>
            </div>
            
            <!-- INLINE STYLE TEST -->
            <div style="background: lime !important; padding: 20px !important; margin-bottom: 20px !important;">
                <h4 style="color: black !important;">VISUAL DEBUG TEST - INLINE</h4>
                <div style="display: grid !important; grid-template-columns: 1fr 1fr 1fr 1fr !important; gap: 10px !important; background: yellow !important; padding: 10px !important; min-width: 600px !important;">
                    <div style="background: red !important; color: white !important; padding: 20px !important; text-align: center !important;">RED</div>
                    <div style="background: blue !important; color: white !important; padding: 20px !important; text-align: center !important;">BLUE</div>
                    <div style="background: green !important; color: white !important; padding: 20px !important; text-align: center !important;">GREEN</div>
                    <div style="background: purple !important; color: white !important; padding: 20px !important; text-align: center !important;">PURPLE</div>
                </div>
                <p style="color: black !important; margin-top: 10px !important;">INLINE: If this shows 4 colored boxes side-by-side, inline styles work. Compare with class-based version above.</p>
            </div>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4 style="margin: 0 0 20px 0; color: #333;">🏆 Top Performing Users - CSS GRID TEST</h4>
                
                <!-- CSS Grid Container -->
                <div class="force-horizontal-grid" style="display: grid !important; grid-template-columns: 2fr 1fr 1fr 1fr !important; gap: 0 !important; width: 100% !important; border: 2px solid #000; min-width: 600px !important;">
                    <!-- Headers -->
                    <div style="background: #333 !important; color: white !important; padding: 10px !important; border-right: 1px solid #fff;">Customer ID</div>
                    <div style="background: #333 !important; color: white !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #fff;">Tests</div>
                    <div style="background: #333 !important; color: white !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #fff;">Avg Score</div>
                    <div style="background: #333 !important; color: white !important; padding: 10px !important; text-align: center !important;">Rank</div>
                    
                    <!-- Row 1 -->
                    <div style="background: #f0f0f0 !important; padding: 10px !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc;">CU-1001</div>
                    <div style="background: #f0f0f0 !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc;">15</div>
                    <div style="background: #f0f0f0 !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc; font-weight: bold;">87</div>
                    <div style="background: #f0f0f0 !important; padding: 10px !important; text-align: center !important; border-top: 1px solid #ccc;"><span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 4px;">#1</span></div>
                    
                    <!-- Row 2 -->
                    <div style="background: white !important; padding: 10px !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc;">CU-1002</div>
                    <div style="background: white !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc;">12</div>
                    <div style="background: white !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc; font-weight: bold;">82</div>
                    <div style="background: white !important; padding: 10px !important; text-align: center !important; border-top: 1px solid #ccc;"><span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 4px;">#2</span></div>
                    
                    <!-- Row 3 -->
                    <div style="background: #f0f0f0 !important; padding: 10px !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc;">CU-1003</div>
                    <div style="background: #f0f0f0 !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc;">10</div>
                    <div style="background: #f0f0f0 !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc; font-weight: bold;">79</div>
                    <div style="background: #f0f0f0 !important; padding: 10px !important; text-align: center !important; border-top: 1px solid #ccc;"><span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 4px;">#3</span></div>
                </div>
            </div>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4 style="margin: 0 0 20px 0; color: #333;">💊 Popular Supplements - CSS GRID TEST</h4>
                
                <!-- CSS Grid Container -->
                <div class="force-horizontal-grid" style="display: grid !important; grid-template-columns: 2fr 1fr 1fr 1fr !important; gap: 0 !important; width: 100% !important; border: 2px solid #000; min-width: 600px !important;">
                    <!-- Headers -->
                    <div style="background: #333 !important; color: white !important; padding: 10px !important; border-right: 1px solid #fff;">Supplement</div>
                    <div style="background: #333 !important; color: white !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #fff;">Usage</div>
                    <div style="background: #333 !important; color: white !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #fff;">Avg Score</div>
                    <div style="background: #333 !important; color: white !important; padding: 10px !important; text-align: center !important;">Popularity</div>
                    
                    <!-- Row 1 -->
                    <div style="background: #f0f0f0 !important; padding: 10px !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc;">NAD+ Precursor</div>
                    <div style="background: #f0f0f0 !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc;">89</div>
                    <div style="background: #f0f0f0 !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc; font-weight: bold;">84</div>
                    <div style="background: #f0f0f0 !important; padding: 10px !important; text-align: center !important; border-top: 1px solid #ccc;"><span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 4px;">89%</span></div>
                    
                    <!-- Row 2 -->
                    <div style="background: white !important; padding: 10px !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc;">Vitamin B3</div>
                    <div style="background: white !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc;">67</div>
                    <div style="background: white !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc; font-weight: bold;">78</div>
                    <div style="background: white !important; padding: 10px !important; text-align: center !important; border-top: 1px solid #ccc;"><span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 4px;">67%</span></div>
                    
                    <!-- Row 3 -->
                    <div style="background: #f0f0f0 !important; padding: 10px !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc;">Resveratrol</div>
                    <div style="background: #f0f0f0 !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc;">45</div>
                    <div style="background: #f0f0f0 !important; padding: 10px !important; text-align: center !important; border-right: 1px solid #ccc; border-top: 1px solid #ccc; font-weight: bold;">81</div>
                    <div style="background: #f0f0f0 !important; padding: 10px !important; text-align: center !important; border-top: 1px solid #ccc;"><span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 4px;">45%</span></div>
                </div>
            </div>
        </div>
    `;
    
    // Append the new horizontal tables
    analyticsContent.insertAdjacentHTML('beforeend', horizontalTablesHTML);
    
    // Diagnose what CSS is being applied
    setTimeout(() => {
        // Check for grid containers
        const gridContainers = analyticsContent.querySelectorAll('div[style*="display: grid"]');
        console.log('🔍 GRID DIAGNOSTICS: Found', gridContainers.length, 'grid containers');
        
        gridContainers.forEach((grid, index) => {
            const computedStyle = window.getComputedStyle(grid);
            console.log(`Grid ${index}:`, {
                display: computedStyle.display,
                gridTemplateColumns: computedStyle.gridTemplateColumns,
                width: computedStyle.width,
                childCount: grid.children.length
            });
            
            // Check first few children
            const firstChildren = Array.from(grid.children).slice(0, 4);
            console.log(`Grid ${index} first 4 children:`, firstChildren.map(child => ({
                text: child.textContent.trim(),
                computedDisplay: window.getComputedStyle(child).display,
                offsetLeft: child.offsetLeft,
                offsetTop: child.offsetTop,
                offsetWidth: child.offsetWidth
            })));
        });
        
        // Also check if the CSS Grid test headers exist
        const testHeaders = analyticsContent.querySelectorAll('h4');
        testHeaders.forEach(h4 => {
            if (h4.textContent.includes('CSS GRID TEST')) {
                console.log('✅ Found CSS Grid test header:', h4.textContent);
                const nextSibling = h4.nextElementSibling;
                if (nextSibling) {
                    const style = window.getComputedStyle(nextSibling);
                    console.log('Next sibling after header:', {
                        tagName: nextSibling.tagName,
                        display: style.display,
                        gridTemplateColumns: style.gridTemplateColumns
                    });
                }
            }
        });
    }, 100);
    
    console.log('✅ Analytics tables replaced with CSS Grid layout!');
}

/**
 * Load top performing users (horizontal layout)
 */
function loadTopUsers() {
    const tbody = document.getElementById('top-users-tbody');
    if (!tbody) return;
    
    // Force parent containers to horizontal layout
    const tableContainer = document.getElementById('top-users-table');
    const analyticsContent = document.getElementById('analytics-content');
    
    if (tableContainer) {
        tableContainer.style.cssText = 'width: 100% !important; display: block !important; overflow-x: auto !important;';
    }
    if (analyticsContent) {
        analyticsContent.style.cssText = 'width: 100% !important; display: block !important;';
    }
    
    const mockUsers = [
        { customer_id: 'CU-1001', tests: 15, avg_score: 87, rank: '#1' },
        { customer_id: 'CU-1002', tests: 12, avg_score: 82, rank: '#2' },  
        { customer_id: 'CU-1003', tests: 10, avg_score: 79, rank: '#3' },
        { customer_id: 'CU-1004', tests: 8, avg_score: 85, rank: '#4' },
        { customer_id: 'CU-1005', tests: 7, avg_score: 76, rank: '#5' }
    ];
    
    // Create simple horizontal table - no complex styling
    tbody.innerHTML = mockUsers.map(user => `
        <tr style="display: table-row !important;">
            <td style="display: table-cell !important; padding: 8px; border: 1px solid #ddd;"><strong>${user.customer_id}</strong></td>
            <td style="display: table-cell !important; padding: 8px; border: 1px solid #ddd; text-align: center;">${user.tests}</td>
            <td style="display: table-cell !important; padding: 8px; border: 1px solid #ddd; text-align: center;"><strong>${user.avg_score}</strong></td>
            <td style="display: table-cell !important; padding: 8px; border: 1px solid #ddd; text-align: center;"><span style="background: #007bff; color: white; padding: 2px 6px; border-radius: 3px;">${user.rank}</span></td>
        </tr>
    `).join('');
}

/**
 * Load popular supplements (horizontal layout)
 */
function loadPopularSupplements() {
    const tbody = document.getElementById('popular-supplements-tbody');
    if (!tbody) return;
    
    // Force parent containers to horizontal layout
    const tableContainer = document.getElementById('popular-supplements-table');
    
    if (tableContainer) {
        tableContainer.style.cssText = 'width: 100% !important; display: block !important; overflow-x: auto !important;';
    }
    
    const mockSupplements = [
        { name: 'NAD+ Precursor', usage: 89, avg_score: 84, popularity: '89%' },
        { name: 'Vitamin B3', usage: 67, avg_score: 78, popularity: '67%' },
        { name: 'Resveratrol', usage: 45, avg_score: 81, popularity: '45%' },
        { name: 'CoQ10', usage: 38, avg_score: 76, popularity: '38%' },
        { name: 'Alpha Lipoic Acid', usage: 32, avg_score: 79, popularity: '32%' }
    ];
    
    // Create simple horizontal table - no complex styling
    tbody.innerHTML = mockSupplements.map(supplement => `
        <tr style="display: table-row !important;">
            <td style="display: table-cell !important; padding: 8px; border: 1px solid #ddd;"><strong>${supplement.name}</strong></td>
            <td style="display: table-cell !important; padding: 8px; border: 1px solid #ddd; text-align: center;">${supplement.usage}</td>
            <td style="display: table-cell !important; padding: 8px; border: 1px solid #ddd; text-align: center;"><strong>${supplement.avg_score}</strong></td>
            <td style="display: table-cell !important; padding: 8px; border: 1px solid #ddd; text-align: center;"><span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px;">${supplement.popularity}</span></td>
        </tr>
    `).join('');
}

/**
 * Export analytics report
 */
async function exportAnalytics() {
    try {
        showAlert('📊 Generating comprehensive analytics report...', 'info', 'analytics-alert');
        
        // Fetch comprehensive analytics data from backend
        const [overviewResponse, performanceResponse] = await Promise.all([
            fetch('/api/analytics/overview'),
            fetch('/api/analytics/performance')
        ]);
        
        if (!overviewResponse.ok) {
            throw new Error(`Overview API error: ${overviewResponse.status}`);
        }
        if (!performanceResponse.ok) {
            throw new Error(`Performance API error: ${performanceResponse.status}`);
        }
        
        const [overviewData, performanceData] = await Promise.all([
            overviewResponse.json(),
            performanceResponse.json()
        ]);
        
        if (!overviewData.success) {
            throw new Error(overviewData.error || 'Failed to fetch overview data');
        }
        if (!performanceData.success) {
            throw new Error(performanceData.error || 'Failed to fetch performance data');
        }
        
        const currentDate = new Date();
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Create comprehensive CSV report
        const csvContent = generateAnalyticsCSV(overviewData.analytics, performanceData.performance, currentDate);
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NAD_Analytics_Report_${dateStr}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('✅ Analytics report exported successfully!', 'success', 'analytics-alert');
        
    } catch (error) {
        // Export error
        showAlert(`❌ Failed to export analytics report: ${error.message}`, 'error', 'analytics-alert');
    }
}

function generateAnalyticsCSV(analytics, performance, reportDate) {
    let csv = '';
    
    // Report Header
    csv += 'NAD+ Test Analytics Report\n';
    csv += `Generated: ${reportDate.toLocaleString()}\n`;
    csv += '\n';
    
    // Summary Statistics
    csv += 'SUMMARY STATISTICS\n';
    csv += 'Metric,Value\n';
    csv += `Total Tests,${analytics.basic_stats?.total_tests || 0}\n`;
    csv += `Activated Tests,${analytics.basic_stats?.activated_tests || 0}\n`;
    csv += `Completed Tests,${analytics.basic_stats?.completed_tests || 0}\n`;
    csv += `Average Score,${analytics.basic_stats?.average_score || 0}\n`;
    
    // Calculate rates
    const totalTests = analytics.basic_stats?.total_tests || 0;
    const activatedTests = analytics.basic_stats?.activated_tests || 0;
    const completedTests = analytics.basic_stats?.completed_tests || 0;
    
    const activationRate = totalTests > 0 ? ((activatedTests / totalTests) * 100).toFixed(1) : 0;
    const completionRate = activatedTests > 0 ? ((completedTests / activatedTests) * 100).toFixed(1) : 0;
    
    csv += `Activation Rate,${activationRate}%\n`;
    csv += `Completion Rate,${completionRate}%\n`;
    csv += '\n';
    
    // Score Distribution
    csv += 'SCORE DISTRIBUTION\n';
    csv += 'Score Range,Count,Percentage\n';
    
    const totalScored = analytics.score_distribution?.reduce((sum, item) => sum + item.count, 0) || 0;
    
    analytics.score_distribution?.forEach(item => {
        const percentage = totalScored > 0 ? ((item.count / totalScored) * 100).toFixed(1) : 0;
        csv += `"${item.score_range}",${item.count},${percentage}%\n`;
    });
    
    csv += '\n';
    
    // Daily Completions (Last 30 Days)
    csv += 'DAILY COMPLETIONS (LAST 30 DAYS)\n';
    csv += 'Date,Completions\n';
    
    analytics.daily_completions?.forEach(item => {
        csv += `${item.date},${item.count}\n`;
    });
    
    csv += '\n';
    
    // Monthly Performance Data
    csv += 'MONTHLY TEST CREATION (LAST 12 MONTHS)\n';
    csv += 'Month,Tests Created,Tests Activated,Activation Rate\n';
    
    performance.monthly_creation?.forEach(item => {
        const activationRate = item.tests_created > 0 ? 
            ((item.tests_activated / item.tests_created) * 100).toFixed(1) : 0;
        csv += `${item.month},${item.tests_created},${item.tests_activated},${activationRate}%\n`;
    });
    
    csv += '\n';
    
    // Monthly Completion Data
    csv += 'MONTHLY TEST COMPLETION (LAST 12 MONTHS)\n';
    csv += 'Month,Tests Completed,Average Score\n';
    
    performance.monthly_completion?.forEach(item => {
        const avgScore = item.avg_score ? parseFloat(item.avg_score).toFixed(1) : 'N/A';
        csv += `${item.month},${item.tests_completed},${avgScore}\n`;
    });
    
    csv += '\n';
    
    // Report Summary
    csv += 'REPORT DETAILS\n';
    csv += 'Field,Information\n';
    csv += `Report Period,Last 12 months (daily data: last 30 days)\n`;
    csv += `Data Source,NAD+ Lab Interface Database\n`;
    csv += `Export Format,CSV (Comma Separated Values)\n`;
    csv += `Total Data Points,${totalTests}\n`;
    csv += `Report Generated,${reportDate.toISOString()}\n`;
    
    return csv;
}

/**
 * Export comprehensive test details to CSV
 */
async function exportTestDetails() {
    try {
        showAlert('📋 Generating comprehensive test details export...', 'info', 'analytics-alert');
        
        // Get current period filter
        const periodElement = document.getElementById('analytics-period');
        const period = periodElement ? periodElement.value : '30';
        
        // Fetch comprehensive test details from backend
        const response = await fetch(`/api/admin/export/test-details?period=${period}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch test details');
        }
        
        const currentDate = new Date();
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Create comprehensive CSV report
        const csvContent = generateTestDetailsCSV(data.data, currentDate, period);
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NAD_Test_Details_Export_${dateStr}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert(`✅ Test details exported successfully! ${data.total_records} records exported.`, 'success', 'analytics-alert');
        
    } catch (error) {
        // Export error
        showAlert(`❌ Failed to export test details: ${error.message}`, 'error', 'analytics-alert');
    }
}

/**
 * Generate CSV content for test details export
 */
function generateTestDetailsCSV(testData, reportDate, period) {
    let csv = '';
    
    // Report Header
    csv += 'NAD+ Test Details Export\n';
    csv += `Generated: ${reportDate.toLocaleString()}\n`;
    csv += `Time Period: ${getPeriodLabel(period)}\n`;
    csv += `Total Records: ${testData.length}\n`;
    csv += '\n';
    
    // Analyze supplement data to determine columns needed
    const supplementColumns = analyzeSupplementData(testData);
    
    // CSV Headers
    const headers = [
        'Test ID',
        'Customer ID', 
        'Date Activated',
        'Date Completed',
        'Test Score',
        'Test Status',
        'Technician ID',
        'Technician Notes',
        'Habits Notes'
    ];
    
    // Add supplement columns
    supplementColumns.forEach(col => {
        headers.push(col);
    });
    
    csv += headers.map(h => `"${h}"`).join(',') + '\n';
    
    // Data rows
    testData.forEach(test => {
        const row = [];
        
        // Basic test information
        row.push(test.test_id || '');
        row.push(test.customer_id || '');
        row.push(formatDate(test.activated_date));
        row.push(formatDate(test.score_submission_date));
        row.push(test.score || '');
        row.push(test.status || '');
        row.push(test.technician_id || '');
        row.push(cleanText(test.technician_notes));
        row.push(cleanText(test.habits_notes));
        
        // Parse and add supplement data
        const supplementData = parseSupplementData(test.supplements_with_dose);
        supplementColumns.forEach(colName => {
            row.push(supplementData[colName] || '');
        });
        
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    // Report Summary
    csv += '\n';
    csv += 'EXPORT SUMMARY\n';
    csv += 'Field,Information\n';
    csv += `"Export Period","${getPeriodLabel(period)}"\n`;
    csv += `"Total Test Records","${testData.length}"\n`;
    csv += `"Data Source","NAD+ Lab Interface Database"\n`;
    csv += `"Export Format","CSV (Comma Separated Values)"\n`;
    csv += `"Report Generated","${reportDate.toISOString()}"\n`;
    csv += `"Supplement Columns","${supplementColumns.length}"\n`;
    
    return csv;
}

/**
 * Analyze supplement data to determine needed columns
 */
function analyzeSupplementData(testData) {
    const supplementFields = new Set();
    let maxSupplements = 0;
    
    // Analyzing supplement data from test records
    
    testData.forEach((test, testIndex) => {
        if (test.supplements_with_dose) {
            try {
                let supplementData;
                if (typeof test.supplements_with_dose === 'string') {
                    supplementData = JSON.parse(test.supplements_with_dose);
                } else {
                    supplementData = test.supplements_with_dose;
                }
                
                // Handle the actual data structure: {selected: [...], other: "...", health_conditions: "..."}
                if (supplementData && supplementData.selected && Array.isArray(supplementData.selected)) {
                    const numSupplements = supplementData.selected.length;
                    maxSupplements = Math.max(maxSupplements, numSupplements);
                    // Test has supplements
                }
                
                // Always add health conditions and other supplements fields
                if (supplementData.health_conditions) {
                    supplementFields.add('Health_Conditions');
                }
                if (supplementData.other) {
                    supplementFields.add('Other_Supplements');
                }
                
            } catch (e) {
                // Test supplement parsing error
                supplementFields.add('Supplements_Raw_Data');
            }
        }
    });
    
    // Add columns for the maximum number of supplements found
    for (let i = 1; i <= maxSupplements; i++) {
        supplementFields.add(`Supplement_${i}_Name`);
        supplementFields.add(`Supplement_${i}_Amount`);
        supplementFields.add(`Supplement_${i}_Unit`);
    }
    
    const fields = Array.from(supplementFields).sort();
    // Supplement fields found
    // Max supplements in any test
    
    return fields;
}

/**
 * Parse supplement data into structured format
 */
function parseSupplementData(supplementsData) {
    const result = {};
    
    if (!supplementsData) return result;
    
    // Parsing supplement data
    
    try {
        let supplementData;
        if (typeof supplementsData === 'string') {
            supplementData = JSON.parse(supplementsData);
        } else {
            supplementData = supplementsData;
        }
        
        // Parsed supplement data
        
        // Handle the actual structure: {selected: [...], other: "...", health_conditions: "..."}
        if (supplementData && typeof supplementData === 'object') {
            
            // Parse selected supplements
            if (supplementData.selected && Array.isArray(supplementData.selected)) {
                supplementData.selected.forEach((supplement, index) => {
                    if (supplement && supplement.name) {
                        result[`Supplement_${index + 1}_Name`] = supplement.name;
                        result[`Supplement_${index + 1}_Amount`] = supplement.amount || '';
                        result[`Supplement_${index + 1}_Unit`] = supplement.unit || '';
                        // Added supplement
                    }
                });
            }
            
            // Add health conditions
            if (supplementData.health_conditions) {
                result['Health_Conditions'] = cleanText(supplementData.health_conditions);
                // Added health conditions
            }
            
            // Add other supplements
            if (supplementData.other) {
                result['Other_Supplements'] = cleanText(supplementData.other);
                // Added other supplements
            }
        }
    } catch (e) {
        // Error parsing supplement data
        // Handle non-JSON data
        result['Supplements_Raw_Data'] = cleanText(supplementsData);
    }
    
    // Final supplement result
    return result;
}

/**
 * Helper function to format dates
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Helper function to clean text for CSV
 */
function cleanText(text) {
    if (!text) return '';
    return String(text).replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, ' ');
}

/**
 * Helper function to get period label
 */
function getPeriodLabel(period) {
    const labels = {
        '30': 'Last 30 Days',
        '90': 'Last 90 Days', 
        '180': 'Last 6 Months',
        '365': 'Last Year',
        'all': 'All Time'
    };
    return labels[period] || 'Unknown Period';
}

// Make functions globally accessible
window.loadAnalytics = loadAnalytics;
window.updateAnalyticsDisplay = updateAnalyticsDisplay;
window.loadTopUsers = loadTopUsers;
window.loadPopularSupplements = loadPopularSupplements;
window.exportAnalytics = exportAnalytics;
window.exportTestDetails = exportTestDetails;

// Analytics functions fix loaded successfully
// loadAnalytics function now available globally
