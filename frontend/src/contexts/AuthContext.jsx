import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE_URL from '../config';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initSession = async () => {
            console.log("AuthContext: Starting initSession");
            const token = localStorage.getItem('access_token');
            console.log("AuthContext: Token found?", !!token);

            if (token) {
                try {
                    console.log("AuthContext: Fetching /me from", API_BASE_URL);

                    // Timeout logic
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s Timeout

                    const response = await fetch(`${API_BASE_URL}/me`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    console.log("AuthContext: Response status", response.status);

                    if (response.ok) {
                        const userData = await response.json();
                        console.log("AuthContext: User data loaded", userData);
                        setCurrentUser({ email: userData.email, name: `${userData.first_name} ${userData.last_name}` });
                        setUserProfile(userData);
                    } else {
                        console.warn("AuthContext: Token invalid, clearing");
                        localStorage.removeItem('access_token');
                    }
                } catch (e) {
                    console.error("Session init error", e);
                    // Clear invalid token on error
                    localStorage.removeItem('access_token');
                }
            }
            console.log("AuthContext: Setting loading false");
            setLoading(false);
        };

        initSession();
    }, []);

    // --- REAL AUTHENTICATION ---

    // Login
    const login = async (email, password, locationData = {}) => {
        try {
            const formData = new FormData();
            formData.append('username', email); // OAuth2 expects 'username'
            formData.append('password', password);

            // Timeout logic
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout

            console.log("AuthContext: Login POST to", `${API_BASE_URL}/token`);
            const response = await fetch(`${API_BASE_URL}/token`, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            console.log("AuthContext: Login Response status", response.status);

            if (!response.ok) {
                let errorData;
                const errorText = await response.text();
                try {
                    errorData = JSON.parse(errorText);
                } catch (jsonError) {
                    console.error("Failed to parse error response JSON:", jsonError, errorText);
                    throw new Error(`Server Error (${response.status}): The server encountered an issue.`);
                }

                let msg = errorData.detail || 'Login failed';
                if (typeof msg === 'object') {
                    if (Array.isArray(msg)) {
                        msg = msg.map(e => e.msg || JSON.stringify(e)).join(', ');
                    } else {
                        msg = JSON.stringify(msg);
                    }
                }
                throw new Error(msg);
            }

            const data = await response.json();

            // Success
            localStorage.setItem('access_token', data.access_token);

            const user = { email: email, name: data.user_name };
            setCurrentUser(user);
            setUserProfile({
                plan: data.plan,
                first_name: data.user_name.split(' ')[0],
                last_name: data.user_name.split(' ')[1] || '',
                location_lat: locationData.lat,
                location_lon: locationData.lon,
                location_name: locationData.name
            });

            return { data, error: null };

        } catch (error) {
            console.error("Login Error:", error);
            if (error.name === 'AbortError') {
                return { data: null, error: new Error("Server Timeout. Please check your internet or retry.") };
            }
            return { data: null, error };
        }
    };

    // Signup
    const signup = async (email, password, extraData) => {
        try {
            const payload = {
                email,
                password,
                first_name: extraData.first_name || 'User',
                last_name: extraData.last_name || 'New',
                plan: extraData.plan || 'lite',
                location_name: extraData.location_name,
                location_lat: extraData.location_lat,
                location_lon: extraData.location_lon
            };

            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (jsonError) {
                    console.error("Failed to parse error response JSON:", jsonError);
                    // If parsing fails, it's likely an HTML 500 or 404 page
                    throw new Error(`Server Error (${response.status}): The server encountered an issue.`);
                }

                let msg = errorData.detail || 'Registration failed';
                if (typeof msg === 'object') {
                    if (Array.isArray(msg)) {
                        msg = msg.map(e => e.msg || JSON.stringify(e)).join(', ');
                    } else {
                        msg = JSON.stringify(msg);
                    }
                }
                throw new Error(msg);
            }

            const data = await response.json();

            // Success
            localStorage.setItem('access_token', data.access_token);

            const user = { email: email, name: data.user_name };
            setCurrentUser(user);
            setUserProfile({
                plan: data.plan,
                first_name: extraData.first_name,
                last_name: extraData.last_name
            });

            return { data, error: null };

        } catch (error) {
            console.error("Signup Error:", error);
            return { data: null, error };
        }
    };

    const logout = async () => {
        localStorage.removeItem('access_token');
        setCurrentUser(null);
        setUserProfile(null);
    };

    const value = {
        currentUser,
        userProfile,
        loading,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex h-screen w-full items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                        <div className="text-emerald-500/60 text-xs font-mono tracking-widest animate-pulse">
                            INITIALIZING BIO-LINK...
                        </div>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
// aria-label
// aria-label
