import { test, expect } from '@playwright/test';
import path from 'path';
import { execSync } from 'child_process';

// Simple helper to wait for a service to respond
async function waitFor(url: string, timeout = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

test.describe('table smoke', () => {
  test.beforeAll(async () => {
    execSync(
      'docker compose -f ../../docker-compose.yml -f ../../docker-compose.test.yml up -d',
      { stdio: 'inherit', cwd: path.resolve(__dirname, '..', '..') },
    );
    await waitFor('http://localhost:3001');
    await waitFor('http://localhost:3000/status');
  });

  test.afterAll(() => {
    execSync(
      'docker compose -f ../../docker-compose.yml -f ../../docker-compose.test.yml down -v',
      { stdio: 'inherit', cwd: path.resolve(__dirname, '..', '..') },
    );
  });

  test('join table and play a hand', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Login")');

    await page.goto('/table/default');
    await page.getByRole('button', { name: 'Bet 1' }).click();

    await expect(page.getByTestId('status')).toContainText('Action acknowledged');
  });
});

