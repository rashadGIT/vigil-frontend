import { apiClient } from './client';
import type { IPriceListItem } from '@/types';
import { PriceCategory } from '@/types';

export async function getPriceList(): Promise<IPriceListItem[]> {
  const res = await apiClient.get<IPriceListItem[]>('/price-list');
  return res.data;
}

export async function createPriceListItem(dto: { name: string; category: PriceCategory; price: number }): Promise<IPriceListItem> {
  const res = await apiClient.post<IPriceListItem>('/price-list', dto);
  return res.data;
}

export async function updatePriceListItem(id: string, dto: Partial<IPriceListItem>): Promise<IPriceListItem> {
  const res = await apiClient.patch<IPriceListItem>(`/price-list/${id}`, dto);
  return res.data;
}

export async function deletePriceListItem(id: string): Promise<void> {
  await apiClient.delete(`/price-list/${id}`);
}
