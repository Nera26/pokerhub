import { test, expect } from './fixtures';
import { loginAsAdmin } from './utils/adminSession';

test('admin tournament modal loads seeded formats', async ({ page }) => {
  await loginAsAdmin(page);

  await page.waitForURL(/\/dashboard/);

  await page.goto('/dashboard?tab=tournaments');

  await page.getByRole('button', { name: 'New Tournament' }).click();

  const formatSelect = page.getByLabel('Format');
  await expect(formatSelect).toBeVisible();
  await expect(
    formatSelect.locator('option', { hasText: 'Regular' }),
  ).toBeVisible();
  await expect(
    formatSelect.locator('option', { hasText: 'Turbo' }),
  ).toBeVisible();
});
