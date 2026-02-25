
import React, { useState, useEffect, useRef } from 'react';
import { AppTab, CreditCardBill, MedicalExpense, HomeExpense, Spender, Income, CreditCardLimit } from './types';
import { StorageService } from './services/storage';
import { SyncService } from './services/syncService';
import { getCurrentMonth } from './utils/helpers';
import { logger } from './config/app.config';
import Dashboard from './components/Dashboard';
import CardTracker from './components/CardTracker';
import ExpenseTracker from './components/ExpenseTracker';
import IncomeTracker from './components/IncomeTracker';
import FamilySetup from './components/FamilySetup';
import ChatBot from './components/ChatBot';

// v1.1.0 - Multi-user Sync with Supabase
const App: React.FC = () => {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [isLoadingSync, setIsLoadingSync] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [medical, setMedical] = useState<MedicalExpense[]>([]);
  const [home, setHome] = useState<HomeExpense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [ccLimits, setCCLimits] = useState<CreditCardLimit[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

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

            // Migrate old data: add default spender if missing
            const migratedMedical = cloudData.medical.map(m => ({
              ...m,
              spender: m.spender || Spender.DEVI
            }));
            const migratedHome = cloudData.home.map(h => ({
              ...h,
              spender: h.spender || Spender.DEVI
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
            setBills(cloudData.bills);
            setMedical(migratedMedical);
            setHome(migratedHome);
            setIncome(cloudData.income);
            setCCLimits(cloudData.cc_limits || []);
          } else {
            // Cloud returned null - fallback to local backup data instead of wiping state
            console.warn('No cloud data found - falling back to local backup state');

            const localBills = StorageService.getBills();
            const localMedical = StorageService.getMedical();
            const localHome = StorageService.getHome();
            const localIncome = StorageService.getIncome();
            const localCCLimits = StorageService.getCreditCardLimits();

            const migratedMedical = localMedical.map(m => ({
              ...m,
              spender: m.spender || Spender.DEVI
            }));
            const migratedHome = localHome.map(h => ({
              ...h,
              spender: h.spender || Spender.DEVI
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

          // Migrate old data: add default spender if missing
          const migratedMedical = localMedical.map(m => ({
            ...m,
            spender: m.spender || Spender.DEVI
          }));
          const migratedHome = localHome.map(h => ({
            ...h,
            spender: h.spender || Spender.DEVI
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
          spender: m.spender || Spender.DEVI
        }));
        const migratedHome = localHome.map(h => ({
          ...h,
          spender: h.spender || Spender.DEVI
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
    }
  };



  const handleExport = () => {
    if (activeTab === 'bills') {
      StorageService.exportToCSV(bills, 'cc_bills');
      StorageService.exportToJSON(bills, 'cc_bills');
    }
    if (activeTab === 'expenses') {
      StorageService.exportToCSV(medical, 'medical_expenses');
      StorageService.exportToJSON(medical, 'medical_expenses');
      StorageService.exportToCSV(home, 'home_expenses');
      StorageService.exportToJSON(home, 'home_expenses');
    }
    if (activeTab === 'income') {
      StorageService.exportToCSV(income, 'income');
      StorageService.exportToJSON(income, 'income');
    }
    if (activeTab === 'dashboard') {
      StorageService.exportToCSV(bills, 'all_cc_bills');
      StorageService.exportToJSON(bills, 'all_cc_bills');
      StorageService.exportToCSV(medical, 'all_medical_expenses');
      StorageService.exportToJSON(medical, 'all_medical_expenses');
      StorageService.exportToCSV(home, 'all_home_expenses');
      StorageService.exportToJSON(home, 'all_home_expenses');
      StorageService.exportToCSV(income, 'all_income');
      StorageService.exportToJSON(income, 'all_income');
    }
  };



  return (
    <>
      {!familyId ? (
        <FamilySetup onComplete={handleFamilySetupComplete} />
      ) : (
        <div className="max-w-md mx-auto min-h-screen relative flex flex-col">
          {/* Primary Navigation Header - Creative Vibe */}
          <nav className="bg-white sticky top-0 z-[60] border-b border-gray-50 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
            <div className="px-5 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#111827] to-[#374151] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative w-11 h-11 bg-gradient-to-br from-[#1a1c2e] to-[#2d3142] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-all duration-300 border border-white/10">
                    <i className="fa-solid fa-shield-halved text-white text-xl"></i>
                  </div>
                </div>
                <div>
                  <h1 className="font-serif font-black text-[#1a1c2e] text-xl tracking-tight leading-none mb-1">FinTrack</h1>
                  <div className="flex items-center space-x-2">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">Live Secure</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  id="global-ai-btn"
                  onClick={() => setShowAIChat(true)}
                  className="w-11 h-11 bg-gradient-to-tr from-[#FFF4E0] to-[#FFDBA4] text-[#E67E22] rounded-2xl flex items-center justify-center hover:shadow-xl hover:shadow-orange-500/10 transition-all active:scale-95 border border-orange-100/30"
                  title="Advisor AI"
                >
                  <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
                </button>
                <button
                  onClick={handleExport}
                  className="w-11 h-11 bg-gradient-to-tr from-[#E0F7FF] to-[#A4EFFF] text-[#2980B9] rounded-2xl flex items-center justify-center hover:shadow-xl hover:shadow-blue-500/10 transition-all active:scale-95 border border-blue-100/30"
                  title="Export Data"
                >
                  <i className="fa-solid fa-cloud-arrow-down text-lg"></i>
                </button>
                {familyId && (
                  <button
                    onClick={() => setShowFamilyModal(true)}
                    className="w-11 h-11 bg-gradient-to-tr from-[#F5E0FF] to-[#D6A4FF] text-[#8E44AD] rounded-2xl flex items-center justify-center hover:shadow-xl hover:shadow-purple-500/10 transition-all active:scale-95 border border-purple-100/30"
                    title="Family Setup"
                  >
                    <i className="fa-solid fa-network-wired text-lg"></i>
                  </button>
                )}
              </div>
            </div>
          </nav>



          {/* Main Content Area */}
          <main className="flex-grow">
            {activeTab === 'dashboard' && <Dashboard bills={bills} medical={medical} home={home} income={income} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />}
            {activeTab === 'bills' && <CardTracker bills={bills} ccLimits={ccLimits} onAdd={handleAddBill} onAddMultiple={handleAddBills} onUpdate={handleUpdateBill} onDelete={handleDeleteBill} onUpdateCCLimits={handleUpdateCCLimits} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />}
            {activeTab === 'expenses' && <ExpenseTracker medicalExpenses={medical} homeExpenses={home} onAddMedical={handleAddMedical} onDeleteMedical={handleDeleteMedical} onAddHome={handleAddHome} onDeleteHome={handleDeleteHome} />}
            {activeTab === 'income' && <IncomeTracker incomes={income} bills={bills} medical={medical} home={home} onAddIncome={handleAddIncome} onDeleteIncome={handleDeleteIncome} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />}
            {activeTab === 'ai' && <ChatBot bills={bills} medical={medical} home={home} income={income} />}
          </main>



          {/* Family Info Modal */}
          {showFamilyModal && familyId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Family Sync</h3>
                  <button onClick={() => setShowFamilyModal(false)} className="text-gray-400 hover:text-gray-600">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-xs text-green-800 mb-2">
                      <i className="fa-solid fa-circle-check mr-1"></i>
                      Real-time sync is active!
                    </p>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Your Family ID:</p>
                      <p className="text-lg font-mono font-bold text-gray-800 tracking-wider">{familyId}</p>
                    </div>
                    <p className="text-xs text-green-700 mt-3">
                      Share this ID with family members (max 5 users)
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-bold text-sm text-blue-900 mb-2">
                      <i className="fa-solid fa-info-circle mr-1"></i>
                      How it works:
                    </h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• All changes sync instantly across devices</li>
                      <li>• Up to 5 family members can use the same ID</li>
                      <li>• Data is backed up locally on each device</li>
                      <li>• Free forever with Supabase</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition-colors"
                  >
                    <i className="fa-solid fa-right-from-bracket mr-2"></i>
                    Disconnect from Family
                  </button>

                  <button
                    onClick={() => setShowFamilyModal(false)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                  >
                    Close
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
