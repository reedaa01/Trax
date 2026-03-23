# Import all models here so SQLAlchemy metadata knows about them before create_all()
from app.db.session import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.driver import DriverProfile  # noqa: F401
from app.models.request import TransportRequest  # noqa: F401
