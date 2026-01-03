
import { CreditCardBill, MedicalExpense } from '../types';

const BILLS_KEY = 'fintrack_bills';
const MEDICAL_KEY = 'fintrack_medical';

export const StorageService = {
  saveBills: (bills: CreditCardBill[]) => {
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
  },
  getBills: (): CreditCardBill[] => {
    const data = localStorage.getItem(BILLS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveMedical: (expenses: MedicalExpense[]) => {
    localStorage.setItem(MEDICAL_KEY, JSON.stringify(expenses));
  },
  getMedical: (): MedicalExpense[] => {
    const data = localStorage.getItem(MEDICAL_KEY);
    return data ? JSON.parse(data) : [];
  },
  exportToCSV: (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  exportToJSON: (data: any[], filename: string) => {
    const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute("download", `${filename}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  importFromJSON: (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(Array.isArray(data) ? data : []);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
};
