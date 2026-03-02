import { Activity, Droplets, Thermometer, Wind, AlertTriangle, Wifi, Zap, Cloud, Brain, ShieldCheck, FlaskConical } from 'lucide-react';
import API_BASE_URL from '../config';

const SmartInsightCard = ({ insight, anomaly }) => {
    if (!insight && !anomaly) return null;
    return (
        <div className={`p-4 rounded-xl border flex items-start gap-4 animate-in fade-in slide-in-from-top-4 ${anomaly ? 'bg-red-500/10 border-red-500/30 text-red-100' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-100'}`}>
            <div className={`p-2 rounded-lg ${anomaly ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                {anomaly ? <AlertTriangle size={20} /> : <Brain size={20} />}
            </div>
            <div>
                <h4 className="font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                    {anomaly ? 'Anomaly Detected' : 'AI Smart Insight'}
                    {anomaly && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">ACTION REQUIRED</span>}
                </h4>
                <p className="text-sm opacity-90 leading-relaxed font-medium">
                    {insight || "System behavior is unusual. Check sensors."}
                </p>
                {anomaly && <p className="text-xs mt-2 opacity-75 font-mono">Metric: {anomaly}</p>}
            </div>
        </div>
    );
};

const StatCard = ({ title, value, unit, icon: Icon, color, trend }) => (
    <div className="glass-panel p-6 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-24 bg-${color}-500/5 rounded-full -mr-10 -mt-10 blur-3xl transition-all group-hover:bg-${color}-500/10`} />
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
                <p className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-1">{title}</p>
                <h3 className="text-3xl font-black text-white font-mono">
                    {value} <span className="text-sm text-slate-500 font-normal">{unit}</span>
                </h3>
            </div>
            <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20 shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                <Icon size={24} />
            </div>
        </div>
        <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
            <div
                className={`h-full bg-${color}-500 shadow-[0_0_10px_currentColor]`}
                style={{ width: `${Math.min(trend || 50, 100)}%` }}
            />
        </div>
    </div>
);

const LiteDashboard = ({ sensorData, alerts, connectionStatus, onSwitchToPro }) => {
    const [iotConnected, setIotConnected] = useState(false);

    useEffect(() => {
        const fetchIoTStatus = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/iot/status`);
                if (res.ok) {
                    const status = await res.json();
                    setIotConnected(status.connected);
                }
            } catch (e) {
                setIotConnected(false);
            }
        };
        fetchIoTStatus();
        const interval = setInterval(fetchIoTStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    // Memoized Derived Values
    const latestData = useMemo(() => {
        return (sensorData && sensorData.length > 0) ? sensorData[sensorData.length - 1] : {};
    }, [sensorData]);

    const temp = useMemo(() => latestData.temperature != null ? latestData.temperature.toFixed(1) : 'ERR', [latestData]);
    const hum = useMemo(() => latestData.humidity != null ? latestData.humidity.toFixed(1) : 'ERR', [latestData]);
    const gas = useMemo(() => latestData.mq_raw > 600 ? 'DETECTED' : 'CLEAR', [latestData]);
    const gasColor = useMemo(() => latestData.mq_raw > 600 ? 'red' : 'emerald', [latestData]);

    const motion = useMemo(() => latestData.motion === 1 ? 'DETECTED' : 'CLEAR', [latestData]);
    const motionColor = useMemo(() => latestData.motion === 1 ? 'red' : 'blue', [latestData]);

    const rain = useMemo(() => latestData.rain < 2000 ? 'RAINING' : 'DRY', [latestData]);
    const rainColor = useMemo(() => latestData.rain < 2000 ? 'blue' : 'slate', [latestData]);

    // Smart Metrics
    const smartMetrics = latestData.smart_metrics || {};
    const trustScore = useMemo(() => smartMetrics.trust_score != null ? smartMetrics.trust_score.toFixed(0) : 'N/A', [smartMetrics]);
    const trustColor = useMemo(() => (smartMetrics.trust_score || 0) > 80 ? 'emerald' : ((smartMetrics.trust_score || 0) > 50 ? 'yellow' : 'red'), [smartMetrics]);
    const ph = useMemo(() => smartMetrics.ph != null ? smartMetrics.ph.toFixed(1) : 'N/A', [smartMetrics]);
    const phColor = useMemo(() => (smartMetrics.ph < 6 || smartMetrics.ph > 8) ? 'red' : 'emerald', [smartMetrics]);

    // Check for Device
    if (!sensorData || sensorData.length === 0) {
        const token = localStorage.getItem('token');
        return (
            <div className="p-8 w-full h-[80vh] flex items-center justify-center animate-in mb-20 fade-in zoom-in duration-500">
                <div className="max-w-2xl w-full glass-panel p-12 text-center relative overflow-hidden border border-cyan-500/30 shadow-[0_0_100px_rgba(6,182,212,0.1)]">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />
                    <div className="w-24 h-24 bg-cyan-900/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-cyan-500/50 relative">
                        <div className="absolute inset-0 rounded-full border border-cyan-400 opacity-20 animate-ping" />
                        <Wifi className="text-cyan-400 w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-wide">CONNECT YOUR DEVICE</h2>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        No telemetry detected. Provision your ESP32 with the credentials below to establish a secure uplink.
                    </p>
                    <div className="bg-slate-900/80 p-6 rounded-xl border border-dashed border-slate-700 font-mono text-left relative group">
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest flex justify-between">
                            Device Access Token
                            <span className="text-cyan-500 cursor-pointer hover:text-cyan-400">COPY</span>
                        </p>
                        <div className="text-emerald-400 break-all text-sm font-bold bg-black/50 p-3 rounded">
                            {token || "AUTHENTICATION_ERROR_RELOGIN_REQUIRED"}
                        </div>
                    </div>
                    <div className="mt-8 flex justify-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                            Listening for Handshake...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-8 animate-in pb-24">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 mb-2 font-black tracking-tighter">
                        LITE MONITOR
                    </h1>
                    <p className="text-slate-400 font-mono text-sm">
                        STATUS: <span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]">ONLINE</span>
                        <span className="mx-2 text-slate-600">|</span>
                        <span className="text-slate-500">HARDWARE STREAMING</span>
                    </p>
                </div>
                {onSwitchToPro && (
                    <button onClick={onSwitchToPro} className="text-sm text-cyan-400 hover:underline">
                        Switch to Pro
                    </button>
                )}
            </header>

            {/* Smart Insights & Alerts Section */}
            <div className="grid grid-cols-1 gap-4">
                {alerts.length > 0 && (
                    <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <AlertTriangle className="text-red-500" />
                        <span className="font-bold">CRITICAL ALERT:</span> {alerts[0].message}
                    </div>
                )}

                {smartMetrics.insight && <SmartInsightCard insight={smartMetrics.insight} anomaly={smartMetrics.anomaly_label !== "Normal" ? smartMetrics.anomaly_label : null} />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <StatCard title="Temperature" value={temp} unit="°C" icon={Thermometer} color={temp === 'ERR' ? 'red' : 'cyan'} trend={temp === 'ERR' ? 0 : Math.abs(latestData.temperature || 0) * 2} />
                <StatCard title="Humidity" value={hum} unit="%" icon={Droplets} color={hum === 'ERR' ? 'red' : 'blue'} trend={hum === 'ERR' ? 0 : latestData.humidity || 0} />
                <StatCard title="Air Quality" value={gas} unit="RAW" icon={Activity} color={gasColor} trend={(latestData.mq_raw / 1024) * 100 || 0} />
                <StatCard title="Rain Status" value={rain} unit="" icon={Cloud} color={rainColor} trend={(4095 - latestData.rain) / 40 || 0} />

                {/* New Smart Cards */}
                <StatCard title="Trust Score" value={trustScore} unit="%" icon={ShieldCheck} color={trustColor} trend={smartMetrics.trust_score || 0} />
                <StatCard title="pH Level" value={ph} unit="pH" icon={FlaskConical} color={phColor} trend={((parseFloat(ph) || 0) / 14) * 100} />
            </div>

            <div className="glass-panel p-6 border-t-2 border-t-emerald-500/20">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                        <Activity className="text-emerald-400" size={20} /> Live Device Stream
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        REAL-TIME
                    </div>
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sensorData}>
                            <defs>
                                <linearGradient id="colorTempLite" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                                dataKey="timestamp"
                                stroke="#475569"
                                tick={{ fill: '#475569' }}
                                tickFormatter={(t) => t ? new Date(t).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }) : ''}
                            />
                            <YAxis stroke="#475569" tick={{ fill: '#475569' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }}
                                itemStyle={{ color: '#10b981' }}
                                labelFormatter={(t) => t ? new Date(t).toLocaleTimeString() : ''}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="temperature"
                                name="Temp"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTempLite)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default LiteDashboard;
// <title> <meta name="description" /> <meta property="og:title" />
// <label>
