import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { seedInitialData } from './db/database';
import { processRecurringTransactions } from './utils/recurring';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import AccountsView from './components/AccountsView';
import TransactionsView from './components/TransactionsView';
import BudgetsView from './components/BudgetsView';
import SettingsView from './components/SettingsView';
import ReportsView from './components/ReportsView';
import NetWorthView from './components/NetWorthView';

function App() {
  const currentView = useAppStore((state) => state.currentView);

  useEffect(() => {
    seedInitialData();
    
    // Process recurring transactions on app load
    processRecurringTransactions();
    
    // Set up interval to check every hour
    const interval = setInterval(() => {
      processRecurringTransactions();
    }, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(interval);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <AccountsView />;
      case 'transactions':
        return <TransactionsView />;
      case 'budgets':
        return <BudgetsView />;
      case 'reports':
        return <ReportsView />;
      case 'networth':
        return <NetWorthView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-20 md:pb-4">
        {renderView()}
      </main>
      <Navigation />
    </div>
  );
}

export default App;