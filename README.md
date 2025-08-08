# Financial Automation System

A comprehensive financial journal automation system built with Node.js, Express, and SQLite for smart transaction entry and real-time journal tracking.

## 🚀 Features

### ✨ **Smart Transaction Entry**
- **4 Transaction Types**: DP (Down Payment), Lunas (Full Payment), Pelunasan (Settlement), Umum (General)
- **Automatic Journal Generation**: Creates balanced double-entry journal lines based on transaction type
- **Real-time Preview**: Live journal preview with balance validation
- **Indonesian Chart of Accounts**: Pre-loaded with 27 standard Indonesian accounting accounts

### 📊 **Split-Screen Interface**
- **Form on Left**: Smart transaction entry with conditional fields
- **Transaction List on Right**: Real-time transaction tracking with separate debit/credit columns
- **Responsive Design**: Adapts to different screen sizes

### 💾 **Database-Driven**
- **SQLite Database**: Persistent data storage with automatic initialization
- **Transaction Integrity**: ACID compliance with rollback protection
- **Rich Queries**: Joins accounts with journal lines for complete transaction data

## 🛠️ Technology Stack

- **Backend**: Node.js + Express
- **Database**: SQLite3 with automatic schema creation
- **Frontend**: Vanilla JavaScript with modern ES6+
- **Styling**: Custom CSS with responsive grid layout

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nakiaasuryanto/fin-formation.git
   cd fin-formation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api/accounts

## 🗄️ Database Schema

The system automatically creates and initializes the SQLite database on first run:

### Tables
- **accounts**: Chart of accounts (27 pre-loaded Indonesian accounts)
- **transactions**: Transaction headers (date, description)
- **journal_lines**: Double-entry journal lines with account references

### Auto-Initialization
- Creates `financial.db` on first startup
- Inserts complete Indonesian chart of accounts
- No manual database setup required

## 📋 Transaction Types

### 1. **DP (Down Payment)**
- Records partial payment with remaining receivables
- Auto-generates: Kas (debit), Piutang (debit), Penjualan (credit)
- Optional: Production costs and admin fees

### 2. **Lunas (Full Payment)**
- Records complete payment transactions
- Auto-generates: Kas (debit), Penjualan (credit)
- Optional: Production costs and admin fees

### 3. **Pelunasan (Settlement)**
- Records receivable collections
- Auto-generates: Kas (debit), Piutang (credit)
- Optional: Shipping costs and admin fees

### 4. **Umum (General)**
- Flexible manual journal entry
- Add multiple debit/credit lines
- Real-time balance validation

## 🎯 Key Features

### ✅ **Automatic Journal Generation**
- Smart logic for each transaction type
- Maintains double-entry bookkeeping principles
- Real-time balance validation

### ✅ **Real-time Interface**
- Live journal preview as you type
- Instant transaction list updates
- Conditional form fields based on transaction type

### ✅ **Data Integrity**
- Database transactions with rollback protection
- Foreign key constraints
- Journal balance validation before saving

### ✅ **Professional UI**
- Split-screen responsive design
- Currency formatting (Indonesian Rupiah)
- Color-coded debit/credit columns

## 🔧 Development

### Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon

### API Endpoints
- `GET /api/accounts`: Retrieve chart of accounts
- `GET /api/transactions`: Retrieve all transactions with journal lines
- `POST /api/transactions`: Create new transaction with validation

### Project Structure
```
fin-automation/
├── server.js              # Main Express server
├── database.js            # Database initialization & helpers
├── package.json           # Dependencies and scripts
├── frontend/
│   ├── index.html         # Main split-screen interface
│   ├── form.js            # Smart transaction form logic
│   └── transaksi.html     # Alternative transaction view
├── financial.db           # SQLite database (created automatically)
└── README.md              # This file
```

## 📊 Chart of Accounts

Pre-loaded Indonesian accounting structure:
- **111-134**: Assets (Kas, Midtrans, BCA, Piutang, etc.)
- **211**: Liabilities (Hutang)
- **311-315**: Equity (Modal, Laba Ditahan, Prive)
- **411, 711**: Revenue (Penjualan, Pendapatan Lain-lain)
- **511-617, 811**: Expenses (Production, Operating, Other)

## 🚀 Deployment

The system is ready for deployment with:
- Lightweight SQLite database
- No external database dependencies
- Single-file deployment with auto-initialization

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Built with ❤️ for Indonesian accounting practices**