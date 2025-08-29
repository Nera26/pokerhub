import { test, expect } from '@playwright/test';

test('shows leaderboard players', async ({ page }) => {
  await page.route('**/api/leaderboard', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { playerId: 'alice', rank: 1, points: 100, net: 10, bb100: 5, hours: 2 },
      ]),
    });
  });

  await page.goto('/leaderboard');
  await expect(page.getByText('alice')).toBeVisible();
});
