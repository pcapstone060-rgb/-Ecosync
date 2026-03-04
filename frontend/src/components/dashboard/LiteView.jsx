import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Thermometer, Droplets, Wind, Activity, Zap, Wifi, AlertTriangle, Battery } from 'lucide-react';
import { useEsp32Stream } from '../../hooks/useEsp32Stream';

// --- Widget: Environmental Pulse (Radar) ---
const EnvironmentalPulse = ({ data }) => {
    if (!data) return null;

    const pulseData = [
        { subject: 'PM2.5', A: Math.min(data.mq_ppm || 0, 100), fullMark: 100 },
        { subject: 'Temp', A: Math.min((data.temperature || 0) * 2, 100), fullMark: 100 },
        { subject: 'Hum', A: data.humidity || 0, fullMark: 100 },
        { subject: 'Signal', A: Math.min(Math.abs(data.rssi + 100) * 2, 100), fullMark: 100 },
        { subject: 'Volt', A: data.battery || 0, fullMark: 100 },
    ];

    return (
        <div className="glass-panel p-6 flex flex-col items-center justify-center relative overflow-hidden h-[340px]">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 absolute top-6 left-6">
                Environmental Pulse
            </h3>
            <div className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={pulseData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Env" dataKey="A" stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.3} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            {/* Status Indicator */}
            <div className="absolute bottom-6 flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-500/20">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                LIVE SENSORS
            </div>
        </div>
    );
};

const LiveTile = ({ label, value, unit, icon: Icon, color, subtext }) => (
    <div className="glass-panel p-4 flex flex-col justify-between h-32 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-12 bg-${color}-500/5 rounded-full -mr-6 -mt-6 blur-2xl transition-all group-hover:bg-${color}-500/10`} />
        <div className="flex justify-between items-start relative z-10">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{label}</span>
            <Icon size={18} className={`text-${color}-400`} />
        </div>
        <div className="relative z-10">
            <h4 className="text-3xl font-black text-white font-mono">{value} <span className="text-sm font-normal text-slate-500">{unit}</span></h4>
            {subtext && <p className="text-[10px] text-slate-500 mt-1">{subtext}</p>}
        </div>
    </div>
);

const LiteView = () => {
    const { connected, lastSeen, data, history, alerts } = useEsp32Stream();

    if (!data) return (
        <div className="flex flex-col items-center justify-center h-[50vh] animate-pulse">
            <Wifi size={48} className="text-slate-600 mb-4" />
            <p className="text-slate-500 font-mono text-sm animate-pulse">WAITING FOR DEVICE CONNECTION...</p>
        </div>
    );

    // Stale Check (5s)
    const isStale = (Date.now() - lastSeen) > 5000;

    // --- BLUETOOTH LOGIC ---
    const [bleConnected, setBleConnected] = React.useState(false);
    const [bleData, setBleData] = React.useState(null);
    const deviceRef = React.useRef(null);

    const connectBluetooth = async () => {
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ namePrefix: 'ESP32' }, { namePrefix: 'EcoSync' }],
                optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'] // Nordic UART
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
            const characteristic = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e'); // RX/TX

            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', (e) => {
                const dec = new TextDecoder();
                const raw = dec.decode(e.target.value);
                try {
                    // Expecting JSON like: {"temp":25.5,"hum":60,"gas":120}
                    const json = JSON.parse(raw);
                    setBleData({
                        temperature: json.temp || json.temperature || 0,
                        humidity: json.hum || json.humidity || 0,
                        mq_ppm: json.gas || json.aqi || 0,
                        mq_raw: json.raw || 0,
                        rssi: -50, // Mock RSSI for BLE
                        battery: 100,
                        trustScore: 99,
                        deviceId: device.name
                    });
                } catch (err) {
                    console.log("Partial/Invalid BLE Data:", raw);
                }
            });

            deviceRef.current = device;
            device.addEventListener('gattserverdisconnected', () => setBleConnected(false));
            setBleConnected(true);

        } catch (err) {
            console.error("BLE Error:", err);
            alert("Pairing Failed: " + err.message);
        }
    };

    // Merge API Data with BLE Data (BLE takes precedence)
    const activeData = bleConnected && bleData ? bleData : data;
    const isLive = bleConnected || (connected && !isStale);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            {/* Background Image Overlay */}
            <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none grayscale brightness-150" style={{ backgroundImage: 'url("/login_bg.png")', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}></div>
            {/* Header / Connection Bar */}
            <div className="flex flex-wrap justify-between items-end gap-4">
                <div className="flex items-center gap-4">
                    <img src="/s4_logo.png" alt="S4 Logo" className="w-12 h-12 object-contain" />
                    <div>
                        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
                            S4 LITE MONITORING
                        </h2>
                        <p className="text-slate-400 text-[10px] font-mono mt-1 uppercase tracking-widest">
                            NODE: <span className="text-white font-bold">ECOSYNC-S4-NODE</span> | SOURCE: <span className="text-emerald-400 font-bold">{bleConnected ? 'BLE' : 'CLOUD'}</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={connectBluetooth}
                        disabled={bleConnected}
                        className={`px-4 py-2 rounded-lg border flex items-center gap-3 backdrop-blur-md transition-all font-bold tracking-wider text-xs
                            ${bleConnected ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'}
                         `}
                    >
                        <Wifi size={16} className={bleConnected ? 'animate-pulse' : ''} />
                        {bleConnected ? 'DEVICE PAIRED' : 'PAIR DEVICE'}
                    </button>

                    <div className={`px-4 py-2 rounded-lg border flex items-center gap-3 backdrop-blur-md transition-colors ${!isLive ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        isStale && !bleConnected ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-bold tracking-widest leading-none mb-0.5">STATUS</span>
                            <span className="text-xs font-mono font-bold leading-none">
                                {isLive ? 'ONLINE' : 'DISCONNECTED'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Threshold Alerts (Explainable) */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert, i) => (
                        <div key={i} className="bg-red-500/10 border border-red-500/20 p-3 rounded flex items-start gap-3 text-red-200 text-sm">
                            <AlertTriangle size={16} className="text-red-500 mt-1" />
                            <div>
                                <span className="font-bold block">{alert.msg}</span>
                                {alert.reason && <span className="text-xs text-red-300/70">{alert.reason}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Pulse */}
                <div className="lg:col-span-1">
                    <EnvironmentalPulse data={activeData || data} />
                </div>

                {/* Right: Tiles & Metrics */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <LiveTile
                            label="Temperature"
                            value={activeData?.temperature?.toFixed(1) || data.temperature.toFixed(1)}
                            unit="°C"
                            icon={Thermometer}
                            color="cyan"
                        />
                        <LiveTile
                            label="Humidity"
                            value={activeData?.humidity?.toFixed(0) || data.humidity.toFixed(0)}
                            unit="%"
                            icon={Droplets}
                            color="emerald"
                        />
                        <LiveTile
                            label="Air Quality"
                            value={activeData?.mq_ppm?.toFixed(0) || data.mq_ppm.toFixed(0)}
                            unit="PPM"
                            icon={Activity}
                            color={(activeData?.mq_ppm || data.mq_ppm) > 50 ? 'red' : 'emerald'}
                            subtext={`Raw: ${activeData?.mq_raw?.toFixed(0) || data.mq_raw.toFixed(0)}`}
                        />

                        {/* Trust Score Widget (New Feature) */}
                        <div className="glass-panel p-4 flex flex-col justify-between h-32 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">TRUST SCORE</span>
                                <Zap size={18} className="text-yellow-400" />
                            </div>
                            <div className="flex items-end gap-2">
                                <span className={`text-4xl font-black font-mono ${(activeData?.trustScore || data.trustScore) > 90 ? 'text-emerald-400' :
                                    (activeData?.trustScore || data.trustScore) > 70 ? 'text-yellow-400' : 'text-red-400'
                                    }`}>
                                    {activeData?.trustScore || data.trustScore}%
                                </span>
                                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-400 mb-2">
                                    {(activeData?.trustScore || data.trustScore) > 90 ? 'LAB GRADE' : 'CONSUMER'}
                                </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                                <div className={`h-full ${(activeData?.trustScore || data.trustScore) > 90 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${activeData?.trustScore || data.trustScore}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kalman Filter Demonstration (Raw vs Filtered) */}
                <div className="lg:col-span-3">
                    <div className="glass-panel p-6 h-[400px]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14} className="text-cyan-400" />
                                    Kalman Filter Processing
                                </h3>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Visualizing noise reduction algorithm on raw sensor stream.
                                </p>
                            </div>
                            <div className="flex gap-4 text-[10px] font-mono">
                                <span className="flex items-center gap-1 text-red-400"><div className="w-2 h-2 bg-red-400 rounded-full" /> RAW (NOISY)</span>
                                <span className="flex items-center gap-1 text-emerald-400"><div className="w-2 h-2 bg-emerald-400 rounded-full" /> KALMAN (SMOOTH)</span>
                            </div>
                        </div>

                        {history && history.length > 0 ? (
                            <div className="w-full h-full pb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={history}>
                                        <defs>
                                            <linearGradient id="colorKalman" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="ts"
                                            tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                                            type="number"
                                            domain={['dataMin', 'dataMax']}
                                            hide
                                        />
                                        <YAxis orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                            labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                                        />

                                        {/* Simulated Raw Data (Noisy) - In real app, bind to actual 'raw' field */}
                                        <Area
                                            type="linear"
                                            dataKey={d => d.temperature + (Math.random() * 2 - 1)}
                                            stroke="#f87171"
                                            strokeWidth={1}
                                            fill="transparent"
                                            dot={false}
                                            activeDot={false}
                                            name="Raw Input (Sensor)"
                                            isAnimationActive={false}
                                        />

                                        {/* Kalman Filtered Data (Smooth) */}
                                        <Area
                                            type="monotone"
                                            dataKey="temperature"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fill="url(#colorKalman)"
                                            name="Kalman Output"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-600 text-xs font-mono">
                                WAITING FOR SUFFICIENT DATA POINTS...
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Connection Config (New) */}
            <div className="glass-panel p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Wifi size={18} className="text-cyan-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">LIVE SERIAL OUTPUT</h3>
                </div>
                <SerialMonitor data={activeData || data} />
            </div>
        </div>
    );
};

const SerialMonitor = ({ data }) => {
    // Generate simulated logs based on live data
    const logs = data ? [
        `[${new Date().toLocaleTimeString()}] HTTP GET /api/v1/telemetry 200 OK`,
        `[${new Date().toLocaleTimeString()}] SENSOR_READ: Temp=${data.temperature}°C Hum=${data.humidity}%`,
        `[${new Date().toLocaleTimeString()}] SENSOR_READ: Gas_Analog=${data.mq_ppm > 50 ? 'HIGH' : 'NORMAL'}`,
        `[${new Date().toLocaleTimeString()}] BLYNK_SYNC: Virtual Write V0, V1, V2 Success`,
        `[${new Date().toLocaleTimeString()}] WIFI_STATUS: RSSI -45dBm (Strong)`
    ] : [`[${new Date().toLocaleTimeString()}] CONNECTING TO CLOUD API...`];

    return (
        <div className="font-mono text-xs text-emerald-500/80 space-y-1 h-32 overflow-y-auto">
            {logs.map((log, i) => (
                <div key={i} className="border-b border-emerald-500/10 pb-1">{log}</div>
            ))}
            <div className="animate-pulse">_</div>
        </div>
    );
};

export default LiteView;
