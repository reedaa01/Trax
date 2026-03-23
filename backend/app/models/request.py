import enum
from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey,
    Enum, DateTime, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class RequestStatus(str, enum.Enum):
    pending     = "pending"
    accepted    = "accepted"
    rejected    = "rejected"
    in_progress = "in_progress"
    completed   = "completed"
    cancelled   = "cancelled"


class TransportRequest(Base):
    """
    Core business entity. Tracks a shipment from creation to completion.
    Links a client to a driver through a lifecycle of statuses.
    """
    __tablename__ = "transport_requests"

    id                    = Column(Integer, primary_key=True, index=True)
    client_id             = Column(Integer, ForeignKey("users.id"), nullable=False)
    driver_id             = Column(Integer, ForeignKey("driver_profiles.id"), nullable=True)

    departure_location    = Column(String(255), nullable=False)
    destination           = Column(String(255), nullable=False)
    departure_lat         = Column(Float, nullable=False, default=0.0)
    departure_lng         = Column(Float, nullable=False, default=0.0)
    destination_lat       = Column(Float, nullable=False, default=0.0)
    destination_lng       = Column(Float, nullable=False, default=0.0)

    scheduled_date        = Column(DateTime(timezone=True), nullable=False)
    load_description      = Column(Text, nullable=True)
    load_weight_tons      = Column(Float, nullable=False, default=1.0)
    vehicle_type_required = Column(String(50), nullable=False, default="truck")

    estimated_price       = Column(Float, nullable=False, default=0.0)
    final_price           = Column(Float, nullable=True)

    status                = Column(Enum(RequestStatus), default=RequestStatus.pending, index=True)

    # Client review (submitted after completion)
    review_rating         = Column(Float, nullable=True)     # 1–5
    review_comment        = Column(Text, nullable=True)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())
    updated_at            = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    client = relationship(
        "User",
        back_populates="transport_requests",
        foreign_keys=[client_id],
    )
    driver = relationship(
        "DriverProfile",
        back_populates="jobs",
        foreign_keys=[driver_id],
    )
