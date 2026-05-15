'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { getMe } from '@/lib/api/auth';

export function AuthInitializer() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    // useAuthStore uses skipHydration — manually rehydrate from persisted storage first
    useAuthStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    // Always refresh from /auth/me on mount to pick up role changes or new sessions
    getMe()
      .then(setUser)
      .catch(() => {
        // 401 handled by apiClient interceptor which redirects to /login
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
