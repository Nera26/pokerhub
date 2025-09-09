import path from 'path';
import { execSync } from 'child_process';

export async function waitFor(url: string, timeout = 60_000) {
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

const root = path.resolve(__dirname, '..', '..');

export async function bringUp() {
  execSync(
    'docker compose -f ../../docker-compose.yml -f ../../docker-compose.test.yml up -d',
    { stdio: 'inherit', cwd: root },
  );
  await waitFor('http://localhost:3001');
  await waitFor('http://localhost:3000/status');
}

export function tearDown() {
  execSync(
    'docker compose -f ../../docker-compose.yml -f ../../docker-compose.test.yml down -v',
    { stdio: 'inherit', cwd: root },
  );
}
