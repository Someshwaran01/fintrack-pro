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

        if (message.includes('firebase is not configured')) {
            return 'Firebase is not configured. Add your Firebase variables in your .env file.';
        }

        if (message.includes('permission-denied') || message.includes('missing or insufficient permissions')) {
            return 'Firebase Firestore rules are blocking access. Verify your Firestore rules allow read/write.';
        }

        if (message.includes('invalid-api-key')) {
            return 'Firebase API key is invalid. Check VITE_FIREBASE_API_KEY in your .env file.';
        }

        if (message.includes('fetch') || message.includes('network') || message.includes('offline')) {
            return 'Network error while connecting to Firebase. Check your internet connection and try again.';
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
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans pt-safe pb-safe">
            {/* Ultra-Premium Cosmic Depth */}
            <div className="absolute top-[-20%] left-[-15%] w-[70%] h-[70%] bg-indigo-600/20 rounded-full blur-[160px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-15%] w-[70%] h-[70%] bg-[#d946ef]/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '3s' }}></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

            <div className="relative w-full max-w-md bg-white/[0.03] backdrop-blur-[60px] rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/[0.08] p-8 sm:p-10 animate-fadeIn overflow-hidden">
                {/* Neon Top Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

                <div className="text-center mb-10 sm:mb-14 relative z-10">
                    <div className="group relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8">
                        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-[#d946ef] rounded-[2.2rem] blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10">
                            <i className="fa-solid fa-shield-halved text-white text-3xl sm:text-4xl"></i>
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-serif font-black text-white tracking-tight mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                        FinTrack
                    </h1>

                    <div className="inline-flex items-center space-x-2.5 px-5 py-2 bg-white/[0.03] backdrop-blur-2xl rounded-full border border-white/[0.05] shadow-xl">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">
                            Unified Portfolio Sync
                        </p>
                    </div>
                </div>

                <div className="space-y-7 sm:space-y-9 relative z-10">
                    <div className="relative group">
                        <div className="flex justify-between items-center mb-3.5 px-1">
                            <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.25em]">
                                Access Identifier
                            </label>
                            <div className="flex items-center space-x-1.5">
                                <i className="fa-solid fa-lock text-[10px] text-indigo-400"></i>
                                <span className="text-[9px] font-bold text-indigo-400/50 uppercase tracking-widest leading-none">AES-256</span>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20">
                                <i className="fa-solid fa-microchip text-white/20 text-xl group-focus-within:text-indigo-500 transition-colors"></i>
                            </div>
                            <input
                                type="text"
                                id="family-id"
                                name="family-id"
                                value={familyId}
                                onChange={(e) => setFamilyId(e.target.value)}
                                placeholder="8-DIGIT ID"
                                className="w-full px-6 py-5 sm:py-6 bg-black/40 border border-white/[0.05] rounded-3xl text-xl sm:text-2xl font-mono font-black tracking-[0.25em] placeholder:text-white/20 focus:bg-black/60 focus:border-indigo-500/50 transition-all outline-none text-white shadow-inner text-center"
                                maxLength={8}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-5 rounded-[2rem] text-[11px] font-bold animate-shake flex items-center shadow-2xl">
                            <i className="fa-solid fa-shield-virus mr-4 text-xl"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex flex-col space-y-4 sm:space-y-5">
                        <button
                            onClick={handleJoinFamily}
                            disabled={isLoading}
                            className={`group relative w-full py-5 sm:py-6 rounded-3xl font-black text-[14px] uppercase tracking-[0.4em] text-white overflow-hidden transition-all active:scale-[0.96] shadow-[0_20px_50px_rgba(79,70,229,0.4)] ${isLoading ? 'opacity-80' : ''}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-[#d946ef] to-indigo-600 bg-[length:200%_100%] animate-gradient-x"></div>
                            <span className="relative flex items-center justify-center drop-shadow-lg pr-[0.4em]">
                                {isLoading ? (
                                    <><i className="fa-solid fa-spinner fa-spin mr-3 tracking-normal"></i>Establishing Sync...</>
                                ) : (
                                    <><i className="fa-solid fa-fingerprint mr-3 tracking-normal group-hover:scale-110 transition-transform"></i>Connect Account</>
                                )}
                            </span>
                        </button>

                        <button
                            onClick={generateFamilyId}
                            disabled={isLoading}
                            className="w-full py-4 sm:py-5 bg-white/[0.03] border border-white/[0.05] text-white/70 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] transition-all hover:bg-white/[0.08] hover:text-white hover:border-indigo-400/20 active:scale-[0.96] flex items-center justify-center group"
                        >
                            <i className="fa-solid fa-wand-magic-sparkles mr-3 text-indigo-400 tracking-normal group-hover:rotate-12 transition-transform"></i>
                            Secure Generate
                        </button>
                    </div>

                    <div className="pt-8 sm:pt-10 mt-6 border-t border-white/[0.05]">
                        <div className="grid grid-cols-3 gap-3 sm:gap-5">
                            {[
                                { icon: 'fa-shield-halved', label: 'E2E Link', color: 'text-emerald-400' },
                                { icon: 'fa-bolt-lightning', label: '0ms Delay', color: 'text-amber-400' },
                                { icon: 'fa-network-wired', label: 'Multi-Node', color: 'text-indigo-400' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center p-3 sm:p-4 rounded-3xl bg-white/[0.02] border border-white/[0.03] group hover:bg-white/[0.05] transition-all cursor-default">
                                    <i className={`fa-solid ${item.icon} ${item.color} text-lg mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}></i>
                                    <span className="text-[7px] sm:text-[7.5px] font-black text-white/30 uppercase tracking-[0.2em] text-center">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-center text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] mt-8">
                            Verified Financial Protocol v2.5
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilySetup;
