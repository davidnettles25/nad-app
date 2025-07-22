#!/bin/bash
# Setup log directories with proper permissions

LOGS_DIR="/opt/nad-app/logs"

echo "🔧 Setting up log directories..."

# Create logs directory if it doesn't exist
if [ ! -d "$LOGS_DIR" ]; then
    mkdir -p "$LOGS_DIR"
    echo "✅ Created logs directory: $LOGS_DIR"
else
    echo "ℹ️  Logs directory already exists: $LOGS_DIR"
fi

# Set proper ownership (for bitnami user)
chown -R bitnami:bitnami "$LOGS_DIR"
echo "✅ Set ownership to bitnami:bitnami"

# Set proper permissions
chmod 755 "$LOGS_DIR"
echo "✅ Set permissions to 755"

# Create initial log files if they don't exist
touch "$LOGS_DIR/app.log"
touch "$LOGS_DIR/api.log"
touch "$LOGS_DIR/error.log"
touch "$LOGS_DIR/customer.log"
touch "$LOGS_DIR/admin.log"

# Set permissions on log files
chmod 644 "$LOGS_DIR"/*.log
chown bitnami:bitnami "$LOGS_DIR"/*.log

echo "✅ Log setup complete!"
echo "📁 Log files:"
ls -la "$LOGS_DIR"