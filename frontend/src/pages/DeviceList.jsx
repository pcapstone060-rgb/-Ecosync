import React, { useState, useEffect } from 'react';
import { Plus, Search, Server, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

const DeviceList = () => {
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState(null);
    const [loading, setLoading] = useState(false);

    // Form State
    const [deviceName, setDeviceName] = useState('');
    const [locationInput, setLocationInput] = useState('');

    // Created Device Info (for ESP32 display)
    const [createdDevice, setCreatedDevice] = useState(null);

    const fetchDevices = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/devices`);
            const data = await res.json();
            setDevices(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchDevices();
        const interval = setInterval(fetchDevices, 5000);
        return () => clearInterval(interval);
    }, []);

    const resetModal = () => {
        setShowModal(false);
        setStep(1);
        setSelectedType(null);
        setDeviceName('');
        setLocationInput('');
        setCreatedDevice(null);
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            // If Virtual, we need coords from city (simplified here to just 0,0 or random for demo if strictly needed, 
            // but let's assume user inputs city name and we do loose geocoding or just store name if backend supports it.
            // For now, adhering to backend requesting lat/lon. I'll mock lat/lon for the demo or use previous logic if I can.
            // Actually, let's use a default Location for ESP32 and Virtual if not provided.

            let lat = 0, lon = 0;
            // Simple random pos near Paris for demo if not provided
            if (selectedType === 'public_api' || selectedType === 'esp32') {
                lat = 48.85 + (Math.random() - 0.5) * 0.1;
                lon = 2.35 + (Math.random() - 0.5) * 0.1;
            }

            const res = await fetch(`${API_BASE_URL}/api/devices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceName: deviceName,
                    connectorType: selectedType,
                    location: { lat, lon }
                })
            });
            const data = await res.json();

            if (selectedType === 'esp32') {
                setCreatedDevice(data);
                setStep(3); // Show Config
            } else {
                resetModal();
                fetchDevices();
            }
        } catch (e) {
            alert("Creation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-8 animate-in pb-24 font-mono">
            <header className="flex justify-between items-center border-b border-cyan-500/20 pb-6">
                <div>
                    <h1 className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2 font-black tracking-tighter uppercase">
                        Active Fleet
                    </h1>
                    <p className="text-slate-400 text-xs tracking-widest uppercase">Area Management Console</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded text-sm font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] uppercase tracking-wide">
                    <Plus size={16} /> Deploy Area
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map(dev => (
                    <div
                        key={dev.id}
                        onClick={() => navigate(`/devices/${dev.id}`)}
                        className="glass-panel p-6 cursor-pointer hover:border-cyan-500/50 transition-all group relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded border ${dev.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                                <Server size={20} />
                            </div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest border border-slate-700 px-2 py-1 rounded">
                                {dev.connector_type}
                            </span>
                        </div>

                        <h3 className="font-bold text-white text-lg group-hover:text-cyan-400 transition-colors mb-2 uppercase tracking-tight">{dev.name}</h3>

                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                            <span className={`w-2 h-2 rounded-full ${dev.status === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-900 border border-red-500'}`} />
                            {dev.status === 'online' ? 'LINK ESTABLISHED' : 'NO CARRIER'}
                        </div>

                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>

            {/* WIZARD MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <div className="glass-panel w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-cyan-500/20 flex justify-between items-center bg-cyan-950/20">
                            <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <span className="text-cyan-500">{">>"}</span> DEPLOYMENT WIZARD // STEP {step}
                            </h2>
                            <button onClick={resetModal} className="text-slate-500 hover:text-white transition-colors">CLOSE [X]</button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            {step === 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <button
                                        onClick={() => { setSelectedType('esp32'); setStep(2); }}
                                        className="group p-6 border border-slate-700 hover:border-cyan-500 bg-slate-900/50 hover:bg-cyan-900/10 rounded-xl transition-all text-left"
                                    >
                                        <div className="mb-4 p-4 bg-slate-800 rounded-lg w-fit group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                                            <Server size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">PHYSICAL NODE (ESP32)</h3>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Generate credentials/topics to flash onto a hardware controller.
                                        </p>
                                    </button>

                                    <button
                                        onClick={() => { setSelectedType('public_api'); setStep(2); }}
                                        className="group p-6 border border-slate-700 hover:border-emerald-500 bg-slate-900/50 hover:bg-emerald-900/10 rounded-xl transition-all text-left"
                                    >
                                        <div className="mb-4 p-4 bg-slate-800 rounded-lg w-fit group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                                            <MapPin size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">VIRTUAL SIMULATION</h3>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Create a software-defined node using public weather/AQI APIs.
                                        </p>
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 max-w-md mx-auto">
                                    <div className="space-y-2">
                                        <label className="text-xs text-cyan-500 uppercase font-bold tracking-wider">Area Identifier</label>
                                        <input
                                            autoFocus
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-4 text-white focus:border-cyan-500 outline-none font-mono text-lg"
                                            placeholder="UNIT-ALPHA-01"
                                            value={deviceName}
                                            onChange={(e) => setDeviceName(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={handleCreate}
                                        disabled={!deviceName || loading}
                                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] disabled:opacity-50"
                                    >
                                        {loading ? 'INITIALIZING...' : 'INITIATE DEPLOYMENT'}
                                    </button>
                                </div>
                            )}

                            {step === 3 && createdDevice && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded text-center">
                                        <p className="text-emerald-400 font-bold">DEVICE REGISTERED SUCCESSFULLY</p>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-300">Flash these constants into your ESP32 <code className="bg-slate-800 px-1 rounded">main.cpp</code>:</p>

                                        <div className="bg-slate-950 border border-slate-800 rounded p-4 font-mono text-xs overflow-x-auto relative group">
                                            <div className="text-slate-500 mb-2">// WiFi & MQTT Configuration</div>
                                            <div className="space-y-1">
                                                <p><span className="text-cyan-400">const char*</span> ssid = <span className="text-green-400">"Wokwi-GUEST"</span>;</p>
                                                <p><span className="text-cyan-400">const char*</span> mqtt_server = <span className="text-green-400">"test.mosquitto.org"</span>;</p>
                                                <p><span className="text-cyan-400">const int</span> mqtt_port = <span className="text-cyan-400">1883</span>;</p>
                                                <br />
                                                <div className="text-slate-500">// Device Specific Topic</div>
                                                <p><span className="text-cyan-400">const char*</span> mqtt_topic = <span className="text-green-400">"devices/{createdDevice.id}/data"</span>;</p>
                                                <br />
                                                <div className="text-slate-500">// Payload Format</div>
                                                <p className="text-slate-400">{"{"}</p>
                                                <p className="pl-4 text-green-400">"temperature": 25.5,</p>
                                                <p className="pl-4 text-green-400">"humidity": 60</p>
                                                <p className="text-slate-400">{"}"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={resetModal}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded transition-all"
                                    >
                                        DONE
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeviceList;
// <title> <meta name="description" /> <meta property="og:title" />
