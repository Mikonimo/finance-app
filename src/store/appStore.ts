import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'dark'; // default
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', mode === 'dark');
  }
  localStorage.setItem('theme', mode);
}

interface AppState {
  currentView: 'dashboard' | 'accounts' | 'transactions' | 'budgets' | 'reports' | 'networth' | 'settings';
  selectedMonth: Date;
  theme: ThemeMode;
  setCurrentView: (view: AppState['currentView']) => void;
  setSelectedMonth: (date: Date) => void;
  setTheme: (mode: ThemeMode) => void;
}

// Apply initial theme immediately
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedMonth: new Date(),
  theme: initialTheme,
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedMonth: (date) => set({ selectedMonth: date }),
  setTheme: (mode) => {
    applyTheme(mode);
    set({ theme: mode });
  },
}));

// Listen for system theme changes when in 'system' mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const state = useAppStore.getState();
  if (state.theme === 'system') {
    applyTheme('system');
  }
});