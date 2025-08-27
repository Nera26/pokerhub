import { test, expect } from './fixtures';

test('table list displays mocked table', async ({ page }) => {
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

  await page.goto('/table');
  await expect(page.getByText('Test Table')).toBeVisible();
});
