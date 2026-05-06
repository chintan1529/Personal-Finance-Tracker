import React, { useState, useMemo } from 'react';
import { Transaction, TransactionCategory } from '../types';
import { Report } from '../types-extended';

interface ReportGeneratorProps {
  transactions: Transaction[];
  onGenerateReport: (report: Report) => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  transactions,
  onGenerateReport
}) => {
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'custom' | 'tax' | 'category'>('monthly');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedCategories, setSelectedCategories] = useState<TransactionCategory[]>([]);
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  const reportData = useMemo(() => {
    const filteredTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      return txDate >= startDate && txDate <= endDate &&
        (selectedCategories.length === 0 || selectedCategories.includes(tx.category));
    });

    const totalIncome = filteredTransactions
      .filter(tx => tx.type === 'CREDIT')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(tx => tx.type === 'DEBIT')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const categoryBreakdown = filteredTransactions
      .filter(tx => tx.type === 'DEBIT')
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);

    const monthlyTrend = filteredTransactions.reduce((acc, tx) => {
      const month = tx.date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      if (tx.type === 'CREDIT') {
        acc[month].income += tx.amount;
      } else {
        acc[month].expenses += tx.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    const topExpenses = filteredTransactions
      .filter(tx => tx.type === 'DEBIT')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const averageDailySpending = filteredTransactions
      .filter(tx => tx.type === 'DEBIT')
      .reduce((sum, tx) => sum + tx.amount, 0) / 
      Math.max(1, Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24)));

    return {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      categoryBreakdown,
      monthlyTrend,
      topExpenses,
      averageDailySpending,
      transactionCount: filteredTransactions.length,
      averageTransactionSize: filteredTransactions.length > 0 
        ? filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0) / filteredTransactions.length 
        : 0
    };
  }, [transactions, dateRange, selectedCategories]);

  const handleGenerateReport = () => {
    const report: Report = {
      id: `report_${Date.now()}`,
      name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      type: reportType,
      startDate: dateRange.start,
      endDate: dateRange.end,
      data: reportData,
      generatedAt: new Date().toISOString()
    };

    onGenerateReport(report);
    generateReportFile(report);
  };

  const generateReportFile = (report: Report) => {
    switch (format) {
      case 'csv':
        generateCSV(report);
        break;
      case 'excel':
        generateExcel(report);
        break;
      case 'pdf':
        generatePDF(report);
        break;
    }
  };

  const generateCSV = (report: Report) => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const transactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const startDate = new Date(report.startDate);
      const endDate = new Date(report.endDate);
      return txDate >= startDate && txDate <= endDate;
    });

    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => 
        [tx.date, tx.description, tx.category, tx.type, tx.amount].join(',')
      )
    ].join('\n');

    downloadFile(csvContent, `${report.name.replace(/\s+/g, '_')}.csv`, 'text/csv');
  };

  const generateExcel = (report: Report) => {
    // For now, generate CSV as Excel placeholder
    // In a real implementation, you'd use a library like xlsx
    generateCSV(report);
  };

  const generatePDF = (report: Report) => {
    // Generate a simple text-based report for now
    // In a real implementation, you'd use a library like jsPDF
    const reportText = `
${report.name}
Generated: ${new Date(report.generatedAt).toLocaleDateString()}
Period: ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}

SUMMARY
=======
Total Income: ₹${report.data.totalIncome.toLocaleString()}
Total Expenses: ₹${report.data.totalExpenses.toLocaleString()}
Net Savings: ₹${report.data.netSavings.toLocaleString()}
Savings Rate: ${report.data.savingsRate.toFixed(2)}%

CATEGORY BREAKDOWN
==================
${Object.entries(report.data.categoryBreakdown)
  .map(([cat, amount]) => `${cat}: ₹${amount.toLocaleString()}`)
  .join('\n')}

TOP EXPENSES
============
${report.data.topExpenses
  .map((tx, i) => `${i + 1}. ${tx.description} - ₹${tx.amount.toLocaleString()}`)
  .join('\n')}
    `;

    downloadFile(reportText, `${report.name.replace(/\s+/g, '_')}.txt`, 'text/plain');
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCategory = (category: TransactionCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Generate Reports</h2>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Report Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
              { value: 'custom', label: 'Custom Range' },
              { value: 'tax', label: 'Tax Report' },
              { value: 'category', label: 'By Category' }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value as any)}
                className={reportType === type.value ? 'btn-primary' : 'btn-secondary'}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'pdf', label: 'PDF' },
                { value: 'excel', label: 'Excel' },
                { value: 'csv', label: 'CSV' }
              ].map(fmt => (
                <button
                  key={fmt.value}
                  onClick={() => setFormat(fmt.value as any)}
                  className={format === fmt.value ? 'btn-primary' : 'btn-secondary'}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {reportType === 'category' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Categories
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {Object.values(TransactionCategory).map(category => (
                <label key={category} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">{category}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleGenerateReport}
          className="btn-primary w-full"
        >
          Generate Report
        </button>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Report Preview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-slate-500">Total Income</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{reportData.totalIncome.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              ₹{reportData.totalExpenses.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Net Savings</p>
            <p className={`text-2xl font-bold ${reportData.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{reportData.netSavings.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Savings Rate</p>
            <p className="text-2xl font-bold text-slate-900">
              {reportData.savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-slate-800 mb-3">Category Breakdown</h4>
            <div className="space-y-2">
              {Object.entries(reportData.categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">{category}</span>
                    <span className="text-sm font-medium text-slate-900">₹{amount.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-slate-800 mb-3">Key Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Transaction Count</span>
                <span className="text-sm font-medium text-slate-900">{reportData.transactionCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Average Transaction</span>
                <span className="text-sm font-medium text-slate-900">₹{reportData.averageTransactionSize.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Daily Average Spending</span>
                <span className="text-sm font-medium text-slate-900">₹{reportData.averageDailySpending.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
