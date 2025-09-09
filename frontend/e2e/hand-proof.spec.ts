import { test, expect } from '@playwright/test';
import { bringUp, tearDown, recordSocketEvents } from './utils/handProof';
import { z } from 'zod';
import { verifyProof } from '@shared/verify';

const HandProofResponseSchema = z.object({
  seed: z.string(),
  nonce: z.string(),
  commitment: z.string(),
});

test.describe('hand proof fairness', () => {
  test.beforeAll(async () => {
    await bringUp();
  });

  test.afterAll(() => {
    tearDown();
  });

  test('plays a hand and verifies proof', async ({ page }) => {
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
