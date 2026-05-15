/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecentCasesTable } from '@/components/dashboard/recent-cases-table';

jest.mock('@/lib/api/dashboard', () => ({
  getDashboardStats: jest.fn(),
  getRecentCases: jest.fn(),
}));

jest.mock('@/lib/utils/format-date', () => ({
  formatRelative: jest.fn(() => '3 days ago'),
  formatDate: jest.fn(() => 'Jan 1, 2025'),
  isOverdue: jest.fn(() => false),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { useRouter } from 'next/navigation';
import { getRecentCases } from '@/lib/api/dashboard';

const mockGetRecentCases = getRecentCases as jest.Mock;

const mockCases = [
  {
    id: 'case-1',
    deceasedName: 'Alice Smith',
    deceasedFirstName: 'Alice',
    deceasedLastName: 'Smith',
    status: 'new',
    assignedTo: null,
    updatedAt: '2025-01-03T00:00:00Z',
  },
  {
    id: 'case-2',
    deceasedName: 'Bob Jones',
    deceasedFirstName: 'Bob',
    deceasedLastName: 'Jones',
    status: 'in_progress',
    assignedTo: 'Jane Doe',
    updatedAt: '2025-01-04T00:00:00Z',
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

describe('RecentCasesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a loading skeleton while fetching', () => {
    mockGetRecentCases.mockReturnValue(new Promise(() => {}));
    const { container } = renderWithQuery(<RecentCasesTable />);
    expect(container.querySelectorAll('.h-12').length).toBeGreaterThan(0);
  });

  it('renders case rows when data is loaded', async () => {
    mockGetRecentCases.mockResolvedValue(mockCases);
    renderWithQuery(<RecentCasesTable />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('renders table headers', async () => {
    mockGetRecentCases.mockResolvedValue(mockCases);
    renderWithQuery(<RecentCasesTable />);

    await waitFor(() => screen.getByText('Alice Smith'));
    expect(screen.getByText('Deceased')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('shows empty state with copy intake link button when no cases', async () => {
    mockGetRecentCases.mockResolvedValue([]);
    renderWithQuery(<RecentCasesTable />);

    await waitFor(() => {
      expect(screen.getByText(/no cases yet/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /copy intake link/i })).toBeInTheDocument();
  });

  it('copies intake link to clipboard when button clicked', async () => {
    mockGetRecentCases.mockResolvedValue([]);
    const user = userEvent.setup();

    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
    });

    renderWithQuery(<RecentCasesTable />);
    await waitFor(() => screen.getByRole('button', { name: /copy intake link/i }));
    await user.click(screen.getByRole('button', { name: /copy intake link/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('navigates to case detail on row click', async () => {
    const mockPush = jest.fn();
    jest.mocked(useRouter).mockReturnValue({ push: mockPush });

    mockGetRecentCases.mockResolvedValue(mockCases);
    const user = userEvent.setup();
    renderWithQuery(<RecentCasesTable />);

    await waitFor(() => screen.getByText('Alice Smith'));
    await user.click(screen.getByText('Alice Smith'));

    expect(mockPush).toHaveBeenCalledWith('/cases/case-1');
  });
});
