import { Wallet, Home, CreditCard, ArrowLeftRight, PieChart, BarChart3, TrendingUp, Settings } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import clsx from 'clsx';

export default function Header() {
  const { currentView, setCurrentView } = useAppStore();

  const navItems = [
    { id: 'dashboard' as const, icon: Home, label: 'Dashboard' },
    { id: 'accounts' as const, icon: CreditCard, label: 'Accounts' },
    { id: 'transactions' as const, icon: ArrowLeftRight, label: 'Transactions' },
    { id: 'budgets' as const, icon: PieChart, label: 'Budgets' },
    { id: 'reports' as const, icon: BarChart3, label: 'Reports' },
    { id: 'networth' as const, icon: TrendingUp, label: 'Net Worth' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Finance Manager</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}