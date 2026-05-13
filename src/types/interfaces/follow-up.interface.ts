import type { FollowUpTemplate } from '../enums/follow-up-template.enum';

export interface IFollowUp {
  id: string;
  tenantId: string;
  caseId: string;
  contactId: string;
  templateType: FollowUpTemplate;
  status: string;
  scheduledAt: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}
