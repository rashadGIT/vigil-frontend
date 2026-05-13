/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntakeForm } from '@/components/intake/intake-form';

// Mock axios publicApiClient — component imports it from @/lib/api/public-client
jest.mock('@/lib/api/public-client', () => ({
  publicApiClient: {
    post: jest.fn(),
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { publicApiClient } from '@/lib/api/public-client';

const mockPost = publicApiClient.post as jest.Mock;

describe('IntakeForm', () => {
  const defaultProps = { tenantSlug: 'sunrise' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue({ data: { caseId: 'case-new-123' } });
  });

  it('renders step 1 with deceased first name input', () => {
    render(<IntakeForm {...defaultProps} />);
    // Label text is "First Name *" with id="firstName"
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  });

  it('renders the service type combobox', () => {
    render(<IntakeForm {...defaultProps} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders "Continue" button on step 1', () => {
    render(<IntakeForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('shows validation error when Continue clicked with empty first name', async () => {
    const user = userEvent.setup();
    render(<IntakeForm {...defaultProps} />);

    // Clear the first name input (default is empty)
    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);

    // Click Continue
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  it('advances to step 2 when step 1 is filled and Continue clicked', async () => {
    const user = userEvent.setup();
    render(<IntakeForm {...defaultProps} />);

    // Fill deceased first name
    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.type(firstNameInput, 'Alice');

    // Fill deceased last name — label "Last Name *" with id="lastName"
    const lastNameInput = screen.getByLabelText(/last name/i);
    await user.type(lastNameInput, 'Smith');

    // serviceType defaults to 'burial' so combobox already has a value — no need to change it

    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2 shows "Primary Contact" heading
    await waitFor(() => {
      expect(screen.getByText(/primary contact/i)).toBeInTheDocument();
    });
  });
});
