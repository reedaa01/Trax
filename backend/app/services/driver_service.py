import math
from typing import List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException

from app.models.driver import DriverProfile
from app.models.user import User
from app.schemas.driver import DriverProfileUpdate
from app.schemas.request import SearchParams, DriverSearchResult


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distance in km between two lat/lng points."""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# Max km from departure city — drivers beyond this radius are hidden
PROXIMITY_RADIUS_KM = 300


def get_driver_profile(db: Session, user: User) -> DriverProfile:
    profile = (
        db.query(DriverProfile)
        .options(joinedload(DriverProfile.user))
        .filter(DriverProfile.user_id == user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    return profile


def update_driver_profile(db: Session, user: User, data: DriverProfileUpdate) -> DriverProfile:
    profile = get_driver_profile(db, user)
    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "phone":
            user.phone = value
        else:
            setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


def set_availability(db: Session, user: User, available: bool) -> DriverProfile:
    profile = get_driver_profile(db, user)
    profile.is_available = available
    db.commit()
    db.refresh(profile)
    return profile


def search_drivers(db: Session, params: SearchParams) -> List[DriverSearchResult]:
    from ml.predictor import recommend_drivers

    query = (
        db.query(DriverProfile)
        .options(joinedload(DriverProfile.user))
        .filter(DriverProfile.is_available == True)  # noqa: E712
    )
    if params.vehicle_type:
        query = query.filter(DriverProfile.vehicle_type == params.vehicle_type)
    if params.load_weight_tons:
        query = query.filter(DriverProfile.vehicle_capacity_tons >= params.load_weight_tons)

    drivers: List[DriverProfile] = query.all()
    if not drivers:
        return []

    # ── Proximity filter ────────────────────────────────────────────────────
    # If the client provided departure coords, keep only drivers whose home
    # city is within PROXIMITY_RADIUS_KM of the departure point.
    # Drivers with no city set are always included (graceful fallback).
    dep_lat = params.departure_lat
    dep_lng = params.departure_lng
    if dep_lat and dep_lng:
        nearby = []
        for d in drivers:
            if d.latitude is None or d.longitude is None:
                nearby.append(d)   # no location set → always show
            else:
                dist = _haversine(dep_lat, dep_lng, d.latitude, d.longitude)
                if dist <= PROXIMITY_RADIUS_KM:
                    nearby.append(d)
        # If the filter leaves us with nothing (e.g. very remote route),
        # fall back to all available drivers so the client always sees results.
        drivers = nearby if nearby else drivers
    # ────────────────────────────────────────────────────────────────────────

    return recommend_drivers(
        drivers=drivers,
        departure=params.departure_location,
        destination=params.destination,
        load_weight=params.load_weight_tons or 1.0,
        departure_lat=params.departure_lat,
        departure_lng=params.departure_lng,
        destination_lat=params.destination_lat,
        destination_lng=params.destination_lng,
        distance_km=params.distance_km,
    )
