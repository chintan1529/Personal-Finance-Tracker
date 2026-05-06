
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction, TransactionCategory } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface CategoryChartProps {
  transactions: Transaction[];
}

export const CategoryChart: React.FC<CategoryChartProps> = React.memo(({ transactions }) => {
  const data = React.useMemo(() => {
    const expenseMap = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Explicitly casting Object.entries to ensure types are correctly inferred for arithmetic operations
    return (Object.entries(expenseMap) as [string, number][]).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400">No data for chart</div>;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as TransactionCategory] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number | undefined) => `₹${(value || 0).toLocaleString('en-IN')}`}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});
