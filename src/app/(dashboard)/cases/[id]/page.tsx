import { Suspense } from 'react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CaseOverview } from '@/components/cases/case-overview';
import { PageHeader } from '@/components/layout/page-header';
import { getCaseById } from '@/lib/api/cases';

export default async function CaseWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseData = await getCaseById(id).catch(() => null);
  const title = caseData?.deceasedName ?? 'Case Details';

  return (
    <div>
      <PageHeader title={title} description="Case Details" />
      <CaseWorkspaceTabs caseId={id} />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <CaseOverview caseId={id} />
      </Suspense>
    </div>
  );
}
