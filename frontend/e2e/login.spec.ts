import { test, expect } from './fixtures';
import { ensureUser } from './fixtures/api';

test('user can log in and refresh token rotates', async ({ page }) => {
  const credentials = { email: 'user@example.com', password: 'password123' };
  await ensureUser(page.request, credentials);

  await page.goto('/login');
  await expect(page.getByAltText('PokerHub logo')).toBeVisible();
  await page.fill('#login-email', credentials.email);
  await page.fill('#login-password', credentials.password);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL('/');

  const cookiesAfterLogin = await page.context().cookies();
  const refreshCookie = cookiesAfterLogin.find(
    (c) => c.name === 'refreshToken',
  );
  expect(refreshCookie?.value).toBeTruthy();

  await page.evaluate(async (token) => {
    await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    });
  }, refreshCookie?.value);

  const cookiesAfterRefresh = await page.context().cookies();
  const rotated = cookiesAfterRefresh.find((c) => c.name === 'refreshToken');
  expect(rotated?.value).toBeTruthy();
  expect(rotated?.value).not.toBe(refreshCookie?.value);
});
