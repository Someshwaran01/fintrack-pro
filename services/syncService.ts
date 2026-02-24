import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { supabaseConfig, isSupabaseConfigured } from '../config/supabase';
import { CreditCardBill, MedicalExpense, HomeExpense, Income, Savings, CreditCardLimit } from '../types';

// Initialize Supabase client
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

export interface FamilyData {
    family_id: string;
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
    private static realtimeChannel: RealtimeChannel | null = null;

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
        if (this.realtimeChannel) {
            supabase.removeChannel(this.realtimeChannel);
            this.realtimeChannel = null;
        }
    }

    // Initialize or get family data
    static async initializeFamily(familyId: string): Promise<FamilyData> {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
        }

        const { data, error } = await supabase
            .from('family_data')
            .select('*')
            .eq('family_id', familyId)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            return {
                family_id: data.family_id,
                bills: data.bills || [],
                medical: data.medical || [],
                home: data.home || [],
                income: data.income || [],
                savings: data.savings || [],
                cc_limits: data.cc_limits || [],
                last_updated: data.last_updated || new Date().toISOString(),
            };
        }

        // Family doesn't exist, create it with minimal schema for compatibility
        const { data: created, error: createError } = await supabase
            .from('family_data')
            .insert([
                {
                    family_id: familyId,
                    last_updated: new Date().toISOString(),
                }
            ])
            .select('*')
            .single();

        if (createError) throw createError;

        return {
            family_id: created.family_id,
            bills: created.bills || [],
            medical: created.medical || [],
            home: created.home || [],
            income: created.income || [],
            savings: created.savings || [],
            cc_limits: created.cc_limits || [],
            last_updated: created.last_updated || new Date().toISOString(),
        };
    }

    // Save bills to Supabase (new cc_bills table structure)
    static async saveBills(bills: CreditCardBill[]): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return; // Don't throw error, just skip cloud sync

        // Get existing bills from cc_bills table
        const { data: existingBills, error: fetchError } = await supabase
            .from('cc_bills')
            .select('id, month, card_name')
            .eq('family_id', familyId);

        if (fetchError) {
            console.error('Failed to fetch existing bills:', fetchError);
            throw fetchError;
        }

        // Create a map of existing bills by their unique identifier (month-cardName)
        const existingMap = new Map(
            (existingBills || []).map(b => [`${b.month}-${b.card_name}`, b.id])
        );

        // Separate bills into insert, update, and delete operations
        const billsToInsert: any[] = [];
        const billsToUpdate: any[] = [];
        const currentBillKeys = new Set<string>();

        bills.forEach(bill => {
            const key = `${bill.month}-${bill.cardName}`;
            currentBillKeys.add(key);

            const billData = {
                family_id: familyId,
                month: bill.month,
                card_name: bill.cardName,
                category: bill.category,
                due_date: bill.dueDate,
                is_emi: bill.isEmi,
                monthly_amount: bill.monthlyAmount,
                paid_amount: bill.paidAmount,
                total_amount: bill.totalAmount,
                payments: bill.payments,
                last_payment_date: bill.lastPaymentDate || '',
            };

            if (existingMap.has(key)) {
                // Update existing bill
                billsToUpdate.push({ id: existingMap.get(key), ...billData });
            } else {
                // Insert new bill
                billsToInsert.push(billData);
            }
        });

        // Perform inserts
        if (billsToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('cc_bills')
                .insert(billsToInsert);

            if (insertError) {
                console.error('Failed to insert bills:', insertError);
                throw insertError;
            }
        }

        // Perform updates
        for (const bill of billsToUpdate) {
            const { id, ...updateData } = bill;
            const { error: updateError } = await supabase
                .from('cc_bills')
                .update(updateData)
                .eq('id', id);

            if (updateError) {
                console.error('Failed to update bill:', updateError);
                throw updateError;
            }
        }

        // Delete bills that no longer exist
        const billsToDelete = existingBills?.filter(b =>
            !currentBillKeys.has(`${b.month}-${b.card_name}`)
        ) || [];

        if (billsToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('cc_bills')
                .delete()
                .in('id', billsToDelete.map(b => b.id));

            if (deleteError) {
                console.error('Failed to delete bills:', deleteError);
                throw deleteError;
            }
        }

        console.log(`Bills sync: ${billsToInsert.length} inserted, ${billsToUpdate.length} updated, ${billsToDelete.length} deleted`);
    }

    // Save medical expenses to Supabase
    static async saveMedical(medical: MedicalExpense[]): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        const { error } = await supabase
            .from('family_data')
            .update({
                medical,
                last_updated: new Date().toISOString(),
            })
            .eq('family_id', familyId);

        if (error) {
            console.error('Failed to save medical to Supabase:', error);
            throw error;
        }
    }

    // Save home expenses to Supabase
    static async saveHome(home: HomeExpense[]): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        const { error } = await supabase
            .from('family_data')
            .update({
                home,
                last_updated: new Date().toISOString(),
            })
            .eq('family_id', familyId);

        if (error) {
            console.error('Failed to save home to Supabase:', error);
            throw error;
        }
    }

    // Save income to Supabase
    static async saveIncome(income: Income[]): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        const { error } = await supabase
            .from('family_data')
            .update({
                income,
                last_updated: new Date().toISOString(),
            })
            .eq('family_id', familyId);

        if (error) {
            console.error('Failed to save income to Supabase:', error);
            throw error;
        }
    }

    // Save savings to Supabase
    static async saveSavings(savings: Savings[]): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        const { error } = await supabase
            .from('family_data')
            .update({
                savings,
                last_updated: new Date().toISOString(),
            })
            .eq('family_id', familyId);

        if (error) {
            console.error('Failed to save savings to Supabase:', error);
            throw error;
        }
    }

    // Save credit card limits to Supabase
    static async saveCreditCardLimits(limits: CreditCardLimit[]): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) return;

        // Get existing limits from cc_limits table
        const { data: existingLimits, error: fetchError } = await supabase
            .from('cc_limits')
            .select('id, card_name')
            .eq('family_id', familyId);

        if (fetchError) {
            console.error('Failed to fetch existing limits:', fetchError);
            throw fetchError;
        }

        // Create a map of existing limits by card name
        const existingMap = new Map(
            (existingLimits || []).map(l => [l.card_name, l.id])
        );

        // Separate limits into insert, update, and delete operations
        const limitsToInsert: any[] = [];
        const limitsToUpdate: any[] = [];
        const currentCardNames = new Set<string>();

        limits.forEach(limit => {
            currentCardNames.add(limit.cardName);

            const limitData = {
                family_id: familyId,
                card_name: limit.cardName,
                credit_limit: limit.creditLimit,
                updated_date: limit.updatedDate,
                notes: limit.notes || '',
            };

            if (existingMap.has(limit.cardName)) {
                // Update existing limit
                limitsToUpdate.push({ id: existingMap.get(limit.cardName), ...limitData });
            } else {
                // Insert new limit
                limitsToInsert.push(limitData);
            }
        });

        // Perform inserts
        if (limitsToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('cc_limits')
                .insert(limitsToInsert);

            if (insertError) {
                console.error('Failed to insert limits:', insertError);
                throw insertError;
            }
        }

        // Perform updates
        for (const limit of limitsToUpdate) {
            const { id, ...updateData } = limit;
            const { error: updateError } = await supabase
                .from('cc_limits')
                .update(updateData)
                .eq('id', id);

            if (updateError) {
                console.error('Failed to update limit:', updateError);
                throw updateError;
            }
        }

        // Delete limits that no longer exist
        const limitsToDelete = existingLimits?.filter(l =>
            !currentCardNames.has(l.card_name)
        ) || [];

        if (limitsToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('cc_limits')
                .delete()
                .in('id', limitsToDelete.map(l => l.id));

            if (deleteError) {
                console.error('Failed to delete limits:', deleteError);
                throw deleteError;
            }
        }

        console.log(`CC Limits sync: ${limitsToInsert.length} inserted, ${limitsToUpdate.length} updated, ${limitsToDelete.length} deleted`);
    }

    // Get all family data (bills from cc_bills table, medical/home/income from family_data, cc_limits from cc_limits table)
    static async getFamilyData(): Promise<FamilyData | null> {
        const familyId = this.getFamilyId();
        if (!familyId) return null;

        // Get bills from cc_bills table
        const { data: billsData, error: billsError } = await supabase
            .from('cc_bills')
            .select('*')
            .eq('family_id', familyId)
            .order('month', { ascending: false });

        if (billsError) {
            console.error('Failed to fetch bills:', billsError);
            throw billsError;
        }

        // Transform cc_bills table data to CreditCardBill format
        const bills: CreditCardBill[] = (billsData || []).map(row => ({
            id: `${row.card_name}-${row.month}`,
            month: row.month,
            cardName: row.card_name,
            category: row.category,
            dueDate: row.due_date,
            isEmi: row.is_emi,
            monthlyAmount: Number(row.monthly_amount),
            paidAmount: Number(row.paid_amount),
            totalAmount: Number(row.total_amount),
            payments: row.payments || [],
            lastPaymentDate: row.last_payment_date || '',
        }));

        // Get medical and home expenses from family_data table
        const { data: familyData, error: familyError } = await supabase
            .from('family_data')
            .select('medical, home, income, last_updated')
            .eq('family_id', familyId)
            .single();

        if (familyError && familyError.code !== 'PGRST116') {
            console.error('Failed to fetch family data:', familyError);
            throw familyError;
        }

        // Get credit card limits from cc_limits table
        const { data: limitsData, error: limitsError } = await supabase
            .from('cc_limits')
            .select('*')
            .eq('family_id', familyId)
            .order('card_name', { ascending: true });

        if (limitsError) {
            console.error('Failed to fetch cc limits:', limitsError);
            // Don't throw error, just continue without limits
        }

        // Transform cc_limits table data to CreditCardLimit format
        const ccLimits: CreditCardLimit[] = (limitsData || []).map(row => ({
            id: row.id.toString(),
            cardName: row.card_name,
            creditLimit: Number(row.credit_limit),
            updatedDate: row.updated_date,
            notes: row.notes || '',
        }));

        return {
            family_id: familyId,
            bills,
            medical: familyData?.medical || [],
            home: familyData?.home || [],
            income: familyData?.income || [],
            cc_limits: ccLimits,
            last_updated: familyData?.last_updated || new Date().toISOString(),
        };
    }

    // Subscribe to real-time updates (cc_bills table + family_data + cc_limits)
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

        // Unsubscribe from previous channel if exists
        if (this.realtimeChannel) {
            supabase.removeChannel(this.realtimeChannel);
        }

        // Subscribe to both cc_bills and family_data tables
        this.realtimeChannel = supabase
            .channel(`family_${familyId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'cc_bills',
                    filter: `family_id=eq.${familyId}`,
                },
                async () => {
                    // Reload all bills when any bill changes
                    try {
                        const { data: billsData, error } = await supabase
                            .from('cc_bills')
                            .select('*')
                            .eq('family_id', familyId)
                            .order('month', { ascending: false });

                        if (!error && billsData) {
                            const bills: CreditCardBill[] = billsData.map(row => ({
                                id: `${row.card_name}-${row.month}`,
                                month: row.month,
                                cardName: row.card_name,
                                category: row.category,
                                dueDate: row.due_date,
                                isEmi: row.is_emi,
                                monthlyAmount: Number(row.monthly_amount),
                                paidAmount: Number(row.paid_amount),
                                totalAmount: Number(row.total_amount),
                                payments: row.payments || [],
                                lastPaymentDate: row.last_payment_date || '',
                            }));
                            onBillsChange(bills);
                        }
                    } catch (error) {
                        console.error('Failed to reload bills on realtime update:', error);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'family_data',
                    filter: `family_id=eq.${familyId}`,
                },
                (payload) => {
                    const newData = payload.new as FamilyData;
                    onMedicalChange(newData.medical || []);
                    onHomeChange(newData.home || []);
                    onIncomeChange(newData.income || []);
                    if (onSavingsChange) {
                        onSavingsChange(newData.savings || []);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'cc_limits',
                    filter: `family_id=eq.${familyId}`,
                },
                async () => {
                    // Reload all cc limits when any limit changes
                    if (onCCLimitsChange) {
                        try {
                            const { data: limitsData, error } = await supabase
                                .from('cc_limits')
                                .select('*')
                                .eq('family_id', familyId)
                                .order('card_name', { ascending: true });

                            if (!error && limitsData) {
                                const limits: CreditCardLimit[] = limitsData.map(row => ({
                                    id: row.id.toString(),
                                    cardName: row.card_name,
                                    creditLimit: Number(row.credit_limit),
                                    updatedDate: row.updated_date,
                                    notes: row.notes || '',
                                }));
                                onCCLimitsChange(limits);
                            }
                        } catch (err) {
                            console.error('Error loading cc limits:', err);
                        }
                    }
                }
            )
            .subscribe();
    }

    // Unsubscribe from real-time updates
    static unsubscribe() {
        if (this.realtimeChannel) {
            supabase.removeChannel(this.realtimeChannel);
            this.realtimeChannel = null;
        }
    }

    // Migrate local data to Supabase
    static async migrateLocalData(
        bills: CreditCardBill[],
        medical: MedicalExpense[],
        home: HomeExpense[],
        income: Income[],
        savings: Savings[]
    ): Promise<void> {
        const familyId = this.getFamilyId();
        if (!familyId) throw new Error('No family ID set');

        const { error } = await supabase
            .from('family_data')
            .update({
                bills,
                medical,
                home,
                income,
                savings,
                last_updated: new Date().toISOString(),
            })
            .eq('family_id', familyId);

        if (error) throw error;
    }
}
