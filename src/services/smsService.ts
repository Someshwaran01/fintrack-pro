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
      // Basic fallback to fetch SMS
      const { messages } = await SMSInboxReader.getMessages({
        box: 'inbox',
        read: 1, // Only read messages or 0 for unread (varies by plugin version)
        count: 50 // Fetch last 50
      });

      const transactions: ParsedTransaction[] = [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      for (const msg of messages || []) {
        // Only process messages from verified sender IDs (-S or -T suffix)
        if (!this.isValidBankSender(msg.address)) continue;

        const msgDate = new Date(Number(msg.date));
        if (msgDate < cutoffDate) continue;

        const parsed = this.parseSmsBody(msg.body, msgDate.toISOString());
        if (parsed) {
          transactions.push(parsed);
        }
      }

      return transactions;
    } catch (error) {
      console.error('Failed to read SMS:', error);
      return [];
    }
  }

  /**
   * Helper to verify if the SMS sender is a Bank/UPI gateway
   * Example typical sender: AD-HDFCBK-S
   */
  private static isValidBankSender(senderId: string): boolean {
    if (!senderId) return false;
    const cleanId = senderId.toUpperCase();
    // Broadening the filter: most bank alerts in India start with alphabets like AD-, BX- etc.
    // and often contain 'BK' (Bank), 'HDFC', 'ICICI', 'SBI', 'AXIS'
    const bankKeywords = ['-S', '-T', 'BK', 'BANK', 'HDFC', 'ICICI', 'SBI', 'AXIS', 'SBI', 'PNB', 'BOB'];
    return bankKeywords.some(keyword => cleanId.includes(keyword));
  }

  /**
   * Core Regex matching engine to extract amounts
   */
  private static parseSmsBody(body: string, dateIso: string): ParsedTransaction | null {
    const text = body.toLowerCase();
    
    // Check if it's a debit transaction
    // Common Indian bank patterns: "debited by rs 500", "sent rs. 500", "spent inr 500"
    const isDebit = text.includes('debited') || text.includes('sent') || text.includes('paid');
    
    // Strict Regex to find standard currency structures (Rs./INR/₹ followed by digits and decimals)
    const amountRegex = /(?:rs\.?|inr|₹)\s*([\w,]+\.?\d*)/i;
    const match = text.match(amountRegex);
    
    if (match && match[1]) {
      // Remove commas and cast to number
      const parsedAmount = parseFloat(match[1].replace(/,/g, ''));
      if (isNaN(parsedAmount)) return null;

      // Merchant Extraction
      let merchant = "Unknown Merchant";
      const toMatch = text.match(/to\s+([a-zA-Z0-9\s@\.]+)/i);
      const atMatch = text.match(/at\s+([a-zA-Z0-9\s\.]+)/i);
      const fromMatch = text.match(/from\s+([a-zA-Z0-9\s]+)/i);
      
      if (toMatch && toMatch[1]) merchant = toMatch[1].trim().substring(0, 25);
      else if (atMatch && atMatch[1]) merchant = atMatch[1].trim().substring(0, 25);
      else if (fromMatch && fromMatch[1]) merchant = fromMatch[1].trim().substring(0, 25);

      return {
        amount: parsedAmount,
        merchant,
        date: dateIso.split('T')[0],
        type: isDebit ? 'debit' : 'credit',
        originalText: body
      };
    }

    return null;
  }
}
