export const PriceCategory = {
  professional_services: 'professional_services',
  facilities: 'facilities',
  vehicles: 'vehicles',
  merchandise: 'merchandise',
  other: 'other',
} as const;
export type PriceCategory = typeof PriceCategory[keyof typeof PriceCategory];
