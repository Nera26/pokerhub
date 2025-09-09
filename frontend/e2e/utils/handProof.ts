import { execSync } from 'child_process';
import path from 'path';
import { io } from 'socket.io-client';

export async function waitFor(url: string, timeout = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // ignore errors while waiting
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const rootDir = path.resolve(__dirname, '..', '..', '..');

export async function bringUp() {
  execSync(
    'docker compose -f docker-compose.yml -f docker-compose.test.yml up -d',
    {
      stdio: 'inherit',
      cwd: rootDir,
    },
  );
  await waitFor('http://localhost:3001');
  await waitFor('http://localhost:3000/status');
}

export function tearDown() {
  execSync(
    'docker compose -f docker-compose.yml -f docker-compose.test.yml down -v',
    {
      stdio: 'inherit',
      cwd: rootDir,
    },
  );
}

export function recordSocketEvents() {
  const socket = io('http://localhost:4000', { transports: ['websocket'] });
  const events: Record<string, any> = {};
  socket.on('hand.start', (d) => (events.start = d));
  socket.on('hand.end', (d) => (events.end = d));
  return { socket, events };
}
