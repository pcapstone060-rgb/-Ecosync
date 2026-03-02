import React, { useState, useEffect, useRef } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell } from 'recharts';
import { Map, Wind, CloudSun, Shield, Fingerprint, Layers, Share2, Search, ArrowRight, Home, Sun, AlertTriangle, BookOpen, Clock, Activity, Move, Save, Settings, Sunrise, Sunset, Eye, Droplets } from 'lucide-react';
import { useApiTelemetry } from '../../hooks/useApiTelemetry';
import { Card, Badge, Skeleton, StatRow, THEME } from './shared/Common';
import API_BASE_URL from '../../config';

// --- NEW FEATURES ---
import WeatherNews from './WeatherNews';
import TopLocations from './TopLocations';
import SettingsDialog from './shared/SettingsDialog';
import { useLocation } from '../../contexts/LocationContext';
import AIAnalysisCard from './AIAnalysisCard';

const CauseExplorer = ({ weather, aqi }) => {
    // Rule-based analysis
    const drivers = [];
    if (weather?.wind_speed < 5) drivers.push({ name: 'Stagnation', prob: 90, desc: 'Low wind trapping pollutants.' });
    if (weather?.humidity > 70) drivers.push({ name: 'Hygroscopic Growth', prob: 80, desc: 'High humidity increasing PM size.' });
    if (aqi?.no2 > 20) drivers.push({ name: 'Traffic Emissions', prob: 85, desc: 'High NO2 levels detected.' });
    if (drivers.length === 0) drivers.push({ name: 'Background Levels', prob: 10, desc: 'No specific local driver found.' });

    const topDriver = drivers.sort((a, b) => b.prob - a.prob)[0];

    return (
        <Card className="flex flex-col gap-3 h-full">
            <div className="flex items-center gap-2 mb-1">
                <Activity size={14} className="text-pink-400" />
                <h3 className="text-xs font-bold text-gray-400 uppercase">Pollution Cause Explorer</h3>
            </div>

            <div className="flex-1 bg-gradient-to-br from-pink-900/20 to-cyan-900/20 rounded p-3 border border-pink-500/20 flex flex-col justify-center">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Main Driver</div>
                <div className="text-lg font-bold text-white leading-none mb-1">{topDriver.name}</div>
                <div className="text-xs text-gray-400">{topDriver.desc}</div>
            </div>

            <div className="space-y-1">
                {drivers.slice(1, 3).map((d, i) => (
                    <div key={i} className="flex justify-between text-[10px] text-gray-500 border-b border-gray-800 pb-1 last:border-0">
                        <span>{d.name}</span>
                        <span>{d.prob}% Contrib</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const ExposureTimer = ({ pm25 }) => {
    const [activity, setActivity] = useState('walking'); // walking, running, cycling
    const [duration, setDuration] = useState(10);

    // Simple Dose Calculation: Dose = PM2.5 * VentilationRate * Time
    // VR (L/min): Walk=15, Run=45, Cycle=30
    const vrMap = { walking: 15, running: 45, cycling: 30 };
    const vr = vrMap[activity];

    // Total inhaled mass in micrograms (rough approx)
    const inhaled = (pm25 * (vr / 1000) * duration).toFixed(1);

    let risk = 'LOW';
    let color = 'text-emerald-400';

    if (inhaled > 5) { risk = 'MED'; color = 'text-amber-400'; }
    if (inhaled > 15) { risk = 'HIGH'; color = 'text-red-400'; }

    return (
        <Card className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-gray-400 uppercase">Personal Exposure Timer</h3>
            </div>

            <div className="flex gap-2 mb-4">
                <select
                    value={activity}
                    onChange={e => setActivity(e.target.value)}
                    className="bg-gray-800 text-xs text-white rounded p-1 border border-gray-700 focus:outline-none"
                >
                    <option value="walking">Walking</option>
                    <option value="running">Running</option>
                    <option value="cycling">Cycling</option>
                </select>

                <select
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="bg-gray-800 text-xs text-white rounded p-1 border border-gray-700 focus:outline-none"
                >
                    <option value={10}>10 min</option>
                    <option value={30}>30 min</option>
                    <option value={60}>1 hr</option>
                </select>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center bg-gray-900/50 rounded p-2 border border-gray-700">
                <span className="text-[10px] text-gray-500">ESTIMATED INTAKE</span>
                <div className="text-2xl font-bold text-white">{inhaled} <span className="text-xs font-normal text-gray-500">µg</span></div>
                <div className={`text-xs font-bold ${color} mt-1 border px-2 rounded-full border-current opacity-80`}>
                    {risk} RISK
                </div>
            </div>
        </Card>
    );
};

const DiaryPanel = ({ fetchTrigger }) => {
    const [entries, setEntries] = useState([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchEntries = async () => {
        try {
            // Mock auth token handling - In real app, attach token
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/pro/diary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setEntries(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchEntries(); }, [fetchTrigger]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!note) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/api/pro/diary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ note, location: 'Dashboard' })
            });
            setNote('');
            fetchEntries();
        } catch (e) { alert("Failed to save note"); }
        setLoading(false);
    };

    return (
        <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                    <BookOpen size={14} className="text-emerald-400" />
                    Air Quality Diary
                </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                <input
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    placeholder="Note (e.g., Smell of smoke...)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                />
                <button type="submit" disabled={loading} className="bg-emerald-600 px-3 py-1 rounded text-xs text-white font-bold hover:bg-emerald-500">
                    {loading ? '...' : 'ADD'}
                </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-700 max-h-[140px]">
                {entries.length === 0 ? <p className="text-[10px] text-gray-600 text-center italic mt-4">No entries yet.</p> :
                    entries.map(e => (
                        <div key={e.id} className="bg-[#1e2329] p-2 rounded border-l-2 border-emerald-500">
                            <div className="text-xs text-gray-300">{e.note}</div>
                            <div className="text-[10px] text-gray-600 mt-1">{new Date(e.timestamp).toLocaleString()}</div>
                        </div>
                    ))}
            </div>
        </Card>
    );
};

const IndoorOutdoorPanel = ({ local, outdoor, recommendation }) => {
    // Assuming 'local' is the fusion local value (Indoor)
    // 'outdoor' is the API value

    // Normalize to prevent NaNs
    const valIn = typeof local === 'number' ? local : 0;
    const valOut = typeof outdoor === 'number' ? outdoor : 0;

    return (
        <Card className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                    <Home size={14} className="text-cyan-400" />
                    Indoor vs Outdoor (PM2.5)
                </h3>
            </div>

            <div className="flex items-center justify-between gap-4">
                {/* INDOOR */}
                <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">INDOOR</div>
                    <div className={`text-2xl font-bold ${valIn > 35 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {valIn.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-gray-600">µg/m³</div>
                </div>

                {/* COMP */}
                <div className="flex flex-col items-center">
                    <div className="h-[2px] w-12 bg-gray-700 relative">
                        {/* Dot indicator based on difference */}
                        <div className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${valIn < valOut ? 'bg-emerald-500 left-0' : 'bg-red-500 right-0'}`} />
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">vs</span>
                </div>

                {/* OUTDOOR */}
                <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">OUTDOOR</div>
                    <div className={`text-2xl font-bold ${valOut > 35 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {valOut.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-gray-600">API</div>
                </div>
            </div>

            {/* ACTION */}
            <div className={`p-3 rounded border-l-2 flex items-center justify-between
                ${recommendation.action === "Open Windows" ? "bg-emerald-900/20 border-emerald-500" :
                    recommendation.action === "Keep Closed" ? "bg-red-900/10 border-red-500" : "bg-gray-800 border-gray-600"}`}>

                <div>
                    <div className={`text-xs font-bold ${recommendation.action === "Open Windows" ? "text-emerald-400" :
                        recommendation.action === "Keep Closed" ? "text-red-400" : "text-gray-300"}`}>
                        {recommendation.action}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{recommendation.reason}</div>
                </div>

                {recommendation.action === "Open Windows" ? <Wind size={16} className="text-emerald-400" /> :
                    recommendation.action === "Keep Closed" ? <Shield size={16} className="text-red-400" /> : null}
            </div>
        </Card>
    );
};

const ForecastPanel = ({ forecast, bestWindows }) => {
    // forecast: [{time, temp, pm25, aqi}, ...]

    return (
        <Card className="col-span-1 lg:col-span-2 relative p-6 flex flex-col h-[340px] overflow-hidden group">
            {/* Google-ish Weather Character Background - Simulated with CSS Art/Icon */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CloudSun size={120} className="text-emerald-400" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2 uppercase tracking-widest">
                            <Sun size={14} className="text-amber-400" />
                            24h Biosphere Outlook
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-1">
                            Predictive Environmental Intelligence
                        </p>
                    </div>
                </div>

                {/* Horizontal Scroll Container - "Google Style" Pills */}
                <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
                    <div className="flex gap-3 min-w-max px-1">
                        {forecast.map((item, idx) => (
                            <div
                                key={idx}
                                className={`
                                    flex flex-col items-center justify-between
                                    w-16 h-32 rounded-3xl py-3
                                    border border-white/5 
                                    transition-all duration-300 hover:scale-105 hover:bg-white/5
                                    ${idx === 0 ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#1e2329]'}
                                `}
                            >
                                <span className="text-[10px] font-mono text-gray-400">{item.time}</span>

                                {/* Icon based on AQI/Temp */}
                                {item.aqi > 100 ? <AlertTriangle size={18} className="text-amber-500" /> :
                                    item.temp > 30 ? <Sun size={18} className="text-amber-300" /> :
                                        <CloudSun size={18} className={idx === 0 ? "text-emerald-300" : "text-gray-400"} />
                                }

                                <span className="text-lg font-bold text-white">{Math.round(item.temp)}°</span>

                                <div className="w-full flex flex-col items-center gap-1">
                                    <div className="h-8 w-1.5 bg-gray-700 rounded-full relative overflow-hidden">
                                        <div
                                            className={`absolute bottom-0 w-full rounded-full ${item.aqi < 50 ? 'bg-emerald-500' : item.aqi < 100 ? 'bg-amber-500' : 'bg-red-500'}`}
                                            style={{ height: `${Math.min(100, (item.aqi / 200) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
};

const TimelinePanel = ({ events }) => (
    <Card className="h-full flex flex-col">
        <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2 mb-4">
            <ArrowRight size={14} className="text-emerald-400" />
            Event Timeline
        </h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700">
            {/* Mocking Events if empty */}
            {(!events || events.length === 0) ? (
                <>
                    <div className="flex gap-3 relative pl-2 pb-4 border-l border-gray-700">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-[#0f172a]" />
                        <div>
                            <div className="text-[10px] text-gray-500">10:42 AM</div>
                            <div className="text-xs text-white font-medium">Optimal Window Started</div>
                        </div>
                    </div>

                    <div className="flex gap-3 relative pl-2 pb-4 border-l border-gray-700">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-[#0f172a]" />
                        <div>
                            <div className="text-[10px] text-gray-500">09:15 AM</div>
                            <div className="text-xs text-white font-medium">Moderate Dust Spike</div>
                            <div className="text-[10px] text-gray-400 mt-1">Source: Construction</div>
                        </div>
                    </div>
                </>
            ) : (
                events.map((e, i) => <div key={i}>{e.title}</div>)
            )}
        </div>
    </Card>
);
const FingerprintChart = ({ data }) => (
    <div className="w-full h-40">
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="source" tick={{ fill: '#848E9C', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Source" dataKey="probability" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.3} />
            </RadarChart>
        </ResponsiveContainer>
    </div>
);

const FusionChart = ({ history }) => {
    if (!history || history.length < 2) return (
        <div className="flex items-center justify-center h-full text-xs text-gray-500 font-mono animate-pulse">
            INITIALIZING MARKET FUSION ENGINE...
        </div>
    );

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                    <defs>
                        <linearGradient id="colorFused" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: '#9CA3AF', fontSize: 10 }} interval="preserveStartEnd" minTickGap={30} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#9CA3AF', fontSize: 10 }} orientation="right" tickFormatter={(val) => val.toFixed(1)} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontFamily: 'monospace' }}
                        itemStyle={{ fontSize: '11px' }}
                        labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />

                    {/* Stock Market Style - "Candle" feel using Step Line */}
                    <Area
                        type="step"
                        dataKey="local"
                        stroke="#ef4444"
                        fill="transparent"
                        strokeWidth={1}
                        name="Raw Volatility (Sensor)"
                        opacity={0.7}
                    />

                    {/* The "Trend" Line - Thick, Green Area */}
                    <Area
                        type="monotone"
                        dataKey="fused"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#colorFused)"
                        name="Market Trend (Kalman)"
                        activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const BioSignatureWidget = ({ weather, aqi }) => {
    // Dynamic Bio-Signature based on REAL Telemetry
    // We normalize values to a 0-150 scale (Baseline 100)

    const temp = weather?.temp || 25;
    const humidity = weather?.humidity || 50;
    const pm25 = aqi?.pm25 || 10;
    const wind = weather?.wind_speed || 10;
    const uv = weather?.uv_index || 0;

    // Algorithms for "Bio-Health"
    const scoreFlora = Math.max(0, 150 - (Math.abs(temp - 24) * 5) - (Math.abs(humidity - 60) * 2));
    const scoreFauna = Math.max(0, 150 - (pm25 * 2) - (Math.abs(temp - 22) * 4));
    const scoreSoil = Math.max(0, 150 - (Math.abs(humidity - 40) * 3)); // Soil likes moderate dry/wet cycle, simplified
    const scoreWater = Math.max(0, 150 - (temp > 30 ? (temp - 30) * 10 : 0)); // Heat affects water retention
    const scoreAir = Math.max(0, 150 - (pm25 * 3));
    const scoreUV = Math.max(0, 150 - (uv * 10));

    const data = [
        { subject: 'Flora', A: scoreFlora, B: 100, fullMark: 150 },
        { subject: 'Fauna', A: scoreFauna, B: 100, fullMark: 150 },
        { subject: 'Soil', A: scoreSoil, B: 100, fullMark: 150 },
        { subject: 'Water', A: scoreWater, B: 100, fullMark: 150 },
        { subject: 'Air', A: scoreAir, B: 100, fullMark: 150 },
        { subject: 'Solar', A: scoreUV, B: 100, fullMark: 150 },
    ];

    return (
        <div className="relative h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-pink-500" />
                <h3 className="text-xs font-bold text-gray-400 uppercase">Biosphere DNA</h3>
            </div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar name="Current Health" dataKey="A" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.3} />
                        <Radar name="Baseline" dataKey="B" stroke="#6366f1" strokeWidth={1} fill="transparent" strokeDasharray="3 3" />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};



// ... existing code ...

const ProView = () => {
    // Search State
    const [searchQuery, setSearchQuery] = useState({ city: 'Hyderabad' });
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Fusion History State
    const [fusionHistory, setFusionHistory] = useState([]);

    // Data Hook
    // Data Hook (Updated to include NEW outputs)
    // Data Hook (Updated to include NEW outputs)
    const { activeLocation } = useLocation();

    // Sync Local Search Query with Global Context Selection
    useEffect(() => {
        if (activeLocation && activeLocation.name !== 'DETECTING...' && activeLocation.name !== 'HYDERABAD (DEFAULT)') {
            setSearchQuery({
                city: activeLocation.name,
                lat: activeLocation.lat,
                lon: activeLocation.lon
            });
        }
    }, [activeLocation]);

    const { weather, aqi, forecast, bestWindows, recommendation, anomalies, fingerprint, loading, error, fusion } = useApiTelemetry(searchQuery);
    const [range, setRange] = useState('1H');

    // Widget Order State (Simple Builder)
    const [widgetOrder, setWidgetOrder] = useState(['fusion', 'decision', 'forecast', 'timeline', 'cause', 'exposure', 'diary']);

    // --- SETTINGS STATE ---
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Function to reorder (Simple move to top)
    const moveWidgetUp = (id) => {
        const idx = widgetOrder.indexOf(id);
        if (idx > 0) {
            const newOrder = [...widgetOrder];
            [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
            setWidgetOrder(newOrder);
        }
    };

    // Accumulate Fusion Data
    useEffect(() => {
        if (fusion && fusion.temperature) {
            setFusionHistory(prev => {
                const now = new Date();
                const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

                const point = {
                    time: timeStr,
                    local: fusion.temperature.local || 0,
                    external: fusion.temperature.external || 0,
                    fused: fusion.temperature.fused || 0
                };

                // Keep last 20 points
                const newHist = [...prev, point];
                if (newHist.length > 20) newHist.shift();
                return newHist;
            });
        }
    }, [fusion]);

    // Click Outside to Close
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Handle Input Change & Fetch Suggestions
    const handleInputChange = async (e) => {
        const val = e.target.value;
        setInputValue(val);

        if (val.length > 2) {
            try {
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${val}&count=5&language=en&format=json`);
                const data = await res.json();
                if (data.results) {
                    setSuggestions(data.results);
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.error("Autocomplete Error", err);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // Handle Selection
    const handleSelectCity = (cityObj) => {
        setInputValue(cityObj.name); // Set input to name
        setSearchQuery({ city: cityObj.name }); // Trigger Data Fetch
        setSuggestions([]);
        setShowSuggestions(false);
        setFusionHistory([]); // Clear graph on new city
    };

    // Keep "Enter" key working as fallback
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setShowSuggestions(false);
            if (inputValue.length > 2) {
                setSearchQuery({ city: inputValue });
                setFusionHistory([]);
            }
        }
    };

    if (loading && !weather) return (
        <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
            </div>
            <Skeleton className="h-[400px]" />
        </div>
    );

    if (error) return (
        <Card className="flex flex-col items-center justify-center h-96">
            <Shield size={48} className="text-red-500 mb-4" />
            <h3 className="text-xl text-white font-bold">Data Unavailable</h3>
            <p className="text-gray-500">{error}</p>
        </Card>
    );

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] md:text-xs text-emerald-500/80 font-mono tracking-widest uppercase border-l-2 border-emerald-500/50 pl-3 flex items-center gap-2">
                            MONITORING ZONE: <span className="text-white font-bold text-lg">{activeLocation.name || 'HYDERABAD'}</span>
                        </p>
                        <button
                            onClick={() => inputValue.length > 2 && setShowSuggestions(true)}
                            className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded transition-colors uppercase font-bold tracking-wider"
                        >
                            Change Location
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Bar with Autocomplete */}
            <div className="flex items-center gap-2 mt-1 relative" ref={wrapperRef}>
                <div className="relative flex items-center gap-2 w-full md:w-auto">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <Search size={12} className="text-gray-500" />
                        </div>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => inputValue.length > 2 && setShowSuggestions(true)}
                            placeholder="Search City..."
                            className="pl-7 bg-gray-800/50 border border-gray-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors w-48"
                        />

                        {/* Dropdown Results */}
                        {showSuggestions && suggestions.length > 0 && (
                            <ul className="absolute left-0 top-full mt-1 w-full bg-[#1e2329] border border-gray-700 rounded-md shadow-xl z-50 max-h-48 overflow-y-auto">
                                {suggestions.map((s) => (
                                    <li
                                        key={s.id}
                                        onClick={() => handleSelectCity(s)}
                                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs text-gray-200 border-b border-gray-800 last:border-0 flex flex-col"
                                    >
                                        <span className="font-bold">{s.name}</span>
                                        <span className="text-[10px] text-gray-500">{s.admin1}, {s.country}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* [NEW] Current Location Button */}
                    <button
                        onClick={async () => {
                            /* User Requested explicit button for "Use Current Location" */
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(pos => {
                                    const { latitude, longitude } = pos.coords;
                                    // Manual Context Update fallback
                                    setSearchQuery({ lat: latitude, lon: longitude, city: 'Current Location' });
                                });
                            }
                        }}
                        className="p-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-md hover:bg-emerald-600 hover:text-white transition-colors"
                        title="Locate Me"
                    >
                        <Move size={14} />
                    </button>
                </div>
            </div>


            {/* [NEW] Dynamic Map Widget (OpenStreetMap) */}
            <div className="mt-4 w-full h-[250px] rounded-xl overflow-hidden border border-gray-700 relative shadow-2xl">
                <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeLocation.lon - 0.05}%2C${activeLocation.lat - 0.05}%2C${activeLocation.lon + 0.05}%2C${activeLocation.lat + 0.05}&layer=mapnik&marker=${activeLocation.lat}%2C${activeLocation.lon}`}
                    style={{ filter: 'invert(90%) hue-rotate(180deg) contrast(85%) grayscale(20%)' }}
                ></iframe>
                <div className="absolute top-3 left-3 bg-black/80 px-3 py-1 rounded text-xs text-emerald-400 font-mono border border-emerald-500/30 flex items-center gap-2 backdrop-blur-md">
                    <Activity size={12} className="animate-pulse" />
                    LIVE TRACKING: {activeLocation.name}
                </div>
            </div>

            <div className="flex gap-2">
                {['1H', '24H', '7D'].map(r => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`px-3 py-1 rounded text-xs font-bold border ${range === r ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}
                    >
                        {r}
                    </button>
                ))}

                <button
                    onClick={() => {
                        // Trigger Full Screen Alert
                        const alertOverlay = document.createElement('div');
                        alertOverlay.className = 'fixed inset-0 z-[9999] bg-red-950/90 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300';
                        alertOverlay.innerHTML = `
                                <div class="bg-red-600/20 p-8 rounded-full animate-ping mb-8">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-red-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                </div>
                                <h1 class="text-6xl font-black text-red-500 tracking-tighter mb-4 animate-pulse text-center">HAZARD DETECTED</h1>
                                <p class="text-2xl text-white font-mono uppercase tracking-widest mb-8">Toxic Gas Leak: Sector 4</p>
                                <button onclick="this.parentElement.remove()" class="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all uppercase tracking-widest">
                                    ACKNOWLEDGE & DISMISS
                                </button>
                            `;
                        document.body.appendChild(alertOverlay);
                        // Beep (simple osc)
                        try {
                            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                            const oscillator = audioCtx.createOscillator();
                            oscillator.type = 'sawtooth';
                            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                            oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
                            oscillator.connect(audioCtx.destination);
                            oscillator.start();
                            oscillator.stop(audioCtx.currentTime + 0.5);
                        } catch (e) { }
                    }}
                    className="p-1 px-2 rounded border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-white transition-colors"
                    title="Simulate Alert"
                >
                    <AlertTriangle size={18} />
                </button>
                <button onClick={() => window.print()} className="p-1 px-2 rounded border border-cyan-500/30 text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-colors" title="Export PDF Report">
                    <Share2 size={18} />
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-1 px-2 rounded border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                    <Settings size={18} />
                </button>
            </div>


            <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Life Support Monitor (Temp & Humidity Focus) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Temperature Monitor */}
                <Card className={`relative overflow-hidden flex flex-col justify-center items-center py-8 border-2 ${weather?.temp > 35 ? 'border-red-500 bg-red-900/10' : 'border-gray-700'}`}>
                    {weather?.temp > 35 && <div className="absolute top-0 inset-x-0 bg-red-500 text-black text-[10px] font-bold text-center tracking-[0.3em] uppercase py-1 animate-pulse">Critical Thermal Levels</div>}
                    <div className="flex items-center gap-3 mb-2">
                        <Sun size={24} className={weather?.temp > 35 ? 'text-red-500 animate-spin-slow' : 'text-amber-400'} />
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ambient Temp</h3>
                    </div>
                    <div className="text-6xl md:text-7xl font-black text-white tracking-tighter relative">
                        {weather?.temp}
                        <span className="text-2xl text-gray-500 absolute top-2 -right-6">°C</span>
                    </div>
                    <div className="mt-4 text-xs font-mono text-gray-500 bg-gray-900/50 px-3 py-1 rounded-full border border-white/5">
                        THRESHOLD: 35°C
                    </div>
                </Card>

                {/* Humidity Monitor */}
                <Card className={`relative overflow-hidden flex flex-col justify-center items-center py-8 border-2 ${weather?.humidity > 70 ? 'border-cyan-500 bg-cyan-900/10' : 'border-gray-700'}`}>
                    {weather?.humidity > 70 && <div className="absolute top-0 inset-x-0 bg-cyan-500 text-black text-[10px] font-bold text-center tracking-[0.3em] uppercase py-1 animate-pulse">High Moisture Alert</div>}
                    <div className="flex items-center gap-3 mb-2">
                        <Activity size={24} className={weather?.humidity > 70 ? 'text-cyan-500' : 'text-cyan-400'} />
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Humidity</h3>
                    </div>
                    <div className="text-6xl md:text-7xl font-black text-white tracking-tighter relative">
                        {weather?.humidity}
                        <span className="text-2xl text-gray-500 absolute top-2 -right-8">%</span>
                    </div>
                    <div className="mt-4 text-xs font-mono text-gray-500 bg-gray-900/50 px-3 py-1 rounded-full border border-white/5">
                        THRESHOLD: 70%
                    </div>
                </Card>
            </div>


            {/* Google-Style Weather Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* UV Index */}
                <Card className="flex flex-col justify-between h-24">
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-bold">
                        <Sun size={14} /> UV Index
                    </div>
                    <div className="text-2xl font-bold text-white">{weather?.uv_index || 0}</div>
                    <div className="text-[10px] text-gray-500">Moderate</div>
                </Card>

                {/* Sunrise */}
                <Card className="flex flex-col justify-between h-24">
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-bold">
                        <Sunrise size={14} /> Sunrise
                    </div>
                    <div className="text-2xl font-bold text-white">06:23</div>
                    <div className="text-[10px] text-gray-500">AM</div>
                </Card>

                {/* Sunset */}
                <Card className="flex flex-col justify-between h-24">
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-bold">
                        <Sunset size={14} /> Sunset
                    </div>
                    <div className="text-2xl font-bold text-white">18:45</div>
                    <div className="text-[10px] text-gray-500">PM</div>
                </Card>

                {/* Humidity */}
                <Card className="flex flex-col justify-between h-24">
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-bold">
                        <Droplets size={14} /> Humidity
                    </div>
                    <div className="text-2xl font-bold text-white">{weather?.humidity}%</div>
                    <div className="text-[10px] text-gray-500">Dew Point: 22°</div>
                </Card>

                {/* Pressure
                <Card className="flex flex-col justify-between h-24">
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-bold">
                        <Activity size={14} /> Pressure
                    </div>
                    <div className="text-2xl font-bold text-white">1013</div>
                    <div className="text-[10px] text-gray-500">hPa</div>
                </Card> */}

                {/* Visibility */}
                <Card className="flex flex-col justify-between h-24">
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-bold">
                        <Eye size={14} /> Visibility
                    </div>
                    <div className="text-2xl font-bold text-white">10 km</div>
                    <div className="text-[10px] text-gray-500">Clear View</div>
                </Card>
            </div>

            {/* Main Widget Grid - Dynamic Ordering Handling (Simulated Grid) */}

            {/* Row 1: The Heavy Hitters */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Fusion Chart (Spans 2 cols) */}
                <Card className="lg:col-span-2 relative p-4 flex flex-col h-[320px]">
                    {/* ... Fusion Chart Content ... */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                <Shield size={14} className="text-emerald-400" />
                                KALMAN FILTER REAL-TIME ANALYSIS
                            </h3>
                            <p className="text-[10px] text-gray-500 mt-1">
                                Fusing Local Sensors ({fusion?.temperature?.local || 'N/A'}) + Public API ({fusion?.temperature?.external || 'N/A'})
                            </p>
                        </div>
                        <Badge type="success">AI ACTIVE</Badge>
                    </div>
                    <div className="flex-1 min-h-0">
                        <FusionChart history={fusionHistory} />
                    </div>
                    {/* Widget Control - Mock */}
                    <button onClick={() => moveWidgetUp('fusion')} className="absolute top-2 right-2 opacity-0 hover:opacity-100 text-gray-500 hover:text-white p-1" title="Move Top"><Move size={12} /></button>
                </Card>

                {/* Decision Panel (1 Col) */}
                <div className="space-y-4">
                    <IndoorOutdoorPanel
                        local={fusion?.pm25?.local}
                        outdoor={aqi?.pm25}
                        recommendation={recommendation}
                    />
                    {/* Exposure Timer (Replacing compact Source for more utility in premium view) */}
                    <div className="h-[160px]">
                        <ExposureTimer pm25={aqi?.pm25 || 0} />
                    </div>
                </div>
            </div>

            {/* Row 2: Analysis & Diary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ForecastPanel forecast={forecast} bestWindows={bestWindows} />
                </div>

                <div className="space-y-4">
                    <div className="h-[180px]">
                        <CauseExplorer weather={weather} aqi={aqi} />
                    </div>
                    <div className="h-[200px]">
                        <DiaryPanel />
                    </div>
                </div>
            </div>

            {/* NEW: Weather News Ticker */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[200px]">
                    <WeatherNews />
                </div>
                <div className="h-[200px]">
                    <AIAnalysisCard weather={weather} aqi={aqi} locationName={activeLocation.name} />
                </div>
            </div>

            {/* NEW: Biosphere DNA Row & Top Locations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[250px]">
                <Card className="lg:col-span-1">
                    <BioSignatureWidget weather={weather} aqi={aqi} />
                </Card>
                <Card className="lg:col-span-2 overflow-hidden flex flex-col">
                    <TopLocations />
                </Card>
            </div>

            {/* Row 3: Advanced Source Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[300px]">
                <Card className="flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Fingerprint size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-bold uppercase text-gray-400">Full Pollution Signature</span>
                    </div>
                    <FingerprintChart data={fingerprint} />
                </Card>

                <Card className="flex flex-col relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={14} className="text-red-400" />
                        <span className="text-[10px] font-bold uppercase text-gray-400">Active Anomalies</span>
                    </div>
                    <div className="space-y-2">
                        {anomalies.map((a, i) => (
                            <div key={i} className="text-xs bg-red-500/10 p-2 rounded text-red-300 border border-red-500/20 flex justify-between">
                                <span className="font-bold">{a.type}</span>
                                <span>{(a.confidence * 100).toFixed(0)}% Conf.</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div >
    );
};

export default ProView;
