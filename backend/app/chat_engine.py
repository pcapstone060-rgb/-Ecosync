import re
import random
import httpx
import asyncio

class ChatEngine:
    def __init__(self):
        self.context = {}
        
    async def process_query(self, query: str):
        query = query.lower().strip()
        
        # 0. Context / Follow-up Logic
        # "what time is it there?", "how about in london?"
        target_city = None
        
        if "there" in query or "it" in query:
             target_city = self.context.get('last_city')
        
        # 1. Extraction
        city_match = re.search(r'(in|at|for) ([a-z\s]+)', query)
        if city_match:
            target_city = city_match.group(2).strip()
            # Clean up command words if caught "navigate to london" -> "london"
            target_city = re.sub(r'(weather|temperature|forecast|time)', '', target_city).strip()
        
        # 2. Routing
        if "time" in query:
            if target_city:
                return await self.get_time(target_city)
            else:
                return "Which city are you referring to?"

        if "weather" in query or "temperature" in query or "hot" in query or "cold" in query:
            if target_city:
                return await self.get_weather(target_city)
            if not target_city:
                return "Please specify a city."

        # 3. Status Report (REAL DB Data)
        if "status" in query or "readings" in query or "system" in query:
            from . import database, models
            db = database.SessionLocal()
            try:
                latest = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).first()
                if latest:
                    return (f"Current environmental telemetry: Temperature {latest.temperature:.1f}°C, "
                            f"Humidity {latest.humidity:.1f}%. "
                            f"All sensors are online and transmitting.")
                else:
                    return "System online. Waiting for initial sensor data stream."
            except Exception:
                return "Internal database connection failed."
            finally:
                db.close()

        # 4. Identity / Small Talk
        small_talk = {
            "who are you": "I am C.E.O.S, your AI Safety Officer.",
            "your name": "I am C.E.O.S.",
            "how are you": "Systems nominal. Ready to assist.",
            "hello": "Greetings.",
            "hi": "Hello.",
            "good morning": "Good morning.",
            "thank you": "You are welcome."
        }
        for key, val in small_talk.items():
            if key in query:
                return val

        # 5. General Knowledge (Wikipedia)
        topic = re.sub(r'(what is|who is|tell me about|define|explain)', '', query).strip()
        if len(topic) > 2:
            return await self.get_wikipedia_summary(topic)

        return "I'm listening. You can ask about weather, time, system status, or general topics."

    async def get_weather(self, city: str):
        try:
            # 1. Geocode
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json"
            async with httpx.AsyncClient() as client:
                resp = await client.get(geo_url)
                data = resp.json()
                
                if not data.get("results"):
                    return f"I could not locate {city}."
                    
                lat = data["results"][0]["latitude"]
                lon = data["results"][0]["longitude"]
                name = data["results"][0]["name"]
                
                # Update Context
                self.context['last_city'] = name
                self.context['lat'] = lat
                self.context['lon'] = lon
                
                # 2. Weather
                weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
                w_resp = await client.get(weather_url)
                w_data = w_resp.json()
                
                temp = w_data["current_weather"]["temperature"]
                wind = w_data["current_weather"]["windspeed"]
                
                return f"In {name}, it is currently {temp} degrees Celsius. Wind speed is {wind} kilometers per hour."
                
        except Exception:
            return "Unable to fetch weather data at this time."

    async def get_time(self, city: str):
        try:
             # Reuse Geocode logic or Context
             lat, lon, name = None, None, city
             
             if city == self.context.get('last_city'):
                 lat = self.context.get('lat')
                 lon = self.context.get('lon')
                 name = self.context.get('last_city')
             
             async with httpx.AsyncClient() as client:
                 if not lat:
                    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json"
                    resp = await client.get(geo_url)
                    data = resp.json()
                    if not data.get("results"): return f"Unknown city {city}."
                    lat = data["results"][0]["latitude"]
                    lon = data["results"][0]["longitude"]
                    name = data["results"][0]["name"]
                    
                    self.context['last_city'] = name
                    self.context['lat'] = lat
                    self.context['lon'] = lon

                 # Get Timezone via Open-Meteo (it returns timezone in geocode or we use lat/long to find it)
                 # Better: Use TimeApi or just the timezone field from Open-Meteo forecast
                 # Open-Meteo forecast headers have utc_offset
                 
                 tz_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&timezone=auto"
                 tz_resp = await client.get(tz_url)
                 tz_data = tz_resp.json()
                 
                 # Parse local time from response or offset
                 # Open-Meteo returns "current_weather": {"time": "2023-..."} in UTC? No, if timezone=auto it attempts local
                 # actually 'current_weather.time' is ISO.
                 
                 local_time_iso = tz_data.get("current_weather", {}).get("time", "")
                 # Format: 2023-10-27T10:00
                 if local_time_iso:
                     time_part = local_time_iso.split('T')[1]
                     return f"The local time in {name} is {time_part}."
                 
                 return f"I have the coordinates for {name}, but cannot determine local time."
                 
        except Exception:
            return "Time synchronization failed."

    async def get_wikipedia_summary(self, topic: str):
        try:
            # Clean topic
            topic_clean = topic.replace(" ", "_")
            url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{topic_clean}"
            
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, follow_redirects=True)
                if resp.status_code == 200:
                    data = resp.json()
                    summary = data.get("extract", "")
                    if summary:
                        # Limit length for voice (first 2 sentences)
                        sentences = summary.split('. ')
                        short_summary = '. '.join(sentences[:2]) + '.'
                        return short_summary
                    
            return f"I searched my archives for {topic}, but found no clear definition."
        except Exception:
            return "I am unable to connect to the knowledge base right now."

chat_engine = ChatEngine()
