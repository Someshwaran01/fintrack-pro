
import React, { useState, useEffect } from 'react';
import { CreditCardBill, Payment, CreditCardLimit } from '../types';
import { generateMonthOptions, BILL_CATEGORIES } from '../constants';
import { getNextMonth } from '../utils/helpers';
import { EmailService } from '../services/emailService';

interface CardTrackerProps {
  bills: CreditCardBill[];
  ccLimits: CreditCardLimit[];
  onAdd: (bill: CreditCardBill) => void;
  onAddMultiple: (bills: CreditCardBill[]) => void;
  onUpdate: (id: string, updates: Partial<CreditCardBill>) => void;
  onDelete: (id: string) => void;
  onUpdateCCLimits: (limits: CreditCardLimit[]) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onboardingComplete?: boolean;
}

const CardTracker: React.FC<CardTrackerProps> = ({ bills, ccLimits: propsCCLimits, onAdd, onAddMultiple, onUpdate, onDelete, onUpdateCCLimits, selectedMonth, onMonthChange, onboardingComplete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [addingPaymentFor, setAddingPaymentFor] = useState<string | null>(null);
  const [newPayment, setNewPayment] = useState({ amount: 0, date: new Date().toISOString().split('T')[0], note: '' });
  const [showBills, setShowBills] = useState(false);
  const [showCreditUtil, setShowCreditUtil] = useState(true);
  const [showCCLimits, setShowCCLimits] = useState(false);
  const [isAddingCCLimit, setIsAddingCCLimit] = useState(false);
  const [editingCCLimit, setEditingCCLimit] = useState<CreditCardLimit | null>(null);
  const [ccLimits, setCCLimits] = useState<CreditCardLimit[]>(propsCCLimits);
  const [newCCLimit, setNewCCLimit] = useState<Partial<CreditCardLimit & { category?: string; formDueDate?: string; monthlyAmount?: number }>>({
    cardName: '',
    creditLimit: 0,
    notes: '',
    category: BILL_CATEGORIES[0],
    formDueDate: '',
    billDate: 1,
    monthlyAmount: 0
  });
  const [isSyncingGmail, setIsSyncingGmail] = useState(false);
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

  // Sync ccLimits with props
  useEffect(() => {
    setCCLimits(propsCCLimits);
  }, [propsCCLimits]);

  // Helper function to calculate total paid from payments array
  const calculateTotalPaid = (bill: CreditCardBill): number => {
    if (bill.payments && bill.payments.length > 0) {
      return bill.payments.reduce((sum, p) => sum + p.amount, 0);
    }
    return bill.paidAmount || 0; // Fallback to old field for backward compatibility
  };

  // Filter bills by selected month
  const filteredBills = bills.filter(b => b.month === selectedMonth);

  const totalDue = filteredBills.reduce((acc, b) => acc + b.monthlyAmount, 0);
  const totalPaid = filteredBills.reduce((acc, b) => acc + calculateTotalPaid(b), 0);
  const status = totalPaid >= totalDue && totalDue > 0 ? 'Success' : 'Check Payment';


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

    // Always persist card globally so it shows up next month
    if (!ccLimits.some(limit => limit.cardName === newBill.cardName)) {
      onUpdateCCLimits([...ccLimits, {
        id: Date.now().toString() + '-limit',
        cardName: newBill.cardName || '',
        creditLimit: Number(newBill.totalAmount) || 0,
        billDate: 1,
        dueDate: 15, // Default fallback
        updatedDate: new Date().toISOString().split('T')[0],
        notes: 'Added from quick add'
      }]);
    }

    onAdd(bill);
    setIsAdding(false);
    setNewBill({ cardName: '', category: BILL_CATEGORIES[0], monthlyAmount: 0, paidAmount: 0, lastPaymentDate: '' });
  };

  // CC Limits handlers
  const handleSaveCCLimit = () => {
    if (!newCCLimit.cardName || !newCCLimit.creditLimit) {
      alert('Please fill in card name and credit limit');
      return;
    }

    if (editingCCLimit) {
      // Update existing limit only
      const updated = ccLimits.map(limit =>
        limit.id === editingCCLimit.id
          ? {
            ...limit,
            cardName: newCCLimit.cardName || '',
            creditLimit: Number(newCCLimit.creditLimit) || 0,
            updatedDate: new Date().toISOString().split('T')[0],
            notes: newCCLimit.notes || ''
          }
          : limit
      );
      onUpdateCCLimits(updated);
      setEditingCCLimit(null);
    } else {
      // Add new card: create both limit and bill
      if (!newCCLimit.monthlyAmount || !newCCLimit.formDueDate) {
        alert('Please fill in monthly amount and due date');
        return;
      }

      // Create CC Limit
      const limit: CreditCardLimit = {
        id: Date.now().toString(),
        cardName: newCCLimit.cardName || '',
        creditLimit: Number(newCCLimit.creditLimit) || 0,
        billDate: Number(newCCLimit.billDate) || 1,
        dueDate: Number(newCCLimit.formDueDate) || 15,
        updatedDate: new Date().toISOString().split('T')[0],
        notes: newCCLimit.notes || ''
      };
      const updatedLimits = [...ccLimits, limit];
      onUpdateCCLimits(updatedLimits);

      // Create Bill for current month
      const nextMonth = getNextMonth(selectedMonth);
      const bill: CreditCardBill = {
        id: (Date.now() + 1).toString(),
        cardName: newCCLimit.cardName || '',
        category: newCCLimit.category || BILL_CATEGORIES[0],
        dueDate: `${newCCLimit.formDueDate} ${nextMonth}`,
        month: selectedMonth,
        isEmi: false,
        totalAmount: Number(newCCLimit.monthlyAmount) || 0,
        monthlyAmount: Number(newCCLimit.monthlyAmount) || 0,
        paidAmount: 0,
        payments: [],
        lastPaymentDate: ''
      };
      onAdd(bill);
    }

    setIsAddingCCLimit(false);
    setNewCCLimit({
      cardName: '',
      creditLimit: 0,
      notes: '',
      category: BILL_CATEGORIES[0],
      formDueDate: '',
      billDate: 1,
      monthlyAmount: 0
    });
  };

  const handleEditCCLimit = (limit: CreditCardLimit) => {
    setEditingCCLimit(limit);
    setNewCCLimit({
      cardName: limit.cardName,
      creditLimit: limit.creditLimit,
      notes: limit.notes || ''
    });
    setIsAddingCCLimit(true);
  };

  const handleDeleteCCLimit = (id: string) => {
    if (confirm('Are you sure you want to delete this credit card limit?')) {
      const updated = ccLimits.filter(limit => limit.id !== id);
      onUpdateCCLimits(updated);
    }
  };

  const handleCancelCCLimit = () => {
    setIsAddingCCLimit(false);
    setEditingCCLimit(null);
    setNewCCLimit({
      cardName: '',
      creditLimit: 0,
      notes: '',
      category: BILL_CATEGORIES[0],
      formDueDate: '',
      monthlyAmount: 0
    });
  };

  const handleSyncGmail = async () => {
    setIsSyncingGmail(true);
    try {
      const token = await EmailService.authenticateAndGetToken();
      if (!token) {
        alert("Authentication failed or was cancelled.");
        setIsSyncingGmail(false);
        return;
      }

      const parsedBills = await EmailService.fetchRecentCreditCardEmails(token, 30);
      
      if (parsedBills.length === 0) {
        alert("No readable credit card statements found in your Gmail for the last 30 days.");
      } else {
        const newBillsToAdd: CreditCardBill[] = [];
        let protectedCount = 0;

        parsedBills.forEach(pb => {
          if (pb.isProtected) {
            protectedCount++;
            return;
          }

          // Check if this bill already exists for this card and month
          const exists = bills.some(existing => 
            existing.cardName === pb.cardName && existing.month === selectedMonth
          );

          if (!exists) {
            newBillsToAdd.push({
              id: Date.now().toString() + Math.random().toString().slice(2, 6),
              cardName: pb.cardName,
              category: BILL_CATEGORIES[0],
              dueDate: pb.dueDate || `15 ${selectedMonth}`,
              month: selectedMonth,
              isEmi: false,
              totalAmount: pb.amountDue,
              monthlyAmount: pb.amountDue,
              paidAmount: 0,
              payments: [],
              lastPaymentDate: ''
            });
          }
        });

        if (newBillsToAdd.length > 0) {
          onAddMultiple(newBillsToAdd);
          alert(`Successfully synced ${newBillsToAdd.length} bills from Gmail!`);
        } else if (protectedCount > 0) {
          alert(`Found ${protectedCount} statements, but they are password-protected and couldn't be read. Please enter them manually.`);
        } else {
          alert("Statements found, but they are already added for this month.");
        }
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while syncing Gmail. Please check your connection.");
    }
    setIsSyncingGmail(false);
  };

  return (
    <div className="p-4 space-y-5 pb-24 animate-fadeIn max-w-7xl mx-auto">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#1a1c2e] to-[#2d3142] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-2">
              <i className="fa-solid fa-shield-halved text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-xl font-serif font-black text-[#1a1c2e]">Card Assets</h2>
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Portfolio Tracking</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSyncGmail}
              disabled={isSyncingGmail}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center shadow-sm disabled:opacity-50"
            >
              <i className={`fa-solid fa-envelope ${isSyncingGmail ? 'fa-spin' : ''} mr-2`}></i>
              {isSyncingGmail ? 'Syncing...' : 'Sync Gmail'}
            </button>
            <div className="relative">
              <select
                className="appearance-none bg-gray-50 border border-gray-100 rounded-xl px-5 py-2.5 pr-10 text-xs font-bold text-[#1a1c2e] outline-none shadow-sm hover:shadow-md transition-all cursor-pointer"
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
              >
                {generateMonthOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Header - Creative Status */}
      <div className={`bg-gradient-to-br py-6 px-6 rounded-3xl shadow-lg transition-all duration-300 ${status === 'Success' ? 'from-[#10b981] to-[#059669]' : 'from-[#f59e0b] to-[#d97706]'} text-white`}>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-white/70 mb-2">Month Liquidity</p>
            <p className="text-3xl font-serif font-black">
              ₹{totalPaid.toLocaleString()}
            </p>
            <p className="text-[10px] font-bold text-white/60 mt-1 italic">Target: ₹{totalDue.toLocaleString()}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
            </div>
            <div className="w-32 h-2.5 bg-black/10 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${Math.min((totalPaid / (totalDue || 1)) * 100, 100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Card Limit Usage - Main Display */}
      {ccLimits.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setShowCreditUtil(!showCreditUtil)}
            className="w-full flex items-center justify-between mb-6 cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3b82f6] to-[#2563eb] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <i className="fa-solid fa-chart-line text-white text-lg"></i>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-serif font-black text-[#1a1c2e]">Utilization Index</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Asset Allocation</p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${showCreditUtil ? 'bg-[#1a1c2e] text-white rotate-180' : 'bg-gray-100 text-gray-400'}`}>
              <i className="fa-solid fa-chevron-down text-[10px]"></i>
            </div>
          </button>

          {showCreditUtil && (
            <div className="space-y-4">
              {ccLimits.map((limit) => {
                // Calculate total outstanding amount for this card (across all months)
                const cardBills = bills.filter(b => b.cardName === limit.cardName);
                const totalOutstanding = cardBills.reduce((sum, bill) => {
                  const totalPaid = bill.payments?.reduce((paidSum, p) => paidSum + p.amount, 0) || bill.paidAmount || 0;
                  const balance = bill.monthlyAmount - totalPaid;
                  return sum + (balance > 0 ? balance : 0); // Only add unpaid balances
                }, 0);

                const usagePercentage = limit.creditLimit > 0 ? (totalOutstanding / limit.creditLimit) * 100 : 0;
                const remaining = limit.creditLimit - totalOutstanding;

                return (
                  <div key={limit.id} className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl shadow-sm border border-gray-200">
                    {/* Card Header with Icon & Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md ${usagePercentage > 80 ? 'bg-gradient-to-br from-red-500 to-pink-500' : usagePercentage > 50 ? 'bg-gradient-to-br from-orange-500 to-amber-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'}`}>
                          <i className="fa-solid fa-credit-card text-white text-lg"></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-1">{limit.cardName}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-0.5 rounded-lg text-xs font-bold ${usagePercentage > 80
                              ? 'bg-red-100 text-red-700'
                              : usagePercentage > 50
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-emerald-100 text-emerald-700'
                              }`}>
                              {usagePercentage > 80 ? 'High Usage' : usagePercentage > 50 ? 'Moderate' : 'Healthy'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold mb-0.5 ${usagePercentage > 80 ? 'bg-gradient-to-r from-red-600 to-pink-600' : usagePercentage > 50 ? 'bg-gradient-to-r from-orange-600 to-amber-600' : 'bg-gradient-to-r from-emerald-600 to-teal-600'} bg-clip-text text-transparent`}>
                          {usagePercentage.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Usage</div>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="relative mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative">
                        <div
                          className={`h-full transition-all duration-700 ease-out ${usagePercentage > 80 ? 'bg-gradient-to-r from-red-500 to-pink-500' : usagePercentage > 50 ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        >
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-700">
                            ₹{(totalOutstanding / 1000).toFixed(1)}K of ₹{(limit.creditLimit / 1000).toFixed(0)}K
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid with Better Spacing */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-4 text-center">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-2 shadow-sm">
                          <i className="fa-solid fa-wallet text-white text-sm"></i>
                        </div>
                        <div className="text-xs font-semibold text-cyan-700 mb-1">Limit</div>
                        <div className="font-bold text-gray-900 text-base mb-1">₹{(limit.creditLimit / 1000).toFixed(0)}K</div>
                        <div className="text-xs text-gray-500 truncate">₹{limit.creditLimit.toLocaleString()}</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-center">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-2 shadow-sm">
                          <i className="fa-solid fa-receipt text-white text-sm"></i>
                        </div>
                        <div className="text-xs font-semibold text-purple-700 mb-1">Used</div>
                        <div className="font-bold text-gray-900 text-base mb-1">₹{(totalOutstanding / 1000).toFixed(1)}K</div>
                        <div className="text-xs text-gray-500 truncate">₹{totalOutstanding.toLocaleString()}</div>
                      </div>

                      <div className={`rounded-lg p-4 text-center ${remaining < limit.creditLimit * 0.2 ? 'bg-gradient-to-br from-red-50 to-pink-50' : 'bg-gradient-to-br from-emerald-50 to-teal-50'}`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm ${remaining < limit.creditLimit * 0.2 ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'}`}>
                          <i className="fa-solid fa-piggy-bank text-white text-sm"></i>
                        </div>
                        <div className={`text-xs font-semibold mb-1 ${remaining < limit.creditLimit * 0.2 ? 'text-red-700' : 'text-emerald-700'}`}>Available</div>
                        <div className={`font-bold text-base mb-1 ${remaining < limit.creditLimit * 0.2 ? 'text-red-600' : 'text-gray-900'}`}>₹{(remaining / 1000).toFixed(1)}K</div>
                        <div className="text-xs text-gray-500 truncate">₹{remaining.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CC Bills Toggle - Modernized */}
      <button
        onClick={() => setShowBills(!showBills)}
        className="w-full bg-[#2a2d43] py-4 px-5 rounded-2xl flex items-center justify-between shadow-lg transition-all hover:scale-[1.01]"
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5">
            <i className="fa-solid fa-file-invoice text-indigo-300 text-sm"></i>
          </div>
          <div className="text-left">
            <h3 className="font-serif font-black text-white text-base">Portfolio Dues</h3>
            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">{filteredBills.length} Active Records</p>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 backdrop-blur-sm bg-white/10 border border-white/5 text-white ${showBills ? 'rotate-180' : ''}`}>
          <i className="fa-solid fa-chevron-down text-xs"></i>
        </div>
      </button>

      {showBills && (
        <div className="space-y-4 mt-2 animate-fadeIn">
          {filteredBills.length === 0 && !isAdding ? (
            <div className="bg-white p-10 text-center rounded-2xl border border-gray-100 shadow-sm text-gray-400">
              <i className="fa-solid fa-file-invoice-dollar text-4xl mb-4 opacity-20 block text-indigo-500"></i>
              <p className="font-bold text-gray-500 text-lg">No Due Records</p>
              <p className="text-xs text-gray-400 mt-1">There are no bills found for this month.</p>
            </div>
          ) : (
            filteredBills.map(bill => (
              <div key={bill.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md relative overflow-hidden group">
                {/* Decorative Accent */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${bill.monthlyAmount - calculateTotalPaid(bill) > 0 ? 'bg-red-400' : 'bg-green-400'}`}></div>

                <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-gray-50 to-gray-100 flex items-center justify-center border border-gray-200/50">
                      <i className="fa-brands fa-cc-visa text-indigo-600 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1c2e] text-lg leading-tight">{bill.cardName}</h4>
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 rounded-md text-[9px] text-gray-600 font-bold uppercase tracking-wide">{bill.category}</span>
                    </div>
                  </div>
                  <div className="text-right bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Due Date</p>
                    <p className="font-bold text-gray-800 text-sm whitespace-nowrap">{bill.dueDate || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white border text-center border-gray-100 rounded-2xl p-3 shadow-sm relative pt-6 mt-2">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[9px] text-gray-400 font-bold uppercase tracking-widest">Monthly Due</span>
                    <div className="relative flex items-center justify-center">
                      <span className="text-gray-400 font-bold text-sm mr-1">₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        className={`w-full bg-transparent text-center font-black text-xl outline-none ${bill.monthlyAmount === 0 ? 'text-yellow-500' : 'text-gray-800'}`}
                        value={bill.monthlyAmount || ''}
                        onChange={(e) => onUpdate(bill.id, { monthlyAmount: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="bg-white border text-center border-gray-100 rounded-2xl p-3 shadow-sm relative pt-6 mt-2">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[9px] text-gray-400 font-bold uppercase tracking-widest">Balance</span>
                    <p className={`font-black text-xl truncate ${bill.monthlyAmount - calculateTotalPaid(bill) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      ₹{bill.monthlyAmount - calculateTotalPaid(bill)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-2xl p-3 mb-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-0.5">Paid History</p>
                    <p className="font-black text-green-600 text-lg">₹{calculateTotalPaid(bill)}</p>
                    {bill.lastPaymentDate && <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Last: {bill.lastPaymentDate}</p>}
                  </div>
                  <button
                    onClick={() => setAddingPaymentFor(bill.id)}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    <i className="fa-solid fa-plus mr-1.5"></i> Add Payment
                  </button>
                </div>

                {bill.isEmi && (
                  <div className="flex items-center justify-between mb-4 text-xs bg-indigo-50/80 border border-indigo-100 text-indigo-700 rounded-xl py-2 px-4 shadow-sm">
                    <span className="font-bold flex items-center"><i className="fa-solid fa-rotate mr-2 opacity-70"></i> {bill.emiDetails}</span>
                    <span className="font-black bg-white px-2 py-0.5 rounded-md text-[10px]">{bill.tenure}</span>
                  </div>
                )}

                {bill.payments && bill.payments.length > 0 && (
                  <div className="space-y-1.5 mb-4 border-t border-gray-50 pt-3">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">Recent Payments</p>
                    {bill.payments.slice(-3).map(payment => (
                      <div key={payment.id} className="flex justify-between items-center text-xs px-3 py-2 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                        <span className="font-bold text-gray-700">₹{payment.amount} <span className="text-gray-400/80 ml-2 font-medium">{payment.date}</span></span>
                        <button onClick={() => handleDeletePayment(bill.id, payment.id)} className="w-6 h-6 rounded-full bg-white border border-gray-200 text-red-500 flex items-center justify-center hover:bg-red-50 hover:border-red-100 hover:scale-110 transition-all shadow-sm">
                          <i className="fa-solid fa-times text-[10px]"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${bill.cardName} bill?`)) {
                        onDelete(bill.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-600 flex items-center text-xs font-bold transition-colors px-2 py-1"
                  >
                    <i className="fa-solid fa-trash mr-1.5 opacity-50"></i> Remove Asset
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}
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
                <label htmlFor="payment-amount" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  id="payment-amount"
                  name="payment-amount"
                  placeholder="Enter amount"
                  className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newPayment.amount || ''}
                  onChange={e => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="payment-date" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Payment Date</label>
                <input
                  type="date"
                  id="payment-date"
                  name="payment-date"
                  className="w-full border p-3 rounded-xl outline-none"
                  value={newPayment.date}
                  onChange={e => setNewPayment({ ...newPayment, date: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="payment-note" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Note (Optional)</label>
                <input
                  type="text"
                  id="payment-note"
                  name="payment-note"
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
              <label htmlFor="new-bill-category" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Category</label>
              <select
                id="new-bill-category"
                name="new-bill-category"
                className="w-full border p-3 rounded-xl outline-none bg-white"
                value={newBill.category}
                onChange={e => setNewBill({ ...newBill, category: e.target.value })}
              >
                {BILL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="col-span-1">
              <label htmlFor="new-bill-due-date" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Due Date</label>
              <input
                type="date"
                id="new-bill-due-date"
                name="new-bill-due-date"
                className="w-full border p-3 rounded-xl outline-none"
                value={newBill.dueDate}
                onChange={e => setNewBill({ ...newBill, dueDate: e.target.value })}
              />
            </div>
            <div className="col-span-1">
              <label htmlFor="new-bill-last-payment-date" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Last Payment Date</label>
              <input
                type="date"
                id="new-bill-last-payment-date"
                name="new-bill-last-payment-date"
                className="w-full border p-3 rounded-xl outline-none"
                value={newBill.lastPaymentDate}
                onChange={e => setNewBill({ ...newBill, lastPaymentDate: e.target.value })}
              />
            </div>
            <div className="col-span-1">
              <label htmlFor="new-bill-monthly-amount" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Monthly Due (₹)</label>
              <input
                type="number"
                id="new-bill-monthly-amount"
                name="new-bill-monthly-amount"
                placeholder="0"
                className="w-full border p-3 rounded-xl outline-none"
                value={newBill.monthlyAmount}
                onChange={e => setNewBill({ ...newBill, monthlyAmount: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-1">
              <label htmlFor="new-bill-paid-amount" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Paid Amount (₹)</label>
              <input
                type="number"
                id="new-bill-paid-amount"
                name="new-bill-paid-amount"
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
                name="isEmi"
                className="w-4 h-4 text-indigo-600 rounded"
                checked={newBill.isEmi}
                onChange={e => setNewBill({ ...newBill, isEmi: e.target.checked })}
              />
              <label htmlFor="isEmi" className="text-sm font-semibold text-indigo-700">This is an EMI / Recurring</label>
            </div>
            {newBill.isEmi && (
              <>
                <div className="col-span-1">
                  <label htmlFor="emi-details" className="text-xs font-bold text-gray-400 uppercase mb-1 block">EMI Item</label>
                  <input
                    id="emi-details"
                    name="emi-details"
                    placeholder="e.g. iPhone"
                    className="w-full border p-3 rounded-xl outline-none"
                    value={newBill.emiDetails || ''}
                    onChange={e => setNewBill({ ...newBill, emiDetails: e.target.value })}
                  />
                </div>
                <div className="col-span-1">
                  <label htmlFor="emi-tenure" className="text-xs font-bold text-gray-400 uppercase mb-1 block">Tenure</label>
                  <input
                    id="emi-tenure"
                    name="emi-tenure"
                    placeholder="e.g. 1/12"
                    className="w-full border p-3 rounded-xl outline-none"
                    value={newBill.tenure || ''}
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
      ) : null}

      {/* CC Limits Management Section */}
      {/* CC Limits Management Section - Optimized Mobile */}
      <div className="mt-4">
        <button
          onClick={() => setShowCCLimits(!showCCLimits)}
          className="w-full bg-white py-3 px-4 rounded-xl flex items-center justify-between shadow-sm border border-gray-100 transition-all hover:shadow-md"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8b5cf6] to-[#d946ef] flex items-center justify-center shadow-md">
              <i className="fa-solid fa-credit-card text-white text-xs"></i>
            </div>
            <div className="text-left">
              <span className="font-serif font-black text-[#1a1c2e] text-sm">Credit Matrix</span>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mt-0.5">Limits Management</p>
            </div>
          </div>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${showCCLimits ? 'bg-[#1a1c2e] text-white rotate-180' : 'bg-gray-100 text-gray-400'}`}>
            <i className="fa-solid fa-chevron-down text-[9px]"></i>
          </div>
        </button>

        {showCCLimits && (
          <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">Manage Credit Limits</h3>
              <button
                onClick={() => setIsAddingCCLimit(true)}
                className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-1"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Add Card</span>
              </button>
            </div>

            {ccLimits.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No credit cards added yet. Click "Add Card" to get started.</p>
            ) : (
              <div className="space-y-3">
                {ccLimits.map((limit) => (
                  <div key={limit.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <i className="fa-solid fa-credit-card text-purple-600"></i>
                        <span className="font-bold text-gray-800">{limit.cardName}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <span className="font-semibold">Limit:</span> ₹{limit.creditLimit.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Updated: {limit.updatedDate}
                      </div>
                      {limit.notes && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          {limit.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCCLimit(limit)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <i className="fa-solid fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteCCLimit(limit.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit CC Limit Modal */}
      {
        isAddingCCLimit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-12">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[85vh] flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingCCLimit ? 'Edit Credit Card Limit' : 'Add New Credit Card'}
                </h3>
              </div>
              <div className="space-y-4 overflow-y-auto flex-grow pb-4 custom-scrollbar">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Card Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., HDFC Infinia"
                    value={newCCLimit.cardName}
                    onChange={(e) => setNewCCLimit({ ...newCCLimit, cardName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={!!editingCCLimit}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Credit Limit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 500000"
                    value={newCCLimit.creditLimit || ''}
                    onChange={(e) => setNewCCLimit({ ...newCCLimit, creditLimit: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                {!editingCCLimit && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newCCLimit.category}
                        onChange={(e) => setNewCCLimit({ ...newCCLimit, category: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {BILL_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Statement Date (Day of Month) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="e.g., 1"
                        value={newCCLimit.billDate}
                        onChange={(e) => setNewCCLimit({ ...newCCLimit, billDate: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Due Date (Day of Month) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="e.g., 15"
                        value={newCCLimit.formDueDate}
                        onChange={(e) => setNewCCLimit({ ...newCCLimit, formDueDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Monthly Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 25000"
                        value={newCCLimit.monthlyAmount || ''}
                        onChange={(e) => setNewCCLimit({ ...newCCLimit, monthlyAmount: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Any additional information..."
                    value={newCCLimit.notes}
                    onChange={(e) => setNewCCLimit({ ...newCCLimit, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={3}
                  ></textarea>
                </div>
              </div>
              <div className="flex space-x-3 mt-4 shrink-0 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSaveCCLimit}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700"
                >
                  {editingCCLimit ? 'Update Limit' : 'Save Card'}
                </button>
                <button
                  onClick={handleCancelCCLimit}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default CardTracker;
