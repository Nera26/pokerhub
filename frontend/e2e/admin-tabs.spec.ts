import { test, expect } from './fixtures';
import { ensureUser, loginViaApi } from './fixtures/api';

test('admin can create tabs at runtime', async ({ page }) => {
  const admin = { email: 'admin-tabs@example.com', password: 'password123' };

  // Ensure an admin user exists and get an API token for authenticated requests
  await ensureUser(page.request, { ...admin, role: 'Admin' });
  const adminToken = await loginViaApi(page.request, admin.email, admin.password);

  const tabId = `qa-tab-${Date.now()}`;

  // Create a new admin tab via API
  await page.request.post('http://127.0.0.1:4000/api/admin/tabs', {
    data: {
      id: tabId,
      title: 'QA Reports',
      icon: 'chart-line',
      component: '@/app/components/dashboard/AdminEvents',
    },
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  try {
    // Log into the UI as the same admin user
    await page.goto('/login');
    await page.fill('#login-email', admin.email);
    await page.fill('#login-password', admin.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Navigate to the admin nav page and verify the new tab shows up
    await page.goto('/admin/nav');

    await expect(page.getByRole('button', { name: 'Broadcasts' })).toBeVisible();
    await expect(page.getByText('QA Reports')).toBeVisible();
  } finally {
    // Cleanup: delete the tab we created
    try {
      await page.request.delete(`http://127.0.0.1:4000/api/admin/tabs/${tabId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch {
      // ignore cleanup errors
    }
  }
});
