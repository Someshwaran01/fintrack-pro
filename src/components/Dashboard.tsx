
import React, { useMemo, useState } from 'react';
import { CreditCardBill, MedicalExpense, HomeExpense, CCUtilization, Income, PaymentMethod } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { generateMonthOptions } from '../constants';

interface DashboardProps {
  bills: CreditCardBill[];
  ccLimits: CreditCardLimit[];
  medical: MedicalExpense[];
  home: HomeExpense[];
  income: Income[];
  members: string[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onAddMember: () => void;
  onRemoveMember: (name: string) => void;
  newMemberName: string;
  onNewMemberNameChange: (name: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  bills,
  ccLimits,
  medical,
  home,
  income,
  members,
  selectedMonth,
  onMonthChange,
  onAddMember,
  onRemoveMember,
  newMemberName,
  onNewMemberNameChange
}) => {
  const [showPendingBills, setShowPendingBills] = useState(false);
  const [ccUtilizations, setCCUtilizations] = useState<CCUtilization[]>(() => {
    const saved = localStorage.getItem('fintrack_cc_utilization');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingCC, setIsAddingCC] = useState(false);
  const [newCCUtil, setNewCCUtil] = useState({ name: '', amount: 0 });

  // Helper function to calculate total paid from payments array
  const calculateTotalPaid = (bill: CreditCardBill): number => {
    if (bill.payments && bill.payments.length > 0) {
      return bill.payments.reduce((sum, p) => sum + p.amount, 0);
    }
    return bill.paidAmount || 0;
  };

  // Helper function to get previous month
  const getPreviousMonth = (currentMonth: string): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [month, year] = currentMonth.split('-');
    const monthIndex = months.indexOf(month);

    if (monthIndex === 0) {
      // January -> go to December of previous year
      const prevYear = (parseInt(year) - 1).toString().padStart(2, '0');
      return `Dec-${prevYear}`;
    } else {
      // Go to previous month in same year
      return `${months[monthIndex - 1]}-${year}`;
    }
  };

  const stats = useMemo(() => {
    // Filter data by selected month for medical and home (month-specific)
    const monthBills = bills.filter(b => b.month === selectedMonth);
    const monthMedical = medical.filter(m => {
      const expenseMonth = new Date(m.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', '-').replace(', ', '-');
      return expenseMonth === selectedMonth;
    });
    const monthHome = home.filter(h => {
      const expenseMonth = new Date(h.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', '-').replace(', ', '-');
      return expenseMonth === selectedMonth;
    });

    // Get previous month data
    const previousMonth = getPreviousMonth(selectedMonth);
    const prevMonthBills = bills.filter(b => b.month === previousMonth);

    // CC Due: Calculate across ALL months (unpaid bills from any month)
    const allUnpaidBills = bills.filter(b => calculateTotalPaid(b) < b.monthlyAmount);
    const totalDueAllMonths = allUnpaidBills.reduce((acc, b) => acc + (b.monthlyAmount - calculateTotalPaid(b)), 0);
    const pendingCountAllMonths = allUnpaidBills.length;

    // Month-specific totals for medical and home
    const totalMedical = monthMedical.reduce((acc, m) => acc + m.amount, 0);
    const totalHome = monthHome.reduce((acc, h) => acc + h.amount, 0);

    // Month-specific CC paid (for chart)
    const totalPaidBills = monthBills.reduce((acc, b) => acc + calculateTotalPaid(b), 0);

    // Calculate income for selected month
    const totalIncome = income
      .filter(i => i.month === selectedMonth)
      .reduce((acc, i) => acc + i.amount, 0);

    // Calculate UPI spending (medical + home expenses paid via UPI)
    const upiSpending = [
      ...monthMedical.filter(m => m.paymentMethod === PaymentMethod.UPI),
      ...monthHome.filter(h => h.paymentMethod === PaymentMethod.UPI)
    ].reduce((acc, expense) => acc + expense.amount, 0);

    // Calculate remaining balance
    const remainingBalance = totalIncome - upiSpending;

    return {
      totalDue: totalDueAllMonths, // Now shows ALL unpaid bills from all months
      totalPaid: totalPaidBills,
      totalMedical,
      totalHome,
      pendingCount: pendingCountAllMonths, // Count of unpaid bills from all months
      allUnpaidBills, // All unpaid bills for the modal
      monthBills,
      prevMonthBills,
      previousMonth,
      totalIncome,
      upiSpending,
      remainingBalance
    };
  }, [bills, medical, home, income, selectedMonth]);

  const chartData = [
    { name: 'CC Bills', value: stats.totalPaid + stats.totalDue },
    { name: 'Medical', value: stats.totalMedical },
    { name: 'Home', value: stats.totalHome },
  ];

  // Card utilization data for pie chart - Now includes ALL configured cards
  const cardUtilizationData = useMemo(() => {
    const cardTotals: Record<string, number> = {};

    // Initialize with all known cards from portfolio
    ccLimits.forEach(limit => {
      cardTotals[limit.cardName] = 0;
    });

    stats.monthBills.forEach(bill => {
      cardTotals[bill.cardName] = (cardTotals[bill.cardName] || 0) + bill.monthlyAmount;
    });

    return (Object.entries(cardTotals) as [string, number][])
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort by highest spending
  }, [stats.monthBills, ccLimits]);

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  // Card-wise comparison data
  const comparisonData = useMemo(() => {
    const cardNames = new Set([
      ...stats.monthBills.map(b => b.cardName),
      ...stats.prevMonthBills.map(b => b.cardName)
    ]);

    return Array.from(cardNames).map(cardName => {
      const currentBill = stats.monthBills.find(b => b.cardName === cardName);
      const prevBill = stats.prevMonthBills.find(b => b.cardName === cardName);

      return {
        name: cardName,
        thisMonth: currentBill?.monthlyAmount || 0,
        lastMonth: prevBill?.monthlyAmount || 0
      };
    }).filter(item => item.thisMonth > 0 || item.lastMonth > 0);
  }, [stats.monthBills, stats.prevMonthBills]);

  // CC Utilization calculations
  const totalCCUsageThisMonth = useMemo(() => {
    const monthBills = bills.filter(b => b.month === selectedMonth);
    return monthBills.reduce((sum, b) => sum + b.monthlyAmount, 0);
  }, [bills, selectedMonth]);

  const ccUsedForOthers = ccUtilizations.reduce((sum, cc) => sum + cc.amount, 0);
  const mainSpenderName = members[0] || 'Owner';
  const mainSpenderPortion = totalCCUsageThisMonth - ccUsedForOthers;

  const ccComparisonData = useMemo(() => {
    const data = [];
    ccUtilizations.forEach(cc => {
      data.push({ name: cc.name, value: cc.amount });
    });
    if (mainSpenderPortion > 0) {
      data.push({ name: mainSpenderName, value: mainSpenderPortion });
    }
    return data;
  }, [ccUtilizations, mainSpenderPortion, mainSpenderName]);

  const CC_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleAddCCUtil = () => {
    if (!newCCUtil.name || !newCCUtil.amount) return;
    const newUtil: CCUtilization = {
      id: Date.now().toString(),
      name: newCCUtil.name,
      amount: Number(newCCUtil.amount),
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [...ccUtilizations, newUtil];
    setCCUtilizations(updated);
    localStorage.setItem('fintrack_cc_utilization', JSON.stringify(updated));
    setNewCCUtil({ name: '', amount: 0 });
    setIsAddingCC(false);
  };

  const handleDeleteCCUtil = (id: string) => {
    const updated = ccUtilizations.filter(cc => cc.id !== id);
    setCCUtilizations(updated);
    localStorage.setItem('fintrack_cc_utilization', JSON.stringify(updated));
  };

  return (
    <div className="p-4 space-y-6 pb-24 bg-[#fcfdff]">
      <header className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-serif font-black text-[#1a1c2e] tracking-tight">Executive Summary</h1>
            <p className="text-gray-400 text-[9px] uppercase font-bold tracking-widest mt-1 opacity-80">{selectedMonth} Portfolio Status</p>
          </div>
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-100 rounded-xl px-5 py-2.5 pr-10 text-xs font-bold text-[#1a1c2e] outline-none shadow-sm hover:shadow-md transition-all cursor-pointer"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
            >
              {generateMonthOptions().map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none"></i>
          </div>
        </div>
      </header>

      {/* Creative Portfolio Strategy Card */}
      <div className="bg-gradient-to-tr from-[#0f172a] to-[#1e293b] p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-700"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              <i className="fa-solid fa-wand-magic-sparkles text-orange-400"></i>
            </div>
            <h2 className="text-white font-serif text-lg font-bold tracking-tight">Portfolio Intelligence</h2>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed mb-6 font-medium">
            Your current utilization is <span className="text-orange-400 font-bold">{stats.totalIncome > 0 ? ((stats.upiSpending / stats.totalIncome) * 100).toFixed(1) : '0'}%</span> of total capital. I have analyzed <span className="text-white font-bold">{stats.monthBills.length} portfolios</span> for potential debt-to-income optimization.
          </p>
          <button
            onClick={() => {
              const aiBtn = document.getElementById('global-ai-btn');
              if (aiBtn) aiBtn.click();
            }}
            className="bg-white text-[#0f172a] font-black text-[10px] uppercase tracking-[0.2em] py-3.5 px-6 rounded-xl hover:bg-orange-400 hover:text-white transition-all shadow-xl active:scale-95 flex items-center"
          >
            Launch Advisor <i className="fa-solid fa-bolt-lightning ml-2 text-[10px]"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div
          onClick={() => setShowPendingBills(true)}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-red-500 transition-colors">
            <i className="fa-solid fa-clock-rotate-left text-red-500 text-xs group-hover:text-white"></i>
          </div>
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Outstanding</p>
          <p className="text-sm font-bold text-[#1a1c2e] mt-0.5">₹{stats.totalDue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-500 transition-colors">
            <i className="fa-solid fa-hospital-user text-indigo-500 text-xs group-hover:text-white"></i>
          </div>
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Medical</p>
          <p className="text-sm font-bold text-[#1a1c2e] mt-0.5">₹{stats.totalMedical.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-500 transition-colors">
            <i className="fa-solid fa-house-chimney-window text-emerald-500 text-xs group-hover:text-white"></i>
          </div>
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Household</p>
          <p className="text-sm font-bold text-[#1a1c2e] mt-0.5">₹{stats.totalHome.toLocaleString()}</p>
        </div>
      </div>

      {/* Family Member Management Section */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 animate-fadeIn">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-100">
              <i className="fa-solid fa-users text-sm"></i>
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1a1c2e] uppercase tracking-wider">Family Units</h3>
              <p className="text-[10px] text-gray-400 font-bold tracking-tight">Active Spenders</p>
            </div>
          </div>
          <p className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-black uppercase tracking-widest">{members.length}/5</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {members.map(member => (
            <div key={member} className="flex items-center space-x-2 bg-[#f8fafc] px-3.5 py-2 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-all">
              <span className="text-xs font-bold text-slate-700 capitalize">{member}</span>
              <button
                onClick={() => onRemoveMember(member)}
                className="text-slate-300 hover:text-red-500 transition-colors p-0.5"
                title="Remove Member"
              >
                <i className="fa-solid fa-xmark text-[10px]"></i>
              </button>
            </div>
          ))}
          {members.length === 0 && (
            <div className="w-full py-4 text-center border-2 border-dashed border-slate-50 rounded-3xl">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">Deployment Required</p>
            </div>
          )}
        </div>

        {members.length < 5 && (
          <div className="flex gap-2">
            <div className="flex-1 relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                <i className="fa-solid fa-user-plus text-[10px]"></i>
              </div>
              <input
                type="text"
                placeholder="Spender alias..."
                value={newMemberName}
                onChange={(e) => onNewMemberNameChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onAddMember()}
                className="w-full bg-[#f8fafc] border border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-[#1a1c2e] outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-300"
              />
            </div>
            <button
              onClick={onAddMember}
              disabled={!newMemberName.trim()}
              className="w-14 bg-[#1a1c2e] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-20 disabled:scale-100 transition-all"
            >
              <i className="fa-solid fa-plus text-sm"></i>
            </button>
          </div>
        )}
      </div>

      {/* Income vs Spending Tracker */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-2xl shadow-sm border border-purple-100">
        <h3 className="text-sm font-semibold mb-3 text-purple-900 flex items-center">
          <i className="fa-solid fa-wallet mr-2"></i>
          Income vs UPI Spending
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-2 rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Total Income</p>
            <p className="text-lg font-bold text-green-600 tabular-nums">₹{stats.totalIncome.toLocaleString()}</p>
            <p className="text-[9px] text-gray-400 mt-1">This Month</p>
          </div>
          <div className="bg-white p-2 rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase font-semibold">UPI Spent</p>
            <p className="text-lg font-bold text-orange-600 tabular-nums">₹{stats.upiSpending.toLocaleString()}</p>
            <p className="text-[9px] text-gray-400 mt-1">Expenses</p>
          </div>
          <div className="bg-white p-2 rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Remaining</p>
            <p className={`text-lg font-bold tabular-nums ${stats.remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{stats.remainingBalance.toLocaleString()}
            </p>
            <p className="text-[9px] text-gray-400 mt-1">{stats.remainingBalance >= 0 ? 'Available' : 'Overspent'}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-purple-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700 font-semibold">Spending Rate:</span>
            <span className="text-xl font-black text-purple-700 tabular-nums">
              {stats.totalIncome > 0 ? ((stats.upiSpending / stats.totalIncome) * 100).toFixed(1) : '0'}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold mb-4">Expense Distribution</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#3b82f6' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card Utilization Pie Chart */}
      {cardUtilizationData.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold mb-3">Card Utilization Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cardUtilizationData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: '12px', fontWeight: '600' }}
                >
                  {cardUtilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              {cardUtilizationData.map((card, index) => (
                <div key={card.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-600">{card.name}</p>
                    <p className="text-xs font-bold text-gray-800">₹{card.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Card-wise Usage Comparison */}
      {comparisonData.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold">Monthly card spend breakdown</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {stats.previousMonth} vs {selectedMonth}
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Last Month</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-indigo-600 rounded"></div>
                <span className="text-gray-600">This Month</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="lastMonth" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="thisMonth" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Last Month</p>
                <p className="text-sm font-bold text-blue-600">
                  ₹{comparisonData.reduce((sum, item) => sum + item.lastMonth, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">This Month</p>
                <p className="text-sm font-bold text-indigo-600">
                  ₹{comparisonData.reduce((sum, item) => sum + item.thisMonth, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Change</p>
                <p className={`text-sm font-bold ${comparisonData.reduce((sum, item) => sum + item.thisMonth, 0) >
                  comparisonData.reduce((sum, item) => sum + item.lastMonth, 0)
                  ? 'text-red-600'
                  : 'text-green-600'
                  }`}>
                  {comparisonData.reduce((sum, item) => sum + item.thisMonth, 0) >
                    comparisonData.reduce((sum, item) => sum + item.lastMonth, 0)
                    ? '+'
                    : ''}
                  ₹{(
                    comparisonData.reduce((sum, item) => sum + item.thisMonth, 0) -
                    comparisonData.reduce((sum, item) => sum + item.lastMonth, 0)
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CC Utilization Breakdown */}
      {totalCCUsageThisMonth > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-semibold">Spender portion breakdown</h3>
              <p className="text-xs text-gray-500 mt-1">
                Total CC Usage: <span className="font-bold text-gray-700">₹{totalCCUsageThisMonth.toLocaleString()}</span>
              </p>
            </div>
            <button
              onClick={() => setIsAddingCC(true)}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-semibold hover:bg-blue-100"
            >
              + Add Usage
            </button>
          </div>

          {ccComparisonData.length > 0 && (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ccComparisonData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    style={{ fontSize: '12px', fontWeight: '600' }}
                  >
                    {ccComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CC_COLORS[index % CC_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{mainSpenderName}'s Portion:</span>
              <span className="text-sm font-bold text-blue-600">₹{mainSpenderPortion.toLocaleString()}</span>
            </div>
            {ccUsedForOthers > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Used for Others:</span>
                <span className="text-sm font-bold text-green-600">₹{ccUsedForOthers.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* CC Utilization List */}
          {ccUtilizations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-600 mb-2">Breakdown by Person:</p>
              <div className="space-y-2">
                {ccUtilizations.map(cc => (
                  <div key={cc.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{cc.name}</p>
                      <p className="text-xs text-gray-500">{cc.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-green-600">₹{cc.amount.toLocaleString()}</p>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this CC utilization?')) {
                            handleDeleteCCUtil(cc.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-indigo-600 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="font-bold text-lg mb-1">Savings Goal?</h3>
          <p className="text-indigo-100 text-sm opacity-90">Keep your CC balance below 30% of your limit to boost your credit score.</p>
        </div>
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-500 rounded-full opacity-20"></div>
      </div>

      {/* Pending Bills Modal */}
      {showPendingBills && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-lg text-gray-800">Pending Bills</h3>
                <p className="text-xs text-gray-500 mt-1">All unpaid bills across all months</p>
              </div>
              <button
                onClick={() => setShowPendingBills(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-3">
              {stats.allUnpaidBills
                .map(bill => {
                  const paid = calculateTotalPaid(bill);
                  const due = bill.monthlyAmount;
                  const pending = due - paid;
                  const percentPaid = due > 0 ? (paid / due) * 100 : 0;

                  return (
                    <div
                      key={bill.id}
                      className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-xl border border-red-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-gray-800">{bill.cardName}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Due Date: {bill.dueDate || 'N/A'} | Month: {bill.month}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded">
                          {bill.category}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monthly Due:</span>
                          <span className="font-bold text-gray-800">₹{due.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Paid:</span>
                          <span className="font-semibold text-green-600">₹{paid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-red-200 pt-2">
                          <span className="text-gray-700 font-semibold">Pending:</span>
                          <span className="font-bold text-red-600">₹{pending.toLocaleString()}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                              style={{ width: `${percentPaid}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1 text-right">
                            {percentPaid.toFixed(0)}% paid
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {stats.allUnpaidBills.length === 0 && (
                <div className="text-center py-8">
                  <i className="fa-solid fa-check-circle text-5xl text-green-500 mb-3"></i>
                  <p className="text-gray-600 font-semibold">All bills paid!</p>
                  <p className="text-xs text-gray-400 mt-1">No pending bills across all months</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowPendingBills(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CC Utilization Modal */}
      {isAddingCC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-blue-700">Add CC Usage for Others</h3>
              <button onClick={() => setIsAddingCC(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Friend Name, Shop Name"
                  className="w-full border p-3 rounded-xl outline-none"
                  value={newCCUtil.name}
                  onChange={e => setNewCCUtil({ ...newCCUtil, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full border p-3 rounded-xl outline-none text-lg font-bold"
                  value={newCCUtil.amount || ''}
                  onChange={e => setNewCCUtil({ ...newCCUtil, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleAddCCUtil}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setIsAddingCC(false)}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
