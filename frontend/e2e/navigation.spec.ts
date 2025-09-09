import { test, expect } from './fixtures';
import { mockTablesRoute, tables } from './fixtures/tables';

test('navigates from home to table page', async ({ page }) => {
  await mockTablesRoute(page);
  await page.route('**/api/tournaments', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Join Table' }).click();
  await expect(page).toHaveURL(`/table/${tables[0].id}`);
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
