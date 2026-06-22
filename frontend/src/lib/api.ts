import axios from 'axios';

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn('[TraX] WARNING: NEXT_PUBLIC_API_URL is not set — falling back to http://localhost:8000. Set this variable in Railway to your backend URL.');
}
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
