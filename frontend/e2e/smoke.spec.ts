import { test, expect } from './fixtures';

test('join table, bet, fold, and leave', async ({ page }) => {
  await page.route('**/api/tables', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: '1',
          tableName: 'Smoke Table',
          stakes: { small: 1, big: 2 },
          players: { current: 1, max: 6 },
          buyIn: { min: 40, max: 200 },
          stats: { handsPerHour: 10, avgPot: 5, rake: 1 },
          createdAgo: '1m',
        },
      ]),
    });
  });

  await page.route('**/api/tournaments', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/tables/1', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        smallBlind: 1,
        bigBlind: 2,
        pot: 0,
        communityCards: [],
        players: [
          { id: 1, username: 'Hero', avatar: '', chips: 100, isActive: true },
          { id: 2, username: 'Villain', avatar: '', chips: 100 },
        ],
        chatMessages: [],
      }),
    });
  });

  await page.route('**/api/table/1/tabs', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(['history', 'chat', 'notes']),
    });
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Join Table' }).click();

  await page.getByRole('button', { name: /Bet/ }).click();
  await expect(page.getByText(/You bet/)).toBeVisible();
  await page.getByRole('button', { name: /Fold/ }).click();
  await expect(page.getByText('You folded')).toBeVisible();
  await page.getByRole('button', { name: /Leave/ }).click();
});
