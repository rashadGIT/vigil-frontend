import type { PriceCategory } from '../enums/price-category.enum';

export interface IPriceListItem {
  id: string;
  tenantId: string;
  category: PriceCategory;
  name: string;
  price: number;
  taxable: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
