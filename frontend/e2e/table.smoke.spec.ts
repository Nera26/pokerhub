import { test, expect } from '@playwright/test';
import { bringUp, tearDown } from './utils/smoke';

test.describe('table smoke', () => {
  test.beforeAll(async () => {
    await bringUp();
  });

  test.afterAll(() => {
    tearDown();
  });

  test('join table and play a hand', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Login")');

    await page.goto('/table/default');
    await page.getByRole('button', { name: 'Bet 1' }).click();

    await expect(page.getByTestId('status')).toContainText(
      'Action acknowledged',
    );
  });
});
