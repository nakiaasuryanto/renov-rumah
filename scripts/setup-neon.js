// Initialize Neon Postgres database with expenses table
// Run with: node scripts/setup-neon.js

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('Please set DATABASE_URL in your .env file or Vercel environment variables');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function setupDatabase() {
    try {
        console.log('🔧 Setting up Neon database...');

        // Create expenses table
        await sql`
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                category VARCHAR(10) NOT NULL CHECK (category IN ('jasa', 'barang')),
                description TEXT NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Expenses table created');

        // Create indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_date ON expenses(date)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_category ON expenses(category)`;
        console.log('✅ Indexes created');

        console.log('\n✅ Database setup complete!');
    } catch (error) {
        console.error('❌ Error setting up database:', error);
        process.exit(1);
    }
}

setupDatabase();
