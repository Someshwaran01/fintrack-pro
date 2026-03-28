import { Capacitor } from '@capacitor/core';
// Import the SMS reader once the user installs it
import { SMSInboxReader } from '@solimanware/capacitor-sms-reader';

export interface ParsedTransaction {
  amount: number;
  merchant: string;
  date: string;
  type: 'debit' | 'credit';
  originalText: string;
}

export class SmsService {
  /**
   * Request READ_SMS permissions from Android OS.
   */
  static async requestPermissions(): Promise<boolean> {
    if (Capacitor.getPlatform() !== 'android') {
      console.warn('SMS reading is only supported on Android.');
      return false;
    }

    try {
      const check = await SMSInboxReader.checkPermissions();
      console.log('Current SMS Permission Status:', check);
      
      // Use a helper to check for any truthy "granted" state in the response
      const isGranted = (obj: any) => {
        const str = JSON.stringify(obj || {}).toLowerCase();
        return str.includes('"granted"') || str.includes(':true') || str.includes(':"true"');
      };

      if (isGranted(check)) return true;

      const request = await SMSInboxReader.requestPermissions();
      console.log('Requested SMS Permission Status:', request);
      
      if (isGranted(request)) return true;

      // Final diagnostic alert for the user if it still fails
      alert(`Debug: Permission is NOT granted.\nResponse: ${JSON.stringify(request)}`);
      return false;
    } catch (error: any) {
      console.error('Failed to handle SMS permissions:', error);
      alert(`Debug Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Fetch recent SMS and filter out transactions.
   */
  static async getRecentTransactions(daysBack: number = 7): Promise<ParsedTransaction[]> {
    if (Capacitor.getPlatform() !== 'android') return [];

    try {
      console.log('Fetching SMS messages for the last', daysBack, 'days...');
      // Use getSMSList as per plugin version 2.x API
      const result = await SMSInboxReader.getSMSList({
        filter: {
          maxCount: 100, // Fetch last 100
          indexFrom: 0
        }
      });

      const messages = result.smsList || [];

      console.log(`Found ${messages?.length || 0} total messages in inbox.`);
      const transactions: ParsedTransaction[] = [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      for (const msg of messages || []) {
        // Only process messages from verified sender IDs (-S or -T suffix)
        if (!this.isValidBankSender(msg.address)) {
           // console.log('Skipping message from non-bank sender:', msg.address);
           continue;
        }

        const msgDate = new Date(Number(msg.date));
        if (msgDate < cutoffDate) continue;

        console.log('Processing bank SMS from:', msg.address, 'Body:', msg.body);
        const parsed = this.parseSmsBody(msg.body, msgDate.toISOString());
        if (parsed) {
          console.log('Successfully parsed transaction:', parsed.amount, parsed.merchant);
          transactions.push(parsed);
        }
      }

      console.log(`Final transaction count: ${transactions.length}`);
      return transactions;
    } catch (error) {
      console.error('Failed to read SMS:', error);
      return [];
    }
  }

  /**
   * Helper to verify if the SMS sender is a Bank/UPI gateway
   * Example typical sender: AD-HDFCBK-S or JM-ICICIT-S
   */
  private static isValidBankSender(senderId: string): boolean {
    if (!senderId) return false;
    const cleanId = senderId.toUpperCase();
    // Broadening the filter to include more Indian bank patterns and specific sender JM-ICICIT-S
    const bankKeywords = [
      '-S', '-T', '-B', 'BK', 'BNK', 'BANK', 'HDFC', 'ICICI', 'SBI', 'AXIS', 'SBI', 'PNB', 'BOB', 
      'RBL', 'CANARA', 'UNIONB', 'INDUS', 'KOTAK', 'FSSPAY', 'PAYTM', 'GIPSHP', 'VPA'
    ];
    return bankKeywords.some(keyword => cleanId.includes(keyword));
  }

  /**
   * Core Regex matching engine to extract amounts
   */
  private static parseSmsBody(body: string, dateIso: string): ParsedTransaction | null {
    const text = body.toLowerCase();
    
    // Improved debit check: Include 'charged', 'purchased', 'spent'
    const isDebit = text.includes('debited') || text.includes('sent') || text.includes('paid') || 
                    text.includes('charged') || text.includes('spent') || text.includes('purchased');
    
    // Enhanced Regex to find standard currency structures
    // Specifically handles "INR 30.00" or "Rs. 30.00" with varied spacing
    const amountRegex = /(?:rs\.?|inr|₹|inr\.)\s*([\w,]+\.?\d*)/i;
    const match = text.match(amountRegex);
    
    if (match && match[1]) {
      // Remove commas and cast to number
      const cleanedAmount = match[1].replace(/,/g, '');
      const parsedAmount = parseFloat(cleanedAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) return null;

      // Merchant Extraction
      let merchant = "Bank Transaction";
      const toMatch = text.match(/to\s+([a-zA-Z0-9\s@\.\-_]+)/i);
      const atMatch = text.match(/(?:at|for)\s+([a-zA-Z0-9\s\.\-_]+)/i);
      const fromMatch = text.match(/from\s+([a-zA-Z0-9\s\.\-_]+)/i);
      
      if (toMatch && toMatch[1]) merchant = toMatch[1].trim().split('\n')[0].substring(0, 25);
      else if (atMatch && atMatch[1]) merchant = atMatch[1].trim().split('\n')[0].substring(0, 25);
      else if (fromMatch && fromMatch[1]) merchant = fromMatch[1].trim().split('\n')[0].substring(0, 25);

      return {
        amount: parsedAmount,
        merchant: merchant.trim() || "Bank Transaction",
        date: dateIso.split('T')[0],
        type: isDebit ? 'debit' : 'credit',
        originalText: body
      };
    }

    return null;
  }
}
