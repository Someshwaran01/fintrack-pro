
import React, { useState, useMemo } from 'react';
import { Income, CreditCardBill, MedicalExpense, HomeExpense } from '../types';
import { dateToMonth, generateId } from '../utils/helpers';

interface IncomeTrackerProps {
  incomes: Income[];
  bills: CreditCardBill[];
  medical: MedicalExpense[];
  home: HomeExpense[];
  members: string[];
  onAddIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const IncomeTracker: React.FC<IncomeTrackerProps> = ({
  incomes,
  bills,
  medical,
  home,
  members,
  onAddIncome,
  onDeleteIncome,
  selectedMonth,
  onMonthChange
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);
  const [newIncome, setNewIncome] = useState<Partial<Income>>({
    month: selectedMonth,
    source: '',
    amount: 0,
    receivedDate: new Date().toISOString().split('T')[0],
    spender: members[0] || 'Owner',
    notes: ''
  });

  const months = [
    'Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'May-26', 'Jun-26',
    'Jul-26', 'Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'
  ];

  // Memoize filtered incomes to prevent recalculation on every render
  const filteredIncomes = useMemo(
    () => incomes.filter(i => i.month === selectedMonth),
    [incomes, selectedMonth]
  );

  const totalIncome = useMemo(
    () => filteredIncomes.reduce((acc, i) => acc + i.amount, 0),
    [filteredIncomes]
  );

  // Calculate totals by spender for current month
  const spenderTotals = useMemo(
    () => incomes
      .filter(i => i.month === selectedMonth)
      .reduce((acc, i) => {
        acc[i.spender] = (acc[i.spender] || 0) + i.amount;
        return acc;
      }, {} as Record<string, number>),
    [incomes, selectedMonth]
  );

  // Calculate expenses by spender for current month
  const spenderExpenses = useMemo(() => {
    const expenses = {} as Record<string, number>;

    // Add medical expenses
    medical.forEach(expense => {
      if (expense.spender && dateToMonth(expense.date) === selectedMonth) {
        expenses[expense.spender] = (expenses[expense.spender] || 0) + expense.amount;
      }
    });

    // Add home expenses
    home.forEach(expense => {
      if (expense.spender && dateToMonth(expense.date) === selectedMonth) {
        expenses[expense.spender] = (expenses[expense.spender] || 0) + expense.amount;
      }
    });

    return expenses;
  }, [medical, home, selectedMonth]);

  // Calculate available balance for each spender
  const spenderBalances = useMemo(() => {
    const balances = {} as Record<string, number>;
    members.forEach(spender => {
      const income = spenderTotals[spender] || 0;
      const expenses = spenderExpenses[spender] || 0;
      balances[spender] = income - expenses;
    });
    return balances;
  }, [spenderTotals, spenderExpenses, members]);

  const handleSave = () => {
    if (!newIncome.source || !newIncome.amount) {
      alert('Please fill in source and amount');
      return;
    }

    const income: Income = {
      id: generateId(),
      month: selectedMonth,
      source: newIncome.source || '',
      amount: Number(newIncome.amount) || 0,
      receivedDate: newIncome.receivedDate || '',
      spender: newIncome.spender || members[0] || 'Owner',
      notes: newIncome.notes || ''
    };

    onAddIncome(income);
    setIsAdding(false);
    setNewIncome({
      month: selectedMonth,
      source: '',
      amount: 0,
      receivedDate: new Date().toISOString().split('T')[0],
      spender: members[0] || 'Owner',
      notes: ''
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this income entry?')) {
      onDeleteIncome(id);
    }
  };

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            <i className="fa-solid fa-money-bill-wave mr-2 text-green-600"></i>
            Income Tracker
          </h1>
          <p className="text-xs text-gray-600">Track monthly income</p>
        </div>
        <select
          className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm outline-none"
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
        >
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="mb-4">
        <button
          onClick={() => setShowIncomeBreakdown(true)}
          className="w-full bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white shadow-lg text-left hover:from-green-600 hover:to-green-700 transition-all cursor-pointer"
        >
          <p className="text-xs opacity-90">Total Income</p>
          <p className="text-2xl font-bold">₹{totalIncome.toLocaleString()}</p>
        </button>
      </div>

      {/* Available Balance by Person */}
      {Object.keys(spenderBalances).length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
            <i className="fa-solid fa-wallet mr-2 text-purple-600"></i>
            Available Balance
          </h3>
          <div className="space-y-3">
            {(Object.entries(spenderBalances) as [string, number][]).map(([spender, balance]) => (
              <div key={spender} className={`p-3 rounded-lg ${balance >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <i className={`fa-solid fa-user text-sm ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}></i>
                    <span className="text-sm font-semibold text-gray-700">{spender}</span>
                  </div>
                  <span className={`text-lg font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{balance.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Income: </span>
                    <span className="font-semibold text-green-600">₹{(spenderTotals[spender] || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Expenses: </span>
                    <span className="font-semibold text-orange-600">₹{(spenderExpenses[spender] || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Income Entries Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
        <button
          onClick={() => setShowEntries(!showEntries)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-sm font-bold text-gray-800 flex items-center">
            <i className="fa-solid fa-list mr-2 text-blue-600"></i>
            Income Entries ({filteredIncomes.length})
          </h3>
          <i className={`fa-solid fa-chevron-${showEntries ? 'up' : 'down'} text-gray-400`}></i>
        </button>

        {showEntries && (
          <div className="space-y-3 mt-4">
            {filteredIncomes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <i className="fa-solid fa-inbox text-4xl mb-2"></i>
                <p className="text-sm">No income entries for {selectedMonth}</p>
              </div>
            ) : (
              filteredIncomes.map(income => (
                <div key={income.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{income.source}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        <i className="fa-solid fa-calendar mr-1"></i>
                        Received: {new Date(income.receivedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(income.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {income.spender}
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      ₹{income.amount.toLocaleString()}
                    </span>
                  </div>

                  {income.notes && (
                    <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                      {income.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Fixed Add Button */}
      <button
        onClick={() => setIsAdding(true)}
        className="fixed bottom-24 right-6 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-5 rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 hover-lift"
        title="Add Income"
      >
        <i className="fa-solid fa-plus text-2xl"></i>
      </button>

      {/* Add Income Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-12">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-bold text-lg">Add Income</h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-grow pb-4 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Month</label>
                <input
                  type="text"
                  value={selectedMonth}
                  disabled
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Source *</label>
                <input
                  type="text"
                  placeholder="e.g., Salary, Bonus, Freelance"
                  value={newIncome.source}
                  onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newIncome.amount || ''}
                  onChange={(e) => setNewIncome({ ...newIncome, amount: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Received Date</label>
                <input
                  type="date"
                  value={newIncome.receivedDate}
                  onChange={(e) => setNewIncome({ ...newIncome, receivedDate: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Person</label>
                <select
                  value={newIncome.spender}
                  onChange={(e) => setNewIncome({ ...newIncome, spender: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {members.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Notes</label>
                <textarea
                  placeholder="Optional notes"
                  value={newIncome.notes}
                  onChange={(e) => setNewIncome({ ...newIncome, notes: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-4 shrink-0 pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Save Income
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Income Breakdown Modal */}
      {showIncomeBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-12">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center">
                <i className="fa-solid fa-chart-pie mr-2 text-green-600"></i>
                Income by Person
              </h3>
              <button onClick={() => setShowIncomeBreakdown(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="space-y-3">
              {Object.keys(spenderTotals).length > 0 ? (
                Object.entries(spenderTotals).map(([spender, amount]) => (
                  <div key={spender} className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-user text-green-600"></i>
                        <span className="text-sm font-semibold text-gray-700">{spender}</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">₹{amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <i className="fa-solid fa-inbox text-4xl mb-2"></i>
                  <p className="text-sm">No income data for {selectedMonth}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-700">Total Income:</span>
                <span className="text-xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setShowIncomeBreakdown(false)}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeTracker;
