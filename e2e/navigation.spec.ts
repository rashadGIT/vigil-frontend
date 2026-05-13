import { test, expect } from '@playwright/test';

test.describe('Navigation smoke tests', () => {
  test('home page loads without unhandled console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should not show a crash or blank screen
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();

    // Filter out known non-critical errors (Next.js hydration warnings in dev)
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes('Warning:') &&
        !e.includes('ReactDOM.render') &&
        !e.includes('hydration') &&
        !e.includes('Hydrat'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('page title is set (not empty)', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
