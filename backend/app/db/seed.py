"""
Seed script: populates the DB with demo users and driver profiles.
Run: python -m app.db.seed  (from backend/ directory)
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User, UserRole
from app.models.driver import DriverProfile, VehicleType
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)

DRIVERS = [
    # Casablanca — semi-truck, long-haul veteran
    {
        "name": "Youssef El Amrani", "email": "youssef@trax.ma", "phone": "+212661234501",
        "vehicle": VehicleType.semi_truck, "plate": "12345-A-1",
        "capacity": 22.0, "rating": 4.9, "jobs": 347,
        "city": "Casablanca", "lat": 33.5731, "lng": -7.5898,
    },
    # Marrakech — truck, regional specialist
    {
        "name": "Fatima Zahra Bennani", "email": "fatima@trax.ma", "phone": "+212662345602",
        "vehicle": VehicleType.truck, "plate": "67890-B-5",
        "capacity": 12.0, "rating": 4.8, "jobs": 214,
        "city": "Marrakech", "lat": 31.6295, "lng": -7.9811,
    },
    # Tanger — flatbed, port logistics
    {
        "name": "Khalid Tazi", "email": "khalid@trax.ma", "phone": "+212663456703",
        "vehicle": VehicleType.flatbed, "plate": "11223-C-9",
        "capacity": 18.0, "rating": 4.7, "jobs": 189,
        "city": "Tanger", "lat": 35.7595, "lng": -5.8340,
    },
    # Agadir — van, south coast deliveries
    {
        "name": "Meryem Chaoui", "email": "meryem@trax.ma", "phone": "+212664567804",
        "vehicle": VehicleType.van, "plate": "44556-D-3",
        "capacity": 3.5, "rating": 4.6, "jobs": 98,
        "city": "Agadir", "lat": 30.4278, "lng": -9.5981,
    },
    # Fès — truck, northern interior routes
    {
        "name": "Omar Benkirane", "email": "omar@trax.ma", "phone": "+212665678905",
        "vehicle": VehicleType.truck, "plate": "77889-E-7",
        "capacity": 10.0, "rating": 4.8, "jobs": 163,
        "city": "Fès", "lat": 34.0181, "lng": -5.0078,
    },
    # Oujda — semi-truck, eastern border trade
    {
        "name": "Hassan Lahlou", "email": "hassan@trax.ma", "phone": "+212666789006",
        "vehicle": VehicleType.semi_truck, "plate": "99001-F-2",
        "capacity": 20.0, "rating": 4.5, "jobs": 127,
        "city": "Oujda", "lat": 34.6814, "lng": -1.9086,
    },
    # Rabat — pickup, last-mile urban
    {
        "name": "Nadia Berrada", "email": "nadia@trax.ma", "phone": "+212667890107",
        "vehicle": VehicleType.pickup, "plate": "22334-G-6",
        "capacity": 1.5, "rating": 4.7, "jobs": 72,
        "city": "Rabat", "lat": 34.0209, "lng": -6.8416,
    },
    # Ouarzazate — flatbed, desert / construction routes
    {
        "name": "Abdelaziz Moukrim", "email": "abdelaziz@trax.ma", "phone": "+212668901208",
        "vehicle": VehicleType.flatbed, "plate": "55667-H-4",
        "capacity": 16.0, "rating": 4.4, "jobs": 85,
        "city": "Ouarzazate", "lat": 30.9335, "lng": -6.9370,
    },
]

CLIENTS = [
    {"name": "Karim Alaoui",    "email": "karim@client.ma",    "phone": "+212621000001"},
    {"name": "Salma Benchekroun","email": "salma@client.ma",   "phone": "+212621000002"},
]


def seed():
    db = SessionLocal()
    try:
        for d in DRIVERS:
            if db.query(User).filter(User.email == d["email"]).first():
                continue
            user = User(
                email=d["email"],
                full_name=d["name"],
                phone=d["phone"],
                hashed_pw=hash_password("password123"),
                role=UserRole.driver,
            )
            db.add(user)
            db.flush()
            profile = DriverProfile(
                user_id=user.id,
                vehicle_type=d["vehicle"],
                vehicle_plate=d["plate"],
                vehicle_capacity_tons=d["capacity"],
                is_available=True,
                rating=d["rating"],
                total_jobs=d["jobs"],
                city=d["city"],
                latitude=d["lat"],
                longitude=d["lng"],
            )
            db.add(profile)

        for c in CLIENTS:
            if db.query(User).filter(User.email == c["email"]).first():
                continue
            user = User(
                email=c["email"],
                full_name=c["name"],
                phone=c["phone"],
                hashed_pw=hash_password("password123"),
                role=UserRole.client,
            )
            db.add(user)

        db.commit()
        print("Seed complete!")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
