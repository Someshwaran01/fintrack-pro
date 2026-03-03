import React, { useState } from 'react';
import { CreditCardLimit } from '../types';
import { generateId } from '../utils/helpers';

interface OnboardingProps {
    onComplete: (members: string[], ccLimits: CreditCardLimit[]) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [members, setMembers] = useState<string[]>([]);
    const [newMember, setNewMember] = useState('');
    const [hasCreditCards, setHasCreditCards] = useState<boolean | null>(null);
    const [ccLimits, setCCLimits] = useState<CreditCardLimit[]>([]);

    // Form for a single credit card
    const [currentCC, setCurrentCC] = useState<Partial<CreditCardLimit>>({
        cardName: '',
        creditLimit: 0,
        billDate: 1,
        dueDate: 15,
        notes: ''
    });

    const addMember = () => {
        if (newMember.trim() && !members.includes(newMember.trim())) {
            setMembers([...members, newMember.trim()]);
            setNewMember('');
        }
    };

    const removeMember = (name: string) => {
        setMembers(members.filter(m => m !== name));
    };

    const addCC = () => {
        if (currentCC.cardName && currentCC.creditLimit) {
            const newCC: CreditCardLimit = {
                id: generateId(),
                cardName: currentCC.cardName.trim(),
                creditLimit: currentCC.creditLimit,
                billDate: currentCC.billDate || 1,
                dueDate: currentCC.dueDate || 15,
                updatedDate: new Date().toISOString(),
                notes: currentCC.notes || ''
            };
            setCCLimits([...ccLimits, newCC]);
            setCurrentCC({
                cardName: '',
                creditLimit: 0,
                billDate: 1,
                dueDate: 15,
                notes: ''
            });
        }
    };

    const handleFinish = () => {
        onComplete(members, ccLimits);
    };

    return (
        <div className="fixed inset-0 bg-[#020617] flex items-center justify-center z-[100] p-6 overflow-y-auto pt-safe pb-safe">
            {/* Background elements to match FamilySetup */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -top-48 -left-48 animate-pulse"></div>
                <div className="absolute w-[400px] h-[400px] bg-rose-600/20 rounded-full blur-[100px] -bottom-24 -right-24"></div>
            </div>

            <div className="relative glass-premium max-w-lg w-full p-6 sm:p-8 rounded-[2.5rem] shadow-2xl animate-fadeIn border border-white/10 backdrop-blur-[60px] bg-white/[0.03]">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <i className={`fa-solid ${step === 1 ? 'fa-users' : step === 2 ? 'fa-credit-card' : 'fa-check'} text-white text-2xl`}></i>
                    </div>
                    <h2 className="text-3xl font-serif font-black text-white mb-2">
                        {step === 1 ? 'Family Members' : step === 2 ? 'Credit Cards' : 'All Set!'}
                    </h2>
                    <p className="text-white/50 text-sm uppercase tracking-widest font-bold">
                        Step {step} of 3 • Configuration
                    </p>
                </div>

                {step === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                        <p className="text-white/80 text-center text-sm leading-relaxed capitalize">
                            Add everyone who will be tracking expenses.
                        </p>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newMember}
                                onChange={(e) => setNewMember(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addMember()}
                                placeholder="Enter name (e.g., Mom)"
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-white/20 min-w-0"
                            />
                            <button
                                onClick={addMember}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white w-14 shrink-0 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                            >
                                <i className="fa-solid fa-plus text-lg"></i>
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-white/[0.02] rounded-3xl border border-white/5">
                            {members.map(member => (
                                <div key={member} className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full border border-white/10 group animate-fadeIn">
                                    <span className="font-bold text-xs uppercase tracking-wider">{member}</span>
                                    <button onClick={() => removeMember(member)} className="text-white/30 hover:text-rose-400 transition-colors">
                                        <i className="fa-solid fa-circle-xmark"></i>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={members.length === 0}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-widest"
                        >
                            Next: Financial Setup
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        {hasCreditCards === null ? (
                            <div className="text-center space-y-4">
                                <p className="text-white/80 text-center text-sm leading-relaxed">
                                    Do you use any credit cards in your family?
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setHasCreditCards(true)}
                                        className="bg-white/5 hover:bg-white/10 p-6 rounded-3xl border border-white/10 transition-all group active:scale-95"
                                    >
                                        <i className="fa-solid fa-thumbs-up text-3xl text-emerald-400 mb-3 group-hover:scale-110 transition-transform"></i>
                                        <p className="text-white font-bold uppercase tracking-wider text-xs">Yes, I do</p>
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        className="bg-white/5 hover:bg-white/10 p-6 rounded-3xl border border-white/10 transition-all group active:scale-95"
                                    >
                                        <i className="fa-solid fa-thumbs-down text-3xl text-rose-400 mb-3 group-hover:scale-110 transition-transform"></i>
                                        <p className="text-white font-bold uppercase tracking-wider text-xs">No, skip this</p>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Card Name (e.g. HDFC Regalia)"
                                        value={currentCC.cardName}
                                        onChange={e => setCurrentCC({ ...currentCC, cardName: e.target.value })}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-indigo-500 transition-all placeholder:text-white/20"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 mb-1 block">Limit (₹)</label>
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={currentCC.creditLimit || ''}
                                                onChange={e => setCurrentCC({ ...currentCC, creditLimit: Number(e.target.value) })}
                                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-indigo-500 transition-all placeholder:text-white/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 mb-1 block">Bill Date</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={currentCC.billDate}
                                                onChange={e => setCurrentCC({ ...currentCC, billDate: Number(e.target.value) })}
                                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={addCC}
                                        disabled={!currentCC.cardName || !currentCC.creditLimit}
                                        className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold py-3 rounded-xl border border-emerald-600/30 transition-all active:scale-95 text-xs uppercase tracking-widest"
                                    >
                                        Add This Card
                                    </button>
                                </div>

                                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                                    {ccLimits.map(cc => (
                                        <div key={cc.id} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <div>
                                                <p className="text-white font-bold text-sm">{cc.cardName}</p>
                                                <p className="text-white/40 text-[10px]">₹{cc.creditLimit.toLocaleString()} • Day {cc.billDate}</p>
                                            </div>
                                            <button onClick={() => setCCLimits(ccLimits.filter(c => c.id !== cc.id))} className="text-rose-400/50 hover:text-rose-400">
                                                <i className="fa-solid fa-trash-can"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setHasCreditCards(null)}
                                        className="flex-1 bg-white/5 text-white/50 font-bold py-4 rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-all uppercase tracking-widest"
                                    >
                                        Complete Setup
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center space-y-8 animate-fadeIn">
                        <div className="py-4">
                            <i className="fa-solid fa-circle-check text-6xl text-emerald-400 animate-bounce"></i>
                            <p className="mt-4 text-white/80 leading-relaxed font-serif italic text-lg">
                                "Your personalized financial workspace is ready."
                            </p>
                            <div className="mt-6 space-y-2">
                                <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] font-black">Configuration Overview</p>
                                <div className="flex justify-center gap-4">
                                    <div className="flex flex-col items-center">
                                        <span className="text-white font-black text-xl">{members.length}</span>
                                        <span className="text-white/40 text-[9px] uppercase tracking-wider">Members</span>
                                    </div>
                                    <div className="bg-white/10 w-px h-8"></div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-indigo-400 font-black text-xl">{ccLimits.length}</span>
                                        <span className="text-white/40 text-[9px] uppercase tracking-wider">Cards</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleFinish}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-5 rounded-2xl shadow-2xl hover:shadow-emerald-500/20 active:scale-[0.98] transition-all uppercase tracking-[0.2em]"
                        >
                            Enter FinTrack
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
