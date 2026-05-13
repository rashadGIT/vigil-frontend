import { test, expect } from '@playwright/test';

test.describe('Calendar flow', () => {
  test('calendar page loads without server error', async ({ page }) => {
    const response = await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const status = response?.status() ?? 200;
    expect(status).not.toBe(500);

    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Application error');
    expect(body).not.toContain('Internal Server Error');
  });

  test('calendar page contains calendar-related vocabulary', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').textContent();
    const hasCalendarContent = /calendar|schedule|event|today|month|week/i.test(bodyText ?? '');
    expect(hasCalendarContent).toBe(true);
  });

  test('calendar page renders at least one interactive element', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Navigation buttons (prev/next month) or "New Event" should be present
    const interactive = page.locator('button, [role="button"], a[href]');
    const count = await interactive.count();
    expect(count).toBeGreaterThan(0);
  });

  test('calendar does not show a blank body', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(20);
  });

  test('calendar page does not throw unhandled JS errors', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const criticalErrors = jsErrors.filter(
      (e) => !e.includes('hydration') && !e.includes('Warning'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
