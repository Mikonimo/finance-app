import { useState } from 'react';
import { Upload, Download, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { db } from '../db/database';
import { api } from '../utils/api';

export default function SyncPanel() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(
    localStorage.getItem('lastSyncTime')
  );
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Push local data to server
  const handlePushToServer = async () => {
    setSyncing(true);
    setSyncStatus({ type: null, message: '' });

    try {
      // Get all local data
      const accounts = await db.accounts.toArray();
      const categories = await db.categories.toArray();
      const transactions = await db.transactions.toArray();
      const budgets = await db.budgets.toArray();
      const recurringTransactions = await db.recurringTransactions.toArray();
      const netWorthSnapshots = await db.netWorthSnapshots.toArray();

      console.log('📤 Preparing to push:', {
        accounts: accounts.length,
        categories: categories.length,
        transactions: transactions.length,
        budgets: budgets.length,
        recurringTransactions: recurringTransactions.length,
        netWorthSnapshots: netWorthSnapshots.length,
      });

      // Convert dates to ISO strings for API
      const formattedAccounts = accounts.map(acc => ({
        ...acc,
        createdAt: acc.createdAt ? new Date(acc.createdAt).toISOString() : new Date().toISOString(),
      }));

      const formattedTransactions = transactions.map(txn => ({
        ...txn,
        date: txn.date ? new Date(txn.date).toISOString() : new Date().toISOString(),
        createdAt: txn.createdAt ? new Date(txn.createdAt).toISOString() : new Date().toISOString(),
      }));

      const formattedRecurring = recurringTransactions.map(rec => ({
        ...rec,
        startDate: rec.startDate ? new Date(rec.startDate).toISOString() : new Date().toISOString(),
        endDate: rec.endDate ? new Date(rec.endDate).toISOString() : null,
        lastProcessed: rec.lastProcessed ? new Date(rec.lastProcessed).toISOString() : new Date().toISOString(),
        createdAt: rec.createdAt ? new Date(rec.createdAt).toISOString() : new Date().toISOString(),
      }));

      const formattedSnapshots = netWorthSnapshots.map(snap => ({
        ...snap,
        date: snap.date ? new Date(snap.date).toISOString() : new Date().toISOString(),
        createdAt: snap.createdAt ? new Date(snap.createdAt).toISOString() : new Date().toISOString(),
      }));

      // Push to server
      const result = await api.sync.push({
        accounts: formattedAccounts,
        categories,
        transactions: formattedTransactions,
        budgets,
        recurringTransactions: formattedRecurring,
        netWorthSnapshots: formattedSnapshots,
      });

      console.log('✅ Push result:', result);
      
      if (result.errors && result.errors.length > 0) {
        console.error('❌ Push errors:', result.errors);
        result.errors.forEach((err: any, idx: number) => {
          console.error(`Error ${idx + 1}:`, {
            table: err.table,
            item: err.item,
            error: err.error
          });
        });
      }

      const timestamp = new Date().toISOString();
      localStorage.setItem('lastSyncTime', timestamp);
      setLastSync(timestamp);

      setSyncStatus({
        type: 'success',
        message: `✅ Pushed ${result.inserted} new, updated ${result.updated} items`,
      });
    } catch (error: any) {
      setSyncStatus({
        type: 'error',
        message: `❌ Push failed: ${error.message}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  // Pull data from server
  const handlePullFromServer = async () => {
    setSyncing(true);
    setSyncStatus({ type: null, message: '' });

    try {
      // Check if local database has any data
      const localAccountCount = await db.accounts.count();
      const localCategoryCount = await db.categories.count();
      const localTransactionCount = await db.transactions.count();
      
      console.log('📊 Local data count:', { 
        accounts: localAccountCount, 
        categories: localCategoryCount,
        transactions: localTransactionCount
      });
      
      // If database is mostly empty, do a full pull (ignore lastSyncTime)
      // Otherwise use lastSyncTime to get only changes since last sync
      const isEmptyDatabase = localAccountCount < 2 && localCategoryCount < 5;
      const lastSyncTime = isEmptyDatabase 
        ? undefined 
        : localStorage.getItem('lastSyncTime') || undefined;
      
      console.log('🔍 Pull strategy:', { 
        isEmptyDatabase, 
        usingTimestamp: lastSyncTime ? 'YES' : 'NO (full sync)',
        timestamp: lastSyncTime 
      });
      
      const serverData = await api.sync.pull(lastSyncTime);
      
      console.log('📥 Server data received:', {
        accounts: serverData.accounts?.length || 0,
        categories: serverData.categories?.length || 0,
        transactions: serverData.transactions?.length || 0,
      });

      let imported = 0;

      // Import accounts
      if (serverData.accounts && serverData.accounts.length > 0) {
        for (const account of serverData.accounts) {
          await db.accounts.put({
            ...account,
            createdAt: new Date(account.createdAt),
          });
          imported++;
        }
      }

      // Import categories
      if (serverData.categories && serverData.categories.length > 0) {
        for (const category of serverData.categories) {
          await db.categories.put(category);
          imported++;
        }
      }

      // Import transactions
      if (serverData.transactions && serverData.transactions.length > 0) {
        for (const transaction of serverData.transactions) {
          await db.transactions.put({
            ...transaction,
            date: new Date(transaction.date),
            createdAt: new Date(transaction.createdAt),
          });
          imported++;
        }
      }

      // Import budgets
      if (serverData.budgets && serverData.budgets.length > 0) {
        for (const budget of serverData.budgets) {
          await db.budgets.put(budget);
          imported++;
        }
      }

      // Import recurring transactions
      if (serverData.recurringTransactions && serverData.recurringTransactions.length > 0) {
        for (const recurring of serverData.recurringTransactions) {
          await db.recurringTransactions.put({
            ...recurring,
            startDate: new Date(recurring.startDate),
            endDate: recurring.endDate ? new Date(recurring.endDate) : undefined,
            lastProcessed: new Date(recurring.lastProcessed),
            createdAt: new Date(recurring.createdAt),
          });
          imported++;
        }
      }

      // Import net worth snapshots
      if (serverData.netWorthSnapshots && serverData.netWorthSnapshots.length > 0) {
        for (const snapshot of serverData.netWorthSnapshots) {
          await db.netWorthSnapshots.put({
            ...snapshot,
            date: new Date(snapshot.date),
            createdAt: new Date(snapshot.createdAt),
          });
          imported++;
        }
      }

      const timestamp = serverData.timestamp || new Date().toISOString();
      localStorage.setItem('lastSyncTime', timestamp);
      setLastSync(timestamp);

      console.log('✅ Sync pull completed:', { imported, timestamp });

      setSyncStatus({
        type: 'success',
        message: `✅ Pulled ${imported} items from server`,
      });
    } catch (error: any) {
      setSyncStatus({
        type: 'error',
        message: `❌ Pull failed: ${error.message}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  // Full sync: Pull then Push
  const handleFullSync = async () => {
    await handlePullFromServer();
    setTimeout(async () => {
      await handlePushToServer();
    }, 1000);
  };

  // Force full pull (ignore lastSyncTime)
  const handleForceFullPull = async () => {
    setSyncing(true);
    setSyncStatus({ type: null, message: '' });

    try {
      console.log('🔄 Force full pull - clearing lastSyncTime');
      localStorage.removeItem('lastSyncTime');
      
      const serverData = await api.sync.pull(undefined);
      
      console.log('📥 Server data received:', {
        accounts: serverData.accounts?.length || 0,
        categories: serverData.categories?.length || 0,
        transactions: serverData.transactions?.length || 0,
      });

      let imported = 0;

      // Import all data using put() for upsert
      if (serverData.accounts?.length > 0) {
        for (const account of serverData.accounts) {
          await db.accounts.put({
            ...account,
            createdAt: new Date(account.createdAt),
          });
          imported++;
        }
      }

      if (serverData.categories?.length > 0) {
        for (const category of serverData.categories) {
          await db.categories.put(category);
          imported++;
        }
      }

      if (serverData.transactions?.length > 0) {
        for (const transaction of serverData.transactions) {
          await db.transactions.put({
            ...transaction,
            date: new Date(transaction.date),
            createdAt: new Date(transaction.createdAt),
          });
          imported++;
        }
      }

      if (serverData.budgets?.length > 0) {
        for (const budget of serverData.budgets) {
          await db.budgets.put(budget);
          imported++;
        }
      }

      if (serverData.recurringTransactions?.length > 0) {
        for (const recurring of serverData.recurringTransactions) {
          await db.recurringTransactions.put({
            ...recurring,
            startDate: new Date(recurring.startDate),
            endDate: recurring.endDate ? new Date(recurring.endDate) : undefined,
            lastProcessed: new Date(recurring.lastProcessed),
            createdAt: new Date(recurring.createdAt),
          });
          imported++;
        }
      }

      if (serverData.netWorthSnapshots?.length > 0) {
        for (const snapshot of serverData.netWorthSnapshots) {
          await db.netWorthSnapshots.put({
            ...snapshot,
            date: new Date(snapshot.date),
            createdAt: new Date(snapshot.createdAt),
          });
          imported++;
        }
      }

      const timestamp = serverData.timestamp || new Date().toISOString();
      localStorage.setItem('lastSyncTime', timestamp);
      setLastSync(timestamp);

      console.log('✅ Force pull completed:', { imported, timestamp });

      setSyncStatus({
        type: 'success',
        message: `✅ Force pulled ALL data: ${imported} items imported`,
      });
    } catch (error: any) {
      setSyncStatus({
        type: 'error',
        message: `❌ Force pull failed: ${error.message}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <RefreshCw className="w-5 h-5" />
        Sync with Server
      </h3>

      <div className="space-y-4">
        {/* Sync Status */}
        {syncStatus.type && (
          <div
            className={`p-3 rounded-lg flex items-start gap-2 ${
              syncStatus.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {syncStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{syncStatus.message}</p>
          </div>
        )}

        {/* Last Sync Time */}
        {lastSync && (
          <div className="text-sm text-gray-600">
            Last synced: {new Date(lastSync).toLocaleString()}
          </div>
        )}

        {/* Sync Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={handlePullFromServer}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>Pull</span>
          </button>

          <button
            onClick={handlePushToServer}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5" />
            <span>Push</span>
          </button>

          <button
            onClick={handleFullSync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Full Sync</span>
          </button>

          <button
            onClick={handleForceFullPull}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>Pull All</span>
          </button>
        </div>

        {/* Description */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
          <p><strong>Pull:</strong> Download changes from server</p>
          <p><strong>Push:</strong> Upload your local data to server</p>
          <p><strong>Full Sync:</strong> Pull first, then push</p>
          <p><strong>Pull All:</strong> Force download ALL data (use if sync not working)</p>
        </div>

        {/* Server Status */}
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500">
            Server: <code className="bg-gray-100 px-1 rounded">
              {window.location.hostname === 'localhost' 
                ? 'http://localhost:3005' 
                : `http://${window.location.hostname}:3005`}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
