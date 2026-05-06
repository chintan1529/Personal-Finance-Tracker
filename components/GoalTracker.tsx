import React, { useState, useMemo } from 'react';
import { Transaction, TransactionCategory } from '../types';
import { Goal } from '../types-extended';

interface GoalTrackerProps {
  goals: Goal[];
  transactions: Transaction[];
  onAddGoal: (goal: Goal) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({
  goals,
  transactions,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal
}) => {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const goalsWithProgress = useMemo(() => {
    return goals.map(goal => {
      const categoryTransactions = transactions.filter(
        t => t.category === goal.category && t.type === 'CREDIT'
      );
      
      const currentAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const progress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
      const daysRemaining = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...goal,
        currentAmount,
        progress,
        daysRemaining,
        isCompleted: progress >= 100,
        isOverdue: daysRemaining < 0 && progress < 100
      };
    });
  }, [goals, transactions]);

  const handleSaveGoal = (goalData: Partial<Goal>) => {
    const goal: Goal = {
      id: editingGoal?.id || `goal_${Date.now()}`,
      name: goalData.name!,
      targetAmount: goalData.targetAmount!,
      currentAmount: goalData.currentAmount || 0,
      deadline: goalData.deadline!,
      category: goalData.category!,
      isActive: goalData.isActive !== false,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      description: goalData.description
    };

    if (editingGoal) {
      onUpdateGoal(goal);
    } else {
      onAddGoal(goal);
    }
    
    setShowAddGoal(false);
    setEditingGoal(null);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-amber-500';
    return 'bg-slate-300';
  };

  const getStatusBadge = (goal: any) => {
    if (goal.isCompleted) {
      return <span className="badge badge--success">Completed</span>;
    }
    if (goal.isOverdue) {
      return <span className="badge badge--danger">Overdue</span>;
    }
    if (goal.daysRemaining <= 7) {
      return <span className="badge badge--warning">Due Soon</span>;
    }
    return <span className="badge badge--neutral">On Track</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Savings Goals</h2>
        <button
          onClick={() => setShowAddGoal(true)}
          className="btn-primary"
        >
          Add Goal
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goalsWithProgress.map((goal) => (
          <div key={goal.id} className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 text-lg">{goal.name}</h3>
                <p className="text-sm text-slate-500">{goal.category}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(goal)}
                <div className="flex space-x-1">
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {goal.description && (
              <p className="text-sm text-slate-600 mb-4">{goal.description}</p>
            )}

            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-medium text-slate-800">{Math.round(goal.progress)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${getProgressColor(goal.progress)}`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Amount Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Current</p>
                  <p className="font-semibold text-slate-900">₹{goal.currentAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Target</p>
                  <p className="font-semibold text-slate-900">₹{goal.targetAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Time Remaining */}
              <div className="text-sm">
                <p className="text-slate-500">
                  {goal.isCompleted 
                    ? 'Goal completed! 🎉'
                    : goal.isOverdue
                    ? `${Math.abs(goal.daysRemaining)} days overdue`
                    : `${goal.daysRemaining} days remaining`
                  }
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Deadline: {new Date(goal.deadline).toLocaleDateString()}
                </p>
              </div>

              {/* Monthly Savings Needed */}
              {!goal.isCompleted && !goal.isOverdue && goal.daysRemaining > 0 && (
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <p className="text-xs text-indigo-600 font-medium">
                    Save ₹{Math.ceil((goal.targetAmount - goal.currentAmount) / (goal.daysRemaining / 30)).toLocaleString()} per month to reach goal
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Goals Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-slate-500">Total Goals</p>
            <p className="text-2xl font-bold text-slate-900">{goals.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {goalsWithProgress.filter(g => g.isCompleted).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {goalsWithProgress.filter(g => !g.isCompleted && !g.isOverdue).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Total Target</p>
            <p className="text-2xl font-bold text-slate-900">
              ₹{goals.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Goal Modal */}
      {(showAddGoal || editingGoal) && (
        <GoalForm
          goal={editingGoal}
          onSave={handleSaveGoal}
          onCancel={() => {
            setShowAddGoal(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
};

interface GoalFormProps {
  goal: Goal | null;
  onSave: (goal: Partial<Goal>) => void;
  onCancel: () => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ goal, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    targetAmount: goal?.targetAmount || 0,
    currentAmount: goal?.currentAmount || 0,
    deadline: goal?.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    category: goal?.category || TransactionCategory.OTHER,
    description: goal?.description || '',
    isActive: goal?.isActive !== false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required';
    }
    if (formData.targetAmount <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than 0';
    }
    if (formData.currentAmount < 0) {
      newErrors.currentAmount = 'Current amount cannot be negative';
    }
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="bg-white rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">
            {goal ? 'Edit Goal' : 'Add Goal'}
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
              Goal Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Emergency Fund, Vacation"
              className={`input ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add a description for your goal..."
              rows={3}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Target Amount (₹)
              </label>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`input ${errors.targetAmount ? 'border-red-500' : ''}`}
              />
              {errors.targetAmount && <p className="mt-1 text-sm text-red-600">{errors.targetAmount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Current Amount (₹)
              </label>
              <input
                type="number"
                value={formData.currentAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: Number(e.target.value) }))}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`input ${errors.currentAmount ? 'border-red-500' : ''}`}
              />
              {errors.currentAmount && <p className="mt-1 text-sm text-red-600">{errors.currentAmount}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as TransactionCategory }))}
              className="input"
            >
              {Object.values(TransactionCategory).map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Target Date
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className={`input ${errors.deadline ? 'border-red-500' : ''}`}
            />
            {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
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
              {goal ? 'Update' : 'Add'} Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
