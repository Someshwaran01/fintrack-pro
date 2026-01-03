import React, { useState, useEffect } from 'react';
import { GoogleSheetsService } from '../services/googleSheets';
import { CreditCardBill, MedicalExpense, HomeExpense } from '../types';

interface CloudSyncModalProps {
    show: boolean;
    onClose: () => void;
    bills: CreditCardBill[];
    medical: MedicalExpense[];
    home: HomeExpense[];
}

const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ show, onClose, bills, medical, home }) => {
    const [cloudEnabled, setCloudEnabled] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const enabled = localStorage.getItem('cloudSyncEnabled') === 'true';
        setCloudEnabled(enabled);
    }, [show]);

    const handleEnableCloud = async () => {
        setSyncing(true);
        setMessage('Syncing data to Google Sheets...');

        try {
            const success = await GoogleSheetsService.syncAll(bills, medical, home);
            if (success) {
                localStorage.setItem('cloudSyncEnabled', 'true');
                setCloudEnabled(true);
                setMessage('✅ Google Sheets sync enabled! App will check for updates every 30 seconds. Add data directly to the sheet to share with family.');
            } else {
                setMessage('❌ Failed to connect. Check that Sheet ID and API key are correct, and sheet is shared as "Anyone with link can view".');
            }
        } catch (error) {
            setMessage('❌ Error: ' + (error as Error).message);
        }

        setSyncing(false);
    };

    const handleDisableCloud = () => {
        localStorage.setItem('cloudSyncEnabled', 'false');
        setCloudEnabled(false);
        setMessage('Google Sheets sync disabled. Using local storage only.');
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">☁️ Google Sheets Sync</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Status */}
                    <div className={`p-4 rounded-xl ${cloudEnabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className="text-sm font-bold mb-1">
                            {cloudEnabled ? '✅ Google Sheets Sync Enabled' : '⚠️ Google Sheets Sync Disabled'}
                        </p>
                        <p className="text-xs text-gray-600">
                            {cloudEnabled
                                ? 'App pulls latest data from Google Sheets every 30 seconds. Update the sheet directly to share with family.'
                                : 'Data is stored locally only. Enable sync to pull data from shared Google Sheet.'}
                        </p>
                    </div>

                    {/* Setup Info */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <p className="text-sm font-bold text-blue-800 mb-2">
                            📊 Shared Google Sheet
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                            All family members can manually add data to the shared Google Sheet. Each device reads from the sheet every 30 seconds. No Family ID needed.
                        </p>
                        <a
                            href="https://docs.google.com/spreadsheets/d/1v6mUZqe1AXW3D5b1PUjWKzdvDkAD45uTEXl5nWnEwrw"
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
                                            Enable Google Sheets Sync
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={handleDisableCloud}
                                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition-colors"
                                >
                                    <i className="fa-solid fa-cloud-slash mr-2"></i>
                                    Disable Sync
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
                                How It Works
                            </p>
                            <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                                <li>Data syncs automatically every 30 seconds</li>
                                <li>All family devices share the same Google Sheet</li>
                                <li>Changes on one device appear on others within 30s</li>
                                <li>Works for up to 3 devices (as configured)</li>
                                <li>Check GOOGLE_SHEETS_SETUP.md for configuration</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            );
};

            export default CloudSyncModal;
