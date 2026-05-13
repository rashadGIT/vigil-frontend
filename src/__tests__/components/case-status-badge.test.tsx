/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CaseStatusBadge } from '@/components/cases/case-status-badge';
import { CaseStatus } from '@/types';

describe('CaseStatusBadge', () => {
  it('renders "New" for new status', () => {
    render(<CaseStatusBadge status={CaseStatus.new} />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders "In Progress" for in_progress status', () => {
    render(<CaseStatusBadge status={CaseStatus.in_progress} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders "Completed" for completed status', () => {
    render(<CaseStatusBadge status={CaseStatus.completed} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders "Archived" for archived status', () => {
    render(<CaseStatusBadge status={CaseStatus.archived} />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('applies blue classes for new status', () => {
    const { container } = render(<CaseStatusBadge status={CaseStatus.new} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/blue/);
  });

  it('applies amber classes for in_progress status', () => {
    const { container } = render(<CaseStatusBadge status={CaseStatus.in_progress} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/amber/);
  });

  it('applies green classes for completed status', () => {
    const { container } = render(<CaseStatusBadge status={CaseStatus.completed} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/green/);
  });

  it('applies gray classes for archived status', () => {
    const { container } = render(<CaseStatusBadge status={CaseStatus.archived} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/gray/);
  });
});
