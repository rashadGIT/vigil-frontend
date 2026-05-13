import { apiClient } from './client';
import type { IVendor } from '@/types';
import { VendorType } from '@/types';

export async function getVendors(): Promise<IVendor[]> {
  const res = await apiClient.get<IVendor[]>('/vendors');
  return res.data;
}

export async function createVendor(dto: { name: string; type: VendorType; email?: string; phone?: string }): Promise<IVendor> {
  const res = await apiClient.post<IVendor>('/vendors', dto);
  return res.data;
}

export async function updateVendor(id: string, dto: Partial<IVendor>): Promise<IVendor> {
  const res = await apiClient.patch<IVendor>(`/vendors/${id}`, dto);
  return res.data;
}

export async function deleteVendor(id: string): Promise<void> {
  await apiClient.delete(`/vendors/${id}`);
}
