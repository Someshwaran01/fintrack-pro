export enum PaymentMethod {
  CARD = 'Card',
  CASH = 'Cash',
  UPI = 'UPI'
}

export type SpenderName = string;

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface CreditCardBill {
  id: string;
  cardName: string;
  category: string;
  dueDate: string;
  month: string; // Format: "Dec-25"
  isEmi: boolean;
  emiDetails?: string;
  totalAmount: number; // For EMI: Total value of purchase
  tenure?: string; // e.g., "6/12"
  monthlyAmount: number; // Amount due this month
  paidAmount: number; // Deprecated - kept for backward compatibility
  payments?: Payment[]; // New: multiple payments tracking
  lastPaymentDate?: string;
}

export interface MedicalExpense {
  id: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  spender?: SpenderName;
}

export interface HomeExpense {
  id: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  category: string;
  description: string;
  spender?: SpenderName;
}

export interface Income {
  id: string;
  month: string; // Format: "Jan-26"
  source: string; // e.g., "Salary", "Bonus", "Freelance"
  amount: number;
  receivedDate: string;
  spender: SpenderName; // Who received this income
  notes?: string;
}

export interface Savings {
  id: string;
  month: string; // Format: "Jan-26"
  category: string; // e.g., "Emergency Fund", "Investment", "FD", "Gold"
  amount: number;
  savedDate: string;
  spender: SpenderName; // Who saved this amount
  notes?: string;
}

export interface CreditCardLimit {
  id: string;
  cardName: string;
  creditLimit: number;
  billDate: number; // Day of month (1-31)
  dueDate: number; // Day of month (1-31)
  updatedDate: string;
  notes?: string;
}

export interface CCUtilization {
  id: string;
  name: string;
  amount: number;
  date: string;
}

export type AppTab = 'dashboard' | 'bills' | 'expenses' | 'income' | 'ai';
