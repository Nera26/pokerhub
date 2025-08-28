import { test, expect } from '@playwright/test';
import { io } from 'socket.io-client';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { z } from 'zod';

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
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

test.describe('play hand end-to-end', () => {
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

  test('login, join, play, and verify RNG proof', async ({ page }) => {
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

    await expect(page.getByRole('heading', { name: 'Hand Proof' })).toBeVisible();
    await expect(page.getByText('Seed:')).toBeVisible();
    await expect(page.getByText('Nonce:')).toBeVisible();
    await expect(page.getByText('Commitment:')).toBeVisible();
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByText('Commitment valid: yes')).toBeVisible();

    const res = await page.request.get(`http://localhost:3000/hands/${events.end.handId}/proof`);
    const proofJson = await res.json();
    const proof = HandProofResponseSchema.parse(proofJson);
    const hash = createHash('sha256')
      .update(Buffer.from(proof.seed, 'hex'))
      .update(Buffer.from(proof.nonce, 'hex'))
      .digest('hex');
    expect(hash).toBe(proof.commitment);

    const outDir = path.resolve(__dirname, '../test-results');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, `proof-${events.end.handId}.json`),
      JSON.stringify(proof, null, 2),
    );
    socket.disconnect();
  });
});
