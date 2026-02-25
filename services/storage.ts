
import { CreditCardBill, MedicalExpense, HomeExpense, Income, CreditCardLimit, Savings } from '../types';
import { SyncService } from './syncService';

const BILLS_KEY = 'fintrack_bills';
const MEDICAL_KEY = 'fintrack_medical';
const HOME_KEY = 'fintrack_home';
const INCOME_KEY = 'fintrack_income';
const SAVINGS_KEY = 'fintrack_savings';
const CC_LIMITS_KEY = 'fintrack_cc_limits';
const MEMBERS_KEY = 'fintrack_members';
const ONBOARDING_KEY = 'fintrack_onboarding_complete';

// Hybrid storage: Use Supabase if family ID is set, otherwise use localStorage
export const StorageService = {
  // Check if using cloud sync
  isCloudSyncEnabled: () => {
    return SyncService.getFamilyId() !== null;
  },

  getMembers: (): string[] => {
    const data = localStorage.getItem(MEMBERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getOnboardingComplete: (): boolean => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  },

  saveOnboardingData: async (members: string[], onboardingComplete: boolean) => {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
    localStorage.setItem(ONBOARDING_KEY, onboardingComplete.toString());

    if (SyncService.getFamilyId()) {
      await SyncService.saveOnboardingData(members, onboardingComplete);
    }
  },

  saveBills: async (bills: CreditCardBill[]) => {
    if (StorageService.isCloudSyncEnabled()) {
      await SyncService.saveBills(bills);
    }
    // Always save to localStorage as backup
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
  },

  getBills: (): CreditCardBill[] => {
    const data = localStorage.getItem(BILLS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveMedical: async (expenses: MedicalExpense[]) => {
    if (StorageService.isCloudSyncEnabled()) {
      await SyncService.saveMedical(expenses);
    }
    // Always save to localStorage as backup
    localStorage.setItem(MEDICAL_KEY, JSON.stringify(expenses));
  },

  getMedical: (): MedicalExpense[] => {
    const data = localStorage.getItem(MEDICAL_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveHome: async (expenses: HomeExpense[]) => {
    if (StorageService.isCloudSyncEnabled()) {
      await SyncService.saveHome(expenses);
    }
    // Always save to localStorage as backup
    localStorage.setItem(HOME_KEY, JSON.stringify(expenses));
  },

  getHome: (): HomeExpense[] => {
    const data = localStorage.getItem(HOME_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveIncome: async (incomes: Income[]) => {
    if (StorageService.isCloudSyncEnabled()) {
      await SyncService.saveIncome(incomes);
    }
    // Always save to localStorage as backup
    localStorage.setItem(INCOME_KEY, JSON.stringify(incomes));
  },

  getIncome: (): Income[] => {
    const data = localStorage.getItem(INCOME_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveSavings: async (savings: Savings[]) => {
    if (StorageService.isCloudSyncEnabled()) {
      await SyncService.saveSavings(savings);
    }
    // Always save to localStorage as backup
    localStorage.setItem(SAVINGS_KEY, JSON.stringify(savings));
  },

  getSavings: (): Savings[] => {
    const data = localStorage.getItem(SAVINGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveCreditCardLimits: async (limits: CreditCardLimit[]) => {
    if (StorageService.isCloudSyncEnabled()) {
      await SyncService.saveCreditCardLimits(limits);
    }
    // Always save to localStorage as backup
    localStorage.setItem(CC_LIMITS_KEY, JSON.stringify(limits));
  },

  getCreditCardLimits: (): CreditCardLimit[] => {
    const data = localStorage.getItem(CC_LIMITS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Load data from cloud on initial sync
  loadFromCloud: async () => {
    if (!StorageService.isCloudSyncEnabled()) return null;

    try {
      const familyData = await SyncService.getFamilyData();
      if (familyData) {
        // Update localStorage with cloud data
        const localMembers = StorageService.getMembers();
        const localOnboarding = StorageService.getOnboardingComplete();

        const mergedMembers = familyData.members && familyData.members.length > 0
          ? familyData.members
          : localMembers;

        const mergedOnboardingComplete = familyData.onboarding_complete || mergedMembers.length > 0 || localOnboarding;

        localStorage.setItem(BILLS_KEY, JSON.stringify(familyData.bills || []));
        localStorage.setItem(MEDICAL_KEY, JSON.stringify(familyData.medical || []));
        localStorage.setItem(HOME_KEY, JSON.stringify(familyData.home || []));
        localStorage.setItem(INCOME_KEY, JSON.stringify(familyData.income || []));
        localStorage.setItem(SAVINGS_KEY, JSON.stringify(familyData.savings || []));
        localStorage.setItem(CC_LIMITS_KEY, JSON.stringify(familyData.cc_limits || []));
        localStorage.setItem(MEMBERS_KEY, JSON.stringify(mergedMembers));
        localStorage.setItem(ONBOARDING_KEY, mergedOnboardingComplete.toString());

        return {
          bills: familyData.bills || [],
          medical: familyData.medical || [],
          home: familyData.home || [],
          income: familyData.income || [],
          savings: familyData.savings || [],
          cc_limits: familyData.cc_limits || [],
          members: mergedMembers,
          onboarding_complete: mergedOnboardingComplete
        };
      }
    } catch (error) {
      console.error('Failed to load from cloud:', error);
    }
    return null;
  },

  // Migrate local data to cloud
  migrateToCloud: async (bills: CreditCardBill[], medical: MedicalExpense[], home: HomeExpense[], income: Income[], savings: Savings[]) => {
    if (!StorageService.isCloudSyncEnabled()) return;

    try {
      await SyncService.migrateLocalData(bills, medical, home, income, savings);
    } catch (error) {
      console.error('Failed to migrate to cloud:', error);
    }
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

