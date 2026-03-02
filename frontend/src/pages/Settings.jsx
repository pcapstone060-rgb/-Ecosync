import API_BASE_URL from '../config';

const Settings = () => {
    const [loading, setLoading] = useState(false);
    // ... state ...

    const handleSave = async () => {
        setLoading(true);
        try {
            // Update Backend Thresholds
            const res = await fetch(`${API_BASE_URL}/calibrate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    TEMP_MAX: parseFloat(config.TEMP_MAX),
                    VIBRATION_MAX: parseFloat(config.VIBRATION_MAX),
                    PRESSURE_MIN: parseFloat(config.PRESSURE_MIN)
                })
            });

            if (res.ok) {
                // Simulate saving local prefs
                await new Promise(r => setTimeout(r, 800));
                alert("System Configuration Updated Successfully.");
            } else {
                alert("Failed to sync with Core API.");
            }
        } catch (e) {
            console.error(e);
            alert("Connection Error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 w-full max-w-5xl mx-auto space-y-8 animate-in pb-24">

            {/* Header */}
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500 mb-2 font-black tracking-tighter">
                        SYSTEM PROTOCOLS
                    </h1>
                    <p className="text-slate-400 font-mono text-sm">CONFIGURATION & CALIBRATION CONSOLE</p>
                </div>
                <div className="text-right">
                    <div className="text-xs font-mono text-slate-500 mb-1">CURRENT PLAN</div>
                    <div className={`text-xl font-bold ${localStorage.getItem('plan') === 'pro' ? 'text-cyan-400' : 'text-cyan-400'}`}>
                        {localStorage.getItem('plan') === 'pro' ? 'PRO LICENSE' : 'LITE LICENSE'}
                    </div>
                    {localStorage.getItem('plan') !== 'pro' && (
                        <div className="text-[10px] text-cyan-600 cursor-pointer hover:text-cyan-400 mt-1">ENABLE RESEARCH MODE</div>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. Sensor Calibration (Core Logic) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                            <Sliders className="text-cyan-400" size={20} /> Sensor Threshold Calibration
                        </h3>

                        <div className="space-y-6">
                            {/* Temp Max */}
                            <div className="group">
                                <label className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                                    <span>MAX TEMPERATURE THRESHOLD</span>
                                    <span className="text-cyan-400 font-bold">{config.TEMP_MAX}°C</span>
                                </label>
                                <input
                                    type="range" min="20" max="100" step="0.5"
                                    value={config.TEMP_MAX}
                                    onChange={(e) => handleChange('TEMP_MAX', e.target.value)}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                                <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
                                    <span>SAFE (20°C)</span>
                                    <span>CRITICAL (100°C)</span>
                                </div>
                            </div>

                            {/* Vibration Max */}
                            <div className="group">
                                <label className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                                    <span>VIBRATION SENSITIVITY (G-Force)</span>
                                    <span className="text-cyan-400 font-bold">{config.VIBRATION_MAX}g</span>
                                </label>
                                <input
                                    type="range" min="0.1" max="20" step="0.1"
                                    value={config.VIBRATION_MAX}
                                    onChange={(e) => handleChange('VIBRATION_MAX', e.target.value)}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>

                            {/* Pressure Min */}
                            <div className="group">
                                <label className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                                    <span>MIN PRESSURE (hPa)</span>
                                    <span className="text-yellow-400 font-bold">{config.PRESSURE_MIN}</span>
                                </label>
                                <input
                                    type="range" min="800" max="1050" step="5"
                                    value={config.PRESSURE_MIN}
                                    onChange={(e) => handleChange('PRESSURE_MIN', e.target.value)}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Account & Notification */}
                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                            <Shield className="text-emerald-400" size={20} /> Security & Alerts
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <div className="flex items-center gap-3">
                                    <Bell className="text-slate-400" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-200">Email Notifications</p>
                                        <p className="text-xs text-slate-500">Receive critical anomaly reports</p>
                                    </div>
                                </div>
                                <Toggle checked={config.emailAlerts} onChange={() => handleChange('emailAlerts', !config.emailAlerts)} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <div className="flex items-center gap-3">
                                    <Activity className="text-slate-400" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-200">Emergency Call / SMS</p>
                                        <p className="text-xs text-slate-500">Auto-dial when thresholds breached</p>
                                    </div>
                                </div>
                                <Toggle checked={config.smsAlerts} onChange={() => handleChange('smsAlerts', !config.smsAlerts)} />
                            </div>
                            {config.smsAlerts && (
                                <div className="animate-in slide-in-from-top duration-300">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Primary Contact Number</label>
                                    <input
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-200 font-mono focus:border-cyan-500/50 focus:outline-none"
                                        onChange={(e) => {
                                            // Mock saving locally for demo
                                            localStorage.setItem('emergency_contact', e.target.value);
                                        }}
                                        defaultValue={localStorage.getItem('emergency_contact') || ''}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* System Prefs */}
                <div className="space-y-6">
                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                            <Cpu className="text-blue-400" size={20} /> Interface Logic
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Volume2 size={16} /> Voice Feedback (JARVIS)
                                </div>
                                <Toggle checked={config.voiceFeedback} onChange={() => handleChange('voiceFeedback', !config.voiceFeedback)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Moon size={16} /> High Performance Mode
                                </div>
                                <Toggle checked={config.highPerformance} onChange={() => handleChange('highPerformance', !config.highPerformance)} />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-700">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save size={20} />
                                {loading ? 'SAVING CONFIG...' : 'SAVE CONFIGURATION'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

const Toggle = ({ checked, onChange }) => (
    <div
        onClick={onChange}
        className={`w-12 h-6 rounded-full cursor-pointer transition-colors p-1 ${checked ? 'bg-cyan-600' : 'bg-slate-700'}`}
    >
        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
);

export default Settings;
// <title> <meta name="description" /> <meta property="og:title" />
