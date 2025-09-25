import { test, expect } from './fixtures';
import { ensureUser } from './fixtures/api';

test('admin tournament modal loads seeded formats', async ({ page }) => {
  const admin = {
    email: 'admin-tournaments@example.com',
    password: 'password123',
  };
  await ensureUser(page.request, { ...admin, role: 'Admin' });

  await page.goto('/login');
  await page.fill('#login-email', admin.email);
  await page.fill('#login-password', admin.password);
  await page.getByRole('button', { name: /login/i }).click();

  await page.waitForURL(/\/dashboard/);

  await page.goto('/dashboard?tab=tournaments');

  await page.getByRole('button', { name: 'New Tournament' }).click();

  const formatSelect = page.getByLabel('Format');
  await expect(formatSelect).toBeVisible();
  await expect(formatSelect.locator('option', { hasText: 'Regular' })).toBeVisible();
  await expect(formatSelect.locator('option', { hasText: 'Turbo' })).toBeVisible();
});
