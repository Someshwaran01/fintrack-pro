import React, { useState } from 'react';
import { MedicalExpense, HomeExpense, PaymentMethod, Spender } from '../types';
import { PAYMENT_METHODS, HOME_EXPENSE_CATEGORIES, SPENDERS } from '../constants';
import { generateId } from '../utils/helpers';

interface ExpenseTrackerProps {
    medicalExpenses: MedicalExpense[];
    homeExpenses: HomeExpense[];
    onAddMedical: (expense: MedicalExpense) => void;
    onDeleteMedical: (id: string) => void;
    onAddHome: (expense: HomeExpense) => void;
    onDeleteHome: (id: string) => void;
}

type ExpenseType = 'medical' | 'home';

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
    medicalExpenses,
    homeExpenses,
    onAddMedical,
    onDeleteMedical,
    onAddHome,
    onDeleteHome
}) => {
    const [activeExpenseTab, setActiveExpenseTab] = useState<ExpenseType>('medical');
    const [isAdding, setIsAdding] = useState(false);
    const [showAllExpenses, setShowAllExpenses] = useState(false);
    const [filterMethod, setFilterMethod] = useState<string>('All');
    const [filterSpender, setFilterSpender] = useState<string>('All');
    const [filterCategory, setFilterCategory] = useState<string>('All');

    const [newMedicalExpense, setNewMedicalExpense] = useState<Partial<MedicalExpense>>({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        paymentMethod: PaymentMethod.UPI,
        description: '',
        spender: Spender.DEVI
    });

    const [newHomeExpense, setNewHomeExpense] = useState<Partial<HomeExpense>>({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        paymentMethod: PaymentMethod.UPI,
        category: 'Groceries',
        description: '',
        spender: Spender.DEVI
    });

    const filteredMedicalExpenses = medicalExpenses.filter(e =>
        (filterMethod === 'All' || e.paymentMethod === filterMethod) &&
        (filterSpender === 'All' || (e.spender || 'Unknown') === filterSpender)
    );

    const filteredHomeExpenses = homeExpenses.filter(e =>
        (filterCategory === 'All' || e.category === filterCategory) &&
        (filterSpender === 'All' || (e.spender || 'Unknown') === filterSpender)
    );

    const currentExpenses = activeExpenseTab === 'medical' ? filteredMedicalExpenses : filteredHomeExpenses;
    const displayedExpenses = showAllExpenses ? currentExpenses : currentExpenses.slice(0, 6);
    const hasMoreExpenses = currentExpenses.length > 6;

    const totalMedical = filteredMedicalExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalHome = filteredHomeExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalAmount = activeExpenseTab === 'medical' ? totalMedical : totalHome;

    const spenderTotals = (activeExpenseTab === 'medical' ? medicalExpenses : homeExpenses).reduce((acc, e: any) => {
        const spenderKey = e.spender || 'Unknown';
        acc[spenderKey] = (acc[spenderKey] || 0) + e.amount;
        return acc;
    }, {} as Record<string, number>);

    const categoryTotals = filteredHomeExpenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
    }, {} as Record<string, number>);

    const handleSaveMedical = () => {
        if (!newMedicalExpense.amount) return;
        const expense: MedicalExpense = {
            id: generateId(),
            date: newMedicalExpense.date || '',
            amount: Number(newMedicalExpense.amount) || 0,
            paymentMethod: newMedicalExpense.paymentMethod || PaymentMethod.CASH,
            description: newMedicalExpense.description || '',
            spender: newMedicalExpense.spender || Spender.DEVI
        };
        onAddMedical(expense);
        setIsAdding(false);
        setNewMedicalExpense({
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            paymentMethod: PaymentMethod.UPI,
            description: '',
            spender: Spender.DEVI
        });
    };

    const handleSaveHome = () => {
        if (!newHomeExpense.amount) return;
        const expense: HomeExpense = {
            id: generateId(),
            date: newHomeExpense.date || '',
            amount: Number(newHomeExpense.amount) || 0,
            paymentMethod: newHomeExpense.paymentMethod || PaymentMethod.UPI,
            category: newHomeExpense.category || 'Other',
            description: newHomeExpense.description || '',
            spender: newHomeExpense.spender || Spender.DEVI
        };
        onAddHome(expense);
        setIsAdding(false);
        setNewHomeExpense({
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            paymentMethod: PaymentMethod.UPI,
            category: 'Groceries',
            description: '',
            spender: Spender.DEVI
        });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            if (activeExpenseTab === 'medical') {
                onDeleteMedical(id);
            } else {
                onDeleteHome(id);
            }
        }
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            'Groceries': 'fa-cart-shopping',
            'Rent': 'fa-house',
            'Electricity': 'fa-bolt',
            'Water': 'fa-droplet',
            'Gas': 'fa-fire',
            'Internet': 'fa-wifi',
            'Furniture': 'fa-couch',
            'Fuel': 'fa-gas-pump',
            'Outing': 'fa-utensils',
            'Savings': 'fa-piggy-bank',
            'Loan Given': 'fa-hand-holding-dollar',
            'Other': 'fa-home'
        };
        return icons[category] || 'fa-home';
    };

    return (
        <div className="p-4 space-y-5 pb-24 animate-fadeIn">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold gradient-text flex items-center">
                    <i className="fa-solid fa-receipt mr-3 text-indigo-600"></i>
                    Expenses
                </h2>

                <div className="glass p-1.5 rounded-2xl shadow-md">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveExpenseTab('medical')}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${activeExpenseTab === 'medical'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                                : 'text-gray-600 hover:bg-gray-100 active-scale'
                                }`}
                        >
                            <i className="fa-solid fa-house-medical mr-2"></i>
                            Medical
                        </button>
                        <button
                            onClick={() => setActiveExpenseTab('home')}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${activeExpenseTab === 'home'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105'
                                : 'text-gray-600 hover:bg-gray-100 active-scale'
                                }`}
                        >
                            <i className="fa-solid fa-home mr-2"></i>
                            Home
                        </button>
                    </div>
                </div>

                <div className="flex gap-3">
                    <select
                        className="flex-1 glass border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-400 transition-all hover-lift"
                        value={filterSpender}
                        onChange={(e) => setFilterSpender(e.target.value)}
                    >
                        <option value="All">👥 All Spenders</option>
                        {SPENDERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {activeExpenseTab === 'medical' ? (
                        <select
                            className="flex-1 glass border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-400 transition-all hover-lift"
                            value={filterMethod}
                            onChange={(e) => setFilterMethod(e.target.value)}
                        >
                            <option value="All">💳 All Methods</option>
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    ) : (
                        <select
                            className="flex-1 glass border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-green-400 transition-all hover-lift"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="All">🏷️ All Categories</option>
                            {HOME_EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                </div>
            </div>

            <div className={`${activeExpenseTab === 'medical' ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700' : 'bg-gradient-to-br from-green-500 via-emerald-600 to-green-700'} p-7 rounded-3xl text-white shadow-2xl hover-lift animate-slideInUp`}>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase font-bold opacity-90 tracking-wider flex items-center">
                        <i className="fa-solid fa-filter mr-2"></i>
                        Filtered Total
                    </p>
                    <div className="bg-white/20 px-3 py-1 rounded-full">
                        <span className="text-xs font-semibold">{currentExpenses.length} items</span>
                    </div>
                </div>
                <p className="text-4xl font-black mb-1">₹{totalAmount.toLocaleString()}</p>

                {filterSpender === 'All' && Object.keys(spenderTotals).length > 0 && (
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

                {activeExpenseTab === 'home' && filterCategory === 'All' && Object.keys(categoryTotals).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-xs font-bold mb-2">By Category:</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(categoryTotals)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([cat, amt]) => (
                                    <span key={cat} className="text-xs bg-white/20 px-3 py-1 rounded-full font-semibold">
                                        {cat}: ₹{amt.toLocaleString()}
                                    </span>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {displayedExpenses.length === 0 ? (
                    <div className="glass text-center py-16 rounded-3xl">
                        <div className="mb-4">
                            <i className="fa-solid fa-inbox text-6xl text-gray-300"></i>
                        </div>
                        <p className="text-gray-500 font-semibold">No {activeExpenseTab} expenses yet</p>
                        <p className="text-sm text-gray-400 mt-2">Tap the + button to add your first expense</p>
                    </div>
                ) : (
                    displayedExpenses.map((expense: any) => (
                        <div key={expense.id} className="glass p-5 rounded-2xl shadow-md hover-lift border-2 border-transparent hover:border-indigo-200 transition-all animate-fadeIn">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {activeExpenseTab === 'home' && (
                                            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                                                <i className={`fa-solid ${getCategoryIcon(expense.category)} text-green-600`}></i>
                                            </div>
                                        )}
                                        {activeExpenseTab === 'medical' && (
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                                                <i className="fa-solid fa-house-medical text-blue-600"></i>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-gray-800">
                                                {activeExpenseTab === 'home' ? expense.category : 'Medical'}
                                            </h3>
                                            <p className="text-xs text-gray-500 flex items-center">
                                                <i className="fa-solid fa-calendar mr-1"></i>
                                                {new Date(expense.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 ml-12">{expense.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-xl font-black text-gray-800">
                                        ₹{expense.amount.toLocaleString()}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(expense.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all active-scale"
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 ml-12">
                                <span className="text-xs glass text-gray-700 px-3 py-1.5 rounded-full font-medium">
                                    <i className={`fa-solid ${expense.paymentMethod === 'Card' ? 'fa-credit-card' :
                                        expense.paymentMethod === 'UPI' ? 'fa-mobile' : 'fa-money-bill'
                                        } mr-1`}></i>
                                    {expense.paymentMethod}
                                </span>
                                <span className={`text-xs ${activeExpenseTab === 'medical' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                    } px-3 py-1.5 rounded-full font-medium`}>
                                    {expense.spender || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {hasMoreExpenses && (
                <button
                    onClick={() => setShowAllExpenses(!showAllExpenses)}
                    className="w-full glass border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-bold py-4 rounded-2xl transition-all hover-lift active-scale shadow-sm"
                >
                    <i className={`fa-solid ${showAllExpenses ? 'fa-chevron-up' : 'fa-chevron-down'} mr-2`}></i>
                    {showAllExpenses ? 'Show Less' : `Show All (${currentExpenses.length} total)`}
                </button>
            )}

            <button
                onClick={() => setIsAdding(true)}
                className={`fixed bottom-24 right-6 ${activeExpenseTab === 'medical'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600'
                    } text-white p-5 rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 hover-lift`}
                title={`Add ${activeExpenseTab === 'medical' ? 'Medical' : 'Home'} Expense`}
            >
                <i className="fa-solid fa-plus text-2xl"></i>
            </button>

            {isAdding && activeExpenseTab === 'medical' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
                    <div className="glass p-7 rounded-3xl shadow-2xl max-w-md w-full my-8 animate-slideInUp">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl flex items-center">
                                <i className="fa-solid fa-house-medical text-blue-600 mr-3"></i>
                                Add Medical Expense
                            </h3>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
                            >
                                <i className="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">📅 Date</label>
                                <input
                                    type="date"
                                    value={newMedicalExpense.date}
                                    onChange={(e) => setNewMedicalExpense({ ...newMedicalExpense, date: e.target.value })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">💰 Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={newMedicalExpense.amount || ''}
                                    onChange={(e) => setNewMedicalExpense({ ...newMedicalExpense, amount: Number(e.target.value) })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">💳 Payment Method</label>
                                <select
                                    value={newMedicalExpense.paymentMethod}
                                    onChange={(e) => setNewMedicalExpense({ ...newMedicalExpense, paymentMethod: e.target.value as PaymentMethod })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none transition-all"
                                >
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">👤 Spender</label>
                                <select
                                    value={newMedicalExpense.spender}
                                    onChange={(e) => setNewMedicalExpense({ ...newMedicalExpense, spender: e.target.value as Spender })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none transition-all"
                                >
                                    {SPENDERS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">📝 Description</label>
                                <textarea
                                    placeholder="What was it for?"
                                    value={newMedicalExpense.description}
                                    onChange={(e) => setNewMedicalExpense({ ...newMedicalExpense, description: e.target.value })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none transition-all"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="flex-1 glass border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all active-scale"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveMedical}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover-lift active-scale"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAdding && activeExpenseTab === 'home' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
                    <div className="glass p-7 rounded-3xl shadow-2xl max-w-md w-full my-8 max-h-[85vh] overflow-y-auto animate-slideInUp">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl flex items-center">
                                <i className="fa-solid fa-home text-green-600 mr-3"></i>
                                Add Home Expense
                            </h3>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
                            >
                                <i className="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">📅 Date</label>
                                <input
                                    type="date"
                                    value={newHomeExpense.date}
                                    onChange={(e) => setNewHomeExpense({ ...newHomeExpense, date: e.target.value })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-green-400 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">🏷️ Category</label>
                                <select
                                    value={newHomeExpense.category}
                                    onChange={(e) => setNewHomeExpense({ ...newHomeExpense, category: e.target.value })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-green-400 outline-none transition-all"
                                >
                                    {HOME_EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">💰 Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={newHomeExpense.amount || ''}
                                    onChange={(e) => setNewHomeExpense({ ...newHomeExpense, amount: Number(e.target.value) })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-green-400 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">💳 Payment Method</label>
                                <select
                                    value={newHomeExpense.paymentMethod}
                                    onChange={(e) => setNewHomeExpense({ ...newHomeExpense, paymentMethod: e.target.value as PaymentMethod })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-green-400 outline-none transition-all"
                                >
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">👤 Spender</label>
                                <select
                                    value={newHomeExpense.spender}
                                    onChange={(e) => setNewHomeExpense({ ...newHomeExpense, spender: e.target.value as Spender })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-green-400 outline-none transition-all"
                                >
                                    {SPENDERS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">📝 Description</label>
                                <textarea
                                    placeholder="What was it for?"
                                    value={newHomeExpense.description}
                                    onChange={(e) => setNewHomeExpense({ ...newHomeExpense, description: e.target.value })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-green-400 outline-none transition-all"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="flex-1 glass border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all active-scale"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveHome}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover-lift active-scale"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseTracker;
