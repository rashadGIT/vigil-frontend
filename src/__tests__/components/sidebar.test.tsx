/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar, MobileSidebarTrigger } from '@/components/layout/sidebar';

// next/navigation mock is loaded from src/__mocks__/next/navigation.ts via moduleNameMapper
// next/link mock is loaded from src/__mocks__/next/link.tsx

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the brand name', () => {
    render(<Sidebar />);
    expect(screen.getByText('Kelova')).toBeInTheDocument();
  });

  it('renders all main nav links', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Cases')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Vendors')).toBeInTheDocument();
    expect(screen.getByText('Price List')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders nav links as anchor elements', () => {
    render(<Sidebar />);
    const links = screen.getAllByRole('link');
    // 6 nav items
    expect(links.length).toBeGreaterThanOrEqual(6);
  });

  it('Dashboard link has href "/"', () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute('href', '/');
  });

  it('Cases link has href "/cases"', () => {
    render(<Sidebar />);
    const casesLink = screen.getByRole('link', { name: /^cases$/i });
    expect(casesLink).toHaveAttribute('href', '/cases');
  });

  it('marks Dashboard link as active when pathname is "/"', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/');
    render(<Sidebar />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    // Active link has font-semibold + bg-accent classes
    expect(dashboardLink.className).toMatch(/font-semibold/);
  });

  it('marks Cases link as active when pathname starts with "/cases"', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/cases');
    render(<Sidebar />);

    const casesLink = screen.getByRole('link', { name: /^cases$/i });
    expect(casesLink.className).toMatch(/font-semibold/);
  });

  it('does not mark Dashboard as active when pathname is "/cases"', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/cases');
    render(<Sidebar />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink.className).toMatch(/font-normal/);
  });
});

describe('MobileSidebarTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the hamburger menu button', () => {
    render(<MobileSidebarTrigger />);
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeInTheDocument();
  });

  it('opens the mobile nav sheet when the button is clicked', async () => {
    const user = userEvent.setup();
    render(<MobileSidebarTrigger />);

    await user.click(screen.getByRole('button', { name: /open navigation menu/i }));

    // After opening, the sidebar content (brand name) becomes visible
    await screen.findByText('Kelova');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
