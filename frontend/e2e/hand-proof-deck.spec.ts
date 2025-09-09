import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { bringUp, tearDown, recordSocketEvents } from './utils/handProof';

test.describe('hand proof deck verification', () => {
  test.beforeAll(async () => {
    await bringUp();
  });

  test.afterAll(() => {
    tearDown();
  });

  test('plays hand, downloads log, and verifies deck', async ({ page }) => {
    const { socket, events } = recordSocketEvents();

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
