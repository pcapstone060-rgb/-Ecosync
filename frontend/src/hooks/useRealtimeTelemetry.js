import { useState, useEffect, useRef, useCallback } from 'react';
import API_BASE_URL from '../config';

const MAX_BUFFER_SIZE = 50; // Keep last 50 readings for sparklines/graphs
const POLLING_INTERVAL = 2000; // 2s (Target < 2s delay)

export const useRealtimeTelemetry = (isProMode) => {
    const [telemetry, setTelemetry] = useState({
        current: null, // Latest reading
        history: [],   // Array of readings
        status: 'CONNECTING', // CONNECTING, ONLINE, OFFLINE, STALE
        lastUpdated: null
    });

    const [alerts, setAlerts] = useState([]);
    const [quality, setQuality] = useState({
        calibrationStatus: 'OK',
        driftDetected: false,
        anomalies: []
    });

    const bufferRef = useRef([]);
    const wsRef = useRef(null);
    const retryCount = useRef(0);

    // Mock WebSocket connection logic (Ready for real WS)
    const connectWebSocket = useCallback(() => {
        // Placeholder for future WS implementation
        // const ws = new WebSocket(import.meta.env.VITE_WS_BASE_URL || '/ws');
        // ws.onmessage = ...
        return null;
    }, []);

    // Core Data Fetcher (Polling Fallback)
    const fetchTelemetry = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            // Parallel fetch for low latency (<200ms target)
            const [dataRes, alertsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/iot/latest`), // Fast endpoint
                fetch(`${API_BASE_URL}/alerts?limit=5`, { headers })
            ]);

            if (!dataRes.ok) throw new Error('Telemetry fetch failed');

            const latestData = await dataRes.json();
            const alertData = await alertsRes.json();

            // Check staleness (Performance Target)
            const now = Date.now();
            const dataTime = new Date(latestData.timestamp).getTime();
            const isStale = (now - dataTime) > 10000; // >10s old

            // Update Buffer
            const newPoint = {
                ...latestData,
                recvTime: now,
                // Use real Kalman data from backend if available, else simulate (or null)
                kalman_temp: latestData.kalman_temp ?? (latestData.temperature ? latestData.temperature * 0.98 + 0.5 : null)
            };

            bufferRef.current = [...bufferRef.current, newPoint].slice(-MAX_BUFFER_SIZE);

            setTelemetry(prev => ({
                current: newPoint,
                history: bufferRef.current,
                status: isStale ? 'STALE' : 'ONLINE',
                lastUpdated: now
            }));

            setAlerts(alertData);

            // Simulated Anomaly Check
            if (latestData.temperature > 50) {
                setQuality(q => ({ ...q, anomalies: [...q.anomalies, { type: 'High Temp', time: now }] }));
            }

        } catch (err) {
            console.error("Telemetry Error:", err);
            setTelemetry(prev => ({ ...prev, status: 'OFFLINE' }));
        }
    }, []);

    useEffect(() => {
        // Initial Fetch
        fetchTelemetry();

        // Polling Interval
        const interval = setInterval(fetchTelemetry, POLLING_INTERVAL);

        return () => clearInterval(interval);
    }, [fetchTelemetry]);

    return {
        data: telemetry.current,
        history: telemetry.history,
        status: telemetry.status,
        lastUpdated: telemetry.lastUpdated,
        alerts,
        quality
    };
};
