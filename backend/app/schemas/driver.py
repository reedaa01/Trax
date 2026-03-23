from pydantic import BaseModel, model_validator
from typing import Optional, Any


class DriverProfileOut(BaseModel):
    id: int
    user_id: int
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_capacity_tons: float
    is_available: bool
    rating: float
    total_jobs: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def pull_user_fields(cls, data: Any) -> Any:
        """When validating from an ORM DriverProfile instance,
        pull full_name and phone from the related User object."""
        # Only do this for ORM objects (have a .user attribute), not dicts
        if hasattr(data, "user") and data.user is not None:
            # Pydantic will still read ORM attrs; we just need to ensure
            # full_name and phone resolve through the relationship.
            # We convert to a dict so extra fields can be injected.
            from pydantic import BaseModel as _BM
            obj_dict = {
                "id": data.id,
                "user_id": data.user_id,
                "full_name": data.user.full_name,
                "phone": data.user.phone or "",
                "city": data.city,
                "vehicle_type": data.vehicle_type,
                "vehicle_plate": data.vehicle_plate,
                "vehicle_capacity_tons": data.vehicle_capacity_tons,
                "is_available": data.is_available,
                "rating": data.rating,
                "total_jobs": data.total_jobs,
                "latitude": data.latitude,
                "longitude": data.longitude,
            }
            return obj_dict
        return data


class DriverProfileUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_capacity_tons: Optional[float] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AvailabilityUpdate(BaseModel):
    is_available: bool
