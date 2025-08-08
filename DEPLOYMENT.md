# Deployment Guide

## Vercel Deployment

This application is configured for deployment on Vercel with serverless functions.

### ⚠️ Important Notes for Vercel

1. **Database Limitation**: Vercel serverless functions don't support SQLite databases. The Vercel version uses in-memory storage that resets on each deployment.

2. **For Production**: Consider using external databases:
   - **PlanetScale** (MySQL-compatible)
   - **Supabase** (PostgreSQL)
   - **MongoDB Atlas**
   - **Neon** (PostgreSQL)

### Vercel Configuration

The application includes:
- `vercel.json` - Vercel deployment configuration
- `api/accounts.js` - Serverless function for accounts
- `api/transactions.js` - Serverless function for transactions

### Deployment Steps

1. **Connect to GitHub**: Link your Vercel account to the GitHub repository
2. **Deploy**: Vercel automatically deploys on git push
3. **Environment**: No environment variables needed for demo

### API Endpoints (Vercel)

- `GET /api/accounts` - Get chart of accounts
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction

### Local vs Production

- **Local**: Uses SQLite database with persistence
- **Vercel**: Uses in-memory storage (resets on deploy)

### Recommended Production Setup

For a production deployment with persistent data:

1. **Database**: Use PlanetScale or Supabase
2. **Hosting**: Vercel (frontend) + database service
3. **Environment Variables**: Set database connection strings

### File Structure for Vercel

```
/
├── api/                    # Serverless functions
│   ├── accounts.js        # GET /api/accounts
│   └── transactions.js    # GET/POST /api/transactions
├── frontend/              # Static files
│   ├── index.html         # Main interface
│   └── form.js           # Frontend logic
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies
```

### Alternative Deployments

For full SQLite support, consider:
- **Railway** - Supports Node.js with file storage
- **Render** - Supports persistent disks
- **DigitalOcean App Platform** - File storage support
- **Traditional VPS** - Full control over file system