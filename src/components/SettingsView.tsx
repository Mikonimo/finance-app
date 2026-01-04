import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Category, RecurringTransaction } from '../db/database';
import { Download, Upload, Plus, Edit2, Trash2, Info, Repeat, BarChart3, TrendingUp } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Modal from './Modal';
import CategoryForm from './CategoryForm';
import RecurringTransactionForm from './RecurringTransactionForm';
import SyncPanel from './SyncPanel';
import { formatCurrency } from '../utils/finance';
import { useAppStore } from '../store/appStore';

export default function SettingsView() {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const { setCurrentView } = useAppStore();

  const categories = useLiveQuery(
    () => db.categories.toArray(),
    []
  );

  const recurringTransactions = useLiveQuery(
    () => db.recurringTransactions.toArray(),
    []
  );

  const accounts = useLiveQuery(
    () => db.accounts.toArray(),
    []
  );

  if (!categories || !recurringTransactions || !accounts) {
    return <div className="p-4">Loading...</div>;
  }

  const handleExportData = async () => {
    try {
      const accounts = await db.accounts.toArray();
      const transactions = await db.transactions.toArray();
      const cats = await db.categories.toArray();

      const data = {
        accounts,
        transactions,
        categories: cats,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.accounts || !data.transactions || !data.categories) {
        throw new Error('Invalid backup file format');
      }

      const confirmImport = confirm(
        'This will replace all existing data. Are you sure you want to continue?'
      );

      if (!confirmImport) return;

      // Clear existing data
      await db.accounts.clear();
      await db.transactions.clear();
      await db.categories.clear();

      // Import new data
      await db.accounts.bulkAdd(data.accounts);
      await db.transactions.bulkAdd(data.transactions);
      await db.categories.bulkAdd(data.categories);

      alert('Data imported successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import data. Please check the file format.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const hasTransactions = await db.transactions.where('categoryId').equals(id).count();

    if (hasTransactions > 0) {
      if (!confirm(`This category has ${hasTransactions} transaction(s). Delete anyway?`)) {
        return;
      }
    }

    await db.categories.update(id, { isActive: 0 as any });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleCloseModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleEditRecurring = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring);
    setShowRecurringModal(true);
  };

  const handleDeleteRecurring = async (id: number) => {
    if (confirm('Delete this recurring transaction?')) {
      await db.recurringTransactions.delete(id);
    }
  };

  const handleToggleRecurring = async (id: number, isActive: boolean) => {
    await db.recurringTransactions.update(id, { isActive: !isActive });
  };

  const handleCloseRecurringModal = () => {
    setShowRecurringModal(false);
    setEditingRecurring(null);
  };

  const incomeCategories = categories.filter(c => c.type === 'income' && c.isActive && !c.parentCategoryId);
  const expenseCategories = categories.filter(c => c.type === 'expense' && c.isActive && !c.parentCategoryId);

  const getSubcategories = (parentId: number) => {
    return categories.filter(c => c.parentCategoryId === parentId && c.isActive);
  };

  const getCategoryIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  const renderCategory = (category: Category, isSubcategory = false) => (
    <div
      key={category.id}
      className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${
        isSubcategory ? 'ml-12 border-l-4' : ''
      }`}
      style={isSubcategory ? { borderLeftColor: category.color } : undefined}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: category.color }}
        >
          {getCategoryIcon(category.icon) || category.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium">{category.name}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleEditCategory(category)}
          className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteCategory(category.id!)}
          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* Quick Access */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCurrentView('reports')}
            className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <span className="font-medium">Reports</span>
          </button>
          <button
            onClick={() => setCurrentView('networth')}
            className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="font-medium">Net Worth</span>
          </button>
        </div>
      </div>

      {/* Sync Panel */}
      <SyncPanel />

      {/* Recurring Transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recurring Transactions</h3>
          <button
            onClick={() => setShowRecurringModal(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Recurring
          </button>
        </div>

        {recurringTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recurring transactions yet</p>
        ) : (
          <div className="space-y-2">
            {recurringTransactions.map((recurring) => {
              const category = categories.find(c => c.id === recurring.categoryId);
              const account = accounts.find(a => a.id === recurring.accountId);
              const Icon = category?.icon ? (LucideIcons as any)[category.icon] : null;
              
              return (
                <div
                  key={recurring.id}
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${
                    !recurring.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: category?.color || '#64748b' }}
                    >
                      {Icon ? <Icon className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{recurring.description}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          recurring.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {recurring.frequency}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {account?.name} • {category?.name} • {formatCurrency(recurring.amount)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => handleToggleRecurring(recurring.id!, recurring.isActive)}
                      className={`px-3 py-1 rounded text-sm ${
                        recurring.isActive 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {recurring.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      onClick={() => handleEditRecurring(recurring)}
                      className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecurring(recurring.id!)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Data Management</h3>

        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export All Data
          </button>

          <label className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary-600 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>

          <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              Export your data regularly to create backups. Import will replace all existing data.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Categories</h3>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </div>

        {/* Income Categories */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">Income Categories</h4>
          <div className="space-y-2">
            {incomeCategories.map((category) => (
              <div key={category.id}>
                {renderCategory(category)}
                {getSubcategories(category.id!).map(sub => (
                  <div key={sub.id} className="mt-2">
                    {renderCategory(sub, true)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Expense Categories */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Expense Categories</h4>
          <div className="space-y-2">
            {expenseCategories.map((category) => (
              <div key={category.id}>
                {renderCategory(category)}
                {getSubcategories(category.id!).map(sub => (
                  <div key={sub.id} className="mt-2">
                    {renderCategory(sub, true)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">About</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Storage:</strong> Local (IndexedDB)</p>
          <p><strong>Offline:</strong> Fully supported</p>
          <p className="pt-2">
            This is a Progressive Web App. All your financial data is stored locally on your device
            and never sent to any server.
          </p>
        </div>
      </div>

      <Modal
        isOpen={showCategoryModal}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'New Category'}
      >
        <CategoryForm
          category={editingCategory}
          onClose={handleCloseModal}
        />
      </Modal>

      <Modal
        isOpen={showRecurringModal}
        onClose={handleCloseRecurringModal}
        title={editingRecurring ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}
      >
        <RecurringTransactionForm
          recurringTransaction={editingRecurring}
          onSuccess={handleCloseRecurringModal}
        />
      </Modal>
    </div>
  );
}