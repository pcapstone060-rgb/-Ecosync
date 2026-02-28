export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : '';

export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL !== undefined ? import.meta.env.VITE_WS_BASE_URL : '';

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
