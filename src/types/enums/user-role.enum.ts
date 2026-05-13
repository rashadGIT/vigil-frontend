export const UserRole = {
  super_admin: 'super_admin',
  funeral_director: 'funeral_director',
  staff: 'staff',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];
