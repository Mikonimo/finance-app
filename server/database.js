import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'finance.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDatabase() {
  // Accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL DEFAULT 0,
      color TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      monthlyBudget REAL DEFAULT 0,
      parentCategoryId INTEGER,
      isActive INTEGER DEFAULT 1,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parentCategoryId) REFERENCES categories(id)
    )
  `);

  // Add parentCategoryId column if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE categories ADD COLUMN parentCategoryId INTEGER`);
    console.log('✅ Added parentCategoryId column to categories table');
  } catch (error) {
    // Column already exists, ignore error
  }

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      categoryId INTEGER NOT NULL,
      type TEXT NOT NULL,
      toAccountId INTEGER,
      payee TEXT,
      tags TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (accountId) REFERENCES accounts(id),
      FOREIGN KEY (toAccountId) REFERENCES accounts(id),
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    )
  `);

  // Add missing columns to transactions if they don't exist (migrations)
  try {
    db.exec(`ALTER TABLE transactions ADD COLUMN toAccountId INTEGER`);
    console.log('✅ Added toAccountId column to transactions table');
  } catch (error) {
    // Column already exists, ignore
  }
  
  try {
    db.exec(`ALTER TABLE transactions ADD COLUMN payee TEXT`);
    console.log('✅ Added payee column to transactions table');
  } catch (error) {
    // Column already exists, ignore
  }
  
  try {
    db.exec(`ALTER TABLE transactions ADD COLUMN tags TEXT`);
    console.log('✅ Added tags column to transactions table');
  } catch (error) {
    // Column already exists, ignore
  }
  
  try {
    db.exec(`ALTER TABLE transactions ADD COLUMN notes TEXT`);
    console.log('✅ Added notes column to transactions table');
  } catch (error) {
    // Column already exists, ignore
  }
  
  try {
    db.exec(`ALTER TABLE transactions ADD COLUMN isActive INTEGER DEFAULT 1`);
    console.log('✅ Added isActive column to transactions table');
  } catch (error) {
    // Column already exists, ignore
  }

  // Budgets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoryId INTEGER NOT NULL,
      month TEXT NOT NULL,
      amount REAL NOT NULL,
      spent REAL DEFAULT 0,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    )
  `);

  // Recurring Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      categoryId INTEGER NOT NULL,
      type TEXT NOT NULL,
      frequency TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT,
      lastProcessed TEXT NOT NULL,
      payee TEXT,
      tags TEXT,
      notes TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (accountId) REFERENCES accounts(id),
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    )
  `);

  // Net Worth Snapshots table
  db.exec(`
    CREATE TABLE IF NOT EXISTS networth_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      totalAssets REAL NOT NULL,
      totalLiabilities REAL NOT NULL,
      netWorth REAL NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Database initialized successfully');
}

// Generic CRUD operations
export const queries = {
  // Get all records from a table
  getAll: (table) => db.prepare(`SELECT * FROM ${table}`).all(),
  
  // Get a single record by ID
  getById: (table, id) => db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id),
  
  // Insert a new record
  insert: (table, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = db.prepare(sql).run(...values);
    return result.lastInsertRowid;
  },
  
  // Update a record
  update: (table, id, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE ${table} SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
    const result = db.prepare(sql).run(...values, id);
    return result.changes;
  },
  
  // Delete a record
  delete: (table, id) => {
    const result = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    return result.changes;
  },
  
  // Get transactions by account
  getTransactionsByAccount: (accountId) => 
    db.prepare('SELECT * FROM transactions WHERE accountId = ? ORDER BY date DESC').all(accountId),
  
  // Get transactions by category
  getTransactionsByCategory: (categoryId) => 
    db.prepare('SELECT * FROM transactions WHERE categoryId = ? ORDER BY date DESC').all(categoryId),
  
  // Sync: Get all data modified after a timestamp
  getSyncData: (lastSync) => {
    const timestamp = lastSync || '1970-01-01T00:00:00.000Z';
    const transactions = db.prepare('SELECT * FROM transactions WHERE updatedAt > ?').all(timestamp);
    const recurringTransactions = db.prepare('SELECT * FROM recurring_transactions WHERE updatedAt > ?').all(timestamp);
    const networthSnapshots = db.prepare('SELECT * FROM networth_snapshots WHERE updatedAt > ?').all(timestamp);
    
    // Deserialize tags from JSON strings
    const processedTransactions = transactions.map(t => ({
      ...t,
      tags: t.tags ? JSON.parse(t.tags) : null
    }));

    const processedRecurring = recurringTransactions.map(r => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : null
    }));
    
    return {
      accounts: db.prepare('SELECT * FROM accounts WHERE updatedAt > ?').all(timestamp),
      categories: db.prepare('SELECT * FROM categories WHERE updatedAt > ?').all(timestamp),
      transactions: processedTransactions,
      budgets: db.prepare('SELECT * FROM budgets WHERE updatedAt > ?').all(timestamp),
      recurringTransactions: processedRecurring,
      netWorthSnapshots: networthSnapshots,
    };
  }
};

export default db;
