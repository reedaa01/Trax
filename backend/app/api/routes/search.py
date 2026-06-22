from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.request import (
    SearchParams,
    DriverSearchResult,
    PriceEstimateRequest,
    PriceEstimateResponse,
)
from app.services.driver_service import search_drivers

router = APIRouter()


@router.post("/drivers", response_model=List[DriverSearchResult])
def search_available_drivers(
    params: SearchParams,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search available drivers with ML-based ranking and price estimates."""
    return search_drivers(db, params)


@router.post("/estimate", response_model=PriceEstimateResponse)
def estimate_price(
    data: PriceEstimateRequest,
    current_user: User = Depends(get_current_user),
):
    """ML price estimate — no DB needed."""
    from ml.predictor import estimate_price_components

    components = estimate_price_components(
        distance_km=data.distance_km,
        vehicle_type=data.vehicle_type,
        load_weight_tons=data.load_weight_tons,
    )

    return PriceEstimateResponse(
        estimated_price=components["estimated_price"],
        price_breakdown={
            "base_fare": components["base_fare"],
            "distance_cost": components["distance_cost"],
            "weight_surcharge": components["weight_surcharge"],
            "long_trip_surcharge": components["long_trip_surcharge"],
            "service_fee": components["service_fee"],
        },
    )
