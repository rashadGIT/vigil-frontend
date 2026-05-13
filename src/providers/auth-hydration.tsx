'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';

export function AuthHydration() {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);
  return null;
}
