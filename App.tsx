import React, { useState, useEffect, useMemo, useRef } from 'react';
import './styles.css';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction, SpendingInsight, DashboardStats, TransactionCategory, Budget } from './types';
import { Goal, RecurringTransaction } from './types-extended';
import { SAMPLE_TRANSACTIONS } from './constants';
import { categorizeTransactions, getFinancialAdvice } from './services/geminiService';
import { Card } from './components/Card';
import { TransactionTable } from './components/TransactionTable';
import { TransactionTableAdvanced } from './components/TransactionTableAdvanced';
import { TransactionEditModal } from './components/TransactionEditModal';
import { CategoryChart } from './components/CategoryChart';
import { BudgetManager } from './components/BudgetManager';
import { GoalTracker } from './components/GoalTracker';
import { RecurringTransactionManager } from './components/RecurringTransactionManager';
import { ReportGenerator } from './components/ReportGenerator';
import { DataExportImport } from './components/DataExportImport';

type ActiveTab = 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'recurring' | 'reports' | 'settings';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: 'budgets',
    label: 'Budgets',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    id: 'recurring',
    label: 'Recurring',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ----------------------------------------------------------------
// StatCard — inline component (Task 3.1)
// ----------------------------------------------------------------
const formatINR = (value: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

interface StatCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  accent?: 'primary' | 'success' | 'danger' | 'neutral';
  trend?: string;
  asText?: boolean; // render value as plain text instead of currency
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accent, trend, asText }) => {
  const accentClass = accent && accent !== 'neutral' ? ` card--accent-${accent}` : '';
  return (
    <div className={`card${accentClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            {label}
          </p>
          <p className="text-2xl font-bold mt-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
            {asText ? String(value) : formatINR(value)}
          </p>
          {trend && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{trend}</p>
          )}
        </div>
        {icon && (
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{
              width: 40,
              height: 40,
              backgroundColor: accent === 'primary' ? 'var(--color-primary-light)'
                : accent === 'success' ? 'var(--color-success-light)'
                : accent === 'danger' ? 'var(--color-danger-light)'
                : 'var(--color-surface)',
              color: accent === 'primary' ? 'var(--color-primary)'
                : accent === 'success' ? 'var(--color-success)'
                : accent === 'danger' ? 'var(--color-danger)'
                : 'var(--color-text-secondary)',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------
// TopCategoryCard — renders top spending category as text (Task 3.2/3.3)
// ----------------------------------------------------------------
interface TopCategoryCardProps {
  label: string;
  category: string;
  icon?: React.ReactNode;
}

const TopCategoryCard: React.FC<TopCategoryCardProps> = ({ label, category, icon }) => (
  <div className="card">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        <p className="text-xl font-bold mt-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
          {category}
        </p>
      </div>
      {icon && (
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{ width: 40, height: 40, backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
        >
          {icon}
        </div>
      )}
    </div>
  </div>
);

const App: React.FC = () => {
  // --- Tab state ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Data state ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([
    { category: TransactionCategory.FOOD, limit: 5000 },
    { category: TransactionCategory.SHOPPING, limit: 3000 },
  ]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  // --- UI state ---
  const [isImporting, setIsImporting] = useState(false);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [rawInput, setRawInput] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------------------
  // Task 2.5 — localStorage persistence
  // ----------------------------------------------------------------
  useEffect(() => {
    try {
      const savedTransactions = localStorage.getItem('upi_transactions');
      const savedBudgets = localStorage.getItem('upi_budgets');
      const savedGoals = localStorage.getItem('upi_goals');
      const savedRecurring = localStorage.getItem('upi_recurring');

      setTransactions(savedTransactions ? JSON.parse(savedTransactions) : SAMPLE_TRANSACTIONS);
      if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
      if (savedGoals) setGoals(JSON.parse(savedGoals));
      if (savedRecurring) setRecurringTransactions(JSON.parse(savedRecurring));
    } catch {
      setTransactions(SAMPLE_TRANSACTIONS);
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('upi_transactions', JSON.stringify(transactions)); } catch (e) { console.error(e); }
  }, [transactions]);

  useEffect(() => {
    try { localStorage.setItem('upi_budgets', JSON.stringify(budgets)); } catch (e) { console.error(e); }
  }, [budgets]);

  useEffect(() => {
    try { localStorage.setItem('upi_goals', JSON.stringify(goals)); } catch (e) { console.error(e); }
  }, [goals]);

  useEffect(() => {
    try { localStorage.setItem('upi_recurring', JSON.stringify(recurringTransactions)); } catch (e) { console.error(e); }
  }, [recurringTransactions]);

  // ----------------------------------------------------------------
  // Task 2.6 — Transaction handlers
  // ----------------------------------------------------------------
  const handleSaveTransaction = (transaction: Transaction) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(tx => tx.id === transaction.id ? transaction : tx));
    } else {
      setTransactions(prev => [transaction, ...prev]);
    }
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    }
  };

  const processImport = async (text?: string, image?: { data: string; mimeType: string }) => {
    if (!text?.trim() && !image) return;
    setIsImporting(true);
    try {
      const newTxs = await categorizeTransactions(text, image);
      if (newTxs.length === 0) {
        alert('No transactions were found in the provided data. Please check the format and try again.');
        return;
      }
      setTransactions(prev => [...newTxs, ...prev]);
      setRawInput('');
      setShowImportModal(false);
    } catch (error) {
      console.error('Failed to categorize:', error);
      alert(error instanceof Error ? error.message : 'Something went wrong while processing. Please check your data format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

    const allowedTypes = ['text/csv', 'text/plain', 'application/json', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      alert('Unsupported file type. Please upload CSV, TXT, JSON, or image files.');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onload = async (event) => {
      const content = event.target?.result;
      if (content) {
        try {
          if (isImage) {
            const base64Data = (content as string).split(',')[1];
            await processImport(undefined, { data: base64Data, mimeType: file.type });
          } else {
            await processImport(content as string);
          }
        } catch (error) {
          console.error('File processing error:', error);
          alert('Failed to process the uploaded file. Please check the file format and try again.');
        }
      }
    };

    reader.onerror = () => alert('Failed to read the uploaded file. Please try again.');

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleImportTransactions = (imported: Transaction[]) => {
    setTransactions(prev => [...imported, ...prev]);
  };

  // ----------------------------------------------------------------
  // Task 2.7 — Budget alert computation
  // ----------------------------------------------------------------
  const budgetStatus = useMemo(() => {
    const spent = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return budgets.map(b => {
      const s = spent[b.category] || 0;
      const percent = (s / b.limit) * 100;
      return { ...b, spent: s, percent };
    });
  }, [transactions, budgets]);

  const activeAlerts = useMemo(() => {
    return budgetStatus
      .filter(s => s.percent >= 80)
      .map(s => ({
        category: s.category,
        percent: s.percent,
        type: s.percent >= 100 ? 'critical' : 'warning',
        message:
          s.percent >= 100
            ? `Over Budget! You've spent ₹${s.spent.toLocaleString('en-IN')} / ₹${s.limit.toLocaleString('en-IN')}`
            : `Budget Warning! You've reached ${Math.round(s.percent)}% of your limit.`,
      }));
  }, [budgetStatus]);

  // ----------------------------------------------------------------
  // Task 2.8 — Gemini AI insights
  // ----------------------------------------------------------------
  const handleGenerateAdvice = async () => {
    if (transactions.length === 0) {
      alert('No transactions available for analysis. Please import some transactions first.');
      return;
    }
    setIsGeneratingAdvice(true);
    try {
      const advice = await getFinancialAdvice(transactions);
      if (advice.length === 0) {
        alert('No insights could be generated from the current transactions.');
        return;
      }
      setInsights(advice);
    } catch (error) {
      console.error('Failed to get advice:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate financial insights. Please try again.');
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  // ----------------------------------------------------------------
  // Dashboard stats
  // ----------------------------------------------------------------
  const stats: DashboardStats = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
    const income = transactions.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);

    const categoryCounts = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    let topCat = TransactionCategory.OTHER;
    let maxAmt = 0;
    (Object.entries(categoryCounts) as [string, number][]).forEach(([cat, amt]) => {
      if (amt > maxAmt) { maxAmt = amt; topCat = cat as TransactionCategory; }
    });

    return { totalBalance: income - expenses, monthlyExpenses: expenses, monthlyIncome: income, topCategory: topCat };
  }, [transactions]);

  // ----------------------------------------------------------------
  // Task 3.4 — Spending trend data (daily DEBIT totals)
  // ----------------------------------------------------------------
  const spendingTrendData = useMemo(() => {
    const byDate: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'DEBIT')
      .forEach(t => {
        byDate[t.date] = (byDate[t.date] || 0) + t.amount;
      });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));
  }, [transactions]);

  // ----------------------------------------------------------------
  // Task 3.5 — Income vs expenses data (grouped by month)
  // ----------------------------------------------------------------
  const incomeVsExpenseData = useMemo(() => {
    const byMonth: Record<string, { month: string; income: number; expenses: number }> = {};
    transactions.forEach(t => {
      const month = t.date.slice(0, 7); // YYYY-MM
      if (!byMonth[month]) byMonth[month] = { month, income: 0, expenses: 0 };
      if (t.type === 'CREDIT') byMonth[month].income += t.amount;
      else byMonth[month].expenses += t.amount;
    });
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* ---- Task 2.2: Sticky Header ---- */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6"
        style={{
          height: '64px',
          backgroundColor: 'var(--color-surface-raised)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          {/* Task 2.2: hamburger button — mobile only via .hamburger-btn */}
          <button
            className="hamburger-btn btn-secondary"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 36, height: 36, backgroundColor: 'var(--color-primary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m.599-1c.53-.1 1.054-.253 1.565-.453M11.401 16c-.51-.1-1.034-.253-1.565-.453M12 5c4.418 0 8 2.239 8 5 0 2.761-3.582 5-8 5s-8-2.239-8-5c0-2.761 3.582-5 8-5z" />
            </svg>
          </div>

          <span
            className="font-bold hidden sm:block"
            style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}
          >
            UPI Expense Intelligence
          </span>
        </div>

        {/* Primary action */}
        <button
          className="btn-primary"
          onClick={() => setShowImportModal(true)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Transaction</span>
        </button>
      </header>

      {/* ---- Task 2.3: Sidebar (fixed desktop / off-canvas mobile) ---- */}
      {/* Desktop sidebar — always visible at ≥1024px */}
      <nav
        className="sidebar sidebar-desktop"
        style={{ position: 'fixed', top: 64, left: 0, height: 'calc(100vh - 64px)', zIndex: 30 }}
      >
        <div className="p-4 flex flex-col gap-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-item${activeTab === item.id ? ' active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgb(15 23 42 / 0.5)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <nav
        className="sidebar sidebar-mobile"
        style={{
          position: 'fixed',
          top: 64,
          left: 0,
          height: 'calc(100vh - 64px)',
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="p-4 flex flex-col gap-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-item${activeTab === item.id ? ' active' : ''}`}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ---- Task 2.4: Main content area ---- */}
      <main className="main-with-sidebar" style={{ paddingTop: '2rem', minHeight: 'calc(100vh - 64px)' }}>
        <div className="px-4 sm:px-6 lg:px-8 pb-12">

          {/* ---- Dashboard tab ---- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-slide-in-up">

              {/* Task 2.7: Budget alert banners */}
              {activeAlerts.length > 0 && (
                <div className="flex flex-col gap-2">
                  {activeAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-4 rounded-xl border"
                      style={{
                        backgroundColor: alert.type === 'critical' ? 'var(--color-danger-light)' : 'var(--color-warning-light)',
                        borderColor: alert.type === 'critical' ? 'var(--color-danger-border)' : 'var(--color-warning-border)',
                        color: alert.type === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)',
                      }}
                    >
                      {alert.type === 'critical' ? (
                        <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-sm">
                        <strong>{alert.category}: </strong>{alert.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats grid — Task 3.1/3.2/3.3 StatCards */}
              <div className="stats-grid">
                <StatCard
                  label="Total Balance"
                  value={stats.totalBalance}
                  accent="primary"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Monthly Expenses"
                  value={stats.monthlyExpenses}
                  accent="danger"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  }
                />
                <StatCard
                  label="Monthly Income"
                  value={stats.monthlyIncome}
                  accent="success"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  }
                />
                <TopCategoryCard
                  label="Top Spending Category"
                  category={stats.topCategory}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  }
                />
              </div>

              {/* Charts — Tasks 3.4, 3.5, 3.6 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Task 3.4: Spending Trend AreaChart (2/3 width on desktop) */}
                <div className="lg:col-span-2">
                  <Card title="Spending Trend" subtitle="Daily expense totals">
                    {transactions.length > 0 ? (
                      <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={spendingTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                              formatter={(value: number | undefined) => [new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value ?? 0), 'Expenses']}
                              contentStyle={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 12 }}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#dc2626" strokeWidth={2} fill="url(#expenseGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48" style={{ color: 'var(--color-text-muted)' }}>
                        <span className="text-sm">No transaction data yet</span>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Task 3.6: Category Distribution (1/3 width on desktop) */}
                <div>
                  <Card title="Category Distribution" subtitle="Expense breakdown">
                    <CategoryChart transactions={transactions} />
                  </Card>
                </div>
              </div>

              {/* Task 3.5: Income vs Expenses LineChart */}
              <div>
                <Card title="Income vs Expenses" subtitle="Monthly comparison">
                  {transactions.length > 0 ? (
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={incomeVsExpenseData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={(value: number | undefined, name: string | undefined) => [new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value ?? 0), name === 'income' ? 'Income' : 'Expenses']}
                            contentStyle={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 12 }}
                          />
                          <Legend formatter={(value) => value === 'income' ? 'Income' : 'Expenses'} />
                          <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="text-sm">No transaction data yet</span>
                    </div>
                  )}
                </Card>
              </div>

              {/* Task 2.8: Gemini AI insights panel */}
              <Card title="Gemini AI Insights" subtitle="AI-driven financial analysis">
                <div className="mt-4">
                  <button
                    className="btn-primary"
                    onClick={handleGenerateAdvice}
                    disabled={isGeneratingAdvice}
                  >
                    {isGeneratingAdvice ? 'Generating...' : 'Generate Insights'}
                  </button>
                  {insights.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3">
                      {insights.map((insight, idx) => (
                        <div key={idx} className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{insight.title}</p>
                            <span
                              className={`badge ${insight.impact === 'High' ? 'badge--danger' : insight.impact === 'Medium' ? 'badge--warning' : 'badge--neutral'}`}
                            >
                              {insight.impact}
                            </span>
                          </div>
                          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{insight.description}</p>
                          <p className="text-sm mt-2 font-medium" style={{ color: 'var(--color-primary)' }}>💡 {insight.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Recent transactions */}
              <Card title="Recent Transactions" subtitle="Last 10 transactions">
                <TransactionTable transactions={transactions.slice(0, 10)} />
              </Card>
            </div>
          )}

          {/* ---- Transactions tab ---- */}
          {activeTab === 'transactions' && (
            <div className="animate-slide-in-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Transactions</h2>
                <button
                  className="btn-primary"
                  onClick={() => { setEditingTransaction(null); setShowTransactionModal(true); }}
                >
                  + New Transaction
                </button>
              </div>
              <TransactionTableAdvanced
                transactions={transactions}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            </div>
          )}

          {/* ---- Budgets tab ---- */}
          {activeTab === 'budgets' && (
            <div className="animate-slide-in-up">
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Budgets</h2>
              <BudgetManager
                budgets={budgets}
                transactions={transactions}
                onUpdateBudget={() => {}}
                onDeleteBudget={() => {}}
              />
            </div>
          )}

          {/* ---- Goals tab ---- */}
          {activeTab === 'goals' && (
            <div className="animate-slide-in-up">
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Savings Goals</h2>
              <GoalTracker
                goals={goals}
                transactions={transactions}
                onAddGoal={(g) => setGoals(prev => [...prev, g])}
                onUpdateGoal={(g) => setGoals(prev => prev.map(x => x.id === g.id ? g : x))}
                onDeleteGoal={(id) => setGoals(prev => prev.filter(x => x.id !== id))}
              />
            </div>
          )}

          {/* ---- Recurring tab ---- */}
          {activeTab === 'recurring' && (
            <div className="animate-slide-in-up">
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Recurring Transactions</h2>
              <RecurringTransactionManager
                recurringTransactions={recurringTransactions}
                onAddRecurring={(r) => setRecurringTransactions(prev => [...prev, r])}
                onUpdateRecurring={(r) => setRecurringTransactions(prev => prev.map(x => x.id === r.id ? r : x))}
                onDeleteRecurring={(id) => setRecurringTransactions(prev => prev.filter(x => x.id !== id))}
                onGenerateTransactions={(txs) => setTransactions(prev => [...txs, ...prev])}
              />
            </div>
          )}

          {/* ---- Reports tab ---- */}
          {activeTab === 'reports' && (
            <div className="animate-slide-in-up">
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Reports</h2>
              <ReportGenerator
                transactions={transactions}
                onGenerateReport={() => {}}
              />
            </div>
          )}

          {/* ---- Settings tab ---- */}
          {activeTab === 'settings' && (
            <div className="animate-slide-in-up">
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Settings</h2>
              <div className="card">
                <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Data Management</h3>
                <DataExportImport
                  transactions={transactions}
                  onImportTransactions={handleImportTransactions}
                  onExportData={() => {}}
                />
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ---- Import / Add Transaction modal ---- */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-panel" style={{ maxWidth: '36rem' }} onClick={e => e.stopPropagation()}>
            <div
              className="flex items-center justify-between p-6"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Add Transaction</h3>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Upload a bank statement or paste transaction text
                </p>
              </div>
              <button className="btn-secondary" onClick={() => setShowImportModal(false)} aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* File upload zone */}
              <div
                className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl cursor-pointer"
                style={{
                  border: '2px dashed var(--color-border)',
                  transition: 'border-color var(--transition-fast)',
                }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv,.txt,.json,image/*"
                  onChange={handleFileUpload}
                />
                <div
                  className="flex items-center justify-center rounded-full p-3"
                  style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Upload Bank Statement</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Supports CSV, TXT, JSON, JPG, PNG</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--color-border)' }} />
                <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>or paste text</span>
                <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--color-border)' }} />
              </div>

              <textarea
                className="input"
                rows={4}
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                placeholder="Paste transaction SMS history or raw text here..."
                style={{ fontFamily: 'monospace', resize: 'vertical' }}
              />

              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => setShowImportModal(false)}>Cancel</button>
                <button
                  className="btn-primary flex-1"
                  onClick={() => processImport(rawInput)}
                  disabled={isImporting || !rawInput.trim()}
                >
                  {isImporting ? 'Processing...' : 'Process Text'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--color-border)' }} />
                <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>or create manually</span>
                <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--color-border)' }} />
              </div>

              <button
                className="btn-secondary w-full"
                onClick={() => { setShowImportModal(false); setEditingTransaction(null); setShowTransactionModal(true); }}
              >
                Create Transaction Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Transaction edit/create modal ---- */}
      <TransactionEditModal
        transaction={editingTransaction}
        isOpen={showTransactionModal}
        onClose={() => { setShowTransactionModal(false); setEditingTransaction(null); }}
        onSave={handleSaveTransaction}
      />
    </div>
  );
};

export default App;
