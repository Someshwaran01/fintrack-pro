
import React, { useState, useRef, useEffect } from 'react';
import { CreditCardBill, MedicalExpense, HomeExpense, Income } from '../types';
import { AIService } from '../services/ai';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatBotProps {
    bills: CreditCardBill[];
    medical: MedicalExpense[];
    home: HomeExpense[];
    income: Income[];
}

const ChatBot: React.FC<ChatBotProps> = ({ bills, medical, home, income }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello! I'm FinTrack AI. I've analyzed your latest financial data. How can I help you today? You can ask me things like 'How much did I spend this month?' or 'Give me some saving tips based on my expenses'." }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        try {
            const response = await AIService.analyzeFinances({ bills, medical, home, income }, userMsg);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || "I'm having trouble connecting to my brain right now. Please check your config."}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50">
            {/* Header */}
            <div className="p-4 bg-white border-b flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">
                    <i className="fa-solid fa-robot"></i>
                </div>
                <div>
                    <h2 className="font-bold text-gray-800">FinTrack AI Assistant</h2>
                    <p className="text-[10px] text-green-500 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                        Online & Powered by Gemini
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t pb-6">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything about your finances..."
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isTyping || !input.trim()}
                        className="absolute right-2 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <i className="fa-solid fa-paper-plane text-xs"></i>
                    </button>
                </div>
                <p className="text-[9px] text-gray-400 mt-2 text-center italic">
                    AI may provide inaccurate data. Please verify important financial decisions.
                </p>
            </div>
        </div>
    );
};

export default ChatBot;
