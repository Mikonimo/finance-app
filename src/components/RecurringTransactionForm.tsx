import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, RecurringTransaction } from '../db/database';
import { format } from 'date-fns';

interface RecurringTransactionFormProps {
  recurringTransaction?: RecurringTransaction | null;
  onSuccess: () => void;
}

export default function RecurringTransactionForm({ recurringTransaction, onSuccess }: RecurringTransactionFormProps) {
  const [formData, setFormData] = useState({
    accountId: recurringTransaction?.accountId || 0,
    amount: recurringTransaction?.amount || 0,
    description: recurringTransaction?.description || '',
    categoryId: recurringTransaction?.categoryId || 0,
    type: recurringTransaction?.type || 'expense' as RecurringTransaction['type'],
    frequency: recurringTransaction?.frequency || 'monthly' as RecurringTransaction['frequency'],
    startDate: recurringTransaction?.startDate ? format(recurringTransaction.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endDate: recurringTransaction?.endDate ? format(recurringTransaction.endDate, 'yyyy-MM-dd') : '',
    payee: recurringTransaction?.payee || '',
    notes: recurringTransaction?.notes || '',
  });

  const accounts = useLiveQuery(
    () => db.accounts.where('isActive').equals(1).toArray(),
    []
  );

  const categories = useLiveQuery(
    () => db.categories.where('type').equals(formData.type).and(c => c.isActive === 1).toArray(),
    [formData.type]
  );

  if (!accounts || !categories) {
    return <div>Loading...</div>;
  }

  // Set default account and category if not set
  if (formData.accountId === 0 && accounts.length > 0) {
    setFormData({ ...formData, accountId: accounts[0].id! });
  }
  if (formData.categoryId === 0 && categories.length > 0) {
    setFormData({ ...formData, categoryId: categories[0].id! });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    if (formData.accountId === 0 || formData.categoryId === 0) {
      alert('Please select an account and category');
      return;
    }

    const recurringData = {
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      isActive: 1, // Set as integer for consistency
      createdAt: new Date(),
    };

    if (recurringTransaction?.id) {
      await db.recurringTransactions.update(recurringTransaction.id, recurringData);
    } else {
      await db.recurringTransactions.add(recurringData);
    }

    onSuccess();
  };

  const parentCategories = categories.filter(c => !c.parentCategoryId);
  const getSubcategories = (parentId: number) => {
    return categories.filter(c => c.parentCategoryId === parentId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense', categoryId: 0 })}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              formData.type === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income', categoryId: 0 })}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              formData.type === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.amount || ''}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0.00"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="e.g., Netflix subscription"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payee (optional)
        </label>
        <input
          type="text"
          value={formData.payee}
          onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="e.g., Netflix"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account
        </label>
        <select
          value={formData.accountId}
          onChange={(e) => setFormData({ ...formData, accountId: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        >
          <option value={0}>Select account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        >
          <option value={0}>Select category</option>
          {parentCategories.map((category) => {
            const subcategories = getSubcategories(category.id!);
            return (
              <optgroup key={category.id} label={category.name}>
                <option value={category.id}>{category.name}</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    &nbsp;&nbsp;→ {sub.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Frequency
        </label>
        <select
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurringTransaction['frequency'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date (optional)
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Additional notes..."
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onSuccess}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {recurringTransaction ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
