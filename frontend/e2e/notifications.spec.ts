import { test, expect } from './fixtures';

test('notifications page shows list and mark-all-read button', async ({
  page,
}) => {
  const notif = {
    id: '1',
    type: 'system',
    title: 'Welcome',
    message: 'Hello',
    timestamp: new Date().toISOString(),
    read: false,
  };

  await page.route('**/api/nav-items', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { flag: 'notifications', href: '/notifications', label: 'Alerts' },
      ]),
    });
  });

  await page.route('**/api/nav-icons', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/api/notifications', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ notifications: [notif] }),
    });
  });

  await page.route('**/api/notifications/unread', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 1 }),
    });
  });

  await page.route('**/api/notifications/filters', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ label: 'System', value: 'system' }]),
    });
  });

  await page.goto('/notifications');

  await expect(
    page.getByRole('heading', { name: 'Notifications' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Mark All as Read' }),
  ).toBeVisible();
  await expect(page.getByText('Welcome')).toBeVisible();
});
