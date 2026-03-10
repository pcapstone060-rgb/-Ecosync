const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : "";
if (!API_BASE_URL && import.meta.env.PROD) {
    console.warn("⚠️ EcoSync: VITE_API_BASE_URL is not defined! API calls will fail.");
}

export default API_BASE_URL;
