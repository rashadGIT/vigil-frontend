import { apiClient } from './client';
import type { IDocument } from '@/types';
import { DocumentType } from '@/types';

export interface PresignedUrlResponse {
  uploadUrl: string;
  documentId: string;
  key: string;
}

export async function getCaseDocuments(caseId: string): Promise<IDocument[]> {
  const res = await apiClient.get<IDocument[]>(`/cases/${caseId}/documents`);
  return res.data;
}

export async function getPresignedUploadUrl(caseId: string, fileName: string, fileType: string, documentType: DocumentType): Promise<PresignedUrlResponse> {
  const res = await apiClient.post<PresignedUrlResponse>('/documents/presigned-url', {
    caseId, fileName, fileType, documentType,
  });
  return res.data;
}

export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const res = await apiClient.get<{ url: string }>(`/documents/${documentId}/download`);
  return res.data.url;
}
