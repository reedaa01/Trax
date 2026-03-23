from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_role, get_current_user
from app.models.user import User
from app.schemas.driver import DriverProfileOut, DriverProfileUpdate, AvailabilityUpdate
from app.schemas.request import TransportRequestOut
from app.services import driver_service, request_service

router = APIRouter()
require_driver = require_role("driver")


def _enrich(profile, user: User) -> DriverProfileOut:
    """Attach user-level fields (full_name, phone) to the profile schema."""
    out = DriverProfileOut.model_validate(profile)
    out.full_name = user.full_name
    out.phone = user.phone or ""
    return out


@router.get("/profile", response_model=DriverProfileOut)
def get_my_profile(
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    profile = driver_service.get_driver_profile(db, current_user)
    return _enrich(profile, current_user)


@router.put("/profile", response_model=DriverProfileOut)
def update_my_profile(
    data: DriverProfileUpdate,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    profile = driver_service.update_driver_profile(db, current_user, data)
    db.refresh(current_user)
    return _enrich(profile, current_user)


@router.patch("/availability", response_model=DriverProfileOut)
def set_availability(
    data: AvailabilityUpdate,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    profile = driver_service.set_availability(db, current_user, data.is_available)
    return _enrich(profile, current_user)


@router.get("/jobs", response_model=List[TransportRequestOut])
def get_my_jobs(
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    profile = driver_service.get_driver_profile(db, current_user)
    return request_service.get_driver_requests(db, profile)


@router.get("/requests", response_model=List[TransportRequestOut])
def get_incoming_requests(
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    profile = driver_service.get_driver_profile(db, current_user)
    return request_service.get_driver_incoming(db, profile)
