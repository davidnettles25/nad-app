// Updated database configuration for your NAD application
// Place this in your server.js or database config file

const mysql = require('mysql2/promise');

// Optimized database configuration for Bitnami MariaDB
const dbConfig = {
    host: '127.0.0.1',  // Use IPv4 explicitly
    port: 3306,
    user: 'nad_user',
    password: 'SecureNADPassword2025!',
    database: 'nad_cycle',
    charset: 'utf8mb4',
    
    // Connection pool settings (remove invalid options)
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    
    // Valid timeout options for mysql2
    connectTimeout: 60000,
    
    // Bitnami MariaDB socket path (as fallback)
    socketPath: '/opt/bitnami/mariadb/tmp/mysql.sock',
    
    // Additional settings for stability
    reconnect: true,
    multipleStatements: false,
    
    // SSL settings (if needed)
    ssl: false
};

// Alternative configuration without socket (recommended for your setup)
const dbConfigSimple = {
    host: '127.0.0.1',
    port: 3306,
    user: 'nad_user',
    password: 'SecureNADPassword2025!',
    database: 'nad_cycle',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    reconnect: true
};

// Create connection pool
let db;

async function initializeDatabase() {
    try {
        console.log('🔗 Connecting to Bitnami MariaDB...');
        
        // Try the simple configuration first
        db = mysql.createPool(dbConfigSimple);
        
        // Test the connection
        const [rows] = await db.execute('SELECT 1 as test, USER() as current_user, DATABASE() as current_db');
        console.log('✅ Database connected successfully');
        console.log('✅ Connected as:', rows[0].current_user);
        console.log('✅ Database:', rows[0].current_db);
        
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        
        // If simple config fails, try with socket
        try {
            console.log('🔄 Trying socket connection...');
            db = mysql.createPool(dbConfig);
            const [rows] = await db.execute('SELECT 1 as test');
            console.log('✅ Database connected via socket');
            return true;
        } catch (socketError) {
            console.error('❌ Socket connection also failed:', socketError.message);
            return false;
        }
    }
}

// Test function to verify everything works
async function testDatabaseOperations() {
    try {
        console.log('\n🧪 Testing database operations...');
        
        // Test basic query
        const [basicTest] = await db.execute('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?', ['nad_cycle']);
        console.log('✅ Tables in nad_cycle database:', basicTest[0].table_count);
        
        // Test if NAD tables exist
        const [tableCheck] = await db.execute(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'nad_cycle' 
            AND table_name LIKE 'nad_%'
        `);
        
        if (tableCheck.length > 0) {
            console.log('✅ NAD tables found:');
            tableCheck.forEach(table => console.log(`   - ${table.table_name}`));
        } else {
            console.log('⚠️ No NAD tables found - you may need to create them');
        }
        
        // Test a simple insert/select (non-destructive)
        const [userRoleTest] = await db.execute('SELECT COUNT(*) as role_count FROM nad_user_roles');
        console.log('✅ User roles in database:', userRoleTest[0].role_count);
        
        return true;
    } catch (error) {
        console.error('❌ Database operations test failed:', error.message);
        return false;
    }
}

// Export for use in your application
module.exports = {
    db,
    initializeDatabase,
    testDatabaseOperations,
    dbConfig: dbConfigSimple  // Export the working config
};

// If running this file directly, test the connection
if (require.main === module) {
    async function main() {
        const success = await initializeDatabase();
        if (success) {
            await testDatabaseOperations();
            console.log('\n🎉 Database is ready for your NAD application!');
            process.exit(0);
        } else {
            console.log('\n❌ Database setup failed');
            process.exit(1);
        }
    }
    
    main();
}
