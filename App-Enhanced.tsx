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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

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

  // Budget Monitoring Logic
  const budgetStatus = useMemo(() => {
    const currentMonthSpent = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return budgets.map(b => {
      const spent = currentMonthSpent[b.category] || 0;
      const percent = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      return { 
        ...b, 
        spent, 
        percent,
        id: b.category,
        period: 'monthly' as const,
        rollover: false,
        remaining: b.limit - spent,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        notifications: {
          warning: 80,
          critical: 100
        }
      } as BudgetAdvanced;
    });
  }, [transactions, budgets]);

  const activeAlerts = useMemo(() => {
    return budgetStatus
      .filter(s => s.percent >= 80)
      .map(s => ({
        category: s.category,
        percent: s.percent,
        type: s.percent >= 100 ? 'critical' : 'warning',
        message: s.percent >= 100 
          ? `Over Budget! You've spent ₹${s.spent.toLocaleString()} / ₹${s.limit.toLocaleString()}`
          : `Budget Warning! You've reached ${Math.round(s.percent)}% of your limit.`
      }));
  }, [budgetStatus]);

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

  const handleUpdateBudget = (budget: BudgetAdvanced) => {
    setBudgets(prev => {
      const exists = prev.find(b => b.category === budget.category);
      if (exists) {
        return prev.map(b => b.category === budget.category ? { 
          category: b.category, 
          limit: budget.limit 
        } : b);
      }
      return [...prev, { category: budget.category, limit: budget.limit }];
    });
  };

  const handleDeleteBudget = (categoryId: string) => {
    setBudgets(prev => prev.filter(b => b.category !== categoryId));
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

  const clearAllData = () => {
    if (window.confirm("Are you sure you want to clear all tracked transactions? This cannot be undone.")) {
      setTransactions([]);
      localStorage.removeItem('upi_transactions');
    }
  };

  // Goal Management
  const handleAddGoal = (goal: Goal) => {
    setGoals(prev => [...prev, goal]);
  };

  const handleUpdateGoal = (goal: Goal) => {
    setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  // Recurring Transaction Management
  const handleAddRecurring = (recurring: RecurringTransaction) => {
    setRecurringTransactions(prev => [...prev, recurring]);
  };

  const handleUpdateRecurring = (recurring: RecurringTransaction) => {
    setRecurringTransactions(prev => prev.map(r => r.id === recurring.id ? recurring : r));
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurringTransactions(prev => prev.filter(r => r.id !== id));
  };

  const handleGenerateRecurringTransactions = (newTransactions: Transaction[]) => {
    setTransactions(prev => [...newTransactions, ...prev]);
  };

  // Report Management
  const handleGenerateReport = (report: Report) => {
    setReports(prev => [...prev, report]);
  };

  const handleExportData = (format: any) => {
    // This would be implemented with actual export logic
    console.log('Exporting data:', format);
    alert('Export functionality would be implemented here');
  };

  const handleImportTransactions = (importedTransactions: Transaction[]) => {
    setTransactions(prev => [...importedTransactions, ...prev]);
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
      const month = t.date.substring(0, 7); // YYYY-MM
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m.599-1c.53-.1 1.054-.253 1.565-.453M11.401 16c-.51-.1-1.034-.253-1.565-.453M12 5c4.418 0 8 2.239 8 5 0 2.761-3.582 5-8 5s-8-2.239-8-5c0-2.761 3.582-5 8-5z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-900 hidden sm:block">UPI Expense Intelligence</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all shadow-indigo-200"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white border-r border-slate-200 min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id as ActiveTab)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Alerts */}
          {activeAlerts.length > 0 && (
            <div className="space-y-2 mb-6">
              {activeAlerts.map((alert, idx) => (
                <div key={idx} className={`flex items-center p-4 rounded-xl border ${
                  alert.type === 'critical' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-amber-50 border-amber-100 text-amber-800'
                }`}>
                  <div className="mr-3 shrink-0">
                    {alert.type === 'critical' ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-sm">
                    <span className="font-bold">{alert.category}: </span>
                    <span>{alert.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="flex flex-col justify-center">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Balance</p>
                  <h4 className="text-2xl font-bold text-slate-900 mt-1">₹{stats.totalBalance.toLocaleString('en-IN')}</h4>
                </Card>
                <Card className="flex flex-col justify-center border-l-4 border-l-red-400">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Monthly Expenses</p>
                  <h4 className="text-2xl font-bold text-slate-900 mt-1">₹{stats.monthlyExpenses.toLocaleString('en-IN')}</h4>
                </Card>
                <Card className="flex flex-col justify-center border-l-4 border-l-green-400">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Monthly Income</p>
                  <h4 className="text-2xl font-bold text-slate-900 mt-1">₹{stats.monthlyIncome.toLocaleString('en-IN')}</h4>
                </Card>
                <Card className="flex flex-col justify-center">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Top Category</p>
                  <h4 className="text-xl font-bold text-slate-900 mt-1">{stats.topCategory}</h4>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <Card title="Spending Trends" subtitle="Daily expense history">
                    <div className="h-64 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            fontSize={10} 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          />
                          <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                          <ReTooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                          />
                          <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card title="Monthly Trend" subtitle="Income vs Expenses">
                    <div className="h-64 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="month" 
                            fontSize={10} 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(val) => new Date(val + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                          />
                          <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                          <ReTooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Income" />
                          <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>

                <div className="space-y-8">
                  <Card title="Category Distribution" subtitle="Spending by category">
                    <CategoryChart transactions={transactions} />
                  </Card>

                  <Card className="bg-indigo-900 border-none text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold">AI Insights</h3>
                      <p className="text-indigo-200 text-sm mt-1">Get personalized financial advice based on your spending patterns.</p>
                      <button 
                        onClick={handleGenerateAdvice}
                        disabled={isGeneratingAdvice}
                        className="mt-6 w-full py-3 bg-white text-indigo-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors disabled:opacity-50"
                      >
                        {isGeneratingAdvice ? 'Analyzing...' : 'Generate Insights'}
                      </button>
                    </div>
                  </Card>

                  {insights.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-slate-800 font-bold px-1">AI Recommendations</h3>
                      {insights.map((insight, idx) => (
                        <Card key={idx} className="border-l-4 border-l-indigo-500 shadow-md">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-800 text-sm">{insight.title}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              insight.impact === 'High' ? 'bg-red-100 text-red-600' : 
                              insight.impact === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {insight.impact}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-2">{insight.description}</p>
                          <div className="mt-3 pt-3 border-t border-slate-50">
                            <p className="text-xs font-semibold text-indigo-600">💡 {insight.suggestion}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Card title="Recent Transactions" className="p-0">
                <TransactionTable transactions={transactions.slice(0, 10)} />
              </Card>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <TransactionTableAdvanced
              transactions={transactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          )}

          {/* Budgets Tab */}
          {activeTab === 'budgets' && (
            <BudgetManager
              budgets={budgets}
              transactions={transactions}
              onUpdateBudget={handleUpdateBudget}
              onDeleteBudget={handleDeleteBudget}
            />
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <GoalTracker
              goals={goals}
              transactions={transactions}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          )}

          {/* Recurring Tab */}
          {activeTab === 'recurring' && (
            <RecurringTransactionManager
              recurringTransactions={recurringTransactions}
              onAddRecurring={handleAddRecurring}
              onUpdateRecurring={handleUpdateRecurring}
              onDeleteRecurring={handleDeleteRecurring}
              onGenerateTransactions={handleGenerateRecurringTransactions}
            />
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <ReportGenerator
              transactions={transactions}
              onGenerateReport={handleGenerateReport}
            />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <DataExportImport
              transactions={transactions}
              onImportTransactions={handleImportTransactions}
              onExportData={handleExportData}
            />
          )}
        </main>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-xl relative z-10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Add Transaction</h3>
              <p className="text-sm text-slate-500 mt-1">Import from file or enter manually</p>
            </div>
            <div className="p-6 space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv,.txt,.json,image/*" 
                  onChange={handleFileUpload}
                />
                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-bold text-slate-700">Upload File</p>
                <p className="text-xs text-slate-400">CSV, TXT, JSON, or Images</p>
              </div>

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-xs font-semibold text-slate-300 uppercase">Or Add Manually</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button
                onClick={() => {
                  setShowImportModal(false);
                  setShowTransactionModal(true);
                }}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                Create Transaction
              </button>
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
