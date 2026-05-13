import { apiClient } from './client';

export interface RevenueByServiceType {
  serviceType: string;
  count: number;
  revenue: number;
}

export interface CasesByMonth {
  month: string;
  count: number;
  revenue: number;
}

export interface RevenueReport {
  totalCases: number;
  totalRevenue: number;
  revenueByServiceType: RevenueByServiceType[];
  casesByMonth: CasesByMonth[];
  averageCaseValue: number;
  pendingBalance: number;
}

export async function getRevenueReport(from: string, to: string): Promise<RevenueReport> {
  const res = await apiClient.get<RevenueReport>('/cases/reports/revenue', {
    params: { from, to },
  });
  return res.data;
}
