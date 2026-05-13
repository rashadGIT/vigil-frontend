import type { SignatureDocument } from '../enums/signature-document.enum';

export interface ISignature {
  id: string;
  tenantId: string;
  caseId: string;
  contactId: string;
  documentType: SignatureDocument;
  token: string;
  signerName: string;
  signerEmail: string | null;
  signerIp: string | null;
  signedAt: string | null;
  signatureData: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}
