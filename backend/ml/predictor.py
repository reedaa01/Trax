"""Matching and pricing predictor.

This module provides deterministic scoring and pricing:
- Better driver matching using city/geo proximity + capacity + quality
- Transparent fare estimation with route, vehicle and load factors
"""
import math
from typing import List, Tuple

VEHICLE_TYPES = ["pickup", "van", "truck", "semi_truck", "flatbed"]

VEHICLE_BASE_RATES = {
    "pickup": 4.2,
    "van": 5.2,
    "truck": 6.6,
    "semi_truck": 8.8,
    "flatbed": 7.8,
}


def estimate_price_components(
    distance_km: float,
    vehicle_type: str,
    load_weight_tons: float,
    departure: str | None = None,
    destination: str | None = None,
) -> dict:
    """Estimate price and return detailed deterministic breakdown."""
    d_km = max(float(distance_km or 0.0), 1.0)
    load = max(float(load_weight_tons or 0.0), 0.1)
    vtype = vehicle_type if vehicle_type in VEHICLE_BASE_RATES else "truck"

    # Core components
    base_fare = 80.0
    distance_cost = d_km * VEHICLE_BASE_RATES[vtype]
    weight_cost = _weight_surcharge(load, vtype)

    # Surcharges
    long_trip_surcharge = 0.0
    if d_km > 450:
        long_trip_surcharge = (d_km - 450) * 0.65
    elif d_km > 250:
        long_trip_surcharge = (d_km - 250) * 0.35

    city_factor = _city_route_factor(departure, destination)
    subtotal = (base_fare + distance_cost + weight_cost + long_trip_surcharge) * city_factor

    # Operational margin kept explicit for transparency
    service_fee = subtotal * 0.06
    estimated_price = max(120.0, subtotal + service_fee)

    return {
        "estimated_price": round(estimated_price, 2),
        "base_fare": round(base_fare, 2),
        "distance_cost": round(distance_cost, 2),
        "weight_surcharge": round(weight_cost, 2),
        "long_trip_surcharge": round(long_trip_surcharge, 2),
        "city_adjustment": round((city_factor - 1.0) * 100.0, 2),
        "service_fee": round(service_fee, 2),
    }


def predict_price(distance_km: float, vehicle_type: str, load_weight_tons: float) -> float:
    """Backward compatible simple price API."""
    return estimate_price_components(distance_km, vehicle_type, load_weight_tons)["estimated_price"]


def recommend_drivers(
    drivers,
    departure: str,
    destination: str,
    load_weight: float,
    departure_lat: float = None,
    departure_lng: float = None,
    destination_lat: float = None,
    destination_lng: float = None,
    distance_km: float = None,
) -> List[dict]:
    """
    Score and rank available drivers by weighted composite score.
    Returns list of DriverSearchResult-compatible dicts sorted best-first.
    """
    from app.schemas.request import DriverSearchResult
    from app.schemas.driver import DriverProfileOut

    if not drivers:
        return []

    if distance_km and distance_km > 0:
        route_km = distance_km
    elif departure_lat and departure_lng and destination_lat and destination_lng:
        route_km = max(_haversine(departure_lat, departure_lng, destination_lat, destination_lng), 1.0)
    else:
        route_km = _approx_route_distance(departure, destination)

    # Departure coordinate for proximity scoring
    if departure_lat and departure_lng:
        dep_coord = (departure_lat, departure_lng)
    else:
        dep_coord = _city_coord(departure)

    max_jobs = max((d.total_jobs for d in drivers), default=1) or 1
    results = []

    for driver in drivers:
        city_distance_km = _driver_departure_distance_km(driver, dep_coord)

        rating_score = driver.rating / 5.0
        exp_score = min(driver.total_jobs / max_jobs, 1.0)
        cap_score = _capacity_score(driver.vehicle_capacity_tons, load_weight)
        proximity_score = _proximity_score(city_distance_km)
        city_affinity_score = _city_affinity(driver.city, departure)

        # Stronger geographic and city matching weights
        score = (
            0.30 * proximity_score
            + 0.22 * city_affinity_score
            + 0.20 * rating_score
            + 0.18 * cap_score
            + 0.10 * exp_score
        )

        vtype = driver.vehicle_type.value if hasattr(driver.vehicle_type, "value") else str(driver.vehicle_type)
        price_data = estimate_price_components(
            distance_km=route_km,
            vehicle_type=vtype,
            load_weight_tons=load_weight,
            departure=departure,
            destination=destination,
        )
        # Slight pickup premium for far-away drivers to reflect deadhead cost.
        deadhead_factor = 1.0 + min(city_distance_km, 300.0) / 6000.0
        price = round(price_data["estimated_price"] * deadhead_factor, 2)

        driver_out = DriverProfileOut(
            id=driver.id,
            user_id=driver.user_id,
            full_name=driver.user.full_name,
            phone=driver.user.phone or "",
            vehicle_type=vtype,
            vehicle_plate=driver.vehicle_plate,
            vehicle_capacity_tons=driver.vehicle_capacity_tons,
            is_available=driver.is_available,
            rating=driver.rating,
            total_jobs=driver.total_jobs,
            latitude=driver.latitude,
            longitude=driver.longitude,
        )
        results.append(
            DriverSearchResult(
                driver=driver_out,
                estimated_price=price,
                estimated_distance_km=round(route_km, 1),
                recommendation_score=round(score, 4),
            )
        )

    results.sort(key=lambda r: r.recommendation_score, reverse=True)
    return results

# --- Helpers ------------------------------------------------------------------

def _capacity_score(capacity: float, load: float) -> float:
    if capacity < load:
        return 0.0
    # Prefer reasonable headroom (not too tight, not too oversized)
    ratio = load / capacity
    if ratio >= 0.9:
        return 0.75
    if ratio >= 0.6:
        return 1.0
    if ratio >= 0.35:
        return 0.85
    return 0.7


def _weight_surcharge(load: float, vehicle_type: str) -> float:
    heavy_factor_by_vehicle = {
        "pickup": 15.0,
        "van": 18.0,
        "truck": 22.0,
        "semi_truck": 27.0,
        "flatbed": 25.0,
    }
    factor = heavy_factor_by_vehicle.get(vehicle_type, 22.0)
    if load <= 1.0:
        return load * factor * 0.7
    if load <= 5.0:
        return (1.0 * factor * 0.7) + ((load - 1.0) * factor)
    return (1.0 * factor * 0.7) + (4.0 * factor) + ((load - 5.0) * factor * 1.2)


def _city_route_factor(departure: str | None, destination: str | None) -> float:
    if not departure or not destination:
        return 1.0
    dep = departure.lower()
    dest = destination.lower()
    major_hubs = ("casablanca", "rabat", "tanger", "marrakech", "agadir", "fes")
    dep_major = any(c in dep for c in major_hubs)
    dest_major = any(c in dest for c in major_hubs)
    if dep_major and dest_major:
        return 1.04
    if dep_major or dest_major:
        return 1.02
    return 1.0


def _driver_departure_distance_km(driver, departure_coord: Tuple[float, float]) -> float:
    if driver.latitude is not None and driver.longitude is not None:
        return _haversine(driver.latitude, driver.longitude, departure_coord[0], departure_coord[1])
    if driver.city:
        c = _city_coord(driver.city)
        return _haversine(c[0], c[1], departure_coord[0], departure_coord[1])
    return 450.0


def _proximity_score(distance_km: float) -> float:
    # Strongly prefer drivers near departure city
    if distance_km <= 20:
        return 1.0
    if distance_km <= 60:
        return 0.9
    if distance_km <= 120:
        return 0.75
    if distance_km <= 220:
        return 0.55
    if distance_km <= 350:
        return 0.35
    return 0.15


def _city_affinity(driver_city: str | None, departure: str | None) -> float:
    if not driver_city or not departure:
        return 0.35
    d = driver_city.lower().strip()
    u = departure.lower().strip()
    if d == u or d in u or u in d:
        return 1.0

    dc = _city_coord(driver_city)
    uc = _city_coord(departure)
    dist = _haversine(dc[0], dc[1], uc[0], uc[1])
    if dist <= 40:
        return 0.85
    if dist <= 120:
        return 0.65
    if dist <= 250:
        return 0.45
    return 0.25


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


CITY_COORDS: dict[str, Tuple[float, float]] = {
    "casablanca": (33.5731, -7.5898),
    "rabat": (34.0209, -6.8416),
    "marrakech": (31.6295, -7.9811),
    "fes": (34.0181, -5.0078),
    "tanger": (35.7595, -5.8340),
    "tangier": (35.7595, -5.8340),
    "agadir": (30.4278, -9.5981),
    "meknes": (33.8935, -5.5473),
    "oujda": (34.6814, -1.9086),
    "kenitra": (34.2610, -6.5802),
    "tetouan": (35.5785, -5.3684),
    "safi": (32.2994, -9.2372),
    "mohammedia": (33.6861, -7.3836),
    "khouribga": (32.8811, -6.9063),
    "el jadida": (33.2316, -8.5007),
    "beni mellal": (32.3373, -6.3498),
    "nador": (35.1740, -2.9287),
    "taza": (34.2100, -4.0100),
    "settat": (33.0011, -7.6197),
    "guelmim": (28.9870, -10.0574),
    "laayoune": (27.1536, -13.2033),
    "dakhla": (23.6848, -15.9572),
    "ouarzazate": (30.9335, -6.9370),
    "errachidia": (31.9314, -4.4249),
    "zagora": (30.3300, -5.8380),
    "ifrane": (33.5228, -5.1128),
    "al hoceima": (35.2517, -3.9372),
    "larache": (35.1932, -6.1561),
    "essaouira": (31.5084, -9.7595),
    "default": (31.7917, -7.0926),
}


def _city_coord(city: str) -> Tuple[float, float]:
    key = city.lower().strip()
    for k, v in CITY_COORDS.items():
        if k in key:
            return v
    return CITY_COORDS["default"]


def _approx_route_distance(departure: str, destination: str) -> float:
    c1 = _city_coord(departure)
    c2 = _city_coord(destination)
    return max(_haversine(c1[0], c1[1], c2[0], c2[1]), 20.0)
