import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

const ROUTES = ['/', '/dashboard', '/wallet', '/promotions', '/leaderboard'];

async function scan(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('main, [role="main"]', {
    state: 'visible',
    timeout: 10_000,
  });
  await page.waitForLoadState('networkidle');

  await page.addStyleTag({
    content: `
    * { animation-duration: 0.001s !important; transition-duration: 0.001s !important; }
  `,
  });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const violations = results?.violations ?? [];
  const critical = violations.filter((v) => v.impact === 'critical');
  const serious = violations.filter((v) => v.impact === 'serious');

  if (critical.length || serious.length) {
    console.log('A11y violations:', JSON.stringify(violations, null, 2));
  }

  expect(critical, 'No critical a11y violations').toEqual([]);
  expect(serious, 'No serious a11y violations').toEqual([]);
}

for (const route of ROUTES) {
  test.describe(`a11y: ${route}`, () => {
    test(`has no critical/serious violations`, async ({ page, baseURL }) => {
      await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
      await scan(page);
    });
  });
}
