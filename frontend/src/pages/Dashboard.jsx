import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LightDashboard from './LightDashboard';
import API_BASE_URL from '../config';

import LocationPermissionPrompt from '../components/LocationPermissionPrompt';
import NotificationPermissionPrompt from '../components/NotificationPermissionPrompt';
import pushNotificationManager from '../utils/pushNotifications';


const Dashboard = ({ initialView }) => {
    const { userProfile, currentUser } = useAuth();

    const [locationDone, setLocationDone] = useState(false);
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

    // Initialize push notification service worker on mount
    useEffect(() => {
        pushNotificationManager.initialize().then(success => {
            if (success) {
                console.log('✅ Push Notification Manager initialized');
            }
        });
    }, []);

    // Show notification prompt after location step is done (granted OR denied)
    useEffect(() => {
        let timeoutId;
        if (locationDone && 'Notification' in window) {
            // Check if already consented
            const userId = currentUser?.email;
            const hasConsented = userId ? localStorage.getItem(`notification_consent_${userId}`) : null;
            const alreadyDenied = Notification.permission === 'denied';

            if (!hasConsented && !alreadyDenied) {
                timeoutId = setTimeout(() => setShowNotificationPrompt(true), 1500);
            }
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [locationDone, currentUser]);

    const handleLocationGranted = async (data) => {
        console.log('📍 Location Permission Granted via Prompt:', data);
        setLocationDone(true);

        // Update Backend
        if (currentUser?.email) {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                await fetch(`${API_BASE_URL}/api/user/location`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        location_lat: data.lat,
                        location_lon: data.lon,
                        location_name: data.name
                    })
                });
                console.log("✅ Location synced to backend");
            } catch (e) {
                console.error("Failed to sync location", e);
            }
        }
    };

    const handleLocationDenied = () => {
        console.log("Location denied by user — still proceeding to notification prompt");
        setLocationDone(true); // Don't block notification prompt
    };

    const handleNotificationGranted = async () => {
        setShowNotificationPrompt(false);
        try {
            await pushNotificationManager.subscribe(API_BASE_URL);
            console.log('✅ Push notifications subscribed');
        } catch (e) {
            console.error('Push subscription failed:', e);
        }
    };

    const handleNotificationDenied = () => {
        setShowNotificationPrompt(false);
    };


    return (
        <>
            {/* Location Permission Prompt — shows until user responds */}
            {!locationDone && (
                <LocationPermissionPrompt
                    userId={currentUser?.email}
                    onPermissionGranted={handleLocationGranted}
                    onPermissionDenied={handleLocationDenied}
                />
            )}

            {/* Notification Permission Prompt — shows after location step */}
            {showNotificationPrompt && (
                <NotificationPermissionPrompt
                    userId={currentUser?.email}
                    onPermissionGranted={handleNotificationGranted}
                    onPermissionDenied={handleNotificationDenied}
                />
            )}

            <LightDashboard initialView={initialView} />

            {/* Manual Location Test Button */}

        </>
    );
};

export default Dashboard;
