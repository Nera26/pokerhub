import { test, expect } from './fixtures';

test('user can open wallet modals and return to lobby', async ({ page }) => {
  await page.goto('/wallet');

  await expect(page.getByText('Total Balance')).toBeVisible();

  await page.getByRole('button', { name: 'Deposit' }).click();
  await expect(page.getByLabel('Close deposit modal')).toBeVisible();
  await page.getByLabel('Close deposit modal').click();

  await page.getByRole('button', { name: 'Withdraw' }).click();
  await expect(page.getByLabel('Close withdraw modal')).toBeVisible();
  await page.getByLabel('Close withdraw modal').click();

  await page.getByRole('link', { name: 'Lobby' }).click();
  await expect(page).toHaveURL('/');
});

test('user can submit withdraw form', async ({ page }) => {
  await page.goto('/wallet');

  await page.getByRole('button', { name: 'Withdraw' }).click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();

  const input = modal.getByPlaceholder('0.00');
  await input.fill('2000');
  await expect(page.getByText('Insufficient funds')).toBeVisible();

  await input.fill('100');
  await expect(page.getByRole('button', { name: 'Withdraw' })).toBeEnabled();
  await page.getByRole('button', { name: 'Withdraw' }).click();

  await expect(
    page.getByText('Withdraw request of $100.00 sent'),
  ).toBeVisible();
});
