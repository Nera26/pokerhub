import { test, expect } from './fixtures';

test('displays hand proof', async ({ page, baseURL }) => {
  await page.route('**/api/hands/123/proof', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        commitment: 'commit123',
        seed: 'seed123',
        nonce: 'nonce123',
      }),
    }),
  );

  await page.goto(`${baseURL}/hands/123/proof`);
  await expect(page.getByText('commit123')).toBeVisible();
  await expect(page.getByText('seed123')).toBeVisible();
  await expect(page.getByText('nonce123')).toBeVisible();
});
