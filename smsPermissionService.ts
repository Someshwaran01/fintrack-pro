/**
 * smsPermissionService.ts
 *
 * Handles runtime SMS permission requests and SMS reading for FinTrack Pro.
 * Uses @solimanware/capacitor-sms-reader (already in package.json).
 *
 * Place this file in: src/services/smsPermissionService.ts
 */

import { SmsReader } from '@solimanware/capacitor-sms-reader';
import { Capacitor } from '@capacitor/core';

export interface SmsMessage {
  address: string;   // sender phone number
  body: string;      // message content
  date: number;      // timestamp in ms
}

// ─── Request SMS Permissions ─────────────────────────────────────────────────
// Fixes: "Missing android.permission.READ_PHONE_STATE"
// Must be called BEFORE any SMS reading attempt.
export const requestSmsPermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.warn('SMS reading is only supported on native Android.');
    return false;
  }

  try {
    const result = await SmsReader.requestPermission();

    if (result.granted) {
      console.log('SMS permissions granted ✅');
      return true;
    } else {
      console.warn('SMS permissions denied ❌');
      return false;
    }
  } catch (error: any) {
    console.error('Permission request error:', error);
    return false;
  }
};

// ─── Check if permissions are already granted ────────────────────────────────
export const checkSmsPermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const result = await SmsReader.checkPermission();
    return result.granted;
  } catch {
    return false;
  }
};

// ─── Read SMS messages ───────────────────────────────────────────────────────
// Always calls requestSmsPermissions() first — safe to call repeatedly.
export const readSmsMessages = async (
  filter?: string // optional keyword to filter messages e.g. 'transaction', 'credited'
): Promise<SmsMessage[]> => {
  if (!Capacitor.isNativePlatform()) {
    console.warn('SMS reading is only supported on native Android.');
    return [];
  }

  // Always request permissions before reading (no-op if already granted)
  const granted = await requestSmsPermissions();
  if (!granted) {
    throw new Error('SMS permission was not granted. Please allow SMS access in Settings.');
  }

  try {
    const result = await SmsReader.getSMSList({
      // Filter to last 90 days of messages
      minDate: Date.now() - 90 * 24 * 60 * 60 * 1000,
      filter: filter || ''
    });

    return (result.messages || []) as SmsMessage[];
  } catch (error: any) {
    console.error('SMS read failed:', error);
    throw new Error('Failed to read SMS messages. Please try again.');
  }
};

// ─── Filter financial SMS messages ───────────────────────────────────────────
// Looks for typical bank/transaction SMS keywords
export const readFinancialSms = async (): Promise<SmsMessage[]> => {
  const allSms = await readSmsMessages();

  const financialKeywords = [
    'credited', 'debited', 'transaction', 'payment',
    'spent', 'received', 'transfer', 'balance',
    'INR', 'Rs.', 'UPI', 'NEFT', 'IMPS'
  ];

  return allSms.filter(sms =>
    financialKeywords.some(keyword =>
      sms.body.toLowerCase().includes(keyword.toLowerCase())
    )
  );
};
