"""
API Cache Module
In-memory cache with TTL for external API data.
Used to serve real-time map data without hitting rate limits.
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import random
import pytz

def get_local_time():
    local_tz = pytz.timezone('Asia/Kolkata')
    return datetime.now(local_tz).replace(tzinfo=None)

class APICache:
    def __init__(self, ttl_seconds: int = 60):
        self.ttl = timedelta(seconds=ttl_seconds)
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._timestamps: Dict[str, datetime] = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached value if not expired."""
        if key not in self._cache:
            return None
        if get_local_time() - self._timestamps[key] > self.ttl:
            del self._cache[key]
            del self._timestamps[key]
            return None
        return self._cache[key]
    
    def set(self, key: str, value: Any):
        """Set a cached value with timestamp."""
        self._cache[key] = value
        self._timestamps[key] = get_local_time()
    
    def clear(self):
        """Clear all cache."""
        self._cache.clear()
        self._timestamps.clear()

# Global cache instance
map_data_cache = APICache(ttl_seconds=60)

# --- India City Data for Real-Time Map ---
INDIA_CITIES = [
    {"name": "Hyderabad", "lat": 17.385, "lon": 78.486},
    {"name": "Mumbai", "lat": 19.076, "lon": 72.877},
    {"name": "Delhi", "lat": 28.644, "lon": 77.216},
    {"name": "Bangalore", "lat": 12.971, "lon": 77.594},
    {"name": "Chennai", "lat": 13.082, "lon": 80.270},
    {"name": "Kolkata", "lat": 22.572, "lon": 88.363},
    {"name": "Ahmedabad", "lat": 23.022, "lon": 72.571},
    {"name": "Pune", "lat": 18.520, "lon": 73.856},
    {"name": "Jaipur", "lat": 26.912, "lon": 75.787},
    {"name": "Lucknow", "lat": 26.846, "lon": 80.946},
    {"name": "Vizag", "lat": 17.686, "lon": 83.218},
    {"name": "Indore", "lat": 22.719, "lon": 75.857},
    {"name": "Bhopal", "lat": 23.259, "lon": 77.412},
    {"name": "Nagpur", "lat": 21.145, "lon": 79.088},
    {"name": "Surat", "lat": 21.170, "lon": 72.831},
]

def generate_realtime_markers(count: int = 15):
    """
    Generates simulated real-time environmental markers.
    In production, this would fetch from APIs + DB.
    """
    markers = []
    for city in INDIA_CITIES[:count]:
        # Simulate varying data
        temp = 22 + random.random() * 15  # 22-37°C
        humidity = 40 + random.random() * 40  # 40-80%
        aqi = int(50 + random.random() * 200)  # 50-250 AQI
        
        # Determine status color based on AQI
        if aqi < 50:
            status = "good"
            color = "#22c55e"  # Green
        elif aqi < 100:
            status = "moderate"
            color = "#eab308"  # Yellow
        elif aqi < 150:
            status = "unhealthy_sensitive"
            color = "#f97316"  # Orange
        else:
            status = "unhealthy"
            color = "#ef4444"  # Red
        
        markers.append({
            "id": city["name"].lower().replace(" ", "_"),
            "name": city["name"],
            "lat": city["lat"],
            "lon": city["lon"],
            "temp": round(temp, 1),
            "humidity": round(humidity, 1),
            "aqi": aqi,
            "status": status,
            "color": color,
            "timestamp": get_local_time().isoformat()
        })
    
    return markers

async def refresh_map_cache():
    """Background task to refresh map cache."""
    while True:
        try:
            markers = generate_realtime_markers(15)
            map_data_cache.set("india_markers", markers)
            print(f"[Cache] Refreshed {len(markers)} markers at {get_local_time()}")
        except Exception as e:
            print(f"[Cache] Refresh Error: {e}")
        await asyncio.sleep(30)  # Refresh every 30 seconds

def get_cached_markers():
    """Get markers from cache or generate fresh."""
    cached = map_data_cache.get("india_markers")
    if cached:
        return cached
    # Generate fresh if no cache
    markers = generate_realtime_markers(15)
    map_data_cache.set("india_markers", markers)
    return markers
