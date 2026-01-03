
import { PaymentMethod } from './types';

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const YEARS = ['2024', '2025', '2026', '2027'];

export const PAYMENT_METHODS = [
  PaymentMethod.CARD,
  PaymentMethod.CASH,
  PaymentMethod.UPI
];

export const BILL_CATEGORIES = [
  'Groceries',
  'Utilities',
  'Travel',
  'Dining',
  'Shopping',
  'Health',
  'Education',
  'Other'
];

export const HOME_EXPENSE_CATEGORIES = [
  'Groceries',
  'Rent',
  'Electricity',
  'Water',
  'Gas',
  'Internet',
  'Maintenance',
  'Furniture',
  'Kitchen',
  'Cleaning',
  'Other'
];

export const generateMonthOptions = () => {
  const options: string[] = [];
  const startYear = 2024;
  const endYear = 2027;
  for (let year = startYear; year <= endYear; year++) {
    for (const month of MONTHS) {
      options.push(`${month}-${year.toString().slice(-2)}`);
    }
  }
  return options;
};

export const MOCK_DATA_BILLS = [
  {
    id: '1',
    cardName: 'HDFC Regalia',
    category: 'Shopping',
    dueDate: '2025-12-15',
    month: 'Dec-25',
    isEmi: true,
    emiDetails: 'iPhone 16 Pro',
    totalAmount: 120000,
    tenure: '3/12',
    monthlyAmount: 10000,
    paidAmount: 10000,
    lastPaymentDate: '2025-12-10'
  },
  {
    id: '2',
    cardName: 'ICICI Amazon Pay',
    category: 'Groceries',
    dueDate: '2025-12-20',
    month: 'Dec-25',
    isEmi: false,
    totalAmount: 4500,
    monthlyAmount: 4500,
    paidAmount: 0,
  }
];
