import { test, expect } from './fixtures';

test('CSP blocks inline scripts without nonce', async ({ page }) => {
  await page.goto('/');

  // Ensure all inline style and script tags carry the nonce
  const stylesWithoutNonce = await page.$$eval('style:not([nonce])', els => els.length);
  const scriptsWithoutNonce = await page.$$eval('script:not([src]):not([nonce])', els => els.length);
  expect(stylesWithoutNonce).toBe(0);
  expect(scriptsWithoutNonce).toBe(0);

  // Attempt to inject an inline script without a nonce
  await page.evaluate(() => {
    const s = document.createElement('script');
    s.textContent = 'window.inlineScriptRan = true';
    document.body.appendChild(s);
  });

  // The script should be blocked by CSP and never run
  const executed = await page.evaluate(() => (window as any).inlineScriptRan);
  expect(executed).toBeUndefined();
});
