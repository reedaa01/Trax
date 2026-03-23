from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.models.driver import DriverProfile
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password, create_access_token


def create_user(db: Session, data: UserCreate) -> User:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered.",
        )
    user = User(
        email=data.email,
        full_name=data.full_name,
        phone=data.phone,
        hashed_pw=hash_password(data.password),
        role=UserRole(data.role),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if user.role == UserRole.driver:
        from app.models.driver import VehicleType as VT
        vtype = VT(data.vehicle_type) if data.vehicle_type else VT.truck
        profile = DriverProfile(
            user_id=user.id,
            vehicle_type=vtype,
            vehicle_plate=data.vehicle_plate or None,
            vehicle_capacity_tons=data.vehicle_capacity_tons or 5.0,
            city=data.city or None,
            latitude=data.city_lat or None,
            longitude=data.city_lng or None,
        )
        db.add(profile)
        db.commit()

    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_pw):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    return user


def login_user(db: Session, email: str, password: str) -> str:
    """Authenticate and return a JWT token string."""
    user = authenticate_user(db, email, password)
    return create_access_token({"sub": str(user.id), "role": user.role.value})
