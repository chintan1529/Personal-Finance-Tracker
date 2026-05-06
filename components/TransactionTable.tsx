
import React from 'react';
import { Transaction } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface TransactionTableProps {
  transactions: Transaction[];
}

export const TransactionTable: React.FC<TransactionTableProps> = React.memo(({ transactions }) => {
  if (!transactions) {
    return (
      <div className="py-12 text-center text-slate-400">
        No transactions data available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
            <th className="py-3 px-4 font-medium">Date</th>
            <th className="py-3 px-4 font-medium">Description</th>
            <th className="py-3 px-4 font-medium">Category</th>
            <th className="py-3 px-4 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {transactions.map((tx) => {
            if (!tx || !tx.id) {
              return null;
            }
            
            return (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                <td className="py-4 px-4 text-sm text-slate-600">
                  {tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
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
                <td className={`py-4 px-4 text-sm font-semibold text-right ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-slate-900'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'} ₹{(tx.amount || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {transactions.length === 0 && (
        <div className="py-12 text-center text-slate-400">
          No transactions found. Try importing some!
        </div>
      )}
    </div>
  );
});
