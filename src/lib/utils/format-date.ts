import { format, formatDistanceToNow, isAfter } from 'date-fns';

function toDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(date: string | Date | null | undefined): string {
  const d = toDate(date);
  return d ? format(d, 'MMM d, yyyy') : '—';
}

export function formatDateTime(date: string | Date | null | undefined): string {
  const d = toDate(date);
  return d ? format(d, 'MMM d, yyyy h:mm a') : '—';
}

export function formatRelative(date: string | Date | null | undefined): string {
  const d = toDate(date);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : '—';
}

export function isOverdue(dueDate: string | Date | null | undefined): boolean {
  const d = toDate(dueDate);
  return d ? isAfter(new Date(), d) : false;
}
