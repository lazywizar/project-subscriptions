import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { mkdir } from 'fs/promises';
import pg from 'pg'; // Import pg as a default import
import { dbConfig } from './config.js'; // Import the database configuration

const { Pool } = pg; // Destructure Pool from the default import

const app = express();
const upload = multer({ dest: 'uploads/' });

// PostgreSQL connection configuration
const pool = new Pool(dbConfig);

// Ensure uploads directory exists
try {
  await mkdir('uploads', { recursive: true });
} catch (err) {
  if (err.code !== 'EEXIST') {
    console.error('Failed to create uploads directory:', err);
    process.exit(1);
  }
}

// Initialize PostgreSQL database tables
try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      merchant TEXT NOT NULL,
      category TEXT,
      account TEXT,
      original_statement TEXT,
      notes TEXT,
      amount REAL NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      merchant TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      day_of_month INTEGER,
      last_transaction_date TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      is_false_positive BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Upload and process CSV
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const parser = parse({
      columns: true,
      skip_empty_lines: true
    });

    const transactions = [];
    await new Promise((resolve, reject) => {
      createReadStream(req.file.path)
        .pipe(parser)
        .on('data', (row) => {
          transactions.push({
            date: row.Date,
            merchant: row.Merchant,
            category: row.Category,
            account: row.Account,
            original_statement: row['Original Statement'],
            notes: row.Notes,
            amount: parseFloat(row.Amount) || 0
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Insert transactions
    const insertTransactionQuery = `
      INSERT INTO transactions (date, merchant, category, account, original_statement, notes, amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    for (const tx of transactions) {
      await pool.query(insertTransactionQuery, [
        tx.date, tx.merchant, tx.category, tx.account, tx.original_statement, tx.notes, tx.amount
      ]);
    }

    // Analyze for subscriptions
    await pool.query(`
      INSERT INTO subscriptions (merchant, amount, frequency, day_of_month, last_transaction_date)
      SELECT
        merchant,
        amount,
        CASE
          WHEN (MAX(date::date) - MIN(date::date)) > 300 THEN 'annual'
          WHEN (MAX(date::date) - MIN(date::date)) > 60 THEN 'quarterly'
          ELSE 'monthly'
        END as frequency,
        EXTRACT(DAY FROM MIN(date::date)) as day_of_month,
        MAX(date::date) as last_transaction_date
      FROM transactions
      GROUP BY merchant, amount, EXTRACT(DAY FROM date::date)
      HAVING COUNT(*) >= 2
      ON CONFLICT DO NOTHING;
    `);

    res.json({ success: true });
  } catch (err) {
    console.error('Error processing CSV:', err);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
    const transactions = result.rows.map((row) => ({
      id: row.id,
      date: row.date,
      merchant: row.merchant,
      category: row.category,
      account: row.account,
      original_statement: row.original_statement,
      notes: row.notes,
      amount: row.amount
    }));
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get all subscriptions
app.get('/api/subscriptions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscriptions ORDER BY last_transaction_date DESC');
    const subscriptions = result.rows.map((row) => ({
      id: row.id,
      merchant: row.merchant,
      amount: row.amount,
      frequency: row.frequency,
      day_of_month: row.day_of_month,
      last_transaction_date: row.last_transaction_date,
      is_active: row.is_active,
      is_false_positive: row.is_false_positive
    }));
    res.json(subscriptions);
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Mark subscription as false positive
app.post('/api/subscriptions/:id/false-positive', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE subscriptions SET is_false_positive = TRUE, is_active = FALSE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking subscription as false positive:', err);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Mark subscription as inactive
app.post('/api/subscriptions/:id/inactive', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE subscriptions SET is_active = FALSE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking subscription as inactive:', err);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});