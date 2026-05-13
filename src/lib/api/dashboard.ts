import { apiClient } from './client';

export interface DashboardStats {
  activeCases: number;
  activeCasesDelta: number;
  overdueTasks: number;
  casesThisMonth: number;
  casesLastMonthDelta: number;
  pendingSignatures: number;
}

export interface RecentCase {
  id: string;
  deceasedName: string;
  deceasedFirstName: string;
  deceasedLastName: string;
  status: string;
  assignedTo: string | null;
  updatedAt: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<DashboardStats>('/cases/stats');
  return res.data;
}

export async function getRecentCases(): Promise<RecentCase[]> {
  const res = await apiClient.get<RecentCase[]>('/cases');
  return res.data;
}
