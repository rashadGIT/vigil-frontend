import { test, expect } from '@playwright/test';

test.describe('Payment flow', () => {
  test('payments page renders for a placeholder case', async ({ page }) => {
    const response = await page.goto('/cases/demo-case-id/payments');
    await page.waitForLoadState('networkidle');

    const status = response?.status() ?? 200;
    expect(status).not.toBe(500);

    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Application error');
    expect(body?.trim().length).toBeGreaterThan(10);
  });

  test('payments page contains a payment-related heading or label', async ({ page }) => {
    await page.goto('/cases/demo-case-id/payments');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').textContent();
    // Should contain "payment", "balance", or "amount" somewhere on the page
    const hasPaymentContent =
      /payment|balance|amount|invoice|total/i.test(bodyText ?? '');

    // Either content is shown or a loading/not-found state is shown — never a blank crash
    expect(bodyText?.trim().length).toBeGreaterThan(10);
    // If page loaded successfully (not a 404 redirect) expect payment vocabulary
    const url = page.url();
    if (url.includes('/payments')) {
      expect(hasPaymentContent).toBe(true);
    }
  });

  test('revenue report page loads on dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dashboard should show revenue-related content
    const bodyText = await page.locator('body').textContent();
    const hasFinancialContent = /revenue|cases|balance|\$/i.test(bodyText ?? '');
    expect(hasFinancialContent).toBe(true);
  });

  test('payment form inputs are accessible when rendered', async ({ page }) => {
    await page.goto('/cases/demo-case-id/payments');
    await page.waitForLoadState('networkidle');

    // If a "Record Payment" or similar button exists, it should be focusable
    const payButton = page
      .getByRole('button', { name: /payment|record|add/i })
      .or(page.getByRole('link', { name: /payment/i }))
      .first();

    const isVisible = await payButton.isVisible().catch(() => false);
    if (isVisible) {
      // Tab to button — confirm it's keyboard-reachable
      await payButton.focus();
      const focused = await payButton.evaluate((el) => el === document.activeElement);
      expect(focused).toBe(true);
    }

    // No crash regardless
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Application error');
  });

  test('payments page does not throw unhandled JS errors', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/cases/demo-case-id/payments');
    await page.waitForLoadState('networkidle');

    const criticalErrors = jsErrors.filter(
      (e) => !e.includes('hydration') && !e.includes('Warning'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
