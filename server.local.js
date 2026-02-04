import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// For local development with MySQL
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'pengeluaran_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('✅ MySQL connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection failed:', err.message);
    });

// Import API handler
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const expensesHandler = require('./api/expenses.js');

// Override the pool in the handler for local development
const originalHandler = expensesHandler.default || expensesHandler;

// Routes
app.get('/api/expenses', async (req, res) => {
    // Use MySQL directly for local development
    try {
        const [results] = await pool.query(
            'SELECT * FROM expenses ORDER BY date DESC, id DESC'
        );
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

app.post('/api/expenses', async (req, res) => {
    try {
        const { date, category, description, amount } = req.body;

        if (!date || !category || !description || !amount) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const [result] = await pool.query(
            'INSERT INTO expenses (date, category, description, amount) VALUES (?, ?, ?, ?)',
            [date, category, description, amount]
        );

        console.log('📥 New Expense saved:', { id: result.insertId, date, category, description, amount });

        res.status(201).json({
            id: result.insertId,
            message: 'Expense saved successfully',
            data: {
                id: result.insertId,
                date,
                category,
                description,
                amount: parseFloat(amount)
            }
        });

    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ error: 'Failed to save expense' });
    }
});

app.delete('/api/expenses', async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            res.status(400).json({ error: 'Missing expense id' });
            return;
        }

        const [result] = await pool.query(
            'DELETE FROM expenses WHERE id = ?',
            [parseInt(id)]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Expense not found' });
            return;
        }

        console.log('🗑️ Expense deleted:', id);
        res.status(200).json({ message: 'Expense deleted successfully' });

    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📝 Open index.html in your browser\n`);
});
