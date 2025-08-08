// Database initialization and setup
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'financial.db');

// Create and initialize database
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log('📁 Connected to SQLite database');
        });

        // Create tables
        db.serialize(() => {
            // Accounts table
            db.run(`
                CREATE TABLE IF NOT EXISTS accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    normal_balance TEXT NOT NULL CHECK (normal_balance IN ('DEBET', 'KREDIT')),
                    account_group TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating accounts table:', err);
                    reject(err);
                    return;
                }
                console.log('✅ Accounts table ready');
            });

            // Transactions table
            db.run(`
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date DATE NOT NULL,
                    description TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating transactions table:', err);
                    reject(err);
                    return;
                }
                console.log('✅ Transactions table ready');
            });

            // Journal lines table
            db.run(`
                CREATE TABLE IF NOT EXISTS journal_lines (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id INTEGER NOT NULL,
                    account_id INTEGER NOT NULL,
                    debit DECIMAL(15,2) DEFAULT 0,
                    credit DECIMAL(15,2) DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
                    FOREIGN KEY (account_id) REFERENCES accounts(id)
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating journal_lines table:', err);
                    reject(err);
                    return;
                }
                console.log('✅ Journal lines table ready');
            });

            // Insert default accounts if not exists
            insertDefaultAccounts(db, () => {
                resolve(db);
            });
        });
    });
}

// Insert default chart of accounts
function insertDefaultAccounts(db, callback) {
    const defaultAccounts = [
        { code: '111', name: 'Kas', normal_balance: 'DEBET', group: 'NERACA' },
        { code: '112', name: 'Midtrans', normal_balance: 'DEBET', group: 'NERACA' },
        { code: '113', name: 'BCA', normal_balance: 'DEBET', group: 'NERACA' },
        { code: '114', name: 'Piutang Usaha', normal_balance: 'DEBET', group: 'NERACA' },
        { code: '115', name: 'Piutang Pemegang Saham', normal_balance: 'DEBET', group: 'NERACA' },
        { code: '121', name: 'Aset Tetap', normal_balance: 'DEBET', group: 'NERACA' },
        { code: '122', name: 'Akumulasi Penyusutan Aset Tetap', normal_balance: 'KREDIT', group: 'NERACA' },
        { code: '133', name: 'Persediaan Kustomproject', normal_balance: 'DEBET', group: 'NERACA' },
        { code: '134', name: 'Persediaan', normal_balance: 'DEBET', group: 'NERACA' },
        { code: '211', name: 'Hutang', normal_balance: 'KREDIT', group: 'NERACA' },
        { code: '311', name: 'Modal', normal_balance: 'KREDIT', group: 'NERACA' },
        { code: '312', name: 'Laba Ditahan', normal_balance: 'KREDIT', group: 'NERACA' },
        { code: '313', name: 'Prive Araya Suryanto', normal_balance: 'DEBET', group: 'NERACA' },
        { code: '314', name: 'Prive Nakia Suryanto', normal_balance: 'DEBET', group: 'NERACA' },
        { code: '315', name: 'Prive Diah Ayu', normal_balance: 'DEBET', group: 'NERACA' },
        { code: '411', name: 'Penjualan', normal_balance: 'KREDIT', group: 'LABA RUGI' },
        { code: '511', name: 'Pembelian Bahan & Lain- lain', normal_balance: 'DEBET', group: 'LABA RUGI' },
        { code: '512', name: 'Biaya Produksi', normal_balance: 'DEBET', group: 'LABA RUGI' },
        { code: '611', name: 'Beban Gaji', normal_balance: 'DEBET', group: 'LABA RUGI' },
        { code: '612', name: 'Beban Peralatan Kantor', normal_balance: 'DEBET', group: 'LABA RUGI' },
        { code: '613', name: 'Beban ZIS', normal_balance: 'DEBET', group: 'LABA RUGI' },
        { code: '614', name: 'Beban Marketing', normal_balance: 'DEBET', group: 'LABA RUGI' },
        { code: '615', name: 'Beban Ongkos Kirim', normal_balance: 'DEBET', group: 'LABA RUGI' },
        { code: '616', name: 'RnD', normal_balance: 'DEBET', group: 'LABA RUGI' },
        { code: '617', name: 'Biaya Sponsorship', normal_balance: 'DEBET', group: 'LABA RUGI' },
        { code: '711', name: 'Pendapatan Lain- Lain', normal_balance: 'KREDIT', group: 'LABA RUGI' },
        { code: '811', name: 'Beban Lain- Lain', normal_balance: 'DEBET', group: 'LABA RUGI' }
    ];

    // Check if accounts already exist
    db.get("SELECT COUNT(*) as count FROM accounts", (err, row) => {
        if (err) {
            console.error('Error checking accounts:', err);
            callback();
            return;
        }

        if (row.count === 0) {
            console.log('🔄 Inserting default accounts...');
            
            const stmt = db.prepare(`
                INSERT INTO accounts (code, name, normal_balance, account_group) 
                VALUES (?, ?, ?, ?)
            `);

            let completed = 0;
            defaultAccounts.forEach(account => {
                stmt.run([account.code, account.name, account.normal_balance, account.group], (err) => {
                    if (err) {
                        console.error('Error inserting account:', err);
                    }
                    completed++;
                    if (completed === defaultAccounts.length) {
                        stmt.finalize();
                        console.log(`✅ Inserted ${defaultAccounts.length} default accounts`);
                        callback();
                    }
                });
            });
        } else {
            console.log(`✅ Found ${row.count} existing accounts`);
            callback();
        }
    });
}

// Database helper functions
class DatabaseHelper {
    constructor(db) {
        this.db = db;
    }

    // Get all accounts
    getAccounts() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT id, code, name, normal_balance, account_group,
                       '[' || code || '] ' || name || ' (' || normal_balance || ' – ' || account_group || ')' as label
                FROM accounts 
                ORDER BY code
            `, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Create transaction with journal lines
    createTransaction(transactionData) {
        const self = this;
        return new Promise((resolve, reject) => {
            const { date, description, lines } = transactionData;

            self.db.serialize(() => {
                self.db.run("BEGIN TRANSACTION");

                // Insert transaction
                self.db.run(`
                    INSERT INTO transactions (date, description) 
                    VALUES (?, ?)
                `, [date, description], function(err) {
                    if (err) {
                        self.db.run("ROLLBACK");
                        reject(err);
                        return;
                    }

                    const transactionId = this.lastID;

                    // Insert journal lines
                    const stmt = self.db.prepare(`
                        INSERT INTO journal_lines (transaction_id, account_id, debit, credit) 
                        VALUES (?, ?, ?, ?)
                    `);

                    let completed = 0;
                    let hasError = false;

                    lines.forEach(line => {
                        stmt.run([transactionId, line.account_id, line.debit || 0, line.credit || 0], (err) => {
                            if (err && !hasError) {
                                hasError = true;
                                stmt.finalize();
                                self.db.run("ROLLBACK");
                                reject(err);
                                return;
                            }

                            completed++;
                            if (completed === lines.length && !hasError) {
                                stmt.finalize();
                                self.db.run("COMMIT", (err) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve({
                                            id: transactionId,
                                            message: 'Transaction created successfully'
                                        });
                                    }
                                });
                            }
                        });
                    });
                });
            });
        });
    }

    // Get all transactions with journal lines and account info
    getTransactions() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    t.id,
                    t.date,
                    t.description,
                    t.created_at,
                    jl.id as line_id,
                    jl.debit,
                    jl.credit,
                    a.id as account_id,
                    a.code as account_code,
                    a.name as account_name
                FROM transactions t
                LEFT JOIN journal_lines jl ON t.id = jl.transaction_id
                LEFT JOIN accounts a ON jl.account_id = a.id
                ORDER BY t.id DESC, jl.id
            `, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Group by transaction
                const transactionsMap = {};
                
                rows.forEach(row => {
                    if (!transactionsMap[row.id]) {
                        transactionsMap[row.id] = {
                            id: row.id,
                            date: row.date,
                            description: row.description,
                            created_at: row.created_at,
                            lines: []
                        };
                    }

                    if (row.line_id) {
                        transactionsMap[row.id].lines.push({
                            id: row.line_id,
                            account_id: row.account_id,
                            account_code: row.account_code,
                            account_name: row.account_name,
                            debit: parseFloat(row.debit) || 0,
                            credit: parseFloat(row.credit) || 0
                        });
                    }
                });

                resolve(Object.values(transactionsMap));
            });
        });
    }
}

module.exports = {
    initializeDatabase,
    DatabaseHelper
};