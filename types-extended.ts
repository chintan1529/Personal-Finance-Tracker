import { Transaction, TransactionCategory, TransactionType, Budget } from './types';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  endDate?: string;
  isActive: boolean;
  count?: number;
  maxCount?: number;
}

export interface TransactionWithTags extends Transaction {
  tags: string[];
  notes?: string;
  attachments?: string[];
  isSplit?: boolean;
  splitDetails?: {
    originalAmount: number;
    splits: Array<{
      category: TransactionCategory;
      amount: number;
      description: string;
    }>;
  };
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  balance: number;
  currency: string;
  isActive: boolean;
  lastUpdated: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: TransactionCategory;
  isActive: boolean;
  createdAt: string;
  description?: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'monthly' | 'yearly' | 'custom' | 'tax' | 'category';
  startDate: string;
  endDate: string;
  data: any;
  generatedAt: string;
}

export interface BudgetAdvanced extends Budget {
  id: string;
  period: 'weekly' | 'monthly' | 'yearly';
  rollover: boolean;
  spent: number;
  remaining: number;
  percent: number;
  startDate: string;
  endDate: string;
  notifications: {
    warning: number; // percentage
    critical: number; // percentage
  };
}

export interface Notification {
  id: string;
  type: 'budget_warning' | 'budget_exceeded' | 'bill_reminder' | 'goal_achieved';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface UserPreferences {
  currency: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    budgetAlerts: boolean;
    billReminders: boolean;
  };
}

export interface ExportFormat {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  includeAttachments: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  categories: TransactionCategory[];
  accounts: string[];
}
