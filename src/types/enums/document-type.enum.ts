export const DocumentType = {
  obituary: 'obituary',
  death_cert: 'death_cert',
  service_program: 'service_program',
  invoice: 'invoice',
  other: 'other',
} as const;
export type DocumentType = typeof DocumentType[keyof typeof DocumentType];
