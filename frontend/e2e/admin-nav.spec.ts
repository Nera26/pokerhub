import { createHmac } from 'crypto';
import { expect, test } from './fixtures';

function createAdminToken(secret: string) {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    'utf-8',
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'admin-e2e',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
    }),
    'utf-8',
  ).toString('base64url');
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

test('nav item created via API appears in navigation', async ({ page }) => {
  const secret = process.env.JWT_SECRETS?.split(',')[0] ?? 'dev-secret';
  const token = createAdminToken(secret);

  const flag = `e2e-nav-${Date.now()}`;
  const label = 'Support Center';
  const headers = {
    Authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };

  const createResponse = await page.request.post(
    'http://localhost:4000/api/admin/nav',
    {
      headers,
      data: {
        flag,
        href: `/${flag}`,
        label,
        order: 99,
      },
    },
  );
  expect(createResponse.ok()).toBeTruthy();

  try {
    const navItemsResponse = page.waitForResponse('**/api/nav-items');
    await page.goto('/');
    await navItemsResponse;
    await expect(page.getByRole('link', { name: label })).toBeVisible();
  } finally {
    await page.request.delete(`http://localhost:4000/api/admin/nav/${flag}`, {
      headers,
    });
  }
});
