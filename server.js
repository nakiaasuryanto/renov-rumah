// Smart Financial Automation Server with Database
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, DatabaseHelper } = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Database instance
let db;
let dbHelper;

// API Routes
app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = await dbHelper.getAccounts();
        res.json(accounts);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const { date, description, lines } = req.body;

        // Validate journal balance
        const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return res.status(400).json({
                error: 'Journal not balanced',
                totalDebit,
                totalCredit
            });
        }

        console.log('\n📥 New Transaction Received:');
        console.log('🗓️ Date:', date);
        console.log('📝 Description:', description);
        console.log('📒 Journal Entries:');
        lines.forEach((line, i) => {
            console.log(`  ${i + 1}. Account ID: ${line.account_id} — Debit: ${line.debit || 0}, Credit: ${line.credit || 0}`);
        });

        const result = await dbHelper.createTransaction({ date, description, lines });
        
        res.status(201).json({
            id: result.id,
            message: result.message
        });

    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await dbHelper.getTransactions();
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/transaksi', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'transaksi.html'));
});

// Initialize database and start server
async function startServer() {
    try {
        db = await initializeDatabase();
        dbHelper = new DatabaseHelper(db);
        
        app.listen(PORT, () => {
            console.log(`🚀 Financial Automation Server running on port ${PORT}`);
            console.log(`📱 Frontend: http://localhost:${PORT}`);
            console.log(`🔗 API: http://localhost:${PORT}/api/accounts`);
            console.log(`💾 Database: SQLite - financial.db`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
