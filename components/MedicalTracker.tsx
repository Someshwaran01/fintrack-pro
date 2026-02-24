
import React, { useState } from 'react';
import { MedicalExpense, PaymentMethod, Spender } from '../types';
import { PAYMENT_METHODS, SPENDERS } from '../constants';

interface MedicalTrackerProps {
  expenses: MedicalExpense[];
  onAdd: (expense: MedicalExpense) => void;
  onDelete: (id: string) => void;
}

const MedicalTracker: React.FC<MedicalTrackerProps> = ({ expenses, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [filterMethod, setFilterMethod] = useState<string>('All');
  const [filterSpender, setFilterSpender] = useState<string>('All');
  const [newExpense, setNewExpense] = useState<Partial<MedicalExpense>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: PaymentMethod.UPI,
    description: '',
    spender: Spender.DEVI
  });

  const filteredExpenses = expenses.filter(e =>
    (filterMethod === 'All' || e.paymentMethod === filterMethod) &&
    (filterSpender === 'All' || (e.spender || 'Unknown') === filterSpender)
  );

  // Show only recent 6 expenses by default
  const displayedExpenses = showAllExpenses ? filteredExpenses : filteredExpenses.slice(0, 6);
  const hasMoreExpenses = filteredExpenses.length > 6;

  const totalAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Group expenses by spender
  const spenderTotals = expenses.reduce((acc, e) => {
    const spenderKey = e.spender || 'Unknown';
    acc[spenderKey] = (acc[spenderKey] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleSave = () => {
    if (!newExpense.amount) return;
    const expense: MedicalExpense = {
      id: Date.now().toString(),
      date: newExpense.date || '',
      amount: Number(newExpense.amount) || 0,
      paymentMethod: newExpense.paymentMethod || PaymentMethod.CASH,
      description: newExpense.description || '',
      spender: newExpense.spender || Spender.DEVI
    };
    onAdd(expense);
    setIsAdding(false);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: PaymentMethod.UPI,
      description: '',
      spender: Spender.DEVI
    });
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Medical Expenses</h2>
        <div className="flex gap-2">
          <select
            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            value={filterSpender}
            onChange={(e) => setFilterSpender(e.target.value)}
          >
            <option value="All">All Spenders</option>
            {SPENDERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <option value="All">All Methods</option>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg">
        <p className="text-xs uppercase font-bold opacity-80 tracking-wider">Filtered Total</p>
        <p className="text-3xl font-bold">₹{totalAmount.toLocaleString()}</p>

        {/* Spender-wise totals */}
        {filterMethod === 'All' && filterSpender === 'All' && Object.keys(spenderTotals).length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs font-bold mb-2">By Spender:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(spenderTotals).map(([spender, amt]) => (
                <span key={spender} className="text-xs bg-white/20 px-3 py-1 rounded-full font-semibold">
                  {spender}: ₹{amt.toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {displayedExpenses.map(expense => (
          <div key={expense.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                <i className={`fa-solid ${expense.paymentMethod === PaymentMethod.CASH ? 'fa-money-bill' : expense.paymentMethod === PaymentMethod.UPI ? 'fa-mobile-screen' : 'fa-credit-card'}`}></i>
              </div>
              <div>
                <p className="font-bold text-gray-800">₹{expense.amount}</p>
                <p className="text-xs text-gray-500">{expense.description || 'Medical checkup'}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{expense.date} • {expense.paymentMethod} • <span className="font-semibold text-blue-600">{expense.spender || 'N/A'}</span></p>
              </div>
            </div>
            <button onClick={() => onDelete(expense.id)} className="text-gray-300 hover:text-red-500 p-2">
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        ))}
        {filteredExpenses.length === 0 && (
          <div className="text-center py-10 text-gray-400">No medical expenses found.</div>
        )}
        {hasMoreExpenses && (
          <button
            onClick={() => setShowAllExpenses(!showAllExpenses)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center space-x-2"
          >
            <span>{showAllExpenses ? 'Show Less' : `Show All (${filteredExpenses.length - 6} more)`}</span>
            <i className={`fa-solid fa-chevron-${showAllExpenses ? 'up' : 'down'}`}></i>
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100 space-y-4 fixed inset-x-4 bottom-24 z-50">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-blue-700">New Medical Expense</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-400"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="medical-expense-date" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Expense Date</label>
              <input
                type="date"
                id="medical-expense-date"
                name="medical-expense-date"
                className="w-full border p-3 rounded-xl outline-none"
                value={newExpense.date}
                onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="medical-expense-amount" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Amount (₹)</label>
              <input
                type="number"
                id="medical-expense-amount"
                name="medical-expense-amount"
                placeholder="0"
                className="w-full border p-3 rounded-xl outline-none text-lg font-bold"
                value={newExpense.amount}
                onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
              />
            </div>
            <div>
              <label htmlFor="medical-payment-method" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Payment Method</label>
              <select
                id="medical-payment-method"
                name="medical-payment-method"
                className="w-full border p-3 rounded-xl outline-none bg-white"
                value={newExpense.paymentMethod}
                onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value as PaymentMethod })}
              >
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="medical-spender" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Spender</label>
              <select
                id="medical-spender"
                name="medical-spender"
                className="w-full border p-3 rounded-xl outline-none bg-white"
                value={newExpense.spender}
                onChange={e => setNewExpense({ ...newExpense, spender: e.target.value as Spender })}
              >
                {SPENDERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="medical-description" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Description</label>
              <input
                id="medical-description"
                name="medical-description"
                placeholder="e.g. Lab tests, Pharmacy"
                className="w-full border p-3 rounded-xl outline-none"
                value={newExpense.description}
                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg">Save Expense</button>
            <button onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="fixed bottom-28 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl z-40"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      )}
    </div>
  );
};

export default MedicalTracker;
