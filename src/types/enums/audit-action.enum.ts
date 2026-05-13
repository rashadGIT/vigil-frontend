export const AuditAction = {
  create: 'create',
  update: 'update',
  delete: 'delete',
  view_sensitive: 'view_sensitive',
} as const;
export type AuditAction = typeof AuditAction[keyof typeof AuditAction];
