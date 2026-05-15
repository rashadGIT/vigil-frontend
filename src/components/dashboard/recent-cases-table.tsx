'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CaseStatusBadge } from '@/components/cases/case-status-badge';
import { getRecentCases } from '@/lib/api/dashboard';
import { formatRelative } from '@/lib/utils/format-date';
import { CaseStatus } from '@/types';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export function RecentCasesTable() {
  const router = useRouter();
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['recent-cases'],
    queryFn: getRecentCases,
  });

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  // D-11: Empty state
  if (cases.length === 0) {
    const slug = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' ? 'sunrise' : '[slug]';
    const intakeUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/intake/${slug}`
      : `/intake/${slug}`;
    return (
      <div className="rounded-md border p-8 text-center space-y-3">
        <p className="text-muted-foreground">No cases yet.</p>
        <p className="text-sm text-muted-foreground">
          Share your intake form link to get started.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(intakeUrl);
            toast.success('Intake link copied to clipboard.');
          }}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Intake Link
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-medium">Deceased</TableHead>
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="font-medium hidden sm:table-cell">Assigned</TableHead>
            <TableHead className="font-medium hidden sm:table-cell">Last updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.slice(0, 5).map((c) => (
            <TableRow
              key={c.id}
              className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:bg-muted"
              tabIndex={0}
              onClick={() => router.push(`/cases/${c.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/cases/${c.id}`); } }}
            >
              <TableCell className="font-medium">{c.deceasedName}</TableCell>
              <TableCell><CaseStatusBadge status={c.status as CaseStatus} /></TableCell>
              <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{c.assignedTo ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{formatRelative(c.updatedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="px-4 py-2 border-t">
        <Link href="/cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          View all cases →
        </Link>
      </div>
    </div>
  );
}
