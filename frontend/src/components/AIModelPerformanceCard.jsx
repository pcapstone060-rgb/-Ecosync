import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import API_BASE_URL from '../config';

const AIModelPerformanceCard = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/pro/ml/performance`);
                if (!response.ok) throw new Error("Failed to fetch");
                const data = await response.json();
                setMetrics(data);
                setError(false);
            } catch (err) {
                console.error("Error fetching ML metrics:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    const formatPercent = (val) => {
        return (val * 100).toFixed(2) + "%";
    };

    return (
        <div className="relative p-5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="absolute top-2 right-2 p-2 opacity-20 text-purple-400 transition-transform group-hover:scale-110 group-hover:opacity-30">
                <Brain size={48} strokeWidth={1.5} />
            </div>

            <div className="z-10">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-3 rounded-full bg-purple-500"></div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Evaluation Metrics</p>
                </div>
                <h3 className="text-lg font-black text-white font-mono tracking-tighter mt-1 mb-2 flex items-center gap-2">
                    🧠 AI Model Performance
                </h3>

                {loading ? (
                    <div className="text-sm text-slate-500 font-mono animate-pulse">Loading metrics...</div>
                ) : error || !metrics ? (
                    <div className="text-sm text-red-500 font-bold font-mono">Metrics unavailable</div>
                ) : (
                    <div className="mt-2 text-sm font-mono space-y-1">
                        <div className="text-purple-300 font-bold mb-2">{metrics.model}</div>
                        <div className="flex justify-between text-slate-300">
                            <span>Precision:</span>
                            <span className="text-white">{formatPercent(metrics.precision)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                            <span>Recall:</span>
                            <span className="text-white">{formatPercent(metrics.recall)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                            <span>F1 Score:</span>
                            <span className="text-white">{formatPercent(metrics.f1_score)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300 mt-1 pt-1 border-t border-slate-800">
                            <span>Accuracy:</span>
                            <span className="text-emerald-400 font-bold text-base">{formatPercent(metrics.accuracy)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-600 uppercase tracking-wider w-full z-10">
                SCIENTIFIC EVALUATION
            </div>
        </div>
    );
};

export default AIModelPerformanceCard;
