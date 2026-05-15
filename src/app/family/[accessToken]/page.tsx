import { notFound } from 'next/navigation';
import { FamilyPortalView } from './family-portal-view';

interface PortalCase {
  id: string;
  deceasedName: string;
  status: string;
  stage: string;
  serviceType: string;
  createdAt: string;
}

interface PortalDocument {
  id: string;
  fileName: string;
  documentType: string;
  uploaded: boolean;
  createdAt: string;
}

interface PortalAccess {
  caseId: string;
  contactId: string;
  expiresAt: string;
  lastViewed: string | null;
}

export interface PortalData {
  portalAccess: PortalAccess;
  case: PortalCase | null;
  contacts: { id: string; name: string; relationship: string; isPrimaryContact: boolean }[];
  documents: PortalDocument[];
}

async function fetchPortalData(accessToken: string): Promise<PortalData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/family-portal/${accessToken}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<PortalData>;
  } catch {
    return null;
  }
}

export default async function FamilyPortalPage({
  params,
}: {
  params: Promise<{ accessToken: string }>;
}) {
  const { accessToken } = await params;
  const data = await fetchPortalData(accessToken);

  if (!data || !data.case) {
    notFound();
  }

  // Mark as viewed (fire-and-forget — don't block render)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  void fetch(`${apiUrl}/family-portal/${accessToken}/viewed`, { method: 'PATCH' });

  return <FamilyPortalView data={data} accessToken={accessToken} />;
}
