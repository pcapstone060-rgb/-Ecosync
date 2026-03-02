import React from 'react';
import { ShieldCheck, Zap, Activity, Info } from 'lucide-react';


const AboutProject = () => {
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
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Project Overview Card */}
                <div className="relative overflow-hidden rounded-sm border border-emerald-500/20 bg-emerald-950/10 p-12 group">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-500" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-emerald-500" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-emerald-500" />

                    {/* Background Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10 blur-3xl opacity-20" />

                    <h2 className="text-3xl font-light italic text-slate-100 mb-6 tracking-wide font-serif relative z-10">
                        PROJECT ECOSYNC
                    </h2>

                    <p className="text-slate-400 leading-relaxed max-w-3xl mb-12 relative z-10 text-lg font-light">
                        EcoSync is an advanced Industrial IoT ecosystem engineered specifically for high-risk manufacturing environments.
                        Our mission is to bridge the gap between physical telemetry and explainable intelligence.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        {/* Mission Focus */}
                        <div className="p-6 rounded border border-slate-800 bg-slate-900/50 hover:border-emerald-500/30 transition-colors">
                            <h3 className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-2">
                                MISSION FOCUS
                            </h3>
                            <p className="text-sm text-slate-400">
                                Real-time prevention of thermal runaway and gas buildup in explosive manufacturing zones.
                            </p>
                        </div>

                        {/* XAI Framework */}
                        <div className="p-6 rounded border border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-colors">
                            <h3 className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-2">
                                XAI FRAMEWORK
                            </h3>
                            <p className="text-sm text-slate-400">
                                Explainable AI models that translate complex sensor fusion into actionable human reasoning.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Latency */}
                    <div className="p-8 rounded-sm border border-slate-800 bg-slate-950/50 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
                        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-500/50 rounded-tl" />
                        <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4 text-center">LATENCY</h4>
                        <div className="text-4xl font-black text-white text-center mb-2 group-hover:scale-110 transition-transform duration-500">
                            &lt; 100ms
                        </div>
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider text-center font-mono">SENSOR-TO-CLOUD</p>
                    </div>

                    {/* Reliability */}
                    <div className="p-8 rounded-sm border border-slate-800 bg-slate-950/50 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
                        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-500/50 rounded-tl" />
                        <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4 text-center">RELIABILITY</h4>
                        <div className="text-4xl font-black text-white text-center mb-2 group-hover:scale-110 transition-transform duration-500">
                            99.9%
                        </div>
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider text-center font-mono">INDUSTRIAL SLA</p>
                    </div>

                    {/* Security */}
                    <div className="p-8 rounded-sm border border-slate-800 bg-slate-950/50 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
                        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-500/50 rounded-tl" />
                        <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4 text-center">SECURITY</h4>
                        <div className="text-4xl font-black text-white text-center mb-2 group-hover:scale-110 transition-transform duration-500">
                            AES-256
                        </div>
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider text-center font-mono">END-TO-END ENCRYPTION</p>
                    </div>

                </div>

            </div>

            {/* Test Location Button (Floating or fixed somewhere, based on screenshot it's bottom right) */}
            <div className="fixed bottom-8 right-8 z-[60]">
                <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded font-bold transition-all shadow-lg hover:shadow-emerald-500/20 group">
                    <Activity size={18} className="animate-pulse" />
                    <span>Test Location</span>
                </button>
                <div className="text-[10px] text-emerald-500/50 font-mono text-center mt-1 tracking-wider uppercase">Click to test location</div>
            </div>

        </div>
    );
};

export default AboutProject;
// <label>
