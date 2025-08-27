import { test, expect } from './fixtures';

test('table error page shows retry and back options', async ({ page }) => {
  await page.route('**/api/tables/1', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: 'invalid json',
    });
  });
  await page.route('**/api/tables', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.goto('/table/1');
  await expect(
    page.getByText('Failed to load table. Please try again.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to tables' }).click();
  await expect(page).toHaveURL('/table');
});
