const ENV_API_URL = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = (ENV_API_URL && ENV_API_URL.trim() !== "") ? ENV_API_URL : "https://ecosync-backend-slb3.onrender.com";

if (!import.meta.env.VITE_API_BASE_URL && import.meta.env.PROD) {
    console.warn("⚠️ EcoSync: VITE_API_BASE_URL is not defined! Using fallback URL:", API_BASE_URL);
}

export default API_BASE_URL;
