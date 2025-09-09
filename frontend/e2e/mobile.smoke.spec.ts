import { test, expect } from '@playwright/test';
import path from 'path';
import { execSync } from 'child_process';
import { bringUp, tearDown, waitFor } from './utils/smoke';

test.describe('mobile smoke', () => {
  test.beforeAll(async () => {
    const root = path.resolve(__dirname, '..', '..');
    await bringUp();
    execSync(
      'docker run -d --name toxiproxy --network pokerhub_default -p 8474:8474 -p 3001:3001 ghcr.io/shopify/toxiproxy',
      { stdio: 'inherit', cwd: root },
    );
    execSync('PACKET_LOSS=0.05 JITTER_MS=200 ./load/toxiproxy.sh', {
      stdio: 'inherit',
      cwd: root,
    });
    await waitFor('http://localhost:3001');
    await waitFor('http://localhost:3000/status');
  });

  test.afterAll(() => {
    const root = path.resolve(__dirname, '..', '..');
    execSync('docker rm -f toxiproxy >/dev/null 2>&1 || true', {
      stdio: 'inherit',
      cwd: root,
    });
    tearDown();
  });

  test('join table and play a hand', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Login")');

    // Force a reconnect to verify ACK after network disruption
    execSync('toxiproxy-cli toggle pokerhub_ws');
    await page.waitForTimeout(500);
    execSync('toxiproxy-cli toggle pokerhub_ws');

    await page.goto('/table/default');
    await page.getByRole('button', { name: 'Bet 1' }).click();

    await expect(page.getByTestId('status')).toContainText(
      'Action acknowledged',
    );
  });
});
