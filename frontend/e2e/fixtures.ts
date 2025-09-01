import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Fulfill any non-localhost request with empty 200 to avoid external calls
    await page.route(/^(?!http:\/\/localhost(:\d+)?\/)/, (route) => {
      route.fulfill({ status: 200, body: '' });
    });

    // Example stubs for internal API used in tests
    await page.route('**/api/leaderboard**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            playerId: 'neo',
            rank: 1,
            points: 100,
            net: 50,
            bb100: 10,
            hours: 1,
            roi: 1,
            finishes: { 1: 1 },
          },
        ]),
      });
    });

    await page.route('**/api/wallet**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ balance: 123456 }),
      });
    });

    await page.route('**/api/notifications**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ notifications: [], balance: 0 }),
      });
    });

    await use(page);
  },
});
export const expect = test.expect;
