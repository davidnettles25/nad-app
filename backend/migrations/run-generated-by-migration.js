#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runMigration() {
    let connection;
    
    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'nad_user',
            password: process.env.DB_PASSWORD || 'SecureNADPassword2025!',
            database: process.env.DB_NAME || 'nad_cycle'
        });

        console.log('✅ Connected to database');

        // Check current column type
        console.log('🔍 Checking current column type...');
        const [currentColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
              AND TABLE_NAME = 'nad_test_ids' 
              AND COLUMN_NAME = 'generated_by'
        `, [process.env.DB_NAME || 'nad_cycle']);

        if (currentColumns.length === 0) {
            console.log('⚠️  Column generated_by does not exist. Adding it...');
            await connection.execute(`
                ALTER TABLE nad_test_ids 
                ADD COLUMN generated_by VARCHAR(255) DEFAULT NULL 
                COMMENT 'Email ID of the admin who created this batch'
            `);
            console.log('✅ Column added successfully');
        } else {
            const column = currentColumns[0];
            console.log(`📊 Current column type: ${column.DATA_TYPE}`);
            
            if (column.DATA_TYPE.toLowerCase() !== 'varchar') {
                console.log('🔄 Converting column to VARCHAR(255)...');
                
                // First, update any existing integer values to NULL
                await connection.execute(`
                    UPDATE nad_test_ids 
                    SET generated_by = NULL 
                    WHERE generated_by IS NOT NULL
                `);
                
                // Now alter the column
                await connection.execute(`
                    ALTER TABLE nad_test_ids 
                    MODIFY COLUMN generated_by VARCHAR(255) DEFAULT NULL 
                    COMMENT 'Email ID of the admin who created this batch'
                `);
                
                console.log('✅ Column converted successfully');
            } else {
                console.log('✅ Column is already VARCHAR type');
                
                // Check if we need to increase the length
                if (column.CHARACTER_MAXIMUM_LENGTH < 255) {
                    console.log(`🔄 Increasing column length from ${column.CHARACTER_MAXIMUM_LENGTH} to 255...`);
                    await connection.execute(`
                        ALTER TABLE nad_test_ids 
                        MODIFY COLUMN generated_by VARCHAR(255) DEFAULT NULL 
                        COMMENT 'Email ID of the admin who created this batch'
                    `);
                    console.log('✅ Column length updated');
                }
            }
        }

        // Verify the final state
        const [finalColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
              AND TABLE_NAME = 'nad_test_ids' 
              AND COLUMN_NAME = 'generated_by'
        `, [process.env.DB_NAME || 'nad_cycle']);

        if (finalColumns.length > 0) {
            const column = finalColumns[0];
            console.log('\n📊 Final column configuration:');
            console.log(`   Type: ${column.DATA_TYPE}`);
            console.log(`   Length: ${column.CHARACTER_MAXIMUM_LENGTH}`);
            console.log(`   Comment: ${column.COLUMN_COMMENT}`);
            console.log('\n✅ Migration completed successfully!');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔒 Database connection closed');
        }
    }
}

// Run the migration
runMigration().catch(console.error);