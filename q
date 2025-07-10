<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NAD Test Admin Dashboard</title>
    
    <!-- Shared CSS -->
    <link rel="stylesheet" href="shared/css/variables.css">
    <link rel="stylesheet" href="shared/css/base.css">
    <link rel="stylesheet" href="shared/css/components.css">
    
    <!-- Admin-specific CSS -->
    <link rel="stylesheet" href="admin/css/admin-dashboard.css">
    <link rel="stylesheet" href="admin/css/sections.css">
</head>
<body>
    <div class="admin-container">
        <div id="sidebar-container"></div>
        <div class="main-content">
            <div id="header-container"></div>
            <div id="content-container"></div>
        </div>
    </div>
    
    <!-- Global alert system -->
    <div id="alert-container"></div>
    
    <!-- Shared JS -->
    <script src="shared/js/core.js"></script>
    <script src="shared/js/api-client.js"></script>
    <script src="shared/js/components.js"></script>
    
    <!-- Admin-specific JS -->
    <script src="admin/js/admin-dashboard.js"></script>
</body>
</html>
