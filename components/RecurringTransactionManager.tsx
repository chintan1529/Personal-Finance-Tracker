import React, { useState, useEffect } from 'react';
import { RecurringTransaction } from '../types-extended';
import { Transaction, TransactionCategory, TransactionType } from '../types';

interface RecurringTransactionManagerProps {
  recurringTransactions: RecurringTransaction[];
  onAddRecurring: (transaction: RecurringTransaction) => void;
  onUpdateRecurring: (transaction: RecurringTransaction) => void;
  onDeleteRecurring: (id: string) => void;
  onGenerateTransactions: (transactions: Transaction[]) => void;
}

export const RecurringTransactionManager: React.FC<RecurringTransactionManagerProps> = ({
  recurringTransactions,
  onAddRecurring,
  onUpdateRecurring,
  onDeleteRecurring,
  onGenerateTransactions
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  const [nextDueTransactions, setNextDueTransactions] = useState<RecurringTransaction[]>([]);

  useEffect(() => {
    const checkDueTransactions = () => {
      const today = new Date();
      const dueTransactions = recurringTransactions.filter(tx => {
        if (!tx.isActive) return false;
        const nextDate = new Date(tx.nextDate);
        return nextDate <= today;
      });
      setNextDueTransactions(dueTransactions);
    };

    checkDueTransactions();
    const interval = setInterval(checkDueTransactions, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [recurringTransactions]);

  const generateNextDate = (currentDate: string, frequency: RecurringTransaction['frequency']): string => {
    const date = new Date(currentDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  const generateTransactionsFromRecurring = (recurringTx: RecurringTransaction): Transaction[] => {
    const transactions: Transaction[] = [];
    let currentDate = new Date(recurringTx.nextDate);
    const endDate = recurringTx.endDate ? new Date(recurringTx.endDate) : new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Generate up to one month ahead

    while (currentDate <= endDate) {
      if (recurringTx.maxCount && transactions.length >= recurringTx.maxCount) {
        break;
      }

      transactions.push({
        id: `${recurringTx.id}_${currentDate.toISOString().split('T')[0]}`,
        date: currentDate.toISOString().split('T')[0],
        description: recurringTx.description,
        amount: recurringTx.amount,
        category: recurringTx.category,
        type: recurringTx.type,
        originalText: `Recurring: ${recurringTx.description}`
      });

      currentDate = new Date(generateNextDate(currentDate.toISOString().split('T')[0], recurringTx.frequency));
    }

    return transactions;
  };

  const handleGenerateAllDue = () => {
    const allTransactions: Transaction[] = [];
    const updatedRecurringTransactions: RecurringTransaction[] = [];

    nextDueTransactions.forEach(recurringTx => {
      const transactions = generateTransactionsFromRecurring(recurringTx);
      allTransactions.push(...transactions);

      // Update the next date for the recurring transaction
      const updatedTx = {
        ...recurringTx,
        nextDate: generateNextDate(recurringTx.nextDate, recurringTx.frequency),
        count: (recurringTx.count || 0) + 1
      };

      // Check if it should be deactivated
      if (recurringTx.maxCount && updatedTx.count >= recurringTx.maxCount) {
        updatedTx.isActive = false;
      }

      updatedRecurringTransactions.push(updatedTx);
    });

    onGenerateTransactions(allTransactions);
    updatedRecurringTransactions.forEach(tx => onUpdateRecurring(tx));
  };

  const handleSaveRecurring = (transactionData: Partial<RecurringTransaction>) => {
    const transaction: RecurringTransaction = {
      id: editingTransaction?.id || `recurring_${Date.now()}`,
      description: transactionData.description!,
      amount: transactionData.amount!,
      category: transactionData.category!,
      type: transactionData.type!,
      frequency: transactionData.frequency || 'monthly',
      nextDate: transactionData.nextDate || new Date().toISOString().split('T')[0],
      endDate: transactionData.endDate,
      isActive: transactionData.isActive !== false,
      count: editingTransaction?.count || 0,
      maxCount: transactionData.maxCount
    };

    if (editingTransaction) {
      onUpdateRecurring(transaction);
    } else {
      onAddRecurring(transaction);
    }

    setShowAddModal(false);
    setEditingTransaction(null);
  };

  const getFrequencyIcon = (frequency: RecurringTransaction['frequency']) => {
    switch (frequency) {
      case 'daily':
        return '📅';
      case 'weekly':
        return '📆';
      case 'monthly':
        return '🗓️';
      case 'yearly':
        return '📋';
    }
  };

  const getDaysUntilDue = (nextDate: string) => {
    const today = new Date();
    const due = new Date(nextDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Recurring Transactions</h2>
        <div className="flex space-x-3">
          {nextDueTransactions.length > 0 && (
            <button
              onClick={handleGenerateAllDue}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Generate {nextDueTransactions.length} Due</span>
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Recurring
          </button>
        </div>
      </div>

      {/* Due Transactions Alert */}
      {nextDueTransactions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-amber-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {nextDueTransactions.length} recurring transaction{nextDueTransactions.length > 1 ? 's are' : ' is'} due
              </p>
              <p className="text-xs text-amber-600">
                Click "Generate Due" to create these transactions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Transactions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recurringTransactions.map((transaction) => {
          const daysUntilDue = getDaysUntilDue(transaction.nextDate);
          const isOverdue = daysUntilDue < 0;
          const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

          return (
            <div key={transaction.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getFrequencyIcon(transaction.frequency)}</span>
                  <div>
                    <h4 className="font-semibold text-slate-800">{transaction.description}</h4>
                    <p className="text-sm text-slate-500">{transaction.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setEditingTransaction(transaction)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteRecurring(transaction.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Amount</span>
                  <span className={`font-semibold ${transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'CREDIT' ? '+' : '-'} ₹{transaction.amount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Frequency</span>
                  <span className="text-sm font-medium text-slate-900 capitalize">{transaction.frequency}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Next Date</span>
                  <span className={`text-sm font-medium ${
                    isOverdue ? 'text-red-600' : isDueSoon ? 'text-amber-600' : 'text-slate-900'
                  }`}>
                    {new Date(transaction.nextDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Status</span>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      transaction.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {transaction.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {transaction.maxCount && (
                      <span className="text-xs text-slate-500">
                        {transaction.count || 0}/{transaction.maxCount}
                      </span>
                    )}
                  </div>
                </div>

                {transaction.endDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">End Date</span>
                    <span className="text-sm text-slate-900">
                      {new Date(transaction.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingTransaction) && (
        <RecurringTransactionForm
          transaction={editingTransaction}
          onSave={handleSaveRecurring}
          onCancel={() => {
            setShowAddModal(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
};

interface RecurringTransactionFormProps {
  transaction: RecurringTransaction | null;
  onSave: (transaction: Partial<RecurringTransaction>) => void;
  onCancel: () => void;
}

const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({
  transaction,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    description: transaction?.description || '',
    amount: transaction?.amount || 0,
    category: transaction?.category || TransactionCategory.OTHER,
    type: transaction?.type || 'DEBIT' as TransactionType,
    frequency: transaction?.frequency || 'monthly' as RecurringTransaction['frequency'],
    nextDate: transaction?.nextDate || new Date().toISOString().split('T')[0],
    endDate: transaction?.endDate || '',
    isActive: transaction?.isActive !== false,
    maxCount: transaction?.maxCount || undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.nextDate) {
      newErrors.nextDate = 'Next date is required';
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
            {transaction ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
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
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Monthly Rent, Netflix Subscription"
              className={`input ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`input ${errors.amount ? 'border-red-500' : ''}`}
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as TransactionType }))}
                className="input"
              >
                <option value="DEBIT">Debit</option>
                <option value="CREDIT">Credit</option>
              </select>
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
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as RecurringTransaction['frequency'] }))}
              className="input"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Next Date
              </label>
              <input
                type="date"
                value={formData.nextDate}
                onChange={(e) => setFormData(prev => ({ ...prev, nextDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className={`input ${errors.nextDate ? 'border-red-500' : ''}`}
              />
              {errors.nextDate && <p className="mt-1 text-sm text-red-600">{errors.nextDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Date (optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Occurrences (optional)
              </label>
              <input
                type="number"
                value={formData.maxCount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, maxCount: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="Unlimited"
                min="1"
                className="input"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Active</span>
              </label>
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
              {transaction ? 'Update' : 'Add'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
