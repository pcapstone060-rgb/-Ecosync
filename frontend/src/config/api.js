const ENV_API_URL = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = (ENV_API_URL && ENV_API_URL.trim() !== "") ? ENV_API_URL : 'https://ecosync-backend-slb3.onrender.com';

const ENV_WS_URL = import.meta.env.VITE_WS_BASE_URL;
export const WS_BASE_URL = (ENV_WS_URL && ENV_WS_URL.trim() !== "") ? ENV_WS_URL : 'wss://ecosync-backend-slb3.onrender.com';

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
