import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';
import {
  formatCurrency,
  calculateTotal,
  groupTransactionsByCategory
} from '../utils/finance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { format, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

type DateRangePreset = 'week' | 'month' | '3months' | '6months' | 'year' | 'custom';

export default function Dashboard() {
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('month');
  const [customStartDate, setCustomStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const transactions = useLiveQuery(
    () => db.transactions.filter(t => t.isActive !== false).toArray(),
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

  // Calculate date range based on preset
  const getDateRange = () => {
    const now = new Date();
    switch (dateRangePreset) {
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) };
      case '3months':
        return { start: subMonths(now, 3), end: now };
      case '6months':
        return { start: subMonths(now, 6), end: now };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { start: new Date(customStartDate), end: new Date(customEndDate) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const dateRange = getDateRange();
  const monthTransactions = transactions.filter(t =>
    isWithinInterval(t.date, { start: dateRange.start, end: dateRange.end })
  );
  const income = calculateTotal(monthTransactions, 'income');
  const expenses = calculateTotal(monthTransactions, 'expense');
  const netCashFlow = income - expenses;

  const expensesByCategory = groupTransactionsByCategory(
    monthTransactions.filter(t => t.type === 'expense')
  );

  const chartData = Object.entries(expensesByCategory).map(([catId, amount]) => {
    const category = categories.find(c => c.id === Number(catId));
    return {
      name: category?.name || 'Unknown',
      value: amount,
      color: category?.color || '#64748b',
      icon: category?.icon
    };
  }).sort((a, b) => b.value - a.value);

  const totalBalance = accounts.reduce((sum, acc) => {
    const accTransactions = transactions.filter(t => t.accountId === acc.id);
    const transactionBalance = accTransactions.reduce((bal, t) => {
      return t.type === 'income' ? bal + t.amount : bal - t.amount;
    }, 0);
    // Add initial balance to transaction balance
    return sum + (acc.balance || 0) + transactionBalance;
  }, 0);

  // Format display text for current period
  const getPeriodDisplayText = () => {
    switch (dateRangePreset) {
      case 'week':
        return `Week of ${format(dateRange.start, 'MMM dd, yyyy')}`;
      case 'month':
        return format(selectedMonth, 'MMMM yyyy');
      case '3months':
        return 'Last 3 Months';
      case '6months':
        return 'Last 6 Months';
      case 'year':
        return format(dateRange.start, 'yyyy');
      case 'custom':
        return `${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd, yyyy')}`;
      default:
        return format(selectedMonth, 'MMMM yyyy');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Period
        </h2>
        
        {/* Preset Buttons */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          <button
            onClick={() => setDateRangePreset('week')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              dateRangePreset === 'week'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDateRangePreset('month')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              dateRangePreset === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateRangePreset('3months')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              dateRangePreset === '3months'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            3 Months
          </button>
          <button
            onClick={() => setDateRangePreset('6months')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              dateRangePreset === '6months'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            6 Months
          </button>
          <button
            onClick={() => setDateRangePreset('year')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              dateRangePreset === 'year'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Year
          </button>
          <button
            onClick={() => setDateRangePreset('custom')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              dateRangePreset === 'custom'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom Date Range Inputs */}
        {dateRangePreset === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        )}

        {/* Current Period Display */}
        <div className="flex items-center justify-center gap-3 pt-3 border-t">
          {dateRangePreset === 'month' && (
            <button
              onClick={() => useAppStore.setState({ selectedMonth: subMonths(selectedMonth, 1) })}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <p className="text-xl font-bold text-slate-900">
            {getPeriodDisplayText()}
          </p>
          {dateRangePreset === 'month' && (
            <button
              onClick={() => useAppStore.setState({ selectedMonth: subMonths(selectedMonth, -1) })}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Income</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(income)}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(expenses)}
              </p>
            </div>
            <TrendingDown className="w-12 h-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Net cash flow */}
      <div className={`rounded-lg shadow p-6 ${netCashFlow >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
        <p className="text-sm text-gray-700">Net Cash Flow</p>
        <p className={`text-3xl font-bold mt-1 ${netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {formatCurrency(netCashFlow)}
        </p>
      </div>

      {/* Spending by category chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {chartData.slice(0, 5).map((item) => {
              const Icon = item.icon ? (LucideIcons as any)[item.icon] : null;
              return (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: item.color }}
                    >
                      {Icon && <Icon className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        {monthTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions this month</p>
        ) : (
          <div className="space-y-3">
            {monthTransactions.slice(0, 5).map((transaction) => {
              const category = categories.find(c => c.id === transaction.categoryId);
              const Icon = category?.icon ? (LucideIcons as any)[category.icon] : null;
              return (
                <div key={transaction.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: category?.color || '#64748b' }}
                    >
                      {Icon ? <Icon className="w-5 h-5 text-white" /> : category?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.payee && <span className="font-medium">{transaction.payee} • </span>}
                        {category?.name}
                      </p>
                      {transaction.tags && transaction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {transaction.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}