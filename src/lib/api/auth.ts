import { signIn, signOut } from 'aws-amplify/auth';
import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

// Amplify throws "redirect is coming from a different origin" when it finds
// stale inflightOAuth state from a previous (possibly cross-origin) Google attempt.
// Clear it before any Amplify auth call so both flows start clean.
function clearStaleOAuthState() {
  if (typeof window === 'undefined') return;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
  const prefix = `CognitoIdentityServiceProvider.${clientId}`;
  localStorage.removeItem(`${prefix}.inflightOAuth`);
  localStorage.removeItem(`${prefix}.oauthState`);
  localStorage.removeItem(`${prefix}.oauthPKCE`);
}

// Login flow:
// 1. Authenticate (Cognito in prod, no-op in dev)
// 2. Backend sets access_token as httpOnly cookie on its /auth/login endpoint
// 3. Fetch /auth/me to get user metadata for the Zustand store
// The token itself never touches the browser JS context in production.
export async function login(credentials: LoginCredentials): Promise<UserProfile> {
  if (!DEV_BYPASS) {
    clearStaleOAuthState();
    // Amplify handles Cognito USER_PASSWORD_AUTH
    await signIn({ username: credentials.email, password: credentials.password });
    // Exchange Cognito tokens for backend session cookie
    await apiClient.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
  }
  // In both dev and prod, /auth/me returns the current user from request context
  const res = await apiClient.get<UserProfile>('/auth/me');
  return res.data;
}

export async function logout(): Promise<void> {
  if (!DEV_BYPASS) {
    await signOut().catch(() => null);
  }
  // Clear the httpOnly access_token and refresh_token cookies via backend
  await apiClient.post('/auth/logout').catch(() => null);
}

export async function getMe(): Promise<UserProfile> {
  const res = await apiClient.get<UserProfile>('/auth/me');
  return res.data;
}
