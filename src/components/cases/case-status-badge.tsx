import { CaseStatus } from '@/types';
import { StatusPill } from '@/components/ui/status-pill';

const statusToKind: Record<CaseStatus, 'new' | 'in_progress' | 'completed' | 'archived'> = {
  [CaseStatus.new]: 'new',
  [CaseStatus.in_progress]: 'in_progress',
  [CaseStatus.completed]: 'completed',
  [CaseStatus.archived]: 'archived',
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const kind = statusToKind[status] ?? 'new';
  return <StatusPill kind={kind} />;
}
