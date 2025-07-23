#!/bin/bash
# Emergency fix to disable the problematic migration directly on server

echo "🚨 Emergency fix: Disabling customer_id migration"

# First, run SQL to drop backup tables
echo "🗑️ Dropping backup tables..."
mysql -u nad_user -p nad_test_cycle < /opt/nad-app/fix_migration.sql

# Stop PM2
echo "⏹️ Stopping PM2..."
pm2 stop all

# Comment out the migration line directly in the server file
echo "✏️ Disabling migration in server.js..."
sed -i 's/await migrateCustomerIdToVarchar();/\/\/ await migrateCustomerIdToVarchar(); \/\/ DISABLED FOR EMERGENCY FIX/' /opt/nad-app/server.js

# Add version identifier
echo "🏷️ Adding version identifier..."
sed -i '/\/\/ await migrateCustomerIdToVarchar(); \/\/ DISABLED FOR EMERGENCY FIX/a\        console.log("🚀 EMERGENCY FIX APPLIED - MIGRATION DISABLED - VERSION $(date)");' /opt/nad-app/server.js

# Start PM2
echo "▶️ Starting PM2..."
pm2 start /opt/nad-app/ecosystem.config.js

echo "✅ Emergency fix completed!"
echo "📋 Check logs with: tail -f /opt/nad-app/logs/err-0.log"