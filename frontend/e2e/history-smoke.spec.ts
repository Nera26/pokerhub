import { test, expect } from '@playwright/test';

test.describe('history endpoints', () => {
  test('games history', async ({ page }) => {
    await page.route('**/api/history/games', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    const res = await page.evaluate(() =>
      fetch('/api/history/games').then((r) => r.json()),
    );
    expect(res).toEqual([]);
  });

  test('tournament history', async ({ page }) => {
    await page.route('**/api/history/tournaments', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    const res = await page.evaluate(() =>
      fetch('/api/history/tournaments').then((r) => r.json()),
    );
    expect(res).toEqual([]);
  });

  test('transactions history', async ({ page }) => {
    await page.route('**/api/history/transactions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    const res = await page.evaluate(() =>
      fetch('/api/history/transactions').then((r) => r.json()),
    );
    expect(res).toEqual([]);
  });
});
