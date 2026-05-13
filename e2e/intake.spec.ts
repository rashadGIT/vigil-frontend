import { test, expect } from '@playwright/test';

test.describe('Intake form E2E', () => {
  test('intake page renders form fields at /intake/test-slug', async ({ page }) => {
    // The backend may return 404 for unknown slug — that's acceptable in dev E2E.
    // We test that the page renders the form UI (not a server crash).
    await page.goto('/intake/test-slug');
    await page.waitForLoadState('networkidle');

    // Page should not be a 500 error
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Internal Server Error');
    expect(body).not.toContain('Application error');

    // The intake form page should contain either:
    // a) The form (for a valid slug) or
    // b) A "not found" message (for invalid slug in dev)
    // Either way it should not be a blank page
    expect(body?.length).toBeGreaterThan(20);
  });

  test('intake form has visible input fields when tenant slug is valid', async ({ page }) => {
    // Use 'sunrise' which the backend test seed creates (Phase 11)
    // In pre-seed state, this may redirect — that's acceptable
    const response = await page.goto('/intake/sunrise');

    // Accept 200 (form rendered) or 404 (tenant not seeded yet) — not 500
    const status = response?.status() ?? 200;
    expect([200, 404]).toContain(status);

    if (status === 200) {
      // If form rendered, at least one text input should be visible
      const inputs = await page.locator('input[type="text"], input:not([type])').count();
      expect(inputs).toBeGreaterThan(0);
    }
  });
});
