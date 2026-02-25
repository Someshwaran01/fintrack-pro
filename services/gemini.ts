
import { CreditCardBill, MedicalExpense, HomeExpense, Income } from '../types';

export class AIService {
    private static getApiKey() {
        return import.meta.env.VITE_GROQ_API_KEY || '';
    }

    static async analyzeFinances(data: {
        bills: CreditCardBill[];
        medical: MedicalExpense[];
        home: HomeExpense[];
        income: Income[];
    }, userMessage: string) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Groq API Key (VITE_GROQ_API_KEY) is missing. Please add it to your .env file.');
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
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ],
                    temperature: 0.7,
                    max_tokens: 2048
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to connect to Groq AI');
            }

            const result = await response.json();
            return result.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response at this time.';
        } catch (error: any) {
            console.error('Groq API Error:', error);
            throw new Error(error.message || 'Failed to connect to AI assistant');
        }
    }
}

// Keep the old name for backward compatibility if needed, or export it as GeminiService
export const GeminiService = AIService;
