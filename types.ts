
export enum TransactionCategory {
  FOOD = 'Food & Dining',
  TRANSPORT = 'Transport',
  SHOPPING = 'Shopping',
  BILLS = 'Utilities & Bills',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health & Fitness',
  RENT = 'Rent & EMI',
  INCOME = 'Income',
  INVESTMENT = 'Investment',
  OTHER = 'Other'
}

export type TransactionType = 'DEBIT' | 'CREDIT';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  originalText?: string;
}

export interface Budget {
  category: TransactionCategory;
  limit: number;
}

export interface SpendingInsight {
  title: string;
  description: string;
  suggestion: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface DashboardStats {
  totalBalance: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  topCategory: TransactionCategory;
}
