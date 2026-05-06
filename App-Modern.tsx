import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, SpendingInsight, DashboardStats, TransactionCategory, Budget } from './types';
import { 
  BudgetAdvanced, 
  Goal, 
  RecurringTransaction, 
  Report, 
  Notification 
} from './types-extended';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import './styles-advanced.css';

type ActiveTab = 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'recurring' | 'reports' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([
    { category: TransactionCategory.FOOD, limit: 5000 },
    { category: TransactionCategory.SHOPPING, limit: 3000 }
  ]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // UI States
  const [isImporting, setIsImporting] = useState(false);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [rawInput, setRawInput] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('upi_transactions');
    const savedBudgets = localStorage.getItem('upi_budgets');
    const savedGoals = localStorage.getItem('upi_goals');
    const savedRecurring = localStorage.getItem('upi_recurring');
    
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    } else {
      setTransactions(SAMPLE_TRANSACTIONS);
    }

    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets));
    }

    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }

    if (savedRecurring) {
      setRecurringTransactions(JSON.parse(savedRecurring));
    }
  }, []);

  // Save data to localStorage on change
  useEffect(() => {
    localStorage.setItem('upi_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('upi_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('upi_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('upi_recurring', JSON.stringify(recurringTransactions));
  }, [recurringTransactions]);

  // Statistics Calculation
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
      if (amt > maxAmt) {
        maxAmt = amt;
        topCat = cat as TransactionCategory;
      }
    });

    return {
      totalBalance: income - expenses,
      monthlyExpenses: expenses,
      monthlyIncome: income,
      topCategory: topCat
    };
  }, [transactions]);

  // Chart data
  const dailyTrendData = useMemo(() => {
    const dates: Record<string, number> = {};
    transactions.filter(t => t.type === 'DEBIT').forEach(t => {
      const d = t.date.split('T')[0];
      dates[d] = (dates[d] || 0) + t.amount;
    });
    return Object.entries(dates)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  const monthlyTrendData = useMemo(() => {
    const months: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!months[month]) {
        months[month] = { income: 0, expenses: 0 };
      }
      if (t.type === 'CREDIT') {
        months[month].income += t.amount;
      } else {
        months[month].expenses += t.amount;
      }
    });
    return Object.entries(months)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'from-blue-500 to-purple-600' },
    { id: 'transactions', label: 'Transactions', icon: '💳', color: 'from-green-500 to-teal-600' },
    { id: 'budgets', label: 'Budgets', icon: '📋', color: 'from-orange-500 to-red-600' },
    { id: 'goals', label: 'Goals', icon: '🎯', color: 'from-pink-500 to-rose-600' },
    { id: 'recurring', label: 'Recurring', icon: '🔄', color: 'from-indigo-500 to-purple-600' },
    { id: 'reports', label: 'Reports', icon: '📈', color: 'from-cyan-500 to-blue-600' },
    { id: 'settings', label: 'Settings', icon: '⚙️', color: 'from-gray-500 to-slate-600' }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-40 glass-card border-0 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg glass-card hover:bg-white/20 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m.599-1c.53-.1 1.054-.253 1.565-.453M11.401 16c-.51-.1-1.034-.253-1.565-.453M12 5c4.418 0 8 2.239 8 5 0 2.761-3.582 5-8 5s-8-2.239-8-5c0-2.761 3.582-5 8-5z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white hidden sm:block">UPI Expense Intelligence</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowImportModal(true)}
                className="neon-button flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Transaction</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative z-30">
        {/* Sidebar Navigation */}
        <nav className={`modern-sidebar fixed lg:relative h-screen transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} w-64 z-50`}>
          <div className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id as ActiveTab);
                      setSidebarOpen(false);
                    }}
                    className={`modern-sidebar-item w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      activeTab === item.id
                        ? 'active text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center text-white font-bold`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 min-h-screen">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stats-card modern-card p-6 floating">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m.599-1c.53-.1 1.054-.253 1.565-.453M11.401 16c-.51-.1-1.034-.253-1.565-.453M12 5c4.418 0 8 2.239 8 5 0 2.761-3.582 5-8 5s-8-2.239-8-5c0-2.761 3.582-5 8-5z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm font-medium mb-1">Total Balance</p>
                  <h4 className="text-3xl font-bold text-white">₹{stats.totalBalance.toLocaleString('en-IN')}</h4>
                </div>

                <div className="modern-card p-6 hover-lift">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Monthly Expenses</p>
                  <h4 className="text-3xl font-bold text-gray-900">₹{stats.monthlyExpenses.toLocaleString('en-IN')}</h4>
                </div>

                <div className="modern-card p-6 hover-lift">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m.599-1c.53-.1 1.054-.253 1.565-.453M11.401 16c-.51-.1-1.034-.253-1.565-.453M12 5c4.418 0 8 2.239 8 5 0 2.761-3.582 5-8 5s-8-2.239-8-5c0-2.761 3.582-5 8-5z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Monthly Income</p>
                  <h4 className="text-3xl font-bold text-gray-900">₹{stats.monthlyIncome.toLocaleString('en-IN')}</h4>
                </div>

                <div className="modern-card p-6 hover-lift">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Top Category</p>
                  <h4 className="text-2xl font-bold text-gray-900">{stats.topCategory}</h4>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="chart-container">
                  <h3 className="text-xl font-bold text-white mb-6">Spending Trends</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyTrendData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="rgba(255,255,255,0.6)"
                          fontSize={12}
                          tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.6)"
                          fontSize={12}
                          tickFormatter={(val) => `₹${val}`}
                        />
                        <ReTooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(26, 26, 46, 0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px'
                          }}
                          labelFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#8b5cf6" 
                          fillOpacity={1} 
                          fill="url(#colorAmount)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-container">
                  <h3 className="text-xl font-bold text-white mb-6">Income vs Expenses</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="month" 
                          stroke="rgba(255,255,255,0.6)"
                          fontSize={12}
                          tickFormatter={(val) => new Date(val + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.6)"
                          fontSize={12}
                          tickFormatter={(val) => `₹${val}`}
                        />
                        <ReTooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(26, 26, 46, 0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="income" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          dot={{ fill: '#10b981', r: 6 }}
                          name="Income"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="expenses" 
                          stroke="#ef4444" 
                          strokeWidth={3}
                          dot={{ fill: '#ef4444', r: 6 }}
                          name="Expenses"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="chart-container">
                <h3 className="text-xl font-bold text-white mb-6">Recent Transactions</h3>
                <TransactionTable transactions={transactions.slice(0, 10)} />
              </div>
            </div>
          )}

          {/* Other tabs with modern styling */}
          {activeTab === 'transactions' && (
            <div className="chart-container">
              <h2 className="text-2xl font-bold text-white mb-6">Transaction Management</h2>
              <TransactionTableAdvanced
                transactions={transactions}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </div>
          )}

          {activeTab === 'budgets' && (
            <div className="chart-container">
              <h2 className="text-2xl font-bold text-white mb-6">Budget Management</h2>
              <BudgetManager
                budgets={budgets}
                transactions={transactions}
                onUpdateBudget={() => {}}
                onDeleteBudget={() => {}}
              />
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="chart-container">
              <h2 className="text-2xl font-bold text-white mb-6">Savings Goals</h2>
              <GoalTracker
                goals={goals}
                transactions={transactions}
                onAddGoal={() => {}}
                onUpdateGoal={() => {}}
                onDeleteGoal={() => {}}
              />
            </div>
          )}

          {activeTab === 'recurring' && (
            <div className="chart-container">
              <h2 className="text-2xl font-bold text-white mb-6">Recurring Transactions</h2>
              <RecurringTransactionManager
                recurringTransactions={recurringTransactions}
                onAddRecurring={() => {}}
                onUpdateRecurring={() => {}}
                onDeleteRecurring={() => {}}
                onGenerateTransactions={() => {}}
              />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="chart-container">
              <h2 className="text-2xl font-bold text-white mb-6">Reports</h2>
              <ReportGenerator
                transactions={transactions}
                onGenerateReport={() => {}}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="chart-container">
              <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
              <DataExportImport
                transactions={transactions}
                onImportTransactions={() => {}}
                onExportData={() => {}}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
