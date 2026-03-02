from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas, models, database
from ..services import otp as otp_service
from ..core import security
import pytz

def get_local_time():
    local_tz = pytz.timezone('Asia/Kolkata')
    return datetime.now(local_tz).replace(tzinfo=None)

router = APIRouter(tags=["OTP Auth"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/auth/send-otp")
def send_otp(request: schemas.OTPRequest, db: Session = Depends(get_db)):
    # 1. Generate Code
    code = otp_service.generate_otp(length=4)
    
    # 2. Store in DB (invalidate old ones?)
    expires = get_local_time() + timedelta(minutes=5)
    otp_entry = models.OTPCode(
        phone_number=request.phone_number,
        code=code,
        expires_at=expires
    )
    db.add(otp_entry)
    db.commit()
    
    # 3. Send SMS (Simulated)
    otp_service.send_sms(request.phone_number, f"Your verification code is: {code}")
    
    return {"status": "sent", "message": "OTP sent successfully"}

@router.post("/auth/verify-otp", response_model=schemas.Token)
def verify_otp(request: schemas.OTPVerify, db: Session = Depends(get_db)):
    # 1. Find valid OTP
    otp_record = db.query(models.OTPCode).filter(
        models.OTPCode.phone_number == request.phone_number,
        models.OTPCode.code == request.code,
        models.OTPCode.is_used == False,
        models.OTPCode.expires_at > get_local_time()
    ).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # 2. Mark as used
    otp_record.is_used = True
    db.commit()
    
    # 3. Find or Create User
    user = db.query(models.User).filter(models.User.phone_number == request.phone_number).first()
    if not user:
        # Auto-register if new
        user = models.User(phone_number=request.phone_number, role="user")
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # 4. Generate Token
    # Determine Role and Plan (Defaults)
    role = user.role if hasattr(user, "role") and user.role else "user"
    plan = user.plan if hasattr(user, "plan") and user.plan else "lite"
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.phone_number, "role": role, "plan": plan}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": role, "plan": plan}
