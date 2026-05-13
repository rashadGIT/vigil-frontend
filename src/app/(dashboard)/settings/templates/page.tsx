'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { ServiceType } from '@/types';

const serviceTypeLabel: Record<ServiceType, string> = {
  [ServiceType.burial]: 'Burial',
  [ServiceType.cremation]: 'Cremation',
  [ServiceType.graveside]: 'Graveside',
  [ServiceType.memorial]: 'Memorial',
};

export default function TemplatesPage() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['task-templates'],
    queryFn: () => apiClient.get('/task-templates').then((r) => r.data),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Task Templates" description="Default task checklists generated for each service type." />

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : (
        Object.values(ServiceType).map((type) => {
          const tasks = templates?.[type] ?? [];
          return (
            <div key={type} className="rounded-md border">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <span className="font-medium text-sm">{serviceTypeLabel[type]}</span>
                <Badge variant="outline" className="text-xs">{tasks.length} tasks</Badge>
              </div>
              <div className="divide-y">
                {tasks.map((task: { id: string; title: string }, idx: number) => (
                  <div key={task.id ?? idx} className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                    <span className="text-xs w-5 text-center">{idx + 1}</span>
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
