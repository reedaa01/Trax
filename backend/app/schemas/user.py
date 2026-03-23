from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    phone: str
    role: str = "client"
    # Driver-only fields (ignored for clients)
    vehicle_type: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_capacity_tons: Optional[float] = None
    city: Optional[str] = None
    city_lat: Optional[float] = None
    city_lng: Optional[float] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
