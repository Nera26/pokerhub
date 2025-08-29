import { test, expect } from './fixtures';
import { Buffer } from 'node:buffer';

const adminPayload = Buffer.from(
  JSON.stringify({ role: 'admin' }),
).toString('base64');
const adminToken = `aaa.${adminPayload}.bbb`;

test('admin reviews collusion flags', async ({ page }) => {
  await page.route('**/api/auth/login', (route) => {
    route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/json',
        'set-cookie': 'refreshToken=r1; Path=/; HttpOnly; SameSite=Strict',
      },
      body: JSON.stringify({ token: adminToken }),
    });
  });

  await page.route('**/api/analytics/collusion/flagged**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 's1', users: ['Alice', 'Bob'], status: 'flagged' },
      ]),
    });
  });

  await page.route('**/api/analytics/collusion/*/*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'ok' }),
    });
  });

  await page.goto('/login');
  await page.fill('#login-email', 'admin@example.com');
  await page.fill('#login-password', 'password123');
  await page.getByRole('button', { name: /login/i }).click();

  await page.goto('/admin/collusion');
  await expect(
    page.getByRole('heading', { name: 'Flagged Sessions' }),
  ).toBeVisible();

  const action = page.getByRole('button', { name: 'warn' });
  await action.click();
  await expect(action).toHaveText('restrict');
  await action.click();
  await expect(action).toHaveText('ban');
});
