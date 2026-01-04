import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { TrendingUp, TrendingDown, Wallet, CreditCard, LineChart, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/finance';
import { calculateNetWorth, takeNetWorthSnapshot } from '../utils/networth';
import { format } from 'date-fns';

export default function NetWorthView() {
  const [calculating, setCalculating] = useState(false);
  const [currentNetWorth, setCurrentNetWorth] = useState<{
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  } | null>(null);

  const accounts = useLiveQuery(
    () => db.accounts.filter(a => a.isActive === true || (a.isActive as any) === 1).toArray(),
    []
  );

  const transactions = useLiveQuery(
    () => db.transactions.filter(t => t.isActive !== false && (t.isActive as any) !== 0).toArray(),
    []
  );

  const snapshots = useLiveQuery(
    () => db.netWorthSnapshots.orderBy('date').reverse().toArray(),
    []
  );

  // Calculate current net worth
  useLiveQuery(async () => {
    if (accounts && transactions) {
      const result = await calculateNetWorth();
      setCurrentNetWorth(result);
    }
  }, [accounts, transactions]);

  if (!accounts || !transactions || !snapshots || !currentNetWorth) {
    return <div className="p-4">Loading...</div>;
  }

  const handleTakeSnapshot = async () => {
    setCalculating(true);
    await takeNetWorthSnapshot();
    setCalculating(false);
  };

  // Categorize accounts
  const assetAccounts = accounts.filter(a => 
    ['checking', 'savings', 'cash', 'investment', 'asset'].includes(a.type)
  );
  const liabilityAccounts = accounts.filter(a => 
    ['credit', 'liability'].includes(a.type)
  );

  // Calculate account balances
  const getAccountBalance = (accountId: number) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;

    const accountTransactions = transactions.filter(t => 
      t.accountId === accountId || t.toAccountId === accountId
    );

    let transactionBalance = 0;
    accountTransactions.forEach(t => {
      if (t.type === 'transfer') {
        if (t.accountId === accountId) {
          transactionBalance -= t.amount;
        }
        if (t.toAccountId === accountId) {
          transactionBalance += t.amount;
        }
      } else {
        if (t.accountId === accountId) {
          transactionBalance += t.type === 'income' ? t.amount : -t.amount;
        }
      }
    });

    return (account.balance || 0) + transactionBalance;
  };

  // Calculate trend
  const previousSnapshot = snapshots[1];
  const netWorthChange = previousSnapshot 
    ? currentNetWorth.netWorth - previousSnapshot.netWorth 
    : 0;
  const netWorthChangePercent = previousSnapshot && previousSnapshot.netWorth !== 0
    ? (netWorthChange / Math.abs(previousSnapshot.netWorth)) * 100
    : 0;

  // Prepare chart data
  const chartData = snapshots.slice(0, 30).reverse();
  const maxValue = Math.max(...chartData.map(s => Math.abs(s.netWorth)), 1);
  const minValue = Math.min(...chartData.map(s => s.netWorth), 0);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Net Worth</h2>
        <button
          onClick={handleTakeSnapshot}
          disabled={calculating}
          className="flex items-center gap-2 bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${calculating ? 'animate-spin' : ''}`} />
          Take Snapshot
        </button>
      </div>

      {/* Current Net Worth Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center gap-2 mb-2">
          <LineChart className="w-6 h-6" />
          <h3 className="text-lg font-semibold opacity-90">Current Net Worth</h3>
        </div>
        <p className="text-4xl font-bold mb-4">{formatCurrency(currentNetWorth.netWorth)}</p>
        {previousSnapshot && (
          <div className="flex items-center gap-2">
            {netWorthChange >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            <span className="text-lg">
              {netWorthChange >= 0 ? '+' : ''}{formatCurrency(netWorthChange)}
              {' '}({netWorthChangePercent >= 0 ? '+' : ''}{netWorthChangePercent.toFixed(1)}%)
            </span>
            <span className="opacity-75">since last snapshot</span>
          </div>
        )}
      </div>

      {/* Assets & Liabilities Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold dark:text-white">Total Assets</h3>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(currentNetWorth.totalAssets)}
            </p>
          </div>
          <div className="space-y-2">
            {assetAccounts.map(account => {
              const balance = getAccountBalance(account.id!);
              return (
                <div key={account.id} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: account.color }}
                    />
                    <span className="text-sm dark:text-gray-200">{account.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">({account.type})</span>
                  </div>
                  <span className="text-sm font-semibold dark:text-gray-200">{formatCurrency(balance)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold dark:text-white">Total Liabilities</h3>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(currentNetWorth.totalLiabilities)}
            </p>
          </div>
          {liabilityAccounts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No liability accounts</p>
          ) : (
            <div className="space-y-2">
              {liabilityAccounts.map(account => {
                const balance = Math.abs(getAccountBalance(account.id!));
                return (
                  <div key={account.id} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: account.color }}
                      />
                      <span className="text-sm dark:text-gray-200">{account.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">({account.type})</span>
                    </div>
                    <span className="text-sm font-semibold dark:text-gray-200">{formatCurrency(balance)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Net Worth Trend Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Net Worth History</h3>
          <div className="h-64 flex items-end gap-1">
            {chartData.map((snapshot) => {
              const height = ((snapshot.netWorth - minValue) / (maxValue - minValue)) * 100;
              const isPositive = snapshot.netWorth >= 0;
              return (
                <div key={snapshot.id} className="flex-1 flex flex-col justify-end group relative">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isPositive ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {format(new Date(snapshot.date), 'MMM d, yyyy')}
                    <br />
                    {formatCurrency(snapshot.netWorth)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>{chartData.length > 0 ? format(new Date(chartData[0].date), 'MMM d') : ''}</span>
            <span>{chartData.length > 0 ? format(new Date(chartData[chartData.length - 1].date), 'MMM d') : ''}</span>
          </div>
        </div>
      )}

      {/* Snapshot History */}
      {snapshots.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Snapshot History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 px-4">Date</th>
                  <th className="text-right py-2 px-4">Assets</th>
                  <th className="text-right py-2 px-4">Liabilities</th>
                  <th className="text-right py-2 px-4">Net Worth</th>
                  <th className="text-right py-2 px-4">Change</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((snapshot, index) => {
                  const previousSnap = snapshots[index + 1];
                  const change = previousSnap ? snapshot.netWorth - previousSnap.netWorth : 0;
                  const changePercent = previousSnap && previousSnap.netWorth !== 0
                    ? (change / Math.abs(previousSnap.netWorth)) * 100
                    : 0;

                  return (
                    <tr key={snapshot.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 dark:text-gray-200">{format(new Date(snapshot.date), 'MMM d, yyyy')}</td>
                      <td className="text-right py-3 px-4 text-green-600 dark:text-green-400">
                        {formatCurrency(snapshot.totalAssets)}
                      </td>
                      <td className="text-right py-3 px-4 text-red-600 dark:text-red-400">
                        {formatCurrency(snapshot.totalLiabilities)}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold dark:text-gray-200">
                        {formatCurrency(snapshot.netWorth)}
                      </td>
                      <td className="text-right py-3 px-4">
                        {index < snapshots.length - 1 ? (
                          <span className={change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {change >= 0 ? '+' : ''}{formatCurrency(change)}
                            {' '}({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
