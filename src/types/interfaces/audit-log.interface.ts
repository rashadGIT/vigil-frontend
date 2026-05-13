import type { AuditAction } from '../enums/audit-action.enum';

export interface IAuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changedFields: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}
