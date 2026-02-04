// API for expenses - Neon Postgres backed expense tracking
// Works on Vercel with Neon database

const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

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
        try {
            const result = await sql`
                SELECT * FROM expenses ORDER BY date DESC, id DESC
            `;
            res.status(200).json(result);
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

            const result = await sql`
                INSERT INTO expenses (date, category, description, amount)
                VALUES (${date}, ${category}, ${description}, ${amount})
                RETURNING *
            `;

            res.status(201).json({
                id: result[0].id,
                message: 'Expense saved successfully',
                data: result[0]
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

            const result = await sql`
                DELETE FROM expenses WHERE id = ${id}
                RETURNING *
            `;

            if (!result.length) {
                res.status(404).json({ error: 'Expense not found' });
                return;
            }

            res.status(200).json({ message: 'Expense deleted successfully' });

        } catch (error) {
            console.error('Error deleting expense:', error);
            res.status(500).json({ error: 'Failed to delete expense' });
        }
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
};
