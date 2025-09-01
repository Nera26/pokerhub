import { test, expect } from '@playwright/test';
import { io } from 'socket.io-client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
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

    // Fetch proof
    const proofRes = await page.request.get(`http://localhost:3000/hands/${handId}/proof`);
    const proof = HandProofResponseSchema.parse(await proofRes.json());

    // Download hand log
    const logRes = await page.request.get(`http://localhost:3000/hands/${handId}/log`);
    const logText = await logRes.text();

    const outDir = path.resolve(__dirname, '../test-results');
    fs.mkdirSync(outDir, { recursive: true });
    const logPath = path.join(outDir, `${handId}.log`);
    fs.writeFileSync(logPath, logText);

    // Extract initial deck and hole cards
    const lines = logText.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const entryWithDeck = lines.find(
      (e) => Array.isArray(e) && e[3]?.deck && e[3].deck.length > 0,
    );
    if (!entryWithDeck) throw new Error('Deck not found in log');
    const postState = entryWithDeck[3];
    const deckAfterDeal: number[] = postState.deck;
    const holeCards: number[] = [];
    for (const p of postState.players) {
      if (Array.isArray(p.holeCards)) holeCards.push(...p.holeCards);
    }
    const fullDeck = deckAfterDeal.concat([...holeCards].reverse());

    const deckPath = path.join(outDir, `${handId}-deck.json`);
    fs.writeFileSync(deckPath, JSON.stringify({ deck: fullDeck }, null, 2));

    // Verify using backend script
    const script = path.resolve(
      __dirname,
      '../../backend/src/scripts/verify-proof.ts',
    );
    const cmd = `npx ts-node ${script} ${proof.commitment} ${proof.seed} ${proof.nonce} ${deckPath}`;
    const output = execSync(cmd, {
      cwd: path.resolve(__dirname, '..', '..'),
      encoding: 'utf8',
    });
    expect(output).toContain('Proof verified');

    socket.disconnect();
  });
});

