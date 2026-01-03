import { CreditCardBill, MedicalExpense, HomeExpense } from '../types';

// Google Apps Script Web App URL (deploy from your Google Sheet)
// See APPS_SCRIPT_SETUP.md for complete setup instructions
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4l28D3GvUuSoIClcW5i1FVRpSHA3io8yJt6MvLFBh8h93EzhdK8PypxJVtyq5oFEc/exec';

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
                console.log('✅ Bills saved to Google Sheets');
                return result.success;
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
            const response = await fetch(`${SCRIPT_URL}?action=get&sheet=${SHEETS.BILLS}`);

            if (!response.ok) return [];

            const result = await response.json();
            if (!result.success || !result.data) return [];

            const rows = result.data.slice(1); // Skip header row

            return rows.map((row: any[]) => ({
                id: row[0],
                cardName: row[1],
                category: row[2],
                dueDate: row[3],
                month: row[4],
                isEmi: row[5] === 'Yes',
                emiDetails: row[6],
                totalAmount: parseFloat(row[7]),
                tenure: row[8] ? parseInt(row[8]) : undefined,
                monthlyAmount: parseFloat(row[9]),
                payments: row[10] ? JSON.parse(row[10]) : []
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
                return result.success;
            }
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
            if (!result.success || !result.data) return [];

            const rows = result.data.slice(1);

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
                return result.success;
            }
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
            if (!result.success || !result.data) return [];

            const rows = result.data.slice(1);

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
