const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Import API handler
const expensesHandler = require('./api/expenses.js');

// Routes - wrap async handler
app.get('/api/expenses', async (req, res) => {
    await expensesHandler(req, res);
});

app.post('/api/expenses', async (req, res) => {
    await expensesHandler(req, res);
});

app.delete('/api/expenses', async (req, res) => {
    await expensesHandler(req, res);
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📝 Open index.html in your browser\n`);
});
