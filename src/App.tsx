
import React, { useState, useEffect, useRef } from 'react';
import { AppTab, CreditCardBill, MedicalExpense, HomeExpense, SpenderName, Income, CreditCardLimit } from './types';
import { StorageService } from './services/storage';
import { SyncService } from './services/syncService';
import { getCurrentMonth } from './utils/helpers';
import { logger } from './config/app.config';
import Dashboard from './components/Dashboard';
import CardTracker from './components/CardTracker';
import ExpenseTracker from './components/ExpenseTracker';
import IncomeTracker from './components/IncomeTracker';
import FamilySetup from './components/FamilySetup';
import Onboarding from './components/Onboarding';
import ChatBot from './components/ChatBot';

// v1.1.0 - Multi-user Sync with Firebase
const App: React.FC = () => {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [isLoadingSync, setIsLoadingSync] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [medical, setMedical] = useState<MedicalExpense[]>([]);
  const [home, setHome] = useState<HomeExpense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [ccLimits, setCCLimits] = useState<CreditCardLimit[]>([]);
  const [members, setMembers] = useState<string[]>(StorageService.getMembers());
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(StorageService.getOnboardingComplete());
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const handleAddMember = async () => {
    if (newMemberName.trim() && !members.includes(newMemberName.trim())) {
      const updatedMembers = [...members, newMemberName.trim()];
      setMembers(updatedMembers);
      setNewMemberName('');
      await StorageService.saveOnboardingData(updatedMembers, onboardingComplete);
    }
  };

  const handleRemoveMember = async (name: string) => {
    if (confirm(`Remove ${name} from your family? This will not delete their historical data but they won't show in new selections.`)) {
      const updatedMembers = members.filter(m => m !== name);
      setMembers(updatedMembers);
      await StorageService.saveOnboardingData(updatedMembers, onboardingComplete);
    }
  };

  // Refs to track last synced data (prevents infinite loop)
  const lastSyncedBills = useRef<string>('');
  const lastSyncedMedical = useRef<string>('');
  const lastSyncedHome = useRef<string>('');
  const lastSyncedIncome = useRef<string>('');
  const lastSyncedCCLimits = useRef<string>('');

  // Refs to track initialization (prevent saving on first load)
  const isInitialized = useRef<boolean>(false);
  const billsInitialized = useRef<boolean>(false);
  const medicalInitialized = useRef<boolean>(false);
  const homeInitialized = useRef<boolean>(false);
  const incomeInitialized = useRef<boolean>(false);
  const ccLimitsInitialized = useRef<boolean>(false);

  // CRITICAL: Global flag to prevent ANY saves until cloud data has been loaded at least once
  const cloudDataLoaded = useRef<boolean>(false);
  const isLoadingData = useRef<boolean>(false);

  // Initialize family sync
  useEffect(() => {
    const existingFamilyId = SyncService.getFamilyId();
    if (existingFamilyId) {
      setFamilyId(existingFamilyId);
    }
  }, []);

  const handleOnboardingComplete = async (newMembers: string[], newCCLimits: CreditCardLimit[]) => {
    setMembers(newMembers);
    setCCLimits(newCCLimits);
    setOnboardingComplete(true);

    // If no credit cards selected, clear any existing/ghost bills
    if (newCCLimits.length === 0) {
      setBills([]);
      await StorageService.saveBills([]);
    }

    // Save locally
    await StorageService.saveOnboardingData(newMembers, true);
    await StorageService.saveCreditCardLimits(newCCLimits);
  };

  // Load initial data and set up real-time sync
  useEffect(() => {
    const loadData = async () => {
      if (familyId) {
        // Prevent concurrent loads
        if (isLoadingData.current) {
          logger.log('Already loading data, skipping...');
          return;
        }

        isLoadingData.current = true;
        setIsLoadingSync(true);

        try {
          logger.log('Starting cloud data load...');
          // Load from cloud first
          const cloudData = await StorageService.loadFromCloud();

          if (cloudData) {
            logger.log('Cloud data received:', cloudData.bills.length, 'bills,', cloudData.medical.length, 'medical,', cloudData.home.length, 'home,', cloudData.income.length, 'income', cloudData.savings?.length || 0, 'savings', cloudData.cc_limits?.length || 0, 'cc_limits');

            const defaultSpender = (cloudData.members && cloudData.members[0]) || 'Owner';
            const migratedMedical = cloudData.medical.map(m => ({
              ...m,
              spender: m.spender || defaultSpender
            }));
            const migratedHome = cloudData.home.map(h => ({
              ...h,
              spender: h.spender || defaultSpender
            }));

            // CRITICAL: Mark cloud data as loaded FIRST, before setting state
            cloudDataLoaded.current = true;

            // Mark as initialized BEFORE setting state to prevent saves
            billsInitialized.current = true;
            medicalInitialized.current = true;
            homeInitialized.current = true;
            incomeInitialized.current = true;
            ccLimitsInitialized.current = true;

            logger.log('Setting state with cloud data...');
            setBills(cloudData.bills || []);
            setMedical(migratedMedical);
            setHome(migratedHome);
            setIncome(cloudData.income || []);
            setCCLimits(cloudData.cc_limits || []);
            setMembers(cloudData.members || []);

            // Only update onboardingComplete if cloud has true, or if we are not yet complete
            // This prevents reverting to onboarding on refresh if cloud data is lagging
            if (cloudData.onboarding_complete === true) {
              setOnboardingComplete(true);
            } else if (!onboardingComplete && cloudData.onboarding_complete !== undefined) {
              setOnboardingComplete(cloudData.onboarding_complete);
            }

          } else {
            // Cloud returned null - fallback to local backup data instead of wiping state
            console.warn('No cloud data found - falling back to local backup state');

            const localBills = StorageService.getBills();
            const localMedical = StorageService.getMedical();
            const localHome = StorageService.getHome();
            const localIncome = StorageService.getIncome();
            const localCCLimits = StorageService.getCreditCardLimits();

            const defaultSpender = (members && members[0]) || 'Owner';
            const migratedMedical = localMedical.map(m => ({
              ...m,
              spender: m.spender || defaultSpender
            }));
            const migratedHome = localHome.map(h => ({
              ...h,
              spender: h.spender || defaultSpender
            }));

            // CRITICAL: Mark cloud data as loaded even if empty
            cloudDataLoaded.current = true;

            // Mark as initialized BEFORE setting state to prevent saves
            billsInitialized.current = true;
            medicalInitialized.current = true;
            homeInitialized.current = true;
            incomeInitialized.current = true;
            ccLimitsInitialized.current = true;

            setBills(localBills);
            setMedical(migratedMedical);
            setHome(migratedHome);
            setIncome(localIncome);
            setCCLimits(localCCLimits);
            setMembers(StorageService.getMembers());
            setOnboardingComplete(StorageService.getOnboardingComplete());
          }

          // Subscribe to real-time updates
          SyncService.subscribeToChanges(
            (newBills) => {
              const newHash = JSON.stringify(newBills);
              const prevHash = JSON.stringify(bills);
              // Only update if data is actually different
              if (prevHash !== newHash) {
                logger.log('Received bills update from sync:', newBills.length);
                // Save to localStorage immediately
                localStorage.setItem('fintrack_bills', JSON.stringify(newBills));
                // Store the hash to prevent save loop
                lastSyncedBills.current = newHash;
                setBills(newBills);
              }
            },
            (newMedical) => {
              const newHash = JSON.stringify(newMedical);
              const prevHash = JSON.stringify(medical);
              if (prevHash !== newHash) {
                logger.log('Received medical update from sync:', newMedical.length);
                // Save to localStorage immediately
                localStorage.setItem('fintrack_medical', JSON.stringify(newMedical));
                lastSyncedMedical.current = newHash;
                setMedical(newMedical);
              }
            },
            (newHome) => {
              const newHash = JSON.stringify(newHome);
              const prevHash = JSON.stringify(home);
              if (prevHash !== newHash) {
                logger.log('Received home update from sync:', newHome.length);
                // Save to localStorage immediately
                localStorage.setItem('fintrack_home', JSON.stringify(newHome));
                lastSyncedHome.current = newHash;
                setHome(newHome);
              }
            },
            (newIncome) => {
              const newHash = JSON.stringify(newIncome);
              const prevHash = JSON.stringify(income);
              if (prevHash !== newHash) {
                logger.log('Received income update from sync:', newIncome.length);
                // Save to localStorage immediately
                localStorage.setItem('fintrack_income', JSON.stringify(newIncome));
                lastSyncedIncome.current = newHash;
                setIncome(newIncome);
              }
            },
            (newCCLimits) => {
              const newHash = JSON.stringify(newCCLimits);
              const prevHash = JSON.stringify(ccLimits);
              if (prevHash !== newHash) {
                logger.log('Received cc limits update from sync:', newCCLimits.length);
                // Save to localStorage immediately
                localStorage.setItem('fintrack_cc_limits', JSON.stringify(newCCLimits));
                lastSyncedCCLimits.current = newHash;
                setCCLimits(newCCLimits);
              }
            }
          );
        } catch (error) {
          logger.error('Failed to sync:', error);
          // On error, still mark as loaded to prevent saves
          cloudDataLoaded.current = true;

          // Fallback to localStorage on error
          const localBills = StorageService.getBills();
          const localMedical = StorageService.getMedical();
          const localHome = StorageService.getHome();
          const localIncome = StorageService.getIncome();
          const localCCLimits = StorageService.getCreditCardLimits();

          const defaultSpender = (members && members[0]) || 'Owner';
          const migratedMedical = localMedical.map(m => ({
            ...m,
            spender: m.spender || defaultSpender
          }));
          const migratedHome = localHome.map(h => ({
            ...h,
            spender: h.spender || defaultSpender
          }));

          // Mark as initialized BEFORE setting state to prevent saves
          billsInitialized.current = true;
          medicalInitialized.current = true;
          homeInitialized.current = true;
          incomeInitialized.current = true;
          ccLimitsInitialized.current = true;

          setBills(localBills);
          setMedical(migratedMedical);
          setHome(migratedHome);
          setIncome(localIncome);
          setCCLimits(localCCLimits);
        } finally {
          setIsLoadingSync(false);
          isLoadingData.current = false;
          logger.log('Data load complete. cloudDataLoaded:', cloudDataLoaded.current);
        }
      } else {
        // No family sync, use localStorage only
        const localBills = StorageService.getBills();
        const localMedical = StorageService.getMedical();
        const localHome = StorageService.getHome();
        const localIncome = StorageService.getIncome();
        const localCCLimits = StorageService.getCreditCardLimits();

        // Migrate old data: add default spender if missing
        const migratedMedical = localMedical.map(m => ({
          ...m,
          spender: m.spender || 'Owner'
        }));
        const migratedHome = localHome.map(h => ({
          ...h,
          spender: h.spender || 'Owner'
        }));

        // Mark as initialized BEFORE setting state to prevent saves
        billsInitialized.current = true;
        medicalInitialized.current = true;
        homeInitialized.current = true;
        incomeInitialized.current = true;
        ccLimitsInitialized.current = true;

        setBills(localBills);
        setMedical(migratedMedical);
        setHome(migratedHome);
        setIncome(localIncome);
        setCCLimits(localCCLimits);
      }

      // Mark as initialized after first load
      isInitialized.current = true;
    };

    loadData();

    return () => {
      // Cleanup real-time subscription
      SyncService.unsubscribe();
    };
  }, [familyId]);

  // Update Storage on changes (but not during sync)
  useEffect(() => {
    // CRITICAL: Skip if cloud data hasn't loaded yet (prevents saving empty data on refresh)
    if (!cloudDataLoaded.current || !billsInitialized.current) {
      logger.log('Skipping bills save - cloud not loaded yet');
      return;
    }

    const currentHash = JSON.stringify(bills);
    // Skip save if this data just came from remote sync
    if (currentHash === lastSyncedBills.current && lastSyncedBills.current !== '') {
      logger.log('Skipping bills save - just received from sync');
      lastSyncedBills.current = ''; // Clear after skipping once
      return;
    }

    const save = async () => {
      try {
        await StorageService.saveBills(bills);
        logger.log('Bills saved to storage:', bills.length);
      } catch (error) {
        logger.error('Failed to save bills:', error);
      }
    };
    save();
  }, [bills]);

  useEffect(() => {
    // CRITICAL: Skip if cloud data hasn't loaded yet (prevents saving empty data on refresh)
    if (!cloudDataLoaded.current || !medicalInitialized.current) {
      logger.log('Skipping medical save - cloud not loaded yet');
      return;
    }

    const currentHash = JSON.stringify(medical);
    if (currentHash === lastSyncedMedical.current && lastSyncedMedical.current !== '') {
      logger.log('Skipping medical save - just received from sync');
      lastSyncedMedical.current = '';
      return;
    }

    const save = async () => {
      try {
        await StorageService.saveMedical(medical);
        logger.log('Medical expenses saved to storage:', medical.length);
      } catch (error) {
        logger.error('Failed to save medical:', error);
      }
    };
    save();
  }, [medical]);

  useEffect(() => {
    // CRITICAL: Skip if cloud data hasn't loaded yet (prevents saving empty data on refresh)
    if (!cloudDataLoaded.current || !homeInitialized.current) {
      logger.log('Skipping home save - cloud not loaded yet');
      return;
    }

    const currentHash = JSON.stringify(home);
    if (currentHash === lastSyncedHome.current && lastSyncedHome.current !== '') {
      logger.log('Skipping home save - just received from sync');
      lastSyncedHome.current = '';
      return;
    }

    const save = async () => {
      try {
        await StorageService.saveHome(home);
        logger.log('Home expenses saved to storage:', home.length);
      } catch (error) {
        logger.error('Failed to save home:', error);
      }
    };
    save();
  }, [home]);

  useEffect(() => {
    // CRITICAL: Skip if cloud data hasn't loaded yet (prevents saving empty data on refresh)
    if (!cloudDataLoaded.current || !incomeInitialized.current) {
      logger.log('Skipping income save - cloud not loaded yet');
      return;
    }

    const currentHash = JSON.stringify(income);
    if (currentHash === lastSyncedIncome.current && lastSyncedIncome.current !== '') {
      logger.log('Skipping income save - just received from sync');
      lastSyncedIncome.current = '';
      return;
    }

    const save = async () => {
      try {
        await StorageService.saveIncome(income);
        logger.log('Income saved to storage:', income.length);
      } catch (error) {
        logger.error('Failed to save income:', error);
      }
    };
    save();
  }, [income]);

  useEffect(() => {
    // CRITICAL: Skip if cloud data hasn't loaded yet (prevents saving empty data on refresh)
    if (!cloudDataLoaded.current || !ccLimitsInitialized.current) {
      logger.log('Skipping cc limits save - cloud not loaded yet');
      return;
    }

    const currentHash = JSON.stringify(ccLimits);
    if (currentHash === lastSyncedCCLimits.current && lastSyncedCCLimits.current !== '') {
      logger.log('Skipping cc limits save - just received from sync');
      lastSyncedCCLimits.current = '';
      return;
    }

    const save = async () => {
      try {
        await StorageService.saveCreditCardLimits(ccLimits);
        logger.log('CC Limits saved to storage:', ccLimits.length);
      } catch (error) {
        logger.error('Failed to save cc limits:', error);
      }
    };
    save();
  }, [ccLimits]);

  const handleAddBill = (bill: CreditCardBill) => setBills([...bills, bill]);
  const handleAddBills = (newBills: CreditCardBill[]) => setBills([...bills, ...newBills]);
  const handleUpdateBill = (id: string, updates: Partial<CreditCardBill>) => {
    setBills(bills.map(b => b.id === id ? { ...b, ...updates } : b));
  };
  const handleDeleteBill = (id: string) => setBills(bills.filter(b => b.id !== id));

  const handleAddMedical = (expense: MedicalExpense) => setMedical([...medical, expense]);
  const handleDeleteMedical = (id: string) => setMedical(medical.filter(m => m.id !== id));

  const handleAddHome = (expense: HomeExpense) => setHome([...home, expense]);
  const handleDeleteHome = (id: string) => setHome(home.filter(h => h.id !== id));

  const handleAddIncome = (inc: Income) => setIncome([...income, inc]);
  const handleDeleteIncome = (id: string) => setIncome(income.filter(i => i.id !== id));

  const handleUpdateCCLimits = (limits: CreditCardLimit[]) => setCCLimits(limits);

  const handleFamilySetupComplete = (newFamilyId: string) => {
    setFamilyId(newFamilyId);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to disconnect from family sync? Your data will remain saved locally.')) {
      SyncService.clearFamilyId();
      setFamilyId(null);
      // Reset state to avoid contamination
      setBills([]);
      setMedical([]);
      setHome([]);
      setIncome([]);
      setCCLimits([]);
      setMembers([]);
      setOnboardingComplete(false);
      cloudDataLoaded.current = false;
      billsInitialized.current = false;
      medicalInitialized.current = false;
      homeInitialized.current = false;
      incomeInitialized.current = false;
      ccLimitsInitialized.current = false;
    }
  };



  const handleExport = () => {
    if (activeTab === 'bills') {
      StorageService.exportToCSV(bills, 'cc_bills');
      StorageService.exportToJSON(bills, 'cc_bills');
    } else if (activeTab === 'expenses') {
      StorageService.exportToCSV(medical, 'medical_expenses');
      StorageService.exportToCSV(home, 'home_expenses');
      StorageService.exportToJSON([...medical, ...home], 'all_expenses');
    } else if (activeTab === 'income') {
      StorageService.exportToCSV(income, 'income');
      StorageService.exportToJSON(income, 'income');
    } else {
      // dashboard or fallback
      const fullBackup = {
        bills,
        medical,
        home,
        income,
        ccLimits,
        members
      };
      StorageService.exportToJSON([fullBackup], 'fintrack_full_backup');
    }
  };

  return (
    <>
      {!familyId ? (
        <FamilySetup onComplete={handleFamilySetupComplete} />
      ) : !onboardingComplete ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <div className="max-w-md mx-auto min-h-screen relative flex flex-col">
          {/* Optimized Mobile Header */}
          <nav className="bg-white sticky top-0 z-[60] border-b border-gray-50 shadow-sm">
            <div className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#111827] to-[#374151] rounded-xl blur opacity-15"></div>
                  <div className="relative w-9 h-9 bg-gradient-to-br from-[#1a1c2e] to-[#2d3142] rounded-xl flex items-center justify-center shadow-md border border-white/10">
                    <i className="fa-solid fa-shield-halved text-white text-base"></i>
                  </div>
                </div>
                <div>
                  <h1 className="font-serif font-black text-[#1a1c2e] text-lg tracking-tight leading-none mb-1">FinTrack</h1>
                  <div className="flex items-center space-x-1">
                    <span className="flex h-1 w-1">
                      <span className="animate-ping absolute inline-flex h-1 w-1 rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500"></span>
                    </span>
                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.1em] leading-none">Unified Portfolio Sync</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  id="global-ai-btn"
                  onClick={() => setShowAIChat(true)}
                  className="w-9 h-9 bg-gradient-to-tr from-[#FFF4E0] to-[#FFDBA4] text-[#E67E22] rounded-xl flex items-center justify-center shadow-sm border border-orange-100/30 transition-all active:scale-95"
                  title="Advisor AI"
                >
                  <i className="fa-solid fa-wand-magic-sparkles text-base"></i>
                </button>
                <button
                  onClick={handleExport}
                  className="w-9 h-9 bg-gradient-to-tr from-[#E0F7FF] to-[#A4EFFF] text-[#2980B9] rounded-xl flex items-center justify-center shadow-sm border border-blue-100/30 transition-all active:scale-95"
                  title="Export Data"
                >
                  <i className="fa-solid fa-cloud-arrow-down text-base"></i>
                </button>
                {familyId && (
                  <button
                    onClick={() => setShowFamilyModal(true)}
                    className="w-9 h-9 bg-gradient-to-tr from-[#F5E0FF] to-[#D6A4FF] text-[#8E44AD] rounded-xl flex items-center justify-center shadow-sm border border-purple-100/30 transition-all active:scale-95"
                    title="Family Setup"
                  >
                    <i className="fa-solid fa-network-wired text-base"></i>
                  </button>
                )}
              </div>
            </div>
          </nav>



          {/* Main Content Area */}
          <main className="flex-grow">
            {activeTab === 'dashboard' && <Dashboard bills={bills} medical={medical} home={home} income={income} members={members} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} onAddMember={handleAddMember} onRemoveMember={handleRemoveMember} newMemberName={newMemberName} onNewMemberNameChange={setNewMemberName} />}
            {activeTab === 'bills' && <CardTracker bills={bills} ccLimits={ccLimits} onboardingComplete={onboardingComplete} onAdd={handleAddBill} onAddMultiple={handleAddBills} onUpdate={handleUpdateBill} onDelete={handleDeleteBill} onUpdateCCLimits={handleUpdateCCLimits} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />}
            {activeTab === 'expenses' && <ExpenseTracker medicalExpenses={medical} homeExpenses={home} members={members} onAddMedical={handleAddMedical} onDeleteMedical={handleDeleteMedical} onAddHome={handleAddHome} onDeleteHome={handleDeleteHome} />}
            {activeTab === 'income' && <IncomeTracker incomes={income} bills={bills} medical={medical} home={home} members={members} onAddIncome={handleAddIncome} onDeleteIncome={handleDeleteIncome} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />}
            {activeTab === 'ai' && <ChatBot bills={bills} medical={medical} home={home} income={income} members={members} />}
          </main>



          {/* Family Info Modal - Redesigned for Mobile */}
          {showFamilyModal && familyId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col animate-slideInUp max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-50">
                  <div>
                    <h3 className="font-serif font-black text-xl text-[#1a1c2e]">Family Sync</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Cloud Portfolio Configuration</p>
                  </div>
                  <button
                    onClick={() => setShowFamilyModal(false)}
                    className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <i className="fa-solid fa-xmark text-lg"></i>
                  </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                  <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100 text-emerald-500 shrink-0">
                      <i className="fa-solid fa-cloud-bolt text-xl"></i>
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-1">Status: Active</p>
                      <p className="text-[11px] text-emerald-700/70 leading-relaxed">Your device is heartbeat-synced with the family cloud. All changes reflect instantly.</p>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mb-3 text-center">Your Family ID (Shared)</p>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center space-x-3 group active:scale-[0.98] transition-all cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(familyId);
                        alert('Family ID copied to clipboard!');
                      }}>
                      <p className="text-2xl font-mono font-black text-[#1a1c2e] tracking-[0.2em]">{familyId}</p>
                      <i className="fa-solid fa-copy text-slate-300 group-hover:text-indigo-500 transition-colors"></i>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-4 leading-relaxed px-4 font-medium italic">
                      "Max 5 active vaults per family ID"
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-[#1a1c2e] uppercase tracking-widest ml-1">Platform Guidance</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <i className="fa-solid fa-bolt text-blue-500 mb-2 block"></i>
                        <p className="text-[10px] text-blue-900 font-bold leading-tight">Instant Remote Updates</p>
                      </div>
                      <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                        <i className="fa-solid fa-shield text-purple-500 mb-2 block"></i>
                        <p className="text-[10px] text-purple-900 font-bold leading-tight">Encrypted Metadata</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 mt-auto rounded-t-3xl sm:rounded-b-3xl">
                  <button
                    onClick={handleLogout}
                    className="w-full bg-white text-red-500 border border-red-50 hover:bg-red-50 font-black py-4 rounded-2xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center space-x-3 uppercase text-[10px] tracking-[0.2em]"
                  >
                    <i className="fa-solid fa-power-off"></i>
                    <span>Disconnect Vault</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Navigation */}
          <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center py-4 px-6 pb-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
            <button
              onClick={() => setActiveTab('dashboard')}
              data-tab="dashboard"
              className={`flex flex-col items-center space-y-1.5 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-[#1a1c2e] transform -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}
            >
              <i className={`fa-solid fa-layer-group text-lg ${activeTab === 'dashboard' ? 'text-[#1a1c2e]' : ''}`}></i>
              <span className="text-[9px] font-black uppercase tracking-tighter">Summary</span>
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              data-tab="bills"
              className={`flex flex-col items-center space-y-1.5 transition-all duration-300 ${activeTab === 'bills' ? 'text-[#1a1c2e] transform -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}
            >
              <i className={`fa-solid fa-money-check-dollar text-lg ${activeTab === 'bills' ? 'text-[#1a1c2e]' : ''}`}></i>
              <span className="text-[9px] font-black uppercase tracking-tighter">Finance</span>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              data-tab="expenses"
              className={`flex flex-col items-center space-y-1.5 transition-all duration-300 ${activeTab === 'expenses' ? 'text-[#1a1c2e] transform -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}
            >
              <i className={`fa-solid fa-hand-holding-dollar text-lg ${activeTab === 'expenses' ? 'text-[#1a1c2e]' : ''}`}></i>
              <span className="text-[9px] font-black uppercase tracking-tighter">Outflows</span>
            </button>
            <button
              onClick={() => setActiveTab('income')}
              data-tab="income"
              className={`flex flex-col items-center space-y-1.5 transition-all duration-300 ${activeTab === 'income' ? 'text-[#1a1c2e] transform -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}
            >
              <i className={`fa-solid fa-piggy-bank text-lg ${activeTab === 'income' ? 'text-[#1a1c2e]' : ''}`}></i>
              <span className="text-[9px] font-black uppercase tracking-tighter">Inflows</span>
            </button>
          </footer>

          {/* Full Screen AI Advisor Modal */}
          {showAIChat && (
            <div className="fixed inset-0 z-[100] bg-white animate-slideInUp">
              <div className="flex flex-col h-full">
                <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-robot"></i>
                    </div>
                    <h2 className="font-serif font-black text-[#1a1c2e]">Financial Advisor</h2>
                  </div>
                  <button
                    onClick={() => setShowAIChat(false)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#1a1c2e] transition-colors"
                  >
                    <i className="fa-solid fa-xmark text-xl"></i>
                  </button>
                </header>
                <div className="flex-grow">
                  <ChatBot
                    bills={bills}
                    medical={medical}
                    home={home}
                    income={income}
                    isEmbedded={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default App;
