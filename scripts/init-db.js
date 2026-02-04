const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
    // First connect without database to create it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log('Creating database:', process.env.DB_NAME);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log('✅ Database created/already exists');

        await connection.query(`USE ${process.env.DB_NAME}`);

        // Create expenses table
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATE NOT NULL,
                category ENUM('jasa', 'barang') NOT NULL,
                description VARCHAR(500) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_date (date),
                INDEX idx_category (category)
            )
        `;

        await connection.query(createTableSQL);
        console.log('✅ Expenses table created/already exists');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

initDatabase();
