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

// Read Cognito access token from localStorage (set by OAuth callback or Amplify SDK).
// Returns null in SSR context or when not authenticated.
function getCognitoAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
  const sub = localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.LastAuthUser`);
  if (!sub) return null;
  return localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.${sub}.accessToken`);
}

// Request interceptor: inject auth headers
apiClient.interceptors.request.use((config) => {
  if (BYPASS_ACTIVE) {
    config.headers['x-dev-user'] = `dev-admin|${DEV_TENANT_ID}|funeral_director|director@sunrise.demo`;
    config.headers['Authorization'] = 'Bearer dev-bypass-token';
    return config;
  }
  // Cookies are domain-scoped — the access_token cookie set by the OAuth callback
  // lives on the frontend domain and is never sent to api.vigil.automagicly.ai.
  // Instead, read the Cognito access token from localStorage and send as Bearer.
  const token = getCognitoAccessToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
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
