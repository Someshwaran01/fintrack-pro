
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
          {/* Top Header */}
          {/* Top Header */}
          <nav className="glass sticky top-0 z-30 shadow-lg backdrop-blur-md">
            <div className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md hover-lift">
                  <i className="fa-solid fa-wallet text-white text-lg"></i>
                </div>
                <div>
                  <span className="font-bold text-gray-800 block text-base">Somu Fin - Tracker</span>
                  {familyId && (
                    <span className="text-[10px] text-green-600 flex items-center animate-pulse">
                      <i className="fa-solid fa-users mr-1"></i>
                      Family: {familyId}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                {familyId && (
                  <button
                    onClick={() => setShowFamilyModal(true)}
                    className="w-10 h-10 bg-gradient-to-br from-green-50 to-emerald-50 text-green-600 rounded-xl flex items-center justify-center hover:shadow-lg hover-lift active-scale transition-all"
                    title="Family Info"
                  >
                    <i className="fa-solid fa-users"></i>
                  </button>
                )}
                <button
                  onClick={handleExport}
                  className="w-10 h-10 bg-gradient-to-br from-gray-50 to-slate-50 text-gray-600 rounded-xl flex items-center justify-center hover:shadow-lg hover-lift active-scale transition-all"
                  title="Export Data"
                >
                  <i className="fa-solid fa-download"></i>
                </button>
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
          <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-gray-200 flex justify-around items-center py-3 px-6 pb-4 z-50 shadow-2xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center space-y-1 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-indigo-600 transform scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`${activeTab === 'dashboard' ? 'bg-gradient-to-br from-indigo-100 to-purple-100 shadow-md' : ''} p-2 rounded-xl transition-all`}>
                <i className="fa-solid fa-chart-pie text-xl"></i>
              </div>
              <span className="text-[9px] font-bold">Home</span>
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`flex flex-col items-center space-y-1 transition-all duration-300 ${activeTab === 'bills' ? 'text-blue-600 transform scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`${activeTab === 'bills' ? 'bg-gradient-to-br from-blue-100 to-cyan-100 shadow-md' : ''} p-2 rounded-xl transition-all`}>
                <i className="fa-solid fa-credit-card text-xl"></i>
              </div>
              <span className="text-[9px] font-bold">CC Manage</span>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex flex-col items-center space-y-1 transition-all duration-300 ${activeTab === 'expenses' ? 'text-emerald-600 transform scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`${activeTab === 'expenses' ? 'bg-gradient-to-br from-emerald-100 to-green-100 shadow-md' : ''} p-2 rounded-xl transition-all`}>
                <i className="fa-solid fa-receipt text-xl"></i>
              </div>
              <span className="text-[9px] font-bold">Expenses</span>
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`flex flex-col items-center space-y-1 transition-all duration-300 ${activeTab === 'income' ? 'text-amber-600 transform scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`${activeTab === 'income' ? 'bg-gradient-to-br from-amber-100 to-orange-100 shadow-md' : ''} p-2 rounded-xl transition-all`}>
                <i className="fa-solid fa-money-bill-wave text-xl"></i>
              </div>
              <span className="text-[9px] font-bold">Income</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex flex-col items-center space-y-1 transition-all duration-300 ${activeTab === 'ai' ? 'text-purple-600 transform scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`${activeTab === 'ai' ? 'bg-gradient-to-br from-purple-100 to-indigo-100 shadow-md' : ''} p-2 rounded-xl transition-all`}>
                <i className="fa-solid fa-robot text-xl"></i>
              </div>
              <span className="text-[9px] font-bold">AI Assistant</span>
            </button>
          </footer>
        </div>
      )}
    </>
  );
};

export default App;
