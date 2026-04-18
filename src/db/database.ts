import Dexie, { Table } from 'dexie';

// Type definitions
export interface Account {
  id?: number;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment' | 'asset' | 'liability';
  balance: number;
  color: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Transaction {
  id?: number;
  accountId: number;
  date: Date;
  amount: number;
  description: string;
  categoryId: number;
  type: 'income' | 'expense' | 'transfer';
  toAccountId?: number; // For transfers: destination account
  payee?: string;
  tags?: string[];
  notes?: string;
  createdAt: Date;
  isActive?: boolean; // For soft deletes
}

export interface Category {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
  monthlyBudget?: number;
  parentCategoryId?: number | null;
  isActive: boolean;
}

export interface Budget {
  id?: number;
  categoryId: number;
  month: string; // Format: YYYY-MM
  amount: number;
  spent: number;
}

export interface RecurringTransaction {
  id?: number;
  accountId: number;
  amount: number;
  description: string;
  categoryId: number;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date; // Optional: null means it continues indefinitely
  lastProcessed?: Date; // Track when it was last generated
  payee?: string;
  tags?: string[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface NetWorthSnapshot {
  id?: number;
  date: Date;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  createdAt: Date;
}

// Database class
export class FinanceDB extends Dexie {
  accounts!: Table<Account>;
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  budgets!: Table<Budget>;
  recurringTransactions!: Table<RecurringTransaction>;
  netWorthSnapshots!: Table<NetWorthSnapshot>;

  constructor() {
    super('FinanceDB');

    this.version(1).stores({
      accounts: '++id, name, type, isActive',
      transactions: '++id, accountId, date, categoryId, type, payee',
      categories: '++id, name, type, parentCategoryId, isActive',
      budgets: '++id, categoryId, month',
    });

    this.version(2).stores({
      accounts: '++id, name, type, isActive',
      transactions: '++id, accountId, date, categoryId, type, payee',
      categories: '++id, name, type, parentCategoryId, isActive',
      budgets: '++id, categoryId, month',
      recurringTransactions: '++id, accountId, frequency, startDate, isActive'
    });

    this.version(3).stores({
      accounts: '++id, name, type, isActive',
      transactions: '++id, accountId, date, categoryId, type, payee',
      categories: '++id, name, type, parentCategoryId, isActive',
      budgets: '++id, categoryId, month',
      recurringTransactions: '++id, accountId, frequency, startDate, isActive',
      netWorthSnapshots: '++id, date'
    });

    this.version(4).stores({
      accounts: '++id, name, type, isActive',
      transactions: '++id, accountId, date, categoryId, type, payee, isActive',
      categories: '++id, name, type, parentCategoryId, isActive',
      budgets: '++id, categoryId, month',
      recurringTransactions: '++id, accountId, frequency, startDate, isActive',
      netWorthSnapshots: '++id, date'
    });
  }
}

export const db = new FinanceDB();

// Helper to check isActive across both boolean and integer formats
// This handles data that may have been synced from SQLite (integer 0/1)
// or created locally (boolean true/false)
export function isActive(value: boolean | number | undefined): boolean {
  if (value === undefined) return true; // default to active
  return value !== false && value !== 0;
}

// Reusable query helpers for active records
export const activeQueries = {
  accounts: () => db.accounts.filter(a => isActive(a.isActive as any)).toArray(),
  categories: (type?: string) => {
    if (type) {
      return db.categories.where('type').equals(type).and(c => isActive(c.isActive as any)).toArray();
    }
    return db.categories.filter(c => isActive(c.isActive as any)).toArray();
  },
  transactions: () => db.transactions.filter(t => isActive(t.isActive as any)).toArray(),
};

// Seed initial data
export async function seedInitialData() {
  const accountCount = await db.accounts.count();

  if (accountCount === 0) {
    // Default categories
    const defaultCategories: Omit<Category, 'id'>[] = [
      // Income categories
      { name: 'Salary', type: 'income', color: '#10b981', icon: 'Briefcase', isActive: true },
      { name: 'Freelance', type: 'income', color: '#14b8a6', icon: 'Wallet', isActive: true },
      { name: 'Investment', type: 'income', color: '#06b6d4', icon: 'TrendingUp', isActive: true },
      { name: 'Other Income', type: 'income', color: '#0ea5e9', icon: 'CircleDollarSign', isActive: true },

      // Expense categories
      { name: 'Groceries', type: 'expense', color: '#f59e0b', icon: 'ShoppingCart', isActive: true },
      { name: 'Dining Out', type: 'expense', color: '#ef4444', icon: 'Utensils', isActive: true },
      { name: 'Transportation', type: 'expense', color: '#8b5cf6', icon: 'Car', isActive: true },
      { name: 'Utilities', type: 'expense', color: '#6366f1', icon: 'Zap', isActive: true },
      { name: 'Rent/', type: 'expense', color: '#ec4899', icon: 'Home', isActive: true },
      { name: 'Entertainment', type: 'expense', color: '#f43f5e', icon: 'Tv', isActive: true },
      { name: 'Healthcare', type: 'expense', color: '#14b8a6', icon: 'Heart', isActive: true },
      { name: 'Shopping', type: 'expense', color: '#a855f7', icon: 'ShoppingBag', isActive: true },
      { name: 'Insurance', type: 'expense', color: '#3b82f6', icon: 'CreditCard', isActive: true },
      { name: 'Education', type: 'expense', color: '#06b6d4', icon: 'GraduationCap', isActive: true },
      { name: 'Other', type: 'expense', color: '#64748b', icon: 'Package', isActive: true },
    ];

    await db.categories.bulkAdd(defaultCategories);

    // Sample account
    await db.accounts.add({
      name: 'Main Checking',
      type: 'checking',
      balance: 0,
      color: '#0ea5e9',
      createdAt: new Date(),
      isActive: true
    });
  }
}