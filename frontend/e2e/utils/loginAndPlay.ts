import { Page, expect } from '@playwright/test';
import { execSync } from 'child_process';

interface Options {
  /** Toggle network to simulate reconnect */
  toggleNetwork?: boolean;
}

export async function loginAndPlay(
  page: Page,
  { toggleNetwork }: Options = {},
) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("Login")');

  if (toggleNetwork) {
    execSync('toxiproxy-cli toggle pokerhub_ws');
    await page.waitForTimeout(500);
    execSync('toxiproxy-cli toggle pokerhub_ws');
  }

  await page.goto('/table/default');
  await page.getByRole('button', { name: 'Bet 1' }).click();

  await expect(page.getByTestId('status')).toContainText('Action acknowledged');
}
