import React, { useState, useEffect } from 'react';
import { SyncService } from '../services/syncService';

interface FamilySetupProps {
    onComplete: (familyId: string) => void;
}

const FamilySetup: React.FC<FamilySetupProps> = ({ onComplete }) => {
    const [familyId, setFamilyId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const getFriendlyErrorMessage = (err: unknown): string => {
        const defaultMessage = 'Failed to join family. Please check your Family ID and try again.';

        if (!err) return defaultMessage;

        const rawMessage = typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: string }).message || '')
            : '';

        const message = rawMessage.toLowerCase();

        if (message.includes('supabase is not configured')) {
            return 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.';
        }

        if (message.includes('relation') && message.includes('family_data') && message.includes('does not exist')) {
            return 'Database table family_data is missing. Run the Supabase setup SQL script and try again.';
        }

        if (message.includes('column') && message.includes('income') && message.includes('does not exist')) {
            return 'Database schema is outdated. Run add_income_column.sql in Supabase and try again.';
        }

        if (message.includes('row-level security') || message.includes('violates row-level security policy')) {
            return 'Supabase RLS is blocking family creation. If you are joining, verify the exact Family ID. If you are creating a new family, add an INSERT policy for family_data in Supabase SQL Editor.';
        }

        if (message.includes('invalid api key') || message.includes('jwt')) {
            return 'Supabase API key is invalid. Check VITE_SUPABASE_ANON_KEY in your .env file.';
        }

        if (message.includes('fetch') || message.includes('network')) {
            return 'Network error while connecting to Supabase. Check your internet connection and try again.';
        }

        return rawMessage || defaultMessage;
    };

    useEffect(() => {
        // Check if already has family ID
        const existingFamilyId = SyncService.getFamilyId();
        if (existingFamilyId) {
            onComplete(existingFamilyId);
        }
    }, [onComplete]);

    const handleJoinFamily = async () => {
        const cleanedFamilyId = familyId.trim();

        if (!cleanedFamilyId) {
            setError('Please enter a Family ID');
            return;
        }

        if (cleanedFamilyId.length < 6) {
            setError('Family ID should be at least 6 characters');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Initialize or join family
            await SyncService.initializeFamily(cleanedFamilyId);
            SyncService.setFamilyId(cleanedFamilyId);
            onComplete(cleanedFamilyId);
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const generateFamilyId = () => {
        // Generate a random 8-character family ID
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = '';
        for (let i = 0; i < 8; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFamilyId(id);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Soft mesh background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/50 rounded-full blur-[120px]"></div>

            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50 p-10 animate-fadeIn overflow-hidden">
                {/* Texture accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-bl-[100px]"></div>

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#1a1c2e] to-[#2d3142] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-200">
                        <i className="fa-solid fa-shield-halved text-white text-2xl"></i>
                    </div>
                    <h1 className="text-3xl font-serif font-black text-[#1a1c2e] tracking-tight mb-2">
                        FinTrack Family
                    </h1>
                    <div className="flex items-center justify-center space-x-2">
                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                            Unified Portfolio Sync
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="relative">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">
                            Portfolio Access Key
                        </label>
                        <div className="relative group">
                            <i className="fa-solid fa-key absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-sm transition-colors group-focus-within:text-indigo-600"></i>
                            <input
                                type="text"
                                id="family-id"
                                name="family-id"
                                value={familyId}
                                onChange={(e) => setFamilyId(e.target.value)}
                                placeholder="ENTER ACCESS ID"
                                className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-base font-mono font-bold tracking-[0.1em] placeholder:text-gray-300 focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-[#1a1c2e]"
                                maxLength={8}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold animate-slideInUp flex items-center shadow-sm">
                            <i className="fa-solid fa-circle-exclamation mr-2 text-sm"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex flex-col space-y-3">
                        <button
                            onClick={handleJoinFamily}
                            disabled={isLoading}
                            className={`w-full py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] ${isLoading
                                ? 'bg-indigo-300'
                                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                                    Syncing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <i className="fa-solid fa-link mr-2"></i>
                                    Connect Portfolio
                                </span>
                            )}
                        </button>

                        <button
                            onClick={generateFamilyId}
                            disabled={isLoading}
                            className={`w-full py-4 bg-white border-2 border-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-gray-50 active:scale-[0.98] ${isLoading ? 'opacity-50' : ''}`}
                        >
                            <i className="fa-solid fa-wand-magic-sparkles mr-2 text-xs"></i>
                            Generate New ID
                        </button>
                    </div>

                    <div className="pt-6 border-t border-gray-50">
                        <div className="bg-[#fcfdff] p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500 group-hover:w-3 transition-all"></div>
                            <h3 className="text-[10px] font-black text-[#1a1c2e] uppercase tracking-[0.2em] mb-4 flex items-center">
                                <i className="fa-solid fa-network-wired text-indigo-600 mr-2 text-xs"></i>
                                Architecture
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    { icon: 'fa-shield-check', text: 'Encrypted multi-node synchronization' },
                                    { icon: 'fa-users-viewfinder', text: 'Support for up to 5 concurrent accounts' },
                                    { icon: 'fa-bolt-lightning', text: 'Real-time asset state updates' }
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center text-[10px] font-bold text-gray-500">
                                        <div className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center mr-3 text-indigo-500">
                                            <i className={`fa-solid ${item.icon} text-[8px]`}></i>
                                        </div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilySetup;
