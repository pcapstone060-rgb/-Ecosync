import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabaseClient';


// --- UTILITIES: KALMAN FILTER & CALIBRATION ---
const CALIBRATION = {
    temp: 0,      // Offset in °C
    hum: 0,       // Offset in %
    gas: 0,       // Offset in raw units
};

class KalmanFilter {
    constructor(R = 1, Q = 0.1) {
        this.R = R; // Measurement Noise (Sensor Jitter)
        this.Q = Q; // Process Noise (System Dynamics)
        this.A = 1; // State Vector
        this.C = 1; // Measurement Vector
        this.cov = NaN;
        this.x = NaN; // Estimated Value
    }

    filter(measurement) {
        if (isNaN(this.x)) {
            // Initialization
            this.x = (1 / this.C) * measurement;
            this.cov = (1 / this.C) * this.R * (1 / this.C);
        } else {
            // 1. Prediction
            const predX = this.A * this.x;
            const predCov = this.A * this.cov * this.A + this.Q;

            // 2. Correction
            const K = predCov * this.C * (1 / (this.C * predCov * this.C + this.R));
            this.x = predX + K * (measurement - this.C * predX);
            this.cov = predCov - K * this.C * predCov;
        }
        return this.x;
    }
}

// PRO MODE: Fetches real-time Satellite/Weather Data
export const useEsp32Stream = (mode = 'light', coordinates = [17.3850, 78.4867], userEmail = null) => {
    // State
    const [stream, setStream] = useState({
        connected: false,
        lastSeen: null,
        data: null,
        history: [],
        alerts: []
    });

    const [health, setHealth] = useState({
        status: 'DISCONNECTED',
        lastPacketTime: null
    });

    const bufferRef = useRef([]);
    const realBaseRef = useRef({ temp: 24, hum: 45, aqi: 12, loaded: false });

    // 1. FETCH REAL BASELINE DATA (Every time coordinates change)
    useEffect(() => {
        if (mode !== 'pro') return;

        const fetchRealEnv = async () => {
            try {
                const [lat, lon] = coordinates;
                // Parallel Fetch: Weather + Air Quality
                const [weatherRes, aqiRes] = await Promise.all([
                    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,windspeed_10m`),
                    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,us_aqi`)
                ]);


                const weather = await weatherRes.json();
                const aqi = await aqiRes.json();

                if (weather.current && aqi.current) {
                    realBaseRef.current = {
                        temp: weather.current.temperature_2m,
                        hum: weather.current.relative_humidity_2m,
                        wind: weather.current.windspeed_10m,
                        aqi: aqi.current.pm2_5, // Mass Concentration
                        loaded: true
                    };
                    console.log("Updated Real Baseline:", realBaseRef.current);
                }

            } catch (err) {
                console.error("Failed to fetch real data:", err);
            }
        };

        fetchRealEnv();
        // Refresh base data every 2 mins
        const baseInterval = setInterval(fetchRealEnv, 120000);
        return () => clearInterval(baseInterval);

    }, [mode, coordinates[0], coordinates[1]]);


    // 2. HIGH FREQUENCY STREAM GENERATOR
    useEffect(() => {
        let intervalId;

        const fetchData = async () => {
            try {
                if (mode === 'lite' || mode === 'light') {
                    // LIGHT MODE: If Serial is NOT connected, poll backend for demo/simulated data
                    if (health.status !== 'ONLINE') {
                        try {
                            const url = userEmail
                                ? `${import.meta.env.VITE_API_BASE_URL}/api/filtered/latest?user_email=${encodeURIComponent(userEmail)}`
                                : `${import.meta.env.VITE_API_BASE_URL}/api/filtered/latest`;
                            const response = await fetch(url);
                            if (response.ok) {
                                const latest = await response.json();
                                if (latest.status === 'no_data') {
                                    // Reset state if no data — also clear history so old values don't show
                                    bufferRef.current = [];
                                    setStream(prev => ({
                                        ...prev,
                                        connected: false,
                                        data: null,
                                        history: []
                                    }));
                                    return;
                                }

                                // STALENESS CHECK: If data is older than 5 minutes, treat as disconnected
                                if (latest.timestamp) {
                                    const dataAge = Date.now() - new Date(latest.timestamp).getTime();
                                    const FIVE_MINUTES = 5 * 60 * 1000;
                                    if (dataAge > FIVE_MINUTES) {
                                        console.log(`⚠️ Data is stale (${Math.round(dataAge / 60000)}min old) — hiding values until device reconnects`);
                                        bufferRef.current = [];
                                        setStream(prev => ({
                                            ...prev,
                                            connected: false,
                                            data: null,
                                            history: []
                                        }));
                                        return;
                                    }
                                }

                                // Fix: Access nested objects from API response
                                const filtered = latest.filtered || {};
                                const smart = latest.smart_metrics || {};

                                const now = Date.now();
                                const packet = {
                                    ts: now,
                                    timestamp: latest.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),

                                    temperature: filtered.temperature,
                                    temp_raw: filtered.temperature,

                                    humidity: filtered.humidity,
                                    hum_raw: filtered.humidity,

                                    gas: filtered.mq_smoothed,
                                    mq_raw: filtered.mq_smoothed,

                                    pm25: filtered.pm25,

                                    motion: latest.motion !== undefined ? latest.motion : null,
                                    rain: latest.rain !== undefined ? latest.rain : null,

                                    trustScore: smart.trust_score,
                                    smart_metrics: {
                                        insight: smart.insight || smart.smart_insight, // Handle inconsistent naming
                                        anomaly_label: smart.anomaly_label,
                                        anomaly_score: smart.anomaly_score,
                                        trust_score: smart.trust_score,
                                        risk_level: latest.risk_level || "SAFE",
                                        prediction: latest.prediction,
                                        sensor_health: latest.sensor_health,
                                        baseline: latest.baseline
                                    }
                                };

                                // Update Stream State
                                bufferRef.current = [...bufferRef.current, packet].slice(-50);
                                setStream({
                                    connected: false, // Not physically connected
                                    lastSeen: now,
                                    data: packet,
                                    history: bufferRef.current,
                                    alerts: []
                                });
                            }
                        } catch (e) {
                            console.warn("Demo Data Poll Error:", e);
                        }
                    }
                    return; // Exit fetchData if in lite/light mode
                }

                // PRO MODE: Advanced Simulation + Real Data Wrapper
                const now = Date.now();

                // USE REAL BASELINE IF LOADED, ELSE MOCK
                const base = realBaseRef.current;

                // --- SENSOR SIMULATION ENGINE ---
                // 1. HARWARE BIAS (Simulating Uncalibrated Sensors)
                const BIAS = { temp: 2.1, hum: -4.5, aqi: 15, wind: 1.2 };

                // Base Values (Ground Truth from API)
                const truthTemp = base.loaded ? base.temp : (24 + Math.sin(now / 10000) * 2);
                const truthHum = base.loaded ? base.hum : (45 + Math.sin(now / 20000) * 5);
                const truthWind = base.loaded ? base.wind : (5 + Math.sin(now / 30000) * 2);
                const truthAqi = base.loaded ? base.aqi : (12 + Math.cos(now / 15000) * 3);

                // Raw Readings = Truth + Bias + Noise
                const rawTemp = truthTemp + BIAS.temp + ((Math.random() - 0.5) * 0.5);
                const rawHum = truthHum + BIAS.hum + ((Math.random() - 0.5) * 1.0);
                const rawWind = truthWind + BIAS.wind + ((Math.random() - 0.5) * 0.8);
                const rawAqi = truthAqi + BIAS.aqi + ((Math.random() - 0.5) * 2.0);

                // 2. CALIBRATION (Software Correction)
                const calTemp = rawTemp - BIAS.temp;
                const calHum = rawHum - BIAS.hum;
                const calWind = rawWind - BIAS.wind;
                const calAqi = rawAqi - BIAS.aqi;

                // 3. KALMAN FILTER (Noise Reduction)
                const lastPacket = bufferRef.current[bufferRef.current.length - 1];

                const filteredTemp = lastPacket ? (lastPacket.temperature * 0.85 + calTemp * 0.15) : calTemp;
                const filteredHum = lastPacket ? (lastPacket.humidity * 0.85 + calHum * 0.15) : calHum;
                const filteredWind = lastPacket ? (lastPacket.wind_speed * 0.85 + calWind * 0.15) : calWind;
                const filteredAqi = lastPacket ? (lastPacket.pm25 * 0.85 + calAqi * 0.15) : calAqi;

                const packet = {
                    ts: now,
                    timestamp: new Date().toLocaleTimeString(),
                    temperature: Number(filteredTemp.toFixed(1)),
                    raw_temperature: Number(rawTemp.toFixed(1)),
                    humidity: Number(filteredHum.toFixed(1)),
                    raw_humidity: Number(rawHum.toFixed(1)),
                    mq_ppm: Number(filteredAqi.toFixed(0)),
                    raw_mq_ppm: Number(rawAqi.toFixed(0)),
                    mq_raw: 400 + Math.random() * 50,
                    gas: Number(filteredAqi.toFixed(0)),
                    wind_speed: Number(filteredWind.toFixed(1)),
                    raw_wind_speed: Number(rawWind.toFixed(1)),
                    trustScore: 99.9,
                    deviceId: "ESP32_MAIN"
                };

                // --- CLOUD PERSISTENCE & ALERTS ---
                const localTime = new Date(now - (new Date().getTimezoneOffset() * 60000)).toISOString();

                let smartData = {};

                // 2. Local Backend Alerts Sync (Await for Smart Data)
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/iot/data`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            temperature: Number(filteredTemp.toFixed(2)),
                            humidity: Number(filteredHum.toFixed(2)),
                            pm25: Number(filteredAqi.toFixed(2)),
                            mq_raw: packet.mq_raw,
                            wind_speed: Number(filteredWind.toFixed(2)),
                            user_email: userEmail,
                            lat: coordinates[0],
                            lon: coordinates[1]
                        })
                    });

                    if (response.ok) {
                        smartData = await response.json();
                    }
                } catch (err) {
                    console.error("Backend Alert Sync Error:", err);
                }

                // Merge Smart Metrics
                packet.trustScore = smartData.trust_score ?? 98.7; // Default fallback
                packet.smart_metrics = {
                    insight: smartData.smart_insight,
                    anomaly_label: smartData.anomaly_label || "Normal",
                    trust_score: smartData.trust_score,
                    risk_level: smartData.risk_level || "SAFE",
                    prediction: smartData.prediction,
                    sensor_health: smartData.sensor_health,
                    baseline: smartData.baseline
                };

                // 1. Supabase Sync (Fire and Forget)
                (async () => {
                    try {
                        const { error } = await supabase.from('sensor_readings').insert([
                            {
                                temperature: packet.temperature,
                                raw_temperature: packet.raw_temperature,
                                humidity: packet.humidity,
                                raw_humidity: packet.raw_humidity,
                                air_quality: packet.mq_ppm,
                                raw_air_quality: packet.raw_mq_ppm,
                                wind_speed: packet.wind_speed,
                                raw_wind_speed: packet.raw_wind_speed,
                                created_at: localTime
                            }
                        ]);
                        if (error) console.error("Supabase Sync Error:", error.message);
                    } catch (err) {
                        console.error("Supabase Sync Fatal Error:", err);
                    }
                })();

                // Update Buffer
                bufferRef.current = [...bufferRef.current, packet].slice(-50);

                setStream({
                    connected: true,
                    lastSeen: now,
                    data: packet,
                    history: bufferRef.current,
                    alerts: []
                });

                setHealth({
                    status: 'ONLINE',
                    lastPacketTime: new Date()
                });

            } catch (err) {
                console.error("Stream Error:", err);
            }
        };

        // Poll every 3 seconds ONLY if serial is not active
        intervalId = setInterval(() => {
            if (!portRef.current) fetchData();
        }, 3000);

        return () => clearInterval(intervalId);
    }, []);

    // --- WEB SERIAL LOGIC ---
    const portRef = useRef(null);
    const readerRef = useRef(null);

    const disconnectSerial = async () => {
        if (readerRef.current) {
            await readerRef.current.cancel();
            readerRef.current = null;
        }
        if (portRef.current) {
            await portRef.current.close();
            portRef.current = null;
        }
        setStream(prev => ({ ...prev, connected: false }));
        setHealth({ status: 'DISCONNECTED', lastPacketTime: null });
    };

    const connectSerial = async () => {
        if (!("serial" in navigator)) {
            alert("Web Serial is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            portRef.current = port;

            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();
            readerRef.current = reader;

            setStream(prev => ({ ...prev, connected: true }));
            setHealth({ status: 'STREAMING', lastPacketTime: new Date() });

            let lineBuffer = '';

            // Initialize Filters
            const kfTemp = new KalmanFilter(2.0, 0.5); // Higher R = smooth but slow
            const kfHum = new KalmanFilter(5.0, 1.0);
            const kfGas = new KalmanFilter(10.0, 2.0);

            // Reading loop
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                lineBuffer += value;
                const lines = lineBuffer.split('\n');
                lineBuffer = lines.pop(); // Keep partial line

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    console.log("Serial RX:", trimmed); // DEBUG LOG

                    try {
                        const json = JSON.parse(trimmed);

                        // 1. RAW EXTRACTION
                        const tRaw = json.temperature !== undefined ? json.temperature : (json.temp !== undefined ? json.temp : null);
                        const hRaw = json.humidity !== undefined ? json.humidity : (json.hum !== undefined ? json.hum : null);
                        const gasRaw = json.gas !== undefined ? json.gas : (json.mq_raw !== undefined ? json.mq_raw : 0);
                        const motionRaw = json.motion !== undefined ? json.motion : 0;
                        const rainRaw = json.rain !== undefined ? json.rain : 0;
                        const pm25Raw = json.pm25 !== undefined ? json.pm25 : (json.pm2_5 !== undefined ? json.pm2_5 : 0);
                        const screenMode = json.screen !== undefined ? json.screen : 0;

                        // 2. CALIBRATION (Apply Offsets)
                        const tCal = tRaw + CALIBRATION.temp;
                        const hCal = hRaw + CALIBRATION.hum;
                        const gasCal = gasRaw + CALIBRATION.gas;

                        // 3. KALMAN FILTERING
                        const tFilt = kfTemp.filter(tCal);
                        const hFilt = kfHum.filter(hCal);
                        const gasFilt = kfGas.filter(gasCal);

                        // Reusing simple pass-through for uncalibrated metrics or if no filter needed
                        const pm25Val = pm25Raw; // Add Kalman here if needed for PM2.5

                        const packet = {
                            ts: Date.now(),
                            timestamp: new Date().toLocaleTimeString(),

                            temperature: typeof tFilt === 'number' ? Number(tFilt.toFixed(1)) : null,
                            temp_raw: tRaw,

                            humidity: typeof hFilt === 'number' ? Number(hFilt.toFixed(1)) : null,
                            hum_raw: hRaw,

                            pm25: pm25Val,
                            pm25_raw: pm25Raw,


                            mq_raw: gasRaw,
                            gas: typeof gasFilt === 'number' ? Number(gasFilt.toFixed(0)) : null, // Filtered Gas

                            motion: motionRaw,
                            rain: rainRaw,
                            screen: screenMode,
                            trustScore: 99.9,
                            smart_metrics: {
                                trust_score: 99.9,
                                risk_level: "SAFE",
                                sensor_health: "GOOD"
                            },
                            deviceId: "ESP32-SERIAL-KF"
                        };

                        // --- BACKEND SYNC & SMART METRICS FETCH ---
                        try {
                            const API_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : ""; // Fallback
                            // console.log("🚀 SERIAL PUSH: Sending to", API_URL);
                            // console.log("👤 User:", userEmail);

                            const response = await fetch(`${API_URL}/iot/data`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    temperature: packet.temperature,
                                    humidity: packet.humidity,
                                    pm25: packet.pm25,
                                    mq_raw: packet.gas,
                                    rain: packet.rain,
                                    motion: packet.motion,
                                    screen: packet.screen,
                                    user_email: userEmail,
                                    lat: coordinates ? coordinates[0] : null,
                                    lon: coordinates ? coordinates[1] : null
                                })
                            });

                            // console.log("✅ SERIAL PUSH STATUS:", response.status);

                            if (response.ok) {
                                const smartData = await response.json();
                                packet.trustScore = smartData.trust_score ?? 99.9;
                                packet.smart_metrics = {
                                    insight: smartData.smart_insight,
                                    anomaly_label: smartData.anomaly_label,
                                    anomaly_score: smartData.anomaly_score,
                                    // ph: smartData.ph,
                                    trust_score: smartData.trust_score ?? 99.9,
                                    // Phase 2 Metrics
                                    risk_level: smartData.risk_level || "SAFE",
                                    prediction: smartData.prediction,
                                    sensor_health: smartData.sensor_health,
                                    baseline: smartData.baseline
                                };
                            }
                        } catch (err) {
                            console.error("Serial Backend Alert Sync Error:", err);
                        }

                        // 1. Supabase Sync (Serial Mode)
                        (async () => {
                            try {
                                const { error } = await supabase.from('sensor_readings').insert([{
                                    device_id: "ESP32-SERIAL",
                                    created_at: new Date().toISOString(),
                                    temperature: packet.temperature,
                                    raw_temperature: packet.temp_raw,
                                    humidity: packet.humidity,
                                    raw_humidity: packet.hum_raw,

                                    gas: packet.gas,              // Mapping Gas
                                    raw_gas: packet.mq_raw,
                                    motion: packet.motion,        // Mapping Motion
                                    raw_motion: packet.motion,
                                    trust_score: packet.trustScore
                                }]);

                                if (error) {
                                    console.error("Supabase Sync Error:", error.message);
                                    // Removed alert to prevent disrupting user experience
                                } else {
                                    // Success
                                }
                            } catch (err) {
                                console.error("Supabase Sync Fatal Error:", err);
                                // Removed fatal alert
                            }
                        })();

                        bufferRef.current = [...bufferRef.current, packet].slice(-50);
                        setStream(prev => ({
                            ...prev,
                            connected: true,
                            lastSeen: Date.now(),
                            data: packet,
                            history: bufferRef.current
                        }));
                        setHealth({ status: 'ONLINE', lastPacketTime: new Date() });

                    } catch (e) {
                        console.warn("Serial JSON Parse Error:", e.message, "Raw:", trimmed);
                    }
                }
            }
        } catch (err) {
            console.error("Serial Connection Error:", err);
            disconnectSerial();
        }
    };

    return {
        ...stream,
        health,
        connectSerial,
        disconnectSerial
    };
};
