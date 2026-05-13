/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FolderOpen } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

describe('StatCard', () => {
  it('renders the title and value', () => {
    render(<StatCard title="Active Cases" value={12} icon={FolderOpen} />);
    expect(screen.getByText('Active Cases')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders 0 when value is undefined', () => {
    render(<StatCard title="Active Cases" value={undefined} icon={FolderOpen} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(
      <StatCard
        title="Active Cases"
        value={5}
        icon={FolderOpen}
        description="New + in progress"
      />
    );
    expect(screen.getByText('New + in progress')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<StatCard title="Active Cases" value={5} icon={FolderOpen} />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('renders a skeleton instead of value when loading is true', () => {
    const { container } = render(
      <StatCard title="Active Cases" value={12} icon={FolderOpen} loading />
    );
    // Skeleton renders with data-slot="skeleton" or at minimum hides the value
    expect(screen.queryByText('12')).not.toBeInTheDocument();
    // The skeleton div should be present
    expect(container.querySelector('.h-8')).toBeInTheDocument();
  });

  it('wraps the card in a link when href is provided', () => {
    render(
      <StatCard title="Active Cases" value={3} icon={FolderOpen} href="/cases?filter=active" />
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/cases?filter=active');
  });

  it('does not render a link when href is not provided', () => {
    render(<StatCard title="Active Cases" value={3} icon={FolderOpen} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
