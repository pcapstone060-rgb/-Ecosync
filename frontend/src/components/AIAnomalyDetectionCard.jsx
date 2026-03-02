import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import API_BASE_URL from '../config';

const AIAnomalyDetectionCard = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/ml/performance`);
                if (!response.ok) throw new Error("Failed to fetch");
                const data = await response.json();
                setMetrics(data);
            } catch (err) {
                console.error("Error fetching ML metrics:", err);
            } finally {
                setLoading(false);
            }
        };

        // Polling every 5 seconds for real-time dashboard feel
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 5000);
        return () => clearInterval(interval);
    }, []);

    const score = metrics?.anomaly_score || 0;
    const status = metrics?.status || 'NORMAL';
    const isAnomaly = status === 'ANOMALY';

    return (
        <div className={`relative p-5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between overflow-hidden group hover:border-indigo-500/50 transition-all`}>
            <div className={`absolute top-2 right-2 p-2 opacity-20 text-indigo-400`}>
                <Brain size={48} strokeWidth={1.5} />
            </div>
            <div className="z-10">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-3 rounded-full bg-indigo-500"></div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">AI Anomaly Detection</p>
                </div>
                <h3 className={`text-2xl font-black font-mono tracking-tighter mt-1 mb-1 ${isAnomaly ? 'text-red-400' : 'text-emerald-400'}`}>
                    {status} {isAnomaly ? '🔴' : '🟢'}
                </h3>
                <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-500">SCORE:</span>
                        <span className="text-indigo-300">
                            {loading && !metrics ? '...' : score.toFixed(4)}
                        </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-500">MODEL:</span>
                        <span className="text-indigo-300">{metrics?.model || 'ISO FOREST'}</span>
                    </div>
                </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-600 uppercase tracking-wider w-full">
                {isAnomaly ? 'CHECK ENVIRONMENT' : 'CONTINUOUS MONITORING'}
            </div>
        </div>
    );
};

export default AIAnomalyDetectionCard;
// aria-label
