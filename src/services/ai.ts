
import { CreditCardBill, MedicalExpense, HomeExpense, Income } from '../types';

export class AIService {
    private static getApiKey() {
        return import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
    }

    /**
     * Anonymizes and minimizes financial data before sending to AI
     * This ensures no personal identifiers, merchant names, or specific notes
     * are shared with the external AI provider.
     */
    private static scrubData(data: {
        bills: CreditCardBill[];
        medical: MedicalExpense[];
        home: HomeExpense[];
        income: Income[];
    }, members: string[]) {
        const getMemberId = (spender?: string) => {
            if (!spender) return 'Unknown';
            const index = members.indexOf(spender);
            return index !== -1 ? `Member ${index + 1}` : 'Other';
        };

        return {
            income: data.income.map(i => ({
                month: i.month,
                amount: i.amount,
                category: i.source,
                owner: getMemberId(i.spender)
            })),
            bills: data.bills.map(b => ({
                month: b.month,
                type: 'Credit Card',
                category: b.category,
                amount: b.monthlyAmount,
                isEmi: b.isEmi
            })),
            medical: data.medical.map(m => ({
                month: new Date(m.date).toLocaleString('default', { month: 'short', year: '2-digit' }),
                amount: m.amount,
                category: 'Health/Medical'
            })),
            home: data.home.map(h => ({
                month: new Date(h.date).toLocaleString('default', { month: 'short', year: '2-digit' }),
                amount: h.amount,
                category: h.category,
                owner: getMemberId(h.spender)
            }))
        };
    }

    static async analyzeFinances(data: {
        bills: CreditCardBill[];
        medical: MedicalExpense[];
        home: HomeExpense[];
        income: Income[];
    }, userMessage: string, members: string[]) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('AI API Key is missing. Please add it to your environment variables or GitHub Secrets.');
        }

        // Apply Data Security Masking
        const secureData = this.scrubData(data, members);

        const systemPrompt = `
      You are FinTrack AI, a professional financial advisor. 
      You are viewing ANONYMIZED financial data to protect user privacy.
      
      DATA SUMMARY:
      - TOTAL INCOME: ${secureData.income.reduce((sum, i) => sum + i.amount, 0)}
      - TOTAL EXPENSES tracked: ${secureData.bills.reduce((sum, b) => sum + b.amount, 0) +
            secureData.medical.reduce((sum, m) => sum + m.amount, 0) +
            secureData.home.reduce((sum, h) => sum + h.amount, 0)
            }
      
      DETAILED ANONYMIZED DATA:
      INCOME: ${JSON.stringify(secureData.income)}
      CREDIT CARD BILLS: ${JSON.stringify(secureData.bills)}
      MEDICAL EXPENSES: ${JSON.stringify(secureData.medical)}
      HOME EXPENSES: ${JSON.stringify(secureData.home)}

      YOUR PRIVACY RULES:
      1. Never ask for the user's real name, bank name, or specific location.
      2. Provide financial analysis based purely on the numbers and categories provided.
      3. Focus on trends, savings, and budget optimization.
      4. If the user mentions health details, remain empathetic but focus on the financial impact.
      
      Keep responses professional, concise, and helpful. Use markdown formatting.
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
                throw new Error(errorData.error?.message || 'Failed to connect to AI');
            }

            const result = await response.json();
            return result.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response at this time.';
        } catch (error: any) {
            console.error('AI Service Error:', error);
            throw new Error(error.message || 'Failed to connect to AI assistant');
        }
    }
}

export const GeminiService = AIService;
