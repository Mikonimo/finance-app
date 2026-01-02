import { useState, useEffect } from 'react';
import { db, Category } from '../db/database';
import { CATEGORY_COLORS } from '../utils/finance';
import {
  ShoppingCart, Utensils, Car, Home, Zap, Heart, Plane, ShoppingBag,
  GraduationCap, Tv, Coffee, Gift, Smartphone, Book, Dumbbell, Shirt,
  DollarSign, Briefcase, TrendingUp, Coins, Wallet, PiggyBank, CircleDollarSign,
  Package, CreditCard, Fuel, Bus, Train, Pizza, Wine, Film, Music, Gamepad2
} from 'lucide-react';

const CATEGORY_ICONS = [
  { name: 'ShoppingCart', Icon: ShoppingCart, label: 'Shopping Cart' },
  { name: 'Utensils', Icon: Utensils, label: 'Dining' },
  { name: 'Car', Icon: Car, label: 'Car' },
  { name: 'Home', Icon: Home, label: 'Home' },
  { name: 'Zap', Icon: Zap, label: 'Utilities' },
  { name: 'Heart', Icon: Heart, label: 'Health' },
  { name: 'Plane', Icon: Plane, label: 'Travel' },
  { name: 'ShoppingBag', Icon: ShoppingBag, label: 'Shopping Bag' },
  { name: 'GraduationCap', Icon: GraduationCap, label: 'Education' },
  { name: 'Tv', Icon: Tv, label: 'Entertainment' },
  { name: 'Coffee', Icon: Coffee, label: 'Coffee' },
  { name: 'Gift', Icon: Gift, label: 'Gifts' },
  { name: 'Smartphone', Icon: Smartphone, label: 'Phone' },
  { name: 'Book', Icon: Book, label: 'Books' },
  { name: 'Dumbbell', Icon: Dumbbell, label: 'Fitness' },
  { name: 'Shirt', Icon: Shirt, label: 'Clothing' },
  { name: 'DollarSign', Icon: DollarSign, label: 'Money' },
  { name: 'Briefcase', Icon: Briefcase, label: 'Work' },
  { name: 'TrendingUp', Icon: TrendingUp, label: 'Investment' },
  { name: 'Coins', Icon: Coins, label: 'Coins' },
  { name: 'Wallet', Icon: Wallet, label: 'Wallet' },
  { name: 'PiggyBank', Icon: PiggyBank, label: 'Savings' },
  { name: 'CircleDollarSign', Icon: CircleDollarSign, label: 'Income' },
  { name: 'Package', Icon: Package, label: 'Package' },
  { name: 'CreditCard', Icon: CreditCard, label: 'Credit Card' },
  { name: 'Fuel', Icon: Fuel, label: 'Fuel' },
  { name: 'Bus', Icon: Bus, label: 'Bus' },
  { name: 'Train', Icon: Train, label: 'Train' },
  { name: 'Pizza', Icon: Pizza, label: 'Pizza' },
  { name: 'Wine', Icon: Wine, label: 'Drinks' },
  { name: 'Film', Icon: Film, label: 'Movies' },
  { name: 'Music', Icon: Music, label: 'Music' },
  { name: 'Gamepad2', Icon: Gamepad2, label: 'Gaming' },
];

interface CategoryFormProps {
  category: Category | null;
  onClose: () => void;
}

export default function CategoryForm({ category, onClose }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    type: category?.type || 'expense' as Category['type'],
    color: category?.color || CATEGORY_COLORS[0],
    monthlyBudget: category?.monthlyBudget || 0,
    parentCategoryId: category?.parentCategoryId || null,
    icon: category?.icon || 'ShoppingCart',
  });
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Load parent categories (top-level categories only, same type)
    const loadParentCategories = async () => {
      const categories = await db.categories
        .where('type').equals(formData.type)
        .and(cat => !cat.parentCategoryId && cat.id !== category?.id)
        .toArray();
      setParentCategories(categories);
    };
    loadParentCategories();
  }, [formData.type, category?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (category?.id) {
      await db.categories.update(category.id, formData);
    } else {
      await db.categories.add({
        ...formData,
        isActive: 1 as any,
      });
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="e.g., Groceries"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
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
            onClick={() => setFormData({ ...formData, type: 'income' })}
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
          Parent Category (optional)
        </label>
        <select
          value={formData.parentCategoryId || ''}
          onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value ? parseInt(e.target.value) : null })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">None (Top-level category)</option>
          {parentCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <p className="text-sm text-gray-500 mt-1">
          Select a parent to make this a subcategory
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Icon
        </label>
        <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
          {CATEGORY_ICONS.map(({ name, Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => setFormData({ ...formData, icon: name })}
              className={`p-3 rounded-lg transition-all hover:bg-gray-100 ${
                formData.icon === name ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-gray-50'
              }`}
              title={name}
            >
              <Icon className="w-5 h-5 mx-auto" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-10 h-10 rounded-full transition-transform ${
                formData.color === color ? 'ring-4 ring-offset-2 ring-primary-500 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {formData.type === 'expense' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Budget (optional)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.monthlyBudget || ''}
            onChange={(e) => setFormData({ ...formData, monthlyBudget: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      )}

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
          {category ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}