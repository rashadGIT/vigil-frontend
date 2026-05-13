import { test, expect } from '@playwright/test';

test.describe('Signature flow', () => {
  test('signatures page renders for a placeholder case', async ({ page }) => {
    const response = await page.goto('/cases/demo-case-id/signatures');
    await page.waitForLoadState('networkidle');

    const status = response?.status() ?? 200;
    expect(status).not.toBe(500);

    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Application error');
    expect(body?.trim().length).toBeGreaterThan(10);
  });

  test('signatures page contains signature-related vocabulary', async ({ page }) => {
    await page.goto('/cases/demo-case-id/signatures');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('/signatures')) {
      const bodyText = await page.locator('body').textContent();
      const hasSignatureContent = /sign|document|authoriz/i.test(bodyText ?? '');
      expect(hasSignatureContent).toBe(true);
    }
  });

  test('family signature link (public) renders without server error', async ({ page }) => {
    // The family portal uses a token — test that the page doesn't 500 on unknown token
    const response = await page.goto('/family/invalid-token-00000');
    await page.waitForLoadState('networkidle');

    const status = response?.status() ?? 200;
    expect(status).not.toBe(500);

    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Application error');
  });

  test('cremation auth page renders without crash', async ({ page }) => {
    const response = await page.goto('/cases/demo-case-id/cremation-auth');
    await page.waitForLoadState('networkidle');

    const status = response?.status() ?? 200;
    expect(status).not.toBe(500);

    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Internal Server Error');
    expect(body?.trim().length).toBeGreaterThan(10);
  });

  test('signature pages do not throw unhandled JS errors', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/cases/demo-case-id/signatures');
    await page.waitForLoadState('networkidle');

    const criticalErrors = jsErrors.filter(
      (e) => !e.includes('hydration') && !e.includes('Warning'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
