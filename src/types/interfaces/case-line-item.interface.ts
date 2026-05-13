export interface ICaseLineItem {
  id: string;
  tenantId: string;
  caseId: string;
  priceListItemId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}
