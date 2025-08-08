// Vercel serverless function for accounts API
export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // Mock account data (same as original)
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

    const result = mockAccounts.map(acc => ({
        ...acc,
        label: `[${acc.code}] ${acc.name} (${acc.normal_balance} – ${acc.account_group})`
    }));

    res.status(200).json(result);
}