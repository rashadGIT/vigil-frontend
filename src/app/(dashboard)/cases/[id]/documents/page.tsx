'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { DocumentUpload } from '@/components/documents/document-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { getCaseDocuments, getDocumentDownloadUrl } from '@/lib/api/documents';
import { formatDate } from '@/lib/utils/format-date';
import { toast } from 'sonner';

function DocumentList({ caseId }: { caseId: string }) {
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents', caseId],
    queryFn: () => getCaseDocuments(caseId),
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (docs.length === 0) return <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>;

  return (
    <div className="rounded-md border divide-y">
      {docs.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium">{doc.fileName}</p>
            <p className="text-xs text-muted-foreground">{doc.documentType} &middot; {formatDate(doc.createdAt)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => {
            try {
              const url = await getDocumentDownloadUrl(doc.id);
              window.open(url, '_blank');
            } catch {
              toast.error('Failed to get download link. Please try again.');
            }
          }}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function CaseDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <div className="space-y-4">
        <DocumentUpload caseId={id} />
        <DocumentList caseId={id} />
      </div>
    </div>
  );
}
