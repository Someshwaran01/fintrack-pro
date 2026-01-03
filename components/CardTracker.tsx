
import React, { useState, useEffect } from 'react';
import { CreditCardBill, Payment } from '../types';
import { generateMonthOptions, BILL_CATEGORIES } from '../constants';

interface CardTrackerProps {
  bills: CreditCardBill[];
  onAdd: (bill: CreditCardBill) => void;
  onUpdate: (id: string, updates: Partial<CreditCardBill>) => void;
  onDelete: (id: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

// Default bank cards with bill generation dates (bills show in current month for next month's due date)
// For example: ICICI due on 16th of next month, bill generated on 28th of current month
const DEFAULT_CARDS = [
  { cardName: 'HSBC', dueDate: '31', billGenerationDate: '11' },  // Due 31st next month, bill on 11th current month
  { cardName: 'RBL', dueDate: '9', billGenerationDate: '19' },     // Due 9th next month, bill on 19th current month
  { cardName: 'AXIS', dueDate: '2', billGenerationDate: '12' },    // Due 2nd next month, bill on 12th current month
  { cardName: 'ICICI', dueDate: '16', billGenerationDate: '28' },  // Due 16th next month, bill on 28th current month
  { cardName: 'SBI', dueDate: '21', billGenerationDate: '1' },     // Due 21st next month, bill on 1st current month
  { cardName: 'AU', dueDate: '15', billGenerationDate: '26' }      // Due 15th next month, bill on 26th current month
];

const CardTracker: React.FC<CardTrackerProps> = ({ bills, onAdd, onUpdate, onDelete, selectedMonth, onMonthChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [addingPaymentFor, setAddingPaymentFor] = useState<string | null>(null);
  const [newPayment, setNewPayment] = useState({ amount: 0, date: new Date().toISOString().split('T')[0], note: '' });
  const [newBill, setNewBill] = useState<Partial<CreditCardBill>>({
    cardName: '',
    category: BILL_CATEGORIES[0],
    dueDate: '',
    month: selectedMonth,
    isEmi: false,
    totalAmount: 0,
    monthlyAmount: 0,
    paidAmount: 0,
    payments: [],
    lastPaymentDate: '',
  });

  // Helper function to get next month for bill due dates
  const getNextMonth = (currentMonth: string): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [month, year] = currentMonth.split('-');
    const monthIndex = months.indexOf(month);

    if (monthIndex === 11) {
      // December -> go to January of next year
      const nextYear = (parseInt(year) + 1).toString().padStart(2, '0');
      return `Jan-${nextYear}`;
    } else {
      // Go to next month in same year
      return `${months[monthIndex + 1]}-${year}`;
    }
  };

  // Helper function to calculate total paid from payments array
  const calculateTotalPaid = (bill: CreditCardBill): number => {
    if (bill.payments && bill.payments.length > 0) {
      return bill.payments.reduce((sum, p) => sum + p.amount, 0);
    }
    return bill.paidAmount || 0; // Fallback to old field for backward compatibility
  };

  // Initialize default cards for the selected month if they don't exist
  useEffect(() => {
    const nextMonth = getNextMonth(selectedMonth);

    // Check for bills with due dates in current month (created in previous month)
    // or bills created in current month
    const existingCards = bills.filter(b => {
      // Check if bill's due date is in current month
      if (b.dueDate && b.dueDate.includes(selectedMonth)) return true;
      // Or if bill was created in current month
      if (b.month === selectedMonth) return true;
      return false;
    });
    const existingCardNames = existingCards.map(b => b.cardName);

    DEFAULT_CARDS.forEach(defaultCard => {
      if (!existingCardNames.includes(defaultCard.cardName)) {
        const bill: CreditCardBill = {
          id: `${defaultCard.cardName}-${selectedMonth}`,
          cardName: defaultCard.cardName,
          category: 'Banking',
          dueDate: `${defaultCard.dueDate} ${nextMonth}`,  // Show due date in next month
          month: selectedMonth,  // Bill generated in current month
          isEmi: false,
          totalAmount: 0,
          monthlyAmount: 0,
          paidAmount: 0,
          payments: [],
          lastPaymentDate: ''
        };
        onAdd(bill);
      }
    });
  }, [selectedMonth]);

  // Filter bills by due date month instead of creation month
  // This ensures bills created in Dec with Jan due dates appear in Jan
  const filteredBills = bills.filter(b => {
    if (!b.dueDate) return b.month === selectedMonth;
    // Check if due date contains the selected month (e.g., "16 Jan-26" contains "Jan-26")
    return b.dueDate.includes(selectedMonth);
  });

  const totalDue = filteredBills.reduce((acc, b) => acc + b.monthlyAmount, 0);
  const totalPaid = filteredBills.reduce((acc, b) => acc + calculateTotalPaid(b), 0);
  const status = totalPaid >= totalDue ? 'Success' : 'Check Payment';

  const handleAddPayment = (billId: string) => {
    if (!newPayment.amount || newPayment.amount <= 0) return;

    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    const payment: Payment = {
      id: Date.now().toString(),
      amount: Number(newPayment.amount),
      date: newPayment.date,
      note: newPayment.note
    };

    const existingPayments = bill.payments || [];
    const updatedPayments = [...existingPayments, payment];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

    onUpdate(billId, {
      payments: updatedPayments,
      paidAmount: totalPaid,
      lastPaymentDate: newPayment.date
    });

    setAddingPaymentFor(null);
    setNewPayment({ amount: 0, date: new Date().toISOString().split('T')[0], note: '' });
  };

  const handleDeletePayment = (billId: string, paymentId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill || !bill.payments) return;

    const updatedPayments = bill.payments.filter(p => p.id !== paymentId);
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const lastPayment = updatedPayments.length > 0 ? updatedPayments[updatedPayments.length - 1] : null;

    onUpdate(billId, {
      payments: updatedPayments,
      paidAmount: totalPaid,
      lastPaymentDate: lastPayment?.date || ''
    });
  };

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
      paidAmount: 0,
      payments: [],
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
          onChange={(e) => onMonthChange(e.target.value)}
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
                <td className="px-4 py-4 space-y-1">
                  <input
                    type="number"
                    placeholder="Due"
                    className="w-20 bg-gray-50 border rounded p-1 text-center block text-xs font-bold"
                    value={bill.monthlyAmount || ''}
                    onChange={(e) => onUpdate(bill.id, { monthlyAmount: Number(e.target.value) })}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold text-green-600">₹{calculateTotalPaid(bill)}</span>
                      <button
                        onClick={() => setAddingPaymentFor(bill.id)}
                        className="text-indigo-500 hover:text-indigo-700 text-xs"
                        title="Add Payment"
                      >
                        <i className="fa-solid fa-plus-circle"></i>
                      </button>
                    </div>
                    {bill.payments && bill.payments.length > 0 && (
                      <div className="text-[9px] text-gray-500 space-y-0.5">
                        {bill.payments.slice(-2).map(payment => (
                          <div key={payment.id} className="flex items-center justify-between bg-gray-50 px-1 py-0.5 rounded">
                            <span>₹{payment.amount} • {payment.date}</span>
                            <button
                              onClick={() => handleDeletePayment(bill.id, payment.id)}
                              className="text-red-400 hover:text-red-600 ml-1"
                            >
                              <i className="fa-solid fa-times"></i>
                            </button>
                          </div>
                        ))}
                        {bill.payments.length > 2 && (
                          <span className="text-gray-400">+{bill.payments.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className={`px-4 py-4 font-bold ${bill.monthlyAmount - calculateTotalPaid(bill) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  ₹{bill.monthlyAmount - calculateTotalPaid(bill)}
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${bill.cardName} bill?`)) {
                        onDelete(bill.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-600 p-2"
                    title="Delete Bill"
                  >
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

      {/* Add Payment Modal */}
      {addingPaymentFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Add Payment</h3>
              <button onClick={() => setAddingPaymentFor(null)} className="text-gray-400">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newPayment.amount || ''}
                  onChange={e => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Payment Date</label>
                <input
                  type="date"
                  className="w-full border p-3 rounded-xl outline-none"
                  value={newPayment.date}
                  onChange={e => setNewPayment({ ...newPayment, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Partial payment"
                  className="w-full border p-3 rounded-xl outline-none"
                  value={newPayment.note}
                  onChange={e => setNewPayment({ ...newPayment, note: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => handleAddPayment(addingPaymentFor)}
                className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg"
              >
                Add Payment
              </button>
              <button
                onClick={() => setAddingPaymentFor(null)}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdding ? (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 space-y-4 fixed inset-x-4 bottom-24 z-50 overflow-y-auto max-h-[75vh]">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Add Custom Card</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-400"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Card Name</label>
              <input
                placeholder="e.g. HDFC Regalia"
                className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={newBill.cardName}
                onChange={e => setNewBill({ ...newBill, cardName: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Category</label>
              <select
                className="w-full border p-3 rounded-xl outline-none bg-white"
                value={newBill.category}
                onChange={e => setNewBill({ ...newBill, category: e.target.value })}
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
                onChange={e => setNewBill({ ...newBill, dueDate: e.target.value })}
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Last Payment Date</label>
              <input
                type="date"
                className="w-full border p-3 rounded-xl outline-none"
                value={newBill.lastPaymentDate}
                onChange={e => setNewBill({ ...newBill, lastPaymentDate: e.target.value })}
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Monthly Due (₹)</label>
              <input
                type="number"
                placeholder="0"
                className="w-full border p-3 rounded-xl outline-none"
                value={newBill.monthlyAmount}
                onChange={e => setNewBill({ ...newBill, monthlyAmount: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Paid Amount (₹)</label>
              <input
                type="number"
                placeholder="0"
                className="w-full border p-3 rounded-xl outline-none"
                value={newBill.paidAmount}
                onChange={e => setNewBill({ ...newBill, paidAmount: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2 flex items-center space-x-2 bg-indigo-50 p-2 rounded-lg">
              <input
                type="checkbox"
                id="isEmi"
                className="w-4 h-4 text-indigo-600 rounded"
                checked={newBill.isEmi}
                onChange={e => setNewBill({ ...newBill, isEmi: e.target.checked })}
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
                    onChange={e => setNewBill({ ...newBill, emiDetails: e.target.value })}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Tenure</label>
                  <input
                    placeholder="e.g. 1/12"
                    className="w-full border p-3 rounded-xl outline-none"
                    value={newBill.tenure}
                    onChange={e => setNewBill({ ...newBill, tenure: e.target.value })}
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
          className="fixed bottom-28 right-6 px-4 py-3 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-sm font-bold z-40 space-x-2"
          title="Add Custom Card"
        >
          <i className="fa-solid fa-plus"></i>
          <span>Add Card</span>
        </button>
      )}
    </div>
  );
};

export default CardTracker;
