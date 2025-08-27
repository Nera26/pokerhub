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
        body: JSON.stringify({
          players: [{ id: 1, name: 'Neo', chips: 42000 }],
        }),
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
