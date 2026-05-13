'use client';

import { useAuthStore } from '@/lib/store/auth.store';

export type AppRole = 'super_admin' | 'funeral_director' | 'staff';

export function useCurrentUser() {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? 'staff') as AppRole;

  return {
    user,
    role,
    isSuperAdmin: role === 'super_admin',
    isFuneralDirector: role === 'funeral_director',
    isStaff: role === 'staff',
    canManageUsers: role === 'funeral_director' || role === 'super_admin',
    canAccessSettings: role === 'funeral_director' || role === 'super_admin',
  };
}
