/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskItem } from '@/components/tasks/task-item';

jest.mock('@/lib/api/tasks', () => ({
  updateTask: jest.fn(),
}));

jest.mock('@/lib/utils/format-date', () => ({
  formatDate: jest.fn((d: string) => d),
  formatRelative: jest.fn(() => '2 days ago'),
  isOverdue: jest.fn(() => false),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { updateTask } from '@/lib/api/tasks';

const mockUpdateTask = updateTask as jest.Mock;

const baseTask = {
  id: 'task-1',
  tenantId: 'tenant-1',
  caseId: 'case-1',
  title: 'Prepare death certificate',
  completed: false,
  completedBy: null,
  dueDate: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('TaskItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateTask.mockResolvedValue({});
  });

  it('renders the task title', () => {
    renderWithQuery(<TaskItem task={baseTask} caseId="case-1" />);
    expect(screen.getByText('Prepare death certificate')).toBeInTheDocument();
  });

  it('renders an unchecked checkbox for incomplete task', () => {
    renderWithQuery(<TaskItem task={baseTask} caseId="case-1" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders a checked checkbox for completed task', () => {
    renderWithQuery(<TaskItem task={{ ...baseTask, completed: true }} caseId="case-1" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('applies line-through style to completed task title', () => {
    renderWithQuery(<TaskItem task={{ ...baseTask, completed: true }} caseId="case-1" />);
    const title = screen.getByText('Prepare death certificate');
    expect(title.className).toMatch(/line-through/);
  });

  it('calls updateTask when checkbox is toggled', async () => {
    const user = userEvent.setup();
    renderWithQuery(<TaskItem task={baseTask} caseId="case-1" />);

    await user.click(screen.getByRole('checkbox'));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith('task-1', { completed: true });
    });
  });

  it('renders due date when provided', () => {
    renderWithQuery(
      <TaskItem task={{ ...baseTask, dueDate: '2025-06-01' }} caseId="case-1" />
    );
    expect(screen.getByText(/due/i)).toBeInTheDocument();
  });

  it('shows overdue text when task is overdue', () => {
    const { isOverdue } = require('@/lib/utils/format-date');
    (isOverdue as jest.Mock).mockReturnValue(true);

    renderWithQuery(
      <TaskItem task={{ ...baseTask, dueDate: '2024-01-01' }} caseId="case-1" />
    );
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it('applies reduced opacity to completed tasks', () => {
    const { container } = renderWithQuery(
      <TaskItem task={{ ...baseTask, completed: true }} caseId="case-1" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/opacity/);
  });
});
