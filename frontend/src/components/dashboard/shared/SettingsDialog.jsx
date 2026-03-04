import React from 'react';
import { X, Bell, Shield, Moon, Wifi } from 'lucide-react';
import API_BASE_URL from '../../../config';
import { useAuth } from '../../../contexts/AuthContext';

const SettingsDialog = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const [tempThresh, setTempThresh] = React.useState(45);
    const [humMin, setHumMin] = React.useState(20);
    const [humMax, setHumMax] = React.useState(80);
    const [pm25Thresh, setPm25Thresh] = React.useState(150);
    const [loading, setLoading] = React.useState(false);
    const [saved, setSaved] = React.useState(false);

    React.useEffect(() => {
        if (isOpen && currentUser?.email) {
            // Fetch settings for CURRENT user
            // Fetch settings for CURRENT user
            // Fix: Handle relative API_BASE_URL by providing window.location.origin as base
            const url = new URL(`${API_BASE_URL}/api/settings/alerts`, window.location.origin);
            url.searchParams.append('email', currentUser.email);

            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data.temp_threshold) setTempThresh(data.temp_threshold);
                    if (data.humidity_min) setHumMin(data.humidity_min);
                    if (data.humidity_max) setHumMax(data.humidity_max);
                    if (data.pm25_threshold) setPm25Thresh(data.pm25_threshold);
                })
                .catch(err => console.error("Failed to load settings:", err));
        }
    }, [isOpen, currentUser]);

    const handleSave = async () => {
        if (!currentUser?.email) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/settings/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_email: currentUser.email,
                    temp_threshold: parseFloat(tempThresh),
                    humidity_min: parseFloat(humMin),
                    humidity_max: parseFloat(humMax),
                    pm25_threshold: parseFloat(pm25Thresh),
                    is_active: true
                })
            });
            console.log("Settings Save Response:", response.status);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Server Error: ${response.status} - ${text}`);
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Save Settings Error:", err);
            alert(`Failed to save settings: ${err.message}`);
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e2329] border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold text-white tracking-wide">SYSTEM SETTINGS</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Section 1 */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-2">
                            <Bell size={14} /> Alert Configuration
                        </h3>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 mb-4">
                            <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Authenticated Account</p>
                            <p className="text-sm text-white font-medium">{currentUser?.email || 'System Default'}</p>
                            <p className="text-[10px] text-gray-400 mt-2 italic">* Security alerts are automatically routed to your verified login email.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Max Temp (°C)</label>
                                <input
                                    type="number"
                                    value={tempThresh}
                                    onChange={(e) => setTempThresh(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Max PM2.5</label>
                                <input
                                    type="number"
                                    value={pm25Thresh}
                                    onChange={(e) => setPm25Thresh(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Min Humidity (%)</label>
                                <input
                                    type="number"
                                    value={humMin}
                                    onChange={(e) => setHumMin(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Max Humidity (%)</label>
                                <input
                                    type="number"
                                    value={humMax}
                                    onChange={(e) => setHumMax(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none"
                                />
                            </div>
                        </div>


                    </div>

                    {/* Section 2 */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-2">
                            <Wifi size={14} /> Connectivity
                        </h3>
                        <label className="flex items-center justify-between group cursor-pointer">
                            <span className="text-sm text-gray-300 group-hover:text-white">Data Saver Mode</span>
                            <input type="checkbox" className="toggle-checkbox" />
                        </label>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-amber-500 uppercase flex items-center gap-2">
                            <Shield size={14} /> Privacy
                        </h3>
                        <label className="flex items-center justify-between group cursor-pointer">
                            <span className="text-sm text-gray-300 group-hover:text-white">Anonymous Data Contribution</span>
                            <input type="checkbox" defaultChecked className="toggle-checkbox" />
                        </label>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg text-xs tracking-widest transition-all shadow-lg shadow-emerald-900/20 ${saved ? 'bg-green-500' : ''}`}
                    >
                        {loading ? 'SAVING...' : saved ? 'SAVED!' : 'SAVE CONFIG'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsDialog;
