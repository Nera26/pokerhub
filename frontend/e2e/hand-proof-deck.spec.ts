import { test, expect } from '@playwright/test';
import { io } from 'socket.io-client';
import { execSync } from 'child_process';
import path from 'path';

async function waitFor(url: string, timeout = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

test.describe('hand proof deck verification', () => {
  test.beforeAll(async () => {
    execSync('docker compose -f ../../docker-compose.yml -f ../../docker-compose.test.yml up -d', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..', '..'),
    });
    await waitFor('http://localhost:3001');
    await waitFor('http://localhost:3000/status');
  });

  test.afterAll(() => {
    execSync('docker compose -f ../../docker-compose.yml -f ../../docker-compose.test.yml down -v', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..', '..'),
    });
  });

  test('plays hand, downloads log, and verifies deck', async ({ page }) => {
    const socket = io('http://localhost:4000', { transports: ['websocket'] });
    const events: Record<string, any> = {};
    socket.on('hand.start', (d) => (events.start = d));
    socket.on('hand.end', (d) => (events.end = d));

    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Login")');

    await page.click('text=Join Table');
    await page.click('text=Bet');

    await expect
      .poll(() => events.end?.handId, { timeout: 60_000 })
      .not.toBeUndefined();

    const handId = events.end.handId as string;

    const cmd = path.resolve(__dirname, '../../bin/verify-proof');
    const output = execSync(`${cmd} ${handId} --base http://localhost:3000`, {
      cwd: path.resolve(__dirname, '..', '..'),
      encoding: 'utf8',
    });
    expect(output).toContain('Proof verified');

    socket.disconnect();
  });
});

