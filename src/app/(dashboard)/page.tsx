'use client';

import { useQuery } from '@tanstack/react-query';
import { FolderOpen, AlertCircle, CalendarDays, FileSignature, DollarSign, AlertTriangle, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { RecentCasesTable } from '@/components/dashboard/recent-cases-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardStats } from '@/lib/api/dashboard';
import { getRevenueReport } from '@/lib/api/revenue';
import { apiClient } from '@/lib/api/client';

function formatCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function MonthlyBarChart({ data }: { data: { month: string; count: number; revenue: number }[] }) {
  const dataMap = new Map(data.map((d) => [d.month, d]));
  const slots = getLast12Months().map((month) => dataMap.get(month) ?? { month, count: 0, revenue: 0 });
  const maxCount = Math.max(...slots.map((d) => d.count), 1);
  const BAR_HEIGHT_PX = 128;

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1" style={{ height: BAR_HEIGHT_PX }}>
        {slots.map((d) => {
          const [yyyy, mm] = d.month.split('-');
          const monthLabel = MONTH_LABELS[parseInt(mm, 10) - 1] ?? mm;
          const barHeight = Math.max(Math.round((d.count / maxCount) * BAR_HEIGHT_PX), 4);
          return (
            <div key={d.month} className="flex-1 flex flex-col items-end relative">
              <div
                className={`w-full rounded-t-sm transition-all relative ${d.count > 0 ? 'bg-primary/80' : 'bg-muted'}`}
                style={{ height: d.count > 0 ? barHeight : 4 }}
                title={`${monthLabel} ${yyyy}: ${d.count} cases, ${formatCurrency(d.revenue)}`}
              >
                {d.count > 0 && (
                  <span className="absolute -top-5 left-0 right-0 text-center text-[10px] text-muted-foreground">
                    {d.count}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1">
        {slots.map((d, i) => {
          const [yyyy, mm] = d.month.split('-');
          const monthLabel = MONTH_LABELS[parseInt(mm, 10) - 1] ?? mm;
          const isJan = mm === '01';
          const prevYear = i > 0 ? slots[i - 1].month.split('-')[0] : yyyy;
          const showYear = isJan && yyyy !== prevYear;
          return (
            <div key={d.month} className="flex-1 text-center overflow-hidden">
              <span className="text-[10px] text-muted-foreground block truncate">{monthLabel}</span>
              {showYear && (
                <span className="text-[9px] text-muted-foreground/60 block">{yyyy}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type StaffWorkload = { id: string; name: string; email: string; role: string; activeCases: number; overdueTaskCount: number };

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const now = new Date();
  const ytdFrom = new Date(now.getFullYear(), 0, 1).toISOString();
  const chartFrom = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1).toISOString();
  const to = now.toISOString();

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-report', ytdFrom],
    queryFn: () => getRevenueReport(ytdFrom, to),
  });

  const { data: chartRevenue, isLoading: chartLoading } = useQuery({
    queryKey: ['revenue-chart', chartFrom],
    queryFn: () => getRevenueReport(chartFrom, to),
  });

  const { data: workload, isLoading: workloadLoading } = useQuery<StaffWorkload[]>({
    queryKey: ['staff-workload'],
    queryFn: () => apiClient.get('/analytics/staff-workload').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      {/* Row 1: 4 operational stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Cases"
          value={stats?.activeCases}
          icon={FolderOpen}
          description="New + in progress"
          loading={isLoading}
          href="/cases?filter=active"
          delta={stats?.activeCasesDelta}
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueTasks}
          icon={AlertCircle}
          description="Past due date"
          loading={isLoading}
          href="/cases?filter=overdue"
        />
        <StatCard
          title="Cases This Month"
          value={stats?.casesThisMonth}
          icon={CalendarDays}
          description="Created in current month"
          loading={isLoading}
          href="/cases?filter=this-month"
          delta={stats?.casesLastMonthDelta}
        />
        <StatCard
          title="Pending Signatures"
          value={stats?.pendingSignatures}
          icon={FileSignature}
          description="Awaiting family signature"
          loading={isLoading}
          href="/cases?filter=pending-signatures"
        />
      </div>

      {/* Row 2: 2 revenue stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {revenueLoading ? (
          <>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Revenue (YTD)"
              value={revenue?.totalRevenue}
              icon={DollarSign}
              format="currency"
              description={
                revenue
                  ? `Avg ${formatCurrency(revenue.averageCaseValue)}/case`
                  : undefined
              }
              loading={false}
            />
            {/* Pending balance card — amber tint via wrapper */}
            <Card>
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Pending Balance</p>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-3xl font-semibold text-amber-600">
                  {revenue ? formatCurrency(revenue.pendingBalance) : '—'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Outstanding across all cases</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Row 3: Monthly bar chart + revenue by service type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cases by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <MonthlyBarChart data={chartRevenue?.casesByMonth ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Service Type</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : revenue && revenue.revenueByServiceType.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-left font-medium text-muted-foreground">Service Type</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">Cases</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">Revenue</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">Avg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {revenue.revenueByServiceType.map((row) => (
                      <tr key={row.serviceType}>
                        <td className="py-2 capitalize">{row.serviceType}</td>
                        <td className="py-2 text-right">{row.count}</td>
                        <td className="py-2 text-right">{formatCurrency(row.revenue)}</td>
                        <td className="py-2 text-right text-muted-foreground">
                          {row.count > 0 ? formatCurrency(row.revenue / row.count) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff workload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff Workload
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workloadLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : workload && workload.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Staff Member</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Active Cases</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Overdue Tasks</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {workload.map((member) => (
                    <tr key={member.id}>
                      <td className="py-2">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </td>
                      <td className="py-2 text-right tabular-nums">{member.activeCases}</td>
                      <td className="py-2 text-right tabular-nums">
                        {member.overdueTaskCount > 0 ? (
                          <span className="text-destructive font-medium">{member.overdueTaskCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No staff members found.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent cases table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Cases</h2>
        <RecentCasesTable />
      </div>
    </div>
  );
}
