import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    Thermometer,
    Droplets,
    Wind,
    CloudRain,
    Bot,
    ShieldCheck,
    History,
    Monitor,
    ChevronLeft,
    Shield
} from 'lucide-react';
import { useEsp32Stream } from '../hooks/useEsp32Stream';

const MetricCard = ({ title, value, unit, limit, status, icon: Icon, color }) => {
    const isCritical = status === 'CRITICAL';
    return (
        <div className={`flex-1 min-w-[130px] p-5 rounded-2xl border-2 transition-all ${isCritical ? 'bg-red-50 border-red-100 shadow-sm' : 'bg-white border-emerald-50 shadow-sm'}`}>
            <div className="flex flex-col items-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">{title}</p>
                <h3 className={`text-2xl font-black font-mono leading-none ${isCritical ? 'text-red-600' : 'text-emerald-500'}`}>
                    {value}<span className="text-sm ml-0.5">{unit}</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1">Limit: {limit}{unit}</p>
                <div className={`mt-4 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm ${isCritical ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'}`}>
                    {status}
                </div>
            </div>
        </div>
    );
};

const AlertPage = () => {
    const navigate = useNavigate();
    const { latestData, connectionStatus } = useEsp32Stream();

    const temp = latestData.temperature?.toFixed(1) || '---';
    const hum = latestData.humidity?.toFixed(1) || '---';
    const gas = latestData.gas?.toFixed(1) || '---';
    const rainRaw = latestData.rain;
    const rainStatus = rainRaw != null ? (rainRaw < 1000 ? 'RAINING' : rainRaw < 2000 ? 'DAMP' : 'DRY') : '---';

    const isTempCritical = latestData.temperature > 30; // Example threshold
    const isGasCritical = latestData.gas > 500;
    const isRaining = rainStatus === 'RAINING';

    const currentTime = new Date().toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).toLowerCase();

    // Get YYYY-MM-DD HH:mm:ss format for timestamp
    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19);

    return (
        <div className="min-h-screen bg-[#f8ede8] text-slate-800 font-outfit p-4 md:p-8 flex flex-col items-center justify-center">

            <div className="w-full max-w-2xl mb-4">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Back to Dashboard</span>
                </button>
            </div>

            <div className="w-full max-w-2xl bg-[#1e2532] rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 animate-in fade-in slide-in-from-bottom-5 duration-700">

                {/* Header Branding */}
                <div className="bg-[#b91c1c] px-6 py-8 text-center shadow-md relative flex flex-col items-center">
                    {/* Top Center Shield */}
                    <div className="mb-4 bg-[#b91c1c] pt-2">
                        <Shield className="text-white fill-sky-200/40 w-12 h-12" strokeWidth={1.5} />
                    </div>

                    {/* Main Title */}
                    <div className="flex items-center gap-3 mb-3">
                        <Shield className="text-white fill-slate-300/40 w-8 h-8" strokeWidth={1.5} />
                        <h1 className="text-3xl font-black text-white tracking-wide">
                            EcoSync Critical Alert
                        </h1>
                    </div>

                    {/* Subtitle / Timestamp */}
                    <p className="text-sm font-semibold text-white/90 tracking-wide flex items-center justify-center gap-2">
                        📡 EcoSync Node • 🕒 {timestampStr} UTC
                    </p>
                </div>

                <div className="p-6 md:p-8 space-y-6">

                    {/* Warning Box */}
                    <div className="bg-[#2d2226] rounded-xl border border-amber-500/30 p-4 flex items-start sm:items-center justify-center gap-3 shadow-inner">
                        <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                        <p className="text-[13px] md:text-sm text-amber-500 font-medium leading-relaxed">
                            Environmental threshold breach detected. Immediate review required.
                        </p>
                    </div>

                    {/* Metrics Grid bg is dark, cards are light */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <MetricCard title="TEMPERATURE" value={temp} unit="°C" limit="45.0" status={isTempCritical ? 'CRITICAL' : 'SAFE'} icon={Thermometer} color="emerald" />
                        <MetricCard title="HUMIDITY" value={hum} unit="%" limit="80.0" status={latestData.humidity > 80 ? 'CRITICAL' : 'SAFE'} icon={Droplets} color="emerald" />
                        <MetricCard title="GAS LEVEL" value={gas} unit="ppm" limit="600.0" status={isGasCritical ? 'CRITICAL' : 'SAFE'} icon={Wind} color="red" />
                        <MetricCard title="RAIN SENSOR" value={rainStatus} unit="" limit="DRY" status={isRaining ? 'ALERT' : 'SAFE'} icon={CloudRain} color="emerald" />
                    </div>

                    {/* AI Risk Analysis */}
                    <div className="bg-[#213045] rounded-2xl border border-slate-700/50 p-6 space-y-3">
                        <h3 className="flex items-center gap-2 text-[11px] font-black text-blue-400 uppercase tracking-[0.2em]">
                            <Bot size={18} className="text-slate-400" /> AI RISK ANALYSIS
                        </h3>
                        <p className="text-[13px] md:text-sm text-slate-300 leading-relaxed font-medium">
                            <span className="font-black text-red-500 uppercase tracking-tighter mr-2 italic">🔴 Critical Safety Risk:</span>
                            Immediate Action Required. | ⚠️ Anomaly Detected: Air Quality Breach ({'>'} 600.0 ppm) behavior is unusual.
                        </p>
                    </div>

                    {/* Recommended Precautions */}
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-emerald-900/40">
                        <div className="bg-[#059669] p-4 flex items-center gap-2">
                            <ShieldCheck size={18} className="text-white" />
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Recommended Precautions</h3>
                        </div>
                        <div className="bg-[#ecfdf5] p-5 md:p-6">
                            <div className="flex items-start gap-4">
                                <span className="text-xl shrink-0 mt-0.5">💨</span>
                                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                    Elevated Gas ({gas} ppm): <span className="text-emerald-700 font-bold">Evacuate the area immediately</span>, open windows, avoid ignition sources.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* AI Historical Context */}
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-blue-900/40">
                        <div className="bg-[#38bdf8] p-4 flex items-center gap-2">
                            <History size={18} className="text-white" />
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">AI Historical Context</h3>
                        </div>
                        <div className="bg-white overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-sky-50 text-[10px] text-slate-500 uppercase tracking-[0.2em]">
                                        <th className="px-6 py-4 font-black">Period</th>
                                        <th className="px-4 py-4 text-center font-black">Temp</th>
                                        <th className="px-4 py-4 text-center font-black">Humidity</th>
                                        <th className="px-4 py-4 text-center font-black">Gas</th>
                                        <th className="px-6 py-4 text-center font-black">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[12px] text-slate-600">
                                    <tr className="border-t border-slate-100 italic opacity-60">
                                        <td className="px-6 py-3 whitespace-nowrap">📅 No data recorded last wednesday at {currentTime}.</td>
                                        <td colSpan="4"></td>
                                    </tr>
                                    <tr className="border-t border-slate-100 italic opacity-60">
                                        <td className="px-6 py-3">🕒 No data recorded yesterday at {currentTime}.</td>
                                        <td colSpan="4"></td>
                                    </tr>
                                    <tr className="border-t border-slate-100 bg-indigo-50/50">
                                        <td className="px-6 py-4 font-black text-indigo-700 whitespace-nowrap flex items-center gap-2">
                                            📉 7-Day Average
                                        </td>
                                        <td className="px-4 py-4 text-center font-bold">29.3°C</td>
                                        <td className="px-4 py-4 text-center font-bold">55.0%</td>
                                        <td className="px-4 py-4 text-center font-bold">955.5 ppm</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-indigo-100/80 text-indigo-700 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-200">Baseline</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* View Live Dashboard Button */}
                    <div className="pt-2">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-4 rounded-full transition-all flex items-center justify-center gap-3 shadow-lg"
                        >
                            <Monitor size={20} />
                            <span className="text-sm md:text-[15px]">View Live Dashboard</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AlertPage;
