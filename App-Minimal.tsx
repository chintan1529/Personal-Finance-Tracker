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
import './styles-minimal.css';

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

  // Transaction Management Functions
  const processImport = async (text?: string, image?: { data: string; mimeType: string }) => {
    if (!text?.trim() && !image) return;
    setIsImporting(true);
    try {
      const newTxs = await categorizeTransactions(text, image);
      if (newTxs.length === 0) {
        alert("No transactions were found in the provided data. Please check the format and try again.");
        return;
      }
      setTransactions(prev => [...newTxs, ...prev]);
      setRawInput('');
      setShowImportModal(false);
    } catch (error) {
      console.error("Failed to categorize:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong while processing. Please check your data format.";
      alert(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSize) {
      alert("File size exceeds 10MB limit. Please choose a smaller file.");
      return;
    }

    const allowedTypes = ['text/csv', 'text/plain', 'application/json', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      alert("Unsupported file type. Please upload CSV, TXT, JSON, or image files.");
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
          console.error("File processing error:", error);
          alert("Failed to process the uploaded file. Please check the file format and try again.");
        }
      }
    };

    reader.onerror = () => {
      alert("Failed to read the uploaded file. Please try again.");
    };

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleSaveTransaction = (transaction: Transaction) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(tx => tx.id === transaction.id ? transaction : tx));
    } else {
      setTransactions(prev => [transaction, ...prev]);
    }
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleGenerateAdvice = async () => {
    if (transactions.length === 0) {
      alert("No transactions available for analysis. Please import some transactions first.");
      return;
    }
    setIsGeneratingAdvice(true);
    try {
      const advice = await getFinancialAdvice(transactions);
      if (advice.length === 0) {
        alert("No insights could be generated from the current transactions.");
        return;
      }
      setInsights(advice);
    } catch (error) {
      console.error("Failed to get advice:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate financial insights. Please try again.";
      alert(errorMessage);
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

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
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'budgets', label: 'Budgets', icon: '📋' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'recurring', label: 'Recurring', icon: '🔄' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m.599-1c.53-.1 1.054-.253 1.565-.453M11.401 16c-.51-.1-1.034-.253-1.565-.453M12 5c4.418 0 8 2.239 8 5 0 2.761-3.582 5-8 5s-8-2.239-8-5c0-2.761 3.582-5 8-5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">UPI Expense Tracker</h1>
                <p className="text-sm text-gray-500">Manage your finances</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowImportModal(true)}
              className="btn btn-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Transaction
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container">
          <div className="nav">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="card stat-card">
                  <div className="stat-value text-blue-600">
                    ₹{stats.totalBalance.toLocaleString('en-IN')}
                  </div>
                  <div className="stat-label">Total Balance</div>
                  <div className="stat-change positive">+12.5% from last month</div>
                </div>

                <div className="card stat-card">
                  <div className="stat-value text-red-600">
                    ₹{stats.monthlyExpenses.toLocaleString('en-IN')}
                  </div>
                  <div className="stat-label">Monthly Expenses</div>
                  <div className="stat-change negative">+8.3% from last month</div>
                </div>

                <div className="card stat-card">
                  <div className="stat-value text-green-600">
                    ₹{stats.monthlyIncome.toLocaleString('en-IN')}
                  </div>
                  <div className="stat-label">Monthly Income</div>
                  <div className="stat-change positive">+15.2% from last month</div>
                </div>

                <div className="card stat-card">
                  <div className="stat-value text-purple-600">{stats.topCategory}</div>
                  <div className="stat-label">Top Category</div>
                  <div className="stat-change">42% of total expenses</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Spending Trends</h3>
                  </div>
                  <div className="card-content">
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyTrendData}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9ca3af"
                            fontSize={12}
                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          />
                          <YAxis 
                            stroke="#9ca3af"
                            fontSize={12}
                            tickFormatter={(val) => `₹${val}`}
                          />
                          <ReTooltip 
                            contentStyle={{ 
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px'
                            }}
                            labelFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#3b82f6" 
                            fillOpacity={1} 
                            fill="url(#colorAmount)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Income vs Expenses</h3>
                  </div>
                  <div className="card-content">
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="month" 
                            stroke="#9ca3af"
                            fontSize={12}
                            tickFormatter={(val) => new Date(val + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                          />
                          <YAxis 
                            stroke="#9ca3af"
                            fontSize={12}
                            tickFormatter={(val) => `₹${val}`}
                          />
                          <ReTooltip 
                            contentStyle={{ 
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="income" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={{ fill: '#10b981', r: 4 }}
                            name="Income"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="expenses" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            dot={{ fill: '#ef4444', r: 4 }}
                            name="Expenses"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Recent Transactions</h3>
                </div>
                <div className="card-content">
                  <TransactionTable transactions={transactions.slice(0, 10)} />
                </div>
              </div>
            </div>
          )}

          {/* Other tabs */}
          {activeTab === 'transactions' && (
            <div className="animate-fade-in">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Transaction Management</h3>
                </div>
                <div className="card-content">
                  <TransactionTableAdvanced
                    transactions={transactions}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budgets' && (
            <div className="animate-fade-in">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Budget Management</h3>
                </div>
                <div className="card-content">
                  <BudgetManager
                    budgets={budgets}
                    transactions={transactions}
                    onUpdateBudget={() => {}}
                    onDeleteBudget={() => {}}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="animate-fade-in">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Savings Goals</h3>
                </div>
                <div className="card-content">
                  <GoalTracker
                    goals={goals}
                    transactions={transactions}
                    onAddGoal={() => {}}
                    onUpdateGoal={() => {}}
                    onDeleteGoal={() => {}}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recurring' && (
            <div className="animate-fade-in">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Recurring Transactions</h3>
                </div>
                <div className="card-content">
                  <RecurringTransactionManager
                    recurringTransactions={recurringTransactions}
                    onAddRecurring={() => {}}
                    onUpdateRecurring={() => {}}
                    onDeleteRecurring={() => {}}
                    onGenerateTransactions={() => {}}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="animate-fade-in">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Financial Reports</h3>
                </div>
                <div className="card-content">
                  <ReportGenerator
                    transactions={transactions}
                    onGenerateReport={() => {}}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade-in">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Settings & Preferences</h3>
                </div>
                <div className="card-content">
                  <DataExportImport
                    transactions={transactions}
                    onImportTransactions={() => {}}
                    onExportData={() => {}}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Transaction Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Transaction</h3>
              <button onClick={() => setShowImportModal(false)} className="modal-close">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv,.txt,.json,image/*" 
                    onChange={handleFileUpload}
                  />
                  <div className="text-blue-500 text-4xl mb-4">📄</div>
                  <p className="text-gray-900 font-medium mb-2">Upload Bank Statement</p>
                  <p className="text-gray-500 text-sm">Supports CSV, TXT, and Statement Images</p>
                </div>

                <div className="text-center">
                  <span className="text-gray-500">or</span>
                </div>

                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setShowTransactionModal(true);
                  }}
                  className="btn btn-primary w-full"
                >
                  Create Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Edit Modal */}
      <TransactionEditModal
        transaction={editingTransaction}
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
      />
    </div>
  );
};

export default App;
