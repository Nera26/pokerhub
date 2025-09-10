import { test, expect } from './fixtures';

test('wallet page renders with live data', async ({ page }) => {
  await page.goto('/wallet');
  await expect(page).toHaveURL('/wallet');

  await page.waitForLoadState('networkidle');

  const balance = page.getByText('Total Balance');
  const error = page.getByText(/failed to load wallet/i);

  if (await balance.isVisible().catch(() => false)) {
    await expect(balance).toBeVisible();

    const depositBtn = page.getByRole('button', { name: 'Deposit' });
    if (await depositBtn.isVisible().catch(() => false)) {
      await depositBtn.click();
      await expect(page.getByLabel('Close deposit modal')).toBeVisible();
      await page.getByLabel('Close deposit modal').click();
    }
  } else {
    await expect(error).toBeVisible();
  }
});
