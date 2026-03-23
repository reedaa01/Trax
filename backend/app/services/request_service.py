import math
from typing import List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.request import TransportRequest, RequestStatus
from app.models.driver import DriverProfile
from app.models.user import User
from app.schemas.request import TransportRequestCreate


def _with_driver(q):
    """Eagerly load the driver + their user so DriverProfileOut can resolve full_name/phone."""
    return q.options(
        joinedload(TransportRequest.driver).joinedload(DriverProfile.user)
    )


def _reload(db: Session, req: TransportRequest) -> TransportRequest:
    """Re-fetch a request with the driver+user join after a commit."""
    return (
        _with_driver(db.query(TransportRequest))
        .filter(TransportRequest.id == req.id)
        .first()
    )


def create_request(db: Session, data: TransportRequestCreate, client: User) -> TransportRequest:
    from ml.predictor import predict_price

    price = predict_price(
        distance_km=_approx_distance(
            data.departure_lat, data.departure_lng,
            data.destination_lat, data.destination_lng,
        ),
        vehicle_type=data.vehicle_type_required,
        load_weight_tons=data.load_weight_tons,
    )

    req = TransportRequest(
        client_id=client.id,
        driver_id=data.driver_id,
        departure_location=data.departure_location,
        destination=data.destination,
        departure_lat=data.departure_lat,
        departure_lng=data.departure_lng,
        destination_lat=data.destination_lat,
        destination_lng=data.destination_lng,
        scheduled_date=data.scheduled_date,
        load_description=data.load_description,
        load_weight_tons=data.load_weight_tons,
        vehicle_type_required=data.vehicle_type_required,
        estimated_price=price if price > 0 else data.estimated_price,
        status=RequestStatus.pending,
    )
    db.add(req)
    db.commit()
    return _reload(db, req)


def get_client_requests(db: Session, client: User) -> List[TransportRequest]:
    return (
        _with_driver(db.query(TransportRequest))
        .filter(TransportRequest.client_id == client.id)
        .order_by(TransportRequest.created_at.desc())
        .all()
    )


def get_request_by_id(db: Session, request_id: int, user: User) -> TransportRequest:
    req = (
        _with_driver(db.query(TransportRequest))
        .filter(TransportRequest.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    from app.models.driver import DriverProfile
    is_client = req.client_id == user.id
    driver_profile = db.query(DriverProfile).filter(DriverProfile.user_id == user.id).first()
    is_driver = driver_profile and req.driver_id == driver_profile.id
    if not (is_client or is_driver):
        raise HTTPException(status_code=403, detail="Access denied")
    return req


def get_driver_requests(db: Session, driver_profile: DriverProfile) -> List[TransportRequest]:
    return (
        _with_driver(db.query(TransportRequest))
        .filter(TransportRequest.driver_id == driver_profile.id)
        .order_by(TransportRequest.created_at.desc())
        .all()
    )


def get_driver_incoming(db: Session, driver_profile: DriverProfile) -> List[TransportRequest]:
    return (
        _with_driver(db.query(TransportRequest))
        .filter(
            TransportRequest.driver_id == driver_profile.id,
            TransportRequest.status == RequestStatus.pending,
        )
        .order_by(TransportRequest.created_at.desc())
        .all()
    )


def respond_to_request(
    db: Session,
    request_id: int,
    driver_profile: DriverProfile,
    action: str,
) -> TransportRequest:
    req = db.query(TransportRequest).filter(TransportRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.driver_id != driver_profile.id:
        raise HTTPException(status_code=403, detail="Not your request")
    if req.status != RequestStatus.pending:
        raise HTTPException(status_code=400, detail="Request is no longer pending")

    if action == "accept":
        req.status = RequestStatus.accepted
        driver_profile.is_available = False
    elif action == "reject":
        req.status = RequestStatus.rejected
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'accept' or 'reject'")

    db.commit()
    return _reload(db, req)


def driver_arrived(
    db: Session,
    request_id: int,
    driver_profile: DriverProfile,
) -> TransportRequest:
    req = db.query(TransportRequest).filter(TransportRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.driver_id != driver_profile.id:
        raise HTTPException(status_code=403, detail="Not your request")
    if req.status != RequestStatus.accepted:
        raise HTTPException(status_code=400, detail="Request must be accepted first")
    req.status = RequestStatus.in_progress
    db.commit()
    return _reload(db, req)


def client_confirm_delivery(
    db: Session,
    request_id: int,
    client: User,
) -> TransportRequest:
    req = db.query(TransportRequest).filter(TransportRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.client_id != client.id:
        raise HTTPException(status_code=403, detail="Not your request")
    if req.status != RequestStatus.in_progress:
        raise HTTPException(status_code=400, detail="Driver must mark arrived first")
    req.status = RequestStatus.completed
    # Free up the driver
    if req.driver_id:
        driver = db.query(DriverProfile).filter(DriverProfile.id == req.driver_id).first()
        if driver:
            driver.is_available = True
    db.commit()
    return _reload(db, req)


def cancel_request(db: Session, request_id: int, client: User) -> TransportRequest:
    req = db.query(TransportRequest).filter(TransportRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.client_id != client.id:
        raise HTTPException(status_code=403, detail="Not your request")
    if req.status not in (RequestStatus.pending, RequestStatus.accepted):
        raise HTTPException(status_code=400, detail="Cannot cancel at this stage")

    req.status = RequestStatus.cancelled
    if req.driver_id:
        driver = db.query(DriverProfile).filter(DriverProfile.id == req.driver_id).first()
        if driver:
            driver.is_available = True

    db.commit()
    return _reload(db, req)


def submit_review(
    db: Session,
    request_id: int,
    client: User,
    rating: float,
    comment: str | None,
) -> TransportRequest:
    req = db.query(TransportRequest).filter(TransportRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.client_id != client.id:
        raise HTTPException(status_code=403, detail="Not your request")
    if req.status != RequestStatus.completed:
        raise HTTPException(status_code=400, detail="Can only review completed requests")
    if req.review_rating is not None:
        raise HTTPException(status_code=400, detail="Already reviewed")
    if not (1.0 <= rating <= 5.0):
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")

    req.review_rating  = round(rating * 2) / 2   # round to nearest 0.5
    req.review_comment = comment

    # Update driver's rolling average rating
    if req.driver_id:
        driver = db.query(DriverProfile).filter(DriverProfile.id == req.driver_id).first()
        if driver:
            reviewed = (
                db.query(TransportRequest)
                .filter(
                    TransportRequest.driver_id == driver.id,
                    TransportRequest.review_rating.isnot(None),
                )
                .all()
            )
            total_ratings = [r.review_rating for r in reviewed] + [req.review_rating]
            driver.rating = round(sum(total_ratings) / len(total_ratings), 2)

    db.commit()
    return _reload(db, req)


def _approx_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine distance in km. Falls back to 100 km when coords are (0,0)."""
    if lat1 == 0 and lng1 == 0 and lat2 == 0 and lng2 == 0:
        return 100.0
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
