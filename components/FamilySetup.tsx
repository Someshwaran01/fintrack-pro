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
        const cleanedFamilyId = familyId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

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
        <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            {/* Animated background circles */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
                <div className="absolute w-96 h-96 bg-white rounded-full -top-20 -left-20 animate-pulse"></div>
                <div className="absolute w-80 h-80 bg-white rounded-full -bottom-20 -right-20" style={{ animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                <div className="absolute w-64 h-64 bg-white rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
            </div>

            <div className="relative glass rounded-3xl p-10 max-w-md w-full shadow-2xl animate-fadeIn" style={{ animation: 'fadeIn 0.8s ease-out' }}>
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <i className="fa-solid fa-wallet text-white text-3xl"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 gradient-text">
                        FinTrack Pro Family
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Sync your expenses with up to 5 family members
                    </p>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            <i className="fa-solid fa-key mr-2 text-indigo-600"></i>
                            Family ID
                        </label>
                        <input
                            type="text"
                            id="family-id"
                            name="family-id"
                            value={familyId}
                            onChange={(e) => setFamilyId(e.target.value.toUpperCase())}
                            placeholder="Enter or generate Family ID"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base font-mono uppercase focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                            maxLength={8}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg animate-slideInUp">
                            <div className="flex items-center">
                                <i className="fa-solid fa-exclamation-circle mr-2"></i>
                                <span className="text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleJoinFamily}
                        disabled={isLoading}
                        className={`w-full py-4 rounded-xl font-bold text-white text-base shadow-lg transition-all transform ${isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0'
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                Joining...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center">
                                <i className="fa-solid fa-arrow-right-to-bracket mr-2"></i>
                                Join Family
                            </span>
                        )}
                    </button>

                    <button
                        onClick={generateFamilyId}
                        disabled={isLoading}
                        className={`w-full py-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold text-base transition-all transform ${isLoading
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-indigo-50 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                            }`}
                    >
                        <i className="fa-solid fa-sparkles mr-2"></i>
                        Generate New Family ID
                    </button>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-indigo-100">
                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                            <i className="fa-solid fa-circle-info text-indigo-600 mr-2"></i>
                            How it works:
                        </h3>
                        <ul className="text-xs text-gray-700 space-y-2">
                            <li className="flex items-start">
                                <i className="fa-solid fa-check text-green-500 mr-2 mt-0.5"></i>
                                <span>Generate a new Family ID or use an existing one</span>
                            </li>
                            <li className="flex items-start">
                                <i className="fa-solid fa-check text-green-500 mr-2 mt-0.5"></i>
                                <span>Share the Family ID with up to 5 family members</span>
                            </li>
                            <li className="flex items-start">
                                <i className="fa-solid fa-check text-green-500 mr-2 mt-0.5"></i>
                                <span>Everyone with the same Family ID shares the same data</span>
                            </li>
                            <li className="flex items-start">
                                <i className="fa-solid fa-check text-green-500 mr-2 mt-0.5"></i>
                                <span>Changes sync in real-time across all devices</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilySetup;
