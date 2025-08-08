# Database Schema Documentation

## Overview
The financial automation system now uses SQLite database for persistent data storage instead of in-memory storage.

## Database File
- **Location**: `financial.db` (created automatically in project root)
- **Type**: SQLite 3
- **Auto-initialization**: Yes, with default chart of accounts

## Tables

### 1. accounts
Stores the chart of accounts (master data)

```sql
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,           -- Account code (111, 112, etc.)
    name TEXT NOT NULL,                  -- Account name (Kas, Midtrans, etc.)
    normal_balance TEXT NOT NULL,        -- 'DEBET' or 'KREDIT'
    account_group TEXT NOT NULL,         -- 'NERACA' or 'LABA RUGI'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Pre-loaded with 27 accounts:**
- Asset accounts (111-134)
- Liability accounts (211)
- Equity accounts (311-315)
- Revenue accounts (411, 711)
- Expense accounts (511-617, 811)

### 2. transactions
Stores transaction headers

```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,                  -- Transaction date
    description TEXT NOT NULL,           -- Transaction description
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. journal_lines
Stores individual journal entries (double-entry lines)

```sql
CREATE TABLE journal_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,     -- FK to transactions.id
    account_id INTEGER NOT NULL,         -- FK to accounts.id
    debit DECIMAL(15,2) DEFAULT 0,      -- Debit amount
    credit DECIMAL(15,2) DEFAULT 0,     -- Credit amount
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

## Key Features

### ✅ **Automatic Initialization**
- Database and tables created automatically on first run
- Default chart of accounts inserted automatically
- No manual setup required

### ✅ **Transaction Integrity**
- Database transactions ensure atomicity
- Rollback on errors
- Foreign key constraints maintain referential integrity

### ✅ **Balanced Journal Validation**
- Server validates debit = credit before saving
- Prevents unbalanced journal entries

### ✅ **Rich Query Support**
- Joins accounts with journal lines
- Returns complete transaction data with account names/codes
- Maintains compatibility with existing frontend

## API Compatibility

The database implementation maintains 100% compatibility with the existing frontend:

- **GET /api/accounts** - Returns accounts with label formatting
- **GET /api/transactions** - Returns transactions with nested journal lines
- **POST /api/transactions** - Creates transactions with journal validation

## Database Files Created

When you run the server, these files are created:
- `financial.db` - Main SQLite database file
- `database.js` - Database helper module (already created)

## Benefits of Database Implementation

1. **Persistence** - Data survives server restarts
2. **Performance** - Efficient queries with indexes
3. **Scalability** - Can handle thousands of transactions
4. **Backup** - Simple file-based backup (`financial.db`)
5. **Analysis** - Direct SQL queries for reporting
6. **Integrity** - ACID transactions and constraints

## Migration Notes

- No data migration needed (fresh installation)
- All existing frontend code works unchanged
- Server startup creates database automatically
- Previous in-memory data was not preserved (as expected)