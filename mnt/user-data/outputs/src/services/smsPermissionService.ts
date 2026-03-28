// src/services/smsPermissionService.ts
// ✅ Handles runtime SMS + Phone permission requests for Android

import { Capacitor } from '@capacitor/core';

// Permission states
type PermissionState = 'granted' | 'denied' | 'prompt' | 'unavailable';

interface SmsPermissionResult {
  readSms: PermissionState;
  readPhoneState: PermissionState;
  allGranted: boolean;
}

/**
 * Check and request all required SMS permissions on Android.
 * Must be called BEFORE attempting to read SMS messages.
 */
export async function requestSmsPermissions(): Promise<SmsPermissionResult> {
  // Not on native platform — SMS not available
  if (!Capacitor.isNativePlatform()) {
    console.warn('SMS permissions only available on native Android/iOS');
    return {
      readSms: 'unavailable',
      readPhoneState: 'unavailable',
      allGranted: false
    };
  }

  try {
    // Use the capacitor-sms-reader plugin that's already in your package.json
    const { SmsReader } = await import('@solimanware/capacitor-sms-reader');

    // Request permissions via the plugin
    const permResult = await SmsReader.requestPermission();

    console.log('SMS permission result:', permResult);

    const granted =
      permResult?.granted === true ||
      permResult?.status === 'granted' ||
      permResult === true;

    return {
      readSms: granted ? 'granted' : 'denied',
      readPhoneState: granted ? 'granted' : 'denied',
      allGranted: granted
    };
  } catch (error: any) {
    // Fallback: try using the native Capacitor permissions API directly
    console.warn('Plugin permission request failed, trying native API:', error.message);

    try {
      const { PermissionStatus } = await import('@capacitor/core');
      // @ts-ignore — direct native call
      const result = await (window as any).Capacitor?.nativeCallback?.(
        'PermissionsAndroid',
        'requestMultiple',
        {
          permissions: [
            'android.permission.READ_SMS',
            'android.permission.READ_PHONE_STATE'
          ]
        }
      );

      const readSms = result?.['android.permission.READ_SMS'] === 'granted' ? 'granted' : 'denied';
      const readPhoneState = result?.['android.permission.READ_PHONE_STATE'] === 'granted' ? 'granted' : 'denied';

      return {
        readSms,
        readPhoneState,
        allGranted: readSms === 'granted' && readPhoneState === 'granted'
      };
    } catch (fallbackError: any) {
      console.error('All permission request methods failed:', fallbackError.message);
      return {
        readSms: 'denied',
        readPhoneState: 'denied',
        allGranted: false
      };
    }
  }
}

/**
 * Read financial SMS messages (bank/transaction alerts)
 * Automatically requests permissions first.
 */
export async function readFinancialSms(): Promise<any[]> {
  const permissions = await requestSmsPermissions();

  if (!permissions.allGranted) {
    throw new Error(
      'SMS permissions not granted. Please allow SMS access in your device settings.'
    );
  }

  try {
    const { SmsReader } = await import('@solimanware/capacitor-sms-reader');

    // Read SMS with financial keyword filter
    const result = await SmsReader.getSMS({
      // Filter for bank/transaction messages
      filter: {
        box: 'inbox',
        indexFrom: 0,
        maxCount: 200
      }
    });

    const messages = result?.sms ?? result?.messages ?? [];

    // Filter to only transaction-related messages
    const financialKeywords = [
      'debited', 'credited', 'payment', 'transaction',
      'INR', 'Rs.', 'spent', 'received', 'transferred',
      'UPI', 'NEFT', 'RTGS', 'IMPS', 'ATM', 'purchase',
      'EMI', 'bill', 'due', 'bank'
    ];

    const financialMessages = messages.filter((msg: any) => {
      const body = (msg.body || msg.message || '').toLowerCase();
      return financialKeywords.some(kw => body.includes(kw.toLowerCase()));
    });

    console.log(`✅ Found ${financialMessages.length} financial SMS out of ${messages.length} total`);
    return financialMessages;
  } catch (error: any) {
    console.error('❌ Failed to read SMS:', error.message);
    throw error;
  }
}
