import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class UserRole(str, enum.Enum):
    client = "client"
    driver = "driver"


class User(Base):
    """
    Core user account. Role determines access:
    - client: can create/view transport requests
    - driver: can accept/reject requests, manage availability
    """
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String(255), unique=True, index=True, nullable=False)
    full_name  = Column(String(255), nullable=False)
    phone      = Column(String(50), nullable=True)
    hashed_pw  = Column(String(255), nullable=False)
    role       = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    driver_profile = relationship("DriverProfile", back_populates="user", uselist=False)
    transport_requests = relationship(
        "TransportRequest",
        back_populates="client",
        foreign_keys="TransportRequest.client_id",
    )
