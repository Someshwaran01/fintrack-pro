// src/services/smsPermissionService.ts
// Fixes: "Missing READ_PHONE_STATE permission" debug error

import { Capacitor } from '@capacitor/core';

export async function requestSmsPermissions(): Promise<{ allGranted: boolean }> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('SMS permissions only available on native Android');
    return { allGranted: false };
  }
  try {
    const { SmsReader } = await import('@solimanware/capacitor-sms-reader');
    const result = await (SmsReader as any).requestPermission();
    const granted = result?.granted === true || result?.status === 'granted' || result === true;
    console.log('SMS permission granted:', granted);
    return { allGranted: granted };
  } catch (error: any) {
    console.error('SMS permission request failed:', error.message);
    return { allGranted: false };
  }
}

export async function readFinancialSms(): Promise<any[]> {
  const { allGranted } = await requestSmsPermissions();
  if (!allGranted) throw new Error('SMS permissions not granted. Please allow SMS access in device settings.');
  const { SmsReader } = await import('@solimanware/capacitor-sms-reader');
  const result = await (SmsReader as any).getSMS({ filter: { box: 'inbox', indexFrom: 0, maxCount: 200 } });
  const messages = result?.sms ?? result?.messages ?? [];
  const keywords = ['debited','credited','payment','INR','Rs.','UPI','NEFT','IMPS','ATM','EMI','bank'];
  return messages.filter((msg: any) =>
    keywords.some(kw => (msg.body || msg.message || '').toLowerCase().includes(kw.toLowerCase()))
  );
}
