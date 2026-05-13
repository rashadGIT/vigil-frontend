import { Separator } from '@/components/ui/separator';

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold truncate">{title}</h1>
          {description && (
            <div className="text-sm text-muted-foreground mt-1">{description}</div>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <Separator className="mt-4" />
    </div>
  );
}
