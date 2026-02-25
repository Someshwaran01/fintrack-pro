
import { CreditCardBill, MedicalExpense, HomeExpense, Income } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export class GeminiService {
    private static getApiKey() {
        // Check both process.env (Vite define) and import.meta.env (Vite default)
        // We use a try-catch or type check to handle environments where these might be undefined
        try {
            const key = (process.env as any).GEMINI_API_KEY ||
                (import.meta as any).env?.VITE_GEMINI_API_KEY ||
                (import.meta as any).env?.GEMINI_API_KEY;
            return key || '';
        } catch (e) {
            return '';
        }
    }

    static async analyzeFinances(data: {
        bills: CreditCardBill[];
        medical: MedicalExpense[];
        home: HomeExpense[];
        income: Income[];
    }, userMessage: string) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.');
        }

        const systemPrompt = `
      You are FinTrack AI, a professional financial advisor. 
      You have access to the user's financial data:
      
      INCOME: ${JSON.stringify(data.income)}
      CREDIT CARD BILLS: ${JSON.stringify(data.bills)}
      MEDICAL EXPENSES: ${JSON.stringify(data.medical)}
      HOME EXPENSES: ${JSON.stringify(data.home)}

      Your goal is to:
      1. Provide clear, actionable financial advice.
      2. Analyze spending patterns and suggest savings.
      3. Identify potential risks (e.g., high credit utilization).
      4. Answer specific questions about their budget.
      
      Keep responses professional, concise, and helpful. Use markdown formatting for readability.
      If the user asks something unrelated to finance, politely redirect them to financial topics.
    `;

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: `SYSTEM: ${systemPrompt}\n\nUSER: ${userMessage}` }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to connect to Gemini AI');
            }

            const result = await response.json();
            return result.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }
}
