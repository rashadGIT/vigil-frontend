import type { ServiceType } from '../enums/service-type.enum';
import type { CaseStatus } from '../enums/case-status.enum';
import type { CaseStage } from '../enums/case-stage.enum';

export interface ICase {
  id: string;
  tenantId: string;
  deceasedName: string;
  deceasedDob: string | null;
  deceasedDod: string | null;
  serviceType: ServiceType;
  status: CaseStatus;
  stage: CaseStage;
  assignedToId: string | null;
  faithTradition: string | null;
  deletedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  overdueTaskCount?: number;
}
