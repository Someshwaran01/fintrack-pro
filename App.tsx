
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppTab, CreditCardBill, MedicalExpense, HomeExpense } from './types';
import { StorageService } from './services/storage';
import { CloudStorageService } from './services/cloudStorage';
import Dashboard from './components/Dashboard';
import CardTracker from './components/CardTracker';
import MedicalTracker from './components/MedicalTracker';
import HomeExpenseTracker from './components/HomeExpenseTracker';
import CloudSyncModal from './components/CloudSyncModal';

// Helper function to get current month in format 'Jan-26'
const getCurrentMonth = () => {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[now.getMonth()];
  const year = now.getFullYear().toString().slice(-2);
  return `${month}-${year}`;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [medical, setMedical] = useState<MedicalExpense[]>([]);
  const [home, setHome] = useState<HomeExpense[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const billsFileInputRef = React.useRef<HTMLInputElement>(null);
  const medicalFileInputRef = React.useRef<HTMLInputElement>(null);
  const homeFileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialize data
  useEffect(() => {
    setBills(StorageService.getBills());
    setMedical(StorageService.getMedical());
    setHome(StorageService.getHome());
  }, []);

  // Update Storage on changes
  useEffect(() => {
    StorageService.saveBills(bills);
    // Also save to cloud if enabled
    const cloudEnabled = localStorage.getItem('cloudSyncEnabled') === 'true';
    if (cloudEnabled && bills.length > 0) {
      CloudStorageService.saveBills(bills).catch(console.error);
    }
  }, [bills]);

  useEffect(() => {
    StorageService.saveMedical(medical);
    const cloudEnabled = localStorage.getItem('cloudSyncEnabled') === 'true';
    if (cloudEnabled && medical.length > 0) {
      CloudStorageService.saveMedical(medical).catch(console.error);
    }
  }, [medical]);

  useEffect(() => {
    StorageService.saveHome(home);
    const cloudEnabled = localStorage.getItem('cloudSyncEnabled') === 'true';
    if (cloudEnabled && home.length > 0) {
      CloudStorageService.saveHome(home).catch(console.error);
    }
  }, [home]);

  // Cloud Sync - Real-time listeners
  useEffect(() => {
    const cloudEnabled = localStorage.getItem('cloudSyncEnabled') === 'true';
    if (!cloudEnabled) return;

    // Set up real-time listeners for cloud data
    const unsubscribeBills = CloudStorageService.listenToBills((cloudBills) => {
      if (cloudBills.length > 0) {
        setBills(cloudBills);
        StorageService.saveBills(cloudBills); // Backup to local
      }
    });

    const unsubscribeMedical = CloudStorageService.listenToMedical((cloudMedical) => {
      if (cloudMedical.length > 0) {
        setMedical(cloudMedical);
        StorageService.saveMedical(cloudMedical); // Backup to local
      }
    });

    const unsubscribeHome = CloudStorageService.listenToHome((cloudHome) => {
      if (cloudHome.length > 0) {
        setHome(cloudHome);
        StorageService.saveHome(cloudHome); // Backup to local
      }
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeBills();
      unsubscribeMedical();
      unsubscribeHome();
    };
  }, []);

  const handleAddBill = (bill: CreditCardBill) => setBills([...bills, bill]);
  const handleUpdateBill = (id: string, updates: Partial<CreditCardBill>) => {
    setBills(bills.map(b => b.id === id ? { ...b, ...updates } : b));
  };
  const handleDeleteBill = (id: string) => setBills(bills.filter(b => b.id !== id));

  const handleAddMedical = (expense: MedicalExpense) => setMedical([...medical, expense]);
  const handleDeleteMedical = (id: string) => setMedical(medical.filter(m => m.id !== id));

  const handleAddHome = (expense: HomeExpense) => setHome([...home, expense]);
  const handleDeleteHome = (id: string) => setHome(home.filter(h => h.id !== id));

  const runAIAnalysis = async () => {
    setIsAiLoading(true);
    setAiInsight(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analyze the following financial data and provide 3 short, actionable financial health tips.
        Keep it under 60 words.
        Credit Card Bills: ${JSON.stringify(bills)}
        Medical Expenses: ${JSON.stringify(medical)}
        Home Expenses: ${JSON.stringify(home)}
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiInsight(response.text || 'No insights available right now.');
    } catch (error) {
      console.error(error);
      setAiInsight('Could not connect to AI advisor. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExport = () => {
    if (activeTab === 'bills') {
      StorageService.exportToCSV(bills, 'cc_bills');
      StorageService.exportToJSON(bills, 'cc_bills');
    }
    if (activeTab === 'medical') {
      StorageService.exportToCSV(medical, 'medical_expenses');
      StorageService.exportToJSON(medical, 'medical_expenses');
    }
    if (activeTab === 'home') {
      StorageService.exportToCSV(home, 'home_expenses');
      StorageService.exportToJSON(home, 'home_expenses');
    }
    if (activeTab === 'dashboard') {
      StorageService.exportToCSV(bills, 'all_cc_bills');
      StorageService.exportToJSON(bills, 'all_cc_bills');
      StorageService.exportToCSV(medical, 'all_medical_expenses');
      StorageService.exportToJSON(medical, 'all_medical_expenses');
      StorageService.exportToCSV(home, 'all_home_expenses');
      StorageService.exportToJSON(home, 'all_home_expenses');
    }
  };

  const handleImportBills = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await StorageService.importFromJSON(file);
      const validBills = importedData.filter(item => item.cardName && item.month);

      if (validBills.length === 0) {
        alert('No valid credit card bills found in the file.');
        return;
      }

      // Merge with existing bills, avoiding duplicates
      const existingIds = new Set(bills.map(b => b.id));
      const newBills = validBills.filter(b => !existingIds.has(b.id));

      setBills([...bills, ...newBills]);
      alert(`Successfully imported ${newBills.length} credit card bills!`);
      setShowImportModal(false);
    } catch (error) {
      alert('Failed to import bills. Please check the file format.');
      console.error(error);
    }

    if (billsFileInputRef.current) billsFileInputRef.current.value = '';
  };

  const handleImportMedical = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await StorageService.importFromJSON(file);
      const validExpenses = importedData.filter(item => item.memberName && item.date);

      if (validExpenses.length === 0) {
        alert('No valid medical expenses found in the file.');
        return;
      }

      // Merge with existing expenses, avoiding duplicates
      const existingIds = new Set(medical.map(m => m.id));
      const newExpenses = validExpenses.filter(e => !existingIds.has(e.id));

      setMedical([...medical, ...newExpenses]);
      alert(`Successfully imported ${newExpenses.length} medical expenses!`);
      setShowImportModal(false);
    } catch (error) {
      alert('Failed to import medical expenses. Please check the file format.');
      console.error(error);
    }

    if (medicalFileInputRef.current) medicalFileInputRef.current.value = '';
  };

  const handleImportHome = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await StorageService.importFromJSON(file);
      const validExpenses = importedData.filter(item => item.category && item.date);

      if (validExpenses.length === 0) {
        alert('No valid home expenses found in the file.');
        return;
      }

      // Merge with existing expenses, avoiding duplicates
      const existingIds = new Set(home.map(h => h.id));
      const newExpenses = validExpenses.filter(e => !existingIds.has(e.id));

      setHome([...home, ...newExpenses]);
      alert(`Successfully imported ${newExpenses.length} home expenses!`);
      setShowImportModal(false);
    } catch (error) {
      alert('Failed to import home expenses. Please check the file format.');
      console.error(error);
    }

    if (homeFileInputRef.current) homeFileInputRef.current.value = '';
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative flex flex-col">
      {/* Top Header */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-wallet text-white text-sm"></i>
          </div>
          <span className="font-bold text-gray-800">Somu Fin - Tracker</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={runAIAnalysis}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isAiLoading ? 'bg-indigo-100 text-indigo-400 animate-spin' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
            title="AI Analysis"
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </button>
          <button
            onClick={() => setShowCloudModal(true)}
            className="w-9 h-9 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center hover:bg-purple-100"
            title="Cloud Sync"
          >
            <i className="fa-solid fa-cloud"></i>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="w-9 h-9 bg-green-50 text-green-600 rounded-full flex items-center justify-center hover:bg-green-100"
            title="Import Data"
          >
            <i className="fa-solid fa-upload"></i>
          </button>
          <button
            onClick={handleExport}
            className="w-9 h-9 bg-gray-50 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-100"
            title="Export Data"
          >
            <i className="fa-solid fa-download"></i>
          </button>
        </div>
      </nav>

      {/* AI Panel */}
      {aiInsight && (
        <div className="m-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl relative animate-in fade-in slide-in-from-top-4">
          <button onClick={() => setAiInsight(null)} className="absolute top-2 right-2 text-indigo-300 hover:text-indigo-600">
            <i className="fa-solid fa-circle-xmark"></i>
          </button>
          <div className="flex items-start space-x-3">
            <i className="fa-solid fa-sparkles text-indigo-500 mt-1"></i>
            <div>
              <h4 className="font-bold text-indigo-900 text-xs uppercase mb-1">AI Advisor</h4>
              <p className="text-sm text-indigo-800 leading-relaxed">{aiInsight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow">
        {activeTab === 'dashboard' && <Dashboard bills={bills} medical={medical} home={home} selectedMonth={selectedMonth} />}
        {activeTab === 'bills' && <CardTracker bills={bills} onAdd={handleAddBill} onUpdate={handleUpdateBill} onDelete={handleDeleteBill} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />}
        {activeTab === 'medical' && <MedicalTracker expenses={medical} onAdd={handleAddMedical} onDelete={handleDeleteMedical} />}
        {activeTab === 'home' && <HomeExpenseTracker expenses={home} onAdd={handleAddHome} onDelete={handleDeleteHome} />}
      </main>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Import Data</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-xs text-blue-800 mb-3">
                  <i className="fa-solid fa-info-circle mr-1"></i>
                  Import JSON files that were previously exported from this app.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    <i className="fa-solid fa-credit-card mr-2 text-indigo-600"></i>
                    Credit Card Bills
                  </label>
                  <input
                    ref={billsFileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportBills}
                    className="hidden"
                    id="billsFileInput"
                  />
                  <button
                    onClick={() => billsFileInputRef.current?.click()}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold py-3 px-4 rounded-xl border-2 border-indigo-200 border-dashed transition-colors"
                  >
                    <i className="fa-solid fa-file-arrow-up mr-2"></i>
                    Choose Bills File (.json)
                  </button>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    <i className="fa-solid fa-house-medical mr-2 text-blue-600"></i>
                    Medical Expenses
                  </label>
                  <input
                    ref={medicalFileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportMedical}
                    className="hidden"
                    id="medicalFileInput"
                  />
                  <button
                    onClick={() => medicalFileInputRef.current?.click()}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-3 px-4 rounded-xl border-2 border-blue-200 border-dashed transition-colors"
                  >
                    <i className="fa-solid fa-file-arrow-up mr-2"></i>
                    Choose Medical File (.json)
                  </button>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    <i className="fa-solid fa-home mr-2 text-green-600"></i>
                    Home Expenses
                  </label>
                  <input
                    ref={homeFileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportHome}
                    className="hidden"
                    id="homeFileInput"
                  />
                  <button
                    onClick={() => homeFileInputRef.current?.click()}
                    className="w-full bg-green-50 hover:bg-green-100 text-green-600 font-semibold py-3 px-4 rounded-xl border-2 border-green-200 border-dashed transition-colors"
                  >
                    <i className="fa-solid fa-file-arrow-up mr-2"></i>
                    Choose Home File (.json)
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 flex justify-around items-center py-3 px-6 pb-6 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'dashboard' ? 'text-indigo-600 transform scale-110' : 'text-gray-400'}`}
        >
          <i className="fa-solid fa-chart-pie text-xl"></i>
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button
          onClick={() => setActiveTab('bills')}
          className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'bills' ? 'text-indigo-600 transform scale-110' : 'text-gray-400'}`}
        >
          <i className="fa-solid fa-credit-card text-xl"></i>
          <span className="text-[10px] font-bold">CC Bills</span>
        </button>
        <button
          onClick={() => setActiveTab('medical')}
          className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'medical' ? 'text-indigo-600 transform scale-110' : 'text-gray-400'}`}
        >
          <i className="fa-solid fa-house-medical text-xl"></i>
          <span className="text-[10px] font-bold">Medical</span>
        </button>
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'home' ? 'text-indigo-600 transform scale-110' : 'text-gray-400'}`}
        >
          <i className="fa-solid fa-home text-xl"></i>
          <span className="text-[10px] font-bold">Home</span>
        </button>
      </footer>

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        show={showCloudModal}
        onClose={() => setShowCloudModal(false)}
        bills={bills}
        medical={medical}
        home={home}
      />
    </div>
  );
};

export default App;
