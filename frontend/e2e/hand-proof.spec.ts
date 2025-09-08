import { test, expect } from '@playwright/test';
import { io } from 'socket.io-client';
import { execSync } from 'child_process';
import path from 'path';
import { z } from 'zod';
import { verifyProof } from '@shared/verify';

const HandProofResponseSchema = z.object({
  seed: z.string(),
  nonce: z.string(),
  commitment: z.string(),
});

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

test.describe('hand proof fairness', () => {
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

  test('plays a hand and verifies proof', async ({ page }) => {
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

    const handId = events.end.handId;

    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/hands/${handId}/proof`)),
      page.click('text=Verify Hand'),
    ]);
    expect(resp.ok()).toBeTruthy();

    const proofJson = await resp.json();
    const proof = HandProofResponseSchema.parse(proofJson);

    expect(verifyProof(proof)).toBe(true);

    await expect(
      page.getByRole('heading', { name: 'Fairness Proof' }),
    ).toBeVisible();
    await expect(page.getByText('Verification: valid')).toBeVisible();

    socket.disconnect();
  });
});

