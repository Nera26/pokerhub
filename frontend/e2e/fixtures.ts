import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Fulfill any non-localhost request with empty 200 to avoid external calls
    await page.route(/^(?!http:\/\/localhost(:\d+)?\/)/, (route) => {
      route.fulfill({ status: 200, body: '' });
    });

    await use(page);
  },
});
export const expect = test.expect;
