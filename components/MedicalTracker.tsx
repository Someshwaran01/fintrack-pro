
import React, { useState } from 'react';
import { MedicalExpense, PaymentMethod } from '../types';
import { PAYMENT_METHODS } from '../constants';

interface MedicalTrackerProps {
  expenses: MedicalExpense[];
  onAdd: (expense: MedicalExpense) => void;
  onDelete: (id: string) => void;
}

const MedicalTracker: React.FC<MedicalTrackerProps> = ({ expenses, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filterMethod, setFilterMethod] = useState<string>('All');
  const [newExpense, setNewExpense] = useState<Partial<MedicalExpense>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: PaymentMethod.UPI,
    description: ''
  });

  const filteredExpenses = expenses.filter(e => filterMethod === 'All' || e.paymentMethod === filterMethod);
  const totalAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const handleSave = () => {
    if (!newExpense.amount) return;
    const expense: MedicalExpense = {
      id: Date.now().toString(),
      date: newExpense.date || '',
      amount: Number(newExpense.amount) || 0,
      paymentMethod: newExpense.paymentMethod || PaymentMethod.CASH,
      description: newExpense.description || ''
    };
    onAdd(expense);
    setIsAdding(false);
    setNewExpense({ date: new Date().toISOString().split('T')[0], amount: 0, paymentMethod: PaymentMethod.UPI, description: '' });
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Medical Expenses</h2>
        <select 
          className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm outline-none"
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
        >
          <option value="All">All Methods</option>
          {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg">
        <p className="text-xs uppercase font-bold opacity-80 tracking-wider">Filtered Total</p>
        <p className="text-3xl font-bold">₹{totalAmount.toLocaleString()}</p>
      </div>

      <div className="space-y-3">
        {filteredExpenses.map(expense => (
          <div key={expense.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                <i className={`fa-solid ${expense.paymentMethod === PaymentMethod.CASH ? 'fa-money-bill' : expense.paymentMethod === PaymentMethod.UPI ? 'fa-mobile-screen' : 'fa-credit-card'}`}></i>
              </div>
              <div>
                <p className="font-bold text-gray-800">₹{expense.amount}</p>
                <p className="text-xs text-gray-500">{expense.description || 'Medical checkup'}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{expense.date} • {expense.paymentMethod}</p>
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
      </div>

      {isAdding ? (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100 space-y-4 fixed inset-x-4 bottom-24 z-50">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-blue-700">New Medical Expense</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-400"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Expense Date</label>
              <input 
                type="date" 
                className="w-full border p-3 rounded-xl outline-none" 
                value={newExpense.date} 
                onChange={e => setNewExpense({...newExpense, date: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Amount (₹)</label>
              <input 
                type="number" 
                placeholder="0" 
                className="w-full border p-3 rounded-xl outline-none text-lg font-bold" 
                value={newExpense.amount} 
                onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Payment Method</label>
              <select 
                className="w-full border p-3 rounded-xl outline-none bg-white" 
                value={newExpense.paymentMethod} 
                onChange={e => setNewExpense({...newExpense, paymentMethod: e.target.value as PaymentMethod})}
              >
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Description</label>
              <input 
                placeholder="e.g. Lab tests, Pharmacy" 
                className="w-full border p-3 rounded-xl outline-none" 
                value={newExpense.description} 
                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
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
