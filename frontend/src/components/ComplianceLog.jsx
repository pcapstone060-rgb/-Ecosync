import React, { useState, useMemo } from 'react';
import { ClipboardCheck, CheckCircle2, AlertCircle, Clock, CalendarDays } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config';

const ComplianceLog = () => {
    const { currentUser } = useAuth();
    // Real daily tasks from API
    const [tasks, setTasks] = useState([]);
    const [viewMode, setViewMode] = useState('today'); // 'today' or 'history'
    const [historyLogs, setHistoryLogs] = useState({});
    const [error, setError] = useState(null);

    // Fetch logs on mount and when viewMode changes
    React.useEffect(() => {
        if (viewMode === 'today') {
            fetchLogs();
        } else {
            fetchHistory();
        }
    }, [viewMode]);

    const TASK_SCHEDULE = {
        "Morning Grounding Check": "08:00 AM",
        "Mixing Room Humidity Audit": "10:00 AM",
        "Chemical Waste Disposal": "02:00 PM",
        "Fire Extinguisher Pressure": "04:00 PM",
        "End-of-Shift Inventory Lock": "06:00 PM"
    };

    const fetchLogs = async () => {
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/compliance/logs`);
            if (!res.ok) throw new Error(`API Error: ${res.status}`);

            const data = await res.json();
            if (Array.isArray(data)) {
                const mapped = data.map(log => ({
                    id: log.id,
                    task: log.task_name,
                    status: log.status,
                    verifiedBy: log.verified_by || "-",
                    // Use verified time if available, else scheduled time
                    time: log.verified_at ? new Date(log.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (TASK_SCHEDULE[log.task_name] || "09:00 AM"),
                    date: log.date
                }));
                setTasks(mapped);
            } else {
                setTasks([]);
            }
        } catch (e) {
            console.error("Failed to fetch compliance logs", e);
            setError(e.message);
        }
    };

    const fetchHistory = async () => {
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/compliance/logs?history=true`);
            if (!res.ok) throw new Error(`API Error: ${res.status}`);

            const data = await res.json();
            if (Array.isArray(data)) {
                // Group by date, excluding today
                const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

                const grouped = data.reduce((acc, log) => {
                    if (log.date === todayStr) return acc; // Skip today

                    const date = log.date;
                    if (!acc[date]) acc[date] = [];
                    acc[date].push({
                        id: log.id,
                        task: log.task_name,
                        status: log.status,
                        verifiedBy: log.verified_by || "-",
                        time: log.verified_at ? new Date(log.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (TASK_SCHEDULE[log.task_name] || "09:00 AM")
                    });
                    return acc;
                }, {});
                setHistoryLogs(grouped);
            }
        } catch (e) {
            console.error("Failed to fetch history logs", e);
            setError(e.message);
        }
    };

    const compliancePercentage = useMemo(() => {
        if (!tasks.length) return 0;
        const completed = tasks.filter(t => t.status === "COMPLETED").length;
        return Math.round((completed / tasks.length) * 100);
    }, [tasks]);

    const toggleStatus = async (id) => {
        console.log(`Toggling status for task ${id}...`);
        try {
            const verifier = currentUser?.email || "supervisor@ecosync.com";
            console.log("Verifier:", verifier);

            const res = await fetch(`${API_BASE_URL}/api/compliance/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: id,
                    verifier_name: verifier
                })
            });

            if (res.ok) {
                console.log("Successfully verified task");
                const data = await res.json();
                console.log("Response:", data);
                fetchLogs(); // Refresh today's logs
            } else {
                const text = await res.text();
                console.error("Verification API failed", text);
                setError(`Toggle failed: ${text}`);
            }
        } catch (e) {
            console.error("Verification request failed", e);
            setError(`Network error: ${e.message}`);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-900/20 scrollbar-track-transparent">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ClipboardCheck className="text-emerald-400" size={24} />
                        Safety Logs
                    </h3>
                    <div className="flex gap-4 mt-2 text-xs font-mono text-slate-500">
                        <button
                            onClick={() => setViewMode('today')}
                            className={`pb-1 border-b-2 transition-colors ${viewMode === 'today' ? 'text-emerald-400 border-emerald-400 font-bold' : 'border-transparent hover:text-slate-300'}`}
                        >
                            TODAY
                        </button>
                        <button
                            onClick={() => setViewMode('history')}
                            className={`pb-1 border-b-2 transition-colors ${viewMode === 'history' ? 'text-emerald-400 border-emerald-400 font-bold' : 'border-transparent hover:text-slate-300'}`}
                        >
                            HISTORY
                        </button>
                    </div>
                    {viewMode === 'today' && (
                        <p className="text-xs text-slate-500 font-mono mt-3 animate-in fade-in uppercase tracking-wider">
                            DATE: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    )}
                </div>
                {viewMode === 'today' && (
                    <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 flex items-center gap-2">
                        <CalendarDays size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-300">SCORE: {compliancePercentage}%</span>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 mb-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs">
                    ⚠️ Failed to load logs: {error}. Is backend running?
                </div>
            )}

            {/* List Content */}
            <div className="space-y-3">
                {viewMode === 'today' ? (
                    // TODAY'S TASKS
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => toggleStatus(task.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${task.status === "COMPLETED"
                                ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-slate-900/40 border-slate-800 hover:border-slate-600"
                                }`}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.status === "COMPLETED" ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                            <div className="flex justify-between items-center pl-2">
                                <div>
                                    <h4 className={`font-bold text-sm ${task.status === "COMPLETED" ? 'text-emerald-100 line-through decoration-emerald-500/50' : 'text-slate-200'}`}>
                                        {task.task}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                            <Clock size={10} /> {task.time}
                                        </span>
                                        {task.status === "COMPLETED" && (
                                            <span className="text-[10px] text-emerald-400/80 font-bold">
                                                VERIFIED BY: {task.verifiedBy.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={`p-2 rounded-full transition-colors ${task.status === "COMPLETED" ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
                                    {task.status === "COMPLETED" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    // HISTORY TASKS
                    Object.entries(historyLogs).map(([date, logs]) => (
                        <div key={date} className="mb-6">
                            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 sticky top-0 bg-[#00140e] py-2 z-10 border-b border-white/5">
                                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h4>
                            <div className="space-y-2 opacity-75">
                                {logs.map(task => (
                                    <div key={task.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/20 flex justify-between items-center">
                                        <div>
                                            <p className={`text-sm font-medium ${task.status === "COMPLETED" ? 'text-slate-300' : 'text-slate-500'}`}>{task.task}</p>
                                            {task.status === "COMPLETED" && (
                                                <p className="text-[10px] text-emerald-500/70 mt-0.5">Verified by {task.verifiedBy}</p>
                                            )}
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${task.status === "COMPLETED" ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {task.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Summary */}
            <div className="mt-6 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">PESO SAFETY MANDATE</p>
                <p className="text-sm text-slate-400">
                    All logs must be digitally signed by shift supervisor before handover.
                </p>
            </div>
        </div>
    );
};

export default ComplianceLog;
