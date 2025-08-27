import { test, expect } from './fixtures';

test('navigates from home to table page', async ({ page }) => {
  await page.route('**/api/tables', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: '1',
          tableName: 'Test Table',
          stakes: { small: 1, big: 2 },
          players: { current: 1, max: 6 },
          buyIn: { min: 40, max: 200 },
          stats: { handsPerHour: 10, avgPot: 5, rake: 1 },
          createdAgo: '1m',
        },
      ]),
    });
  });
  await page.route('**/api/tournaments', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Join Table' }).click();
  await expect(page).toHaveURL('/table/1');
});

test('shows 404 page for unknown route', async ({ page }) => {
  await page.goto('/unknown-page');
  await expect(page.getByText(/Page Not Found/i)).toBeVisible();
});

test('navigates to wallet from header link', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Wallet' }).click();
  await expect(page).toHaveURL('/wallet');
});
