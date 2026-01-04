import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';
import {
  formatCurrency,
  filterTransactionsByMonth
} from '../utils/finance';
import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';

export default function BudgetsView() {
  const { selectedMonth, setSelectedMonth } = useAppStore();

  const categories = useLiveQuery(
    () => db.categories.where('type').equals('expense').toArray(),
    []
  );

  const transactions = useLiveQuery(
    () => db.transactions.filter(t => t.isActive !== false).toArray(),
    []
  );

  if (!categories || !transactions) {
    return <div className="p-4">Loading...</div>;
  }

  const monthTransactions = filterTransactionsByMonth(transactions, selectedMonth);
  const expenseTransactions = monthTransactions.filter(t => t.type === 'expense');

  // Calculate spending per category
  const categorySpending = expenseTransactions.reduce((acc, t) => {
    if (!acc[t.categoryId]) {
      acc[t.categoryId] = 0;
    }
    acc[t.categoryId] += t.amount;
    return acc;
  }, {} as Record<number, number>);

  const handleUpdateBudget = async (categoryId: number, amount: number) => {
    await db.categories.update(categoryId, { monthlyBudget: amount });
  };

  const categoriesWithBudget = categories.map(category => ({
    ...category,
    spent: categorySpending[category.id!] || 0,
    budget: category.monthlyBudget || 0,
    percentage: category.monthlyBudget
      ? ((categorySpending[category.id!] || 0) / category.monthlyBudget) * 100
      : 0
  }));

  const totalBudget = categoriesWithBudget.reduce((sum, cat) => sum + cat.budget, 0);
  const totalSpent = categoriesWithBudget.reduce((sum, cat) => sum + cat.spent, 0);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">Budgets</h2>

      {/* Month selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-semibold">
            {format(selectedMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-600">Total Budget</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className={`text-2xl font-bold ${
              totalSpent > totalBudget ? 'text-red-600' : 'text-green-600'
            }`}>
              {formatCurrency(totalSpent)}
            </p>
          </div>
        </div>

        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full transition-all ${
              overallPercentage > 100 ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>

        <div className="flex justify-between mt-2 text-sm">
          <span className="text-gray-600">{overallPercentage.toFixed(0)}% used</span>
          <span className={`font-semibold ${
            totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(Math.abs(totalBudget - totalSpent))} {
              totalBudget - totalSpent >= 0 ? 'remaining' : 'over budget'
            }
          </span>
        </div>
      </div>

      {/* Category budgets */}
      <div className="space-y-4">
        {categoriesWithBudget.map((category) => (
          <CategoryBudgetCard
            key={category.id}
            category={category}
            onUpdateBudget={handleUpdateBudget}
          />
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No expense categories found</p>
        </div>
      )}
    </div>
  );
}

interface CategoryBudgetCardProps {
  category: {
    id?: number;
    name: string;
    color: string;
    spent: number;
    budget: number;
    percentage: number;
  };
  onUpdateBudget: (categoryId: number, amount: number) => void;
}

function CategoryBudgetCard({ category, onUpdateBudget }: CategoryBudgetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState(category.budget.toString());

  const handleSave = () => {
    const newBudget = parseFloat(budgetInput) || 0;
    onUpdateBudget(category.id!, newBudget);
    setIsEditing(false);
  };

  const remaining = category.budget - category.spent;
  const isOverBudget = remaining < 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: category.color }}
          >
            {category.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-semibold text-lg">{category.name}</h4>
            <p className="text-sm text-gray-600">
              {formatCurrency(category.spent)} of {formatCurrency(category.budget)}
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="w-32 px-3 py-1 border border-gray-300 rounded text-sm"
              placeholder="0.00"
            />
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setBudgetInput(category.budget.toString());
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Set Budget
          </button>
        )}
      </div>

      {category.budget > 0 && (
        <>
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className={`absolute top-0 left-0 h-full transition-all ${
                isOverBudget ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(category.percentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              {category.percentage.toFixed(0)}% used
            </span>
            <div className={`flex items-center gap-1 font-semibold ${
              isOverBudget ? 'text-red-600' : 'text-green-600'
            }`}>
              {isOverBudget ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              <span>
                {formatCurrency(Math.abs(remaining))} {isOverBudget ? 'over' : 'left'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}