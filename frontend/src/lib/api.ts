import axios from 'axios';

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();
const loweredApiUrl = rawApiUrl.toLowerCase();
const isProd = process.env.NODE_ENV === 'production';

if (loweredApiUrl.startsWith('mysql://') || loweredApiUrl.startsWith('mysql+pymysql://')) {
  throw new Error('[TraX] NEXT_PUBLIC_API_URL is invalid: it points to MySQL. Use your backend HTTP URL (https://...up.railway.app).');
}

if (!rawApiUrl) {
  if (isProd) {
    throw new Error('[TraX] NEXT_PUBLIC_API_URL is required in production. Set it to your Railway backend URL.');
  }
  console.warn('[TraX] WARNING: NEXT_PUBLIC_API_URL is not set — falling back to http://localhost:8000. Set this variable in Railway to your backend URL.');
}

const API_BASE = (rawApiUrl || 'http://localhost:8000')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('trax_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On 401, clear auth and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('trax_token');
      localStorage.removeItem('trax_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;
