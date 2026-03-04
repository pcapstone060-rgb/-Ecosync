from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import pytz

from .database import Base

def get_local_time():
    local_tz = pytz.timezone('Asia/Kolkata')
    return datetime.now(local_tz).replace(tzinfo=None)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    plan = Column(String, default="lite")
    location_name = Column(String, nullable=True)
    location_lat = Column(Float, nullable=True)
    location_lon = Column(Float, nullable=True)
    mobile = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    otp_secret = Column(String, nullable=True)
    created_at = Column(DateTime, default=get_local_time, nullable=True)
    updated_at = Column(DateTime, default=get_local_time, onupdate=get_local_time, nullable=True)
    
    # Relationships
    devices = relationship("Device", back_populates="user")
    sensor_data = relationship("SensorData", back_populates="user")
    alerts = relationship("Alert", back_populates="user")

class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    connector_type = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    status = Column(String, default="created")
    last_seen = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="devices")
    sensor_data = relationship("SensorData", back_populates="device")

class SensorData(Base):
    __tablename__ = "sensor_data"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.id"), nullable=False)
    timestamp = Column(DateTime, default=get_local_time)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    gas = Column(Float, nullable=True)
    rain = Column(Float, nullable=True)
    motion = Column(Integer, nullable=True)

    trust_score = Column(Float, nullable=True)
    anomaly_label = Column(String, nullable=True)
    anomaly_score = Column(Float, nullable=True)
    smart_insight = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    device = relationship("Device", back_populates="sensor_data")
    user = relationship("User", back_populates="sensor_data")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    metric = Column(String, nullable=False)
    value = Column(Float, nullable=True)
    message = Column(Text, nullable=False)
    recipient_email = Column(String, nullable=True)
    email_sent = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=get_local_time)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    recipient_name = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="alerts")

class AlertSettings(Base):
    __tablename__ = "alert_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, ForeignKey("users.email"), nullable=True)
    
    # Relationships
    user = relationship("User")
    temp_threshold = Column(Float, default=45.0)
    humidity_min = Column(Float, default=20.0)
    humidity_max = Column(Float, default=80.0)
    gas_threshold = Column(Float, default=600.0)
    rain_alert = Column(Boolean, default=True)
    pm25_threshold = Column(Float, default=150.0)
    wind_threshold = Column(Float, default=30.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_local_time)
    updated_at = Column(DateTime, default=get_local_time, onupdate=get_local_time)

class SafetyLog(Base):
    __tablename__ = "safety_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String, nullable=False)
    status = Column(String, default="PENDING") # PENDING, COMPLETED, SKIPPED
    verified_by = Column(String, nullable=True) # Name of verifier
    verified_at = Column(DateTime, nullable=True)
    shift = Column(String, default="A") # A, B, C
    date = Column(String, nullable=False, index=True) # YYYY-MM-DD
    created_at = Column(DateTime, default=get_local_time)
    updated_at = Column(DateTime, default=get_local_time, onupdate=get_local_time)

class MLLog(Base):
    __tablename__ = "ml_logs"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_score = Column(Float, nullable=True)
    status = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_local_time)
