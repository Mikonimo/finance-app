import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, isActive } from '../db/database';
import { toast } from './Toast';
import { format } from 'date-fns';

interface TransferFormProps {
  onClose: () => void;
}

export default function TransferForm({ onClose }: TransferFormProps) {
  const [formData, setFormData] = useState({
    fromAccountId: 0,
    toAccountId: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    description: 'Transfer',
    notes: '',
  });

  const accounts = useLiveQuery(
    () => db.accounts.filter(a => isActive(a.isActive as any)).toArray(),
    []
  );

  if (!accounts) {
    return <div>Loading...</div>;
  }

  // Set default accounts if not set
  useEffect(() => {
    if (formData.fromAccountId === 0 && accounts && accounts.length > 0) {
      setFormData(prev => ({ ...prev, fromAccountId: accounts[0].id! }));
    }
  }, [accounts, formData.fromAccountId]);

  useEffect(() => {
    if (formData.toAccountId === 0 && accounts && accounts.length > 1) {
      setFormData(prev => ({ ...prev, toAccountId: accounts[1].id! }));
    }
  }, [accounts, formData.toAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.amount <= 0) {
      toast.warning('Amount must be greater than 0');
      return;
    }

    if (formData.fromAccountId === 0 || formData.toAccountId === 0) {
      toast.warning('Please select both accounts');
      return;
    }

    if (formData.fromAccountId === formData.toAccountId) {
      toast.warning('Source and destination accounts must be different');
      return;
    }

    // Create transfer transaction
    await db.transactions.add({
      accountId: formData.fromAccountId,
      toAccountId: formData.toAccountId,
      date: new Date(formData.date),
      amount: formData.amount,
      description: formData.description,
      categoryId: 0, // Transfers don't have categories
      type: 'transfer',
      notes: formData.notes,
      createdAt: new Date(),
    });

    onClose();
  };

  const availableToAccounts = accounts.filter(a => a.id !== formData.fromAccountId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          From Account
        </label>
        <select
          value={formData.fromAccountId}
          onChange={(e) => setFormData({ ...formData, fromAccountId: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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

      <div className="flex justify-center">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          To Account
        </label>
        <select
          value={formData.toAccountId}
          onChange={(e) => setFormData({ ...formData, toAccountId: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          required
        >
          <option value={0}>Select account</option>
          {availableToAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Amount
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.amount || ''}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="0.00"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="e.g., Transfer to savings"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Additional notes..."
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Create Transfer
        </button>
      </div>
    </form>
  );
}
