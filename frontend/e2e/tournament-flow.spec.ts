import { test, expect } from './fixtures';

const tournamentsResponse = [
  {
    id: 't1',
    title: 'Test Tournament',
    buyIn: 10,
    prizePool: 100,
    players: { current: 0, max: 9 },
    registered: false,
  },
];

test('registration -> withdrawal flow', async ({ page }) => {
  await page.route('**/api/tournaments', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tournamentsResponse),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'ok' }),
      });
    }
  });
  await page.route('**/api/tournaments/t1/register', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'registered' }),
    }),
  );
  await page.route('**/api/tournaments/t1/withdraw', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'withdrawn' }),
    }),
  );

  await page.goto('/');
  await page.getByRole('tab', { name: 'Tournaments' }).click();
  const button = page.getByRole('button', { name: 'Register' });
  await button.click();
  await expect(button).toHaveText('Withdraw');
  await button.click();
  await expect(button).toHaveText('Register');
});
