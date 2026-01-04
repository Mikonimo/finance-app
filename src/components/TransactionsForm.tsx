import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Transaction } from '../db/database';
import { format } from 'date-fns';

interface TransactionFormProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function TransactionForm({ transaction, onClose }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    accountId: transaction?.accountId || 0,
    date: transaction?.date ? format(transaction.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    amount: transaction?.amount || 0,
    description: transaction?.description || '',
    categoryId: transaction?.categoryId || 0,
    type: transaction?.type || 'expense' as Transaction['type'],
    payee: transaction?.payee || '',
    tags: transaction?.tags || [] as string[],
    notes: transaction?.notes || '',
  });
  const [payeeSuggestions, setPayeeSuggestions] = useState<string[]>([]);
  const [showPayeeSuggestions, setShowPayeeSuggestions] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const accounts = useLiveQuery(
    () => db.accounts.where('isActive').equals(1).toArray(),
    []
  );

  const categories = useLiveQuery(
    () => db.categories.where('type').equals(formData.type).and(c => c.isActive === 1).toArray(),
    [formData.type]
  );

  const allTransactions = useLiveQuery(
    () => db.transactions.toArray(),
    []
  );

  if (!accounts || !categories) {
    return <div>Loading...</div>;
  }

  // Get unique payees for autocomplete
  const uniquePayees = allTransactions
    ? Array.from(new Set(allTransactions.map(t => t.payee).filter(p => p)))
    : [];

  // Get unique tags for autocomplete
  const allTags = allTransactions
    ? allTransactions.flatMap(t => t.tags || [])
    : [];
  const uniqueTags = Array.from(new Set(allTags));

  const handlePayeeChange = (value: string) => {
    setFormData({ ...formData, payee: value });
    if (value.length > 0) {
      const filtered = uniquePayees.filter(p => 
        p && p.toLowerCase().includes(value.toLowerCase())
      ) as string[];
      setPayeeSuggestions(filtered);
      setShowPayeeSuggestions(filtered.length > 0);
    } else {
      setShowPayeeSuggestions(false);
    }
  };

  const handleTagInput = (value: string) => {
    setTagInput(value);
    if (value.length > 0) {
      const filtered = uniqueTags.filter(tag => 
        tag.toLowerCase().includes(value.toLowerCase()) &&
        !formData.tags.includes(tag)
      );
      setTagSuggestions(filtered);
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setShowTagSuggestions(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ 
      ...formData, 
      tags: formData.tags.filter(tag => tag !== tagToRemove) 
    });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      removeTag(formData.tags[formData.tags.length - 1]);
    }
  };

  // Group categories: parent categories and their subcategories
  const parentCategories = categories.filter(c => !c.parentCategoryId);
  const getSubcategories = (parentId: number) => {
    return categories.filter(c => c.parentCategoryId === parentId);
  };

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

    const transactionData = {
      ...formData,
      date: new Date(formData.date),
      createdAt: new Date(),
      isActive: 1, // Set as integer for consistency
    };

    if (transaction?.id) {
      await db.transactions.update(transaction.id, transactionData);
    } else {
      await db.transactions.add(transactionData);
    }

    onClose();
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
          placeholder="e.g., Grocery shopping"
          required
        />
      </div>

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payee (optional)
        </label>
        <input
          type="text"
          value={formData.payee}
          onChange={(e) => handlePayeeChange(e.target.value)}
          onFocus={() => {
            if (formData.payee && payeeSuggestions.length > 0) {
              setShowPayeeSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay to allow clicking on suggestions
            setTimeout(() => setShowPayeeSuggestions(false), 200);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="e.g., Walmart, Starbucks"
        />
        {showPayeeSuggestions && payeeSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {payeeSuggestions.slice(0, 5).map((payee, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, payee });
                  setShowPayeeSuggestions(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
              >
                {payee}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
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

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags (optional)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => handleTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onFocus={() => {
            if (tagInput && tagSuggestions.length > 0) {
              setShowTagSuggestions(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setShowTagSuggestions(false), 200);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Type and press Enter to add tags"
        />
        {showTagSuggestions && tagSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {tagSuggestions.slice(0, 8).map((tag, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addTag(tag)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Press Enter to add, Backspace to remove last tag
        </p>
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
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {transaction ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}