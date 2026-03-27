import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export interface ParsedBill {
    cardName: string;
    amountDue: number;
    minimumAmountRow: number | null;
    dueDate: string | null;
    originalText: string;
    isProtected: boolean;
}

export class EmailService {
    /**
     * Authenticate with Google and get the Gmail API access token.
     */
    static async authenticateAndGetToken(): Promise<string | null> {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                return credential.accessToken;
            }
            return null;
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            return null;
        }
    }

    /**
     * Query Gmail API for Credit Card statements
     */
    static async fetchRecentCreditCardEmails(accessToken: string, daysBack: number = 30): Promise<ParsedBill[]> {
        try {
            // Calculate Unix timestamp for the cutoff date to filter query
            const dateStr = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '/');
            const query = `subject:statement OR subject:bill after:${dateStr}`;
            
            // 1. Fetch message IDs matching the query (limit to 10 for performance)
            const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const listData = await listRes.json();
            
            if (!listData.messages || listData.messages.length === 0) {
                return [];
            }

            const parsedBills: ParsedBill[] = [];

            // 2. Fetch full email bodies for each message ID
            for (const msg of listData.messages) {
                const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                const msgData = await msgRes.json();
                
                // Decode email body parts
                let bodyText = '';
                const parts = msgData.payload?.parts;
                
                if (parts) {
                    for (const part of parts) {
                        if (part.mimeType === 'text/plain' && part.body.data) {
                            bodyText += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                        } else if (part.mimeType === 'text/html' && part.body.data) {
                            // Basic HTML strip if plain text is missing
                            const html = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                            bodyText += html.replace(/<[^>]*>?/gm, ' ');
                        }
                    }
                } else if (msgData.payload?.body?.data) {
                    bodyText = atob(msgData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                }

                // If no meaningful text could be parsed (e.g. only a PDF is attached with an empty body)
                if (bodyText.length < 50) {
                   // Might just be an encrypted PDF attachment email
                   parsedBills.push(this.createFallbackProtectedBill(msgData.snippet || ''));
                   continue;
                }

                const parsed = this.parseStatementBody(bodyText);
                if (parsed) {
                    parsedBills.push(parsed);
                } else if (this.isLikelyProtectedStatement(bodyText)) {
                    // Fallback if parsing failed but we know it's a statement
                    parsedBills.push(this.createFallbackProtectedBill(bodyText));
                }
            }

            return parsedBills;

        } catch (error) {
            console.error('Failed to fetch Gmail data:', error);
            throw new Error('Failed to fetch emails.');
        }
    }

    /**
     * Heuristics to check if it's a protected statement where data isn't in body.
     */
    private static isLikelyProtectedStatement(body: string): boolean {
        const text = body.toLowerCase();
        return text.includes('password protected') || 
               text.includes('password to open') ||
               text.includes('statement is protected') ||
               text.includes('click to view your statement') || // Usually implies redirect
               text.includes('attached'); 
    }

    private static createFallbackProtectedBill(snippet: string): ParsedBill {
         return {
            cardName: 'Unknown Card (Protected Statement)',
            amountDue: 0,
            minimumAmountRow: 0,
            dueDate: null,
            originalText: snippet,
            isProtected: true
        };
    }

    /**
     * Regex Engine to extract Total Amount Due and Due Date
     */
    private static parseStatementBody(body: string): ParsedBill | null {
        const textToSearch = body.replace(/\n/g, ' '); // Flatten
        
        // 1. Total Amount Due Extraction
        const totalAmountRegex = /(?:total amount due|amount due|mad|total due)[^₹\d]*?(?:rs|inr|₹)?\.?\s*([\d,]+(?:\.\d{1,2})?)/i;
        const totalAmountMatch = textToSearch.match(totalAmountRegex);
        
        let amountDue = 0;
        if (totalAmountMatch && totalAmountMatch[1]) {
            amountDue = parseFloat(totalAmountMatch[1].replace(/,/g, ''));
        }

        // 2. Minimum Amount Due
        const minAmountRegex = /(?:minimum amount due|min due)[^₹\d]*?(?:rs|inr|₹)?\.?\s*([\d,]+(?:\.\d{1,2})?)/i;
        const minAmountMatch = textToSearch.match(minAmountRegex);
        let minAmount = 0;
        if (minAmountMatch && minAmountMatch[1]) {
            minAmount = parseFloat(minAmountMatch[1].replace(/,/g, ''));
        }

        // 3. Payment Due Date Extraction
        const dueDateRegex = /(?:payment due date|due date)[^\d]*?(\d{1,2}[\/\s-][a-zA-Z]{3,9}[\/\s-]\d{2,4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i;
        const dueDateMatch = textToSearch.match(dueDateRegex);
        let dueDate = null;
        if (dueDateMatch && dueDateMatch[1]) {
            dueDate = dueDateMatch[1].trim();
        }

        // 4. Card Name Extraction (usually ending in XXXX 1234)
        const cardRegex = /(?:card|credit card|acct) (?:no\. |number )?x{4,}\s?(\d{4})/i;
        const cardMatch = textToSearch.match(cardRegex);
        const cardName = cardMatch && cardMatch[1] ? `Card ending in ${cardMatch[1]}` : 'Unknown Card Statement';

        if (amountDue > 0) {
            return {
                cardName,
                amountDue,
                minimumAmountRow: minAmount > 0 ? minAmount : null,
                dueDate,
                originalText: body.substring(0, 100) + '...', // Keep tiny snippet
                isProtected: false
            };
        }

        return null;
    }
}
