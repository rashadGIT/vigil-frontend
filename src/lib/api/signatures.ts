import { apiClient } from './client';
import type { ISignature } from '@/types';

export async function getCaseSignatures(caseId: string): Promise<ISignature[]> {
  const res = await apiClient.get<ISignature[]>(`/cases/${caseId}/signatures`);
  return res.data;
}

export async function createSignatureRequest(caseId: string, dto: { documentType: string; signerName: string; signerEmail: string }): Promise<ISignature> {
  const res = await apiClient.post<ISignature>('/signatures', { caseId, ...dto });
  return res.data;
}

export async function getSignatureByToken(token: string): Promise<ISignature> {
  const res = await apiClient.get<ISignature>(`/signatures/token/${token}`);
  return res.data;
}

export async function submitSignature(token: string, dto: { signatureDataUrl: string; signerName: string }): Promise<void> {
  await apiClient.post(`/signatures/${token}/sign`, dto);
}
