
import { Transaction, TransactionCategory } from './types';

export const CATEGORY_COLORS: Record<string, string> = {
  [TransactionCategory.FOOD]: '#ef4444',
  [TransactionCategory.TRANSPORT]: '#3b82f6',
  [TransactionCategory.SHOPPING]: '#f59e0b',
  [TransactionCategory.BILLS]: '#8b5cf6',
  [TransactionCategory.ENTERTAINMENT]: '#ec4899',
  [TransactionCategory.HEALTH]: '#10b981',
  [TransactionCategory.RENT]: '#64748b',
  [TransactionCategory.INCOME]: '#22c55e',
  [TransactionCategory.INVESTMENT]: '#06b6d4',
  [TransactionCategory.OTHER]: '#94a3b8'
};

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    date: '2023-10-01',
    description: 'Zomato Order',
    amount: 450,
    category: TransactionCategory.FOOD,
    type: 'DEBIT'
  },
  {
    id: '2',
    date: '2023-10-02',
    description: 'Petrol Fillup',
    amount: 1200,
    category: TransactionCategory.TRANSPORT,
    type: 'DEBIT'
  },
  {
    id: '3',
    date: '2023-10-05',
    description: 'Salary Credit',
    amount: 45000,
    category: TransactionCategory.INCOME,
    type: 'CREDIT'
  },
  {
    id: '4',
    date: '2023-10-07',
    description: 'Amazon Shopping',
    amount: 2500,
    category: TransactionCategory.SHOPPING,
    type: 'DEBIT'
  },
  {
    id: '5',
    date: '2023-10-10',
    description: 'Electricity Bill',
    amount: 1800,
    category: TransactionCategory.BILLS,
    type: 'DEBIT'
  }
];
