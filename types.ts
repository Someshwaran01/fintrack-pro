
export enum PaymentMethod {
  CARD = 'Card',
  CASH = 'Cash',
  UPI = 'UPI'
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
  paidAmount: number;
  lastPaymentDate?: string;
}

export interface MedicalExpense {
  id: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
}

export type AppTab = 'dashboard' | 'bills' | 'medical';
