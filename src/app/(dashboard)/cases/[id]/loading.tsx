import { Skeleton } from '@/components/ui/skeleton';

export default function CaseWorkspaceLoading() {
  return (
    <div className="space-y-4">
      {/* Tab bar skeleton */}
      <div className="flex gap-2 border-b pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-md" />
        ))}
      </div>
      {/* Content area skeleton */}
      <div className="space-y-4 pt-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}
