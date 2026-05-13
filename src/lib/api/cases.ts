import { apiClient } from './client';
import type { ICase } from '@/types';
import { CaseStatus, ServiceType } from '@/types';

export interface CreateCaseDto {
  deceasedFirstName: string;
  deceasedLastName: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  serviceType: ServiceType;
  assignedTo?: string;
  notes?: string;
}

export interface CaseFilters {
  status?: CaseStatus;
  serviceType?: ServiceType;
  page?: number;
  limit?: number;
  dashboardFilter?: 'active' | 'overdue' | 'this-month' | 'pending-signatures';
}

export async function getCases(filters?: CaseFilters): Promise<ICase[]> {
  const res = await apiClient.get<ICase[]>('/cases', { params: filters });
  return res.data;
}

export async function getCaseById(id: string): Promise<ICase> {
  const res = await apiClient.get<ICase>(`/cases/${id}`);
  return res.data;
}

export async function createCase(dto: CreateCaseDto): Promise<ICase> {
  const res = await apiClient.post<ICase>('/cases', dto);
  return res.data;
}

export async function updateCaseStatus(id: string, status: CaseStatus): Promise<ICase> {
  const res = await apiClient.patch<ICase>(`/cases/${id}/status`, { status });
  return res.data;
}
