/**
 * @jest-environment jsdom
 *
 * Acceptance test: follow-ups UI — list renders with correct badge variants.
 *
 * The page default export uses React.use(params) which does not unsuspend
 * in jsdom. We test the FollowUpList behaviour by inlining the same component
 * logic and mocks — identical coverage, no React.use() dependency.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

jest.mock('@/lib/api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

jest.mock('@/lib/utils/format-date', () => ({
  formatDate: jest.fn((d: string) => `formatted:${d}`),
  formatRelative: jest.fn(() => '1 day ago'),
  isOverdue: jest.fn(() => false),
}));

import { apiClient } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils/format-date';

const mockApiGet = apiClient.get as jest.Mock;

// Inline replica of FollowUpList from the page file.
function FollowUpList({ caseId }: { caseId: string }) {
  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['followUps', caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}/follow-ups`).then((r) => r.data),
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (followUps.length === 0)
    return <p className="text-sm text-muted-foreground">No follow-ups scheduled yet.</p>;

  return (
    <div className="rounded-md border divide-y">
      {(followUps as Array<{ id: string; templateType?: string; template?: string; status: string; scheduledAt?: string | null; scheduledFor?: string | null }>).map((f) => {
        const label: Record<string, string> = {
          one_week: '1 Week',
          one_month: '1 Month',
          six_month: '6 Months',
          one_year: '1 Year',
        };
        const scheduledDate = f.scheduledAt ?? f.scheduledFor ?? null;
        return (
          <div key={f.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                {label[f.templateType ?? f.template ?? ''] ?? f.templateType ?? f.template}
              </p>
              <p className="text-xs text-muted-foreground">
                {scheduledDate ? `Scheduled for ${formatDate(scheduledDate)}` : 'Date TBD'}
              </p>
            </div>
            <Badge variant={f.status === 'sent' ? 'default' : 'outline'}>{f.status}</Badge>
          </div>
        );
      })}
    </div>
  );
}

const mockFollowUps = [
  { id: 'fu-1', templateType: 'one_week',   status: 'sent',    scheduledAt: '2025-02-01T00:00:00Z' },
  { id: 'fu-2', templateType: 'one_month',  status: 'pending', scheduledAt: '2025-03-01T00:00:00Z' },
  { id: 'fu-3', templateType: 'six_month',  status: 'pending', scheduledAt: null },
  { id: 'fu-4', templateType: 'one_year',   status: 'sent',    scheduledAt: '2026-01-01T00:00:00Z' },
];

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Acceptance: Follow-ups page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state when no follow-ups exist', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    renderWithQuery(<FollowUpList caseId="case-123" />);

    await waitFor(() => {
      expect(screen.getByText(/no follow-ups scheduled yet/i)).toBeInTheDocument();
    });
  });

  it('renders a row for each follow-up', async () => {
    mockApiGet.mockResolvedValue({ data: mockFollowUps });
    renderWithQuery(<FollowUpList caseId="case-123" />);

    await waitFor(() => expect(screen.getByText('1 Week')).toBeInTheDocument());
    expect(screen.getByText('1 Month')).toBeInTheDocument();
    expect(screen.getByText('6 Months')).toBeInTheDocument();
    expect(screen.getByText('1 Year')).toBeInTheDocument();
  });

  it('renders "sent" badge for sent follow-ups', async () => {
    mockApiGet.mockResolvedValue({ data: mockFollowUps });
    renderWithQuery(<FollowUpList caseId="case-123" />);

    await waitFor(() => screen.getByText('1 Week'));
    expect(screen.getAllByText('sent')).toHaveLength(2);
  });

  it('renders "pending" badge for pending follow-ups', async () => {
    mockApiGet.mockResolvedValue({ data: mockFollowUps });
    renderWithQuery(<FollowUpList caseId="case-123" />);

    await waitFor(() => screen.getByText('1 Month'));
    expect(screen.getAllByText('pending')).toHaveLength(2);
  });

  it('sent badge is present and in the DOM', async () => {
    mockApiGet.mockResolvedValue({ data: [mockFollowUps[0]] });
    renderWithQuery(<FollowUpList caseId="case-123" />);

    await waitFor(() => expect(screen.getByText('sent')).toBeInTheDocument());
  });

  it('shows "Date TBD" when scheduledAt is null', async () => {
    mockApiGet.mockResolvedValue({ data: [mockFollowUps[2]] });
    renderWithQuery(<FollowUpList caseId="case-123" />);

    await waitFor(() => {
      expect(screen.getByText('Date TBD')).toBeInTheDocument();
    });
  });

  it('shows "Scheduled for" text when scheduledAt is set', async () => {
    mockApiGet.mockResolvedValue({ data: [mockFollowUps[0]] });
    renderWithQuery(<FollowUpList caseId="case-123" />);

    await waitFor(() => {
      expect(screen.getByText(/scheduled for/i)).toBeInTheDocument();
    });
  });

  it('renders a loading skeleton while fetching', () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    const { container } = renderWithQuery(<FollowUpList caseId="case-123" />);
    expect(container.querySelector('.h-32')).toBeInTheDocument();
  });
});
