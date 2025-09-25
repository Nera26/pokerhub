import { test, expect } from './fixtures';
import { adminToken, loginAsAdmin } from './utils/adminSession';

const ADMIN_TOKEN = adminToken();

test('admin can create tabs at runtime', async ({ page }) => {
  const tabId = `qa-tab-${Date.now()}`;

  await loginAsAdmin(page);

  await page.request.post('http://127.0.0.1:4000/api/admin/tabs', {
    data: {
      id: tabId,
      title: 'QA Reports',
      icon: 'chart-line',
      component: '@/app/components/dashboard/AdminEvents',
    },
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  try {
    await page.goto('/admin/nav');

    await expect(
      page.getByRole('button', { name: 'Broadcasts' }),
    ).toBeVisible();
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
