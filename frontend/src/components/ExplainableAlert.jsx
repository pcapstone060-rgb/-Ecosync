import React, { useEffect, useState, useCallback } from 'react';
import { Brain, Thermometer, Activity, AlertTriangle, CloudRain, ShieldCheck, Wind, Droplets, Clock, TrendingUp, TrendingDown, Minus, History } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Trend arrow helper
const Trend = ({ current, historical, unit = '' }) => {
    if (current == null || historical == null) return <span className="text-slate-500">—</span>;
    const diff = current - historical;
    const absDiff = Math.abs(diff).toFixed(1);
    if (Math.abs(diff) < 0.5) return <span className="text-slate-400 flex items-center gap-1"><Minus size={12} /> Stable</span>;
    if (diff > 0) return <span className="text-red-400 flex items-center gap-1"><TrendingUp size={12} /> +{absDiff}{unit} vs last week</span>;
    return <span className="text-emerald-400 flex items-center gap-1"><TrendingDown size={12} /> -{absDiff}{unit} vs last week</span>;
};

const ExplainableAlert = ({ currentData, baselineData, alertReason, userEmail }) => {
    const [histCtx, setHistCtx] = useState(null);
    const [histLoading, setHistLoading] = useState(false);

    // Fetch historical context
    const fetchHistory = useCallback(async () => {
        setHistLoading(true);
        try {
            const url = userEmail
                ? `${API_BASE}/api/historical-context?user_email=${encodeURIComponent(userEmail)}`
                : `${API_BASE}/api/historical-context`;
            const res = await fetch(url);
            if (res.ok) setHistCtx(await res.json());
        } catch (e) {
            console.warn('Historical context fetch failed:', e);
        } finally {
            setHistLoading(false);
        }
    }, [userEmail]);

    useEffect(() => {
        if (currentData) fetchHistory();
    }, [currentData, fetchHistory]);

    if (!currentData) return null;

    const temp = currentData?.temperature;
    const gas = currentData?.gas;
    const hum = currentData?.humidity;
    const rainRaw = currentData?.rain;

    const tempBaseline = baselineData?.temperature || 24;
    const gasBaseline = baselineData?.gas || 40;
    const humBaseline = baselineData?.humidity || 50;

    const tempDev = temp != null ? (temp - tempBaseline) : 0;
    const gasDev = gas != null ? (gas - gasBaseline) : 0;
    const humDev = hum != null ? (hum - humBaseline) : 0;

    const rainStatus = rainRaw != null
        ? (rainRaw < 1000 ? 'RAINING' : rainRaw < 2000 ? 'DAMP' : 'DRY')
        : null;
    const isRaining = rainStatus === 'RAINING';
    const isDamp = rainStatus === 'DAMP';

    const isTempAlert = tempDev > 5;
    const isGasAlert = gasDev > 50;
    const isHumAlert = Math.abs(humDev) > 20;
    const isRainAlert = isRaining;
    const isAlert = isTempAlert || isGasAlert || isHumAlert || isRainAlert || (alertReason && alertReason !== "Normal");

    const getMainCause = () => {
        const reason = alertReason || "";
        if (isTempAlert && isGasAlert) return "Compound Risk: Thermal + Chemical Spike";
        if (isTempAlert) return "Thermal Anomaly Detected";
        if (isGasAlert) return "Chemical Vapor Leakage";
        if (isHumAlert) return "Humidity Out of Safe Range";
        if (isRainAlert) return "Active Precipitation Detected";
        if (reason.includes("Pattern Anomaly") || (alertReason && alertReason !== "Normal")) return "Anomaly Pattern Match";
        return "System Stable";
    };

    // Dynamic precautions with historical context
    const precautions = [];
    const lw = histCtx?.last_week;

    if (isTempAlert) {
        const lwNote = lw?.temperature != null
            ? ` Last week at this time it was ${lw.temperature}°C — ${temp > lw.temperature ? 'warmer than usual' : 'cooler than usual'}.`
            : '';
        precautions.push({ icon: '🌡️', label: 'High Temperature', action: `Increase ventilation, avoid direct sun exposure, check cooling systems.${lwNote}` });
    }
    if (isGasAlert) {
        const lwNote = lw?.gas != null
            ? ` Last week gas was ${lw.gas} ppm — ${gas > lw.gas ? 'significantly elevated today' : 'similar levels'}.`
            : '';
        precautions.push({ icon: '💨', label: 'Elevated Gas Level', action: `Evacuate area, open windows, avoid ignition sources immediately.${lwNote}` });
    }
    if (hum > 80) {
        precautions.push({ icon: '💧', label: 'High Humidity', action: 'Run dehumidifiers, check for water leaks, prevent mold growth.' });
    } else if (hum < 20) {
        precautions.push({ icon: '🏜️', label: 'Low Humidity', action: 'Use humidifier, stay hydrated, protect sensitive electronics.' });
    }
    if (isRaining) {
        precautions.push({ icon: '🌧️', label: 'Rain Detected', action: 'Secure outdoor equipment, check drainage, avoid electrical hazards near water.' });
    } else if (isDamp) {
        precautions.push({ icon: '🌦️', label: 'Damp Conditions', action: 'Monitor for moisture buildup, ensure proper sealing of equipment.' });
    }

    // Parse narrative into segments
    const narrativeSegments = histCtx?.narrative
        ? histCtx.narrative.split(' | ').filter(Boolean)
        : [];

    return (
        <div className="bg-transparent space-y-6">
            {/* Cause + Severity Bar (The specific piece from the image) */}
            <div className={`bg-[#0f172a]/80 backdrop-blur-xl rounded-xl px-6 py-4 border flex flex-row justify-between items-center shadow-2xl relative z-10 transition-all duration-500 ${isAlert ? 'border-red-500/30' : 'border-indigo-500/20'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isAlert ? 'bg-red-500/10' : 'bg-indigo-500/10'}`}>
                        <AlertTriangle size={20} className={isAlert ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]'} />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block leading-none mb-1">ESTIMATED CAUSE</span>
                        <span className="text-white font-bold text-lg tracking-tight leading-none uppercase">{getMainCause()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="w-[1px] h-10 bg-slate-800"></div>
                    <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block leading-none mb-1">SEVERITY</span>
                        <span className={`font-black text-xl leading-none tracking-tighter ${isAlert ? 'text-red-500' : 'text-emerald-500'}`}>
                            {isAlert ? 'HIGH' : 'LOW'}
                        </span>
                    </div>
                </div>
            </div>

            {/* AI Context & Precautions Container */}
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Brain size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm tracking-wide">Explainable AI Insights</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Real-time + Historical Analysis</p>
                        </div>
                    </div>
                    {isAlert && <span className="text-[9px] font-black bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-1 rounded tracking-tighter animate-pulse">ACTION REQUIRED</span>}
                </div>

                {/* Sensor Grid Internal */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Temp', val: temp, dev: tempDev, icon: Thermometer, unit: '°C', alert: isTempAlert, hist: lw?.temperature },
                        { label: 'Gas', val: gas, dev: gasDev, icon: Wind, unit: 'ppm', alert: isGasAlert, hist: lw?.gas },
                        { label: 'Humidity', val: hum, dev: humDev, icon: Droplets, unit: '%', alert: isHumAlert, hist: lw?.humidity },
                        { label: 'Rain', val: rainStatus, ADC: rainRaw, icon: CloudRain, unit: '', alert: isRaining, isStatus: true }
                    ].map((s, i) => (
                        <div key={i} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 group hover:border-indigo-500/30 transition-all">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{s.label}</span>
                                <s.icon size={12} className={s.alert ? 'text-red-400' : 'text-slate-500'} />
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-mono font-black text-white">{s.isStatus ? (s.val || '---') : (s.val?.toFixed(1) || '---')}</span>
                                {!s.isStatus && <span className="text-[10px] text-slate-600 font-bold">{s.unit}</span>}
                            </div>
                            {!s.isStatus && (
                                <div className="mt-1">
                                    <span className={`text-[9px] font-bold ${s.alert ? 'text-red-400' : 'text-emerald-500'}`}>
                                        {s.dev > 0 ? '+' : ''}{s.dev.toFixed(1)}{s.unit} from norm
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Narrative & History */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <History size={14} className="text-indigo-400" />
                        <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-black">AI Observational Narrative</span>
                    </div>

                    {narrativeSegments.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                            {narrativeSegments.map((seg, i) => (
                                <div key={i} className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-4 py-3">
                                    <p className="text-slate-300 text-[11px] leading-relaxed italic">"{seg}"</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-950/20 rounded-xl px-4 py-3 border border-slate-800/50">
                            <p className="text-slate-600 text-[10px]">Learning environmental patterns... Historical narrative will appear after more data collection.</p>
                        </div>
                    )}
                </div>

                {/* Precautions */}
                {precautions.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-slate-800/50">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">AI Recommendations</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {precautions.map((p, i) => (
                                <div key={i} className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-3 flex items-start gap-4 hover:bg-emerald-500/10 transition-colors">
                                    <span className="text-xl">{p.icon}</span>
                                    <div>
                                        <span className="text-emerald-400 font-black text-[10px] uppercase tracking-wider block mb-1">{p.label}</span>
                                        <p className="text-slate-300 text-xs leading-relaxed">{p.action}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Background Glows */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/5 blur-[100px] rounded-full" />
            </div>
        </div>
    );
};

export default ExplainableAlert;
