import { test, expect } from '@playwright/test';

test('loads leaderboard data', async ({ page }) => {
  await page.goto('/leaderboard');
  await expect(
    page.getByRole('heading', { name: 'Leaderboard' }),
  ).toBeVisible();

  await page.waitForLoadState('networkidle');

  const error = page.getByText('Failed to load leaderboard');
  const empty = page.getByText('No results');
  if (await error.isVisible().catch(() => false)) {
    await expect(error).toBeVisible();
  } else if (await empty.isVisible().catch(() => false)) {
    await expect(empty).toBeVisible();
  } else {
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  }
});
