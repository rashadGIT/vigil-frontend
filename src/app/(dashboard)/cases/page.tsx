import { PageHeader } from '@/components/layout/page-header';
import { CaseTable } from '@/components/cases/case-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const FILTER_LABELS: Record<string, string> = {
  active: 'Active Cases',
  overdue: 'Overdue Tasks',
  'this-month': 'Cases This Month',
  'pending-signatures': 'Pending Signatures',
};

export default function CasesPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter = searchParams?.filter;
  const title = filter ? FILTER_LABELS[filter] ?? 'Cases' : 'Cases';
  const description = filter ? undefined : 'All active and recent cases.';

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={
          <Button asChild size="sm">
            <Link href="/cases/new">New Case</Link>
          </Button>
        }
      />
      <CaseTable filter={filter} />
    </div>
  );
}
