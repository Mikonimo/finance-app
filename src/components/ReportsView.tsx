import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Download, TrendingUp, PieChart, BarChart3, Calendar } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { formatCurrency } from '../utils/finance';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';

export default function ReportsView() {
  const [dateRange, setDateRange] = useState<'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'custom'>('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const transactions = useLiveQuery(
    () => db.transactions.filter(t => t.isActive !== 0).toArray(),
    []
  );

  const categories = useLiveQuery(
    () => db.categories.where('isActive').equals(1).toArray(),
    []
  );

  const accounts = useLiveQuery(
    () => db.accounts.where('isActive').equals(1).toArray(),
    []
  );

  if (!transactions || !categories || !accounts) {
    return <div className="p-4">Loading...</div>;
  }

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    switch (dateRange) {
      case 'this-month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'last-month':
        const lastMonth = subMonths(today, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last-3-months':
        return { start: subMonths(today, 3), end: today };
      case 'last-6-months':
        return { start: subMonths(today, 6), end: today };
      case 'this-year':
        return { start: startOfYear(today), end: endOfYear(today) };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : startOfMonth(today),
          end: customEndDate ? new Date(customEndDate) : endOfMonth(today)
        };
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  };

  const { start, end } = getDateRange();

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate >= start && txDate <= end && t.type !== 'transfer';
  });

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Category breakdown
  const categoryBreakdown = categories
    .filter(c => c.type === 'expense' && c.isActive)
    .map(category => {
      const categoryTransactions = filteredTransactions.filter(
        t => t.categoryId === category.id && t.type === 'expense'
      );
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const percentage = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
      return {
        ...category,
        total,
        percentage,
        count: categoryTransactions.length
      };
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const topCategories = categoryBreakdown.slice(0, 5);

  // Income category breakdown
  const incomeBreakdown = categories
    .filter(c => c.type === 'income' && c.isActive)
    .map(category => {
      const categoryTransactions = filteredTransactions.filter(
        t => t.categoryId === category.id && t.type === 'income'
      );
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const percentage = totalIncome > 0 ? (total / totalIncome) * 100 : 0;
      return {
        ...category,
        total,
        percentage,
        count: categoryTransactions.length
      };
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Account', 'Description', 'Payee', 'Amount', 'Tags', 'Notes'];
    const rows = filteredTransactions.map(t => {
      const category = categories.find(c => c.id === t.categoryId);
      const account = accounts.find(a => a.id === t.accountId);
      return [
        format(new Date(t.date), 'yyyy-MM-dd'),
        t.type,
        category?.name || '',
        account?.name || '',
        t.description,
        t.payee || '',
        t.amount.toFixed(2),
        t.tags?.join(', ') || '',
        t.notes || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(start, 'yyyy-MM-dd')}-to-${format(end, 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold">Date Range</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: 'this-month', label: 'This Month' },
            { value: 'last-month', label: 'Last Month' },
            { value: 'last-3-months', label: 'Last 3 Months' },
            { value: 'last-6-months', label: 'Last 6 Months' },
            { value: 'this-year', label: 'This Year' },
            { value: 'custom', label: 'Custom' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === option.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {dateRange === 'custom' && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        )}
        <p className="text-sm text-gray-600 mt-2">
          Showing data from {format(start, 'MMM d, yyyy')} to {format(end, 'MMM d, yyyy')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Income</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredTransactions.filter(t => t.type === 'income').length} transactions
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Expenses</span>
            <TrendingUp className="w-5 h-5 text-red-600 transform rotate-180" />
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredTransactions.filter(t => t.type === 'expense').length} transactions
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Net Savings</span>
            <BarChart3 className={`w-5 h-5 ${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <p className={`text-2xl font-bold ${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netSavings)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {netSavings >= 0 ? 'Surplus' : 'Deficit'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Savings Rate</span>
            <PieChart className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-2xl font-bold text-primary-600">{savingsRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">
            Of total income
          </p>
        </div>
      </div>

      {/* Top Expense Categories */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Expense Categories</h3>
        {topCategories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No expense data for this period</p>
        ) : (
          <div className="space-y-4">
            {topCategories.map(category => {
              const Icon = category.icon ? (LucideIcons as any)[category.icon] : null;
              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {Icon ? <Icon className="w-4 h-4" /> : null}
                      </div>
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-gray-500">({category.count} transactions)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(category.total)}</p>
                      <p className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Income Sources */}
      {incomeBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Income Sources</h3>
          <div className="space-y-4">
            {incomeBreakdown.map(category => {
              const Icon = category.icon ? (LucideIcons as any)[category.icon] : null;
              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {Icon ? <Icon className="w-4 h-4" /> : null}
                      </div>
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-gray-500">({category.count} transactions)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(category.total)}</p>
                      <p className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Categories Breakdown */}
      {categoryBreakdown.length > 5 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">All Expense Categories</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Category</th>
                  <th className="text-right py-2 px-4">Transactions</th>
                  <th className="text-right py-2 px-4">Total</th>
                  <th className="text-right py-2 px-4">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map(category => {
                  const Icon = category.icon ? (LucideIcons as any)[category.icon] : null;
                  return (
                    <tr key={category.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: category.color }}
                          >
                            {Icon ? <Icon className="w-3 h-3" /> : null}
                          </div>
                          <span>{category.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">{category.count}</td>
                      <td className="text-right py-3 px-4 font-semibold">{formatCurrency(category.total)}</td>
                      <td className="text-right py-3 px-4">{category.percentage.toFixed(1)}%</td>
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
