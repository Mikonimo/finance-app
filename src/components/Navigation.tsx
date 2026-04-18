import { useState } from 'react';
import { Home, CreditCard, ArrowLeftRight, PieChart, BarChart3, TrendingUp, Settings, MoreHorizontal, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import clsx from 'clsx';

export default function Navigation() {
  const { currentView, setCurrentView } = useAppStore();
  const [showMore, setShowMore] = useState(false);

  const primaryNavItems = [
    { id: 'dashboard' as const, icon: Home, label: 'Home' },
    { id: 'accounts' as const, icon: CreditCard, label: 'Accounts' },
    { id: 'transactions' as const, icon: ArrowLeftRight, label: 'Txns' },
    { id: 'budgets' as const, icon: PieChart, label: 'Budgets' },
  ];

  const moreNavItems = [
    { id: 'reports' as const, icon: BarChart3, label: 'Reports' },
    { id: 'networth' as const, icon: TrendingUp, label: 'Net Worth' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  const isMoreActive = moreNavItems.some(item => currentView === item.id);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-50">
      {/* More menu popup */}
      {showMore && (
        <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex justify-around py-2">
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setShowMore(false);
                  }}
                  className={clsx(
                    'flex flex-col items-center gap-1 py-3 px-4 flex-1 transition-colors',
                    active
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300'
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-around">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setShowMore(false);
              }}
              className={clsx(
                'flex flex-col items-center gap-1 py-3 px-4 flex-1 transition-colors',
                active
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setShowMore(!showMore)}
          className={clsx(
            'flex flex-col items-center gap-1 py-3 px-4 flex-1 transition-colors',
            isMoreActive || showMore
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300'
          )}
        >
          {showMore ? <X className="w-6 h-6" /> : <MoreHorizontal className="w-6 h-6" />}
          <span className="text-xs font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}