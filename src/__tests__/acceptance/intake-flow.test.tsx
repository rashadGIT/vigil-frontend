/**
 * @jest-environment jsdom
 *
 * Acceptance test: full 3-step intake submission user flow.
 * Covers TEST-03 (acceptance tests = RTL user-flow level per CLAUDE.md).
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntakeForm } from '@/components/intake/intake-form';

jest.mock('@/lib/api/public-client', () => ({
  publicApiClient: {
    post: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { publicApiClient } from '@/lib/api/public-client';

const mockPost = publicApiClient.post as jest.Mock;

describe('Acceptance: Intake submission flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue({ data: { caseId: 'case-abc-123' } });
  });

  it('completes full 3-step intake form and shows success state', async () => {
    const user = userEvent.setup();
    render(<IntakeForm tenantSlug="sunrise" />);

    // --- Step 1: Deceased information ---
    // serviceType defaults to 'burial' so combobox is already valid
    await user.type(screen.getByLabelText(/first name/i), 'Alice');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');

    await user.click(screen.getByRole('button', { name: /continue/i }));

    // --- Step 2: Primary contact ---
    await waitFor(() => {
      expect(screen.getByText(/primary contact/i)).toBeInTheDocument();
    });

    // Step 2 has unlabeled inputs (no htmlFor) — query by placeholder or type attribute
    // contactFirstName and contactLastName render without explicit htmlFor in step 2
    const allTextboxes = screen.getAllByRole('textbox');
    // First two textboxes in step 2 are first name and last name
    await user.type(allTextboxes[0], 'Jane');
    await user.type(allTextboxes[1], 'Smith');

    // Phone input (type="tel")
    const phoneInput = screen.getByPlaceholderText(/555/i);
    await user.type(phoneInput, '5550001234');

    // Email input (type="email")
    const emailInput = screen.getByPlaceholderText(/email/i);
    await user.type(emailInput, 'jane@example.com');

    // Relationship input
    const relationshipInput = screen.getByPlaceholderText(/spouse/i);
    await user.type(relationshipInput, 'Spouse');

    await user.click(screen.getByRole('button', { name: /continue/i }));

    // --- Step 3: Service preferences (all optional) ---
    await waitFor(() => {
      expect(screen.getByText(/service preferences/i)).toBeInTheDocument();
    });

    // Submit the form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // --- Verify success state ---
    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument();
    });

    // Verify API was called with correct endpoint
    expect(mockPost).toHaveBeenCalledWith(
      '/intake/sunrise',
      expect.objectContaining({
        deceasedFirstName: 'Alice',
        deceasedLastName: 'Smith',
        serviceType: 'burial',
        contactFirstName: 'Jane',
        contactLastName: 'Smith',
        contactEmail: 'jane@example.com',
        contactRelationship: 'Spouse',
      })
    );
  });

  it('shows error toast when API call fails', async () => {
    const user = userEvent.setup();
    mockPost.mockRejectedValue(new Error('Network error'));

    const { toast } = require('sonner');
    render(<IntakeForm tenantSlug="sunrise" />);

    // Complete steps 1 and 2 quickly
    await user.type(screen.getByLabelText(/first name/i), 'Bob');
    await user.type(screen.getByLabelText(/last name/i), 'Jones');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText(/primary contact/i));

    const allTextboxes = screen.getAllByRole('textbox');
    await user.type(allTextboxes[0], 'Mary');
    await user.type(allTextboxes[1], 'Jones');
    await user.type(screen.getByPlaceholderText(/555/i), '5550009999');
    await user.type(screen.getByPlaceholderText(/email/i), 'mary@example.com');
    await user.type(screen.getByPlaceholderText(/spouse/i), 'Child');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText(/service preferences/i));
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Submission failed')
      );
    });
  });
});
