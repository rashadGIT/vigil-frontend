import type { DocumentType } from '../enums/document-type.enum';

export interface IDocument {
  id: string;
  tenantId: string;
  caseId: string;
  documentType: DocumentType;
  fileName: string;
  s3Key: string;
  uploadedById: string | null;
  deletedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
