#!/bin/bash

echo "🔍 NAD Database Connection Test"
echo "=============================="
echo ""

# Check if MariaDB/MySQL is running
echo "1. 🔍 Checking if MariaDB service is running..."
if systemctl is-active --quiet mariadb; then
    echo "   ✅ MariaDB service is ACTIVE"
elif systemctl is-active --quiet mysql; then
    echo "   ✅ MySQL service is ACTIVE"
else
    echo "   ❌ MariaDB/MySQL service is NOT running"
    echo "   💡 Try: sudo systemctl start mariadb"
    echo "   💡 Or: sudo systemctl start mysql"
fi

echo ""

# Check what databases are listening on port 3306
echo "2. 🔍 Checking what's listening on port 3306..."
MYSQL_PROCESS=$(netstat -tlnp 2>/dev/null | grep :3306 || ss -tlnp 2>/dev/null | grep :3306)
if [ -n "$MYSQL_PROCESS" ]; then
    echo "   ✅ Something is listening on port 3306:"
    echo "   $MYSQL_PROCESS"
else
    echo "   ❌ Nothing is listening on port 3306"
    echo "   💡 MariaDB might not be running or configured incorrectly"
fi

echo ""

# Check MariaDB socket files
echo "3. 🔍 Looking for MariaDB socket files..."
SOCKET_PATHS=(
    "/var/lib/mysql/mysql.sock"
    "/var/run/mysqld/mysqld.sock"
    "/tmp/mysql.sock"
    "/opt/bitnami/mysql/tmp/mysql.sock"
)

FOUND_SOCKET=""
for socket in "${SOCKET_PATHS[@]}"; do
    if [ -S "$socket" ]; then
        echo "   ✅ Found socket: $socket"
        FOUND_SOCKET="$socket"
        break
    else
        echo "   ❌ Not found: $socket"
    fi
done

if [ -z "$FOUND_SOCKET" ]; then
    echo "   ⚠️ No MySQL socket files found"
fi

echo ""

# Test database connection
echo "4. 🔍 Testing database connection..."
echo "   Attempting to connect as nad_user to nad_cycle database..."

# Try direct connection
mysql -u nad_user -pSecureNADPassword2025! -h 127.0.0.1 nad_cycle -e "SELECT 1 as test, USER() as current_user, DATABASE() as current_db;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "   ✅ Database connection SUCCESSFUL!"
else
    echo "   ❌ Database connection FAILED"
    echo ""
    echo "   🔍 Trying to diagnose the issue..."
    
    # Test if we can connect to MySQL at all
    echo "   Testing if MySQL server is reachable..."
    mysql -u nad_user -pSecureNADPassword2025! -h 127.0.0.1 -e "SELECT 1;" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "   ✅ MySQL server is reachable, but 'nad_cycle' database might not exist"
        echo "   💡 Listing available databases..."
        mysql -u nad_user -pSecureNADPassword2025! -h 127.0.0.1 -e "SHOW DATABASES;" 2>/dev/null
    else
        echo "   ❌ Cannot connect to MySQL server"
        echo "   💡 This could mean:"
        echo "      - User 'nad_user' doesn't exist"
        echo "      - Password is incorrect"
        echo "      - MySQL server is not running"
        echo "      - MySQL is not accepting connections"
    fi
fi

echo ""

# Check if we can connect as root to create user/database
echo "5. 🔍 Checking root access to create user/database if needed..."
echo "   (This will prompt for MySQL root password)"

read -p "   Do you want to test root connection and setup database? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   Enter MySQL root password when prompted..."
    
    # Test root connection
    mysql -u root -p -e "SELECT 1;" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Root connection successful!"
        echo "   🔧 Setting up nad_cycle database and nad_user..."
        
        mysql -u root -p << 'EOF'
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS nad_cycle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if it doesn't exist
CREATE USER IF NOT EXISTS 'nad_user'@'localhost' IDENTIFIED BY 'SecureNADPassword2025!';

-- Grant permissions
GRANT ALL PRIVILEGES ON nad_cycle.* TO 'nad_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Show result
SELECT 'Database and user setup complete!' as status;

-- Show databases
SHOW DATABASES;

-- Show users
SELECT User, Host FROM mysql.user WHERE User IN ('nad_user', 'root');
EOF
        
        if [ $? -eq 0 ]; then
            echo "   ✅ Database setup completed!"
            echo "   🔄 Testing connection again..."
            
            mysql -u nad_user -pSecureNADPassword2025! -h 127.0.0.1 nad_cycle -e "SELECT 'Connection test successful!' as result, USER() as current_user, DATABASE() as current_db;"
            
            if [ $? -eq 0 ]; then
                echo "   🎉 SUCCESS! Database is now ready for NAD application!"
            else
                echo "   ❌ Still having connection issues after setup"
            fi
        else
            echo "   ❌ Database setup failed"
        fi
    else
        echo "   ❌ Root connection failed"
        echo "   💡 You may need to reset MySQL root password or check MySQL installation"
    fi
fi

echo ""
echo "6. 📋 Summary and Next Steps:"
echo "   If connection is working: Your NAD app should be able to connect"
echo "   If connection failed: Follow the troubleshooting steps above"
echo ""
echo "   🔧 Manual commands to setup database:"
echo "   sudo mysql -u root -p"
echo "   CREATE DATABASE IF NOT EXISTS nad_cycle;"
echo "   CREATE USER IF NOT EXISTS 'nad_user'@'localhost' IDENTIFIED BY 'SecureNADPassword2025!';"
echo "   GRANT ALL PRIVILEGES ON nad_cycle.* TO 'nad_user'@'localhost';"
echo "   FLUSH PRIVILEGES;"
echo "   EXIT;"
echo ""
echo "   🧪 Test connection:"
echo "   mysql -u nad_user -pSecureNADPassword2025! -h 127.0.0.1 nad_cycle"
echo ""
echo "🏁 Database test complete!"
