from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_role, get_current_user
from app.models.user import User
from app.schemas.request import TransportRequestCreate, TransportRequestOut, ReviewBody
from app.services import request_service, driver_service

router = APIRouter()
require_client = require_role("client")
require_driver = require_role("driver")


@router.post("", response_model=TransportRequestOut, status_code=201)
def create_request(
    data: TransportRequestCreate,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    """Client creates a new transport request."""
    return request_service.create_request(db, data, current_user)


@router.get("", response_model=List[TransportRequestOut])
def get_my_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all requests for the current user (client)."""
    return request_service.get_client_requests(db, current_user)


@router.get("/{request_id}", response_model=TransportRequestOut)
def get_request_by_id(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch a single request by ID (client or driver can view their own)."""
    return request_service.get_request_by_id(db, request_id, current_user)


@router.patch("/{request_id}/respond", response_model=TransportRequestOut)
def respond_to_request(
    request_id: int,
    body: "RequestRespondBody",
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    profile = driver_service.get_driver_profile(db, current_user)
    return request_service.respond_to_request(db, request_id, profile, body.action)


@router.patch("/{request_id}/cancel", response_model=TransportRequestOut)
def cancel_request(
    request_id: int,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    return request_service.cancel_request(db, request_id, current_user)


@router.patch("/{request_id}/arrived", response_model=TransportRequestOut)
def driver_arrived(
    request_id: int,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    """Driver marks they have arrived — moves job to in_progress."""
    profile = driver_service.get_driver_profile(db, current_user)
    return request_service.driver_arrived(db, request_id, profile)


@router.patch("/{request_id}/confirm-delivery", response_model=TransportRequestOut)
def confirm_delivery(
    request_id: int,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    """Client confirms delivery — moves job to completed."""
    return request_service.client_confirm_delivery(db, request_id, current_user)


@router.post("/{request_id}/review", response_model=TransportRequestOut)
def review_request(
    request_id: int,
    body: ReviewBody,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    """Client submits a 1–5 star review after a completed job."""
    return request_service.submit_review(db, request_id, current_user, body.rating, body.comment)


# Avoid circular — import after router is defined
from app.schemas.request import RequestRespondBody  # noqa: E402, F811
