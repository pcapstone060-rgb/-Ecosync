export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (isDev ? 'http://localhost:8000' : '');

export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ||
    (isDev ? 'ws://localhost:8000' : API_BASE_URL.replace(/^http/, 'ws'));

// Helper to build API URLs
export const buildApiUrl = (path) => {
    return `${API_BASE_URL}${path}`;
};

// Helper to build WebSocket URLs
export const buildWsUrl = (path) => {
    return `${WS_BASE_URL}${path}`;
};

export default {
    API_BASE_URL,
    WS_BASE_URL,
    buildApiUrl,
    buildWsUrl,
};
