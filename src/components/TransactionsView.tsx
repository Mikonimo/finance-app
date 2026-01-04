import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Transaction } from '../db/database';
import { Plus, Edit2, Trash2, Calendar, ArrowLeftRight, Search, Filter, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/finance';
import { format } from 'date-fns';
import Modal from './Modal';
import TransactionForm from './TransactionsForm';
import TransferForm from './TransferForm';

export default function TransactionsView() {
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const transactions = useLiveQuery(
    async () => {
      const all = await db.transactions.orderBy('date').reverse().toArray();
      return all.filter(t => t.isActive !== false);
    },
    []
  );

  const categories = useLiveQuery(
    () => db.categories.toArray(),
    []
  );

  const accounts = useLiveQuery(
    () => db.accounts.toArray(),
    []
  );

  if (!transactions || !categories || !accounts) {
    return <div className="p-4">Loading...</div>;
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await db.transactions.update(id, { isActive: false });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
  };

  // Get all unique tags from transactions
  const allTags = Array.from(
    new Set(transactions.flatMap(t => t.tags || []))
  ).sort();

  const filteredTransactions = transactions.filter(t => {
    // Only show active transactions (not deleted)
    if (t.isActive === false) return false;

    // Type filter
    if (filterType !== 'all' && t.type !== filterType) return false;

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = t.description.toLowerCase().includes(query);
      const matchesPayee = t.payee?.toLowerCase().includes(query);
      const matchesNotes = t.notes?.toLowerCase().includes(query);
      const matchesTags = t.tags?.some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesDescription && !matchesPayee && !matchesNotes && !matchesTags) {
        return false;
      }
    }

    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(t.categoryId)) {
      return false;
    }

    // Account filter
    if (selectedAccounts.length > 0) {
      const matchesAccount = selectedAccounts.includes(t.accountId);
      const matchesToAccount = t.toAccountId && selectedAccounts.includes(t.toAccountId);
      if (!matchesAccount && !matchesToAccount) return false;
    }

    // Amount filter
    if (amountMin && t.amount < parseFloat(amountMin)) return false;
    if (amountMax && t.amount > parseFloat(amountMax)) return false;

    // Date filter
    if (dateFrom && t.date < new Date(dateFrom)) return false;
    if (dateTo && t.date > new Date(dateTo)) return false;

    // Tags filter
    if (selectedTags.length > 0) {
      if (!t.tags || !selectedTags.some(tag => t.tags?.includes(tag))) {
        return false;
      }
    }

    return true;
  });

  const activeFilterCount = [
    searchQuery,
    selectedCategories.length > 0,
    selectedAccounts.length > 0,
    amountMin,
    amountMax,
    dateFrom,
    dateTo,
    selectedTags.length > 0
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedAccounts([]);
    setAmountMin('');
    setAmountMax('');
    setDateFrom('');
    setDateTo('');
    setSelectedTags([]);
    setFilterType('all');
  };

  // Group transactions by month
  const groupedTransactions = filteredTransactions.reduce((acc, t) => {
    const monthKey = format(t.date, 'MMMM yyyy');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-bold dark:text-white">Transactions</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border-2 border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400 px-4 py-3 min-h-12 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="hidden xs:inline">Transfer</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary-600 dark:bg-primary-500 text-white px-4 py-3 min-h-12 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 min-h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 min-h-12 rounded-lg border transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-primary-600 dark:bg-primary-500 text-white border-primary-600 dark:border-primary-500'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden xs:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center justify-center gap-2 px-4 py-3 min-h-12 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
                <span className="hidden xs:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="border-t dark:border-gray-700 pt-4 space-y-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.filter(c => c.isActive).map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      if (selectedCategories.includes(category.id!)) {
                        setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                      } else {
                        setSelectedCategories([...selectedCategories, category.id!]);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedCategories.includes(category.id!)
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedCategories.includes(category.id!) ? category.color : undefined
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Accounts</label>
              <div className="flex flex-wrap gap-2">
                {accounts.filter(a => a.isActive).map(account => (
                  <button
                    key={account.id}
                    onClick={() => {
                      if (selectedAccounts.includes(account.id!)) {
                        setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                      } else {
                        setSelectedAccounts([...selectedAccounts, account.id!]);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedAccounts.includes(account.id!)
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedAccounts.includes(account.id!) ? account.color : undefined
                    }}
                  >
                    {account.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount Range</label>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  className="flex-1 sm:w-32 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                <span className="text-gray-500 dark:text-gray-400 text-center sm:text-left">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  className="flex-1 sm:w-32 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <span className="text-gray-500 dark:text-gray-400 text-center sm:text-left">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Type Filter Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-3 min-h-12 rounded-lg transition-colors font-medium ${
              filterType === 'all'
                ? 'bg-primary-600 dark:bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-4 py-3 min-h-12 rounded-lg transition-colors font-medium ${
              filterType === 'income'
                ? 'bg-green-600 dark:bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-4 py-3 min-h-12 rounded-lg transition-colors font-medium ${
              filterType === 'expense'
                ? 'bg-red-600 dark:bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setFilterType('transfer')}
            className={`px-4 py-3 min-h-12 rounded-lg transition-colors font-medium ${
              filterType === 'transfer'
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Transfers
          </button>
        </div>
      </div>

      {/* Transactions list */}
      <div className="space-y-6">
        {Object.entries(groupedTransactions).map(([month, monthTransactions]) => (
          <div key={month} className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">{month}</h3>
              <span className="ml-auto text-sm text-gray-600 dark:text-gray-400">
                {monthTransactions.length} transaction{monthTransactions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="divide-y">
              {monthTransactions.map((transaction) => {
                const category = categories.find(c => c.id === transaction.categoryId);
                const account = accounts.find(a => a.id === transaction.accountId);
                const toAccount = transaction.toAccountId 
                  ? accounts.find(a => a.id === transaction.toAccountId)
                  : null;
                const Icon = category?.icon ? (LucideIcons as any)[category.icon] : null;
                const isTransfer = transaction.type === 'transfer';

                return (
                  <div
                    key={transaction.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              isTransfer ? 'bg-blue-600' : ''
                            }`}
                            style={!isTransfer ? { backgroundColor: category?.color || '#64748b' } : undefined}
                          >
                            {isTransfer ? (
                              <LucideIcons.ArrowLeftRight className="w-5 h-5" />
                            ) : Icon ? (
                              <Icon className="w-5 h-5" />
                            ) : (
                              category?.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold dark:text-gray-200">{transaction.description}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              {isTransfer ? (
                                <>
                                  <span>{account?.name}</span>
                                  <span>→</span>
                                  <span>{toAccount?.name}</span>
                                  <span>•</span>
                                </>
                              ) : (
                                <>
                                  {transaction.payee && (
                                    <>
                                      <span className="font-medium">{transaction.payee}</span>
                                      <span>•</span>
                                    </>
                                  )}
                                  <span>{category?.name}</span>
                                  <span>•</span>
                                  <span>{account?.name}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{formatDate(transaction.date)}</span>
                            </div>
                          </div>
                        </div>
                        {transaction.tags && transaction.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 ml-13 mt-2">
                            {transaction.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {transaction.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 ml-13 mt-1">{transaction.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <span className={`text-lg font-bold ${
                          transaction.type === 'income' 
                            ? 'text-green-600 dark:text-green-400' 
                            : transaction.type === 'transfer'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : transaction.type === 'transfer' ? '→' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                        <div className="flex gap-1">
                          {transaction.type !== 'transfer' && (
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="p-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(transaction.id!)}
                            className="p-3 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No transactions yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            Add your first transaction
          </button>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
      >
        <TransactionForm
          transaction={editingTransaction}
          onClose={handleCloseModal}
        />
      </Modal>

      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Between Accounts"
      >
        <TransferForm
          onClose={() => setShowTransferModal(false)}
        />
      </Modal>
    </div>
  );
}