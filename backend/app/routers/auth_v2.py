from datetime import timedelta, datetime as dt
import random
import string
# print(f"LOADING AUTH_V2 FROM {__file__}")
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import schemas, database
from ..models import User
from ..core import security
from ..services.email_service import send_email_notification
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from fastapi import status

router = APIRouter(tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")



# Google Auth
from google.oauth2 import id_token
from google.auth.transport import requests


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()



@router.get("/auth/test-ping")
def test_ping():
    return {"status": "pong"}

# --- DIRECT REGISTER ENDPOINT ---
@router.post("/auth/register", response_model=schemas.Token)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Check existing
    print(f"DEBUG REGISTER PAYLOAD: {user_data.dict()}")
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists (Email taken)")
    
    # 2. Create User
    hashed_password = security.get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        plan=user_data.plan or "lite",
        location_name=user_data.location_name,
        is_verified=True # Auto-verify for direct registration
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 3. Generate Token
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "redirect": "/dashboard",
        "plan": new_user.plan,
        "is_verified": new_user.is_verified,
        "user_name": f"{new_user.first_name} {new_user.last_name}"
    }

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    t0 = dt.now()
    print(f">>> TRACE: Login attempt for {form_data.username} at {t0.isoformat()}")
    
    print(f">>> TRACE: Starting user query for {form_data.username}")
    user = db.query(User).filter(User.email == form_data.username).first()
    t1 = dt.now()
    print(f">>> TRACE: User lookup took {(t1-t0).total_seconds()}s")
    
    if not user:
        print(f"DEBUG: User {form_data.username} not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Verify Password
    print(f">>> TRACE: Starting password verification for {user.email}")
    is_valid = security.verify_password(form_data.password, user.hashed_password)
    t2 = dt.now()
    print(f">>> TRACE: Password verification success: {is_valid} in {(t2-t1).total_seconds()}s")
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Generate Token
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    t3 = dt.now()
    print(f">>> TRACE: Token generation took {(t3-t2).total_seconds()}s")
    
    print(f">>> TRACE: Login success for {user.email}. Total time: {(t3-t0).total_seconds()}s")
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "redirect": "/dashboard",
        "plan": user.plan,
        "is_verified": user.is_verified,
        "user_name": f"{user.first_name} {user.last_name}"
    }


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == username).first()
    
    if user is None:
        raise credentials_exception
    return user
class SignupInitRequest(schemas.BaseModel):
    email: schemas.EmailStr

@router.post("/auth/signup-init")
def signup_init(request: SignupInitRequest, db: Session = Depends(get_db)):
    # 1. Check existing
    user = db.query(User).filter(User.email == request.email).first()
    if user and user.is_verified:
        raise HTTPException(status_code=400, detail="Identity Hash already registered. Please Login.")
    
    # 2. Logic for new or unverified
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    if user and not user.is_verified:
        # Update existing unverified
        user.otp_secret = otp_code
        db.commit()
    else:
        # Create new placeholder
        hashed_password = security.get_password_hash("PENDING-SETUP")
        new_user = User(
            email=request.email,
            hashed_password=hashed_password,
            is_verified=False,
            otp_secret=otp_code,
            plan="lite" # Default
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    
    # 3. Send Email
    subject = "S4 SECURITY CHECK: Identity Verification"
    body = f"""
    [SECURE TRANSMISSION]
    
    Operative,
    
    Your activation code for the Environmental Monitoring Network is:
    
    {otp_code}
    
    Enter this code to proceed to credential setup.
    """
    try:
        send_email_notification(request.email, subject, body)
    except Exception as e:
        print(f"Email Failed: {e}")
        # For debugging/demo if email fails
        print(f"DEBUG OTP: {otp_code}")
        
    return {"status": "success", "message": "Verification Signal Sent"}


class SignupCompleteRequest(schemas.BaseModel):
    email: schemas.EmailStr
    otp: str
    password: str
    first_name: str
    last_name: str

@router.post("/auth/signup-complete", response_model=schemas.Token)
def signup_complete(request: SignupCompleteRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User Identity Not Found")
        
    if user.is_verified:
         raise HTTPException(status_code=400, detail="User already verified. Please Login.")

    if user.otp_secret != request.otp:
        raise HTTPException(status_code=400, detail="Invalid Verification Code")

    # Finalize Account
    user.hashed_password = security.get_password_hash(request.password)
    user.first_name = request.first_name
    user.last_name = request.last_name
    user.is_verified = True
    user.otp_secret = None # Cleanup
    
    db.commit()
    
    # Generate Token immediately
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "redirect": "/dashboard",
        "plan": user.plan,
        "is_verified": user.is_verified,
        "user_name": f"{user.first_name} {user.last_name}"
    }

class VerifyRequest(schemas.BaseModel):
    email: str
    otp: str

@router.post("/verify-email")
def verify_email(req: VerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.otp_secret != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP Code")
        
    user.is_verified = True
    user.otp_secret = None # Clear OTP after use
    db.commit()
    
    # Issue Temporary Access Token for Setup
    access_token_expires = timedelta(minutes=15) # Short lived for setup
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "status": "success", 
        "message": "Identity Verified",
        "access_token": access_token,
        "token_type": "bearer"
    }

class CredentialsSetup(schemas.BaseModel):
    password: str
    first_name: str
    last_name: str

@router.post("/me/setup-credentials")
def setup_credentials(creds: CredentialsSetup, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Update Password
    current_user.hashed_password = security.get_password_hash(creds.password)
    # Update Profile
    current_user.first_name = creds.first_name
    current_user.last_name = creds.last_name
    
    db.commit()
    db.refresh(current_user)
    
    return {"status": "success", "message": "Credentials Secured. System Access Granted."}

@router.put("/me/profile")
def update_profile(profile: schemas.UserProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.first_name = profile.first_name
    current_user.last_name = profile.last_name
    current_user.mobile = profile.mobile
    current_user.location_name = profile.location_name
        
    db.commit()
    db.refresh(current_user)
    return {"status": "success", "message": "Profile Updated"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user profile
    """
    return current_user

class LocationUpdateRequest(schemas.BaseModel):
    location_lat: float
    location_lon: float
    location_name: str

@router.put("/api/user/location")
def update_user_location(
    location_data: LocationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user's current location coordinates
    This enables dynamic location tracking for geofencing alerts
    """
    print(f"Updating location for {current_user.email}")
    print(f"   New location: {location_data.location_name} ({location_data.location_lat}, {location_data.location_lon})")
    
    # Update user location
    current_user.location_lat = location_data.location_lat
    current_user.location_lon = location_data.location_lon
    current_user.location_name = location_data.location_name
    
    db.commit()
    db.refresh(current_user)
    
    print(f"Location updated successfully for {current_user.email}")
    
    return {
        "status": "success",
        "message": "Location updated successfully",
        "location": {
            "name": current_user.location_name,
            "lat": current_user.location_lat,
            "lon": current_user.location_lon
        }
    }


class GoogleLoginRequest(schemas.BaseModel):
    token: str

@router.post("/google-login", response_model=schemas.Token)
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        # Verify Token
        id_info = id_token.verify_oauth2_token(request.token, requests.Request())

        email = id_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid Google Token: No Email")
            
        # Check User
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Auto-Register
            hashed_password = security.get_password_hash("google_oauth_auto_generated")
            user = User(email=email, hashed_password=hashed_password)
            db.add(user)
            db.commit()
            db.refresh(user)
            
        # Issue JWT
        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "redirect": "/dashboard"
        }
        
    except ValueError as e:
         raise HTTPException(status_code=400, detail=f"Invalid Google Token: {str(e)}")

