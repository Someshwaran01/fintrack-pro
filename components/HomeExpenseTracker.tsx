
import React, { useState } from 'react';
import { HomeExpense, PaymentMethod } from '../types';
import { PAYMENT_METHODS, HOME_EXPENSE_CATEGORIES } from '../constants';

interface HomeExpenseTrackerProps {
    expenses: HomeExpense[];
    onAdd: (expense: HomeExpense) => void;
    onDelete: (id: string) => void;
}

const HomeExpenseTracker: React.FC<HomeExpenseTrackerProps> = ({ expenses, onAdd, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [newExpense, setNewExpense] = useState<Partial<HomeExpense>>({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        paymentMethod: PaymentMethod.UPI,
        category: 'Groceries',
        description: ''
    });

    const filteredExpenses = expenses.filter(e => filterCategory === 'All' || e.category === filterCategory);
    const totalAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

    // Group expenses by category for summary
    const categoryTotals = filteredExpenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
    }, {} as Record<string, number>);

    const handleSave = () => {
        if (!newExpense.amount) return;
        const expense: HomeExpense = {
            id: Date.now().toString(),
            date: newExpense.date || '',
            amount: Number(newExpense.amount) || 0,
            paymentMethod: newExpense.paymentMethod || PaymentMethod.UPI,
            category: newExpense.category || 'Other',
            description: newExpense.description || ''
        };
        onAdd(expense);
        setIsAdding(false);
        setNewExpense({
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            paymentMethod: PaymentMethod.UPI,
            category: 'Groceries',
            description: ''
        });
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            'Groceries': 'fa-cart-shopping',
            'Rent': 'fa-house',
            'Electricity': 'fa-bolt',
            'Water': 'fa-droplet',
            'Gas': 'fa-fire',
            'Internet': 'fa-wifi',
            'Maintenance': 'fa-screwdriver-wrench',
            'Furniture': 'fa-couch',
            'Kitchen': 'fa-utensils',
            'Cleaning': 'fa-broom',
            'Other': 'fa-home'
        };
        return icons[category] || 'fa-home';
    };

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Home Expenses</h2>
                <select
                    className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm outline-none"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="All">All Categories</option>
                    {HOME_EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
                <p className="text-xs uppercase font-bold opacity-80 tracking-wider">Filtered Total</p>
                <p className="text-3xl font-bold">₹{totalAmount.toLocaleString()}</p>
                {filterCategory === 'All' && Object.keys(categoryTotals).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-xs font-bold mb-2">Top Categories:</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(categoryTotals)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 3)
                                .map(([cat, amt]) => (
                                    <span key={cat} className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                        {cat}: ₹{amt.toLocaleString()}
                                    </span>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {filteredExpenses.map(expense => (
                    <div key={expense.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                                <i className={`fa-solid ${getCategoryIcon(expense.category)}`}></i>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">₹{expense.amount.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{expense.description || expense.category}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    {expense.date} • {expense.category} • {expense.paymentMethod}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (window.confirm('Delete this home expense?')) {
                                    onDelete(expense.id);
                                }
                            }}
                            className="text-gray-300 hover:text-red-500 p-2"
                        >
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </div>
                ))}
                {filteredExpenses.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        <i className="fa-solid fa-home text-4xl mb-3 opacity-20"></i>
                        <p>No home expenses found.</p>
                    </div>
                )}
            </div>

            {isAdding ? (
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-green-100 space-y-4 fixed inset-x-4 bottom-24 z-50 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-green-700">New Home Expense</h3>
                        <button onClick={() => setIsAdding(false)} className="text-gray-400"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Expense Date</label>
                            <input
                                type="date"
                                className="w-full border p-3 rounded-xl outline-none"
                                value={newExpense.date}
                                onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Category</label>
                            <select
                                className="w-full border p-3 rounded-xl outline-none bg-white"
                                value={newExpense.category}
                                onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                            >
                                {HOME_EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Amount (₹)</label>
                            <input
                                type="number"
                                placeholder="0"
                                className="w-full border p-3 rounded-xl outline-none text-lg font-bold"
                                value={newExpense.amount}
                                onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Payment Method</label>
                            <select
                                className="w-full border p-3 rounded-xl outline-none bg-white"
                                value={newExpense.paymentMethod}
                                onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value as PaymentMethod })}
                            >
                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Description</label>
                            <input
                                placeholder="e.g. Monthly rent, Grocery shopping"
                                className="w-full border p-3 rounded-xl outline-none"
                                value={newExpense.description}
                                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex space-x-3 pt-2">
                        <button onClick={handleSave} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg">Save Expense</button>
                        <button onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">Cancel</button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="fixed bottom-28 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl z-40"
                >
                    <i className="fa-solid fa-plus"></i>
                </button>
            )}
        </div>
    );
};

export default HomeExpenseTracker;
