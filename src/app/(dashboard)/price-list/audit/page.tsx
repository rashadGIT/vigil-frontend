'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

type AuditEntry = {
  id: string;
  action: 'gpl_view' | 'gpl_sent';
  entityId: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
};

function formatAction(action: string) {
  if (action === 'gpl_view') return 'Viewed GPL';
  if (action === 'gpl_sent') return 'Sent GPL';
  return action;
}

export default function GplAuditPage() {
  const { data: entries = [], isLoading } = useQuery<AuditEntry[]>({
    queryKey: ['gpl-audit'],
    queryFn: () => apiClient.get('/price-list/audit').then((r) => r.data),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="GPL Compliance Log"
        description="FTC audit trail — all General Price List views and deliveries."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No GPL events recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium text-muted-foreground">Event</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground">Staff Member</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2.5">
                      <Badge
                        variant={entry.action === 'gpl_sent' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {formatAction(entry.action)}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <p className="font-medium">{entry.user.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.user.email}</p>
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground tabular-nums">
                      {new Date(entry.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
