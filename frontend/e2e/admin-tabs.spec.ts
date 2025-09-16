import { test, expect } from './fixtures';
import { createHmac } from 'node:crypto';

const JWT_SECRET = 'dev-secret';

function createAdminToken(): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'admin', role: 'admin' }),
  ).toString('base64url');
  const data = `${header}.${payload}`;
  const signature = createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

const ADMIN_TOKEN = createAdminToken();

test('admin can create tabs at runtime', async ({ page }) => {
  const tabId = `qa-tab-${Date.now()}`;

  await page.request.post('http://127.0.0.1:4000/api/admin/tabs', {
    data: {
      id: tabId,
      title: 'QA Reports',
      icon: 'chart-line',
      component: '@/app/components/dashboard/AdminEvents',
    },
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });

  await page.route('**/api/auth/login', (route) => {
    route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/json',
        'set-cookie': 'refreshToken=r1; Path=/; HttpOnly; SameSite=Strict',
      },
      body: JSON.stringify({ token: ADMIN_TOKEN }),
    });
  });

  await page.route('**/api/auth/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'admin', role: 'admin' }),
    });
  });

  try {
    await page.goto('/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.getByRole('button', { name: /login/i }).click();

    await page.goto('/admin/nav');

    await expect(page.getByText('QA Reports')).toBeVisible();
  } finally {
    try {
      await page.request.delete(
        `http://127.0.0.1:4000/api/admin/tabs/${tabId}`,
        {
          headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        },
      );
    } catch {}
  }
});
