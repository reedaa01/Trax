import api from './api';
import {
  LoginRequest,
  RegisterRequest,
  AuthTokens,
  User,
  DriverProfile,
  TransportRequest,
  SearchParams,
  DriverSearchResult,
  PriceEstimateRequest,
  PriceEstimateResponse,
  PaginatedResponse,
} from '@/types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login: async (data: LoginRequest): Promise<AuthTokens> => {
    // FastAPI OAuth2 expects form data
    const form = new URLSearchParams();
    form.append('username', data.email);
    form.append('password', data.password);
    const res = await api.post<AuthTokens>('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const res = await api.post<User>('/auth/register', data);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

// ─── Drivers ──────────────────────────────────────────────────────────────────
export const driverService = {
  getProfile: async (): Promise<DriverProfile> => {
    const res = await api.get<DriverProfile>('/drivers/profile');
    return res.data;
  },

  updateProfile: async (data: Partial<DriverProfile>): Promise<DriverProfile> => {
    const res = await api.put<DriverProfile>('/drivers/profile', data);
    return res.data;
  },

  setAvailability: async (available: boolean): Promise<DriverProfile> => {
    const res = await api.patch<DriverProfile>('/drivers/availability', {
      is_available: available,
    });
    return res.data;
  },

  getMyJobs: async (): Promise<TransportRequest[]> => {
    const res = await api.get<TransportRequest[]>('/drivers/jobs');
    return res.data;
  },

  getIncomingRequests: async (): Promise<TransportRequest[]> => {
    const res = await api.get<TransportRequest[]>('/drivers/requests');
    return res.data;
  },
};

// ─── Transport Requests ───────────────────────────────────────────────────────
export const requestService = {
  create: async (data: Partial<TransportRequest>): Promise<TransportRequest> => {
    const res = await api.post<TransportRequest>('/requests', data);
    return res.data;
  },

  getMyRequests: async (): Promise<TransportRequest[]> => {
    const res = await api.get<TransportRequest[]>('/requests');
    return res.data;
  },

  getById: async (id: number): Promise<TransportRequest> => {
    const res = await api.get<TransportRequest>(`/requests/${id}`);
    return res.data;
  },

  respond: async (
    id: number,
    action: 'accept' | 'reject'
  ): Promise<TransportRequest> => {
    const res = await api.patch<TransportRequest>(`/requests/${id}/respond`, { action });
    return res.data;
  },  cancel: async (id: number): Promise<TransportRequest> => {
    const res = await api.patch<TransportRequest>(`/requests/${id}/cancel`);
    return res.data;
  },

  arrived: async (id: number): Promise<TransportRequest> => {
    const res = await api.patch<TransportRequest>(`/requests/${id}/arrived`);
    return res.data;
  },

  confirmDelivery: async (id: number): Promise<TransportRequest> => {
    const res = await api.patch<TransportRequest>(`/requests/${id}/confirm-delivery`);
    return res.data;
  },

  review: async (id: number, rating: number, comment?: string): Promise<TransportRequest> => {
    const res = await api.post<TransportRequest>(`/requests/${id}/review`, { rating, comment });
    return res.data;
  },
};

// ─── Search & ML ──────────────────────────────────────────────────────────────
export const searchService = {
  searchDrivers: async (params: SearchParams): Promise<DriverSearchResult[]> => {
    const res = await api.post<DriverSearchResult[]>('/search/drivers', params);
    return res.data;
  },

  estimatePrice: async (
    data: PriceEstimateRequest
  ): Promise<PriceEstimateResponse> => {
    const res = await api.post<PriceEstimateResponse>('/search/estimate', data);
    return res.data;
  },
};

// ─── Admin / Stats ────────────────────────────────────────────────────────────
export const statsService = {
  getDashboardStats: async (): Promise<PaginatedResponse<TransportRequest>> => {
    const res = await api.get('/requests?page=1&size=20');
    return res.data;
  },
};
