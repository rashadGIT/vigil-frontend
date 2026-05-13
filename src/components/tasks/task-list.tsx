'use client';

import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TaskItem } from './task-item';
import { getCaseTasks } from '@/lib/api/tasks';

export function TaskList({ caseId }: { caseId: string }) {
  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', caseId],
    queryFn: () => getCaseTasks(caseId),
  });

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  if (error) return (
    <div className="rounded-md border p-4 text-center space-y-2">
      <p className="text-sm text-muted-foreground">Failed to load tasks.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  if (tasks.length === 0) return <p className="text-sm text-muted-foreground">No tasks for this case.</p>;

  const completed = tasks.filter((t) => t.completed).length;

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">{completed} of {tasks.length} tasks completed</p>
      <div className="rounded-md border divide-y">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} caseId={caseId} />
        ))}
      </div>
    </div>
  );
}
