// ─── Auth ────────────────────────────────────────────────────────────────────
export type UserRole = 'client' | 'driver';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone: string;
  // Driver-only fields
  vehicle_type?: string;
  vehicle_plate?: string;
  vehicle_capacity_tons?: number;
  city?: string;
  city_lat?: number;
  city_lng?: number;
}

// ─── Driver ──────────────────────────────────────────────────────────────────
export type VehicleType = 'pickup' | 'van' | 'truck' | 'semi_truck' | 'flatbed';

export interface DriverProfile {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  city?: string;
  vehicle_type: VehicleType;
  vehicle_plate: string;
  vehicle_capacity_tons: number;
  is_available: boolean;
  rating: number;
  total_jobs: number;
  latitude?: number;
  longitude?: number;
}

// ─── Transport Request ────────────────────────────────────────────────────────//
export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface TransportRequest {
  id: number;
  client_id: number;
  driver_id?: number;
  departure_location: string;
  destination: string;
  departure_lat: number;
  departure_lng: number;
  destination_lat: number;
  destination_lng: number;
  scheduled_date: string;
  load_description: string;
  load_weight_tons: number;
  vehicle_type_required: VehicleType;
  estimated_price: number;
  final_price?: number;
  status: RequestStatus;
  review_rating?: number;
  review_comment?: string;
  created_at: string;
  driver?: DriverProfile;
}

// ─── Search ───────────────────────────────────────────────────────────────────
export interface SearchParams {
  departure_location: string;
  destination: string;
  scheduled_date: string;
  vehicle_type?: string;   // loosely typed here; cast to VehicleType where needed
  load_weight_tons?: number;
  // Real coordinates from the map
  departure_lat?: number;
  departure_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  distance_km?: number;    // pre-computed Haversine distance from the map
}

export interface DriverSearchResult {
  driver: DriverProfile;
  estimated_price: number;
  estimated_distance_km: number;
  recommendation_score: number;
}

// ─── Price Estimate ────────────────────────────────────────────────────────────
export interface PriceEstimateRequest {
  distance_km: number;
  vehicle_type: VehicleType;
  load_weight_tons: number;
}

export interface PriceEstimateResponse {
  estimated_price: number;
  price_breakdown: {
    base_fare: number;
    distance_cost: number;
    weight_surcharge: number;
    vehicle_premium: number;
  };
}

// ─── API Response wrapper ─────────────────────────────────────────────────────
export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
