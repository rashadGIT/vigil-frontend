export const SignatureDocument = {
  authorization: 'authorization',
  service_contract: 'service_contract',
  payment_agreement: 'payment_agreement',
  other: 'other',
} as const;
export type SignatureDocument = typeof SignatureDocument[keyof typeof SignatureDocument];
