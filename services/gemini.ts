
import { GoogleGenerativeAI } from '@google/genai';
import { CreditCardBill, MedicalExpense, HomeExpense, Income } from '../types';

export class GeminiService {
    private static getApiKey() {
        try {
            // Priority 1: process.env (Vite static replacement)
            // Priority 2: import.meta.env (Vite native)
            const key = (process.env as any).GEMINI_API_KEY ||
                (import.meta as any).env?.VITE_GEMINI_API_KEY ||
                (import.meta as any).env?.GEMINI_API_KEY;

            // Clean the key (remove quotes if any, check for "undefined" string)
            if (!key || key === "undefined" || key === "null") {
                return '';
            }
            return key.toString().trim();
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
            throw new Error('Gemini API Key is missing. If you just added it to Vercel/GitHub, please trigger a NEW build/deploy to apply the changes.');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
            const fullPrompt = `SYSTEM: ${systemPrompt}\n\nUSER: ${userMessage}`;
            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error('Gemini SDK Error:', error);
            throw new Error(error.message || 'Failed to connect to Gemini AI');
        }
    }
}
