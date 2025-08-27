import { test, expect } from './fixtures';

const baseTable = {
  smallBlind: 1,
  bigBlind: 2,
  pot: 0,
  communityCards: [],
  players: [
    { id: 1, username: 'Hero', avatar: '', chips: 100, isActive: true },
    { id: 2, username: 'Villain', avatar: '', chips: 100 },
  ],
  chatMessages: [],
};

test('player can fold', async ({ page }) => {
  await page.route('**/api/tables/1', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(baseTable),
    });
  });

  await page.goto('/table/1');
  await page.getByRole('button', { name: /Fold/ }).click();
  await expect(page.getByText('You folded')).toBeVisible();
});

test('player can bet', async ({ page }) => {
  await page.route('**/api/tables/2', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(baseTable),
    });
  });

  await page.goto('/table/2');
  await page.getByRole('button', { name: /Bet/ }).click();
  await expect(page.getByText(/You bet/)).toBeVisible();
});

test('player can check', async ({ page }) => {
  await page.route('**/api/tables/3', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(baseTable),
    });
  });

  await page.goto('/table/3');
  await page.getByRole('button', { name: /^Check/ }).click();
  await expect(page.getByText('You checked')).toBeVisible();
});

test('player can call', async ({ page }) => {
  await page.route('**/api/tables/4', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...baseTable,
        players: [
          {
            id: 1,
            username: 'Hero',
            avatar: '',
            chips: 100,
            committed: 0,
            isActive: true,
          },
          { id: 2, username: 'Villain', avatar: '', chips: 100, committed: 5 },
        ],
      }),
    });
  });

  await page.goto('/table/4');
  await page.getByRole('button', { name: /Call \$5/ }).click();
  await expect(page.getByText('You called $5')).toBeVisible();
});
