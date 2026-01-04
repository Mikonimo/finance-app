import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Account } from '../db/database';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/finance';
import Modal from './Modal';
import AccountForm from './AccountForm';

export default function AccountsView() {
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const accounts = useLiveQuery(
    () => db.accounts.filter(a => a.isActive === true || (a.isActive as any) === 1).toArray(),
    []
  );

  const transactions = useLiveQuery(
    () => db.transactions.filter(t => t.isActive !== false && (t.isActive as any) !== 0).toArray(),
    []
  );

  if (!accounts || !transactions) {
    return <div className="p-4">Loading...</div>;
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this account?')) {
      await db.accounts.update(id, { isActive: 0 as any });
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAccount(null);
  };

  const accountsWithBalances = accounts.map(account => {
    const accountTransactions = transactions.filter(t => 
      t.accountId === account.id || t.toAccountId === account.id
    );
    
    // Calculate balance including transfers
    let transactionBalance = 0;
    accountTransactions.forEach(t => {
      if (t.type === 'transfer') {
        // Money going out (from this account)
        if (t.accountId === account.id) {
          transactionBalance -= t.amount;
        }
        // Money coming in (to this account)
        if (t.toAccountId === account.id) {
          transactionBalance += t.amount;
        }
      } else {
        // Regular income/expense
        transactionBalance += t.type === 'income' ? t.amount : -t.amount;
      }
    });
    
    // Add initial balance to transaction-based balance
    const totalBalance = (account.balance || 0) + transactionBalance;
    return { ...account, balance: totalBalance };
  });

  const totalBalance = accountsWithBalances.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Accounts</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Account
        </button>
      </div>

      {/* Total balance card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-lg shadow-lg p-6 text-white">
        <p className="text-sm opacity-90">Total Balance</p>
        <p className="text-4xl font-bold mt-2">{formatCurrency(totalBalance)}</p>
      </div>

      {/* Accounts list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountsWithBalances.map((account) => (
          <div
            key={account.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: account.color }}
                >
                  {account.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg dark:text-white">{account.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{account.type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(account)}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(account.id!)}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t dark:border-gray-700">
              <p className="text-2xl font-bold dark:text-white">{formatCurrency(account.balance)}</p>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No accounts yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            Create your first account
          </button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingAccount ? 'Edit Account' : 'New Account'}>
        <AccountForm
          account={editingAccount}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
}