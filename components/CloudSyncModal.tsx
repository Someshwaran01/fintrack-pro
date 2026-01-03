import React, { useState, useEffect } from 'react';
import { CloudStorageService } from '../services/cloudStorage';
import { CreditCardBill, MedicalExpense, HomeExpense } from '../types';

interface CloudSyncModalProps {
    show: boolean;
    onClose: () => void;
    bills: CreditCardBill[];
    medical: MedicalExpense[];
    home: HomeExpense[];
}

const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ show, onClose, bills, medical, home }) => {
    const [familyId, setFamilyId] = useState('');
    const [cloudEnabled, setCloudEnabled] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const currentFamilyId = CloudStorageService.getFamilyId();
        setFamilyId(currentFamilyId);
        const enabled = localStorage.getItem('cloudSyncEnabled') === 'true';
        setCloudEnabled(enabled);
    }, [show]);

    const handleEnableCloud = async () => {
        setSyncing(true);
        setMessage('Syncing data to cloud...');

        try {
            const success = await CloudStorageService.syncLocalToCloud(bills, medical, home);
            if (success) {
                localStorage.setItem('cloudSyncEnabled', 'true');
                setCloudEnabled(true);
                setMessage('✅ Cloud sync enabled! Data synced successfully.');
            } else {
                setMessage('❌ Failed to sync data. Please check Firebase setup.');
            }
        } catch (error) {
            setMessage('❌ Error: ' + (error as Error).message);
        }

        setSyncing(false);
    };

    const handleDisableCloud = () => {
        localStorage.setItem('cloudSyncEnabled', 'false');
        setCloudEnabled(false);
        setMessage('Cloud sync disabled. Using local storage only.');
    };

    const handleJoinFamily = () => {
        if (familyId.trim()) {
            CloudStorageService.setFamilyId(familyId.trim());
            setMessage('✅ Family ID updated! Restart the app to sync with family data.');
        }
    };

    const copyFamilyId = () => {
        navigator.clipboard.writeText(familyId);
        setMessage('📋 Family ID copied! Share with family members.');
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">☁️ Cloud Sync Settings</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Status */}
                    <div className={`p-4 rounded-xl ${cloudEnabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className="text-sm font-bold mb-1">
                            {cloudEnabled ? '✅ Cloud Sync Enabled' : '⚠️ Cloud Sync Disabled'}
                        </p>
                        <p className="text-xs text-gray-600">
                            {cloudEnabled
                                ? 'Your data is syncing with Firebase. All family members can access it.'
                                : 'Data is stored locally only. Enable cloud sync for family sharing.'}
                        </p>
                    </div>

                    {/* Family ID */}
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">
                            👨‍👩‍👧‍👦 Family ID
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={familyId}
                                onChange={(e) => setFamilyId(e.target.value)}
                                className="flex-1 border p-3 rounded-xl outline-none text-sm"
                                placeholder="Enter or paste Family ID"
                            />
                            <button
                                onClick={copyFamilyId}
                                className="px-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                title="Copy Family ID"
                            >
                                <i className="fa-solid fa-copy"></i>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Share this ID with family members so they can access the same data.
                        </p>
                        <button
                            onClick={handleJoinFamily}
                            className="mt-2 w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-2 px-4 rounded-xl transition-colors"
                        >
                            Update Family ID
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        {!cloudEnabled ? (
                            <button
                                onClick={handleEnableCloud}
                                disabled={syncing}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:bg-gray-400"
                            >
                                {syncing ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                        Syncing...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-cloud-arrow-up mr-2"></i>
                                        Enable Cloud Sync
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleDisableCloud}
                                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition-colors"
                            >
                                <i className="fa-solid fa-cloud-slash mr-2"></i>
                                Disable Cloud Sync
                            </button>
                        )}
                    </div>

                    {/* Message */}
                    {message && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                            {message}
                        </div>
                    )}

                    {/* Setup Instructions */}
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                        <p className="text-xs font-bold text-yellow-800 mb-2">
                            <i className="fa-solid fa-circle-info mr-1"></i>
                            Firebase Setup Required
                        </p>
                        <ol className="text-xs text-yellow-800 space-y-1 list-decimal list-inside">
                            <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
                            <li>Create a new project (free tier)</li>
                            <li>Enable Firestore Database</li>
                            <li>Copy your config to services/firebase.ts</li>
                            <li>Set security rules to allow read/write</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloudSyncModal;
