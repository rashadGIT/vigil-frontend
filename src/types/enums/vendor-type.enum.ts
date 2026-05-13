export const VendorType = {
  florist: 'florist',
  clergy: 'clergy',
  musician: 'musician',
  caterer: 'caterer',
  vault: 'vault',
  livery: 'livery',
  crematory: 'crematory',
  other: 'other',
} as const;
export type VendorType = typeof VendorType[keyof typeof VendorType];
