'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { User, LoginRequest, RegisterRequest } from '@/types';
import { authService } from '@/lib/services';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('trax_token');
    const storedUser = localStorage.getItem('trax_user');
    if (storedToken && storedUser) {
      try {
        // Check token expiry
        const decoded = jwtDecode<{ exp: number }>(storedToken);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          localStorage.removeItem('trax_token');
          localStorage.removeItem('trax_user');
        }
      } catch {
        localStorage.removeItem('trax_token');
        localStorage.removeItem('trax_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      const tokens = await authService.login(data);
      localStorage.setItem('trax_token', tokens.access_token);
      const me = await authService.getMe();
      localStorage.setItem('trax_user', JSON.stringify(me));
      setToken(tokens.access_token);
      setUser(me);
      router.push(me.role === 'driver' ? '/dashboard/driver' : '/dashboard/client');
    },
    [router]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      await authService.register(data);
      await login({ email: data.email, password: data.password });
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('trax_token');
    localStorage.removeItem('trax_user');
    setToken(null);
    setUser(null);
    router.push('/auth/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
