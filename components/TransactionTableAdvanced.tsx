import React, { useState, useMemo } from 'react';
import { Transaction, TransactionCategory } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface TransactionTableAdvancedProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onFilterChange?: (filters: TransactionFilters) => void;
}

interface TransactionFilters {
  searchTerm: string;
  category: TransactionCategory | 'all';
  type: 'all' | 'DEBIT' | 'CREDIT';
  dateRange: {
    start: string;
    end: string;
  };
  minAmount: number;
  maxAmount: number;
}

export const TransactionTableAdvanced: React.FC<TransactionTableAdvancedProps> = React.memo(({ 
  transactions, 
  onEdit, 
  onDelete, 
  onFilterChange 
}) => {
  const [filters, setFilters] = useState<TransactionFilters>({
    searchTerm: '',
    category: 'all',
    type: 'all',
    dateRange: { start: '', end: '' },
    minAmount: 0,
    maxAmount: Number.MAX_SAFE_INTEGER
  });

  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction;
    direction: 'asc' | 'desc';
  }>({ key: 'date', direction: 'desc' });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (!tx) return false;
      
      const matchesSearch = !filters.searchTerm || 
        tx.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        tx.category.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesCategory = filters.category === 'all' || tx.category === filters.category;
      const matchesType = filters.type === 'all' || tx.type === filters.type;
      const matchesAmount = tx.amount >= filters.minAmount && tx.amount <= filters.maxAmount;
      
      let matchesDate = true;
      if (filters.dateRange.start && tx.date) {
        matchesDate = matchesDate && new Date(tx.date) >= new Date(filters.dateRange.start);
      }
      if (filters.dateRange.end && tx.date) {
        matchesDate = matchesDate && new Date(tx.date) <= new Date(filters.dateRange.end);
      }

      return matchesSearch && matchesCategory && matchesType && matchesAmount && matchesDate;
    }).sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [transactions, filters, sortConfig]);

  const handleSort = (key: keyof Transaction) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (newFilters: Partial<TransactionFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(tx => tx.id));
    }
  };

  const handleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev => 
      prev.includes(id) 
        ? prev.filter(tid => tid !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    selectedTransactions.forEach(id => onDelete?.(id));
    setSelectedTransactions([]);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(tx => 
        [tx.date, tx.description, tx.category, tx.type, tx.amount].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
            className="input"
          />
          
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange({ category: e.target.value as TransactionCategory | 'all' })}
            className="input"
          >
            <option value="all">All Categories</option>
            {Object.values(TransactionCategory).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => handleFilterChange({ type: e.target.value as 'all' | 'DEBIT' | 'CREDIT' })}
            className="input"
          >
            <option value="all">All Types</option>
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => handleFilterChange({ dateRange: { ...filters.dateRange, start: e.target.value } })}
              className="input"
            />
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => handleFilterChange({ dateRange: { ...filters.dateRange, end: e.target.value } })}
              className="input"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min Amount"
            value={filters.minAmount || ''}
            onChange={(e) => handleFilterChange({ minAmount: Number(e.target.value) || 0 })}
            className="input w-32"
          />
          <input
            type="number"
            placeholder="Max Amount"
            value={filters.maxAmount === Number.MAX_SAFE_INTEGER ? '' : filters.maxAmount}
            onChange={(e) => handleFilterChange({ maxAmount: Number(e.target.value) || Number.MAX_SAFE_INTEGER })}
            className="input w-32"
          />
          
          <button
            onClick={exportToCSV}
            className="btn-primary"
          >
            Export CSV
          </button>
          
          {selectedTransactions.length > 0 && (
            <>
              <span className="px-4 py-2 bg-slate-100 rounded-lg text-slate-700">
                {selectedTransactions.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="btn-primary"
              >
                Delete Selected
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-medium">
                <input
                  type="checkbox"
                  checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th 
                className="py-3 px-4 font-medium cursor-pointer hover:text-slate-600"
                onClick={() => handleSort('date')}
              >
                Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="py-3 px-4 font-medium cursor-pointer hover:text-slate-600"
                onClick={() => handleSort('description')}
              >
                Description {sortConfig.key === 'description' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-3 px-4 font-medium">Category</th>
              <th 
                className="py-3 px-4 font-medium cursor-pointer hover:text-slate-600"
                onClick={() => handleSort('type')}
              >
                Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="py-3 px-4 font-medium text-right cursor-pointer hover:text-slate-600"
                onClick={() => handleSort('amount')}
              >
                Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-3 px-4 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                <td className="py-4 px-4">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.includes(tx.id)}
                    onChange={() => handleSelectTransaction(tx.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td className="py-4 px-4 text-sm text-slate-600">
                  {tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-slate-800">{tx.description || 'N/A'}</div>
                </td>
                <td className="py-4 px-4">
                  <span 
                    className="badge"
                    style={{ 
                      backgroundColor: `${CATEGORY_COLORS[tx.category] || '#94a3b8'}15`, 
                      color: CATEGORY_COLORS[tx.category] || '#94a3b8' 
                    }}
                  >
                    {tx.category || 'Unknown'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`badge ${
                    tx.type === 'CREDIT' ? 'badge--success' : 'badge--danger'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className={`py-4 px-4 text-sm font-semibold text-right ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-slate-900'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'} ₹{(tx.amount || 0).toLocaleString('en-IN')}
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit?.(tx)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete?.(tx.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTransactions.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            {transactions.length === 0 ? 'No transactions found. Try importing some!' : 'No transactions match the current filters.'}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Total Transactions: </span>
            <span className="font-semibold">{filteredTransactions.length}</span>
          </div>
          <div>
            <span className="text-slate-500">Total Credits: </span>
            <span className="font-semibold text-green-600">
              ₹{filteredTransactions.filter(tx => tx.type === 'CREDIT').reduce((sum, tx) => sum + tx.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Total Debits: </span>
            <span className="font-semibold text-red-600">
              ₹{filteredTransactions.filter(tx => tx.type === 'DEBIT').reduce((sum, tx) => sum + tx.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
