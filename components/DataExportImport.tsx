import React, { useState } from 'react';
import { Transaction, TransactionCategory } from '../types';
import { ExportFormat } from '../types-extended';

interface DataExportImportProps {
  transactions: Transaction[];
  onImportTransactions: (transactions: Transaction[]) => void;
  onExportData: (format: ExportFormat) => void;
}

export const DataExportImport: React.FC<DataExportImportProps> = ({
  transactions,
  onImportTransactions,
  onExportData
}) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>({
    format: 'csv',
    includeAttachments: false,
    dateRange: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    categories: [],
    accounts: []
  });

  const [importStatus, setImportStatus] = useState<{
    status: 'idle' | 'importing' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus({ status: 'importing', message: 'Processing file...' });

    try {
      const text = await file.text();
      let parsedTransactions: Transaction[] = [];

      if (file.name.endsWith('.csv')) {
        parsedTransactions = parseCSV(text);
      } else if (file.name.endsWith('.json')) {
        parsedTransactions = parseJSON(text);
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON files.');
      }

      if (parsedTransactions.length === 0) {
        throw new Error('No valid transactions found in the file.');
      }

      onImportTransactions(parsedTransactions);
      setImportStatus({ 
        status: 'success', 
        message: `Successfully imported ${parsedTransactions.length} transactions.` 
      });
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      setImportStatus({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to import file.' 
      });
    }

    // Clear status after 5 seconds
    setTimeout(() => {
      setImportStatus({ status: 'idle', message: '' });
    }, 5000);
  };

  const parseCSV = (csvText: string): Transaction[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must contain headers and at least one transaction.');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const transactions: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const transaction: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (header.includes('date')) {
          transaction.date = value;
        } else if (header.includes('description')) {
          transaction.description = value;
        } else if (header.includes('amount')) {
          transaction.amount = parseFloat(value) || 0;
        } else if (header.includes('category')) {
          transaction.category = value;
        } else if (header.includes('type')) {
          transaction.type = value.toUpperCase();
        }
      });

      // Validate required fields
      if (!transaction.date || !transaction.description || !transaction.amount) {
        continue; // Skip invalid rows
      }

      // Set defaults for missing fields
      transaction.id = `import_${Date.now()}_${i}`;
      transaction.category = transaction.category || TransactionCategory.OTHER;
      transaction.type = transaction.type || 'DEBIT';

      // Validate category
      if (!Object.values(TransactionCategory).includes(transaction.category)) {
        transaction.category = TransactionCategory.OTHER;
      }

      // Validate type
      if (transaction.type !== 'DEBIT' && transaction.type !== 'CREDIT') {
        transaction.type = 'DEBIT';
      }

      transactions.push(transaction as Transaction);
    }

    return transactions;
  };

  const parseJSON = (jsonText: string): Transaction[] => {
    try {
      const data = JSON.parse(jsonText);
      let transactions: Transaction[] = [];

      if (Array.isArray(data)) {
        transactions = data;
      } else if (data.transactions && Array.isArray(data.transactions)) {
        transactions = data.transactions;
      } else {
        throw new Error('Invalid JSON format. Expected array or object with transactions array.');
      }

      // Validate and clean each transaction
      return transactions.map((tx: any, index: number) => {
        if (!tx.date || !tx.description || tx.amount === undefined) {
          throw new Error(`Invalid transaction at index ${index}: missing required fields.`);
        }

        return {
          id: tx.id || `import_${Date.now()}_${index}`,
          date: tx.date,
          description: tx.description,
          amount: Number(tx.amount),
          category: Object.values(TransactionCategory).includes(tx.category) ? tx.category : TransactionCategory.OTHER,
          type: (tx.type === 'DEBIT' || tx.type === 'CREDIT') ? tx.type : 'DEBIT',
          originalText: tx.originalText
        };
      });
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExport = () => {
    onExportData(exportFormat);
  };

  const toggleCategory = (category: TransactionCategory) => {
    setExportFormat(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const startDate = new Date(exportFormat.dateRange.start);
    const endDate = new Date(exportFormat.dateRange.end);
    
    const dateMatch = txDate >= startDate && txDate <= endDate;
    const categoryMatch = exportFormat.categories.length === 0 || exportFormat.categories.includes(tx.category);
    
    return dateMatch && categoryMatch;
  });

  const getExportPreview = () => {
    return `${filteredTransactions.length} transactions will be exported`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Data Import & Export</h2>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Import Transactions</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select File (CSV or JSON)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileImport}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          {importStatus.status !== 'idle' && (
            <div className={`p-4 rounded-lg ${
              importStatus.status === 'success' ? 'bg-green-50 text-green-800' :
              importStatus.status === 'error' ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              <div className="flex items-center">
                {importStatus.status === 'importing' && (
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span className="text-sm font-medium">{importStatus.message}</span>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-medium text-slate-800 mb-2">Supported Formats:</h4>
            <div className="space-y-2 text-sm text-slate-600">
              <div>
                <strong>CSV:</strong> Files with headers: date, description, amount, category, type
              </div>
              <div>
                <strong>JSON:</strong> Array of transaction objects or object with transactions array
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Export Transactions</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
                { value: 'excel', label: 'Excel', description: 'Excel spreadsheet' },
                { value: 'json', label: 'JSON', description: 'JSON data format' }
              ].map(format => (
                <button
                  key={format.value}
                  onClick={() => setExportFormat(prev => ({ ...prev, format: format.value as any }))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    exportFormat.format === format.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-800">{format.label}</div>
                  <div className="text-xs text-slate-500">{format.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={exportFormat.dateRange.start}
                  onChange={(e) => setExportFormat(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={exportFormat.dateRange.end}
                  onChange={(e) => setExportFormat(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Categories (optional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {Object.values(TransactionCategory).map(category => (
                <label key={category} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportFormat.categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">{category}</span>
                </label>
              ))}
            </div>
            {exportFormat.categories.length > 0 && (
              <button
                onClick={() => setExportFormat(prev => ({ ...prev, categories: [] }))}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">{getExportPreview()}</span>
              <button
                onClick={handleExport}
                disabled={filteredTransactions.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Data Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">{transactions.length}</div>
            <div className="text-sm text-slate-600">Total Transactions</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">
              {new Set(transactions.map(tx => tx.category)).size}
            </div>
            <div className="text-sm text-slate-600">Categories Used</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">
              {transactions.length > 0 
                ? Math.ceil((new Date().getTime() - new Date(transactions[0].date).getTime()) / (1000 * 60 * 60 * 24))
                : 0
              }
            </div>
            <div className="text-sm text-slate-600">Days of Data</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Data Backup Recommendation</p>
              <p>Regularly export your data to prevent data loss. Consider setting up automatic monthly backups.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
