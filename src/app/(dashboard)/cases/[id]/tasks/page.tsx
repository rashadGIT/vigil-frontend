import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { TaskList } from '@/components/tasks/task-list';

export default async function CaseTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <TaskList caseId={id} />
    </div>
  );
}
