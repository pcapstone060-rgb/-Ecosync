import React from 'react';
import { ShieldAlert, MapPin, ExternalLink, Calendar, ChevronRight, Wind, Thermometer, CloudLightning, Sun, AlertTriangle, Radio, Sprout } from 'lucide-react';

const SafetyAlerts = () => {
    const alertsData = [
        {
            id: 1,
            location: "North Delhi Urban Zone",
            hazard: "Severe Heat & Smog",
            level: "CRITICAL",
            color: "rose",
            recommendation: "Stay indoors, set AC to recirculate mode, hydrate frequently.",
            time: "Active: 06:00 AM - 08:00 PM"
        },
        {
            id: 2,
            location: "Bengaluru East Tech Corridor",
            hazard: "UV Exposure Peak",
            level: "HIGH",
            color: "orange",
            recommendation: "Avoid outdoors between 12-3 PM. Use SPF 50+ protection.",
            time: "Scheduled: 11:30 AM - 03:30 PM"
        },
        {
            id: 3,
            location: "Greater Noida Industrial Area",
            hazard: "Chemical Particulate Surge",
            level: "EXTREME",
            color: "lime", // Bio-Hazard Green/Lime
            recommendation: "N95/N99 respiratory protection required if venturing outside.",
            time: "Continuous Monitor Active"
        },
        {
            id: 4,
            location: "Chennai Coastal Zone",
            hazard: "High Humidity & Ozone",
            level: "MODERATE",
            color: "teal",
            recommendation: "Limit strenuous activities. Risk of heat exhaustion.",
            time: "Ongoing: Seasonal Trend"
        }
    ];

    return (
        <main className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-emerald-400/20">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">Bio-Safety Protocols</h2>
                        <p className="text-slate-400 font-medium font-mono">Environmental risk monitoring and action plans</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Real-time Health Monitor */}
                <section className="lg:col-span-2 space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 px-2 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]"></div>
                        Live Incident Feed
                    </h3>

                    <div className="grid grid-cols-1 gap-6">
                        {alertsData.map((alert) => (
                            <div key={alert.id} className="group overflow-hidden flex flex-col md:flex-row rounded-[2rem] border border-white/5 bg-slate-900/50 hover:bg-slate-900/80 transition-all hover:border-emerald-500/20 relative">
                                {/* Glow Effect */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${alert.color}-500 shadow-[0_0_20px_theme('colors.${alert.color}.500')]`}></div>

                                <div className="p-8 flex-1 relative z-10">
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`px-4 py-1.5 bg-${alert.color}-500/10 rounded-full text-${alert.color}-400 text-[10px] font-black uppercase tracking-widest border border-${alert.color}-500/20 shadow-[0_0_10px_rgba(0,0,0,0.2)]`}>
                                                {alert.level} RISK
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 font-mono">
                                                <Calendar size={12} /> {alert.time}
                                            </span>
                                        </div>
                                        <button className="text-slate-500 hover:text-emerald-400 transition-colors">
                                            <ExternalLink size={18} />
                                        </button>
                                    </div>

                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="p-3 bg-white/5 rounded-2xl text-slate-400 border border-white/5">
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold text-white tracking-tight">{alert.location}</h4>
                                            <p className={`text-${alert.color}-400 font-bold uppercase text-xs tracking-widest mt-1 font-mono`}>{alert.hazard}</p>
                                        </div>
                                    </div>

                                    <p className="text-slate-400 bg-black/20 p-6 rounded-2xl text-sm font-medium leading-relaxed border border-white/5">
                                        <strong className="text-slate-200 block mb-2 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                                            <AlertTriangle size={12} className={`text-${alert.color}-500`} />
                                            Recommended Action:
                                        </strong>
                                        {alert.recommendation}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Safety Sidebar */}
                <aside className="space-y-8">
                    <div className="glass-panel p-8 rounded-[2.5rem] bg-gradient-to-b from-slate-900/80 to-slate-950 border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>

                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8 px-1">Safety Conditions</h4>
                        <div className="space-y-6 relative z-10">
                            {[
                                { label: "Air Quality", icon: <Wind size={20} />, level: "Dangerous", color: "text-rose-400" },
                                { label: "Solar Radiation", icon: <Sun size={20} />, level: "Extreme", color: "text-orange-400" },
                                { label: "Surface Temp", icon: <Thermometer size={20} />, level: "High", color: "text-amber-400" },
                                { label: "Bio-Diversity Risk", icon: <Sprout size={20} />, level: "Stable", color: "text-emerald-400" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-4 -m-4 rounded-3xl transition-all border border-transparent hover:border-emerald-500/10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-2xl text-slate-400 group-hover:text-emerald-400 transition-colors">
                                            {item.icon}
                                        </div>
                                        <span className="font-bold text-sm tracking-tight text-slate-300">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.color} drop-shadow-sm`}>{item.level}</span>
                                        <ChevronRight size={14} className="text-white/20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[2.5rem] bg-black/40 border border-white/10 shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Bio-Impact Matrix</h4>
                            <div className="flex gap-1">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
                                <div className="w-1 h-3 bg-emerald-500/30 rounded-full"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-8">
                            {Array.from({ length: 16 }).map((_, i) => (
                                <div key={i} className={`h-8 rounded-md transition-all duration-700 border border-transparent ${i % 5 === 0 ? 'bg-rose-500/20 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]' :
                                    i % 3 === 0 ? 'bg-orange-500/20 border-orange-500/30' : 'bg-emerald-900/20'
                                    }`}></div>
                            ))}
                        </div>
                        <div className="space-y-4 border-t border-white/5 pt-4">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                <span>RESPIRATORY STRESS</span>
                                <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">CRITICAL</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                <span>UV RADIANCE</span>
                                <span className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">ELEVATED</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-teal-600 to-emerald-600 p-10 rounded-[2.5rem] text-white flex flex-col items-center text-center shadow-[0_20px_50px_-15px_rgba(16,185,129,0.4)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-overlay"></div>

                        <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30 relative z-10 group-hover:scale-110 transition-transform duration-500">
                            <ShieldAlert size={40} className="drop-shadow-md" />
                        </div>
                        <h4 className="text-2xl font-black mb-4 relative z-10 font-mono tracking-tighter">BIO-SAFETY ENGINE</h4>
                        <p className="text-emerald-100/80 text-sm font-medium leading-relaxed mb-8 relative z-10">
                            Your personalized safety radius is set to <span className="text-white font-bold">15km</span>. Predictive alerts active.
                        </p>
                        <button className="w-full bg-white text-emerald-700 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.03] active:scale-[0.98] transition-all shadow-xl relative z-10 flex items-center justify-center gap-2">
                            <Radio size={14} className="animate-pulse" /> Configure Radar
                        </button>
                    </div>
                </aside>
            </div>
        </main>
    );
};

export default SafetyAlerts;
// <title> <meta name="description" /> <meta property="og:title" />
