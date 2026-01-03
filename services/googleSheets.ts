import { CreditCardBill, MedicalExpense, HomeExpense } from '../types';

// Google Apps Script Web App URL (deploy from your Google Sheet)
// See APPS_SCRIPT_SETUP.md for complete setup instructions
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhN1dlXFqjM0rxhqEIJzAJNupsZGfy7PZUEZZBcQdzfZsOjRevpeZNq41iFltqdTJm/exec';

// Sheet names/tabs
const SHEETS = {
    BILLS: 'Bills',
    MEDICAL: 'Medical',
    HOME: 'Home'
};

export const GoogleSheetsService = {
    // Initialize - check if Apps Script is accessible
    init: async () => {
        try {
            const response = await fetch(`${SCRIPT_URL}?action=get&sheet=${SHEETS.BILLS}`);
            if (response.ok) {
                console.log('✅ Google Apps Script connected');
                return true;
            }
            console.error('❌ Apps Script connection failed');
            return false;
        } catch (error) {
            console.error('❌ Apps Script error:', error);
            return false;
        }
    },

    // Save Bills to Sheet
    saveBills: async (bills: CreditCardBill[]) => {
        try {
            console.log(`📤 Saving ${bills.length} bills to Google Sheets...`);
            const data = [
                ['ID', 'Card Name', 'Category', 'Due Date', 'Month', 'Is EMI', 'EMI Details', 'Total Amount', 'Tenure', 'Monthly Amount', 'Paid Amount', 'Last Payment Date', 'Payments'],
                ...bills.map(b => [
                    b.id || '',
                    b.cardName || '',
                    b.category || '',
                    b.dueDate || '',
                    b.month || '',
                    b.isEmi ? 'Yes' : 'No',
                    b.emiDetails || '',
                    b.totalAmount || 0,
                    b.tenure || '',
                    b.monthlyAmount || 0,
                    b.paidAmount || 0,
                    b.lastPaymentDate || '',
                    JSON.stringify(b.payments || [])
                ])
            ];

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save',
                    sheet: SHEETS.BILLS,
                    values: data
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Bills saved to Google Sheets:', result);
                return result.success;
            }
            console.error('❌ Failed to save bills. Status:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return false;
        } catch (error) {
            console.error('❌ Error saving bills:', error);
            return false;
        }
    },

    // Get Bills from Sheet
    getBills: async (): Promise<CreditCardBill[]> => {
        try {
            const response = await fetch(`${SCRIPT_URL}?action=get&sheet=${SHEETS.BILLS}`);

            if (!response.ok) return [];

            const result = await response.json();
            if (!result.success || !result.data || result.data.length <= 1) return [];

            const rows = result.data.slice(1); // Skip header row

            return rows
                .filter((row: any[]) => row && row[0]) // Filter out empty rows
                .map((row: any[]) => ({
                    id: row[0] || '',
                    cardName: row[1] || '',
                    category: row[2] || '',
                    dueDate: row[3] || '',
                    month: row[4] || '',
                    isEmi: row[5] === 'Yes',
                    emiDetails: row[6] || '',
                    totalAmount: parseFloat(row[7]) || 0,
                    tenure: row[8] || undefined,
                    monthlyAmount: parseFloat(row[9]) || 0,
                    paidAmount: parseFloat(row[10]) || 0,
                    lastPaymentDate: row[11] || undefined,
                    payments: row[12] ? (typeof row[12] === 'string' ? JSON.parse(row[12]) : row[12]) : []
                }));
        } catch (error) {
            console.error('❌ Error fetching bills:', error);
            return [];
        }
    },

    // Save Medical Expenses
    saveMedical: async (medical: MedicalExpense[]) => {
        try {
            console.log(`📤 Saving ${medical.length} medical expenses to Google Sheets...`);
            const data = [
                ['ID', 'Date', 'Amount', 'Payment Method', 'Description'],
                ...medical.map(m => [
                    m.id || '',
                    m.date || '',
                    m.amount || 0,
                    m.paymentMethod || '',
                    m.description || ''
                ])
            ];

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save',
                    sheet: SHEETS.MEDICAL,
                    values: data
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Medical expenses saved to Google Sheets:', result);
                return result.success;
            }
            console.error('❌ Failed to save medical. Status:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return false;
        } catch (error) {
            console.error('❌ Error saving medical:', error);
            return false;
        }
    },

    // Get Medical Expenses
    getMedical: async (): Promise<MedicalExpense[]> => {
        try {
            const response = await fetch(`${SCRIPT_URL}?action=get&sheet=${SHEETS.MEDICAL}`);

            if (!response.ok) return [];

            const result = await response.json();
            if (!result.success || !result.data || result.data.length <= 1) return [];

            const rows = result.data.slice(1);

            return rows
                .filter((row: any[]) => row && row[0]) // Filter out empty rows
                .map((row: any[]) => ({
                    id: row[0] || '',
                    date: row[1] || '',
                    amount: parseFloat(row[2]) || 0,
                    paymentMethod: row[3] as PaymentMethod || PaymentMethod.CASH,
                    description: row[4] || ''
                }));
        } catch (error) {
            console.error('❌ Error fetching medical:', error);
            return [];
        }
    },

    // Save Home Expenses
    saveHome: async (home: HomeExpense[]) => {
        try {
            console.log(`📤 Saving ${home.length} home expenses to Google Sheets...`);
            const data = [
                ['ID', 'Date', 'Amount', 'Payment Method', 'Category', 'Description'],
                ...home.map(h => [
                    h.id || '',
                    h.date || '',
                    h.amount || 0,
                    h.paymentMethod || '',
                    h.category || '',
                    h.description || ''
                ])
            ];

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save',
                    sheet: SHEETS.HOME,
                    values: data
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Home expenses saved to Google Sheets:', result);
                return result.success;
            }
            console.error('❌ Failed to save home expenses. Status:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return false;
        } catch (error) {
            console.error('❌ Error saving home:', error);
            return false;
        }
    },

    // Get Home Expenses
    getHome: async (): Promise<HomeExpense[]> => {
        try {
            const response = await fetch(`${SCRIPT_URL}?action=get&sheet=${SHEETS.HOME}`);

            if (!response.ok) return [];

            const result = await response.json();
            if (!result.success || !result.data || result.data.length <= 1) return [];

            const rows = result.data.slice(1);

            return rows
                .filter((row: any[]) => row && row[0]) // Filter out empty rows
                .map((row: any[]) => ({
                    id: row[0] || '',
                    date: row[1] || '',
                    amount: parseFloat(row[2]) || 0,
                    paymentMethod: row[3] as PaymentMethod || PaymentMethod.CASH,
                    category: row[4] || '',
                    description: row[5] || ''
                }));
        } catch (error) {
            console.error('❌ Error fetching home:', error);
            return [];
        }
    },

    // Sync all data
    syncAll: async (bills: CreditCardBill[], medical: MedicalExpense[], home: HomeExpense[]) => {
        const results = await Promise.all([
            GoogleSheetsService.saveBills(bills),
            GoogleSheetsService.saveMedical(medical),
            GoogleSheetsService.saveHome(home)
        ]);

        return results.every(r => r);
    }
};
