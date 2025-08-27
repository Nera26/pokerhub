import { test, expect } from './fixtures';

test('user can open tournament registration and return to lobby', async ({
  page,
}) => {
  await page.goto('/tournament');

  await expect(
    page.getByRole('heading', { name: 'Tournaments' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'REGISTER NOW' }).first().click();
  await expect(page.getByLabel('Close')).toBeVisible();
  await page.getByLabel('Close').click();

  await page.getByRole('link', { name: 'Lobby' }).click();
  await expect(page).toHaveURL('/');
});
