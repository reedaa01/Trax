import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base


class VehicleType(str, enum.Enum):
    pickup     = "pickup"
    van        = "van"
    truck      = "truck"
    semi_truck = "semi_truck"
    flatbed    = "flatbed"


class DriverProfile(Base):
    """
    Extended profile for driver-role users.
    One-to-one with User. Stores vehicle info, rating, and GPS coords.
    """
    __tablename__ = "driver_profiles"

    id                    = Column(Integer, primary_key=True, index=True)
    user_id               = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    vehicle_type          = Column(Enum(VehicleType), nullable=False, default=VehicleType.truck)
    vehicle_plate         = Column(String(50), nullable=True)
    vehicle_capacity_tons = Column(Float, nullable=False, default=5.0)
    is_available          = Column(Boolean, default=True)
    rating                = Column(Float, default=5.0)
    total_jobs            = Column(Integer, default=0)
    # Driver's home city — used for proximity pre-filtering in search
    city                  = Column(String(100), nullable=True)
    # Approximate last known location (used for distance matching)
    latitude              = Column(Float, nullable=True)
    longitude             = Column(Float, nullable=True)

    user = relationship("User", back_populates="driver_profile")
    jobs = relationship(
        "TransportRequest",
        back_populates="driver",
        foreign_keys="TransportRequest.driver_id",
    )
