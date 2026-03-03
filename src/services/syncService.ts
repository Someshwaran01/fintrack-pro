import { collection, doc, getDoc, getDocs, setDoc, query, where, onSnapshot, writeBatch, Timestamp, writeBatch as firestoreWriteBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { CreditCardBill, MedicalExpense, HomeExpense, Income, Savings, CreditCardLimit } from '../types';

export interface FamilyData {
    family_id: string;
    members: string[];
    onboarding_complete: boolean;
    bills: CreditCardBill[];
    medical: MedicalExpense[];
    home: HomeExpense[];
    income: Income[];
    savings?: Savings[];
    cc_limits?: CreditCardLimit[];
    last_updated: string;
}

export class SyncService {
    private static familyId: string | null = null;
    private static unsubscribeListeners: (() => void)[] = [];

    // Set the family ID for syncing
    static setFamilyId(familyId: string) {
        this.familyId = familyId;
        localStorage.setItem('fintrack_family_id', familyId);
    }

    // Get the current family ID
    static getFamilyId(): string | null {
        if (!this.familyId) {
            this.familyId = localStorage.getItem('fintrack_family_id');
        }
        return this.familyId;
    }

    // Clear family ID (logout)
    static clearFamilyId() {
        this.familyId = null;
        localStorage.removeItem('fintrack_family_id');
        this.unsubscribe();
    }

    // Initialize or get family data
    static async initializeFamily(familyId: string): Promise<FamilyData> {
        if (!isFirebaseConfigured()) {
            throw new Error('Firebase is not configured. Add the Firebase variables in your environment.');
        }

        const normalizedFamilyId = familyId.trim();
        const familyRef = doc(db, 'family_data', normalizedFamilyId);
        const familySnap = await getDoc(familyRef);

        if (familySnap.exists()) {
            const data = familySnap.data();
            return {
                family_id: normalizedFamilyId,
                members: data.members || [],
                onboarding_complete: !!data.onboarding_complete,
                bills: data.bills || [],
                medical: data.medical || [],
                home: data.home || [],
                income: data.income || [],
                savings: data.savings || [],
                cc_limits: data.cc_limits || [],
                last_updated: data.last_updated || new Date().toISOString(),
            };
        } else {
            // Create family if it doesn't exist
            await setDoc(familyRef, {
                family_id: normalizedFamilyId,
                members: [],
                onboarding_complete: false,
                last_updated: new Date().toISOString()
            });

            return {
                family_id: normalizedFamilyId,
                members: [],
                onboarding_complete: false,
                bills: [],
                medical: [],
                home: [],
                income: [],
                savings: [],
                cc_limits: [],
                last_updated: new Date().toISOString(),
            };
        }
    }

    // Save bills array straight to document
    static async saveBills(bills: CreditCardBill[]): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        const familyRef = doc(db, 'family_data', familyId);
        await setDoc(familyRef, { bills, last_updated: new Date().toISOString() }, { merge: true });
    }

    // Save medical expenses
    static async saveMedical(medical: MedicalExpense[]): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        const familyRef = doc(db, 'family_data', familyId);
        await setDoc(familyRef, { medical, last_updated: new Date().toISOString() }, { merge: true });
    }

    // Save home expenses
    static async saveHome(home: HomeExpense[]): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        const familyRef = doc(db, 'family_data', familyId);
        await setDoc(familyRef, { home, last_updated: new Date().toISOString() }, { merge: true });
    }

    // Save income
    static async saveIncome(income: Income[]): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        const familyRef = doc(db, 'family_data', familyId);
        await setDoc(familyRef, { income, last_updated: new Date().toISOString() }, { merge: true });
    }

    // Save savings
    static async saveSavings(savings: Savings[]): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        const familyRef = doc(db, 'family_data', familyId);
        await setDoc(familyRef, { savings, last_updated: new Date().toISOString() }, { merge: true });
    }

    // Save CC Limits
    static async saveCreditCardLimits(cc_limits: CreditCardLimit[]): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        const familyRef = doc(db, 'family_data', familyId);
        await setDoc(familyRef, { cc_limits, last_updated: new Date().toISOString() }, { merge: true });
    }

    // Get all family data
    static async getFamilyData(): Promise<FamilyData | null> {
        const familyId = this.getFamilyId();
        if (!familyId) return null;

        const familyRef = doc(db, 'family_data', familyId);
        const familySnap = await getDoc(familyRef);

        if (familySnap.exists()) {
            const data = familySnap.data();
            return {
                family_id: familyId,
                members: data.members || [],
                onboarding_complete: !!data.onboarding_complete || (data.members && data.members.length > 0),
                bills: data.bills || [],
                medical: data.medical || [],
                home: data.home || [],
                income: data.income || [],
                savings: data.savings || [],
                cc_limits: data.cc_limits || [],
                last_updated: data.last_updated || new Date().toISOString(),
            };
        }
        return null;
    }

    // Subscribe to real-time updates
    static subscribeToChanges(
        onBillsChange: (bills: CreditCardBill[]) => void,
        onMedicalChange: (medical: MedicalExpense[]) => void,
        onHomeChange: (home: HomeExpense[]) => void,
        onIncomeChange: (income: Income[]) => void,
        onSavingsChange?: (savings: Savings[]) => void,
        onCCLimitsChange?: (limits: CreditCardLimit[]) => void
    ) {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        this.unsubscribe(); // Clean up existing array of unsubscribers if any

        const familyRef = doc(db, 'family_data', familyId);

        const unsubscribeDoc = onSnapshot(familyRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                onBillsChange(data.bills || []);
                onMedicalChange(data.medical || []);
                onHomeChange(data.home || []);
                onIncomeChange(data.income || []);
                if (onSavingsChange) onSavingsChange(data.savings || []);
                if (onCCLimitsChange) onCCLimitsChange(data.cc_limits || []);
            }
        }, (error) => {
            console.error("Firestore Error in subscription:", error);
        });

        this.unsubscribeListeners.push(unsubscribeDoc);
    }

    // Unsubscribe from real-time updates
    static unsubscribe() {
        this.unsubscribeListeners.forEach(unsub => unsub());
        this.unsubscribeListeners = [];
    }

    // Migrate local data to Firebase
    static async migrateLocalData(
        bills: CreditCardBill[],
        medical: MedicalExpense[],
        home: HomeExpense[],
        income: Income[],
        savings: Savings[],
        cc_limits: CreditCardLimit[]
    ): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) throw new Error('No family ID set');

        const familyRef = doc(db, 'family_data', familyId);
        await setDoc(familyRef, {
            bills,
            medical,
            home,
            income,
            savings,
            cc_limits,
            last_updated: new Date().toISOString()
        }, { merge: true });
    }

    // Save members and onboarding status
    static async saveOnboardingData(members: string[], onboardingComplete: boolean): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        const userName = members.length > 0 ? members[0] : "Admin";

        const familyRef = doc(db, 'family_data', familyId);
        await setDoc(familyRef, {
            members,
            user_name: userName,
            onboarding_complete: onboardingComplete,
            last_updated: new Date().toISOString()
        }, { merge: true });
    }
}
