
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
    members: string[];
    isEmbedded?: boolean;
}

const ChatBot: React.FC<ChatBotProps> = ({ bills, medical, home, income, members, isEmbedded = false }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Welcome to your Premium Financial Suite. I've analyzed your current portfolios. How can I assist with your capital management today?" }
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
            const response = await AIService.analyzeFinances({ bills, medical, home, income }, userMsg, members);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Protocol Error: ${error.message || "Connection interrupted. Please verify your credentials."}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className={`flex flex-col ${isEmbedded ? 'h-[500px]' : 'h-[calc(100vh-140px)]'} bg-[#fcfdff] animate-fadeIn`}>
            {/* Elegant Header */}
            {!isEmbedded && (
                <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-[#1a1c2e] to-[#4a4e69] rounded-2xl flex items-center justify-center text-white shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                            <i className="fa-solid fa-crown text-xl text-amber-400"></i>
                        </div>
                        <div>
                            <h2 className="font-serif font-bold text-xl text-[#1a1c2e] tracking-tight">Financial Concierge</h2>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest">
                                    Secure AI Link Active
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#f0f4ff] px-3 py-1.5 rounded-full border border-[#dce4ff] flex items-center">
                        <i className="fa-solid fa-shield-halved text-[#4f46e5] mr-2 text-xs"></i>
                        <span className="text-[10px] font-bold text-[#4f46e5] uppercase">Vault Security</span>
                    </div>
                </div>
            )}

            {/* Messages - Premium Spacing & Typography */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideInUp`}>
                        <div className={`max-w-[88%] p-4 rounded-2xl text-[14px] leading-relaxed shadow-sm tracking-wide ${msg.role === 'user'
                            ? 'bg-gradient-to-br from-[#1a1c2e] to-[#2d3142] text-white rounded-tr-none'
                            : 'bg-white text-[#2d3142] border border-gray-100 rounded-tl-none font-medium'
                            }`}>
                            {msg.content}
                            {msg.role === 'assistant' && idx === 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button onClick={() => setInput("Evaluate my liquidity")} className="text-[10px] bg-[#f8faff] border border-[#e2e8f0] px-3 py-1.5 rounded-full hover:border-[#4f46e5] text-[#4f46e5] transition-all font-bold uppercase">Liquidity Check</button>
                                    <button onClick={() => setInput("Capital efficiency tips")} className="text-[10px] bg-[#f8faff] border border-[#e2e8f0] px-3 py-1.5 rounded-full hover:border-[#4f46e5] text-[#4f46e5] transition-all font-bold uppercase">Tax Strategy</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-[#1a1c2e] rounded-full animate-bounce [animation-duration:0.8s]"></div>
                                <div className="w-2 h-2 bg-[#1a1c2e] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-[#1a1c2e] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Premium Input Bar */}
            <div className="p-6 bg-white border-t border-gray-100 pb-8">
                <div className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Inquire about your wealth strategy..."
                        className="w-full pl-6 pr-14 py-4 bg-[#f8f9fc] border border-transparent rounded-2xl focus:bg-white focus:border-[#4f46e5] focus:ring-4 focus:ring-[#4f46e5]/5 transition-all outline-none text-sm placeholder:text-gray-400 font-medium"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isTyping || !input.trim()}
                        className="absolute right-2.5 top-2.5 w-11 h-11 bg-gradient-to-tr from-[#1a1c2e] to-[#4a4e69] text-white rounded-xl flex items-center justify-center hover:shadow-xl disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
                    >
                        <i className="fa-solid fa-paper-plane text-sm"></i>
                    </button>
                </div>
                <div className="flex justify-center items-center mt-4 space-x-2">
                    <i className="fa-solid fa-lock text-[8px] text-gray-400"></i>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                        End-to-End Encrypted Financial Advice
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
