import { apiClient } from './client';

export type PreNeedStatus = 'active' | 'converted' | 'cancelled';
export type ServiceType = 'burial' | 'cremation' | 'graveside' | 'memorial';
export type FundingType = 'Insurance' | 'Trust' | 'Cash' | 'Combination';

export interface PreNeedArrangement {
  id: string;
  firstName: string;
  lastName: string;
  dob?: string;
  phone?: string;
  email?: string;
  address?: string;
  serviceType: ServiceType;
  fundingType?: FundingType;
  insuranceCompany?: string;
  policyNumber?: string;
  faceValue?: number;
  notes?: string;
  status: PreNeedStatus;
  convertedCaseId?: string;
  createdAt: string;
}

export interface CreatePreNeedDto {
  firstName: string;
  lastName: string;
  dob?: string;
  phone?: string;
  email?: string;
  address?: string;
  serviceType: ServiceType;
  fundingType: FundingType;
  insuranceCompany?: string;
  policyNumber?: string;
  faceValue?: number;
  notes?: string;
}

export interface ConvertPreNeedResponse {
  arrangement: unknown;
  case: { id: string };
}

// Backend uses clientFirstName/clientLastName — map to frontend shape
function fromApi(raw: Record<string, unknown>): PreNeedArrangement {
  return {
    id:              raw.id as string,
    firstName:       (raw.clientFirstName ?? raw.firstName) as string,
    lastName:        (raw.clientLastName  ?? raw.lastName)  as string,
    dob:             (raw.clientDob       ?? raw.dob)       as string | undefined,
    phone:           (raw.clientPhone     ?? raw.phone)     as string | undefined,
    email:           (raw.clientEmail     ?? raw.email)     as string | undefined,
    address:         (raw.clientAddress   ?? raw.address)   as string | undefined,
    serviceType:     raw.serviceType  as ServiceType,
    fundingType:     raw.fundingType  as FundingType | undefined,
    insuranceCompany:raw.insuranceCompany as string | undefined,
    policyNumber:    raw.policyNumber as string | undefined,
    faceValue:       raw.faceValue    as number | undefined,
    notes:           raw.notes        as string | undefined,
    status:          raw.status       as PreNeedStatus,
    convertedCaseId: raw.convertedCaseId as string | undefined,
    createdAt:       raw.createdAt    as string,
  };
}

export async function getPreNeedArrangements(params?: {
  status?: PreNeedStatus;
}): Promise<PreNeedArrangement[]> {
  const res = await apiClient.get<Record<string, unknown>[]>('/preneed', { params });
  return res.data.map(fromApi);
}

export async function createPreNeedArrangement(
  dto: CreatePreNeedDto,
): Promise<PreNeedArrangement> {
  const res = await apiClient.post<Record<string, unknown>>('/preneed', {
    clientFirstName: dto.firstName,
    clientLastName:  dto.lastName,
    clientDob:       dto.dob,
    clientPhone:     dto.phone,
    clientEmail:     dto.email,
    clientAddress:   dto.address,
    serviceType:     dto.serviceType,
    fundingType:     dto.fundingType,
    insuranceCompany:dto.insuranceCompany,
    policyNumber:    dto.policyNumber,
    faceValue:       dto.faceValue,
    notes:           dto.notes,
  });
  return fromApi(res.data);
}

export async function convertPreNeed(id: string): Promise<{ caseId: string }> {
  const res = await apiClient.post<{ arrangement: unknown; case: { id: string } }>(`/preneed/${id}/convert`);
  return { caseId: res.data.case.id };
}
