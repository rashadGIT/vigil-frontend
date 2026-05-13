'use client'
import { cn } from '@/lib/utils/cn'

type StatusKind = 'sent' | 'pending' | 'overdue' | 'new' | 'in_progress' | 'completed' | 'archived'

const kindConfig: Record<StatusKind, { label: string; className: string }> = {
  sent:        { label: 'Sent',        className: 'bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]' },
  pending:     { label: 'Pending',     className: 'bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]' },
  overdue:     { label: 'Overdue',     className: 'bg-destructive/10 text-destructive' },
  new:         { label: 'New',         className: 'bg-[hsl(var(--info-bg))] text-[hsl(var(--info))]' },
  in_progress: { label: 'In Progress', className: 'bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]' },
  completed:   { label: 'Completed',   className: 'bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]' },
  archived:    { label: 'Archived',    className: 'bg-muted text-muted-foreground' },
}

export function StatusPill({ kind, className }: { kind: StatusKind; className?: string }) {
  const config = kindConfig[kind]
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className, className)}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  )
}
