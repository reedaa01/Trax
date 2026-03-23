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
    from ml.predictor import predict_price

    price = predict_price(
        distance_km=data.distance_km,
        vehicle_type=data.vehicle_type,
        load_weight_tons=data.load_weight_tons,
    )
    vehicle_premiums = {
        "pickup": 1.0, "van": 1.2, "truck": 1.5,
        "semi_truck": 2.0, "flatbed": 1.8,
    }
    premium = vehicle_premiums.get(data.vehicle_type, 1.5)
    base_fare = 15.0
    distance_cost = data.distance_km * 0.85
    weight_surcharge = data.load_weight_tons * 3.5
    vehicle_premium = (base_fare + distance_cost) * (premium - 1)

    return PriceEstimateResponse(
        estimated_price=round(price, 2),
        price_breakdown={
            "base_fare": round(base_fare, 2),
            "distance_cost": round(distance_cost, 2),
            "weight_surcharge": round(weight_surcharge, 2),
            "vehicle_premium": round(vehicle_premium, 2),
        },
    )
