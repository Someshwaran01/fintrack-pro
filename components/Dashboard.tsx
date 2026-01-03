
import React, { useMemo } from 'react';
import { CreditCardBill, MedicalExpense } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  bills: CreditCardBill[];
  medical: MedicalExpense[];
  selectedMonth: string;
}

const Dashboard: React.FC<DashboardProps> = ({ bills, medical, selectedMonth }) => {
  const stats = useMemo(() => {
    // Filter data by selected month
    const monthBills = bills.filter(b => b.month === selectedMonth);
    const monthMedical = medical.filter(m => {
      const expenseMonth = new Date(m.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', '-').replace(', ', '-');
      return expenseMonth === selectedMonth;
    });

    const totalBills = monthBills.reduce((acc, b) => acc + b.monthlyAmount, 0);
    const totalPaidBills = monthBills.reduce((acc, b) => acc + b.paidAmount, 0);
    const totalMedical = monthMedical.reduce((acc, m) => acc + m.amount, 0);

    return {
      totalDue: totalBills - totalPaidBills,
      totalPaid: totalPaidBills,
      totalMedical,
      pendingCount: monthBills.filter(b => b.paidAmount < b.monthlyAmount).length
    };
  }, [bills, medical, selectedMonth]);

  const chartData = [
    { name: 'CC Bills', value: stats.totalPaid + stats.totalDue },
    { name: 'Medical', value: stats.totalMedical },
  ];

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Financial Snapshot</h1>
        <p className="text-gray-500 text-sm">{selectedMonth} - Real-time status</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
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

      <div className="bg-indigo-600 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="font-bold text-lg mb-1">Savings Goal?</h3>
          <p className="text-indigo-100 text-sm opacity-90">Keep your CC balance below 30% of your limit to boost your credit score.</p>
        </div>
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-500 rounded-full opacity-20"></div>
      </div>
    </div>
  );
};

export default Dashboard;
