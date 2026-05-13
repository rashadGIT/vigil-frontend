export interface IFamilyContact {
  id: string;
  tenantId: string;
  caseId: string;
  name: string;
  relationship: string;
  email: string | null;
  phone: string | null;
  isPrimaryContact: boolean;
  createdAt: string;
  updatedAt: string;
}
