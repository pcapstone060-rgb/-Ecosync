import React from 'react';
import { User, Phone, Mail, ArrowRight } from 'lucide-react';



const ContactSupport = () => {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 p-8 font-jakarta">

            {/* Header / Breadcrumb Style */}
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-emerald-400 font-bold tracking-widest text-sm uppercase mb-1">
                        S4 INDUSTRIAL
                    </h1>
                    <p className="text-slate-500 text-[10px] tracking-widest font-mono">
                        DIRECT NODE LINK // V2.9
                    </p>
                </div>

            </div>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Main Card Container */}
                <div className="relative overflow-hidden rounded-sm border border-emerald-500/20 bg-emerald-950/10 p-12">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-500 rounded-tl-lg" />

                    <h2 className="text-3xl font-light italic text-slate-100 mb-2 tracking-wide font-serif">
                        CONTACT ENGINEERING
                    </h2>
                    <p className="text-slate-500 mb-12 font-light">
                        Direct support for industrial node maintenance and system integration.
                    </p>

                    <div className="grid grid-cols-1 gap-6">

                        {/* Technical Lead Card */}
                        <div className="p-6 rounded border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-emerald-500/30 transition-all group flex items-center gap-6 cursor-pointer">
                            <div className="w-12 h-12 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-colors">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">TECHNICAL LEAD</h3>
                                <p className="text-xl font-bold text-white tracking-tight">Sreekar S.</p>
                            </div>
                        </div>

                        {/* Direct Line Card */}
                        <div className="p-6 rounded border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-emerald-500/30 transition-all group flex items-center gap-6 cursor-pointer">
                            <div className="w-12 h-12 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-colors">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">DIRECT LINE</h3>
                                <p className="text-xl font-bold text-white tracking-tight font-mono">+91 98765 43210</p>
                            </div>
                        </div>

                        {/* Support Email Card */}
                        <div className="p-6 rounded border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-emerald-500/30 transition-all group flex items-center gap-6 cursor-pointer">
                            <div className="w-12 h-12 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-colors">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">GLOBAL SUPPORT</h3>
                                <p className="text-xl font-bold text-white tracking-tight font-mono">support@ecosync.io</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Links */}
                <div className="flex justify-center gap-8 mt-16 text-[10px] tracking-widest font-bold text-slate-600 uppercase">
                    <span className="hover:text-emerald-500 cursor-pointer transition-colors">TERMS</span>
                    <span className="hover:text-emerald-500 cursor-pointer transition-colors">PRIVACY</span>
                    <span className="hover:text-emerald-500 cursor-pointer transition-colors">SLA</span>
                </div>

            </div>
        </div>
    );
};

export default ContactSupport;
// <label>
