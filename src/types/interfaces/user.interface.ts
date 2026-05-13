import type { UserRole } from '../enums/user-role.enum';

export interface IUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  cognitoSub: string;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
