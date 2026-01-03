import { CreditCardBill, MedicalExpense, HomeExpense } from '../types';

// Google Apps Script Web App URL (deploy from your Google Sheet)
// See APPS_SCRIPT_SETUP.md for setup instructions
const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec';

// Sheet names/tabs
const SHEETS = {
    BILLS: 'Bills',
    MEDICAL: 'Medical',
    HOME: 'Home'
};

export const GoogleSheetsService = {
    // Initialize - check if sheets are accessible
    init: async () => {
        try {
            const response = await fetch(`${BASE_URL}?key=${API_KEY}`);
            if (response.ok) {
                console.log('✅ Google Sheets connected');
                return true;
            }
            console.error('❌ Google Sheets connection failed');
            return false;
        } catch (error) {
            console.error('❌ Google Sheets error:', error);
            return false;
        }
    },

    // Save Bills to Sheet
    saveBills: async (bills: CreditCardBill[]) => {
        try {
            // Convert bills to 2D array for sheets
            const data = [
                ['ID', 'Card Name', 'Category', 'Due Date', 'Month', 'Is EMI', 'EMI Details', 'Total Amount', 'Tenure', 'Monthly Amount', 'Payments'],
                ...bills.map(b => [
                    b.id,
                    b.cardName,
                    b.category,
                    b.dueDate,
                    b.month,
                    b.isEmi ? 'Yes' : 'No',
                    b.emiDetails || '',
                    b.totalAmount,
                    b.tenure || '',
                    b.monthlyAmount,
                    JSON.stringify(b.payments || [])
                ])
            ];

            const response = await fetch(
                `${BASE_URL}/values/${SHEETS.BILLS}!A1:K${data.length}?valueInputOption=RAW&key=${API_KEY}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values: data })
                }
            );

            if (response.ok) {
                console.log('✅ Bills saved to Google Sheets');
                return true;
            }
            console.error('❌ Failed to save bills');
            return false;
        } catch (error) {
            console.error('❌ Error saving bills:', error);
            return false;
        }
    },

    // Get Bills from Sheet
    getBills: async (): Promise<CreditCardBill[]> => {
        try {
            const response = await fetch(
                `${BASE_URL}/values/${SHEETS.BILLS}!A2:K?key=${API_KEY}`
            );

            if (!response.ok) return [];

            const data = await response.json();
            const rows = data.values || [];

            return rows.map((row: any[]) => ({
                id: row[0],
                cardName: row[1],
                category: row[2],
                dueDate: row[3],
                month: row[4],
                isEmi: row[5] === 'Yes',
                emiDetails: row[6],
                totalAmount: parseFloat(row[7]),
                tenure: row[8],
                monthlyAmount: parseFloat(row[9]),
                payments: row[10] ? JSON.parse(row[10]) : [],
                paidAmount: 0
            }));
        } catch (error) {
            console.error('❌ Error fetching bills:', error);
            return [];
        }
    },

    // Save Medical Expenses
    saveMedical: async (medical: MedicalExpense[]) => {
        try {
            const data = [
                ['ID', 'Date', 'Amount', 'Payment Method', 'Description'],
                ...medical.map(m => [
                    m.id,
                    m.date,
                    m.amount,
                    m.paymentMethod,
                    m.description
                ])
            ];

            const response = await fetch(
                `${BASE_URL}/values/${SHEETS.MEDICAL}!A1:E${data.length}?valueInputOption=RAW&key=${API_KEY}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values: data })
                }
            );

            return response.ok;
        } catch (error) {
            console.error('❌ Error saving medical:', error);
            return false;
        }
    },

    // Get Medical Expenses
    getMedical: async (): Promise<MedicalExpense[]> => {
        try {
            const response = await fetch(
                `${BASE_URL}/values/${SHEETS.MEDICAL}!A2:E?key=${API_KEY}`
            );

            if (!response.ok) return [];

            const data = await response.json();
            const rows = data.values || [];

            return rows.map((row: any[]) => ({
                id: row[0],
                date: row[1],
                amount: parseFloat(row[2]),
                paymentMethod: row[3],
                description: row[4]
            }));
        } catch (error) {
            console.error('❌ Error fetching medical:', error);
            return [];
        }
    },

    // Save Home Expenses
    saveHome: async (home: HomeExpense[]) => {
        try {
            const data = [
                ['ID', 'Date', 'Amount', 'Payment Method', 'Category', 'Description'],
                ...home.map(h => [
                    h.id,
                    h.date,
                    h.amount,
                    h.paymentMethod,
                    h.category,
                    h.description
                ])
            ];

            const response = await fetch(
                `${BASE_URL}/values/${SHEETS.HOME}!A1:F${data.length}?valueInputOption=RAW&key=${API_KEY}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values: data })
                }
            );

            return response.ok;
        } catch (error) {
            console.error('❌ Error saving home:', error);
            return false;
        }
    },

    // Get Home Expenses
    getHome: async (): Promise<HomeExpense[]> => {
        try {
            const response = await fetch(
                `${BASE_URL}/values/${SHEETS.HOME}!A2:F?key=${API_KEY}`
            );

            if (!response.ok) return [];

            const data = await response.json();
            const rows = data.values || [];

            return rows.map((row: any[]) => ({
                id: row[0],
                date: row[1],
                amount: parseFloat(row[2]),
                paymentMethod: row[3],
                category: row[4],
                description: row[5]
            }));
        } catch (error) {
            console.error('❌ Error fetching home:', error);
            return [];
        }
    },

    // Sync all data (read-only - API keys can't write)
    syncAll: async (bills: CreditCardBill[], medical: MedicalExpense[], home: HomeExpense[]) => {
        try {
            // API keys are read-only, so we just verify connection
            // Data is saved to localStorage and read from sheets
            const response = await fetch(`${BASE_URL}?key=${API_KEY}`);
            if (response.ok) {
                console.log('✅ Google Sheets sync enabled (read-only mode)');
                return true;
            }
            console.error('❌ Failed to connect to Google Sheets');
            return false;
        } catch (error) {
            console.error('❌ Error syncing:', error);
            return false;
        }
    }
};
