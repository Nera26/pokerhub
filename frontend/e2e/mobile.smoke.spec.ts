import { test, expect } from '@playwright/test';
import path from 'path';
import { execSync } from 'child_process';

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

test.describe('mobile smoke', () => {
  test.beforeAll(async () => {
    const root = path.resolve(__dirname, '..', '..');
    execSync(
      'docker compose -f ../../docker-compose.yml -f ../../docker-compose.test.yml up -d',
      { stdio: 'inherit', cwd: root },
    );
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
    execSync(
      'docker compose -f ../../docker-compose.yml -f ../../docker-compose.test.yml down -v',
      { stdio: 'inherit', cwd: root },
    );
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
