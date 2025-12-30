
import React, { useState } from 'react';
import { CreditCardBill } from '../types';
import { generateMonthOptions, BILL_CATEGORIES } from '../constants';

interface CardTrackerProps {
  bills: CreditCardBill[];
  onAdd: (bill: CreditCardBill) => void;
  onUpdate: (id: string, updates: Partial<CreditCardBill>) => void;
  onDelete: (id: string) => void;
}

const CardTracker: React.FC<CardTrackerProps> = ({ bills, onAdd, onUpdate, onDelete }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(generateMonthOptions()[23]); // Defaults roughly to mid-2025
  const [isAdding, setIsAdding] = useState(false);
  const [newBill, setNewBill] = useState<Partial<CreditCardBill>>({
    cardName: '',
    category: BILL_CATEGORIES[0],
    dueDate: '',
    month: selectedMonth,
    isEmi: false,
    totalAmount: 0,
    monthlyAmount: 0,
    paidAmount: 0,
    lastPaymentDate: '',
  });

  const filteredBills = bills.filter(b => b.month === selectedMonth);

  const totalDue = filteredBills.reduce((acc, b) => acc + b.monthlyAmount, 0);
  const totalPaid = filteredBills.reduce((acc, b) => acc + b.paidAmount, 0);
  const status = totalPaid >= totalDue ? 'Success' : 'Check Payment';

  const handleSave = () => {
    if (!newBill.cardName || !newBill.monthlyAmount) return;
    const bill: CreditCardBill = {
      id: Date.now().toString(),
      cardName: newBill.cardName || '',
      category: newBill.category || BILL_CATEGORIES[0],
      dueDate: newBill.dueDate || '',
      month: selectedMonth,
      isEmi: newBill.isEmi || false,
      emiDetails: newBill.emiDetails,
      totalAmount: Number(newBill.totalAmount) || 0,
      tenure: newBill.tenure,
      monthlyAmount: Number(newBill.monthlyAmount) || 0,
      paidAmount: Number(newBill.paidAmount) || 0,
      lastPaymentDate: newBill.lastPaymentDate
    };
    onAdd(bill);
    setIsAdding(false);
    setNewBill({ cardName: '', category: BILL_CATEGORIES[0], monthlyAmount: 0, paidAmount: 0, lastPaymentDate: '' });
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">CC Bills</h2>
        <select 
          className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm outline-none"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {generateMonthOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      {/* Summary Header */}
      <div className={`p-4 rounded-xl flex justify-between items-center shadow-sm ${status === 'Success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
        <div>
          <p className="text-xs uppercase font-bold opacity-70">Month Summary</p>
          <p className="text-lg font-bold">₹{totalPaid} / ₹{totalDue}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold">{status}</p>
          <div className="w-24 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
            <div className={`h-full ${status === 'Success' ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${Math.min((totalPaid / (totalDue || 1)) * 100, 100)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100 no-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3">Card Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">EMI Details</th>
              <th className="px-4 py-3">Monthly Due</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBills.map(bill => (
              <tr key={bill.id}>
                <td className="px-4 py-4 font-medium">{bill.cardName}</td>
                <td className="px-4 py-4">
                  <span className="px-2 py-1 bg-gray-100 rounded text-[10px] text-gray-600 font-semibold">{bill.category}</span>
                </td>
                <td className="px-4 py-4 text-gray-500">
                  <div className="text-[10px]">
                    <p><span className="font-bold">Due:</span> {bill.dueDate || 'N/A'}</p>
                    <p><span className="font-bold">Paid:</span> {bill.lastPaymentDate || '-'}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {bill.isEmi ? (
                    <div className="text-[10px]">
                      <p className="font-semibold">{bill.emiDetails}</p>
                      <p className="text-gray-400">Tenure: {bill.tenure}</p>
                    </div>
                  ) : <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-4 font-bold text-gray-700">₹{bill.monthlyAmount}</td>
                <td className="px-4 py-4 space-y-1">
                  <input 
                    type="number" 
                    placeholder="Amt"
                    className="w-20 bg-gray-50 border rounded p-1 text-center block text-xs"
                    value={bill.paidAmount}
                    onChange={(e) => onUpdate(bill.id, { paidAmount: Number(e.target.value) })}
                  />
                  <input 
                    type="date"
                    className="w-20 bg-gray-50 border rounded p-1 text-center block text-[9px]"
                    value={bill.lastPaymentDate || ''}
                    onChange={(e) => onUpdate(bill.id, { lastPaymentDate: e.target.value })}
                  />
                </td>
                <td className={`px-4 py-4 font-bold ${bill.monthlyAmount - bill.paidAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  ₹{bill.monthlyAmount - bill.paidAmount}
                </td>
                <td className="px-4 py-4">
                  <button onClick={() => onDelete(bill.id)} className="text-red-400 hover:text-red-600 p-2">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {filteredBills.length === 0 && !isAdding && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">No bills found for this month.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdding ? (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 space-y-4 fixed inset-x-4 bottom-24 z-50 overflow-y-auto max-h-[75vh]">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Add New Bill</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-400"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Card Name</label>
              <input 
                placeholder="e.g. HDFC Regalia" 
                className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                value={newBill.cardName} 
                onChange={e => setNewBill({...newBill, cardName: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Category</label>
              <select 
                className="w-full border p-3 rounded-xl outline-none bg-white" 
                value={newBill.category}
                onChange={e => setNewBill({...newBill, category: e.target.value})}
              >
                {BILL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Due Date</label>
              <input 
                type="date" 
                className="w-full border p-3 rounded-xl outline-none" 
                value={newBill.dueDate} 
                onChange={e => setNewBill({...newBill, dueDate: e.target.value})}
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Last Payment Date</label>
              <input 
                type="date" 
                className="w-full border p-3 rounded-xl outline-none" 
                value={newBill.lastPaymentDate} 
                onChange={e => setNewBill({...newBill, lastPaymentDate: e.target.value})}
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Monthly Due (₹)</label>
              <input 
                type="number" 
                placeholder="0" 
                className="w-full border p-3 rounded-xl outline-none" 
                value={newBill.monthlyAmount} 
                onChange={e => setNewBill({...newBill, monthlyAmount: Number(e.target.value)})}
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Paid Amount (₹)</label>
              <input 
                type="number" 
                placeholder="0" 
                className="w-full border p-3 rounded-xl outline-none" 
                value={newBill.paidAmount} 
                onChange={e => setNewBill({...newBill, paidAmount: Number(e.target.value)})}
              />
            </div>
            <div className="col-span-2 flex items-center space-x-2 bg-indigo-50 p-2 rounded-lg">
              <input 
                type="checkbox" 
                id="isEmi" 
                className="w-4 h-4 text-indigo-600 rounded"
                checked={newBill.isEmi} 
                onChange={e => setNewBill({...newBill, isEmi: e.target.checked})}
              />
              <label htmlFor="isEmi" className="text-sm font-semibold text-indigo-700">This is an EMI / Recurring</label>
            </div>
            {newBill.isEmi && (
              <>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">EMI Item</label>
                  <input 
                    placeholder="e.g. iPhone" 
                    className="w-full border p-3 rounded-xl outline-none" 
                    value={newBill.emiDetails} 
                    onChange={e => setNewBill({...newBill, emiDetails: e.target.value})}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Tenure</label>
                  <input 
                    placeholder="e.g. 1/12" 
                    className="w-full border p-3 rounded-xl outline-none" 
                    value={newBill.tenure} 
                    onChange={e => setNewBill({...newBill, tenure: e.target.value})}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex space-x-3 pt-2">
            <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg">Save Bill</button>
            <button onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">Cancel</button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsAdding(true)}
          className="fixed bottom-28 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl z-40 animate-bounce"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      )}
    </div>
  );
};

export default CardTracker;
