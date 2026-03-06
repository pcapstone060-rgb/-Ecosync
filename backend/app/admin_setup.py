from . import schemas, database, models
from .core import security
from sqlalchemy.orm import Session

def create_admin_user():
    db = database.SessionLocal()
    try:
        email = "gitams4@gmail.com"
        password = "Admin123@#$"  # Matches documentation (Capital A)

        # Check if exists
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            # Update password if exists (ensures it matches docs even if DB persisted)
            existing.hashed_password = security.get_password_hash(password)
            db.commit()
            print(f"Admin user {email} updated with correct password.")
        else:
            print(f"Creating new Admin user: {email}")
            hashed_pw = security.get_password_hash(password)
            new_user = models.User(
                email=email,
                hashed_password=hashed_pw
            )
            db.add(new_user)
            db.commit()
            print(f"Admin user created: {email}")
            
    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        db.close()
