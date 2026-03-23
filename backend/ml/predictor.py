"""
ML Predictor Module
===================
1. predict_price  -- Ridge regression on synthetic freight pricing data.
   Features: distance_km, load_weight_tons, vehicle_type (one-hot)

2. recommend_drivers -- Weighted score per driver:
   score = 0.35*rating + 0.25*experience + 0.20*capacity_match + 0.20*proximity
   Returns drivers sorted by score descending.

Models are trained at import time on synthetic data (no .pkl files needed).
"""
import math
import random
from typing import List, Tuple

import numpy as np
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# --- Vehicle config -----------------------------------------------------------

VEHICLE_TYPES = ["pickup", "van", "truck", "semi_truck", "flatbed"]

# Rates in MAD per km — realistic Moroccan freight market
VEHICLE_BASE_RATES = {
    "pickup":     6.5,
    "van":        9.0,
    "truck":      12.0,
    "semi_truck": 18.0,
    "flatbed":    16.0,
}

# --- Training data generation -------------------------------------------------

def _generate_training_data(n: int = 2000) -> Tuple[np.ndarray, np.ndarray]:
    rng = np.random.RandomState(42)
    X, y = [], []
    for _ in range(n):
        distance = rng.uniform(10, 1500)          # Morocco max ~1 400 km end-to-end
        weight   = rng.uniform(0.1, 30)
        vtype    = rng.choice(VEHICLE_TYPES)
        rate     = VEHICLE_BASE_RATES[vtype]
        # Base fare 150 MAD + distance cost + weight surcharge (35 MAD/ton)
        price    = max(150.0, 150.0 + distance * rate * 0.85 + weight * 35.0 + rng.normal(0, 80))
        v_enc    = [1 if vtype == v else 0 for v in VEHICLE_TYPES]
        X.append([distance, weight] + v_enc)
        y.append(price)
    return np.array(X), np.array(y)


# --- Train at import time -----------------------------------------------------

_X, _y = _generate_training_data()
price_model = Pipeline([
    ("scaler", StandardScaler()),
    ("model",  Ridge(alpha=1.0)),
])
price_model.fit(_X, _y)

# --- Public API ---------------------------------------------------------------

def predict_price(distance_km: float, vehicle_type: str, load_weight_tons: float) -> float:
    """Predict freight price in MAD using trained Ridge regression model."""
    if vehicle_type not in VEHICLE_TYPES:
        vehicle_type = "truck"
    v_enc = [1 if vehicle_type == v else 0 for v in VEHICLE_TYPES]
    features = np.array([[distance_km, load_weight_tons] + v_enc])
    price = float(price_model.predict(features)[0])
    return max(150.0, round(price, 2))


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

    # --- Route distance: use real coords if provided, else city-name lookup ---
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
        if driver.latitude and driver.longitude:
            dist_km = _haversine(driver.latitude, driver.longitude, dep_coord[0], dep_coord[1])
        else:
            dist_km = random.uniform(5, 300)

        rating_score = driver.rating / 5.0
        exp_score    = min(driver.total_jobs / max_jobs, 1.0)
        cap_score    = _capacity_score(driver.vehicle_capacity_tons, load_weight)
        # Proximity within Morocco: 500 km covers the whole country end-to-end
        dist_score   = max(0.0, 1.0 - (dist_km / 500.0))

        score = (0.35 * rating_score + 0.25 * exp_score +
                 0.20 * cap_score    + 0.20 * dist_score)

        vtype = driver.vehicle_type.value if hasattr(driver.vehicle_type, "value") else str(driver.vehicle_type)
        price = predict_price(route_km, vtype, load_weight)

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
    ratio = load / capacity
    return ratio if ratio >= 0.5 else ratio * 0.8


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


CITY_COORDS: dict[str, Tuple[float, float]] = {
    # Major Moroccan cities (lat, lng)
    "casablanca":   (33.5731, -7.5898),
    "rabat":        (34.0209, -6.8416),
    "marrakech":    (31.6295, -7.9811),
    "fès":          (34.0181, -5.0078),
    "fes":          (34.0181, -5.0078),
    "tanger":       (35.7595, -5.8340),
    "tangier":      (35.7595, -5.8340),
    "agadir":       (30.4278, -9.5981),
    "meknès":       (33.8935, -5.5473),
    "meknes":       (33.8935, -5.5473),
    "oujda":        (34.6814, -1.9086),
    "kenitra":      (34.2610, -6.5802),
    "tétouan":      (35.5785, -5.3684),
    "tetouan":      (35.5785, -5.3684),
    "safi":         (32.2994, -9.2372),
    "mohammedia":   (33.6861, -7.3836),
    "khouribga":    (32.8811, -6.9063),
    "el jadida":    (33.2316, -8.5007),
    "béni mellal":  (32.3373, -6.3498),
    "beni mellal":  (32.3373, -6.3498),
    "nador":        (35.1740, -2.9287),
    "taza":         (34.2100, -4.0100),
    "settat":       (33.0011, -7.6197),
    "guelmim":      (28.9870, -10.0574),
    "laâyoune":     (27.1536, -13.2033),
    "laayoune":     (27.1536, -13.2033),
    "dakhla":       (23.6848, -15.9572),
    "ouarzazate":   (30.9335, -6.9370),
    "errachidia":   (31.9314, -4.4249),
    "zagora":       (30.3300, -5.8380),
    "ifrane":       (33.5228, -5.1128),
    "al hoceïma":   (35.2517, -3.9372),
    "al hoceima":   (35.2517, -3.9372),
    "larache":      (35.1932, -6.1561),
    "essaouira":    (31.5084, -9.7595),
    # Fallback: geographic centre of Morocco
    "default":      (31.7917, -7.0926),
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
