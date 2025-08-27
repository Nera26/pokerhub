import { test, expect } from './fixtures';

test.skip(process.env.NEXT_PUBLIC_E2E === '1');

test('service worker registers', async ({ page }) => {
  await page.goto('/');
  const registered = await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.ready;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0;
    }
    return false;
  });
  expect(registered).toBeTruthy();
});
