import { db, Account } from '../db/database';
import { startOfDay } from 'date-fns';

export const calculateNetWorth = async () => {
  const accounts = await db.accounts.filter(a => a.isActive).toArray();
  const transactions = await db.transactions.filter(t => t.isActive !== false).toArray();

  let totalAssets = 0;
  let totalLiabilities = 0;

  accounts.forEach(account => {
    // Calculate current balance including transactions
    const accountTransactions = transactions.filter(t => 
      t.accountId === account.id || t.toAccountId === account.id
    );

    let transactionBalance = 0;
    accountTransactions.forEach(t => {
      if (t.type === 'transfer') {
        if (t.accountId === account.id) {
          transactionBalance -= t.amount; // Outgoing transfer
        }
        if (t.toAccountId === account.id) {
          transactionBalance += t.amount; // Incoming transfer
        }
      } else {
        if (t.accountId === account.id) {
          transactionBalance += t.type === 'income' ? t.amount : -t.amount;
        }
      }
    });

    const currentBalance = (account.balance || 0) + transactionBalance;

    // Categorize by account type
    const assetTypes: Account['type'][] = ['checking', 'savings', 'cash', 'investment', 'asset'];
    const liabilityTypes: Account['type'][] = ['credit', 'liability'];

    if (assetTypes.includes(account.type)) {
      totalAssets += currentBalance;
    } else if (liabilityTypes.includes(account.type)) {
      // Liabilities are stored as positive numbers, so we add them
      totalLiabilities += Math.abs(currentBalance);
    }
  });

  const netWorth = totalAssets - totalLiabilities;

  return {
    totalAssets,
    totalLiabilities,
    netWorth
  };
};

export const takeNetWorthSnapshot = async () => {
  const { totalAssets, totalLiabilities, netWorth } = await calculateNetWorth();
  
  const today = startOfDay(new Date());
  
  // Check if snapshot already exists for today
  const existingSnapshot = await db.netWorthSnapshots
    .where('date')
    .equals(today)
    .first();

  if (existingSnapshot) {
    // Update existing snapshot
    await db.netWorthSnapshots.update(existingSnapshot.id!, {
      totalAssets,
      totalLiabilities,
      netWorth
    });
  } else {
    // Create new snapshot
    await db.netWorthSnapshots.add({
      date: today,
      totalAssets,
      totalLiabilities,
      netWorth,
      createdAt: new Date()
    });
  }
};
