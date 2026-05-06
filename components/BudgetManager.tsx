import React, { useState, useMemo } from 'react';
import { TransactionCategory, Budget } from '../types';
import { BudgetAdvanced } from '../types-extended';

interface BudgetManagerProps {
  budgets: Budget[];
  transactions: any[];
  onUpdateBudget: (budget: BudgetAdvanced) => void;
  onDeleteBudget: (categoryId: string) => void;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  budgets,
  transactions,
  onUpdateBudget,
  onDeleteBudget
}) => {
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetAdvanced | null>(null);

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

  const handleSaveBudget = (budgetData: Partial<BudgetAdvanced>) => {
    const budget: BudgetAdvanced = {
      id: editingBudget?.id || `budget_${Date.now()}`,
      category: budgetData.category as TransactionCategory,
      limit: budgetData.limit!,
      period: budgetData.period || 'monthly',
      rollover: budgetData.rollover || false,
      spent: 0,
      remaining: budgetData.limit! - 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      notifications: {
        warning: budgetData.notifications?.warning || 80,
        critical: budgetData.notifications?.critical || 100
      }
    };

    onUpdateBudget(budget);
    setShowAddBudget(false);
    setEditingBudget(null);
  };

  const getBudgetStatusColor = (percent: number) => {
    if (percent >= 100) return 'text-red-600 bg-red-50';
    if (percent >= 80) return 'text-amber-600 bg-amber-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Budget Management</h2>
        <button
          onClick={() => setShowAddBudget(true)}
          className="btn-primary"
        >
          Add Budget
        </button>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetStatus.map((budget) => (
          <div key={budget.category} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-slate-800">{budget.category}</h3>
                <p className="text-sm text-slate-500">
                  ₹{budget.spent.toLocaleString()} / ₹{budget.limit.toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setEditingBudget(budget as BudgetAdvanced)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDeleteBudget(budget.category)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Progress</span>
                <span className={`font-medium ${getBudgetStatusColor(budget.percent).split(' ')[0]}`}>
                  {Math.round(budget.percent)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    budget.percent >= 100 ? 'bg-red-500' : 
                    budget.percent >= 80 ? 'bg-amber-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budget.percent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Remaining: ₹{(budget.limit - budget.spent).toLocaleString()}</span>
                <span>{budget.percent >= 100 ? 'Over Budget' : 'On Track'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Budget Summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Budget Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-slate-500">Total Budget</p>
            <p className="text-2xl font-bold text-slate-900">
              ₹{budgets.reduce((sum, b) => sum + b.limit, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Total Spent</p>
            <p className="text-2xl font-bold text-slate-900">
              ₹{budgetStatus.reduce((sum, b) => sum + b.spent, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Total Remaining</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{budgetStatus.reduce((sum, b) => sum + (b.limit - b.spent), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Budget Modal */}
      {(showAddBudget || editingBudget) && (
        <BudgetForm
          budget={editingBudget}
          existingCategories={budgets.map(b => b.category)}
          onSave={handleSaveBudget}
          onCancel={() => {
            setShowAddBudget(false);
            setEditingBudget(null);
          }}
        />
      )}
    </div>
  );
};

interface BudgetFormProps {
  budget: BudgetAdvanced | null;
  existingCategories: string[];
  onSave: (budget: Partial<BudgetAdvanced>) => void;
  onCancel: () => void;
}

const BudgetForm: React.FC<BudgetFormProps> = ({
  budget,
  existingCategories,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    category: budget?.category || '',
    limit: budget?.limit || 0,
    period: budget?.period || 'monthly' as 'weekly' | 'monthly' | 'yearly',
    rollover: budget?.rollover || false,
    notifications: {
      warning: budget?.notifications?.warning || 80,
      critical: budget?.notifications?.critical || 100
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (formData.limit <= 0) {
      newErrors.limit = 'Limit must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSave({
      ...formData,
      category: formData.category as TransactionCategory
    });
  };

  const availableCategories = Object.values(TransactionCategory).filter(
    cat => !existingCategories.includes(cat) || cat === budget?.category
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="bg-white rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">
            {budget ? 'Edit Budget' : 'Add Budget'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className={`input ${errors.category ? 'border-red-500' : ''}`}
              disabled={!!budget}
            >
              <option value="">Select a category</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Budget Limit (₹)
            </label>
            <input
              type="number"
              value={formData.limit}
              onChange={(e) => setFormData(prev => ({ ...prev, limit: Number(e.target.value) }))}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`input ${errors.limit ? 'border-red-500' : ''}`}
            />
            {errors.limit && <p className="mt-1 text-sm text-red-600">{errors.limit}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Period
            </label>
            <select
              value={formData.period}
              onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as 'weekly' | 'monthly' | 'yearly' }))}
              className="input"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.rollover}
                onChange={(e) => setFormData(prev => ({ ...prev, rollover: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700">Enable rollover</span>
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Unused budget amount carries over to the next period
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Notification Thresholds
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Warning (%)</label>
                <input
                  type="number"
                  value={formData.notifications.warning}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, warning: Number(e.target.value) }
                  }))}
                  min="0"
                  max="100"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Critical (%)</label>
                <input
                  type="number"
                  value={formData.notifications.critical}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, critical: Number(e.target.value) }
                  }))}
                  min="0"
                  max="100"
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {budget ? 'Update' : 'Add'} Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
