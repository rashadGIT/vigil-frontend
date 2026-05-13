import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';
const DEV_TENANT_ID = process.env.NEXT_PUBLIC_DEV_TENANT_ID ?? 'seed-tenant-id';

export async function serverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (DEV_BYPASS) {
    headers['x-dev-user'] = `dev-admin|${DEV_TENANT_ID}|admin|director@sunrise.demo`;
    headers['Authorization'] = 'Bearer dev-bypass-token';
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}
