import axios from 'axios';
import { useAuthStore } from '@/lib/store/auth.store';

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';
const DEV_TENANT_ID = process.env.NEXT_PUBLIC_DEV_TENANT_ID ?? 'seed-tenant-id';

// Never allow dev bypass in production builds regardless of env var
const BYPASS_ACTIVE = DEV_BYPASS && process.env.NODE_ENV !== 'production';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  // withCredentials sends the httpOnly access_token cookie on every request
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inject dev bypass headers only in non-production
apiClient.interceptors.request.use((config) => {
  if (BYPASS_ACTIVE) {
    config.headers['x-dev-user'] = `dev-admin|${DEV_TENANT_ID}|funeral_director|director@sunrise.demo`;
    config.headers['Authorization'] = 'Bearer dev-bypass-token';
  }
  // In production the httpOnly cookie is sent automatically via withCredentials.
  // No token reading from localStorage or the Zustand store.
  return config;
});

// Response interceptor: on 401, clear auth state and redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      useAuthStore.getState().clearUser();
      const current = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${current}`;
    }
    return Promise.reject(error);
  },
);
