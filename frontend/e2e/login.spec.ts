import { test, expect } from './fixtures';

test('user can log in and refresh token rotates', async ({ page }) => {
  let refresh = 'r1';
  await page.route('**/api/auth/login', (route) => {
    route.fulfill({
      status: 200,
      headers: {
        'set-cookie': `refreshToken=${refresh}; Path=/; HttpOnly; SameSite=Strict`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ token: 'a1' }),
    });
  });
  await page.route('**/api/auth/refresh', (route) => {
    const cookie = route.request().headers()['cookie'] || '';
    const used = /refreshToken=([^;]+)/.exec(cookie)?.[1];
    if (used === refresh) {
      refresh = 'r2';
      route.fulfill({
        status: 200,
        headers: {
          'set-cookie': `refreshToken=${refresh}; Path=/; HttpOnly; SameSite=Strict`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ token: 'a2' }),
      });
    } else {
      route.fulfill({ status: 401 });
    }
  });

  await page.goto('/login');
  await expect(page.getByAltText('PokerHub logo')).toBeVisible();
  await page.fill('#login-email', 'user@example.com');
  await page.fill('#login-password', 'password123');
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL('/');

  await page.evaluate(() =>
    fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' }),
  );

  const cookies = await page.context().cookies();
  const refreshCookie = cookies.find((c) => c.name === 'refreshToken');
  expect(refreshCookie?.value).toBe('r2');
});
