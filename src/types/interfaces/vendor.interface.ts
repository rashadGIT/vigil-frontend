import type { VendorType } from '../enums/vendor-type.enum';

export interface IVendor {
  id: string;
  tenantId: string;
  name: string;
  type: VendorType;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  deletedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
