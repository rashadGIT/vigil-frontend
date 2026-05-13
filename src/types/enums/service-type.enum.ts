export const ServiceType = {
  burial: 'burial',
  cremation: 'cremation',
  graveside: 'graveside',
  memorial: 'memorial',
} as const;
export type ServiceType = typeof ServiceType[keyof typeof ServiceType];
