import { Home, CreditCard, ArrowLeftRight, PieChart, Settings } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import clsx from 'clsx';

export default function Navigation() {
  const { currentView, setCurrentView } = useAppStore();

  const navItems = [
    { id: 'dashboard' as const, icon: Home, label: 'Dashboard' },
    { id: 'accounts' as const, icon: CreditCard, label: 'Accounts' },
    { id: 'transactions' as const, icon: ArrowLeftRight, label: 'Transactions' },
    { id: 'budgets' as const, icon: PieChart, label: 'Budgets' },
    { id: 'settings' as const, icon: Settings, label: 'More' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={clsx(
                'flex flex-col items-center gap-1 py-3 px-4 flex-1 transition-colors',
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-primary-500'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}