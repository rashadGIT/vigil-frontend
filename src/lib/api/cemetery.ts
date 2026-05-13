import { apiClient } from './client';

export type IntermentType =
  | 'Ground'
  | 'Mausoleum'
  | 'Columbarium'
  | 'Scattering Garden';

export interface CemeteryRecord {
  id: string;
  caseId: string;
  cemeteryName?: string;
  address?: string;
  phone?: string;
  section?: string;
  lot?: string;
  grave?: string;
  intermentType?: IntermentType;
  openingClosingOrdered: boolean;
  openingClosingOrderedAt?: string;
  intermentScheduledAt?: string;
  permitNumber?: string;
  permitObtained: boolean;
  intermentCompleted: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertCemeteryDto {
  cemeteryName?: string;
  address?: string;
  phone?: string;
  section?: string;
  lot?: string;
  grave?: string;
  intermentType?: IntermentType;
  openingClosingOrdered?: boolean;
  intermentScheduledAt?: string;
  permitNumber?: string;
  permitObtained?: boolean;
  intermentCompleted?: boolean;
  notes?: string;
}

export async function getCemeteryRecord(caseId: string): Promise<CemeteryRecord | null> {
  const res = await apiClient.get<CemeteryRecord>(`/cases/${caseId}/cemetery`).catch((e) => {
    if (e?.response?.status === 404) return null;
    throw e;
  });
  return res ? res.data : null;
}

export async function upsertCemeteryRecord(
  caseId: string,
  dto: UpsertCemeteryDto,
  exists: boolean,
): Promise<CemeteryRecord> {
  const res = exists
    ? await apiClient.patch<CemeteryRecord>(`/cases/${caseId}/cemetery`, dto)
    : await apiClient.post<CemeteryRecord>(`/cases/${caseId}/cemetery`, dto);
  return res.data;
}
