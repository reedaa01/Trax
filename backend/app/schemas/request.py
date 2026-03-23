from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

from app.schemas.driver import DriverProfileOut


class TransportRequestCreate(BaseModel):
    driver_id: int
    departure_location: str
    destination: str
    departure_lat: float = 0.0
    departure_lng: float = 0.0
    destination_lat: float = 0.0
    destination_lng: float = 0.0
    scheduled_date: str
    load_description: Optional[str] = None
    load_weight_tons: float = 1.0
    vehicle_type_required: str = "truck"
    estimated_price: float = 0.0


class TransportRequestOut(BaseModel):
    id: int
    client_id: int
    driver_id: Optional[int] = None
    departure_location: str
    destination: str
    departure_lat: float = 0.0
    departure_lng: float = 0.0
    destination_lat: float = 0.0
    destination_lng: float = 0.0
    scheduled_date: datetime
    load_description: Optional[str] = None
    load_weight_tons: float
    vehicle_type_required: str
    estimated_price: float
    final_price: Optional[float] = None
    status: str
    review_rating: Optional[float] = None
    review_comment: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    driver: Optional[DriverProfileOut] = None

    model_config = {"from_attributes": True}


class RequestRespondBody(BaseModel):
    action: str  # "accept" or "reject"


class ReviewBody(BaseModel):
    rating: float   # 1.0 – 5.0
    comment: Optional[str] = None


class SearchParams(BaseModel):
    departure_location: str
    destination: str
    scheduled_date: Optional[str] = None
    vehicle_type: Optional[str] = None
    load_weight_tons: Optional[float] = None
    # Real coordinates from the map (sent by the frontend)
    departure_lat: Optional[float] = None
    departure_lng: Optional[float] = None
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None
    distance_km: Optional[float] = None  # pre-computed Haversine from the map


class DriverSearchResult(BaseModel):
    driver: "DriverProfileOut"
    estimated_price: float
    estimated_distance_km: float
    recommendation_score: float


class PriceEstimateRequest(BaseModel):
    distance_km: float
    vehicle_type: str
    load_weight_tons: float


class PriceEstimateResponse(BaseModel):
    estimated_price: float
    price_breakdown: Dict[str, float]


# Avoid circular import — DriverProfileOut is defined in driver.py
from app.schemas.driver import DriverProfileOut  # noqa: E402
DriverSearchResult.model_rebuild()
