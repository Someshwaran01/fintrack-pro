
import { CreditCardBill, MedicalExpense, HomeExpense, Income, CreditCardLimit, Savings } from '../types';
import { SyncService } from './syncService';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const BILLS_KEY = 'fintrack_bills';
const MEDICAL_KEY = 'fintrack_medical';
const HOME_KEY = 'fintrack_home';
const INCOME_KEY = 'fintrack_income';
const SAVINGS_KEY = 'fintrack_savings';
const CC_LIMITS_KEY = 'fintrack_cc_limits';
const MEMBERS_KEY = 'fintrack_members';
const ONBOARDING_KEY = 'fintrack_onboarding_complete';

// Hybrid storage: Use Firebase if family ID is set, otherwise use localStorage
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

        const localBills = StorageService.getBills();
        const localMedical = StorageService.getMedical();
        const localHome = StorageService.getHome();
        const localIncome = StorageService.getIncome();
        const localSavings = StorageService.getSavings();
        const localCCLimits = StorageService.getCreditCardLimits();

        const mergedBills = familyData.bills && familyData.bills.length > 0 ? familyData.bills : localBills;
        const mergedMedical = familyData.medical && familyData.medical.length > 0 ? familyData.medical : localMedical;
        const mergedHome = familyData.home && familyData.home.length > 0 ? familyData.home : localHome;
        const mergedIncome = familyData.income && familyData.income.length > 0 ? familyData.income : localIncome;
        const mergedSavings = familyData.savings && familyData.savings.length > 0 ? familyData.savings : localSavings;
        const mergedCCLimits = familyData.cc_limits && familyData.cc_limits.length > 0 ? familyData.cc_limits : localCCLimits;

        localStorage.setItem(BILLS_KEY, JSON.stringify(mergedBills));
        localStorage.setItem(MEDICAL_KEY, JSON.stringify(mergedMedical));
        localStorage.setItem(HOME_KEY, JSON.stringify(mergedHome));
        localStorage.setItem(INCOME_KEY, JSON.stringify(mergedIncome));
        localStorage.setItem(SAVINGS_KEY, JSON.stringify(mergedSavings));
        localStorage.setItem(CC_LIMITS_KEY, JSON.stringify(mergedCCLimits));
        localStorage.setItem(MEMBERS_KEY, JSON.stringify(mergedMembers));
        localStorage.setItem(ONBOARDING_KEY, mergedOnboardingComplete.toString());

        return {
          bills: mergedBills,
          medical: mergedMedical,
          home: mergedHome,
          income: mergedIncome,
          savings: mergedSavings,
          cc_limits: mergedCCLimits,
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
  migrateToCloud: async (bills: CreditCardBill[], medical: MedicalExpense[], home: HomeExpense[], income: Income[], savings: Savings[], cc_limits: CreditCardLimit[]) => {
    if (!StorageService.isCloudSyncEnabled()) return;

    try {
      await SyncService.migrateLocalData(bills, medical, home, income, savings, cc_limits);
    } catch (error) {
      console.error('Failed to migrate to cloud:', error);
    }
  },

  _downloadOrShare: async (content: string, filename: string, mimeType: string, extension: string) => {
    try {
      if (Capacitor.isNativePlatform()) {
        const fullFileName = `${filename}.${extension}`;
        // Write the file to Cache directory
        const result = await Filesystem.writeFile({
          path: fullFileName,
          data: content,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        // Share via native intent
        await Share.share({
          title: filename,
          url: result.uri,
          dialogTitle: 'Export Data',
        });
        return;
      }

      // Web fallback
      if (navigator.share && navigator.canShare) {
        const file = new File([content], `${filename}.${extension}`, { type: mimeType });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: filename,
            files: [file]
          });
          return; // Successfully shared!
        }
      }
    } catch (e) {
      console.log('Share API not supported or failed', e);
    }
    // Final generic web download fallback
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportToCSV: (data: any[], filename: string) => {
    let headers = '';
    let rows = '';
    if (data && data.length > 0) {
      headers = Object.keys(data[0]).join(',');
      rows = data.map(obj => {
        return Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      }).join('\n');
    }
    const csvContent = headers + (rows ? "\n" + rows : "");
    StorageService._downloadOrShare(csvContent, filename, 'text/csv;charset=utf-8;', 'csv');
  },

  exportToJSON: (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    StorageService._downloadOrShare(jsonContent, filename, 'application/json;charset=utf-8;', 'json');
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

