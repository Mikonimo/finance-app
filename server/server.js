import express from 'express';
import cors from 'cors';
import { initDatabase, queries } from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Finance API is running' });
});

// Generic routes for each table
const tables = ['accounts', 'categories', 'transactions', 'budgets'];

tables.forEach(table => {
  // GET all records
  app.get(`/api/${table}`, (req, res) => {
    try {
      const data = queries.getAll(table);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET single record by ID
  app.get(`/api/${table}/:id`, (req, res) => {
    try {
      const data = queries.getById(table, req.params.id);
      if (!data) {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST - Create new record
  app.post(`/api/${table}`, (req, res) => {
    try {
      const id = queries.insert(table, req.body);
      const newRecord = queries.getById(table, id);
      res.status(201).json(newRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT - Update record
  app.put(`/api/${table}/:id`, (req, res) => {
    try {
      const changes = queries.update(table, req.params.id, req.body);
      if (changes === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }
      const updated = queries.getById(table, req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE - Remove record
  app.delete(`/api/${table}/:id`, (req, res) => {
    try {
      const changes = queries.delete(table, req.params.id);
      if (changes === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.json({ message: 'Record deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

// Sync endpoint - Get all data modified since last sync
app.get('/api/sync', (req, res) => {
  try {
    const lastSync = req.query.since;
    const data = queries.getSyncData(lastSync);
    res.json({
      ...data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk sync endpoint - Push multiple changes at once
app.post('/api/sync/push', (req, res) => {
  try {
    const { accounts, categories, transactions, budgets, recurringTransactions, netWorthSnapshots } = req.body;
    const results = { inserted: 0, updated: 0, errors: [] };

    // Process each table
    if (accounts) {
      accounts.forEach(item => {
        try {
          if (item.id) {
            queries.update('accounts', item.id, item);
            results.updated++;
          } else {
            queries.insert('accounts', item);
            results.inserted++;
          }
        } catch (error) {
          results.errors.push({ table: 'accounts', item, error: error.message });
        }
      });
    }

    if (categories) {
      categories.forEach(item => {
        try {
          if (item.id) {
            queries.update('categories', item.id, item);
            results.updated++;
          } else {
            queries.insert('categories', item);
            results.inserted++;
          }
        } catch (error) {
          results.errors.push({ table: 'categories', item, error: error.message });
        }
      });
    }

    if (transactions) {
      transactions.forEach(item => {
        try {
          // Serialize tags array to JSON string for SQLite
          const processedItem = {
            ...item,
            tags: item.tags ? JSON.stringify(item.tags) : null
          };
          
          if (item.id) {
            queries.update('transactions', item.id, processedItem);
            results.updated++;
          } else {
            queries.insert('transactions', processedItem);
            results.inserted++;
          }
        } catch (error) {
          results.errors.push({ table: 'transactions', item, error: error.message });
        }
      });
    }

    if (budgets) {
      budgets.forEach(item => {
        try {
          if (item.id) {
            queries.update('budgets', item.id, item);
            results.updated++;
          } else {
            queries.insert('budgets', item);
            results.inserted++;
          }
        } catch (error) {
          results.errors.push({ table: 'budgets', item, error: error.message });
        }
      });
    }

    if (recurringTransactions) {
      recurringTransactions.forEach(item => {
        try {
          // Serialize tags if present
          const dataToSave = {
            ...item,
            tags: item.tags ? JSON.stringify(item.tags) : null
          };
          
          if (item.id) {
            queries.update('recurring_transactions', item.id, dataToSave);
            results.updated++;
          } else {
            queries.insert('recurring_transactions', dataToSave);
            results.inserted++;
          }
        } catch (error) {
          results.errors.push({ table: 'recurring_transactions', item, error: error.message });
        }
      });
    }

    if (netWorthSnapshots) {
      netWorthSnapshots.forEach(item => {
        try {
          if (item.id) {
            queries.update('networth_snapshots', item.id, item);
            results.updated++;
          } else {
            queries.insert('networth_snapshots', item);
            results.inserted++;
          }
        } catch (error) {
          results.errors.push({ table: 'networth_snapshots', item, error: error.message });
        }
      });
    }

    res.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Finance API server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Access from network: http://172.17.1.167:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
