import { test, expect } from './fixtures';

test('admin escalates flag actions', async ({ page }) => {
  await page.goto('/admin/anti-cheat');
  await expect(page.getByText('PlayerOne')).toBeVisible();
  const action = page.getByRole('button', { name: 'Warn' });
  await action.click();
  await expect(action).toHaveText('Restrict');
  await action.click();
  await expect(action).toHaveText('Ban');
});
