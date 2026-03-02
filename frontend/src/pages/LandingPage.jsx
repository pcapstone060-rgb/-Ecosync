import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Leaf, Globe, Shield, Activity, Radio, Zap, Wind, Terminal, Lock, Sprout, Network } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const orb1Ref = useRef(null);
    const orb2Ref = useRef(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;

            if (orb1Ref.current) {
                orb1Ref.current.style.transform = `translate(${x * 1.5}px, ${y * 1.5}px)`;
            }
            if (orb2Ref.current) {
                orb2Ref.current.style.transform = `translate(${-x * 1.5}px, ${-y * 1.5}px)`;
            }
        };
        const handleScroll = () => {
            // Optimize scroll handler too if needed, but simple boolean toggle is okay
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className="min-h-screen w-full bg-[#022c22] font-outfit relative overflow-x-hidden text-white selection:bg-emerald-500/30">

            {/* --- GLOBAL FX - BIO GRID --- */}
            <div className="fixed inset-0 bg-[#022c22] overflow-hidden z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#064e3b_1px,transparent_1px),linear-gradient(to_bottom,#064e3b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>

                {/* Organic Glows */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[128px] animate-pulse-slow"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-lime-500/10 rounded-full blur-[128px] animate-pulse-slow delay-1000"></div>
            </div>

            {/* --- NAVBAR --- */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#022c22]/80 backdrop-blur-xl border-b border-emerald-500/10 py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                            <Leaf className="text-white" size={24} />
                        </div>
                        <div className="leading-tight">
                            <h2 className="font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">ECOSYNC</h2>
                            <p className="text-[10px] text-emerald-500/60 tracking-[0.3em] uppercase font-bold">BIO-DIGITAL MONITOR</p>
                        </div>
                    </div>

                    {/* Links Section */}
                    <div className="hidden md:flex items-center gap-6 text-xs font-bold tracking-widest text-emerald-100/60 uppercase">
                        <a href="/" className="hover:text-emerald-400 transition-colors">Home</a>
                        <a href="/contact" className="hover:text-emerald-400 transition-colors">Contact</a>
                        <a href="#about" className="hover:text-emerald-400 transition-colors">About</a>
                        <a href="https://github.com/projectc943-prog/Ecosync" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">Github</a>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            SYSTEM VITAL
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-20 px-6">

                {/* Parallax Elements */}
                <div
                    ref={orb1Ref}
                    className="absolute top-1/4 left-10 md:left-1/4 w-32 h-32 border border-emerald-500/20 rounded-full pointer-events-none transition-transform duration-100 ease-out"
                />
                <div
                    ref={orb2Ref}
                    className="absolute bottom-1/4 right-10 md:right-1/4 w-48 h-48 border border-lime-500/20 rounded-full pointer-events-none transition-transform duration-100 ease-out"
                />

                <div className="relative z-10 text-center max-w-5xl mx-auto">

                    {/* Main Title Group */}
                    <div className="mb-12 animate-in fade-in zoom-in duration-1000">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-6">
                            <Sprout size={12} />
                            <span>v4.2.0 BIOSPHERE // STABLE</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-6">
                            <span className="block bg-clip-text text-transparent bg-gradient-to-b from-white to-emerald-200">
                                CLOUD-BASED IOT
                            </span>
                            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-lime-400 to-teal-400 animate-gradient-x bg-[length:200%_auto]">
                                ENVIRONMENTAL
                            </span>
                            <span className="block text-4xl md:text-6xl text-emerald-500/40 mt-2 font-light tracking-wide">
                                MONITORING
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-300 mt-8 font-light max-w-2xl mx-auto leading-relaxed">
                            Next-gen platform merging <span className="text-emerald-400 font-medium">IoT sensors</span> with <span className="text-lime-400 font-medium">generative AI</span> for real-time environmental alerts.
                        </p>
                    </div>

                    {/* Action Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-300">

                        {/* Access Terminal */}
                        <div
                            onClick={() => navigate('/login')}
                            className="group relative cursor-pointer overflow-hidden rounded-[2rem] bg-[#022c22]/50 border border-white/5 p-1 hover:border-emerald-500/50 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="relative h-full bg-[#022c22]/80 backdrop-blur-xl rounded-[1.8rem] p-8 flex flex-col items-start text-left overflow-hidden">
                                <div className="w-12 h-12 bg-emerald-950/50 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-500">
                                    <Activity className="text-emerald-400 w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors tracking-tight">Access Dashboard</h3>
                                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                    Visualize live telemetry, air quality indexes, and predictive models.
                                </p>
                                <div className="mt-auto flex items-center gap-3 text-emerald-400 font-bold tracking-widest text-xs uppercase group-hover:text-emerald-300">
                                    Access System <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* New Area Request */}
                        <div
                            onClick={() => navigate('/login?mode=signup')}
                            className="group relative cursor-pointer overflow-hidden rounded-[2rem] bg-[#022c22]/50 border border-white/5 p-1 hover:border-lime-500/50 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(132,204,22,0.5)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="relative h-full bg-[#022c22]/80 backdrop-blur-xl rounded-[1.8rem] p-8 flex flex-col items-start text-left overflow-hidden">
                                <div className="w-12 h-12 bg-lime-950/30 border border-lime-500/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-lime-500/20 transition-all duration-500">
                                    <Network className="text-lime-400 w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-lime-400 transition-colors tracking-tight">Register New Area</h3>
                                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                    Register new hardware endpoints to the global mesh network for localized monitoring.
                                </p>
                                <div className="mt-auto flex items-center gap-3 text-lime-400 font-bold tracking-widest text-xs uppercase group-hover:text-lime-300">
                                    Register <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </header>

            {/* --- INDUSTRIAL USE CASE (FIRECRACKER) --- */}
            <div id="about" className="py-20 bg-[#022c22] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/30 border border-orange-500/20 text-xs font-bold tracking-widest text-orange-400 uppercase mb-4">
                            <Shield size={12} />
                            <span>Industry Focus</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                            BUILT FOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">FIRECRACKER</span> INDUSTRIES
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                            Engineered to mitigate the unique high-risk factors of explosive manufacturing.
                            Replacing expensive PLCs with affordable, intelligent, and scalable IoT nodes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1: Toxic Gas & Fire Safety */}
                        <div className="bg-[#031f18]/80 backdrop-blur-sm border border-emerald-500/10 rounded-2xl p-8 hover:border-orange-500/30 transition-all group">
                            <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 text-orange-400 group-hover:scale-110 transition-transform">
                                <Wind size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Gas & Fire Prevention</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                continuous monitoring of smoke, LPG, and combustible gases combined with critical temperature alerts to prevent accidental ignition.
                            </p>
                            <ul className="text-xs text-slate-500 space-y-2 font-mono">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>SMOKE/GAS SENSOR (MQ-135)</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>HIGH TEMP ALERTS</li>
                            </ul>
                        </div>

                        {/* Card 2: Environmental Storage */}
                        <div className="bg-[#031f18]/80 backdrop-blur-sm border border-emerald-500/10 rounded-2xl p-8 hover:border-blue-500/30 transition-all group">
                            <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                                <Activity size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Storage Safety Control</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Maintain optimal humidity to prevent static electricity build-up and detect rain exposure to protect raw material integrity.
                            </p>
                            <ul className="text-xs text-slate-500 space-y-2 font-mono">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>HUMIDITY MONITORING</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>RAIN DETECTION</li>
                            </ul>
                        </div>

                        {/* Card 3: Security & Compliance */}
                        <div className="bg-[#031f18]/80 backdrop-blur-sm border border-emerald-500/10 rounded-2xl p-8 hover:border-emerald-500/30 transition-all group">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                                <Terminal size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Security & Logs</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Automated motion detection for restricted zones and secure digital logging of all sensor data for safety audits and compliance.
                            </p>
                            <ul className="text-xs text-slate-500 space-y-2 font-mono">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>MOTION SURVEILLANCE</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>DIGITAL SAFETY LOGS</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FEATURES STRIP --- */}
            <div className="border-y border-white/5 bg-[#022c22]/50 backdrop-blur-sm py-16 text-emerald-100">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { icon: Wind, label: "Air Quality Analysis", color: "text-emerald-400" },
                        { icon: Activity, label: "Sensor Fusion", color: "text-lime-400" },
                        { icon: Shield, label: "Eco-Encryption", color: "text-teal-400" },
                        { icon: Zap, label: "Predictive Models", color: "text-white" },
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 group">
                            <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-300 ${item.color}`}>
                                <item.icon size={24} />
                            </div>
                            <span className="text-xs font-bold text-emerald-200/60 uppercase tracking-widest group-hover:text-emerald-100 transition-colors">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- FOOTER --- */}
            <footer className="py-8 text-center text-emerald-900/50 text-xs tracking-widest uppercase border-t border-white/5 font-mono">
                <p>CLOUD-BASED IOT ENVIRONMENTAL MONITORING // SECURE INFRASTRUCTURE // 2026</p>
            </footer>

        </div>
    );
};

export default LandingPage;
// <title> <meta name="description" /> <meta property="og:title" />
// <label>
