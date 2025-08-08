// Vercel serverless function for transactions API
// Note: Using in-memory storage for demo (resets on each deploy)
// For production, use external database like PlanetScale, Supabase, or MongoDB Atlas

let transactionStore = [];
let transactionCounter = 1;

const mockAccounts = [
    { id: 1, code: '111', name: 'Kas', normal_balance: 'DEBET', account_group: 'NERACA' },
    { id: 2, code: '112', name: 'Midtrans', normal_balance: 'DEBET', account_group: 'NERACA' },
    { id: 3, code: '113', name: 'BCA', normal_balance: 'DEBET', account_group: 'NERACA' },
    { id: 4, code: '114', name: 'Piutang Usaha', normal_balance: 'DEBET', account_group: 'NERACA' },
    { id: 5, code: '115', name: 'Piutang Pemegang Saham', normal_balance: 'DEBET', account_group: 'NERACA' },
    { id: 6, code: '121', name: 'Aset Tetap', normal_balance: 'DEBET', account_group: 'NERACA' },
    { id: 7, code: '122', name: 'Akumulasi Penyusutan Aset Tetap', normal_balance: 'KREDIT', account_group: 'NERACA' },
    { id: 8, code: '133', name: 'Persediaan Kustomproject', normal_balance: 'DEBET', account_group: 'NERACA' },
    { id: 9, code: '134', name: 'Persediaan', normal_balance: 'DEBET', account_group: 'NERACA' },
    { id: 10, code: '211', name: 'Hutang', normal_balance: 'KREDIT', account_group: 'NERACA' },
    { id: 11, code: '311', name: 'Modal', normal_balance: 'KREDIT', account_group: 'NERACA' },
    { id: 12, code: '312', name: 'Laba Ditahan', normal_balance: 'KREDIT', account_group: 'NERACA' },
    { id: 13, code: '313', name: 'Prive Araya Suryanto', normal_balance: 'DEBET', account_group: 'NERACA' },
    { id: 14, code: '314', name: 'Prive Nakia Suryanto', normal_balance: 'DEBET', account_group: 'NERACA' },
    { id: 15, code: '315', name: 'Prive Diah Ayu', normal_balance: 'DEBET', account_group: 'NERACA' },
    { id: 16, code: '411', name: 'Penjualan', normal_balance: 'KREDIT', account_group: 'LABA RUGI' },
    { id: 17, code: '511', name: 'Pembelian Bahan & Lain- lain', normal_balance: 'DEBET', account_group: 'LABA RUGI' },
    { id: 18, code: '512', name: 'Biaya Produksi', normal_balance: 'DEBET', account_group: 'LABA RUGI' },
    { id: 19, code: '611', name: 'Beban Gaji', normal_balance: 'DEBET', account_group: 'LABA RUGI' },
    { id: 20, code: '612', name: 'Beban Peralatan Kantor', normal_balance: 'DEBET', account_group: 'LABA RUGI' },
    { id: 21, code: '613', name: 'Beban ZIS', normal_balance: 'DEBET', account_group: 'LABA RUGI' },
    { id: 22, code: '614', name: 'Beban Marketing', normal_balance: 'DEBET', account_group: 'LABA RUGI' },
    { id: 23, code: '615', name: 'Beban Ongkos Kirim', normal_balance: 'DEBET', account_group: 'LABA RUGI' },
    { id: 24, code: '616', name: 'RnD', normal_balance: 'DEBET', account_group: 'LABA RUGI' },
    { id: 25, code: '617', name: 'Biaya Sponsorship', normal_balance: 'DEBET', account_group: 'LABA RUGI' },
    { id: 26, code: '711', name: 'Pendapatan Lain- Lain', normal_balance: 'KREDIT', account_group: 'LABA RUGI' },
    { id: 27, code: '811', name: 'Beban Lain- Lain', normal_balance: 'DEBET', account_group: 'LABA RUGI' }
];

function enrichLineWithAccountInfo(line) {
    const acc = mockAccounts.find(a => a.id === line.account_id);
    return {
        ...line,
        account_code: acc?.code || '',
        account_name: acc?.name || '',
    };
}

export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        // Return all transactions
        res.status(200).json(transactionStore);
        return;
    }

    if (req.method === 'POST') {
        try {
            const { date, description, lines: rawLines } = req.body;
            
            if (!date || !description || !rawLines || !Array.isArray(rawLines)) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            const lines = rawLines.map(enrichLineWithAccountInfo);

            // Validate journal balance
            const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
            const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                res.status(400).json({
                    error: 'Journal not balanced',
                    totalDebit,
                    totalCredit
                });
                return;
            }

            console.log('📥 New Transaction Received:');
            console.log('🗓️ Date:', date);
            console.log('📝 Description:', description);
            console.log('📒 Journal Entries:');
            lines.forEach((line, i) => {
                console.log(`  ${i + 1}. ${line.account_name} (${line.account_code}) — Debit: ${line.debit || 0}, Credit: ${line.credit || 0}`);
            });

            const newTransaction = {
                id: transactionCounter++,
                date,
                description,
                lines,
                created_at: new Date().toISOString()
            };

            transactionStore.push(newTransaction);

            res.status(201).json({
                id: newTransaction.id,
                message: 'Transaction created successfully',
                data: newTransaction
            });

        } catch (error) {
            console.error('Error creating transaction:', error);
            res.status(500).json({ error: 'Failed to create transaction' });
        }
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}