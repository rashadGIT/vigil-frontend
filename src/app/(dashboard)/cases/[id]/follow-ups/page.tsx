'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/format-date';
import { StatusPill } from '@/components/ui/status-pill';

function getStatusKind(status: string, scheduledAt: string | null): 'sent' | 'pending' | 'overdue' {
  if (status === 'sent') return 'sent';
  if (status === 'pending' && scheduledAt && new Date(scheduledAt) < new Date()) return 'overdue';
  return 'pending';
}

function FollowUpList({ caseId }: { caseId: string }) {
  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['followUps', caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}/follow-ups`).then((r) => r.data),
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (followUps.length === 0) return <p className="text-sm text-muted-foreground">No follow-ups scheduled yet.</p>;

  const label: Record<string, string> = {
    one_week: '1 Week', one_month: '1 Month', six_month: '6 Months', one_year: '1 Year',
  };

  return (
    <div className="rounded-md border divide-y">
      {followUps.map((f: any) => {
        const scheduledDate = f.scheduledAt ?? f.scheduledFor ?? null;
        return (
          <div key={f.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{label[f.templateType ?? f.template] ?? f.templateType ?? f.template}</p>
              <p className="text-xs text-muted-foreground">
                {scheduledDate ? `Scheduled for ${formatDate(scheduledDate)}` : 'Date TBD'}
              </p>
            </div>
            <StatusPill kind={getStatusKind(f.status, scheduledDate)} />
          </div>
        );
      })}
    </div>
  );
}

export default function CaseFollowUpsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <div>
        <p className="text-xs text-muted-foreground mb-4">
          Grief follow-ups are automatically scheduled by n8n workflows. Read-only display.
        </p>
        <FollowUpList caseId={id} />
      </div>
    </div>
  );
}
