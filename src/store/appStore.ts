import { create } from 'zustand';

interface AppState {
  currentView: 'dashboard' | 'accounts' | 'transactions' | 'budgets' | 'reports' | 'networth' | 'settings';
  selectedMonth: Date;
  setCurrentView: (view: AppState['currentView']) => void;
  setSelectedMonth: (date: Date) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedMonth: new Date(),
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedMonth: (date) => set({ selectedMonth: date }),
}));