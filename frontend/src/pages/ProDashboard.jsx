import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { Activity, Droplets, Thermometer, Zap, Shield, User, CheckCircle, Wind, Cloud, Settings, Info } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useEsp32Stream } from '../hooks/useEsp32Stream';
import MapComponent from '../components/MapComponent';
import Analytics from './Analytics';
import Profile from './Profile';
import SettingsDialog from '../components/dashboard/shared/SettingsDialog';

const ProDashboard = ({ onToggle }) => {
    const { currentUser, userProfile } = useAuth();

    // Default to Hyderabad, but use profile location if available
    const initialPos = (userProfile?.location_lat && userProfile?.location_lon)
        ? [userProfile.location_lat, userProfile.location_lon]
        : [17.3850, 78.4867];

    const [mapPosition, setMapPosition] = useState(initialPos);

    // Pro Mode relies on Supabase and Real Coordinates + User Email for Personalized Alerts
    const { history: sensorData } = useEsp32Stream('pro', mapPosition, currentUser?.email);

    const [activeView, setActiveView] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [weatherPrediction, setWeatherPrediction] = useState({ prediction: 'Calculating...', severity: 'none' });

    // Derived Data
    const latestData = useMemo(() => (sensorData && sensorData.length > 0) ? sensorData[sensorData.length - 1] : {}, [sensorData]);
    const temp = useMemo(() => latestData.temperature != null ? latestData.temperature.toFixed(1) : 'ERR', [latestData]);
    const rawTemp = useMemo(() => latestData.raw_temperature != null ? latestData.raw_temperature.toFixed(1) : '--', [latestData]);

    const hum = useMemo(() => latestData.humidity != null ? latestData.humidity.toFixed(1) : 'ERR', [latestData]);
    const rawHum = useMemo(() => latestData.raw_humidity != null ? latestData.raw_humidity.toFixed(1) : '--', [latestData]);

    const aqi = useMemo(() => latestData.gas != null ? latestData.gas.toFixed(0) : '--', [latestData]);
    const rawAqi = useMemo(() => latestData.mq_raw != null ? latestData.mq_raw : '--', [latestData]);

    const wind = useMemo(() => latestData.wind_speed != null ? latestData.wind_speed.toFixed(1) : '--', [latestData]);
    const rawWind = useMemo(() => latestData.raw_wind_speed != null ? latestData.raw_wind_speed.toFixed(1) : '--', [latestData]);

    const rain = useMemo(() => {
        if (latestData.rain == null) return '---';
        return latestData.rain < 2000 ? 'RAINING' : 'DRY';
    }, [latestData]);

    const motion = useMemo(() => {
        if (latestData.motion == null) return '---';
        return latestData.motion === 1 ? 'DETECTED' : 'CLEAR';
    }, [latestData]);


    // Local Prediction Logic (Fallback)
    const calculateLocalPrediction = (h, w) => {
        let score = 0;
        if (h > 85) score += 5; else if (h > 75) score += 3;
        if (w > 10) score += 3; else if (w > 5) score += 2;

        if (score >= 8) return { prediction: "Heavy Rain Probable", severity: "high" };
        if (score >= 5) return { prediction: "Rain Likely", severity: "medium" };
        if (score >= 3) return { prediction: "Showers Possible", severity: "low" };
        return { prediction: "No Rain Predicted", severity: "none" };
    };

    // Fetch Weather Prediction from Backend
    React.useEffect(() => {
        const fetchWeather = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/filtered/latest`);
                const data = await res.json();
                if (data.weather) {
                    setWeatherPrediction(data.weather);
                } else if (latestData.humidity) {
                    // Fallback to local prediction
                    setWeatherPrediction(calculateLocalPrediction(latestData.humidity, latestData.wind_speed || 0));
                }
            } catch (err) {
                if (latestData.humidity) {
                    setWeatherPrediction(calculateLocalPrediction(latestData.humidity, latestData.wind_speed || 0));
                }
            }
        };
        fetchWeather();
        const interval = setInterval(fetchWeather, 10000);
        return () => clearInterval(interval);
    }, [latestData.humidity]);







    const StatCard = ({ title, value, rawValue, unit, icon: Icon, color = "amber" }) => (
        <div className={`glass-panel p-6 border-l-4 border-l-${color}-500 relative overflow-hidden group bg-slate-900/40`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Icon size={64} className={`text-${color}-500`} /></div>
            <p className={`text-${color}-500/80 text-xs font-bold uppercase mb-2`}>{title}</p>
            <h3 className="text-4xl font-black text-white">{value}<span className="text-lg text-slate-500 ml-1">{unit}</span></h3>
            {rawValue && rawValue !== '--' && (
                <div className="mt-2 text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-1 flex flex-col gap-0.5">
                    <div className="flex justify-between">
                        <span>RAW DATA:</span>
                        <span className="text-slate-400">{rawValue}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>CALIBRATED:</span>
                        <span className="text-emerald-400 font-bold">{value}</span>
                    </div>
                </div>
            )}
        </div>
    );

    const WeatherCard = ({ prediction, severity }) => {
        const config = {
            high: { color: 'red', icon: Cloud, label: 'SEVERE' },
            medium: { color: 'amber', icon: Cloud, label: 'MODERATE' },
            low: { color: 'blue', icon: Cloud, label: 'LOW' },
            none: { color: 'emerald', icon: Shield, label: 'NONE' }
        };
        const active = config[severity] || config.none;
        const Icon = active.icon;

        return (
            <div className={`glass-panel p-6 border-l-4 border-l-${active.color}-500 relative overflow-hidden group bg-slate-900/40`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Icon size={64} className={`text-${active.color}-500`} /></div>
                <p className={`text-${active.color}-500/80 text-xs font-bold uppercase mb-2`}>Weather Outlook</p>
                <h3 className="text-xl font-black text-white leading-tight uppercase">{prediction}</h3>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-0.5 bg-black/40 border border-slate-700 rounded-full">
                    <div className={`w-2 h-2 rounded-full bg-${active.color}-500 animate-pulse`}></div>
                    <span className="text-[10px] font-bold text-slate-400">PROBABILITY: {active.label}</span>
                </div>
            </div>
        );
    };

    const CustomTooltip = ({ active, payload, label }) => {

        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-mono">
                    <p className="text-slate-400 mb-2">{label}</p>
                    {payload.map((pld, index) => (
                        <div key={index} style={{ color: pld.color }} className="flex justify-between gap-4 mb-1">
                            <span>{pld.name}:</span>
                            <span className="font-bold">{pld.value}</span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-slate-800 text-slate-500">
                        Correction: {(payload[1].value - payload[0].value).toFixed(2)}
                    </div>
                </div>
            );
        }
        return null;
    };

    const KalmanChart = ({ title, rawKey, filteredKey, color, icon: Icon, unit }) => (
        <div className="glass-panel p-6 border-t-2 border-amber-500/50 flex flex-col bg-slate-900/40 h-80">
            <h3 className="text-amber-400 font-bold mb-4 flex items-center gap-2">
                <Icon size={18} /> {title}
            </h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensorData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#451a03" />
                        <XAxis dataKey="timestamp" stroke="#d97706" tick={false} />
                        <YAxis stroke="#d97706" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey={rawKey} stroke={color} strokeOpacity={0.4} name={`Raw Data`} dot={false} strokeWidth={1} />
                        <Line type="monotone" dataKey={filteredKey} stroke={color} strokeWidth={3} name={`Kalman Filtered`} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">

                <StatCard title="Core Temp" value={temp} rawValue={rawTemp} unit="°C" icon={Thermometer} color={temp === 'ERR' ? "red" : "amber"} />
                <StatCard title="Humidity" value={hum} rawValue={rawHum} unit="%" icon={Droplets} color={hum === 'ERR' ? "red" : "blue"} />
                <StatCard title="Air Quality" value={aqi} rawValue={rawAqi} unit="PPM" icon={Activity} color="emerald" />
                <StatCard title="Rain Stat" value={rain} rawValue={latestData.rain} unit="" icon={Cloud} color={rain === 'RAINING' ? "blue" : "slate"} />
                <StatCard title="Motion" value={motion} unit="" icon={Zap} color={motion === 'DETECTED' ? "red" : "indigo"} />
                <StatCard title="LCD Screen" value={latestData.screen || 0} unit="MODE" icon={Settings} color="cyan" />
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <KalmanChart
                    title="Temperature Analysis"
                    rawKey="raw_temperature"
                    filteredKey="temperature"
                    color="#fbbf24"
                    icon={Zap}
                />
                <KalmanChart
                    title="Humidity Analysis"
                    rawKey="raw_humidity"
                    filteredKey="humidity"
                    color="#3b82f6"
                    icon={Droplets}
                />
                <KalmanChart
                    title="Air Quality Analysis"
                    rawKey="raw_mq_ppm"
                    filteredKey="mq_ppm"
                    color="#10b981"
                    icon={Activity}
                />
                <KalmanChart
                    title="Wind Speed Analysis"
                    rawKey="raw_wind_speed"
                    filteredKey="wind_speed"
                    color="#06b6d4"
                    icon={Wind}
                />
            </div>
        </div>
    );

    return (

        <div className="flex h-screen w-full bg-[#050302] overflow-hidden font-outfit">
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/95 border-r border-amber-500/20 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:relative lg:w-20 lg:hover:w-64 group flex flex-col items-center py-8`}>
                <div className="mb-12"><Shield className="text-amber-500" size={32} /></div>
                <div className="flex-1 w-full space-y-4 px-4">
                    {['overview', 'analytics', 'map', 'profile'].map(id => {
                        const icons = {
                            overview: Activity,
                            analytics: Droplets,
                            map: Shield, // Using Shield or MapIcon if imported
                            profile: User
                        };
                        const Icon = icons[id] || Activity;
                        return (
                            <button key={id} onClick={() => setActiveView(id)} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeView === id ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:text-amber-200'}`}>
                                <Icon size={24} />
                                <span className="lg:opacity-0 lg:group-hover:opacity-100 font-bold uppercase transition-opacity">{id}</span>
                            </button>
                        );
                    })}
                </div>
                <button onClick={onToggle} className="mt-auto mb-8 mx-4 p-3 border border-slate-700 text-slate-400 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 justify-center">
                    <User size={18} /> <span className="lg:opacity-0 lg:group-hover:opacity-100 font-bold">SWITCH LITE</span>
                </button>
            </aside>

            <div className="flex-1 flex flex-col h-full relative">
                <header className="flex justify-between items-center p-6 border-b border-amber-500/20 bg-black/80 backdrop-blur-md">
                    <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">🌥️ S4 PRO</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => alert(`✅ SYSTEM STATUS: ONLINE\n\nCloud Sync is OPEN and capturing data.\nLast Packet Stored: ${new Date().toLocaleTimeString()}`)}
                            className="flex items-center gap-2 px-4 py-1 bg-cyan-500/10 border border-cyan-500/40 rounded-full text-cyan-400 text-xs font-bold animate-pulse hover:bg-cyan-500/20 transition-all cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                        >
                            <Cloud size={14} /> CLOUD SYNC
                        </button>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black border tracking-widest ${(sensorData && sensorData.length > 0 && (Date.now() - new Date(latestData.timestamp).getTime() < 60000))
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                            : 'bg-red-500/20 border-red-500 text-red-400'
                            }`}>
                            {(sensorData && sensorData.length > 0 && (Date.now() - new Date(latestData.timestamp).getTime() < 60000)) ? 'ONLINE (BRIDGE)' : 'OFFLINE'}
                        </div>


                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 border border-slate-700 text-slate-400 rounded-xl hover:bg-slate-800 transition-colors"
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-[#050302] to-[#050302]">
                    {activeView === 'overview' && renderOverview()}
                    {activeView === 'analytics' && <Analytics sensorData={sensorData} isProMode={true} predictions={[]} />}
                    {activeView === 'map' && <div className="h-full rounded-xl border border-amber-500/30 overflow-hidden"><MapComponent isPro={true} sensorData={latestData} position={mapPosition} onPositionChange={setMapPosition} /></div>}
                    {activeView === 'profile' && <Profile />}
                </main>
            </div >
            <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div >
    );
};

export default ProDashboard;
// <title> <meta name="description" /> <meta property="og:title" />
// <label>
