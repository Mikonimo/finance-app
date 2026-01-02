import { db } from '../db/database';
import { addDays, addWeeks, addMonths, addYears, isAfter, isBefore, startOfDay } from 'date-fns';

export async function processRecurringTransactions() {
  const today = startOfDay(new Date());
  
  // Get all active recurring transactions
  const recurringTransactions = await db.recurringTransactions
    .where('isActive').equals(1)
    .toArray();

  for (const recurring of recurringTransactions) {
    // Check if end date has passed
    if (recurring.endDate && isAfter(today, startOfDay(recurring.endDate))) {
      // Deactivate this recurring transaction
      await db.recurringTransactions.update(recurring.id!, { isActive: false });
      continue;
    }

    // Check if we need to generate a transaction
    const lastProcessed = recurring.lastProcessed 
      ? startOfDay(recurring.lastProcessed)
      : null;
    
    const startDate = startOfDay(recurring.startDate);
    
    // If never processed and start date is today or in the past, process it
    if (!lastProcessed && !isAfter(startDate, today)) {
      await generateTransaction(recurring, startDate);
      await db.recurringTransactions.update(recurring.id!, { 
        lastProcessed: startDate 
      });
      continue;
    }

    // If already processed, check if next occurrence is due
    if (lastProcessed) {
      let nextDate = getNextOccurrence(lastProcessed, recurring.frequency);
      
      // Generate all missed transactions up to today
      while (!isAfter(nextDate, today)) {
        // Check if within end date bounds
        if (!recurring.endDate || isBefore(nextDate, recurring.endDate) || nextDate.getTime() === startOfDay(recurring.endDate).getTime()) {
          await generateTransaction(recurring, nextDate);
          await db.recurringTransactions.update(recurring.id!, { 
            lastProcessed: nextDate 
          });
          nextDate = getNextOccurrence(nextDate, recurring.frequency);
        } else {
          break;
        }
      }
    }
  }
}

function getNextOccurrence(date: Date, frequency: string): Date {
  switch (frequency) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    case 'yearly':
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
}

async function generateTransaction(recurring: any, date: Date) {
  // Check if transaction already exists for this date
  const existing = await db.transactions
    .where('date').equals(date)
    .and(t => 
      t.accountId === recurring.accountId &&
      t.amount === recurring.amount &&
      t.description === recurring.description
    )
    .first();

  if (existing) {
    return; // Already generated
  }

  // Create the transaction
  await db.transactions.add({
    accountId: recurring.accountId,
    date: date,
    amount: recurring.amount,
    description: recurring.description,
    categoryId: recurring.categoryId,
    type: recurring.type,
    payee: recurring.payee,
    tags: recurring.tags,
    notes: recurring.notes,
    createdAt: new Date(),
  });
}
