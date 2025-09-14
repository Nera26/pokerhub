import { test, expect } from '@playwright/test';
import { bringUp, tearDown, playHand } from './utils/handProof';
import { z } from 'zod';
import { verifyProof } from '@shared/verify';
import { execSync } from 'child_process';
import path from 'path';

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
    const { handId, socket } = await playHand(page);

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

    if (process.env.VERIFY_DECK === 'true') {
      const cmd = path.resolve(__dirname, '../../bin/verify');
      const output = execSync(
        `${cmd} proof ${handId} --base http://localhost:3000`,
        {
          cwd: path.resolve(__dirname, '..', '..'),
          encoding: 'utf8',
        },
      );
      expect(output).toContain('Proof verified');
    }

    socket.disconnect();
  });
});
