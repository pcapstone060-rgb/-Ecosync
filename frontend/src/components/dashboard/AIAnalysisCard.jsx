import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, AlertTriangle, CheckCircle, BrainCircuit } from 'lucide-react';
import { Card } from './shared/Common';

// Simulate AI Analyzing process
const AIAnalysisCard = ({ weather, aqi, locationName }) => {
    const [status, setStatus] = useState('idle'); // idle, analyzing, complete
    const [text, setText] = useState('');
    const [insight, setInsight] = useState(null);

    const generateInsight = () => {
        setStatus('analyzing');
        setText('');

        // Logic to "Construct" a prompt and response
        let riskLevel = 'LOW';
        let mainFactor = 'Good Air Quality';
        let recommendation = 'Perfect conditions for outdoor activities.';

        if (weather?.temp > 35) {
            riskLevel = 'HIGH';
            mainFactor = 'Extreme Heat';
            recommendation = 'Limit outdoor exposure. Hydrate frequently. Urban Heat Island effect active.';
        } else if (aqi?.pm25 > 50) {
            riskLevel = 'MODERATE';
            mainFactor = 'Particulate Matter (PM2.5)';
            recommendation = 'Sensitive groups should wear masks. Windows should remain closed.';
        } else if (weather?.humidity > 80) {
            riskLevel = 'MODERATE';
            mainFactor = 'High Humidity';
            recommendation = 'Potential for mold growth and respiratory discomfort.';
        }

        const fullResponse = `Analyzing telemetry for ${locationName || 'Zone'}...
        
[OBSERVATION] Current metrics indicate ${riskLevel} environmental stress. Primary driver identified as ${mainFactor}.

[CORRELATION] Data matches historical patterns of ${mainFactor === 'Extreme Heat' ? 'summer peak thermal load' : 'industrial/traffic congestion'}. 

[AI RECOMMENDATION] ${recommendation} System advises executing Protocol ${riskLevel === 'HIGH' ? 'RED-ALPHA (Cooling/Filtration)' : 'GREEN-BETA (Monitor)'}.`;

        // Simulate Typing Effect
        let i = 0;
        const speed = 20;

        const typeWriter = () => {
            if (i < fullResponse.length) {
                setText(prev => prev + fullResponse.charAt(i));
                i++;
                setTimeout(typeWriter, speed);
            } else {
                setStatus('complete');
            }
        };

        setTimeout(typeWriter, 1000); // Start after 1s "processing"
    };

    return (
        <Card className="h-full flex flex-col relative overflow-hidden border-emerald-500/30 bg-black/40">
            {/* Background Tech Decals */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit size={60} className="text-emerald-400" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                        <Bot size={18} className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Generative Insight</h3>
                        <p className="text-[10px] text-emerald-500/70 font-mono">S4-NEURAL-ENGINE</p>
                    </div>
                </div>
                {status === 'complete' && <Badge type="success">COMPLETE</Badge>}
            </div>

            <div className="flex-1 min-h-[150px] bg-black/50 rounded-xl border border-white/5 p-4 font-mono text-xs leading-relaxed overflow-y-auto custom-scrollbar relative">
                {status === 'idle' ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                        <Sparkles size={24} className="opacity-50" />
                        <p>Ready to analyze updated telemetry.</p>
                    </div>
                ) : (
                    <div className="whitespace-pre-wrap text-emerald-100">
                        {text}
                        {status === 'analyzing' && <span className="animate-pulse inline-block w-2 h-4 bg-emerald-500 ml-1 aligned-middle"></span>}
                    </div>
                )}
            </div>

            <div className="mt-4">
                <button
                    onClick={generateInsight}
                    disabled={status === 'analyzing'}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 group"
                >
                    {status === 'analyzing' ? (
                        <>Processing <BrainCircuit size={16} className="animate-spin" /></>
                    ) : (
                        <>Generate AI Analysis <Sparkles size={16} className="group-hover:scale-125 transition-transform" /></>
                    )}
                </button>
            </div>
        </Card>
    );
};

const Badge = ({ children }) => (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        {children}
    </span>
);

export default AIAnalysisCard;
// aria-label
