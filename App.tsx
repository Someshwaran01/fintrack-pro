
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppTab, CreditCardBill, MedicalExpense } from './types';
import { StorageService } from './services/storage';
import Dashboard from './components/Dashboard';
import CardTracker from './components/CardTracker';
import MedicalTracker from './components/MedicalTracker';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [medical, setMedical] = useState<MedicalExpense[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Initialize data
  useEffect(() => {
    setBills(StorageService.getBills());
    setMedical(StorageService.getMedical());
  }, []);

  // Update Storage on changes
  useEffect(() => {
    StorageService.saveBills(bills);
  }, [bills]);

  useEffect(() => {
    StorageService.saveMedical(medical);
  }, [medical]);

  const handleAddBill = (bill: CreditCardBill) => setBills([...bills, bill]);
  const handleUpdateBill = (id: string, updates: Partial<CreditCardBill>) => {
    setBills(bills.map(b => b.id === id ? { ...b, ...updates } : b));
  };
  const handleDeleteBill = (id: string) => setBills(bills.filter(b => b.id !== id));

  const handleAddMedical = (expense: MedicalExpense) => setMedical([...medical, expense]);
  const handleDeleteMedical = (id: string) => setMedical(medical.filter(m => m.id !== id));

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
    if (activeTab === 'bills') StorageService.exportToCSV(bills, 'cc_bills');
    if (activeTab === 'medical') StorageService.exportToCSV(medical, 'medical_expenses');
    if (activeTab === 'dashboard') {
      alert("Exporting all data...");
      StorageService.exportToCSV(bills, 'all_cc_bills');
      StorageService.exportToCSV(medical, 'all_medical_expenses');
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative flex flex-col">
      {/* Top Header */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-wallet text-white text-sm"></i>
          </div>
          <span className="font-bold text-gray-800">FinTrack Pro</span>
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
        {activeTab === 'dashboard' && <Dashboard bills={bills} medical={medical} />}
        {activeTab === 'bills' && <CardTracker bills={bills} onAdd={handleAddBill} onUpdate={handleUpdateBill} onDelete={handleDeleteBill} />}
        {activeTab === 'medical' && <MedicalTracker expenses={medical} onAdd={handleAddMedical} onDelete={handleDeleteMedical} />}
      </main>

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
      </footer>
    </div>
  );
};

export default App;
