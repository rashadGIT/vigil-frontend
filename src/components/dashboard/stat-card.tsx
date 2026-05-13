import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: LucideIcon;
  description?: string;
  loading?: boolean;
  href?: string;
  delta?: number;
  format?: 'number' | 'currency';
}

export function StatCard({ title, value, icon: Icon, description, loading, href, delta, format = 'number' }: StatCardProps) {
  const displayValue = value ?? 0;
  const formatted = format === 'currency'
    ? displayValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : displayValue;

  const card = (
    <Card className={`h-full${href ? ' cursor-pointer transition-colors hover:bg-muted/50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col justify-between min-h-[72px]">
        <div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-3xl font-semibold">{formatted}</div>
          )}
        </div>
        <div>
          {delta !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">{delta >= 0 ? '↑' : '↓'} {Math.abs(delta)} since yesterday</p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}
