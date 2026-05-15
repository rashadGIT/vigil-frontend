/**
 * @jest-environment jsdom
 *
 * Acceptance test: Dashboard page renders stat cards and recent cases table,
 * and clicking a case row navigates to /cases/:id.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/lib/api/dashboard', () => ({
  getDashboardStats: jest.fn(),
  getRecentCases: jest.fn(),
}));

jest.mock('@/lib/utils/format-date', () => ({
  formatRelative: jest.fn(() => '1 day ago'),
  formatDate: jest.fn(() => 'Jan 1, 2025'),
  isOverdue: jest.fn(() => false),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { useRouter } from 'next/navigation';
import { getDashboardStats, getRecentCases } from '@/lib/api/dashboard';
import DashboardPage from '@/app/(dashboard)/page';

const mockGetDashboardStats = getDashboardStats as jest.Mock;
const mockGetRecentCases = getRecentCases as jest.Mock;

const mockStats = {
  activeCases: 7,
  overdueTasks: 2,
  casesThisMonth: 4,
  pendingSignatures: 1,
};

const mockRecentCases = [
  {
    id: 'case-abc',
    deceasedName: 'Martha Green',
    deceasedFirstName: 'Martha',
    deceasedLastName: 'Green',
    status: 'new',
    assignedTo: null,
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'case-def',
    deceasedName: 'Robert Hill',
    deceasedFirstName: 'Robert',
    deceasedLastName: 'Hill',
    status: 'in_progress',
    assignedTo: 'Jane Staff',
    updatedAt: '2025-01-09T00:00:00Z',
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

describe('Acceptance: Dashboard page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDashboardStats.mockResolvedValue(mockStats);
    mockGetRecentCases.mockResolvedValue(mockRecentCases);
  });

  it('renders all 4 stat card titles', async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Active Cases')).toBeInTheDocument();
    });
    expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
    expect(screen.getByText('Cases This Month')).toBeInTheDocument();
    expect(screen.getByText('Pending Signatures')).toBeInTheDocument();
  });

  it('renders stat values from mocked API data', async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument(); // activeCases
    });
    expect(screen.getByText('2')).toBeInTheDocument();   // overdueTasks
    expect(screen.getByText('4')).toBeInTheDocument();   // casesThisMonth
    expect(screen.getByText('1')).toBeInTheDocument();   // pendingSignatures
  });

  it('renders "Recent Cases" section heading', async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Cases')).toBeInTheDocument();
    });
  });

  it('renders recent case rows', async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Martha Green')).toBeInTheDocument();
    });
    expect(screen.getByText('Robert Hill')).toBeInTheDocument();
  });

  it('navigates to /cases/:id when a case row is clicked', async () => {
    const mockPush = jest.fn();
    jest.mocked(useRouter).mockReturnValue({ push: mockPush });

    const user = userEvent.setup();
    renderWithQuery(<DashboardPage />);

    await waitFor(() => screen.getByText('Martha Green'));
    await user.click(screen.getByText('Martha Green'));

    expect(mockPush).toHaveBeenCalledWith('/cases/case-abc');
  });
});
