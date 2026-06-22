"""
Admin-only routes.
All endpoints require the 'admin' role.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.db.session import get_db
from app.core.security import require_admin
from app.models.user import User, UserRole
from app.models.driver import DriverProfile
from app.models.request import TransportRequest, RequestStatus
from app.schemas.user import UserOut
from pydantic import BaseModel

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    total_clients: int
    total_drivers: int
    total_requests: int
    pending_requests: int
    completed_requests: int
    active_drivers: int

class DriverAdminOut(BaseModel):
    id: int
    user_id: int
    email: str
    full_name: str
    phone: Optional[str]
    city: Optional[str]
    vehicle_type: str
    vehicle_plate: Optional[str]
    vehicle_capacity_tons: float
    is_available: bool
    rating: float
    total_jobs: int
    created_at: Optional[str]

    model_config = {"from_attributes": True}

class UserAdminOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    role: str
    created_at: Optional[str]

    model_config = {"from_attributes": True}

class RequestAdminOut(BaseModel):
    id: int
    client_id: int
    driver_id: Optional[int]
    departure_location: str
    destination: str
    scheduled_date: str
    status: str
    estimated_price: float
    final_price: Optional[float]
    created_at: Optional[str]
    client_name: Optional[str]
    driver_name: Optional[str]

class RoleUpdate(BaseModel):
    role: str


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStats)
def get_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_users    = db.query(User).filter(User.role != UserRole.admin).count()
    total_clients  = db.query(User).filter(User.role == UserRole.client).count()
    total_drivers  = db.query(User).filter(User.role == UserRole.driver).count()
    total_requests = db.query(TransportRequest).count()
    pending        = db.query(TransportRequest).filter(TransportRequest.status == RequestStatus.pending).count()
    completed      = db.query(TransportRequest).filter(TransportRequest.status == RequestStatus.completed).count()
    active_drivers = db.query(DriverProfile).filter(DriverProfile.is_available == True).count()

    return AdminStats(
        total_users=total_users,
        total_clients=total_clients,
        total_drivers=total_drivers,
        total_requests=total_requests,
        pending_requests=pending,
        completed_requests=completed,
        active_drivers=active_drivers,
    )


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserAdminOut])
def list_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(User).filter(User.role != UserRole.admin)
    if role:
        q = q.filter(User.role == role)
    users = q.order_by(User.created_at.desc()).all()
    return [
        UserAdminOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            phone=u.phone,
            role=u.role.value,
            created_at=str(u.created_at) if u.created_at else None,
        )
        for u in users
    ]


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    body: RoleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if body.role not in ("client", "driver"):
        raise HTTPException(status_code=400, detail="Role must be 'client' or 'driver'.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=403, detail="Cannot modify admin role.")
    user.role = UserRole(body.role)
    db.commit()
    return {"detail": "Role updated."}


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=403, detail="Cannot delete admin accounts.")
    db.delete(user)
    db.commit()


# ── Drivers ───────────────────────────────────────────────────────────────────

@router.get("/drivers", response_model=List[DriverAdminOut])
def list_drivers(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(DriverProfile, User)
        .join(User, DriverProfile.user_id == User.id)
        .order_by(DriverProfile.rating.desc())
        .all()
    )
    result = []
    for profile, user in rows:
        result.append(DriverAdminOut(
            id=profile.id,
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            city=profile.city,
            vehicle_type=profile.vehicle_type.value,
            vehicle_plate=profile.vehicle_plate,
            vehicle_capacity_tons=profile.vehicle_capacity_tons,
            is_available=profile.is_available,
            rating=profile.rating,
            total_jobs=profile.total_jobs,
            created_at=str(user.created_at) if user.created_at else None,
        ))
    return result


@router.patch("/drivers/{driver_id}/toggle-availability")
def toggle_driver_availability(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    profile = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver not found.")
    profile.is_available = not profile.is_available
    db.commit()
    return {"is_available": profile.is_available}


# ── Requests ──────────────────────────────────────────────────────────────────

@router.get("/requests", response_model=List[RequestAdminOut])
def list_requests(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(TransportRequest)
    if status_filter:
        q = q.filter(TransportRequest.status == status_filter)
    requests = q.order_by(TransportRequest.created_at.desc()).limit(200).all()

    result = []
    for r in requests:
        client_name = r.client.full_name if r.client else None
        driver_name = None
        if r.driver_id:
            profile = db.query(DriverProfile).filter(DriverProfile.id == r.driver_id).first()
            if profile and profile.user:
                driver_name = profile.user.full_name
        result.append(RequestAdminOut(
            id=r.id,
            client_id=r.client_id,
            driver_id=r.driver_id,
            departure_location=r.departure_location,
            destination=r.destination,
            scheduled_date=str(r.scheduled_date),
            status=r.status.value,
            estimated_price=r.estimated_price,
            final_price=r.final_price,
            created_at=str(r.created_at) if r.created_at else None,
            client_name=client_name,
            driver_name=driver_name,
        ))
    return result
