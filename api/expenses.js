// API for expenses - MySQL-backed expense tracking

const pool = require('../config/db.js');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        // Return all expenses sorted by date (newest first)
        try {
            const [results] = await pool.query(
                'SELECT * FROM expenses ORDER BY date DESC, id DESC'
            );
            res.status(200).json(results);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            res.status(500).json({ error: 'Failed to fetch expenses' });
        }
        return;
    }

    if (req.method === 'POST') {
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
        return;
    }

    if (req.method === 'DELETE') {
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
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
};
