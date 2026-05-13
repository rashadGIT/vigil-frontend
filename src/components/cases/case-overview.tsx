'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CaseStatusBadge } from './case-status-badge';
import { getCaseById, updateCaseStatus } from '@/lib/api/cases';
import { formatDate } from '@/lib/utils/format-date';
import { CaseStatus, ServiceType } from '@/types';

const nextStatus: Partial<Record<CaseStatus, CaseStatus>> = {
  [CaseStatus.new]: CaseStatus.in_progress,
  [CaseStatus.in_progress]: CaseStatus.completed,
  [CaseStatus.completed]: CaseStatus.archived,
};

const serviceTypeLabel: Record<ServiceType, string> = {
  [ServiceType.burial]: 'Burial',
  [ServiceType.cremation]: 'Cremation',
  [ServiceType.graveside]: 'Graveside',
  [ServiceType.memorial]: 'Memorial',
};

export function CaseOverview({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => getCaseById(caseId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: CaseStatus) => updateCaseStatus(caseId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success('Status updated.');
    },
    onError: () => toast.error('Failed to update status.'),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!caseData) return <div className="text-muted-foreground text-sm">Case not found.</div>;

  const advanceStatus = nextStatus[caseData.status];

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between space-y-0 gap-3">
        <div>
          <CardTitle className="text-xl font-semibold">
            {caseData.deceasedName}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {serviceTypeLabel[caseData.serviceType]} &middot; Created {formatDate(caseData.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CaseStatusBadge status={caseData.status} />
          {advanceStatus && (
            <Button
              size="sm"
              variant="outline"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(advanceStatus)}
            >
              Mark {advanceStatus.replace('_', ' ')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {caseData.deceasedDob && (
          <p className="text-sm text-muted-foreground">
            Born: {formatDate(caseData.deceasedDob)}
          </p>
        )}
        {caseData.deceasedDod && (
          <p className="text-sm text-muted-foreground">
            Died: {formatDate(caseData.deceasedDod)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
