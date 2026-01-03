import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { CreditCardBill, MedicalExpense, HomeExpense } from '../types';

// Family ID - All family members should use the same familyId
// You can set this in localStorage or pass it during setup
const getFamilyId = (): string => {
    let familyId = localStorage.getItem('familyId');
    if (!familyId) {
        // Generate a unique family ID for first-time users
        familyId = 'family_' + Date.now();
        localStorage.setItem('familyId', familyId);
    }
    return familyId;
};

export const CloudStorageService = {
    // Set Family ID manually (for joining existing family)
    setFamilyId: (id: string) => {
        localStorage.setItem('familyId', id);
    },

    // Get current Family ID
    getFamilyId: getFamilyId,

    // Credit Card Bills
    saveBills: async (bills: CreditCardBill[]) => {
        const familyId = getFamilyId();
        const billsRef = doc(db, 'families', familyId, 'data', 'bills');
        await setDoc(billsRef, { bills, updatedAt: Timestamp.now() });
    },

    getBills: async (): Promise<CreditCardBill[]> => {
        try {
            const familyId = getFamilyId();
            const billsRef = doc(db, 'families', familyId, 'data', 'bills');
            const snapshot = await getDocs(collection(db, 'families', familyId, 'data'));

            // For now, return empty array - will be populated by real-time listener
            return [];
        } catch (error) {
            console.error('Error fetching bills:', error);
            return [];
        }
    },

    // Medical Expenses
    saveMedical: async (medical: MedicalExpense[]) => {
        const familyId = getFamilyId();
        const medicalRef = doc(db, 'families', familyId, 'data', 'medical');
        await setDoc(medicalRef, { medical, updatedAt: Timestamp.now() });
    },

    // Home Expenses
    saveHome: async (home: HomeExpense[]) => {
        const familyId = getFamilyId();
        const homeRef = doc(db, 'families', familyId, 'data', 'home');
        await setDoc(homeRef, { home, updatedAt: Timestamp.now() });
    },

    // Real-time listener for bills
    listenToBills: (callback: (bills: CreditCardBill[]) => void) => {
        const familyId = getFamilyId();
        const billsRef = doc(db, 'families', familyId, 'data', 'bills');

        return onSnapshot(billsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                callback(data.bills || []);
            }
        });
    },

    // Real-time listener for medical
    listenToMedical: (callback: (medical: MedicalExpense[]) => void) => {
        const familyId = getFamilyId();
        const medicalRef = doc(db, 'families', familyId, 'data', 'medical');

        return onSnapshot(medicalRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                callback(data.medical || []);
            }
        });
    },

    // Real-time listener for home
    listenToHome: (callback: (home: HomeExpense[]) => void) => {
        const familyId = getFamilyId();
        const homeRef = doc(db, 'families', familyId, 'data', 'home');

        return onSnapshot(homeRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                callback(data.home || []);
            }
        });
    },

    // Sync local data to cloud (for initial migration)
    syncLocalToCloud: async (bills: CreditCardBill[], medical: MedicalExpense[], home: HomeExpense[]) => {
        try {
            await CloudStorageService.saveBills(bills);
            await CloudStorageService.saveMedical(medical);
            await CloudStorageService.saveHome(home);
            return true;
        } catch (error) {
            console.error('Error syncing to cloud:', error);
            return false;
        }
    }
};
