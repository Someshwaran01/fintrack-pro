
import React, { useMemo, useState } from 'react';
import { CreditCardBill, MedicalExpense } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  bills: CreditCardBill[];
  medical: MedicalExpense[];
  selectedMonth: string;
}

const Dashboard: React.FC<DashboardProps> = ({ bills, medical, selectedMonth }) => {
  const [showPendingBills, setShowPendingBills] = useState(false);

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
    // Filter data by selected month
    const monthBills = bills.filter(b => b.month === selectedMonth);
    const monthMedical = medical.filter(m => {
      const expenseMonth = new Date(m.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', '-').replace(', ', '-');
      return expenseMonth === selectedMonth;
    });

    // Get previous month data
    const previousMonth = getPreviousMonth(selectedMonth);
    const prevMonthBills = bills.filter(b => b.month === previousMonth);

    const totalBills = monthBills.reduce((acc, b) => acc + b.monthlyAmount, 0);
    const totalPaidBills = monthBills.reduce((acc, b) => acc + calculateTotalPaid(b), 0);
    const totalMedical = monthMedical.reduce((acc, m) => acc + m.amount, 0);

    return {
      totalDue: totalBills - totalPaidBills,
      totalPaid: totalPaidBills,
      totalMedical,
      pendingCount: monthBills.filter(b => calculateTotalPaid(b) < b.monthlyAmount).length,
      monthBills,
      prevMonthBills,
      previousMonth
    };
  }, [bills, medical, selectedMonth]);

  const chartData = [
    { name: 'CC Bills', value: stats.totalPaid + stats.totalDue },
    { name: 'Medical', value: stats.totalMedical },
  ];

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

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Financial Snapshot</h1>
        <p className="text-gray-500 text-sm">{selectedMonth} - Real-time status</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => setShowPendingBills(true)}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-500 uppercase font-semibold">CC Due</p>
          <p className="text-xl font-bold text-red-600">₹{stats.totalDue.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1">{stats.pendingCount} Pending Bills</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-semibold">Medical</p>
          <p className="text-xl font-bold text-blue-600">₹{stats.totalMedical.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1">Total this period</p>
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
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card-wise Usage Comparison */}
      {comparisonData.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold">Card Usage Comparison</h3>
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
                <p className="text-xs text-gray-500 mt-1">{selectedMonth}</p>
              </div>
              <button
                onClick={() => setShowPendingBills(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-3">
              {stats.monthBills
                .filter(bill => calculateTotalPaid(bill) < bill.monthlyAmount)
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
                            Due: {bill.dueDate || 'N/A'}
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

              {stats.monthBills.filter(bill => calculateTotalPaid(bill) < bill.monthlyAmount).length === 0 && (
                <div className="text-center py-8">
                  <i className="fa-solid fa-check-circle text-5xl text-green-500 mb-3"></i>
                  <p className="text-gray-600 font-semibold">All bills paid!</p>
                  <p className="text-xs text-gray-400 mt-1">No pending bills for this month</p>
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
    </div>
  );
};

export default Dashboard;
