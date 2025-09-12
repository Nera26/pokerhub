import { test, expect } from './fixtures';

test.skip(process.env.NEXT_PUBLIC_E2E !== '1');

// Ensure the app shows an offline page and recovers once connectivity is restored.
test('home page renders offline and reconnects', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');

  // Wait for the service worker to be ready before going offline
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.ready;
    }
  });

  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('main')).toBeVisible();

  // Simulate offline mode
  await context.setOffline(true);
  await page.reload();

  // Offline fallback page should render
  await expect(page.getByText('You are offline')).toBeVisible();

  // Clicking retry while offline should keep the offline page
  await page.getByRole('button', { name: /refresh/i }).click();
  await expect(page.getByText('You are offline')).toBeVisible();

  // Restore connectivity and trigger reload via the retry button
  await context.setOffline(false);
  await page.getByRole('button', { name: /refresh/i }).click();
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('main')).toBeVisible();

  expect(errors).toEqual([]);
});
