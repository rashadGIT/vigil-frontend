/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CaseTable } from '@/components/cases/case-table';
import { CaseStatus } from '@/types';

jest.mock('@/lib/api/cases', () => ({
  getCases: jest.fn(),
}));

jest.mock('@/lib/utils/format-date', () => ({
  formatRelative: jest.fn(() => '2 days ago'),
  formatDate: jest.fn(() => 'Jan 1, 2025'),
  isOverdue: jest.fn(() => false),
}));

import { useRouter } from 'next/navigation';
import { getCases } from '@/lib/api/cases';

const mockGetCases = getCases as jest.Mock;

const mockCases = [
  {
    id: 'case-1',
    tenantId: 'tenant-1',
    deceasedName: 'Alice Smith',
    deceasedDob: null,
    deceasedDod: null,
    serviceType: 'burial',
    status: CaseStatus.new,
    assignedToId: null,
    faithTradition: null,
    deletedAt: null,
    archivedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-03T00:00:00Z',
    overdueTaskCount: 0,
  },
  {
    id: 'case-2',
    tenantId: 'tenant-1',
    deceasedName: 'Bob Jones',
    deceasedDob: null,
    deceasedDod: null,
    serviceType: 'cremation',
    status: CaseStatus.in_progress,
    assignedToId: 'user-1',
    faithTradition: null,
    deletedAt: null,
    archivedAt: null,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-04T00:00:00Z',
    overdueTaskCount: 2,
  },
];

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('CaseTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a loading skeleton while fetching', () => {
    // Return a promise that never resolves to stay in loading state
    mockGetCases.mockReturnValue(new Promise(() => {}));
    const { container } = renderWithQuery(<CaseTable />);
    // Skeleton elements should be present
    expect(container.querySelectorAll('.h-12').length).toBeGreaterThan(0);
  });

  it('renders table rows from data', async () => {
    mockGetCases.mockResolvedValue(mockCases);
    renderWithQuery(<CaseTable />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('renders status badges for each row', async () => {
    mockGetCases.mockResolvedValue(mockCases);
    renderWithQuery(<CaseTable />);

    await waitFor(() => {
      expect(screen.getByText('New')).toBeInTheDocument();
    });
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('shows empty state when no cases returned', async () => {
    mockGetCases.mockResolvedValue([]);
    renderWithQuery(<CaseTable />);

    await waitFor(() => {
      expect(screen.getByText(/no cases yet/i)).toBeInTheDocument();
    });
  });

  it('shows error state with retry button on failure', async () => {
    mockGetCases.mockRejectedValue(new Error('Network error'));
    renderWithQuery(<CaseTable />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load cases/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('navigates to case detail on row click', async () => {
    const mockPush = jest.fn();
    jest.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);

    mockGetCases.mockResolvedValue(mockCases);
    const user = userEvent.setup();
    renderWithQuery(<CaseTable />);

    await waitFor(() => screen.getByText('Alice Smith'));
    await user.click(screen.getByText('Alice Smith'));

    expect(mockPush).toHaveBeenCalledWith('/cases/case-1');
  });

  it('adds overdue tasks column when filter is "overdue"', async () => {
    mockGetCases.mockResolvedValue(mockCases);
    renderWithQuery(<CaseTable filter="overdue" />);

    await waitFor(() => {
      expect(screen.getByText(/overdue tasks/i)).toBeInTheDocument();
    });
  });

  it('renders overdue badge for cases with overdueTaskCount > 0', async () => {
    mockGetCases.mockResolvedValue(mockCases);
    renderWithQuery(<CaseTable filter="overdue" />);

    await waitFor(() => {
      expect(screen.getByText(/2 overdue/i)).toBeInTheDocument();
    });
  });

  it('clicking retry button calls refetch', async () => {
    const user = userEvent.setup();
    // First call fails, second succeeds (refetch)
    mockGetCases
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue([]);

    renderWithQuery(<CaseTable />);

    await waitFor(() => screen.getByRole('button', { name: /retry/i }));
    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(mockGetCases).toHaveBeenCalledTimes(2);
    });
  });
});
