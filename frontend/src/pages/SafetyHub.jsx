
import React, { useState, useMemo } from 'react';
import { ShieldAlert, Siren, Stethoscope, FireExtinguisher, Megaphone, Wind, Activity, ChevronDown, ChevronUp, MapPin, AlertTriangle, Send, Brain, Zap, ShieldCheck } from 'lucide-react';
import { useEsp32Stream } from '../hooks/useEsp32Stream';

// Move helper component outside and strictly type props
const ProtocolIcon = ({ id }) => {
    // Determine icon based on ID, default to Activity
    let Icon = Activity;
    let colorClass = "text-slate-400";

    if (id === 'fire') {
        Icon = FireExtinguisher;
        colorClass = "text-red-400";
    } else if (id === 'gas') {
        Icon = Wind;
        colorClass = "text-amber-400";
    } else if (id === 'medical') {
        Icon = Stethoscope;
        colorClass = "text-blue-400";
    }

    // Ensure className is always a string
    return <Icon size={24} className={colorClass} />;
};



const SafetyHub = () => {

    const { history: sensorData, connected } = useEsp32Stream('light');
    const [dbAlerts, setDbAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch historical alerts from database
    React.useEffect(() => {
        const fetchAlerts = async () => {
            try {
                // Get user email from localStorage (consistent with other parts of the app)
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                const email = user?.email || '';

                const response = await fetch(`/api/alerts?user_email=${email}&limit=20`);
                if (response.ok) {
                    const data = await response.json();
                    setDbAlerts(data);
                }
            } catch (err) {
                console.error("Failed to fetch historical alerts:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, []);

    // Derived State for Alerts (Merged Real-time + DB)
    const activeAlerts = useMemo(() => {
        const rtAlerts = [];
        const latestInfo = sensorData && sensorData.length > 0 ? sensorData[sensorData.length - 1] : null;

        if (latestInfo) {
            if (latestInfo.temperature > 40) rtAlerts.push({ type: 'FIRE', level: 'CRITICAL', message: 'High Temperature Detected! Potential Fire Hazard.', timestamp: new Date() });
            if (latestInfo.mq_raw > 2000) rtAlerts.push({ type: 'GAS', level: 'CRITICAL', message: 'Dangerous Gas Levels! Evacuate immediately.', timestamp: new Date() });
            if (latestInfo.motion === 1) rtAlerts.push({ type: 'INTRUSION', level: 'WARNING', message: 'Unrecognized motion in restricted area.', timestamp: new Date() });
        }

        // Map DB alerts to the format used in the UI
        const historicalFormatted = dbAlerts.map(a => ({
            type: a.metric.toUpperCase(),
            level: 'CRITICAL', // Assuming DB alerts are critical breaches
            message: a.message,
            timestamp: new Date(a.timestamp),
            isHistorical: true
        }));

        const merged = [...rtAlerts, ...historicalFormatted];

        // Demo Alert if empty (For visualization)
        if (merged.length === 0 && !connected) {
            merged.push({ type: 'SYSTEM', level: 'INFO', message: 'System in Monitor Mode. No active threats.', timestamp: new Date() });
        }

        // Sort by timestamp descending
        return merged.sort((a, b) => b.timestamp - a.timestamp);
    }, [sensorData, connected, dbAlerts]);

    const [expandedProtocol, setExpandedProtocol] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const protocols = [
        {
            id: 'fire',
            title: 'Fire Emergency',
            color: 'red',
            steps: [
                'Activate the nearest fire alarm immediately.',
                'Evacuate the building using the stairs. DO NOT use elevators.',
                'Assist those with disabilities if safe to do so.',
                'Assemble at the designated safe zone (Parking Lot B).',
                'Call Fire Department (101).'
            ]
        },
        {
            id: 'gas',
            title: 'Gas Leak / Chemical Spill',
            color: 'amber',
            steps: [
                'Evacuate the area immediately.',
                'Do not use light switches or electrical equipment (spark hazard).',
                'Do not use elevators.',
                'Move upwind from the leak source.',
                'Call Emergency Services.'
            ]
        },
        {
            id: 'medical',
            title: 'Medical Emergency',
            color: 'blue',
            steps: [
                'Assess the situation and ensure your own safety.',
                'Call Ambulance (102) immediately.',
                'Perform CPR if trained and necessary.',
                'Use AED if available.',
                'Stay with the victim until help arrives.'
            ]
        }
    ];

    // Helper to get Status Color Class - Explicit strings
    const getStatusClass = (hasCritical) => {
        return hasCritical
            ? "bg-red-500/20 border-red-500 text-red-100 animate-pulse"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    };

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 pb-24 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-emerald-500/20 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tighter flex items-center gap-3">
                        <ShieldAlert className="text-emerald-400" size={32} />
                        SAFETY HUB
                    </h1>
                    <p className="text-slate-400 font-mono mt-2">
                        EMERGENCY PROTOCOLS & REAL-TIME THREAT MONITORING
                    </p>
                </div>
                <div className="flex gap-4">

                    <button onClick={() => setIsReportModalOpen(true)} className="px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg font-bold text-sm tracking-widest hover:bg-red-500/20 flex items-center gap-2">
                        <AlertTriangle size={16} /> REPORT INCIDENT
                    </button>
                    <div className={`px-4 py-2 rounded-lg font-bold text-sm tracking-widest border ${getStatusClass(activeAlerts.some(a => a.level === 'CRITICAL'))}`}>
                        STATUS: {activeAlerts.some(a => a.level === 'CRITICAL') ? 'CRITICAL THREAT' : 'SECURE'}
                    </div>
                </div>
            </div>

            {/* Emergency Dialer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex items-center gap-4 hover:bg-red-500/20 transition-all cursor-pointer group">
                    <div className="bg-red-500/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                        <Siren size={32} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-red-100 font-black text-2xl">POLICE</h3>
                        <p className="text-red-400 font-mono text-lg">DIAL 100</p>
                    </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/30 p-6 rounded-2xl flex items-center gap-4 hover:bg-orange-500/20 transition-all cursor-pointer group">
                    <div className="bg-orange-500/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                        <FireExtinguisher size={32} className="text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-orange-100 font-black text-2xl">FIRE</h3>
                        <p className="text-orange-400 font-mono text-lg">DIAL 101</p>
                    </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-2xl flex items-center gap-4 hover:bg-blue-500/20 transition-all cursor-pointer group">
                    <div className="bg-blue-500/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                        <Stethoscope size={32} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-blue-100 font-black text-2xl">MEDICAL</h3>
                        <p className="text-blue-400 font-mono text-lg">DIAL 102</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Live Monitor */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
                        <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                            <Activity className="text-emerald-400" size={24} /> Live Threat Monitor
                        </h3>

                        <div className="space-y-3">
                            {activeAlerts.map((alert, index) => (
                                <div key={index} className={`p-4 rounded-xl border flex items-start gap-4 ${alert.isHistorical ? 'bg-slate-900/40 border-slate-800 opacity-80' : 'bg-slate-800/50 border-slate-700'}`}>
                                    <div className={`p-2 rounded-lg ${alert.isHistorical ? 'bg-slate-800 text-slate-500' : 'bg-slate-700 text-slate-300'}`}>
                                        <Megaphone size={20} className="text-current" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-black px-2 py-0.5 rounded ${alert.isHistorical ? 'bg-slate-800 text-slate-500' : 'bg-slate-700 text-slate-300'}`}>
                                                {alert.level} {alert.isHistorical && '(ARCHIVED)'}
                                            </span>
                                            <span className="text-slate-400 text-xs font-mono">{alert.timestamp.toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-slate-200 font-medium">{alert.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Safety Assistant Recommendations */}
                    <div className="glass-panel p-6 border-l-4 border-l-indigo-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Brain size={120} className="text-indigo-500" />
                        </div>

                        <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2 relative z-10">
                            <Brain className="text-indigo-400" size={24} /> AI Safety Assistant Recommendations
                        </h3>

                        <div className="space-y-3 relative z-10">
                            {activeAlerts.length > 0 ? (
                                activeAlerts.map((alert, idx) => (
                                    <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-indigo-500/30 flex gap-4 items-start">
                                        <div className="bg-indigo-500/20 p-2 rounded-lg shrink-0">
                                            <Zap size={20} className="text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-indigo-300 font-bold text-sm uppercase tracking-wider mb-1">
                                                {alert.type === 'FIRE' ? 'IMMEDIATE ACTION: COOLING' :
                                                    alert.type === 'GAS' ? 'IMMEDIATE ACTION: VENTILATION' : 'RECOMMENDATION'}
                                            </h4>
                                            <ul className="list-disc pl-4 text-slate-300 text-sm space-y-1">
                                                {alert.type === 'FIRE' && (
                                                    <>
                                                        <li>Activate sprinkler system in Sector 7 immediately.</li>
                                                        <li>Isolate electrical mains for mixing unit.</li>
                                                    </>
                                                )}
                                                {alert.type === 'GAS' && (
                                                    <>
                                                        <li>Open all automated vents.</li>
                                                        <li>Deploy neutralization agents if available.</li>
                                                    </>
                                                )}
                                                {alert.type === 'INTRUSION' && (
                                                    <li>Dispatch security drone to Sector 4.</li>
                                                )}
                                                {alert.type === 'SYSTEM' && (
                                                    <li>Maintain routine system diagnostics.</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex gap-4 items-center">
                                    <div className="bg-emerald-500/20 p-2 rounded-lg shrink-0">
                                        <ShieldCheck size={20} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-emerald-300 font-bold text-sm uppercase tracking-wider mb-0.5">SYSTEM OPTIMAL</h4>
                                        <p className="text-emerald-200/70 text-sm">No active threats. AI suggests maintaining current operational parameters.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                            <ShieldAlert className="text-cyan-400" size={24} /> Emergency Protocols
                        </h3>
                        {/* ... existing protocols code ... */}
                        <div className="space-y-4">
                            {protocols.map((protocol) => (
                                <div key={protocol.id} className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900/40">
                                    <button
                                        onClick={() => setExpandedProtocol(expandedProtocol === protocol.id ? null : protocol.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                                                <ProtocolIcon id={protocol.id} />
                                            </div>
                                            <span className="font-bold text-slate-200 text-lg">{protocol.title}</span>
                                        </div>
                                        {expandedProtocol === protocol.id ? <ChevronUp className="text-slate-500" size={20} /> : <ChevronDown className="text-slate-500" size={20} />}
                                    </button>

                                    {expandedProtocol === protocol.id && (
                                        <div className="p-4 pt-0 pl-20 animate-in slide-in-from-top-2">
                                            <ul className="list-disc space-y-2 text-slate-400 marker:text-emerald-500">
                                                {protocol.steps.map((step, idx) => (
                                                    <li key={idx} className="pl-2">{step}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Col: Safe Zones & Contacts */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 bg-slate-900/60 h-80 relative overflow-hidden flex flex-col items-center justify-center text-center">
                        <div className="relative z-10 p-4 bg-black/60 backdrop-blur-sm rounded-xl border border-emerald-500/30">
                            <MapPin className="text-emerald-400 w-12 h-12 mx-auto mb-2 animate-bounce" />
                            <h4 className="text-white font-bold text-lg">NEAREST SAFE ZONE</h4>
                            <p className="text-emerald-400 font-mono">PARKING LOT B</p>
                            <p className="text-slate-500 text-xs mt-2">150m from your location</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/30">
                        <h4 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-4">Building Admin Contacts</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-300">Security Desk</span>
                                <span className="text-emerald-400 font-mono">Ext. 4001</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-300">Facility Manager</span>
                                <span className="text-emerald-400 font-mono">Ext. 4005</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-300">IT Support</span>
                                <span className="text-emerald-400 font-mono">Ext. 4040</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Incident Reporting Modal */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl p-6 relative">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-red-500" size={24} /> REPORT INCIDENT
                        </h2>
                        <p className="text-slate-400 text-sm mb-6">Log a safety incident. This will alert building administration immediately.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Incident Type</label>
                                <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-300">
                                    <option>Fire Hazard</option>
                                    <option>Suspicious Activity</option>
                                    <option>Medical Emergency</option>
                                    <option>Maintenance Issue</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                <textarea className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-300 h-24" placeholder="Describe the situation..."></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                                <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-300" placeholder="e.g. 2nd Floor Corridor" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm">CANCEL</button>
                            <button onClick={() => { alert('Incident Reported'); setIsReportModalOpen(false); }} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-bold text-sm flex items-center gap-2">
                                <Send size={16} /> SUBMIT REPORT
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SafetyHub;
