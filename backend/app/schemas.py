from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

    first_name: str
    last_name: Optional[str] = None
    plan: Optional[str] = "lite"
    location_name: Optional[str] = None
    location_lat: Optional[float] = None
    location_lon: Optional[float] = None

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    plan: Optional[str] = "lite"
    is_verified: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Device Schema
class DeviceCreate(BaseModel):
    deviceName: str = Field(..., min_length=1, max_length=100)
    connectorType: str = Field(..., min_length=1, max_length=50)
    location: dict = Field(..., description="Location object with lat and lon")

class DeviceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    connector_type: Optional[str] = Field(None, min_length=1, max_length=50)
    lat: Optional[float] = None
    lon: Optional[float] = None
    status: Optional[str] = Field(None, min_length=1, max_length=50)

class DeviceResponse(BaseModel):
    id: str
    name: str
    connector_type: str
    lat: float
    lon: float
    status: str
    last_seen: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Sensor Data Schema
class SensorDataCreate(BaseModel):
    device_id: str
    temperature: float
    humidity: float
    gas: float = 0.0
    rain: float = 4095.0
    motion: int = 0
    user_email: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class SensorDataResponse(BaseModel):
    id: int
    device_id: str
    timestamp: datetime
    temperature: float
    humidity: float
    gas: float
    rain: float
    motion: int
    user_email: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    
    trust_score: Optional[float] = None
    anomaly_label: Optional[str] = "Normal"
    smart_insight: Optional[str] = None
    risk_level: Optional[str] = "SAFE"
    prediction: Optional[dict] = None
    sensor_health: Optional[dict] = None
    baseline: Optional[dict] = None

    class Config:
        from_attributes = True

# Alert Settings Schema
class AlertSettingsCreate(BaseModel):
    user_email: Optional[str] = None
    temp_threshold: float = 45.0
    humidity_min: float = 20.0
    humidity_max: float = 80.0
    gas_threshold: float = 600.0
    rain_alert: bool = True
    motion_alert: bool = True
    is_active: bool = True

class AlertSettingsResponse(BaseModel):
    id: int
    user_email: Optional[str]
    temp_threshold: float
    humidity_min: float
    humidity_max: float
    gas_threshold: float
    rain_alert: bool
    motion_alert: bool
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Alert Schema
class AlertResponse(BaseModel):
    id: int
    metric: str
    value: float
    message: str
    recipient_email: str
    email_sent: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    redirect: str
    plan: str
    is_verified: bool
    user_name: str

class UserProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    mobile: Optional[str] = None
    location_name: Optional[str] = None

class DiaryEntryCreate(BaseModel):
    note: str
    location: Optional[str] = None

class DiaryEntryResponse(BaseModel):
    id: int
    user_id: int
    note: str
    location: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class UserLayoutUpdate(BaseModel):
    layout_json: str

class UserLayoutResponse(BaseModel):
    id: int
    user_id: int
    layout_json: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MLLogCreate(BaseModel):
    anomaly_score: Optional[float] = None
    status: Optional[str] = None
    message: Optional[str] = None

class MLLogResponse(BaseModel):
    id: int
    anomaly_score: Optional[float] = None
    status: Optional[str] = None
    message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

