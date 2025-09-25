import { test, expect } from './fixtures';
import {
  ensureUser,
  seedCollusionSession,
  clearCollusionSession,
} from './fixtures/api';

test('admin reviews collusion flags', async ({ page }) => {
  const admin = { email: 'admin@example.com', password: 'password123' };
  await ensureUser(page.request, { ...admin, role: 'Admin' });
  const session = await seedCollusionSession(page.request, {
    users: ['Alice', 'Bob'],
  });

  try {
    await page.goto('/login');
    await page.fill('#login-email', admin.email);
    await page.fill('#login-password', admin.password);
    await page.getByRole('button', { name: /login/i }).click();

    await page.goto('/admin/collusion');
    await expect(
      page.getByRole('heading', { name: 'Flagged Sessions' }),
    ).toBeVisible();

    const escapedId = session.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const row = page.getByRole('row', { name: new RegExp(escapedId) });
    await expect(row).toBeVisible();

    const action = row.getByRole('button');
    await expect(action).toHaveText('warn');
    await action.click();
    await expect(action).toHaveText('restrict');
    await action.click();
    await expect(action).toHaveText('ban');
  } finally {
    await clearCollusionSession(page.request, session.id).catch(() => {});
  }
});
