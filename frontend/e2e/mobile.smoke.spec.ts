import { test } from '@playwright/test';
import path from 'path';
import { execSync } from 'child_process';
import { bringUp, tearDown, waitFor } from './utils/smoke';
import { loginAndPlay } from './utils/loginAndPlay';

const root = path.resolve(__dirname, '..', '..');

test.describe('mobile smoke', () => {
  test.beforeAll(async () => {
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
    execSync('docker rm -f toxiproxy >/dev/null 2>&1 || true', {
      stdio: 'inherit',
      cwd: root,
    });
    tearDown();
  });

  test('join table and play a hand', async ({ page }) => {
    await loginAndPlay(page, { toggleNetwork: true });
  });
});
